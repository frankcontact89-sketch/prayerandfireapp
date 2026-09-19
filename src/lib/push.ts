// Native push notifications (Capacitor). Safe no-op on the web build.
// Permission is NEVER requested at app startup: enablePush() is only called
// when the member opens Community or turns notifications on in Settings.
import { supabase } from "@/integrations/supabase/client";

const db: any = supabase;

export const PUSH_PREF_KEY = "pf_push_enabled";
export const pushPreferred = () => localStorage.getItem(PUSH_PREF_KEY) === "1";
export const setPushPreferred = (v: boolean) => localStorage.setItem(PUSH_PREF_KEY, v ? "1" : "0");

export type PushStatus = "unsupported" | "granted" | "denied" | "error";

let listenersReady = false;
let currentToken: string | null = null;

// Resolved when APNs/FCM actually hands us a device token (or reports an error).
type RegistrationWaiter = { resolve: (token: string) => void; reject: (err: Error) => void };
let waiters: RegistrationWaiter[] = [];
const settleToken = (token: string) => { waiters.forEach((w) => w.resolve(token)); waiters = []; };
const settleError = (message: string) => { waiters.forEach((w) => w.reject(new Error(message))); waiters = []; };

const core = async () => (await import("@capacitor/core")).Capacitor;
const plugin = async () => (await import("@capacitor/push-notifications")).PushNotifications;

export async function pushSupported(): Promise<boolean> {
  try {
    const Capacitor = await core();
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
  } catch {
    return false;
  }
}

async function platformName(): Promise<string> {
  try {
    return (await core()).getPlatform();
  } catch {
    return "web";
  }
}

async function saveToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  currentToken = token;
  await db.from("user_push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform: await platformName(),
      enabled: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
}

/** Real device acknowledgement: only called when this device actually got the message. */
export async function ackDelivered(messageIds: string[]) {
  const ids = messageIds.filter(Boolean);
  if (!ids.length) return;
  try {
    await db.rpc("ack_message_delivery", { _message_ids: ids });
  } catch {
    /* offline — the next chat load acknowledges again */
  }
}

function openFromNotification(data: any) {
  const groupId = data?.group_id || data?.groupId;
  const messageId = data?.message_id || data?.messageId;
  if (!groupId) return;
  const detail = { groupId, messageId };
  try {
    sessionStorage.setItem("pf_push_open", JSON.stringify(detail));
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("pf-push-open", { detail }));
  if (!window.location.pathname.startsWith("/community")) {
    const q = new URLSearchParams({ group: groupId, ...(messageId ? { message: messageId } : {}) });
    window.location.assign(`/community?${q.toString()}`);
  }
}

async function attachListeners() {
  if (listenersReady) return;
  const PushNotifications = await plugin();
  listenersReady = true;

  await PushNotifications.addListener("registration", (t: any) => {
    if (t?.value) saveToken(t.value);
  });
  await PushNotifications.addListener("registrationError", (e: any) => {
    console.error("[push] registration error", e);
  });
  // Arrived on this device → this is a genuine delivery acknowledgement.
  await PushNotifications.addListener("pushNotificationReceived", (n: any) => {
    const id = n?.data?.message_id || n?.data?.messageId;
    if (id) ackDelivered([id]);
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (a: any) => {
    const data = a?.notification?.data || {};
    const id = data.message_id || data.messageId;
    if (id) ackDelivered([id]);
    openFromNotification(data);
  });
}

/** Asks for permission (only on explicit user intent) and registers the device. */
export async function enablePush(): Promise<PushStatus> {
  if (!(await pushSupported())) return "unsupported";
  try {
    const PushNotifications = await plugin();
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      setPushPreferred(false);
      return "denied";
    }
    await attachListeners();
    await PushNotifications.register();
    setPushPreferred(true);
    return "granted";
  } catch (e) {
    console.error("[push] enable failed", e);
    return "error";
  }
}

/** Turns notifications off for this device only; other devices keep working. */
export async function disablePush() {
  setPushPreferred(false);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const q = db.from("user_push_tokens").update({ enabled: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  await (currentToken ? q.eq("token", currentToken) : q);
  try {
    const PushNotifications = await plugin();
    await PushNotifications.removeAllListeners();
    listenersReady = false;
  } catch { /* ignore */ }
}

/** Re-registers silently when the member already opted in (no permission prompt). */
export async function resumePush() {
  if (!pushPreferred()) return;
  if (!(await pushSupported())) return;
  try {
    const PushNotifications = await plugin();
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") return;
    await attachListeners();
    await PushNotifications.register();
  } catch { /* ignore */ }
}

/** Reads a pending deep-link stored by a notification tap. */
export function takePushOpen(): { groupId: string; messageId?: string } | null {
  try {
    const raw = sessionStorage.getItem("pf_push_open");
    if (!raw) return null;
    sessionStorage.removeItem("pf_push_open");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
