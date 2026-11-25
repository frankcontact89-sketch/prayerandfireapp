import { createContext, useContext, type MutableRefObject } from "react";

export type Call = { groupId: string; name: string; userId: string; userName: string; userAvatar?: string | null; language: string; notifyOnStart?: boolean; inviteUserIds?: string[]; inviteGroupIds?: string[] | null };
export const CallContext = createContext<{
  setMinimizedCallHost: (node: HTMLDivElement | null) => void;
  activeRoomId?: string;
  connectedRoomId?: string;
  openCall: (call: Call, startMinimized?: boolean) => void;
  channelClosed: MutableRefObject<Promise<unknown>>;
} | null>(null);

export function usePrayerCall() {
  const context = useContext(CallContext);
  if (!context) throw new Error("PrayerCallProvider is required");
  return context;
}

