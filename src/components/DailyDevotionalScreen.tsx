import React, { useEffect, useState } from "react";
import { Sunrise, BookOpen, HandHeart, Sparkles, ListChecks } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick, pickArr } from "./content/lang";
import { MarkdownView } from "./content/MarkdownView";
import { ContentActions } from "./content/ContentActions";
import { localizeBibleRefs } from "@/lib/localize-bible-refs";

interface Props {
  onBack: () => void;
  language: string;
}

export function DailyDevotionalScreen({ onBack, language }: Props) {
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      let { data } = await supabase
        .from("devotionals")
        .select("*")
        .eq("is_published", true)
        .eq("date", today)
        .maybeSingle();
      if (!data) {
        const res = await supabase
          .from("devotionals")
          .select("*")
          .eq("is_published", true)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        data = res.data as any;
      }
      setRow(data);
      setLoading(false);
    })();
  }, []);

  const title = L(language, "Daily Devotional", "Devocional Diario", "Devocional Diário");

  if (loading) {
    return (
      <SimpleScreen title={title} icon={<Sunrise className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  if (!row) return null; // hidden if no content

  const dateStr = new Date(row.date).toLocaleDateString(
    language === "es" ? "es" : language === "pt" ? "pt-BR" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
  const context = pick(row, "context", language);
  const reflection = pick(row, "reflection", language);
  const application = pick(row, "application", language);
  const prayer = pick(row, "prayer", language);
  const questions = pickArr(row, "questions", language);
  const related: string[] = Array.isArray(row.related_verses) ? row.related_verses : [];
  const scriptureRef = localizeBibleRefs(pick(row, "scripture_reference", language), language);
  const scriptureText = pick(row, "scripture_text", language);

  const H = ({ icon, en, es, pt }: any) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-orange-400">{icon}</span>
      <p className="text-orange-400 uppercase tracking-[0.2em] text-[10px] font-bold">
        {L(language, en, es, pt)}
      </p>
    </div>
  );

  return (
    <SimpleScreen title={title} icon={<Sunrise className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-5">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">{dateStr}</div>
          <h2 className="text-2xl font-extrabold mt-1">{pick(row, "title", language)}</h2>
        </div>

        {(scriptureRef || scriptureText) && (
          <section className="rounded-2xl border border-orange-500/20 bg-zinc-950/70 p-4">
            <H icon={<BookOpen className="w-3.5 h-3.5" />} en="SCRIPTURE" es="ESCRITURA" pt="ESCRITURA" />
            {scriptureText && <p className="text-white text-[15px] leading-relaxed">"{scriptureText}"</p>}
            {scriptureRef && <p className="text-orange-400 text-sm font-bold mt-2">— {scriptureRef}</p>}
          </section>
        )}

        {context && (
          <section>
            <H icon={<Sparkles className="w-3.5 h-3.5" />} en="CONTEXT" es="CONTEXTO" pt="CONTEXTO" />
            <MarkdownView text={context} language={language} />
          </section>
        )}

        {reflection && (
          <section>
            <H icon={<Sparkles className="w-3.5 h-3.5" />} en="REFLECTION" es="REFLEXIÓN" pt="REFLEXÃO" />
            <MarkdownView text={reflection} language={language} />
          </section>
        )}

        {application && (
          <section>
            <H icon={<Sparkles className="w-3.5 h-3.5" />} en="PRACTICAL APPLICATION" es="APLICACIÓN PRÁCTICA" pt="APLICAÇÃO PRÁTICA" />
            <MarkdownView text={application} language={language} />
          </section>
        )}

        {prayer && (
          <section className="rounded-2xl border border-orange-500/20 bg-zinc-950/70 p-4">
            <H icon={<HandHeart className="w-3.5 h-3.5" />} en="PRAYER" es="ORACIÓN" pt="ORAÇÃO" />
            <MarkdownView text={prayer} language={language} />
          </section>
        )}

        {questions.length > 0 && (
          <section>
            <H icon={<ListChecks className="w-3.5 h-3.5" />} en="REFLECTION QUESTIONS" es="PREGUNTAS DE REFLEXIÓN" pt="PERGUNTAS DE REFLEXÃO" />
            <ol className="list-decimal pl-5 space-y-1 text-zinc-200">
              {questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </section>
        )}

        {related.length > 0 && (
          <section>
            <H icon={<BookOpen className="w-3.5 h-3.5" />} en="RELATED VERSES" es="VERSÍCULOS RELACIONADOS" pt="VERSÍCULOS RELACIONADOS" />
            <p className="text-zinc-300">{related.map((r) => localizeBibleRefs(r, language)).join(" • ")}</p>
          </section>
        )}

        <ContentActions
          itemType="devotional"
          itemId={row.id}
          title={pick(row, "title", language)}
          shareText={scriptureRef}
          language={language}
        />
      </div>
    </SimpleScreen>
  );
}