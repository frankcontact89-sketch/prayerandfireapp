import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const APP_AUTH_URL = "https://xikmhnulxksadgvzajdk.supabase.co";
const APP_PUBLISHABLE_KEY = "sb_publishable_tuOqa-o2MpSBjQHvbi3NEw_RghmA9tN";
const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost", "http://localhost", "https://localhost",
  "https://prayerandfire.org", "https://www.prayerandfire.org"
]);
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://prayerandfire.org",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin",
  "Content-Type": "application/json"
});
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = cors(origin);
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers });
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const bearer = req.headers.get("authorization") ?? "";
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(bearer) || bearer.length > 8192) return json({ error: "Unauthorized" }, 401);
  const token = bearer.substring(7);
  try {
    const appAuth = createClient(APP_AUTH_URL, APP_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    // Verify the token against the actual Prayer & Fire Auth server, not this project's JWT secret.
    const { data: { user }, error: userError } = await appAuth.auth.getUser(token);
    if (userError || !user || user.is_anonymous) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: catalog, error: coursesError } = await admin.from("abba_courses")
      .select("id,slug,title,description,total_lessons").eq("is_published", true).order("created_at");
    if (coursesError) throw coursesError;
    const courses = catalog ?? [];
    const { data: link, error: linkError } = await admin.from("abba_mobile_identity_links")
      .select("academy_user_id").eq("prayer_fire_user_id", user.id).is("revoked_at", null).maybeSingle();
    if (linkError) throw linkError;
    if (!link) return json({ status: "link_required", courses });

    const { data: enrollment, error: enrollmentError } = await admin.from("abba_enrollments")
      .select("course_id,expires_at").eq("user_id", link.academy_user_id).eq("status", "active");
    if (enrollmentError) throw enrollmentError;
    const now = Date.now();
    const enrolledIds = new Set((enrollment ?? [])
      .filter(e => !e.expires_at || Date.parse(e.expires_at) > now).map(e => e.course_id));
    const entitledCourses = courses.filter(c => enrolledIds.has(c.id));
    if (!entitledCourses.length) {
      if (!enrolledIds.size) return json({ status: "not_enrolled", courses });
      // An active enrollment can exist before the course is published. Keep draft content private.
      if (req.method === "GET") return json({ status: "enrolled", courses: [], lessons: [], progress: [] });
      return json({ error: "Lesson not available" }, 403);
    }
    if (req.method === "POST") {
      let body: unknown;
      try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request" }, 400);
      const data = body as Record<string, unknown>;
      if (!["complete_lesson", "lesson_content", "save_position"].includes(String(data.action)) || typeof data.lesson_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.lesson_id)) {
        return json({ error: "Invalid request" }, 400);
      }
      const { data: lesson, error: requestedError } = await admin.from("abba_lessons")
        .select("id,course_id,lesson_number,is_published,release_at,mux_playback_id,videos,attachments")
        .eq("id", data.lesson_id).maybeSingle();
      if (requestedError) throw requestedError;
      const parent = entitledCourses.find(c => c.id === lesson?.course_id);
      if (!lesson || !lesson.is_published || !parent ||
        lesson.lesson_number > parent.total_lessons ||
        (lesson.release_at && Date.parse(lesson.release_at) > now)) {
        return json({ error: "Lesson unavailable" }, 403);
      }
      if (data.action === "lesson_content") {
        // Asset URLs are issued only after a fresh enrollment check.
        const safePlaybackId = (value: unknown) =>
          typeof value === "string" && /^[A-Za-z0-9_-]{8,160}$/.test(value) ? value : null;
        const extraVideos = (Array.isArray(lesson.videos) ? lesson.videos : [])
          .filter((v: any) => v && typeof v === "object" && !v.hidden && !v.removed_at)
          .slice(0, 10).map((v: any) => ({
            name: typeof v.name === "string" ? v.name.substring(0, 120) : "Video",
            playback_id: safePlaybackId(v.playback_id),
          })).filter((v: any) => v.playback_id);
        const resources: Array<{ name: string, type: string, url: string }> = [];
        for (const item of (Array.isArray(lesson.attachments) ? lesson.attachments : []).slice(0, 25)) {
          if (!item || typeof item !== "object" || item.hidden || item.removed_at) continue;
          const path = typeof item.path === "string" ? item.path : "";
          if (!path || path.length > 1024) continue;
          const { data: signed, error: signError } = await admin.storage
            .from("abba-course-files").createSignedUrl(path, 1800);
          if (signError || !signed?.signedUrl) continue;
          resources.push({
            name: typeof item.name === "string" ? item.name.substring(0, 120) : "Resource",
            type: typeof item.type === "string" ? item.type.substring(0, 40) : "file",
            url: signed.signedUrl,
          });
        }
        return json({
          lesson_id: lesson.id,
          playback_id: safePlaybackId(lesson.mux_playback_id),
          extra_videos: extraVideos,
          resources,
        });
      }
      const { data: previous, error: previousError } = await admin.from("abba_lesson_progress")
        .select("watched_seconds,last_position_seconds,completed,completed_at")
        .eq("user_id", link.academy_user_id).eq("lesson_id", lesson.id).maybeSingle();
      if (previousError) throw previousError;
      const savingPosition = data.action === "save_position";
      const incomingPosition = data.position_seconds;
      if (savingPosition && (typeof incomingPosition !== "number" || !Number.isFinite(incomingPosition) ||
          !Number.isInteger(incomingPosition) || incomingPosition < 0 || incomingPosition > 86400)) {
        return json({ error: "Invalid playback position" }, 400);
      }
      const { error: saveError } = await admin.from("abba_lesson_progress").upsert({
        user_id: link.academy_user_id,
        lesson_id: lesson.id,
        completed: savingPosition ? (previous?.completed ?? false) : true,
        completed_at: savingPosition ? (previous?.completed_at ?? null) : (previous?.completed_at ?? new Date().toISOString()),
        watched_seconds: previous?.watched_seconds ?? 0, // Seeking is not evidence of watched duration.
        last_position_seconds: savingPosition ? incomingPosition as number : (previous?.last_position_seconds ?? 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });
      if (saveError) throw saveError;
      return json({ saved: true, lesson_id: lesson.id });
    }

    const { data: lessonRows, error: lessonError } = await admin.from("abba_lessons")
      .select("id,course_id,lesson_number,title,description,duration_minutes,summary,videos,attachments,release_at,is_published")
      .in("course_id", entitledCourses.map(c => c.id)).eq("is_published", true).order("lesson_number");
    if (lessonError) throw lessonError;
    // NEVER send private media paths, signed URLs or playback IDs through the catalog.
    const limits = new Map(entitledCourses.map(c => [c.id, c.total_lessons]));
    const lessons = (lessonRows ?? []).filter(l =>
      l.lesson_number <= (limits.get(l.course_id) ?? 0) &&
      (!l.release_at || Date.parse(l.release_at) <= now))
      .map(({ id, course_id, lesson_number, title, description, duration_minutes, summary }) =>
        ({ id, course_id, lesson_number, title, description, duration_minutes, summary, videos: [], attachments: [] }));
    const lessonIds = lessons.map(l => l.id);
    let progress: unknown[] = [];
    if (lessonIds.length) {
      const { data: rows, error: progressError } = await admin.from("abba_lesson_progress")
        .select("lesson_id,completed,watched_seconds,last_position_seconds,completed_at")
        .eq("user_id", link.academy_user_id).in("lesson_id", lessonIds);
      if (progressError) throw progressError;
      progress = rows ?? [];
    }
    return json({ status: "enrolled", courses: entitledCourses, lessons, progress });
  } catch (error) {
    console.error("ABBA mobile bridge failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Academy service unavailable" }, 503);
  }
});