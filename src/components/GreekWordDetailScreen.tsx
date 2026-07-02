import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Volume2 } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { MarkdownView } from "./content/MarkdownView";
import { ContentActions } from "./content/ContentActions";

interface Props { slug: string; onBack: () => void; language: string; }

export function GreekWordDetailScreen({ slug, onBack, language }: Props) {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("greek_words").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      setRow(data); setLoading(false);
    });
  }, [slug]);

  const pick = (f: string) => row?.[`${f}_${language}`] || row?.[`${f}_en`] || "";
  if (loading) return <SimpleScreen title="…" onBack={onBack}><div /></SimpleScreen>;
  if (!row) return <SimpleScreen title="Not found" onBack={onBack}><p className="text-zinc-400">Not available.</p></SimpleScreen>;

  const labels = language === "es"
    ? { tr: "Transliteración", pr: "Pronunciación", ipa: "IPA", me: "Significado", lit: "Sentido literal", bib: "Sentido bíblico", hist: "Contexto histórico", us: "Uso bíblico", sc: "Referencias", rel: "Palabras relacionadas", app: "Aplicación práctica", ex: "Explicación", play: "Escuchar" }
    : language === "pt"
    ? { tr: "Transliteração", pr: "Pronúncia", ipa: "IPA", me: "Significado", lit: "Sentido literal", bib: "Sentido bíblico", hist: "Contexto histórico", us: "Uso bíblico", sc: "Referências", rel: "Palavras relacionadas", app: "Aplicação prática", ex: "Explicação", play: "Ouvir" }
    : { tr: "Transliteration", pr: "Pronunciation", ipa: "IPA", me: "Meaning", lit: "Literal meaning", bib: "Biblical meaning", hist: "Historical background", us: "Biblical usage", sc: "Scripture references", rel: "Related words", app: "Practical application", ex: "Explanation", play: "Listen" };

  const playAudio = () => {
    try {
      const u = new SpeechSynthesisUtterance(row.transliteration || row.greek);
      const type = row.language_type || "greek";
      u.lang = type === "hebrew" ? "he-IL" : type === "greek" ? "el-GR" : "en-US";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const section = (label: string, text: string) => text ? (
    <section className="mb-5">
      <h2 className="text-orange-400 uppercase tracking-[0.15em] text-xs font-black mb-2">{label}</h2>
      <MarkdownView text={text} language={language} />
    </section>
  ) : null;

  return (
    <SimpleScreen title={row.greek} icon={<GraduationCap className="w-6 h-6" />} onBack={onBack}>
      <div className="mb-6 pb-4 border-b border-orange-500/20">
        <div className="text-zinc-400 text-xs uppercase tracking-widest">{labels.tr}</div>
        <div className="text-xl italic text-white mt-1">{row.transliteration}</div>
        {row.pronunciation && (<>
          <div className="text-zinc-400 text-xs uppercase tracking-widest mt-3">{labels.pr}</div>
          <div className="text-lg text-white mt-1">/{row.pronunciation}/</div>
        </>)}
        {row.ipa && (<>
          <div className="text-zinc-400 text-xs uppercase tracking-widest mt-3">{labels.ipa}</div>
          <div className="text-lg text-white mt-1 font-mono">[{row.ipa}]</div>
        </>)}
        <button
          onClick={playAudio}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-sm font-semibold"
        >
          <Volume2 className="w-4 h-4" /> {labels.play}
        </button>
      </div>
      {section(labels.me, pick("meaning"))}
      {section(labels.lit, pick("literal_meaning"))}
      {section(labels.bib, pick("biblical_meaning"))}
      {section(labels.hist, pick("historical_background"))}
      {section(labels.us, pick("biblical_usage"))}
      {section(labels.sc, row.scripture_refs)}
      {section(labels.rel, row.related_words)}
      {section(labels.app, pick("practical_application"))}
      {section(labels.ex, pick("explanation"))}
      <ContentActions
        itemType="greek_word"
        itemId={row.id}
        title={`${row.greek} — ${row.transliteration}`}
        language={language}
      />
    </SimpleScreen>
  );
}