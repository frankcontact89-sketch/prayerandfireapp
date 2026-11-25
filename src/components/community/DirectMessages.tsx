import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isBlockedContent } from "@/lib/content-filter";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["community_direct_messages"]["Row"];

export default function DirectMessages({ otherId, userId, name, language, onClose, inline = false }: {
  otherId: string;
  userId: string;
  name: string;
  language: string;
  onClose: () => void;
  inline?: boolean;
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
    if (data) {
      setMessages(data.reverse());
      const unread = data.filter(message => message.recipient_id === userId && !message.read_at).map(message => message.id);
      if (unread.length) await supabase.from("community_direct_messages").update({ read_at: new Date().toISOString() }).in("id", unread);
    }
  }, [userId, otherId]);
  useEffect(() => {
    void load();
    const channel = supabase.channel(`direct-thread:${userId}:${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_direct_messages", filter: `recipient_id=eq.${userId}` }, () => { void load(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_direct_messages", filter: `sender_id=eq.${userId}` }, () => { void load(); })
      .subscribe(status => { if (status === "SUBSCRIBED") void load(); });
    const refresh = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", refresh);
    return () => { document.removeEventListener("visibilitychange", refresh); void supabase.removeChannel(channel); };
  }, [load, userId, otherId]);

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

  const conversation = <>
        <ol className={inline ? "min-h-0 flex-1 overflow-y-auto space-y-2 px-4 py-4" : "max-h-[35dvh] overflow-y-auto space-y-2"}>
          {messages.map(message => <li key={message.id} className={`whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${message.sender_id === userId ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-secondary"}`}>{message.body}</li>)}
        </ol>
        {loadError && <p role="alert" className="text-sm text-destructive">{t("Could not load messages", "No se cargaron los mensajes", "Não foi possível carregar as mensagens")}</p>}
        <form className={inline ? "flex gap-2 border-t border-border bg-card p-3" : "flex gap-2"} onSubmit={send}>
          <input value={draft} onChange={event => setDraft(event.currentTarget.value)} maxLength={2000} disabled={sending}
            className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-base"
            aria-label={t("Message", "Mensaje", "Mensagem")} />
          <button disabled={sending || !draft.trim()} className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50">
            {t("Send", "Enviar", "Enviar")}
          </button>
        </form>
        {sendError && <p role="alert" className="text-sm text-destructive">{t("Message could not be sent", "No se pudo enviar el mensaje", "Não foi possível enviar a mensagem")}</p>}
  </>;
  if (inline) return <section className="fixed inset-0 z-[105] flex flex-col bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <header className="flex shrink-0 items-center gap-2 border-b border-border p-2">
      <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-secondary" aria-label={t("Back", "Atrás", "Voltar")}><ArrowLeft size={20} /></button>
      <h2 className="min-w-0 truncate text-base font-semibold">{name}</h2>
    </header>
    {conversation}
  </section>;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="z-[195] w-[calc(100%-2rem)] max-w-md rounded-2xl" onClick={event => event.stopPropagation()}>
      <DialogTitle>{name}</DialogTitle>
      <DialogDescription>{t("Private messages", "Mensajes privados", "Mensagens privadas")}</DialogDescription>
      {conversation}
    </DialogContent>
  </Dialog>;
}
