// Persisted last-seen timestamp for notification badge logic.
// Badge should only appear when a notification is created after this timestamp.

export const PF_LAST_SEEN_NOTIFICATIONS_AT_KEY = "pf_lastSeenNotificationsAt";

export const getLastSeenNotificationsAtMs = () => {
  const raw = localStorage.getItem(PF_LAST_SEEN_NOTIFICATIONS_AT_KEY);
  const ms = raw ? Date.parse(raw) : 0;
  return Number.isFinite(ms) ? ms : 0;
};

export const setLastSeenNotificationsAtNow = () => {
  localStorage.setItem(PF_LAST_SEEN_NOTIFICATIONS_AT_KEY, new Date().toISOString());
};
