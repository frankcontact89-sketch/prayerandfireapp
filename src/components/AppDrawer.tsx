import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Home, BookOpen, Library,
  ShoppingBag, Share2, Info, HandHeart, Settings as SettingsIcon, Link2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Page = string;

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNavigate: (page: Page) => void;
  t: (k: any) => string;
  language: string;
}

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function AppDrawer({ open, onOpenChange, onNavigate, language }: AppDrawerProps) {
  const go = (page: string) => {
    onNavigate(page);
    onOpenChange(false);
  };

  const share = async () => {
    const title = "Prayer & Fire";
    const message = "Download Prayer & Fire and join a global movement of prayer and faith.";
    const appStoreUrl = "https://apps.apple.com/us/app/prayerandfire-mobile/id6757282653";

    // Close the drawer first so its focus trap/overlay doesn't block the share sheet
    onOpenChange(false);
    await new Promise((r) => setTimeout(r, 250));

    const copyFallback = async () => {
      try {
        await navigator.clipboard.writeText(appStoreUrl);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = appStoreUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
      toast({ title: "App Store link copied.", duration: 2000 });
    };

    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor?.isNativePlatform?.()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title, text: message, url: appStoreUrl, dialogTitle: title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, text: message, url: appStoreUrl });
        return;
      }
      await copyFallback();
    } catch (error: any) {
      const msg = String(error?.message || error || "");
      if (/abort|cancel/i.test(msg)) return; // user dismissed the share sheet
      await copyFallback();
    }
  };

  const item = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-orange-500/10 active:bg-orange-500/20 transition text-left"
    >
      <span className="text-orange-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-[340px] bg-black border-r border-zinc-800 p-0 flex flex-col"
      >
        <SheetHeader className="p-5 border-b border-zinc-800 shrink-0" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}>
          <SheetTitle className="text-left text-orange-500 font-black tracking-wide">
            PRAYER &amp; FIRE
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {item(<Home className="w-5 h-5" />, L(language, "Home", "Inicio", "Início"), () => go("home"))}
          {item(<BookOpen className="w-5 h-5" />, L(language, "Bible", "Biblia", "Bíblia"), () => go("bible"))}
          {item(<Library className="w-5 h-5" />, L(language, "Christian Library", "Biblioteca Cristiana", "Biblioteca Cristã"), () => go("library"))}
          {item(<ShoppingBag className="w-5 h-5" />, L(language, "Store", "Tienda", "Loja"), () => go("shopping"))}
          {item(<HandHeart className="w-5 h-5" />, L(language, "Support Prayer & Fire", "Apoyar Prayer & Fire", "Apoiar Prayer & Fire"), () => go("giving"))}
          {item(<Share2 className="w-5 h-5" />, L(language, "Share Prayer & Fire", "Compartir Prayer & Fire", "Compartilhar Prayer & Fire"), share)}
          {item(<Link2 className="w-5 h-5" />, L(language, "Connect", "Conectar", "Conectar"), () => go("social"))}
          {item(<Info className="w-5 h-5" />, L(language, "About", "Acerca de", "Sobre"), () => go("about"))}
          {item(<SettingsIcon className="w-5 h-5" />, L(language, "Settings", "Ajustes", "Ajustes"), () => go("settings"))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}