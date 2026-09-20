import React, { useEffect, useState } from "react";
import { Bell, BellOff, ExternalLink, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  disablePush,
  enablePush,
  getPushUiState,
  openNotificationSettings,
  type PushPermission,
} from "@/lib/push";

type Lang = "en" | "es" | "pt";

export default function PushToggle({ lang = "en" as Lang }: { lang?: Lang }) {
  const L = (en: string, es: string, pt: string) => (lang === "es" ? es : lang === "pt" ? pt : en);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<PushPermission>("prompt");
  const [on, setOn] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const refreshState = async () => {
    const state = await getPushUiState();
    setSupported(state.supported);
    setPermission(state.permission);
    setOn(state.enabled);
    return state;
  };

  useEffect(() => {
    refreshState();
  }, []);

  const change = async (v: boolean) => {
    setNote("");
    setFailed(false);

    if (!v) {
      setOn(false);
      await disablePush();
      setNote(L(
        "Community alerts are off on this iPhone.",
        "Las alertas de Community están desactivadas en este iPhone.",
        "Os alertas da Comunidade estão desativados neste iPhone.",
      ));
      return;
    }

    setBusy(true);
    const status = await enablePush(10000);
    setBusy(false);

    const state = await refreshState();

    if (status === "granted" && state.enabled) {
      setOn(true);
      setNote(L(
        "Community alerts are enabled on this iPhone.",
        "Las alertas de Community están activadas en este iPhone.",
        "Os alertas da Comunidade estão ativados neste iPhone.",
      ));
      return;
    }

    setOn(false);

    if (status === "denied" || state.permission === "denied") {
      setPermission("denied");
      setNote(L(
        "Notifications are blocked in iPhone Settings.",
        "Las notificaciones están bloqueadas en los Ajustes del iPhone.",
        "As notificações estão bloqueadas nos Ajustes do iPhone.",
      ));
      return;
    }

    if (status === "unsupported" || !state.supported) {
      setSupported(false);
      setNote(L(
        "Notifications are not available on this build yet.",
        "Las notificaciones todavía no están disponibles en este build.",
        "As notificações ainda não estão disponíveis nesta versão.",
      ));
      return;
    }

    setFailed(true);
    setNote(L(
      "Could not connect notifications on this device. Try again later.",
      "No se pudieron conectar las notificaciones en este dispositivo. Inténtalo de nuevo más tarde.",
      "Não foi possível conectar as notificações neste dispositivo. Tente novamente mais tarde.",
    ));
  };

  const openSettings = async () => {
    const opened = await openNotificationSettings();
    if (!opened) {
      setNote(L(
        "Open iPhone Settings → Prayer & Fire → Notifications.",
        "Abre Ajustes del iPhone → Prayer & Fire → Notificaciones.",
        "Abra Ajustes do iPhone → Prayer & Fire → Notificações.",
      ));
    }
  };

  const unavailable = supported === false;

  return (
    <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-orange-400 font-black">
          {L("Community notifications", "Notificaciones de Community", "Notificações da Comunidade")}
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center gap-3">
        {on ? <Bell className="w-5 h-5 text-orange-400" /> : <BellOff className="w-5 h-5 text-zinc-500" />}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">
            {L("Allow alerts on this iPhone", "Permitir alertas en este iPhone", "Permitir alertas neste iPhone")}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {L(
              "Get iPhone alerts for new Community messages, mentions and announcements.",
              "Recibe alertas en tu iPhone por nuevos mensajes, menciones y anuncios de Community.",
              "Receba alertas no iPhone sobre novas mensagens, menções e anúncios da Comunidade.",
            )}
          </p>
        </div>
        <Switch
          checked={on}
          onCheckedChange={change}
          disabled={busy || unavailable}
        />
      </div>

      {busy && (
        <div className="px-4 pb-3 text-xs text-zinc-400 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {L(
            "Connecting notifications…",
            "Conectando las notificaciones…",
            "Conectando as notificações…",
          )}
        </div>
      )}

      {!busy && note && (
        <div className={`px-4 pb-3 text-xs ${failed ? "text-red-300" : "text-orange-300"}`}>
          {note}
        </div>
      )}

      {!busy && permission === "denied" && (
        <div className="px-4 pb-4">
          <button
            onClick={openSettings}
            className="h-10 px-4 rounded-xl bg-orange-500 text-black text-xs font-black inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {L("Open iPhone Settings", "Abrir Ajustes del iPhone", "Abrir Ajustes do iPhone")}
          </button>
        </div>
      )}

      {!busy && failed && permission !== "denied" && (
        <div className="px-4 pb-4">
          <button
            onClick={() => change(true)}
            className="h-10 px-4 rounded-xl bg-orange-500 text-black text-xs font-black"
          >
            {L("Try again", "Intentar de nuevo", "Tentar novamente")}
          </button>
        </div>
      )}

      {!busy && unavailable && (
        <div className="px-4 pb-4 text-xs text-zinc-500">
          {L(
            "Notifications are not available on this build yet.",
            "Las notificaciones todavía no están disponibles en este build.",
            "As notificações ainda não estão disponíveis nesta versão.",
          )}
        </div>
      )}
    </div>
  );
}
