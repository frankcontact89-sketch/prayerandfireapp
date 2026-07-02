import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";

const CATEGORY_LABELS: Record<string, [string, string, string]> = {
  bible_studies: ["Bible Studies", "Estudios Bíblicos", "Estudos Bíblicos"],
  doctrine: ["Doctrine", "Doctrina", "Doutrina"],
  christology: ["Christology", "Cristología", "Cristologia"],
  pneumatology: ["Pneumatology", "Pneumatología", "Pneumatologia"],
  soteriology: ["Soteriology", "Soteriología", "Soteriologia"],
  hermeneutics: ["Hermeneutics", "Hermenéutica", "Hermenêutica"],
  homiletics: ["Homiletics", "Homilética", "Homilética"],
  church_history: ["Church History", "Historia de la Iglesia", "História da Igreja"],
  apologetics: ["Apologetics", "Apologética", "Apologética"],
  leadership: ["Leadership", "Liderazgo", "Liderança"],
  missions: ["Missions", "Misiones", "Missões"],
  sermons: ["Sermons", "Sermones", "Sermões"],
  articles: ["Articles", "Artículos", "Artigos"],
};

interface Props {
  onBack: () => void;
  language: string;
  onOpenArticle: (id: string) => void;
}

export function ChristianLibraryScreen({ onBack, language, onOpenArticle }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("library_articles")
        .select("*")
        .eq("is_published", true)
        .order("category")
        .order("order_index");
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const title = L(language, "Christian Library", "Biblioteca Cristiana", "Biblioteca Cristã");

  if (loading) {
    return (
      <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  if (rows.length === 0) return null;

  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    (grouped[r.category] ||= []).push(r);
  }

  return (
    <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, list]) => {
          const labels = CATEGORY_LABELS[cat] || [cat, cat, cat];
          return (
            <section key={cat}>
              <h2 className="text-orange-400 uppercase tracking-[0.2em] text-[11px] font-bold mb-2">
                {L(language, labels[0], labels[1], labels[2])}
              </h2>
              <div className="space-y-2">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenArticle(a.id)}
                    className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 hover:border-orange-500/40 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white">{pick(a, "title", language)}</div>
                      {pick(a, "summary", language) && (
                        <div className="text-sm text-zinc-400 line-clamp-2 mt-0.5">
                          {pick(a, "summary", language)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </SimpleScreen>
  );
}