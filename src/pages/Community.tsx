import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, CheckCheck, Mic, MoreHorizontal, Paperclip, Phone, Play, Search, Send, Smile, Users, Video, Plus } from "lucide-react";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";
import CreateGroupModal, { type CreatedGroup } from "@/components/community/CreateGroupModal";

type Lang = "en" | "es" | "pt";
type Group = CreatedGroup;
type Message = { id: string; author: string; text?: string; mine?: boolean; time: string; reactions?: string[]; voice?: boolean; image?: string };

const starterGroups: Group[] = [
  { id: "24h", name: "⏰ 24H PRAYER & FIRE 🙏🔥", subtitle: "Global intercession • prayer without ceasing", unread: 14, pinned: true, lastTime: "8:36 PM" },
  { id: "men", name: "HOMENS PRAYER & FIRE 🔥", subtitle: "Men of faith • prayer • discipleship", unread: 2, lastTime: "7:08 PM" },
  { id: "international", name: "PRAYER & FIRE / International", subtitle: "Nations connected in prayer", unread: 1, lastTime: "11:21 AM" },
  { id: "leaders", name: "Prayer & Fire Leaders", subtitle: "Leadership, direction and ministry", unread: 0, lastTime: "Yesterday" },
];

const initialMessages: Message[] = [
  { id: "m1", author: "Hélia Eliseu Tombamo 🇦🇴", text: "Eterno Deus, criador dos céus e da terra. Deus de Abraão, Deus de Isaque e Deus de Israel. Eu venho na tua presença em nome de Jesus. Entrego o meu país Angola em tuas mãos. Derrama o teu amor e transforma corações. Em nome de Jesus, amém.", time: "8:36 PM", reactions: ["🙏", "🔥", "❤️"] },
  { id: "m2", author: "Alexandro California 🇺🇸", voice: true, time: "8:41 PM", reactions: ["🔥", "🙌"] },
  { id: "m3", author: "Aline Ramiro", text: "Continuamos unidos em oração. Deus está levantando uma rede internacional de intercessores.", time: "8:44 PM", reactions: ["🙏", "❤️"] },
];

const copy = {
  en: { title: "Community", search: "Search groups", all: "All", unread: "Unread", groups: "Groups", members: "members", online: "online", pinned: "Pinned", type: "Message Prayer & Fire", you: "You", newGroup: "New group" },
  es: { title: "Comunidad", search: "Buscar grupos", all: "Todos", unread: "No leídos", groups: "Grupos", members: "miembros", online: "en línea", pinned: "Fijado", type: "Mensaje Prayer & Fire", you: "Tú", newGroup: "Nuevo grupo" },
  pt: { title: "Comunidade", search: "Buscar grupos", all: "Todos", unread: "Não lidos", groups: "Grupos", members: "membros", online: "online", pinned: "Fixado", type: "Mensagem Prayer & Fire", you: "Você", newGroup: "Novo grupo" },
};

function currentLanguage(): Lang {
  const raw = (localStorage.getItem("pf_lang") || localStorage.getItem("language") || localStorage.getItem("pf_language") || "en").slice(0, 2);
  return raw === "es" || raw === "pt" ? raw : "en";
}

export default function Community() {
  const [language] = useState<Lang>(() => currentLanguage());
  const t = copy[language];
  const [groups, setGroups] = useState<Group[]>(starterGroups);
  const [selected, setSelected] = useState<Group | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleGroups = useMemo(() => groups.filter(g => {
    if (filter === "unread" && g.unread < 1) return false;
    return (g.name + " " + g.subtitle).toLowerCase().includes(query.toLowerCase());
  }), [groups, query, filter]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), author: t.you, text, mine: true, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }]);
    setDraft("");
  };

  const addReaction = (id: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m));
    setReactingTo(null);
  };

  const addMedia = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), author: t.you, image: url, mine: true, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }]);
  };

  const addGroup = (group: CreatedGroup) => {
    setGroups(prev => [group, ...prev]);
    setSelected(group);
  };

  if (selected) {
    return (
      <div className="fixed inset-0 bg-[#080808] text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <header className="shrink-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10 px-3 py-3 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full grid place-items-center hover:bg-white/10"><ArrowLeft /></button>
          <img src={entryLogo} alt="Prayer & Fire" className="w-11 h-11 rounded-full object-cover ring-1 ring-orange-500/40" />
          <div className="min-w-0 flex-1"><div className="font-black truncate text-[15px]">{selected.name}</div><div className="text-[11px] text-zinc-400 truncate">148 {t.members} • 26 {t.online}</div></div>
          <button className="w-9 h-9 rounded-full grid place-items-center bg-zinc-900"><Video className="w-4 h-4" /></button>
          <button className="w-9 h-9 rounded-full grid place-items-center bg-zinc-900"><Phone className="w-4 h-4" /></button>
          <button className="w-9 h-9 rounded-full grid place-items-center bg-zinc-900"><MoreHorizontal className="w-4 h-4" /></button>
        </header>

        <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-amber-300/5 border-b border-orange-500/10 flex items-center gap-2 text-xs text-amber-200"><span>📌</span><span className="font-bold">{t.pinned}:</span><span>🚧 4 NÍVEIS DE COMPROMISSO 🚧</span></div>

        <main className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.08),_transparent_34%),linear-gradient(180deg,#101010,#060606)]">
          <div className="mx-auto text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-1 rounded-full w-fit">Today</div>
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`relative max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-xl border ${m.mine ? "bg-orange-500 text-black border-orange-300/30 rounded-br-md" : "bg-[#171717] border-white/10 rounded-bl-md"}`}>
                {!m.mine && <div className="text-[12px] font-bold text-orange-400 mb-1">{m.author}</div>}
                {m.text && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                {m.image && <img src={m.image} alt="Shared" className="rounded-xl max-h-80 object-cover" />}
                {m.voice && <div className="flex items-center gap-3 min-w-[230px] py-1"><button className="w-10 h-10 rounded-full bg-orange-500 text-black grid place-items-center"><Play className="w-4 h-4 fill-current" /></button><div className="flex-1"><div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden"><div className="h-full w-2/5 bg-orange-400" /></div><div className="text-[10px] text-zinc-400 mt-1">0:37</div></div><Mic className="w-4 h-4 text-orange-400" /></div>}
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.mine ? "text-black/60" : "text-zinc-500"}`}>{m.time}{m.mine && <CheckCheck className="w-3.5 h-3.5" />}</div>
                {!!m.reactions?.length && <div className="absolute -bottom-3 left-3 bg-zinc-950 border border-white/10 rounded-full px-2 py-0.5 text-xs shadow-lg">{m.reactions.slice(-4).join(" ")}</div>}
                <button onClick={() => setReactingTo(reactingTo === m.id ? null : m.id)} className="absolute -right-8 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full grid place-items-center text-zinc-500 hover:text-orange-400"><Smile className="w-4 h-4" /></button>
                {reactingTo === m.id && <div className="absolute z-20 -right-1 top-full mt-2 bg-zinc-950 border border-white/10 rounded-full px-2 py-1.5 flex gap-2 shadow-2xl">{["❤️","🙏","🔥","🙌","😂","👍"].map(e => <button key={e} onClick={() => addReaction(m.id, e)} className="text-lg">{e}</button>)}</div>}
              </div>
            </div>
          ))}
        </main>

        <div className="shrink-0 bg-black/95 backdrop-blur-xl border-t border-white/10 px-3 py-2.5">
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center"><Paperclip className="w-5 h-5" /></button>
            <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={e => addMedia(e.target.files?.[0])} />
            <div className="flex-1 min-h-11 bg-zinc-900 border border-white/10 rounded-[22px] px-3 flex items-end gap-2"><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={t.type} rows={1} className="flex-1 resize-none bg-transparent outline-none py-2.5 text-[15px] max-h-28" /><button onClick={() => fileRef.current?.click()} className="pb-2.5 text-zinc-400"><Camera className="w-5 h-5" /></button></div>
            {draft.trim() ? <button onClick={send} className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center"><Send className="w-5 h-5" /></button> : <button onClick={() => setRecording(v => !v)} className={`w-11 h-11 rounded-full grid place-items-center ${recording ? "bg-red-500 animate-pulse" : "bg-orange-500 text-black"}`}><Mic className="w-5 h-5" /></button>}
          </div>
          {recording && <div className="text-center text-xs text-red-300 mt-2">● Recording… tap microphone to stop</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-xl mx-auto h-full bg-[#080808] flex flex-col">
        <header className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3"><button onClick={() => window.history.back()} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center"><ArrowLeft className="w-5 h-5" /></button><div><div className="text-[11px] tracking-[0.3em] text-orange-400 font-bold">PRAYER & FIRE</div><h1 className="text-3xl font-black mt-0.5">{t.title}</h1></div></div>
          <button onClick={() => setCreateOpen(true)} className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center" aria-label={t.newGroup}><Users className="w-5 h-5" /></button>
        </header>

        <div className="shrink-0 px-5 py-3">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl h-12 px-4 flex items-center gap-2"><Search className="w-5 h-5 text-zinc-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} className="bg-transparent outline-none flex-1 min-w-0" /></div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">{(["all","unread","groups"] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${filter === f ? "bg-orange-500 text-black border-orange-400" : "bg-zinc-950 border-white/10 text-zinc-300"}`}>{t[f]}</button>)}</div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-24">
          {visibleGroups.map(g => <button key={g.id} onClick={() => setSelected(g)} className="w-full text-left flex gap-3 px-2 py-3.5 border-b border-white/10 active:bg-white/5 rounded-xl"><div className="relative shrink-0"><img src={entryLogo} alt="" className="w-14 h-14 rounded-full object-cover ring-1 ring-orange-500/30" />{g.pinned && <span className="absolute -bottom-1 -right-1 text-xs bg-zinc-950 rounded-full w-6 h-6 grid place-items-center border border-white/10">📌</span>}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div className="font-extrabold truncate">{g.name}</div><span className="text-[11px] text-zinc-500 shrink-0">{g.lastTime}</span></div><div className="flex items-center justify-between gap-2 mt-1"><div className="text-sm text-zinc-400 truncate">{g.subtitle}</div>{g.unread > 0 && <span className="min-w-6 h-6 px-1.5 rounded-full bg-orange-500 text-black text-xs font-black grid place-items-center">{g.unread}</span>}</div></div></button>)}
        </div>

        <button onClick={() => setCreateOpen(true)} className="absolute bottom-[max(22px,env(safe-area-inset-bottom))] right-5 w-14 h-14 rounded-2xl bg-orange-500 text-black grid place-items-center shadow-[0_10px_40px_rgba(249,115,22,.35)]" aria-label={t.newGroup}><Plus className="w-7 h-7" /></button>
        <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={addGroup} language={language} />
      </div>
    </div>
  );
}
