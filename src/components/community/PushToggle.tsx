import React, { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { enablePush, disablePush, pushPreferred, pushSupported } from "@/lib/push";

type Lang = "en" | "es" | "pt";

export default function PushToggle({ lang = "en" as Lang }: { lang?: Lang }) {
  const L = (en: string, es: string, pt: string) => (lang === "es" ? es : lang === "pt" ? pt : en);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [on, setOn] = useState(pushPreferred());
  const [note, setNote] = useState("");

  useEffect(() => { pushSupported().then(setSupported); }, []);

  const change = async (v: boolean) => {
    setNote("");
    if (!v) {
      setOn(false);
      await disablePush();
      setNote(L("Notifications off on this device", "Notificaciones desactivadas en este dispositivo", "Notificações desativadas neste dispositivo"));
      return;
    }
    const status = await enablePush();
    setOn(status === "granted");
    setNote(
      status === "granted"
        ? L("Notifications on for this device", "Notificaciones activadas en este dispositivo", "Notificações ativadas neste dispositivo")
        : status === "denied"
          ? L("Allow notifications for Prayer & Fire in your phone settings.", "Permite las notificaciones de Prayer & Fire en los ajustes del teléfono.", "Permita as notificações do Prayer & Fire nas configurações do telefone.")
          : status === "unsupported"
            ? L("Available in the Prayer & Fire phone app.", "Disponible en la app de Prayer & Fire para teléfono.", "Disponível no aplicativo Prayer & Fire para celular.")
            : L("Could not complete the action", "No se pudo completar la acción", "Não foi possível concluir a ação"),
    );
  };

  return (
    <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden">
      <div className="px-4 py-4 flex items-center gap-3">
        {on ? <Bell className="w-5 h-5 text-orange-400" /> : <BellOff className="w-5 h-5 text-zinc-500" />}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">
            {L("Notifications on this device", "Notificaciones en este dispositivo", "Notificações neste dispositivo")}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {L(
              "Get alerts for new Community messages, mentions and announcements.",
              "Recibe avisos de mensajes, menciones y anuncios de la Comunidad.",
              "Receba avisos de mensagens, menções e anúncios da Comunidade.",
            )}
          </p>
        </div>
        <Switch checked={on} onCheckedChange={change} disabled={supported === false && !on} />
      </div>
      {note && <div className="px-4 pb-3 text-xs text-orange-300">{note}</div>}
      {supported === false && (
        <div className="px-4 pb-3 text-xs text-zinc-500">
          {L(
            "Phone notifications work in the installed Prayer & Fire app.",
            "Las notificaciones funcionan en la app instalada de Prayer & Fire.",
            "As notificações funcionam no aplicativo instalado do Prayer & Fire.",
          )}
        </div>
      )}
    </div>
  );
}
