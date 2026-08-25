import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Search, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type CreatedGroup = {
  id: string;
  name: string;
  subtitle: string;
  unread: number;
  pinned?: boolean;
  avatar?: string;
  lastTime: string;
  memberIds?: string[];
};

type Person = { id: string; name: string; username?: string | null; avatar?: string | null };
type Props = { open: boolean; onClose: () => void; onCreate: (group: CreatedGroup) => void | Promise<void>; language: "en" | "es" | "pt" };

const words = {
  en: { newGroup:"New group", choose:"Add members", next:"Next", name:"Group name", subject:"Add a name and optional description", desc:"Group description (optional)", create:"Create group", search:"Search people", selected:"selected", photo:"Add group photo", noPeople:"No other Prayer & Fire users found yet", loading:"Loading people…" },
  es: { newGroup:"Nuevo grupo", choose:"Agregar miembros", next:"Siguiente", name:"Nombre del grupo", subject:"Agrega un nombre y una descripción opcional", desc:"Descripción del grupo (opcional)", create:"Crear grupo", search:"Buscar personas", selected:"seleccionados", photo:"Agregar foto del grupo", noPeople:"Todavía no se encontraron otros usuarios de Prayer & Fire", loading:"Cargando personas…" },
  pt: { newGroup:"Novo grupo", choose:"Adicionar membros", next:"Avançar", name:"Nome do grupo", subject:"Adicione um nome e uma descrição opcional", desc:"Descrição do grupo (opcional)", create:"Criar grupo", search:"Buscar pessoas", selected:"selecionados", photo:"Adicionar foto do grupo", noPeople:"Ainda não foram encontrados outros usuários do Prayer & Fire", loading:"Carregando pessoas…" },
};

export default function CreateGroupModal({ open, onClose, onCreate, language }: Props) {
  const t = words[language];
  const [step, setStep] = useState<1|2>(1);
  const [query,setQuery]=useState("");
  const [chosen,setChosen]=useState<string[]>([]);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [people,setPeople]=useState<Person[]>([]);
  const [loading,setLoading]=useState(false);
  const [creating,setCreating]=useState(false);
  const [groupPhoto,setGroupPhoto]=useState<string | null>(null);
  const photoRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(!open) return;
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const db:any = supabase;
        const { data: reqs } = await db.from("community_access_requests").select("user_id").eq("status","approved");
        const { data: ads } = await db.from("community_admins").select("user_id");
        const eligible = Array.from(new Set([...(reqs||[]).map((r:any)=>r.user_id), ...(ads||[]).map((a:any)=>a.user_id)])).filter((id)=>id!==user?.id);
        if(cancelled) return;
        if(!eligible.length){ setPeople([]); return; }
        const { data } = await db.from("profiles").select("id, username, avatar_url").in("id", eligible).order("username", { ascending:true });
        if(cancelled) return;
        const source:any[] = (data && data.length) ? data : eligible.map((id)=>({ id, username:null, avatar_url:null }));
        const mapped:Person[]=source.map((p:any)=>({
          id:p.id,
          name:p.username || "Prayer & Fire Member",
          username:p.username,
          avatar:p.avatar_url,
        }));
        setPeople(mapped);
      } finally { if(!cancelled) setLoading(false); }
    })();
    return ()=>{cancelled=true};
  },[open]);

  const filtered=useMemo(()=>people.filter(p=>(p.name+" "+(p.username||"")).toLowerCase().includes(query.toLowerCase())),[people,query]);
  const chosenPeople=people.filter(p=>chosen.includes(p.id));
  if(!open) return null;

  const reset=()=>{setStep(1);setChosen([]);setName("");setDescription("");setQuery("");setGroupPhoto(null)};
  const close=()=>{reset();onClose();};
  const finish=async()=>{
    if(!name.trim() || creating) return;
    setCreating(true);
    try {
      await onCreate({id:crypto.randomUUID(),name:name.trim(),subtitle:description.trim() || `${chosen.length+1} members`,unread:0,lastTime:"Now",memberIds:chosen,avatar:groupPhoto||undefined});
      close();
    } finally { setCreating(false); }
  };

  return <div className="fixed inset-0 z-[100] bg-[#080808] text-white flex flex-col" style={{paddingTop:"env(safe-area-inset-top)"}}>
    <header className="shrink-0 h-14 px-3 flex items-center gap-3 border-b border-white/10 bg-black">
      <button onClick={step===2?()=>setStep(1):close} className="w-10 h-10 grid place-items-center rounded-full bg-zinc-900"><ArrowLeft/></button>
      <div className="flex-1 min-w-0"><h2 className="font-black text-base truncate">{t.newGroup}</h2><p className="text-[11px] text-zinc-400 truncate">{step===1?t.choose:t.subject}</p></div>
      <button onClick={close} className="w-9 h-9 grid place-items-center text-zinc-400"><X/></button>
    </header>

    {step===1 ? <><div className="shrink-0 px-4 pt-3 pb-2 max-w-xl w-full mx-auto">
      <div className="h-11 px-3 rounded-xl bg-zinc-900 border border-white/10 flex items-center gap-2"><Search className="w-4 h-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} className="flex-1 bg-transparent outline-none min-w-0 text-sm"/></div>
      {chosenPeople.length>0&&<div className="flex gap-2 overflow-x-auto pt-3">{chosenPeople.map(p=><button key={p.id} onClick={()=>setChosen(v=>v.filter(x=>x!==p.id))} className="shrink-0 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs">{p.name} ×</button>)}</div>}
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold pt-3">{chosen.length} {t.selected}</div>
    </div>
    <main className="flex-1 min-h-0 overflow-y-auto px-4 max-w-xl w-full mx-auto">
      {loading ? <div className="text-zinc-500 py-10 text-center text-sm">{t.loading}</div> : filtered.length===0 ? <div className="text-zinc-500 py-10 text-center text-sm">{t.noPeople}</div> : filtered.map(p=>{const active=chosen.includes(p.id);return <button key={p.id} onClick={()=>setChosen(v=>active?v.filter(x=>x!==p.id):[...v,p.id])} className="w-full flex items-center gap-3 py-2.5 border-b border-white/5">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-500/30 to-zinc-800 grid place-items-center font-black text-sm shrink-0">{p.avatar?<img src={p.avatar} className="w-full h-full object-cover" alt=""/>:p.name[0]?.toUpperCase()}</div>
        <div className="flex-1 text-left min-w-0"><div className="font-semibold text-sm truncate">{p.name}</div>{p.username&&<div className="text-[11px] text-zinc-500 truncate">@{p.username}</div>}</div>
        <div className={`w-6 h-6 rounded-full border grid place-items-center shrink-0 ${active?"bg-orange-500 border-orange-500 text-black":"border-zinc-600"}`}>{active&&<Check className="w-4 h-4"/>}</div>
      </button>})}
    </main>
    <div className="shrink-0 px-4 pt-3 border-t border-white/10 bg-black" style={{paddingBottom:"calc(12px + env(safe-area-inset-bottom))"}}><button onClick={()=>setStep(2)} className="w-full max-w-xl mx-auto block h-13 py-4 rounded-2xl bg-orange-500 text-black font-black">{t.next}</button></div>
    </> : <main className="flex-1 min-h-0 overflow-y-auto px-5 py-8 max-w-xl w-full mx-auto" style={{paddingBottom:"calc(24px + env(safe-area-inset-bottom))"}}>
      <button onClick={()=>photoRef.current?.click()} className="mx-auto w-24 h-24 rounded-full bg-zinc-900 border border-white/10 grid place-items-center text-orange-400 overflow-hidden">{groupPhoto?<img src={groupPhoto} className="w-full h-full object-cover" alt=""/>:<Camera className="w-8 h-8"/>}<span className="sr-only">{t.photo}</span></button>
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setGroupPhoto(URL.createObjectURL(f));e.target.value=""}}/>
      <label className="block mt-8 text-sm font-bold text-zinc-300">{t.name}</label><input autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full h-14 rounded-2xl bg-zinc-900 border border-white/10 px-4 outline-none focus:border-orange-500"/>
      <label className="block mt-5 text-sm font-bold text-zinc-300">{t.desc}</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl bg-zinc-900 border border-white/10 p-4 outline-none focus:border-orange-500 resize-none"/>
      <div className="mt-6 rounded-2xl bg-zinc-900/70 border border-white/10 p-4 flex items-center gap-3"><Users className="text-orange-400"/><div><div className="font-bold">{chosen.length+1} members</div><div className="text-xs text-zinc-500">You + {chosen.length} invited</div></div></div>
      <button disabled={!name.trim()||creating} onClick={finish} className="mt-8 w-full h-14 rounded-2xl bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black text-base">{creating?"…":t.create}</button>
    </main>}
  </div>;
}