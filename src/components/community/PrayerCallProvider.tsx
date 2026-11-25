import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import VoiceRoom from "./VoiceRoom";

import { CallContext, type Call } from "./usePrayerCall";

export default function PrayerCallProvider({ children }: { children: ReactNode }) {
  const [call, setCall] = useState<Call | null>(null);
  const [connectedRoomId, setConnectedRoomId] = useState<string>();
  const [pending, setPending] = useState<Call | null>(null);
  const [minimizedCallHost, setMinimizedCallHost] = useState<HTMLDivElement | null>(null);
  const [minimized, setMinimized] = useState(false);
  const channelClosed = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { setCall(null); setPending(null); }
      else if (session) setCall(current => current?.userId === session.user.id ? current : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const openCall = useCallback((next: Call, startMinimized = false) => {
    if (call && call.groupId !== next.groupId) {
      setPending(next);
      return;
    }
    if (!call) setCall(next);
    setMinimized(startMinimized);
  }, [call]);
  const t = (en: string, es: string, pt: string) => pending?.language === "es" ? es : pending?.language === "pt" ? pt : en;
  return <CallContext.Provider value={{ activeRoomId: call?.groupId, connectedRoomId: call?.groupId === connectedRoomId ? connectedRoomId : undefined, openCall, channelClosed, setMinimizedCallHost }}>
    {children}
    {call && <VoiceRoom key={call.groupId} {...call} channelClosed={channelClosed} minimized={minimized} minimizedCallHost={minimizedCallHost} onConnectedRoomChange={setConnectedRoomId}
      onMinimize={() => setMinimized(true)} onRestore={() => setMinimized(false)} onClose={() => setCall(null)} />}
    <AlertDialog open={!!pending} onOpenChange={open => { if (!open) setPending(null); }}>
      <AlertDialogContent className="z-[190]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Switch prayer rooms?", "¿Cambiar de sala de oración?", "Mudar de sala de oração?")}</AlertDialogTitle>
          <AlertDialogDescription>{t(
            `You will leave ${call?.name ?? ""} and join ${pending?.name ?? ""} with your microphone muted.`,
            `Saldrás de ${call?.name ?? ""} y entrarás en ${pending?.name ?? ""} con el micrófono silenciado.`,
            `Você sairá de ${call?.name ?? ""} e entrará em ${pending?.name ?? ""} com o microfone silenciado.`,
          )}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Stay here", "Quedarme", "Permanecer")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => { if (pending) setCall(pending); setPending(null); setMinimized(false); }}>
            {t("Switch rooms", "Cambiar de sala", "Mudar de sala")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </CallContext.Provider>;
}
