import { supabase } from "@/integrations/supabase/client";
import type { AcademyAccess } from "./abbaAcademy";

/**
 * A future trusted backend must verify the Prayer & Fire JWT, map the identity
 * to an ABBA student and enforce enrollment using server-side credentials.
 * Never send an app access token to the public Academy website. Configure a dedicated, audited backend URL only after the endpoint is deployed.
 */
// The only permitted destination is the ministry-websites Supabase Edge Function.
// This prevents build-time variables from redirecting Prayer & Fire credentials
// to a third-party host. Deploy and audit the function before enabling it.
const ACADEMY_BRIDGE_HOST = "yecywtxbuhfukergbwfc.supabase.co";
const ACADEMY_BRIDGE_PATH = "/functions/v1/abba-mobile-bridge";

export function getTrustedAcademyBridgeUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.hash ||
        url.search || url.port || url.hostname !== ACADEMY_BRIDGE_HOST ||
        url.pathname !== ACADEMY_BRIDGE_PATH) return null;
    return url;
  } catch {
    return null;
  }
}

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const str = (value: unknown): value is string => typeof value === "string";
const nullableStr = (value: unknown): value is string | null => value === null || str(value);
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const nonnegative = (value: unknown): value is number => number(value) && value >= 0;
const positiveInteger = (value: unknown): value is number => number(value) && Number.isInteger(value) && value > 0;
const nonempty = (value: unknown): value is string => str(value) && value.trim().length > 0;
const course = (value: unknown): boolean => object(value) &&
  nonempty(value.id) && nonempty(value.slug) && nonempty(value.title) &&
  nullableStr(value.description) && nonnegative(value.total_lessons) && Number.isInteger(value.total_lessons);
const lesson = (value: unknown): boolean => object(value) &&
  nonempty(value.id) && nonempty(value.course_id) && positiveInteger(value.lesson_number) &&
  nonempty(value.title) && nullableStr(value.description) &&
  (value.duration_minutes === null || nonnegative(value.duration_minutes)) &&
  nullableStr(value.summary) && "videos" in value && "attachments" in value;
const progress = (value: unknown): boolean => object(value) &&
  nonempty(value.lesson_id) && typeof value.completed === "boolean" &&
  nonnegative(value.watched_seconds) && nonnegative(value.last_position_seconds) &&
  nullableStr(value.completed_at);

/** Validate untrusted JSON before exposing it to the native UI. */
export function parseAcademyAccess(body: unknown): AcademyAccess {
  if (!object(body) || !Array.isArray(body.courses) || !body.courses.every(course)) {
    return { status: "unavailable" };
  }
  // Validate the public catalog as strictly as the enrolled catalog.
  // Duplicate course IDs or slugs can otherwise create ambiguous navigation.
  const publicCourseIds = new Set((body.courses as Array<{ id: string }>).map((item) => item.id));
  const publicCourseSlugs = new Set((body.courses as Array<{ slug: string }>).map((item) => item.slug));
  if (publicCourseIds.size !== body.courses.length ||
      publicCourseSlugs.size !== body.courses.length) return { status: "unavailable" };
  if (body.status === "link_required") {
    return { status: "link_required", courses: body.courses as Extract<AcademyAccess, { status: "link_required" }>["courses"] };
  }
  if (body.status === "not_enrolled") {
    return { status: "not_enrolled", courses: body.courses as Extract<AcademyAccess, { status: "not_enrolled" }>["courses"] };
  }
  if (body.status !== "enrolled" || !Array.isArray(body.lessons) ||
      !Array.isArray(body.progress) || !body.lessons.every(lesson) ||
      !body.progress.every(progress)) return { status: "unavailable" };
  const courseIds = publicCourseIds;
  if ((body.lessons as Array<{ course_id: string }>).some((item) => !courseIds.has(item.course_id))) {
    return { status: "unavailable" };
  }
  // A course cannot contain two lessons with the same sequence number.
  // Duplicate ordering would make Previous/Next navigation ambiguous.
  const lessonPositions = new Set(
    (body.lessons as Array<{ course_id: string; lesson_number: number }>).
      map((item) => JSON.stringify([item.course_id, item.lesson_number])),
  );
  if (lessonPositions.size !== body.lessons.length) return { status: "unavailable" };
  const lessonIds = new Set((body.lessons as Array<{ id: string }>).map((item) => item.id));
  if (lessonIds.size !== body.lessons.length) return { status: "unavailable" };
  const progressIds = new Set((body.progress as Array<{ lesson_id: string }>).map((item) => item.lesson_id));
  if (progressIds.size !== body.progress.length) return { status: "unavailable" };
  if ((body.progress as Array<{ lesson_id: string }>).some((item) => !lessonIds.has(item.lesson_id))) {
    return { status: "unavailable" };
  }
  return {
    status: "enrolled",
    courses: body.courses as Extract<AcademyAccess, { status: "enrolled" }>["courses"],
    lessons: body.lessons as Extract<AcademyAccess, { status: "enrolled" }>["lessons"],
    progress: body.progress as Extract<AcademyAccess, { status: "enrolled" }>["progress"],
  };
}

export async function loadAcademyAccess(signal?: AbortSignal): Promise<AcademyAccess> {
  // The audited Academy bridge is deployed on the ministry-websites Supabase project.
  // Keep the destination fixed so Prayer & Fire credentials cannot be redirected
  // by build-time variables to another host.
  const url = getTrustedAcademyBridgeUrl(
    "https://yecywtxbuhfukergbwfc.supabase.co/functions/v1/abba-mobile-bridge",
  );
  if (!url) return { status: "unavailable" };

  if (signal?.aborted) return { status: "unavailable" };
  const { data: { session }, error } = await supabase.auth.getSession();
  // An account switch may abort the request while getSession is resolving.
  // Never send credentials after cancellation.
  if (signal?.aborted || error || !session?.access_token) return { status: "unavailable" };

  // A stalled connection must not leave the Academy loading indefinitely.
  // Forward caller cancellation and cap network requests at 15 seconds.
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15_000);
  if (signal?.aborted) controller.abort();

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return { status: "unavailable" };
    const body: unknown = await response.json();
    return parseAcademyAccess(body);
  } catch {
    // Network, parsing and aborted requests must not bypass enrollment.
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
  return { status: "unavailable" };
}

/** Mark a currently authorized lesson as complete through the audited bridge.
 * Enrollment, course release and identity mapping are rechecked server-side.
 */
export async function completeAcademyLesson(lessonId: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) return false;
  const url = getTrustedAcademyBridgeUrl(
    "https://yecywtxbuhfukergbwfc.supabase.co/functions/v1/abba-mobile-bridge",
  );
  if (!url) return false;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) return false;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "complete_lesson", lesson_id: lessonId }),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return object(body) && body.saved === true && body.lesson_id === lessonId;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export type AcademyLessonContent = {
  lesson_id: string;
  playback_id: string | null;
  extra_videos: Array<{ name: string; playback_id: string }>;
  resources: Array<{ name: string; type: string; url: string }>;
};

/** Requests lesson-specific media only after server-side enrollment validation. */
export async function getAcademyLessonContent(lessonId: string, signal?: AbortSignal): Promise<AcademyLessonContent | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)) return null;
  const url = getTrustedAcademyBridgeUrl(
    "https://yecywtxbuhfukergbwfc.supabase.co/functions/v1/abba-mobile-bridge",
  );
  if (!url || signal?.aborted) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token || signal?.aborted) return null;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 15000);
  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ action: "lesson_content", lesson_id: lessonId }),
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!object(body) || body.lesson_id !== lessonId ||
        !Array.isArray(body.extra_videos) || !Array.isArray(body.resources)) return null;
    const validPlayback = (value: unknown): value is string =>
      typeof value === "string" && /^[A-Za-z0-9_-]{8,160}$/.test(value);
    if (body.playback_id !== null && !validPlayback(body.playback_id)) return null;
    if (!body.extra_videos.every((v: unknown) => object(v) && typeof v.name === "string" && validPlayback(v.playback_id))) return null;
    const safeStorage = (raw: unknown): boolean => {
      if (typeof raw !== "string") return false;
      try {
        const parsed = new URL(raw);
        return parsed.protocol === "https:" && parsed.hostname === "yecywtxbuhfukergbwfc.supabase.co" &&
          parsed.pathname.startsWith("/storage/v1/object/sign/abba-course-files/");
      } catch { return false; }
    };
    if (!body.resources.every((v: unknown) => object(v) && typeof v.name === "string" &&
      typeof v.type === "string" && safeStorage(v.url))) return null;
    return body as AcademyLessonContent;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
