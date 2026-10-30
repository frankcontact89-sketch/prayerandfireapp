import React from "react";
import { X } from "lucide-react";

export const CURATED_REACTION_EMOJIS = [
  // Faith
  "🙏","✝️","🕊️","⛪","📖","🔥","✨","😇","🤍","🌟",
  // Faces & expressions
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","🙂","🙃","😉","😍","🥰","😘","😋","😜","🤓","😎","🥳","😏","😔","😟","🙁","🥺","😢","😭","😤","😳","😱","😨","😥","🤗","🤔","🤭","🤫","😶","😐","😬","🙄","😮","😲","😴","🤤","😪","🤧","😷","🤒",
  // Hands & people
  "👍","👎","👏","🙌","👐","🤲","🤝","✌️","🤞","🤟","👌","👈","👉","👆","👇","☝️","✋","🤚","🖐️","👋","🤙","💪","🫶","🧎","🚶","🤱","👶","👦","👧","👨","👩","🧑","👴","👵","👨‍👩‍👧","💃","🕺",
  // Hearts
  "❤️","🧡","💛","💚","💙","💜","🤎","🖤","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","💯",
  // Nature & weather
  "🌈","☀️","🌤️","⛅","🌧️","❄️","🌊","🌱","🌿","🍀","🌻","🌹","🌷","🌸","🌺","🌳","🌲","🌴","🍃","🌾","🌙","⭐","💫","⛰️","🏝️",
  // Animals
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🐴","🐝","🦋","🐞","🐢","🐬","🐳","🐟","🐑","🐐","🦌","🐕","🐈","🐇",
  // Food & drink
  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🥦","🥕","🌽","🍞","🥖","🧀","🥚","🍳","🥞","🍔","🍟","🍕","🥪","🌮","🥗","🍝","🍜","🍲","🍣","🍤","🍚","🍦","🍰","🎂","🍫","🍿","🍩","🍪","☕","🍵","🧃","🥤","🍯",
  // Flags
  "🏳️","🇺🇸","🇨🇦","🇲🇽","🇬🇹","🇸🇻","🇭🇳","🇳🇮","🇨🇷","🇵🇦","🇨🇺","🇩🇴","🇵🇷","🇭🇹","🇯🇲","🇨🇴","🇻🇪","🇪🇨","🇵🇪","🇧🇴","🇧🇷","🇨🇱","🇦🇷","🇺🇾","🇵🇾","🇪🇸","🇵🇹","🇬🇧","🇫🇷","🇮🇹","🇩🇪","🇳🇱","🇮🇪","🇵🇱","🇷🇴","🇬🇷","🇺🇦","🇷🇺","🇹🇷","🇮🇱","🇿🇦","🇳🇬","🇬🇭","🇰🇪","🇪🇹","🇦🇴","🇲🇿","🇨🇻","🇮🇳","🇵🇭","🇰🇷","🇯🇵","🇨🇳","🇦🇺","🇳🇿"
];

type Props = { open:boolean; selected?:string; title:string; onClose:()=>void; onPick:(emoji:string)=>void };

export default function ReactionEmojiPicker({open,selected,title,onClose,onPick}:Props){
  if(!open)return null;
  return <div className="fixed inset-0 z-[70] bg-black/75 flex items-end" onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} className="w-full max-h-[78vh] rounded-t-3xl bg-zinc-950 border-t border-white/10 flex flex-col pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10"><b className="text-white text-lg">{title}</b><button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center text-white"><X className="w-5 h-5"/></button></div>
      <div className="px-4 pt-3 pb-2 border-b border-white/10">
        <p className="text-xs text-zinc-400 mb-2">Quick reactions</p>
        <div className="flex items-center justify-between gap-1">
          {["🙏","🔥","❤️","👍","✨","😂"].map(emoji=><button type="button" key={emoji} onClick={()=>onPick(emoji)} aria-label={`React with ${emoji}`} aria-pressed={selected===emoji} className={`h-11 min-w-11 rounded-full text-2xl grid place-items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${selected===emoji?"bg-amber-400/20 border-amber-300":"bg-zinc-900 border-white/10"}`}>{emoji}</button>)}
        </div>
      </div>
      <div className="overflow-y-auto overscroll-contain p-4"><div className="grid grid-cols-6 sm:grid-cols-8 gap-2">{CURATED_REACTION_EMOJIS.map((emoji,index)=><button type="button" key={`${emoji}-${index}`} onClick={()=>onPick(emoji)} aria-label={`React with ${emoji}`} aria-pressed={selected===emoji} className={`min-h-11 min-w-0 aspect-square rounded-xl text-2xl grid place-items-center border active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${selected===emoji?"bg-amber-400/20 border-amber-300":"bg-zinc-900/70 border-white/5"}`}>{emoji}</button>)}</div></div>
    </div>
  </div>;
}
