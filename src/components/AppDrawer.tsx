import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Home, BookOpen, Library, User as UserIcon,
  GraduationCap, ShoppingBag, Share2, Info, Settings as SettingsIcon,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { APP_CONFIG } from "@/config/constants";

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
  const [greekOpen, setGreekOpen] = useState(false);

  const go = (page: string) => {
    onNavigate(page);
    onOpenChange(false);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: APP_CONFIG.APP_NAME,
          text: APP_CONFIG.SHARE_TEXT,
          url: APP_CONFIG.URL,
        });
      } else {
        await navigator.clipboard.writeText(`${APP_CONFIG.SHARE_TEXT} ${APP_CONFIG.URL}`);
      }
    } catch {}
    onOpenChange(false);
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
          {item(<UserIcon className="w-5 h-5" />, L(language, "Profile", "Perfil", "Perfil"), () => go("profile"))}

          <Collapsible open={greekOpen} onOpenChange={setGreekOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-orange-500/10 transition">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <span className="font-medium flex-1 text-left">
                {L(language, "Biblical Languages Library", "Biblioteca de Lenguas Bíblicas", "Biblioteca de Línguas Bíblicas")}
              </span>
              {greekOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 mt-1">
              <button
                onClick={() => go("greek-words")}
                className="w-full text-left px-4 py-2 rounded-lg text-sm text-orange-400 hover:bg-orange-500/5"
              >
                {L(language, "Browse all words →", "Ver todas las palabras →", "Ver todas as palavras →")}
              </button>
            </CollapsibleContent>
          </Collapsible>

          {item(<ShoppingBag className="w-5 h-5" />, L(language, "Store", "Tienda", "Loja"), () => go("shopping"))}
          {item(<Share2 className="w-5 h-5" />, L(language, "Share Prayer & Fire", "Compartir Prayer & Fire", "Compartilhar Prayer & Fire"), share)}
          {item(<Info className="w-5 h-5" />, L(language, "About", "Acerca de", "Sobre"), () => go("about"))}
          {item(<SettingsIcon className="w-5 h-5" />, L(language, "Settings", "Ajustes", "Configurações"), () => go("settings"))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}