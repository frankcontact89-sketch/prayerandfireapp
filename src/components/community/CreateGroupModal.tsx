import React, { useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Search, Users, X } from "lucide-react";
import { useContactSearch } from "./contactSearch";

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

type Person = { id: string; name: string; avatar?: string | null };
type Props = { open: boolean; onClose: () => void; onCreate: (group: CreatedGroup) => boolean | Promise<boolean>; language: "en" | "es" | "pt" };

const words = {
  en: { newGroup:"New group", choose:"Add members", next:"Next", name:"Group name", subject:"Add a name and optional description", desc:"Group description (optional)", create:"Create group", search:"Search people", selected:"selected", photo:"Add group photo", noPeople:"No other Prayer & Fire users found yet", loading:"Loading people…" },
  es: { newGroup:"Nuevo grupo", choose:"Agregar miembros", next:"Siguiente", name:"Nombre del grupo", subject:"Agrega un nombre y una descripción opcional", desc:"Descripción del grupo (opcional)", create:"Crear grupo", search:"Buscar personas", selected:"seleccionados", photo:"Agregar foto del grupo", noPeople:"Todavía no se encontraron otros usuarios de Prayer & Fire", loading:"Cargando personas…" },
  pt: { newGroup:"Novo grupo", choose:"Adicionar membros", next:"Avançar", name:"Nome do grupo", subject:"Adicione um nome e uma descrição opcional", desc:"Descrição do grupo (opcional)", create:"Criar grupo", search:"Buscar pessoas", selected:"selecionados", photo:"Adicionar foto do grupo", noPeople:"Ainda não foram encontrados outros usuários do Prayer & Fire", loading:"Carregando pessoas…" },
};

export default function CreateGroupModal({ open, onClose, onCreate, language }: Props) {
  const t = words[language];
  const [step, setStep] = useState<1|2>(1);
  const [query,setQuery]=useState("");
  const [chosen,setChosen]=useState<Person[]>([]);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [creating,setCreating]=useState(false);
  const [groupPhoto,setGroupPhoto]=useState<string | null>(null);
  const [groupId,setGroupId]=useState(() => crypto.randomUUID());
  const photoRef=useRef<HTMLInputElement>(null);
  const { people, loading, failed } = useContactSearch(query, open && step === 1);
  const filtered = people.map(person => ({ id: person.id, name: person.username || t.choose, avatar: person.avatar_url }));
  const chosenPeople = chosen;
  if(!open) return null;

  const reset=()=>{setStep(1);setChosen([]);setName("");setDescription("");setQuery("");if(groupPhoto)URL.revokeObjectURL(groupPhoto);setGroupPhoto(null);setGroupId(crypto.randomUUID())};
  const close=()=>{reset();onClose();};
  const finish=async()=>{
    if(!name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await onCreate({id:groupId,name:name.trim(),subtitle:description.trim(),unread:0,lastTime:"",memberIds:chosen.map(person=>person.id),avatar:groupPhoto||undefined});
      if (created) close();
    } finally { setCreating(false); }
  };

  return <div className="fixed inset-0 z-[100] bg-[#10060a] text-white flex flex-col" style={{paddingTop:"env(safe-area-inset-top)"}}>
    <header className="shrink-0 h-14 px-3 flex items-center gap-3 border-b border-white/10 bg-[#10060a]">
      <button onClick={step===2?()=>setStep(1):close} aria-label={language==="es"?"Atrás":language==="pt"?"Voltar":"Back"} className="w-11 h-11 grid place-items-center rounded-full bg-[#23151b]"><ArrowLeft/></button>
      <div className="flex-1 min-w-0"><h2 className="font-black text-base truncate">{t.newGroup}</h2><p className="text-[11px] text-zinc-400 truncate">{step===1?t.choose:t.subject}</p></div>
      <button onClick={close} aria-label={language==="es"?"Cerrar":language==="pt"?"Fechar":"Close"} className="w-11 h-11 grid place-items-center text-zinc-400"><X/></button>
    </header>

    {step===1 ? <><div className="shrink-0 px-4 pt-3 pb-2 max-w-xl w-full mx-auto">
      <div className="h-11 px-3 rounded-xl bg-zinc-900 border border-white/10 flex items-center gap-2"><Search className="w-4 h-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} className="flex-1 bg-transparent outline-none min-w-0 text-sm"/></div>
      {chosenPeople.length>0&&<div className="flex gap-2 overflow-x-auto pt-3">{chosenPeople.map(p=><button key={p.id} onClick={()=>setChosen(v=>v.filter(x=>x.id!==p.id))} className="shrink-0 px-3 py-1.5 rounded-full bg-[#5C061F]/35 border border-[#E5BB70]/35 text-[#E5BB70] text-xs">{p.name} ×</button>)}</div>}
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold pt-3">{chosen.length} {t.selected}</div>
    </div>
    <main className="flex-1 min-h-0 overflow-y-auto px-4 max-w-xl w-full mx-auto">
      {loading ? <div className="text-zinc-500 py-10 text-center text-sm">{t.loading}</div> : filtered.length===0 ? <div className="text-zinc-500 py-10 text-center text-sm">{failed ? (language==="es"?"Búsqueda no disponible":language==="pt"?"Busca indisponível":"Search unavailable") : (query.trim().length<2 ? t.search : t.noPeople)}</div> : filtered.map(p=>{const active=chosen.some(person=>person.id===p.id);return <button type="button" aria-pressed={active} key={p.id} onClick={()=>setChosen(v=>active?v.filter(x=>x.id!==p.id):[...v,p])} className="w-full flex items-center gap-3 py-2.5 border-b border-white/5">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#68112b] to-[#23151b] grid place-items-center font-black text-sm shrink-0">{p.avatar?<img src={p.avatar} className="w-full h-full object-cover" alt=""/>:p.name[0]?.toUpperCase()}</div>
        <div className="flex-1 text-left min-w-0"><div className="font-semibold text-sm truncate">{p.name}</div></div>
        <div className={`w-6 h-6 rounded-full border grid place-items-center shrink-0 ${active?"bg-[#5C061F] border-[#E5BB70] text-black":"border-zinc-600"}`}>{active&&<Check className="w-4 h-4"/>}</div>
      </button>})}
    </main>
    <div className="shrink-0 px-4 pt-3 border-t border-white/10 bg-[#10060a]" style={{paddingBottom:"calc(12px + env(safe-area-inset-bottom))"}}><button onClick={()=>setStep(2)} className="w-full max-w-xl mx-auto block h-13 py-4 rounded-2xl bg-[#5C061F] text-white font-black">{t.next}</button></div>
    </> : <main className="flex-1 min-h-0 overflow-y-auto px-5 py-8 max-w-xl w-full mx-auto" style={{paddingBottom:"calc(24px + env(safe-area-inset-bottom))"}}>
      <button onClick={()=>photoRef.current?.click()} className="mx-auto w-24 h-24 rounded-full bg-zinc-900 border border-white/10 grid place-items-center text-[#E5BB70] overflow-hidden">{groupPhoto?<img src={groupPhoto} className="w-full h-full object-cover" alt=""/>:<Camera className="w-8 h-8"/>}<span className="sr-only">{t.photo}</span></button>
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){if(groupPhoto)URL.revokeObjectURL(groupPhoto);setGroupPhoto(URL.createObjectURL(f));}e.target.value=""}}/>
      <label className="block mt-8 text-sm font-bold text-zinc-300">{t.name}</label><input autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full h-14 rounded-2xl bg-zinc-900 border border-white/10 px-4 outline-none focus:border-[#E5BB70]"/>
      <label className="block mt-5 text-sm font-bold text-zinc-300">{t.desc}</label><textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-2xl bg-zinc-900 border border-white/10 p-4 outline-none focus:border-[#E5BB70] resize-none"/>
      <div className="mt-6 rounded-2xl bg-zinc-900/70 border border-white/10 p-4 flex items-center gap-3"><Users className="text-[#E5BB70]"/><div><div className="font-bold">{chosen.length+1} {language==="es"?"miembros":language==="pt"?"membros":"members"}</div><div className="text-xs text-zinc-500">{language==="es"?"Tú":language==="pt"?"Você":"You"} + {chosen.length}</div></div></div>
      <button disabled={!name.trim()||creating} onClick={finish} className="mt-8 w-full h-14 rounded-2xl bg-[#5C061F] disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-base">{creating?"…":t.create}</button>
    </main>}
  </div>;
}