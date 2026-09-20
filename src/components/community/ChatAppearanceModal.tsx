import React,{useEffect,useRef,useState}from"react";
import{ArrowLeft,Check,Image as ImageIcon,RotateCcw}from"lucide-react";

export type ChatPrefs={wallpaper:string;bubble:string};
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
export const readChatPrefs=(uid:string,gid:string):ChatPrefs=>{try{return JSON.parse(localStorage.getItem(chatPrefsKey(uid,gid))||"") as ChatPrefs}catch{return{wallpaper:"default",bubble:"#f97316"}}};
export const wallpaperCss=(id:string)=>WALLPAPERS.find(x=>x.id===id)?.css||WALLPAPERS[0].css;

export default function ChatAppearanceModal({uid,groupId,language,onClose,onChange}:{uid:string;groupId:string;language:string;onClose:()=>void;onChange:(p:ChatPrefs)=>void}){
 const L=(en:string,es:string,pt:string)=>language==="es"?es:language==="pt"?pt:en;
 const[prefs,setChatPrefs]=useState<ChatPrefs>(()=>readChatPrefs(uid,groupId));
 const file=useRef<HTMLInputElement>(null);
 const save=(p:ChatPrefs)=>{setChatPrefs(p);localStorage.setItem(chatPrefsKey(uid,groupId),JSON.stringify(p));onChange(p)};
 useEffect(()=>onChange(prefs),[]);
 const choosePhoto=(f?:File)=>{if(!f||!f.type.startsWith("image/")||f.size>4*1024*1024)return;const r=new FileReader();r.onload=()=>save({...prefs,wallpaper:String(r.result)});r.readAsDataURL(f)};
 return <div className="fixed inset-0 z-[150] bg-[#080808] text-white overflow-y-auto" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
  <header className="sticky top-0 z-10 h-16 px-3 bg-black/95 border-b border-white/10 flex items-center gap-3"><button onClick={onClose} aria-label="Back" className="w-11 h-11 grid place-items-center"><ArrowLeft/></button><b>{L("Chat appearance","Apariencia del chat","Aparência do chat")}</b></header>
  <section className="p-5"><div className="mb-6 rounded-3xl border border-white/10 p-4 overflow-hidden" style={{background:prefs.wallpaper.startsWith("data:image")?`url("${prefs.wallpaper}") center / cover`:wallpaperCss(prefs.wallpaper)}}><div className="text-[11px] uppercase tracking-widest text-white/60 mb-3">{L("Preview","Vista previa","Prévia")}</div><div className="flex justify-start"><div className="max-w-[78%] rounded-2xl rounded-tl-md bg-zinc-900/90 px-3 py-2 text-sm">{L("Prayer changes everything.","La oración cambia todo.","A oração muda tudo.")}</div></div><div className="mt-3 flex justify-end"><div className="max-w-[78%] rounded-2xl rounded-tr-md px-3 py-2 text-sm text-black font-medium" style={{background:prefs.bubble}}>{L("Amen 🙏","Amén 🙏","Amém 🙏")}</div></div></div><h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mb-3">{L("Wallpaper","Fondo","Plano de fundo")}</h2><div className="grid grid-cols-3 gap-3">{WALLPAPERS.map(w=><button key={w.id} onClick={()=>save({...prefs,wallpaper:w.id})} className="relative aspect-[3/4] rounded-2xl border border-white/10 overflow-hidden" style={{background:w.css}}>{prefs.wallpaper===w.id&&<span className="absolute inset-0 grid place-items-center"><span className="w-9 h-9 rounded-full bg-orange-500 text-black grid place-items-center"><Check/></span></span>}<span className="absolute bottom-1.5 inset-x-1 text-[10px] font-bold">{w.label}</span></button>)}</div>
  <button onClick={()=>file.current?.click()} className="mt-4 w-full h-13 py-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-2"><ImageIcon className="w-5 h-5"/>{L("Choose from Photos","Elegir de Fotos","Escolher das Fotos")}</button><input ref={file} className="hidden" type="file" accept="image/*" onChange={e=>{choosePhoto(e.target.files?.[0]);e.target.value=""}}/>
  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold mt-7 mb-3">{L("My message bubble","Color de mis mensajes","Cor das minhas mensagens")}</h2><div className="grid grid-cols-4 gap-4">{BUBBLES.map(c=><button key={c} onClick={()=>save({...prefs,bubble:c})} className="aspect-square rounded-full grid place-items-center border-2 border-white/10" style={{background:c}}>{prefs.bubble===c&&<Check className="text-white drop-shadow"/>}</button>)}</div>
  <button onClick={()=>save({wallpaper:"default",bubble:"#f97316"})} className="mt-8 w-full h-13 py-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5"/>{L("Reset to Prayer & Fire default","Restablecer Prayer & Fire","Redefinir Prayer & Fire")}</button></section>
 </div>;
}
