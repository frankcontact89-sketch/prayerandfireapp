import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap } from "lucide-react";
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
    ? { tr: "Transliteración", pr: "Pronunciación", me: "Significado", us: "Uso bíblico", sc: "Referencias", ex: "Explicación" }
    : language === "pt"
    ? { tr: "Transliteração", pr: "Pronúncia", me: "Significado", us: "Uso bíblico", sc: "Referências", ex: "Explicação" }
    : { tr: "Transliteration", pr: "Pronunciation", me: "Meaning", us: "Biblical usage", sc: "Scripture references", ex: "Explanation" };

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
        <div className="text-zinc-400 text-xs uppercase tracking-widest mt-3">{labels.pr}</div>
        <div className="text-lg text-white mt-1">/{row.pronunciation}/</div>
      </div>
      {section(labels.me, pick("meaning"))}
      {section(labels.us, pick("biblical_usage"))}
      {section(labels.sc, row.scripture_refs)}
      {section(labels.ex, pick("explanation"))}
      <ContentActions
        itemType="greek_word"
        itemId={row.id}
        title={`${row.greek} — ${row.transliteration}`}
        shareText={pick("meaning")}
        language={language}
      />
    </SimpleScreen>
  );
}