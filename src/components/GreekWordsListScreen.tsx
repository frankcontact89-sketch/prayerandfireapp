import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { L } from "./content/lang";

interface Props {
  onBack: () => void;
  onOpen: (slug: string) => void;
  language: string;
}

type Tab = "greek" | "hebrew" | "expression";

export function GreekWordsListScreen({ onBack, onOpen, language }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("greek");

  useEffect(() => {
    supabase.from("greek_words").select("*").order("order_index").then(({ data }) => setRows(data || []));
  }, []);

  const pick = (r: any, f: string) => r[`${f}_${language}`] || r[`${f}_en`];
  const counts = useMemo(() => {
    const c = { greek: 0, hebrew: 0, expression: 0 } as Record<Tab, number>;
    for (const r of rows) {
      const t = (r.language_type || "greek") as Tab;
      if (t in c) c[t] += 1;
    }
    return c;
  }, [rows]);
  const filtered = rows
    .filter((r) => (r.language_type || "greek") === tab)
    .filter((r) =>
      !q ||
      r.greek?.toLowerCase().includes(q.toLowerCase()) ||
      r.transliteration?.toLowerCase().includes(q.toLowerCase()) ||
      pick(r, "meaning")?.toLowerCase().includes(q.toLowerCase())
    );

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "greek",      label: L(language, "Greek", "Griego", "Grego") },
    { id: "hebrew",     label: L(language, "Hebrew", "Hebreo", "Hebraico") },
    { id: "expression", label: L(language, "Expressions", "Expresiones", "Expressões") },
  ];

  return (
    <SimpleScreen
      title={L(language, "Biblical Languages Library", "Biblioteca de Lenguas Bíblicas", "Biblioteca de Línguas Bíblicas")}
      subtitle={L(
        language,
        "Greek and Hebrew words and biblical expressions explained.",
        "Palabras griegas y hebreas y expresiones bíblicas explicadas.",
        "Palavras gregas e hebraicas e expressões bíblicas explicadas.",
      )}
      icon={<GraduationCap className="w-6 h-6" />}
      onBack={onBack}
    >
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                active
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
              <span className="ml-1 text-xs opacity-70">({counts[t.id]})</span>
            </button>
          );
        })}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={L(language, "Search…", "Buscar…", "Pesquisar…")}
        className="w-full h-11 rounded-xl bg-zinc-900 border border-zinc-800 px-4 text-white mb-4 focus:outline-none focus:border-orange-500"
      />
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-zinc-500 p-6">
            {L(language, "No entries yet.", "Aún no hay entradas.", "Ainda não há entradas.")}
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
                <div className="text-orange-400 font-black text-xl truncate">{r.greek}</div>
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