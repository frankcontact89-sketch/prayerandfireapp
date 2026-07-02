import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Landmark } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { MarkdownView } from "./content/MarkdownView";
import { ContentActions } from "./content/ContentActions";

interface Props {
  slug: string;
  onBack: () => void;
  language: string;
}

export function SolaDetailScreen({ slug, onBack, language }: Props) {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("solas").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      setRow(data);
      setLoading(false);
    });
  }, [slug]);

  const pick = (field: string) => row?.[`${field}_${language}`] || row?.[`${field}_en`] || "";

  if (loading) return <SimpleScreen title="…" onBack={onBack}><div /></SimpleScreen>;
  if (!row) return <SimpleScreen title="Not found" onBack={onBack}><p className="text-zinc-400">This entry is not available yet.</p></SimpleScreen>;

  const section = (label: string, text: string) => text ? (
    <section className="mb-6">
      <h2 className="text-orange-400 uppercase tracking-[0.15em] text-xs font-black mb-2">{label}</h2>
      <MarkdownView text={text} language={language} />
    </section>
  ) : null;

  const labels = language === "es"
    ? { en: "Traducción", exp: "Explicación bíblica", his: "Contexto histórico", ver: "Versículos clave", app: "Aplicación práctica" }
    : language === "pt"
    ? { en: "Tradução", exp: "Explicação bíblica", his: "Contexto histórico", ver: "Versículos chave", app: "Aplicação prática" }
    : { en: "English translation", exp: "Biblical explanation", his: "Historical background", ver: "Key Bible verses", app: "Practical application" };

  return (
    <SimpleScreen title={row.latin} icon={<Landmark className="w-6 h-6" />} onBack={onBack}>
      <div className="mb-6 pb-4 border-b border-orange-500/20">
        <div className="text-zinc-400 text-xs uppercase tracking-widest">{labels.en}</div>
        <div className="text-2xl font-extrabold text-white mt-1">{pick("translation")}</div>
      </div>
      {section(labels.exp, pick("explanation"))}
      {section(labels.his, pick("history"))}
      {section(labels.ver, pick("verses"))}
      {section(labels.app, pick("application"))}
      <ContentActions
        itemType="sola"
        itemId={row.id}
        title={`${row.latin} — ${pick("translation")}`}
        shareText={pick("explanation")}
        language={language}
      />
    </SimpleScreen>
  );
}