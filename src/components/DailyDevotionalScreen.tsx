import React, { useEffect, useState } from "react";
import { Sunrise, Heart, Share2, BookOpen, HandHeart, Sparkles, ListChecks } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick, pickArr } from "./content/lang";
import { APP_CONFIG } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onBack: () => void;
  language: string;
}

export function DailyDevotionalScreen({ onBack, language }: Props) {
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    if (!row) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("favorites" as any)
        .select("id")
        .eq("user_id", u.user.id)
        .eq("item_type", "devotional")
        .eq("item_id", row.id)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [row]);

  const toggleFav = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (saved) {
      await supabase.from("favorites" as any).delete()
        .eq("user_id", u.user.id).eq("item_type", "devotional").eq("item_id", row.id);
      setSaved(false);
    } else {
      await supabase.from("favorites" as any).insert({
        user_id: u.user.id, item_type: "devotional", item_id: row.id,
      });
      setSaved(true);
    }
  };

  const share = async () => {
    if (!row) return;
    const title = pick(row, "title", language);
    const scripture = pick(row, "scripture_reference", language);
    const text = `${title}${scripture ? ` — ${scripture}` : ""}\n\n${APP_CONFIG.URL}`;
    try {
      if ((navigator as any).share) await (navigator as any).share({ title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: L(language, "Copied", "Copiado", "Copiado") });
      }
    } catch {}
  };

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
  const scriptureRef = pick(row, "scripture_reference", language);
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
            <p className="text-zinc-200 leading-relaxed">{context}</p>
          </section>
        )}

        {reflection && (
          <section>
            <H icon={<Sparkles className="w-3.5 h-3.5" />} en="REFLECTION" es="REFLEXIÓN" pt="REFLEXÃO" />
            <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{reflection}</p>
          </section>
        )}

        {application && (
          <section>
            <H icon={<Sparkles className="w-3.5 h-3.5" />} en="PRACTICAL APPLICATION" es="APLICACIÓN PRÁCTICA" pt="APLICAÇÃO PRÁTICA" />
            <p className="text-zinc-200 leading-relaxed">{application}</p>
          </section>
        )}

        {prayer && (
          <section className="rounded-2xl border border-orange-500/20 bg-zinc-950/70 p-4">
            <H icon={<HandHeart className="w-3.5 h-3.5" />} en="PRAYER" es="ORACIÓN" pt="ORAÇÃO" />
            <p className="text-zinc-200 leading-relaxed">{prayer}</p>
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
            <p className="text-zinc-300">{related.join(" • ")}</p>
          </section>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={toggleFav}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 font-medium transition ${
              saved
                ? "bg-orange-500 text-black border-orange-500"
                : "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            {saved
              ? L(language, "Saved", "Guardado", "Salvo")
              : L(language, "Save to Favorites", "Guardar en Favoritos", "Salvar nos Favoritos")}
          </button>
          <button
            onClick={share}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 text-white px-4 py-3 hover:bg-zinc-900"
          >
            <Share2 className="w-4 h-4" />
            {L(language, "Share", "Compartir", "Compartilhar")}
          </button>
        </div>
      </div>
    </SimpleScreen>
  );
}