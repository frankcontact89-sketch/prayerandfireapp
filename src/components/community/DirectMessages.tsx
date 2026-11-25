import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isBlockedContent } from "@/lib/content-filter";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["community_direct_messages"]["Row"];

export default function DirectMessages({ otherId, userId, name, language, onClose }: {
  otherId: string;
  userId: string;
  name: string;
  language: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const t = (en: string, es: string, pt: string) => language === "es" ? es : language === "pt" ? pt : en;
  const load = useCallback(async () => {
    const { data, error } = await supabase.from("community_direct_messages").select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: false }).limit(50);
    setLoadError(!!error);
    if (data) setMessages(data.reverse());
  }, [userId, otherId]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(); }, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    if (isBlockedContent(body)) { setSendError(true); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("community_direct_messages").insert({ recipient_id: otherId, body });
      setSendError(!!error);
      if (!error) { setDraft(""); await load(); }
    } catch { setSendError(true); }
    finally { setSending(false); }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="z-[195] w-[calc(100%-2rem)] max-w-md" onClick={event => event.stopPropagation()}>
        <DialogTitle>{name}</DialogTitle>
        <DialogDescription>{t("Private messages", "Mensajes privados", "Mensagens privadas")}</DialogDescription>
        <ol className="max-h-[35dvh] overflow-y-auto space-y-2">
          {messages.map(message => <li key={message.id} className={`whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${message.sender_id === userId ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-secondary"}`}>{message.body}</li>)}
        </ol>
        {loadError && <p role="alert" className="text-sm text-destructive">{t("Could not load messages", "No se cargaron los mensajes", "Não foi possível carregar as mensagens")}</p>}
        <form className="flex gap-2" onSubmit={send}>
          <input value={draft} onChange={event => setDraft(event.currentTarget.value)} maxLength={2000} disabled={sending}
            className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-base"
            aria-label={t("Message", "Mensaje", "Mensagem")} />
          <button disabled={sending || !draft.trim()} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50">
            {t("Send", "Enviar", "Enviar")}
          </button>
        </form>
        {sendError && <p role="alert" className="text-sm text-destructive">{t("Message could not be sent", "No se pudo enviar el mensaje", "Não foi possível enviar a mensagem")}</p>}
      </DialogContent>
    </Dialog>
  );
}

export function DirectInbox({ userId, language, onClose }: {
  userId: string;
  language: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<{ id: string; name: string }>();
  const [threads, setThreads] = useState<{ id: string; name: string }[]>();
  const [failed, setFailed] = useState(false);
  const t = (en: string, es: string, pt: string) => language === "es" ? es : language === "pt" ? pt : en;
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.from("community_direct_messages").select("sender_id,recipient_id")
        .order("created_at", { ascending: false }).limit(100);
      if (error) { if (active) setFailed(true); return; }
      const ids = [...new Set(data.map(message => message.sender_id === userId ? message.recipient_id : message.sender_id))];
      const profiles = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : null;
      if (!active) return;
      const names = new Map(profiles?.data?.map(profile => [profile.id, profile.username]));
      setThreads(ids.map(id => ({ id, name: names.get(id) || (
        language === "es" ? "Miembro" : language === "pt" ? "Membro" : "Member"
      ) })));
    })();
    return () => { active = false; };
  }, [userId, language]);

  if (selected) return <DirectMessages otherId={selected.id} name={selected.name} language={language} userId={userId}
    onClose={() => setSelected(undefined)} />;

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-md">
      <DialogTitle>{t("Private messages", "Mensajes privados", "Mensagens privadas")}</DialogTitle>
      <DialogDescription>{t("Recent conversations", "Conversaciones recientes", "Conversas recentes")}</DialogDescription>
      <div className="max-h-[45dvh] overflow-y-auto">
        {threads?.map(thread => <button type="button" key={thread.id} onClick={() => setSelected(thread)}
          className="block min-h-11 w-full truncate border-b px-2 text-left">{thread.name}</button>)}
        {threads?.length === 0 && <p className="text-sm">{t("No conversations yet", "Aún no hay conversaciones", "Ainda não há conversas")}</p>}
        {failed && <p role="alert" className="text-sm text-destructive">{t("Could not load conversations", "No se cargaron las conversaciones", "Não foi possível carregar as conversas")}</p>}
      </div>
    </DialogContent>
  </Dialog>;
}
