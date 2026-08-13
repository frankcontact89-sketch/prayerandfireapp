import React from "react";
import { Home, MessageCircle, BookOpen, Library, ShoppingBag, Share2, Link, Info, Settings, X } from "lucide-react";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  t: (key: string) => string;
}

export function AppDrawer({ isOpen, onClose, onNavigate }: AppDrawerProps) {
  if (!isOpen) return null;
  const items = [
    ["home", Home, "Home"],
    ["chat", MessageCircle, "Community"],
    ["bible", BookOpen, "Bible"],
    ["library", Library, "Christian Library"],
    ["store", ShoppingBag, "Store"],
    ["share", Share2, "Share Prayer & Fire"],
    ["connect", Link, "Connect"],
    ["about", Info, "About"],
    ["settings", Settings, "Settings"],
  ] as const;
  return <div className="fixed inset-0 z-[100] bg-black/70" onClick={onClose}>
    <aside onClick={e=>e.stopPropagation()} className="h-full w-[86%] max-w-[390px] bg-background border-r border-border shadow-2xl flex flex-col pt-[max(env(safe-area-inset-top),20px)]">
      <div className="px-6 py-5 flex items-center justify-between border-b border-border"><h2 className="text-primary text-xl font-bold tracking-wide">PRAYER &amp; FIRE</h2><button onClick={onClose} className="p-2"><X/></button></div>
      <nav className="p-4 space-y-1 overflow-y-auto">{items.map(([id,Icon,label])=><button key={id} onClick={()=>{onNavigate(id);onClose();}} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left hover:bg-card active:bg-card transition"><Icon className="text-primary" size={23}/><span className="text-[17px]">{label}</span></button>)}</nav>
    </aside>
  </div>;
}
