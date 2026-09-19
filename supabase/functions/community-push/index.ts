// Server-side push dispatch for Prayer & Fire Community.
// Credentials (APNs key / FCM key) live ONLY in server secrets.
// Recipients are computed server-side and already exclude: the sender,
// people not in the group, muted members (including timed mutes) and
// blocked relationships (see public.community_push_targets).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID");
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID");
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY");
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "com.frankcontact89.prayerandfiremobile";
const APNS_HOST = (Deno.env.get("APNS_ENV") ?? "production") === "sandbox"
  ? "https://api.sandbox.push.apple.com"
  : "https://api.push.apple.com";
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");

const apnsConfigured = !!(APNS_KEY_ID && APNS_TEAM_ID && APNS_PRIVATE_KEY);

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedJwt: { token: string; at: number } | null = null;

async function apnsJwt(): Promise<string> {
  if (cachedJwt && Date.now() - cachedJwt.at < 45 * 60 * 1000) return cachedJwt.token;
  const pem = (APNS_PRIVATE_KEY ?? "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", raw, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })));
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${header}.${payload}`)),
  );
  const token = `${header}.${payload}.${b64url(sig)}`;
  cachedJwt = { token, at: Date.now() };
  return token;
}

async function sendApns(deviceToken: string, title: string, body: string, data: Record<string, string>) {
  const jwt = await apnsJwt();
  const res = await fetch(`${APNS_HOST}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default", badge: 1 }, ...data }),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
}

async function sendFcm(deviceToken: string, title: string, body: string, data: Record<string, string>) {
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: { authorization: `key=${FCM_SERVER_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ to: deviceToken, notification: { title, body }, data }),
  });
  return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "UNAUTHORIZED" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "UNAUTHORIZED" }, 401);

  let payload: any = {};
  try { payload = await req.json(); } catch { /* empty body */ }

  const kind: string = ["message", "pinned", "invite"].includes(payload?.kind) ? payload.kind : "message";
  const messageId: string | undefined = payload?.message_id;
  const groupId: string | undefined = payload?.group_id;
  const inviteUserIds: string[] = Array.isArray(payload?.user_ids) ? payload.user_ids.slice(0, 200) : [];

  let recipients: string[] = [];
  let title = "Prayer & Fire";
  let bodyText = "";
  let deepLink: Record<string, string> = {};

  if (kind === "invite") {
    if (!groupId || !inviteUserIds.length) return json({ error: "BAD_REQUEST" }, 400);
    // Only group leaders may trigger invite pushes.
    const { data: isAdmin } = await admin.rpc("is_group_admin", { _group_id: groupId, _user_id: user.id });
    if (!isAdmin) return json({ error: "NO_PERMISSION" }, 403);
    const { data: memberRows } = await admin
      .from("community_group_members").select("user_id").eq("group_id", groupId).in("user_id", inviteUserIds);
    recipients = (memberRows ?? []).map((r: any) => r.user_id).filter((id: string) => id !== user.id);
    const { data: g } = await admin.from("community_groups").select("name").eq("id", groupId).maybeSingle();
    title = g?.name ?? "Prayer & Fire";
    bodyText = "You were added to this group";
    deepLink = { group_id: groupId };
  } else {
    if (!messageId) return json({ error: "BAD_REQUEST" }, 400);
    const { data: msg } = await admin
      .from("community_messages")
      .select("id, group_id, sender_id, body, media_type, deleted_at")
      .eq("id", messageId)
      .maybeSingle();
    if (!msg || msg.deleted_at) return json({ error: "NOT_FOUND" }, 404);

    if (kind === "message") {
      if (msg.sender_id !== user.id) return json({ error: "NO_PERMISSION" }, 403);
    } else {
      const { data: isAdmin } = await admin.rpc("is_group_admin", { _group_id: msg.group_id, _user_id: user.id });
      if (!isAdmin) return json({ error: "NO_PERMISSION" }, 403);
    }

    const { data: targets } = await admin.rpc("community_push_targets", { _message_id: msg.id });
    recipients = (targets ?? []).map((r: any) => r.user_id);

    const { data: g } = await admin.from("community_groups").select("name").eq("id", msg.group_id).maybeSingle();
    const { data: sender } = await admin.from("profiles").select("username, email").eq("id", msg.sender_id).maybeSingle();
    const senderName = sender?.username || sender?.email?.split("@")[0] || "Member";
    const preview = msg.body?.slice(0, 140) || (msg.media_type ? "Sent an attachment" : "");
    title = g?.name ?? "Prayer & Fire";
    bodyText = kind === "pinned" ? `📌 ${senderName}: ${preview}` : `${senderName}: ${preview}`;
    deepLink = { group_id: msg.group_id, message_id: msg.id };

    // @mentions get their own headline for the people named in the message.
    if (kind === "message" && msg.body?.includes("@")) {
      const mentioned = new Set(
        (msg.body.match(/@([\p{L}\w.]+)/gu) ?? []).map((m: string) => m.slice(1).toLowerCase()),
      );
      if (mentioned.size && recipients.length) {
        const { data: profs } = await admin.from("profiles").select("id, username, email").in("id", recipients);
        const mentionedIds = (profs ?? [])
          .filter((p: any) => {
            const handle = (p.username || p.email?.split("@")[0] || "").replace(/\s+/g, "").toLowerCase();
            return handle && mentioned.has(handle);
          })
          .map((p: any) => p.id);
        if (mentionedIds.length) {
          (deepLink as any).mentions = mentionedIds.join(",");
        }
      }
    }
  }

  if (!recipients.length) return json({ configured: apnsConfigured, recipients: 0, dispatched: 0 });

  const { data: tokens } = await admin
    .from("user_push_tokens")
    .select("token, platform, user_id")
    .in("user_id", recipients)
    .eq("enabled", true);

  const list = tokens ?? [];
  if (!apnsConfigured && !FCM_SERVER_KEY) {
    return json({
      configured: false,
      recipients: recipients.length,
      devices: list.length,
      dispatched: 0,
      reason: "PUSH_CREDENTIALS_MISSING",
      required_secrets: ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID (optional)", "APNS_ENV (optional)"],
    });
  }

  let dispatched = 0;
  const failures: string[] = [];
  for (const row of list as any[]) {
    try {
      const isApple = (row.platform ?? "ios") === "ios";
      if (isApple && !apnsConfigured) continue;
      if (!isApple && !FCM_SERVER_KEY) continue;
      const res = isApple
        ? await sendApns(row.token, title, bodyText, deepLink)
        : await sendFcm(row.token, title, bodyText, deepLink);
      if (res.ok) dispatched++;
      else {
        failures.push(`${res.status}`);
        // Apple/Google told us this device is gone → stop using it.
        if (res.status === 410 || /BadDeviceToken|Unregistered|NotRegistered/i.test(res.text)) {
          await admin.from("user_push_tokens").update({ enabled: false }).eq("token", row.token);
        }
      }
    } catch (e) {
      failures.push((e as Error)?.message ?? "send_failed");
    }
  }

  return json({ configured: apnsConfigured, recipients: recipients.length, devices: list.length, dispatched, failures });
});
