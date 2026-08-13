import React, { useMemo, useState } from "react";
import { ArrowLeft, Camera, Check, Search, Users, X } from "lucide-react";

export type CreatedGroup = { id: string; name: string; subtitle: string; unread: number; pinned?: boolean; avatar?: string; lastTime: string };

type Props = { open: boolean; onClose: () => void; onCreate: (group: CreatedGroup) => void; language: "en" | "es" | "pt" };

const people = ["Aline Ramiro", "Alexandro California", "Hélia Eliseu Tombamo", "Pastor Rajeev", "Prayer & Fire Leaders", "Movement Church Team"];
const words = {
  en: { newGroup:"New group", choose:"Add members", next:"Next", name:"Group name", subject:"Add a name and optional description", desc:"Group description (optional)", create:"Create group", search:"Search people", selected:"selected", photo:"Add group photo" },
  es: { newGroup:"Nuevo grupo", choose:"Agregar miembros", next:"Siguiente", name:"Nombre del grupo", subject:"Agrega un nombre y una descripción opcional", desc:"Descripción del grupo (opcional)", create:"Crear grupo", search:"Buscar personas", selected:"seleccionados", photo:"Agregar foto del grupo" },
  pt: { newGroup:"Novo grupo", choose:"Adicionar membros", next:"Avançar", name:"Nome do grupo", subject:"Adicione um nome e uma descrição opcional", desc:"Descrição do grupo (opcional)", create:"Criar grupo", search:"Buscar pessoas", selected:"selecionados", photo:"Adicionar foto do grupo" },
};

export default function CreateGroupModal({ open, onClose, onCreate, language }: Props) {
  const t = words[language];
  const [step, setStep] = useState<1|2>(1); const [query,setQuery]=useState(""); const [chosen,setChosen]=useState<string[]>([]); const [name,setName]=useState(""); const [description,setDescription]=useState("");
  const filtered=useMemo(()=>people.filter(p=>p.toLowerCase().includes(query.toLowerCase())),[query]);
  if(!open) return null;
  const finish=()=>{ if(!name.trim()) return; onCreate({id:crypto.randomUUID(),name:name.trim(),subtitle:description.trim() || `${chosen.length+1} members`,unread:0,lastTime:"Now"}); setStep(1);setChosen([]);setName("");setDescription("");onClose(); };
  return <div className="fixed inset-0 z-[100] bg-[#080808] text-white" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
    <header className="h-16 px-4 flex items-center gap-3 border-b border-white/10 bg-black/90 backdrop-blur-xl"><button onClick={step===2?()=>setStep(1):onClose} className="w-10 h-10 grid place-items-center rounded-full bg-zinc-900"><ArrowLeft/></button><div className="flex-1"><h2 className="font-black text-lg">{t.newGroup}</h2><p className="text-xs text-zinc-400">{step===1?t.choose:t.subject}</p></div><button onClick={onClose} className="w-9 h-9 grid place-items-center text-zinc-400"><X/></button></header>
    {step===1 ? <main className="px-5 py-4 max-w-xl mx-auto">
      <div className="h-12 px-4 rounded-2xl bg-zinc-900 border border-white/10 flex items-center gap-2"><Search className="text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} className="flex-1 bg-transparent outline-none"/></div>
      {chosen.length>0&&<div className="flex gap-2 overflow-x-auto py-4">{chosen.map(p=><button key={p} onClick={()=>setChosen(v=>v.filter(x=>x!==p))} className="shrink-0 px-3 py-2 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs">{p} ×</button>)}</div>}
      <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold py-3">{chosen.length} {t.selected}</div>
      {filtered.map((p,i)=>{const active=chosen.includes(p);return <button key={p} onClick={()=>setChosen(v=>active?v.filter(x=>x!==p):[...v,p])} className="w-full flex items-center gap-3 py-3 border-b border-white/10"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/30 to-zinc-800 grid place-items-center font-black">{p[0]}</div><div className="flex-1 text-left font-semibold">{p}</div><div className={`w-6 h-6 rounded-full border grid place-items-center ${active?"bg-orange-500 border-orange-500 text-black":"border-zinc-600"}`}>{active&&<Check className="w-4 h-4"/>}</div></button>})}
      <button disabled={!chosen.length} onClick={()=>setStep(2)} className="fixed bottom-[max(22px,env(safe-area-inset-bottom))] right-5 px-6 h-12 rounded-full bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black">{t.next}</button>
    </main> : <main className="px-5 py-8 max-w-xl mx-auto">
      <div className="mx-auto w-24 h-24 rounded-full bg-zinc-900 border border-white/10 grid place-items-center text-orange-400"><Camera className="w-8 h-8"/><span className="sr-only">{t.photo}</span></div>
      <label className="block mt-8 text-sm font-bold text-zinc-300">{t.name}</label><input autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full h-14 rounded-2xl bg-zinc-900 border border-white/10 px-4 outline-none focus:border-orange-500"/>
      <label className="block mt-5 text-sm font-bold text-zinc-300">{t.desc}</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl bg-zinc-900 border border-white/10 p-4 outline-none focus:border-orange-500 resize-none"/>
      <div className="mt-6 rounded-2xl bg-zinc-900/70 border border-white/10 p-4 flex items-center gap-3"><Users className="text-orange-400"/><div><div className="font-bold">{chosen.length+1} members</div><div className="text-xs text-zinc-500">You + {chosen.length} invited</div></div></div>
      <button disabled={!name.trim()} onClick={finish} className="mt-8 w-full h-14 rounded-2xl bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black text-base">{t.create}</button>
    </main>}
  </div>;
}