import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function purgeBucket(admin: any, bucket: string, prefix: string) {
  const paths: string[] = [];
  const walk = async (dir: string, depth = 0) => {
    if (depth > 4) return;
    const { data } = await admin.storage.from(bucket).list(dir, { limit: 1000 });
    for (const item of data ?? []) {
      const full = dir ? `${dir}/${item.name}` : item.name;
      if (item.id) paths.push(full);
      else await walk(full, depth + 1);
    }
  };
  await walk(prefix);
  if (paths.length) await admin.storage.from(bucket).remove(paths);
  return paths.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "UNAUTHORIZED" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // The user id ALWAYS comes from the verified token, never from the request body.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "UNAUTHORIZED" }, 401);
  const uid = user.id;

  try {
    // Own community UGC
    const { data: myMsgs } = await admin
      .from("community_messages")
      .select("id")
      .eq("sender_id", uid);
    const msgIds = (myMsgs ?? []).map((m: any) => m.id);

    await admin.from("community_reactions").delete().eq("user_id", uid);
    await admin.from("community_message_reads").delete().eq("user_id", uid);
    if (msgIds.length) {
      await admin.from("community_reactions").delete().in("message_id", msgIds);
      await admin.from("community_message_reads").delete().in("message_id", msgIds);
      await admin.from("community_messages").update({ reply_to: null }).in("reply_to", msgIds);
      await admin.from("community_reports").update({ message_id: null }).in("message_id", msgIds);
    }
    await admin.from("community_messages").delete().eq("sender_id", uid);

    await admin.from("community_blocks").delete().eq("blocker_id", uid);
    await admin.from("community_blocks").delete().eq("blocked_id", uid);
    await admin.from("community_group_members").delete().eq("user_id", uid);
    await admin.from("community_access_requests").delete().eq("user_id", uid);
    await admin.from("community_admins").delete().eq("user_id", uid);

    // Reports: the ones this member filed are deleted. Reports filed ABOUT this
    // member are anonymised (reported_user_id cleared) and kept for a limited
    // safety/audit trail, as documented in the Legal Center.
    await admin.from("community_reports").delete().eq("reporter_id", uid);
    await admin.from("community_reports")
      .update({ reported_user_id: null, action: "reported_account_deleted" })
      .eq("reported_user_id", uid);

    // App data
    await admin.from("messages").delete().eq("user_id", uid);
    await admin.from("notifications").delete().eq("user_id", uid);
    await admin.from("event_rsvps").delete().eq("user_id", uid);
    await admin.from("favorites").delete().eq("user_id", uid);
    await admin.from("user_notes").delete().eq("user_id", uid);
    await admin.from("reading_plan_progress").delete().eq("user_id", uid);
    await admin.from("purchases").delete().eq("user_id", uid);
    await admin.from("submissions").update({ user_id: null }).eq("user_id", uid);
    await admin.from("user_roles").delete().eq("user_id", uid);

    // Storage owned by the user
    await purgeBucket(admin, "community-media", uid);
    await purgeBucket(admin, "avatars", uid);

    await admin.from("profiles").delete().eq("id", uid);

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ success: true });
  } catch (e) {
    console.error("delete-account failed", e);
    return json({ error: (e as Error)?.message ?? "DELETE_FAILED" }, 500);
  }
});
