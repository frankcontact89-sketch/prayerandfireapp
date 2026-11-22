import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import VoiceRoom from "./VoiceRoom";

import { CallContext, type Call } from "./usePrayerCall";

export default function PrayerCallProvider({ children }: { children: ReactNode }) {
  const [call, setCall] = useState<Call | null>(null);
  const [minimized, setMinimized] = useState(false);
  const channelClosed = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setCall(null);
      else if (session) setCall(current => current?.userId === session.user.id ? current : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const openCall = useCallback((next: Call) => {
    setCall(current => current ?? next);
    setMinimized(false);
  }, []);
  return <CallContext.Provider value={{ activeRoomId: call?.groupId, openCall, channelClosed }}>
    {children}
    {call && <VoiceRoom {...call} channelClosed={channelClosed} minimized={minimized}
      onMinimize={() => setMinimized(true)} onRestore={() => setMinimized(false)} onClose={() => setCall(null)} />}
  </CallContext.Provider>;
}
