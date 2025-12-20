// Persisted last-read timestamp for notification badge logic.
// Badge should only appear when a broadcast notification is created after this timestamp.

export const PF_LAST_READ_AT_KEY = "pf_notifications_last_read_at";

export const getLastReadAtMs = (): number => {
  const raw = localStorage.getItem(PF_LAST_READ_AT_KEY);
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
};

export const getLastReadAtISO = (): string | null => {
  return localStorage.getItem(PF_LAST_READ_AT_KEY);
};

export const setLastReadAtNow = () => {
  localStorage.setItem(PF_LAST_READ_AT_KEY, new Date().toISOString());
};

// Backwards compat aliases
export const getLastSeenNotificationsAtMs = getLastReadAtMs;
export const setLastSeenNotificationsAtNow = setLastReadAtNow;
