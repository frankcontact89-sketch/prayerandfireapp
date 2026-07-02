import React from "react";
import { Info } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { APP_CONFIG } from "@/config/constants";

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
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