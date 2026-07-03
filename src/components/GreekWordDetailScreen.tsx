import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Volume2 } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { MarkdownView } from "./content/MarkdownView";
import { ContentActions } from "./content/ContentActions";

interface Props { slug: string; onBack: () => void; language: string; }

function cleanTransliteration(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʾʿ‘’']/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizedPronunciation(row: any, language: string): string {
  const specific = row?.[`pronunciation_text_${language}`] || row?.[`pronunciation_${language}`];
  if (specific) return specific;

  if (language === "en") {
    return row?.pronunciation_text || row?.pronunciation || row?.transliteration || row?.greek || "";
  }

  let spoken = cleanTransliteration(row?.transliteration || row?.pronunciation_text || row?.pronunciation || row?.greek || "");
  if (language === "es") {
    spoken = spoken
      .replace(/ph/gi, "f")
      .replace(/th/gi, "t")
      .replace(/ch/gi, "j")
      .replace(/kh/gi, "j")
      .replace(/sh/gi, "sh");
  } else if (language === "pt") {
    spoken = spoken
      .replace(/ph/gi, "f")
      .replace(/th/gi, "t")
      .replace(/kh/gi, "k")
      .replace(/ch/gi, "k");
  }
  return spoken || row?.transliteration || row?.greek || "";
}

export function GreekWordDetailScreen({ slug, onBack, language }: Props) {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("greek_words").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      setRow(data); setLoading(false);
    });
  }, [slug]);

  const pick = (f: string) => row?.[`${f}_${language}`] || row?.[`${f}_en`] || "";
  const labels = language === "es"
    ? { tr: "Transliteración", pr: "Pronunciación", ipa: "IPA", me: "Significado", lit: "Sentido literal", bib: "Sentido bíblico", hist: "Contexto histórico", us: "Uso bíblico", sc: "Referencias", rel: "Palabras relacionadas", app: "Aplicación práctica", ex: "Explicación", play: "Escuchar", notFound: "No encontrado", notAvailable: "No disponible." }
    : language === "pt"
    ? { tr: "Transliteração", pr: "Pronúncia", ipa: "IPA", me: "Significado", lit: "Sentido literal", bib: "Sentido bíblico", hist: "Contexto histórico", us: "Uso bíblico", sc: "Referências", rel: "Palavras relacionadas", app: "Aplicação prática", ex: "Explicação", play: "Ouvir", notFound: "Não encontrado", notAvailable: "Não disponível." }
    : { tr: "Transliteration", pr: "Pronunciation", ipa: "IPA", me: "Meaning", lit: "Literal meaning", bib: "Biblical meaning", hist: "Historical background", us: "Biblical usage", sc: "Scripture references", rel: "Related words", app: "Practical application", ex: "Explanation", play: "Listen", notFound: "Not found", notAvailable: "Not available." };

  if (loading) return <SimpleScreen title="…" onBack={onBack}><div /></SimpleScreen>;
  if (!row) return <SimpleScreen title={labels.notFound} onBack={onBack}><p className="text-zinc-400">{labels.notAvailable}</p></SimpleScreen>;

  const playAudio = () => {
    try {
      // Pronunciation follows the selected app UI language so users hear the
      // transliteration read with their own accent (EN/ES/PT). The original
      // Greek/Hebrew script itself is never changed — we just speak the
      // Latin transliteration using the selected UI language's TTS voice.
      const spoken = localizedPronunciation(row, language);
      const locale =
        language === "es" ? "es-ES" : language === "pt" ? "pt-BR" : "en-US";
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = locale;
      // Try to pick a matching voice if the browser has one installed.
      try {
        const voices = window.speechSynthesis.getVoices();
        const exact = voices.find((v) => v.lang?.toLowerCase() === locale.toLowerCase());
        const match = exact || voices.find((v) => v.lang?.toLowerCase().startsWith(locale.toLowerCase().slice(0, 2)));
        if (match) u.voice = match;
      } catch {}
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
        {(row.pronunciation || row.pronunciation_text || row.transliteration) && (<>
          <div className="text-zinc-400 text-xs uppercase tracking-widest mt-3">{labels.pr}</div>
          <div className="text-lg text-white mt-1">/{localizedPronunciation(row, language)}/</div>
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