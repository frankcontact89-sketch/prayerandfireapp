// Native push notifications (Capacitor). Safe no-op on the web build.
// Permission is NEVER requested at app startup: enablePush() is only called
// when the member explicitly turns Community notifications on.
import { supabase } from "@/integrations/supabase/client";

const db: any = supabase;

export const PUSH_PREF_KEY = "pf_push_enabled";
export const pushPreferred = () => localStorage.getItem(PUSH_PREF_KEY) === "1";
export const setPushPreferred = (v: boolean) => localStorage.setItem(PUSH_PREF_KEY, v ? "1" : "0");

export type PushStatus = "unsupported" | "granted" | "denied" | "error";
export type PushPermission = "granted" | "denied" | "prompt" | "unsupported" | "error";

let listenersReady = false;
let currentToken: string | null = null;

type RegistrationWaiter = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
let waiters: RegistrationWaiter[] = [];

const clearWaiter = (w: RegistrationWaiter) => {
  clearTimeout(w.timer);
  waiters = waiters.filter((x) => x !== w);
};
const settleToken = (token: string) => {
  const pending = [...waiters];
  waiters = [];
  pending.forEach((w) => {
    clearTimeout(w.timer);
    w.resolve(token);
  });
};
const settleError = (message: string) => {
  const pending = [...waiters];
  waiters = [];
  pending.forEach((w) => {
    clearTimeout(w.timer);
    w.reject(new Error(message));
  });
};

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

export async function getPushPermission(): Promise<PushPermission> {
  if (!(await pushSupported())) return "unsupported";
  try {
    const perm = await (await plugin()).checkPermissions();
    if (perm.receive === "granted") return "granted";
    if (perm.receive === "denied") return "denied";
    return "prompt";
  } catch {
    return "error";
  }
}

export async function getPushUiState(): Promise<{
  supported: boolean;
  permission: PushPermission;
  enabled: boolean;
}> {
  const supported = await pushSupported();
  if (!supported) return { supported: false, permission: "unsupported", enabled: false };
  const permission = await getPushPermission();
  return {
    supported: true,
    permission,
    enabled: permission === "granted" && pushPreferred(),
  };
}

export async function openNotificationSettings(): Promise<boolean> {
  try {
    const Capacitor = await core();
    if (!Capacitor.isNativePlatform()) return false;
    // iOS routes this scheme to the current app's Settings page.
    if (Capacitor.getPlatform() === "ios") {
      window.location.href = "app-settings:";
      return true;
    }
    return false;
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
    if (!t?.value) return;
    saveToken(t.value).finally(() => settleToken(t.value));
  });
  await PushNotifications.addListener("registrationError", (e: any) => {
    console.error("[push] registration error", e);
    settleError(e?.error || e?.message || "registration_failed");
  });
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

/**
 * Asks for permission only after explicit user intent.
 * Returns "granted" ONLY after APNs/FCM actually returns a device token.
 * A hard timeout prevents an endless "connecting" UI when APNs is unavailable.
 */
export async function enablePush(timeoutMs = 10000): Promise<PushStatus> {
  if (!(await pushSupported())) return "unsupported";
  try {
    const PushNotifications = await plugin();
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "denied") {
      setPushPreferred(false);
      return "denied";
    }
    if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      setPushPreferred(false);
      return "denied";
    }

    await attachListeners();

    const registered = new Promise<string>((resolve, reject) => {
      const waiter = {} as RegistrationWaiter;
      waiter.resolve = resolve;
      waiter.reject = reject;
      waiter.timer = setTimeout(() => {
        clearWaiter(waiter);
        reject(new Error("registration_timeout"));
      }, timeoutMs);
      waiters.push(waiter);
    });

    await PushNotifications.register();
    await registered;

    setPushPreferred(true);
    return "granted";
  } catch (e) {
    console.error("[push] enable failed", e);
    setPushPreferred(false);
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
    if (perm.receive !== "granted") {
      setPushPreferred(false);
      return;
    }
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
