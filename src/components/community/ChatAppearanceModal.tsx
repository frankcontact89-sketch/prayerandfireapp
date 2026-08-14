import React,{useEffect,useRef,useState}from"react";
import{ArrowLeft,Check,Image as ImageIcon,RotateCcw}from"lucide-react";

type Prefs={wallpaper:string;bubble:string};
const WALLPAPERS=[
 {id:"default",label:"Prayer & Fire",css:"linear-gradient(160deg,#090909,#17100b 55%,#080808)"},
 {id:"ember",label:"Ember",css:"radial-gradient(circle at 25% 15%,#3b1607 0,#120b08 38%,#050505 80%)"},
 {id:"midnight",label:"Midnight",css:"linear-gradient(145deg,#071426,#111827,#05070a)"},
 {id:"stone",label:"Stone",css:"linear-gradient(145deg,#292524,#0f0f0f,#1c1917)"},
 {id:"forest",label:"Forest",css:"linear-gradient(145deg,#052e16,#0b1f16,#050505)"},
 {id:"plum",label:"Plum",css:"linear-gradient(145deg,#2e1065,#170b2e,#080808)"}
];
const BUBBLES=["#f97316","#2563eb","#0f766e","#7c3aed","#be123c","#3f3f46","#15803d","#a16207"];
export const chatPrefsKey=(uid:string,gid:string)=>`pf-chat-prefs:${uid}:${gid}`;
export const readChatPrefs=(uid:string,gid:string):Prefs=>{try{return JSON.parse(localStorage.getItem(chatPrefsKey(uid,gid))||"") as Prefs}catch{return{wallpaper:"default",bubble:"#f97316"}}};
export const wallpaperCss=(id:string)=>WALLPAPERS.find(x=>x.id===id)?.css||WALLPAPERS[0].css;

export default function ChatAppearanceModal({uid,groupId,onClose,onChange}:{uid:string;groupId:string;onClose:()=>void;onChange:(p:Prefs)=>void}){
 const[prefs,setPrefs]=useState<Prefs>(()=>readChatPrefs(uid,groupId));
 const file=useRef<HTMLInputElement>(null);
 const save=(p:Prefs)=>{setPrefs(p);localStorage.setItem(chatPrefsKey(uid,groupId),JSON.stringify(p));onChange(p)};
 useEffect(()=>onChange(prefs),[]);
 const choosePhoto=(f?:File)=>{if(!f||!f.type.startsWith("image/")||f.size>4*1024*1024)return;const r=new FileReader();r.onload=()=>save({...prefs,wallpaper:String(r.result)});r.readAsDataURL(f)};
 return <div className="fixed inset-0 z-[150] bg-[#080808] text-white overflow-y-auto" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
  <header className="sticky top-0 z-10 h-16 px-3 bg-black/95 border-b border-white/10 flex items-center gap-3"><button onClick={onClose} className="w-10 h-10 grid place-items-center"><ArrowLeft/></button><b>Chat appearance</b></header>
  <section className="p-5"><h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-3">Wallpaper</h2><div className="grid grid-cols-3 gap-3">{WALLPAPERS.map(w=><button key={w.id} onClick={()=>save({...prefs,wallpaper:w.id})} className="relative aspect-[3/4] rounded-2xl border border-white/10 overflow-hidden" style={{background:w.css}}>{prefs.wallpaper===w.id&&<span className="absolute inset-0 grid place-items-center"><span className="w-9 h-9 rounded-full bg-orange-500 text-black grid place-items-center"><Check/></span></span>}<span className="absolute bottom-1.5 inset-x-1 text-[10px] font-bold">{w.label}</span></button>)}</div>
  <button onClick={()=>file.current?.click()} className="mt-4 w-full h-13 py-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-2"><ImageIcon className="w-5 h-5"/>Choose from Photos</button><input ref={file} className="hidden" type="file" accept="image/*" onChange={e=>{choosePhoto(e.target.files?.[0]);e.target.value=""}}/>
  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mt-7 mb-3">My message bubble</h2><div className="grid grid-cols-4 gap-4">{BUBBLES.map(c=><button key={c} onClick={()=>save({...prefs,bubble:c})} className="aspect-square rounded-full grid place-items-center border-2 border-white/10" style={{background:c}}>{prefs.bubble===c&&<Check className="text-white drop-shadow"/>}</button>)}</div>
  <button onClick={()=>save({wallpaper:"default",bubble:"#f97316"})} className="mt-8 w-full h-13 py-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5"/>Reset to Prayer & Fire default</button></section>
 </div>;
}
