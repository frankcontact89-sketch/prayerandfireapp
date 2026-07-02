import React from "react";
import { HandHeart, Heart, Library as LibraryIcon, Sunrise, CalendarDays, Info } from "lucide-react";
import { SimpleScreen, ComingSoonBlock } from "./SimpleScreen";
import { APP_CONFIG } from "@/config/constants";

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function PrayerScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "Prayer", "Oración", "Oração")}
      icon={<HandHeart className="w-6 h-6" />}
      onBack={onBack}
      subtitle={L(language,
        "A quiet space to write, save, and remember what you are lifting up before God.",
        "Un espacio para escribir, guardar y recordar lo que presentas ante Dios.",
        "Um espaço para escrever, guardar e lembrar do que você apresenta a Deus."
      )}
    >
      <ComingSoonBlock text={L(language,
        "Personal prayer journal is coming soon. Meanwhile, use today's prayer on the Home screen.",
        "El diario de oración personal llegará pronto. Mientras tanto, usa la oración de hoy en Inicio.",
        "O diário de oração pessoal chegará em breve. Enquanto isso, use a oração de hoje no Início."
      )} />
    </SimpleScreen>
  );
}

export function FavoritesScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "Favorites", "Favoritos", "Favoritos")}
      icon={<Heart className="w-6 h-6" />}
      onBack={onBack}
    >
      <ComingSoonBlock text={L(language,
        "Bookmark verses, devotionals and Greek words to find them all here.",
        "Guarda versículos, devocionales y palabras griegas para encontrarlos todos aquí.",
        "Salve versículos, devocionais e palavras gregas para encontrá-los todos aqui."
      )} />
    </SimpleScreen>
  );
}

export function LibraryScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "Library", "Biblioteca", "Biblioteca")}
      icon={<LibraryIcon className="w-6 h-6" />}
      onBack={onBack}
      subtitle={L(language,
        "Bible studies, articles, and teaching resources.",
        "Estudios bíblicos, artículos y recursos de enseñanza.",
        "Estudos bíblicos, artigos e recursos de ensino."
      )}
    >
      <ComingSoonBlock text={L(language,
        "Content will appear here once added in the Admin Panel.",
        "El contenido aparecerá aquí una vez agregado en el Panel de Administración.",
        "O conteúdo aparecerá aqui assim que for adicionado no Painel de Administração."
      )} />
    </SimpleScreen>
  );
}

export function DevotionalScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "Daily Devotional", "Devocional Diario", "Devocional Diário")}
      icon={<Sunrise className="w-6 h-6" />}
      onBack={onBack}
    >
      <ComingSoonBlock text={L(language,
        "Daily devotionals will appear here as administrators publish them.",
        "Los devocionales diarios aparecerán aquí a medida que los administradores los publiquen.",
        "Os devocionais diários aparecerão aqui à medida que forem publicados."
      )} />
    </SimpleScreen>
  );
}

export function ReadingPlanScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "Daily Reading Plan", "Plan de Lectura Diario", "Plano de Leitura Diário")}
      icon={<CalendarDays className="w-6 h-6" />}
      onBack={onBack}
    >
      <ComingSoonBlock text={L(language,
        "Structured Bible reading plans will appear here.",
        "Los planes de lectura bíblica estructurados aparecerán aquí.",
        "Os planos estruturados de leitura bíblica aparecerão aqui."
      )} />
    </SimpleScreen>
  );
}

export function AboutScreen({ onBack, language }: { onBack: () => void; language: string }) {
  return (
    <SimpleScreen
      title={L(language, "About", "Acerca de", "Sobre")}
      icon={<Info className="w-6 h-6" />}
      onBack={onBack}
    >
      <div className="space-y-4 text-zinc-200 leading-relaxed">
        <p>{APP_CONFIG.APP_DESCRIPTION}</p>
        <p className="text-zinc-400 text-sm">
          {L(language,
            "Prayer & Fire exists to connect believers around the world in prayer, Scripture, and worship.",
            "Prayer & Fire existe para conectar a los creyentes de todo el mundo en oración, Escritura y adoración.",
            "Prayer & Fire existe para conectar crentes ao redor do mundo em oração, Escritura e adoração."
          )}
        </p>
        <div className="pt-3 border-t border-zinc-800 text-sm text-zinc-400">
          <div>{APP_CONFIG.URL}</div>
          <div className="mt-1">{APP_CONFIG.SUPPORT_EMAIL}</div>
        </div>
      </div>
    </SimpleScreen>
  );
}