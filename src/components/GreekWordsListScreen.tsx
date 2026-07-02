import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";

interface Props {
  onBack: () => void;
  onOpen: (slug: string) => void;
  language: string;
}

export function GreekWordsListScreen({ onBack, onOpen, language }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("greek_words").select("*").order("order_index").then(({ data }) => setRows(data || []));
  }, []);

  const pick = (r: any, f: string) => r[`${f}_${language}`] || r[`${f}_en`];
  const filtered = rows.filter((r) =>
    !q ||
    r.greek?.toLowerCase().includes(q.toLowerCase()) ||
    r.transliteration?.toLowerCase().includes(q.toLowerCase()) ||
    pick(r, "meaning")?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <SimpleScreen
      title={language === "es" ? "Palabras Griegas" : language === "pt" ? "Palavras Gregas" : "Greek Words"}
      subtitle={language === "es" ? "50 palabras griegas que todo cristiano debería conocer." : language === "pt" ? "50 palavras gregas que todo cristão deveria conhecer." : "50 Greek words every Christian should know."}
      icon={<GraduationCap className="w-6 h-6" />}
      onBack={onBack}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={language === "es" ? "Buscar…" : language === "pt" ? "Pesquisar…" : "Search…"}
        className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 px-4 text-white mb-4 focus:outline-none focus:border-orange-500"
      />
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-zinc-500 p-6">
            {language === "es" ? "No hay resultados." : language === "pt" ? "Sem resultados." : "No results."}
          </div>
        )}
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpen(r.slug)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-orange-500/20 bg-zinc-950/60 hover:bg-orange-500/5 text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="text-orange-400 font-black text-xl">{r.greek}</div>
                <div className="text-zinc-400 text-sm italic">{r.transliteration}</div>
              </div>
              <div className="text-zinc-300 text-sm truncate">{pick(r, "meaning")}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
          </button>
        ))}
      </div>
    </SimpleScreen>
  );
}