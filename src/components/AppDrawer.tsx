import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Home, BookOpen, HandHeart, Heart, Library, Sunrise, CalendarDays,
  Landmark, GraduationCap, ShoppingBag, Share2, Info, Settings as SettingsIcon,
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

const SOLAS = [
  { slug: "sola-scriptura", label: "Sola Scriptura" },
  { slug: "sola-fide", label: "Sola Fide" },
  { slug: "sola-gratia", label: "Sola Gratia" },
  { slug: "solus-christus", label: "Solus Christus" },
  { slug: "soli-deo-gloria", label: "Soli Deo Gloria" },
];

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function AppDrawer({ open, onOpenChange, onNavigate, language }: AppDrawerProps) {
  const [solasOpen, setSolasOpen] = useState(false);
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
          {item(<HandHeart className="w-5 h-5" />, L(language, "Prayer", "Oración", "Oração"), () => go("prayer"))}
          {item(<Heart className="w-5 h-5" />, L(language, "Favorites", "Favoritos", "Favoritos"), () => go("favorites"))}
          {item(<Library className="w-5 h-5" />, L(language, "Library", "Biblioteca", "Biblioteca"), () => go("library"))}
          {item(<Sunrise className="w-5 h-5" />, L(language, "Daily Devotional", "Devocional Diario", "Devocional Diário"), () => go("devotional"))}
          {item(<CalendarDays className="w-5 h-5" />, L(language, "Daily Reading Plan", "Plan de Lectura Diario", "Plano de Leitura Diário"), () => go("reading-plan"))}

          <Collapsible open={solasOpen} onOpenChange={setSolasOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-orange-500/10 transition">
              <Landmark className="w-5 h-5 text-orange-500" />
              <span className="font-medium flex-1 text-left">
                {L(language, "The Five Solas", "Los Cinco Solas", "Os Cinco Solas")}
              </span>
              {solasOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1 mt-1">
              {SOLAS.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => go(`sola:${s.slug}`)}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm text-zinc-300 hover:text-orange-400 hover:bg-orange-500/5"
                >
                  • {s.label}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={greekOpen} onOpenChange={setGreekOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-orange-500/10 transition">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <span className="font-medium flex-1 text-left">
                {L(language, "50 Greek Words", "50 Palabras Griegas", "50 Palavras Gregas")}
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