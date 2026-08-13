import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, CheckCheck, FileText, Image as ImageIcon, Mic,
  MoreVertical, Paperclip, Phone, Plus, Search, Send, Smile, Users, Video, X
} from "lucide-react";

type Chat = { id:string; name:string; subtitle:string; group?:boolean; unread?:number };
type Message = { id:number; mine:boolean; text?:string; time:string; reaction?:string };

interface ChatScreenProps { t:(key:string)=>string; onBack?:()=>void }

const seedChats: Chat[] = [
  { id:"24h", name:"24H PRAYER & FIRE 🙏🔥", subtitle:"Prayer room • Global intercession", group:true, unread:3 },
  { id:"leaders", name:"Prayer & Fire Leaders", subtitle:"Leadership & ministry", group:true },
  { id:"missions", name:"Global Missions", subtitle:"Missionaries and nations", group:true },
];

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [query,setQuery]=useState("");
  const [active,setActive]=useState<Chat|null>(null);
  const [chats,setChats]=useState<Chat[]>(seedChats);
  const [composer,setComposer]=useState("");
  const [plusOpen,setPlusOpen]=useState(false);
  const [createGroup,setCreateGroup]=useState(false);
  const [groupName,setGroupName]=useState("");
  const [recording,setRecording]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const [messages,setMessages]=useState<Message[]>([
    {id:1,mine:false,text:"Welcome to Prayer & Fire. Let us stay connected in prayer.",time:"8:36 PM"},
    {id:2,mine:true,text:"Amen 🙏🔥",time:"8:37 PM",reaction:"❤️"},
  ]);

  const visible=useMemo(()=>chats.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())),[chats,query]);
  const send=()=>{ const text=composer.trim(); if(!text)return; setMessages(v=>[...v,{id:Date.now(),mine:true,text,time:new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}]); setComposer(""); };
  const addGroup=()=>{ const name=groupName.trim(); if(!name)return; const g={id:String(Date.now()),name,subtitle:"New Prayer & Fire group",group:true}; setChats(v=>[g,...v]); setGroupName("");setCreateGroup(false);setPlusOpen(false);setActive(g); };

  if(active) return <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden">
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-xl px-3 pt-[max(env(safe-area-inset-top),12px)] pb-2 flex items-center gap-2">
      <button onClick={()=>setActive(null)} className="p-2"><ArrowLeft/></button>
      <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Users size={20}/></div>
      <div className="min-w-0 flex-1"><div className="font-semibold truncate">{active.name}</div><div className="text-xs text-muted-foreground">{active.group?"Group • Prayer & Fire":"Online"}</div></div>
      <button className="p-2"><Phone size={19}/></button><button className="p-2"><Video size={20}/></button><button className="p-2"><MoreVertical size={20}/></button>
    </header>
    <main className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gradient-to-b from-background to-card/20">
      <div className="mx-auto w-fit text-[11px] text-muted-foreground bg-card border border-border rounded-full px-3 py-1">Messages are visible to members of this conversation</div>
      {messages.map(m=><div key={m.id} className={`flex ${m.mine?"justify-end":"justify-start"}`}>
        <div className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${m.mine?"bg-primary text-primary-foreground rounded-br-md":"bg-card border border-border rounded-bl-md"}`}>
          <div className="text-[15px] leading-relaxed">{m.text}</div>
          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${m.mine?"text-primary-foreground/70":"text-muted-foreground"}`}>{m.time}{m.mine&&<CheckCheck size={13}/>}</div>
          {m.reaction&&<button className="absolute -bottom-3 right-2 rounded-full border border-border bg-background px-1.5 text-sm shadow">{m.reaction}</button>}
        </div>
      </div>)}
    </main>
    <div className="shrink-0 border-t border-border bg-background px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)]">
      {plusOpen&&<div className="grid grid-cols-4 gap-2 p-3 mb-2 rounded-2xl bg-card border border-border">
        <button onClick={()=>fileRef.current?.click()} className="flex flex-col items-center gap-1 text-xs"><span className="p-3 rounded-full bg-primary/15 text-primary"><ImageIcon/></span>Photos</button>
        <button onClick={()=>fileRef.current?.click()} className="flex flex-col items-center gap-1 text-xs"><span className="p-3 rounded-full bg-primary/15 text-primary"><Camera/></span>Camera</button>
        <button onClick={()=>fileRef.current?.click()} className="flex flex-col items-center gap-1 text-xs"><span className="p-3 rounded-full bg-primary/15 text-primary"><FileText/></span>Document</button>
        <button onClick={()=>setPlusOpen(false)} className="flex flex-col items-center gap-1 text-xs"><span className="p-3 rounded-full bg-primary/15 text-primary"><X/></span>Close</button>
      </div>}
      <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" />
      <div className="flex items-end gap-2"><button onClick={()=>setPlusOpen(v=>!v)} className="p-2.5 text-primary"><Plus/></button>
        <div className="flex-1 min-h-11 rounded-3xl border border-border bg-card flex items-end"><textarea value={composer} onChange={e=>setComposer(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1} placeholder="Message" className="flex-1 resize-none bg-transparent px-3 py-2.5 outline-none max-h-28"/><button className="p-2.5 text-muted-foreground"><Smile size={20}/></button></div>
        {composer.trim()?<button onClick={send} className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Send size={19}/></button>:<button onClick={()=>setRecording(v=>!v)} className={`w-11 h-11 rounded-full flex items-center justify-center ${recording?"bg-destructive text-destructive-foreground animate-pulse":"bg-primary text-primary-foreground"}`}><Mic size={20}/></button>}
      </div>{recording&&<div className="text-center text-xs text-destructive pt-1">Recording voice message… tap microphone to stop</div>}
    </div>
  </div>;

  return <div className="flex flex-col h-full min-h-0 bg-background text-foreground overflow-hidden">
    <header className="shrink-0 px-5 pt-5 pb-3 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2">{onBack&&<button onClick={onBack} className="p-1"><ArrowLeft/></button>}<h1 className="text-2xl font-bold">Community</h1></div><button onClick={()=>setPlusOpen(true)} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus/></button></div>
      <div className="relative mt-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search conversations" className="w-full h-11 rounded-xl bg-card border border-border pl-10 pr-3 outline-none focus:ring-2 focus:ring-primary/40"/></div>
    </header>
    <main className="flex-1 overflow-y-auto pb-24">
      {visible.map(c=><button key={c.id} onClick={()=>setActive(c)} className="w-full flex items-center gap-3 px-5 py-4 border-b border-border/50 text-left active:bg-card/70">
        <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-primary/15 text-primary flex items-center justify-center"><Users/></div><div className="flex-1 min-w-0"><div className="font-semibold truncate">{c.name}</div><div className="text-sm text-muted-foreground truncate">{c.subtitle}</div></div>{c.unread&&<span className="min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{c.unread}</span>}
      </button>)}
    </main>
    {plusOpen&&<div className="fixed inset-0 z-40 bg-black/70 flex items-end" onClick={()=>setPlusOpen(false)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-card border-t border-border p-5 pb-[max(env(safe-area-inset-bottom),24px)]"><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">New</h2><button onClick={()=>setPlusOpen(false)}><X/></button></div><button onClick={()=>setCreateGroup(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background"><span className="p-3 rounded-full bg-primary/15 text-primary"><Users/></span><div><div className="font-medium text-left">Create group</div><div className="text-xs text-muted-foreground">Start a Prayer & Fire group</div></div></button><button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background"><span className="p-3 rounded-full bg-primary/15 text-primary"><Plus/></span><div className="font-medium">New private chat</div></button>{createGroup&&<div className="mt-4 flex gap-2"><input autoFocus value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Group name" className="flex-1 h-11 rounded-xl border border-border bg-background px-3"/><button onClick={addGroup} className="px-4 rounded-xl bg-primary text-primary-foreground font-medium">Create</button></div>}</div></div>}
  </div>;
}
