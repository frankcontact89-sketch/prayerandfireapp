import React from "react";
import { Home, MessageCircle, BookOpen, Library, ShoppingBag, Share2, Link2, Info, Settings as SettingsIcon, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { toast } from "@/hooks/use-toast";

type Page = string;

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (page: Page) => void;
  t: (key: any) => string;
  language: string;
}

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function AppDrawer({ open, onOpenChange, onNavigate, language }: AppDrawerProps) {
  if (!open) return null;

  const go = (page: string) => {
    onNavigate(page);
    onOpenChange(false);
  };

  const openCommunity = () => {
    onOpenChange(false);
    window.location.assign("/community");
  };

  const share = async () => {
    const title = "Prayer & Fire";
    const text = "Download Prayer & Fire and join a global movement of prayer and faith.";
    const url = "https://apps.apple.com/us/app/prayerandfire-mobile/id6757282653";
    onOpenChange(false);
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url, dialogTitle: title });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "App Store link copied.", duration: 2000 });
      }
    } catch (error: any) {
      if (!/abort|cancel/i.test(String(error?.message || error || ""))) {
        try { await navigator.clipboard.writeText(url); } catch {}
      }
    }
  };

  const items = [
    { id: "home", icon: Home, label: L(language, "Home", "Inicio", "Início"), action: () => go("home") },
    { id: "community", icon: MessageCircle, label: L(language, "Community", "Comunidad", "Comunidade"), action: openCommunity },
    { id: "bible", icon: BookOpen, label: L(language, "Bible", "Biblia", "Bíblia"), action: () => go("bible") },
    { id: "library", icon: Library, label: L(language, "Christian Library", "Biblioteca Cristiana", "Biblioteca Cristã"), action: () => go("library") },
    { id: "store", icon: ShoppingBag, label: L(language, "Store", "Tienda", "Loja"), action: () => go("shopping") },
    { id: "share", icon: Share2, label: L(language, "Share Prayer & Fire", "Compartir Prayer & Fire", "Compartilhar Prayer & Fire"), action: share },
    { id: "connect", icon: Link2, label: L(language, "Connect", "Conectar", "Conectar"), action: () => go("social") },
    { id: "about", icon: Info, label: L(language, "About", "Acerca de", "Sobre"), action: () => go("about") },
    { id: "settings", icon: SettingsIcon, label: L(language, "Settings", "Ajustes", "Ajustes"), action: () => go("settings") },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <aside
        onClick={e => e.stopPropagation()}
        className="h-full w-[86%] max-w-[390px] bg-black border-r border-zinc-800 shadow-2xl flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <h2 className="text-orange-500 text-xl font-black tracking-wide">PRAYER &amp; FIRE</h2>
          <button onClick={() => onOpenChange(false)} className="w-10 h-10 grid place-items-center rounded-full hover:bg-zinc-900"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto">
          {items.map(({ id, icon: Icon, label, action }) => (
            <button key={id} onClick={action} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left hover:bg-orange-500/10 active:bg-orange-500/15 transition">
              <Icon className="text-orange-500" size={24} />
              <span className="text-[17px] text-white">{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}
