import React from "react";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";

interface GivingScreenProps {
  t: (key: string) => string;
  language?: string;
}

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function GivingScreen({ t, language = "en" }: GivingScreenProps) {
  return (
    <div className="px-4 pt-1 pb-16 bg-black text-white max-w-[430px] md:max-w-[680px] lg:max-w-[820px] mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-3">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-[13px] text-orange-400 font-semibold tracking-wide uppercase">
            {L(language, "Prayer & Fire Global Mission", "Misión Global Prayer & Fire", "Missão Global Prayer & Fire")}
          </span>
        </div>

        <h1 className="text-[30px] font-extrabold tracking-tight mb-2">
          {L(language, "Pray With the Mission", "Ora con la Misión", "Ore com a Missão")}
        </h1>

        <p className="text-zinc-300 text-[15px] leading-relaxed max-w-sm mx-auto">
          {L(
            language,
            "Join us in prayer for churches, missionaries, families, and nations around the world.",
            "Únete a nosotros en oración por iglesias, misioneros, familias y naciones alrededor del mundo.",
            "Junte-se a nós em oração por igrejas, missionários, famílias e nações ao redor do mundo."
          )}
        </p>
      </div>

      <Card className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-[22px] font-semibold mb-3">
          {L(language, "Your Prayer Matters", "Tu Oración Importa", "Sua Oração Importa")}
        </h2>
        <p className="text-zinc-300 text-[15px] leading-relaxed">
          {L(
            language,
            "Prayer & Fire app features and digital content are available without requiring a donation or external payment. Thank you for standing with the mission in prayer.",
            "Las funciones y el contenido digital de la app Prayer & Fire están disponibles sin requerir una donación ni un pago externo. Gracias por apoyar la misión en oración.",
            "Os recursos e o conteúdo digital do app Prayer & Fire estão disponíveis sem exigir doação ou pagamento externo. Obrigado por apoiar a missão em oração."
          )}
        </p>
      </Card>
    </div>
  );
}
