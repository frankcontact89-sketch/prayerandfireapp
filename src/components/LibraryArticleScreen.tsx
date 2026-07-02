import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, Share2 } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";
import { APP_CONFIG } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";

interface Props {
  articleId: string;
  onBack: () => void;
  language: string;
}

export function LibraryArticleScreen({ articleId, onBack, language }: Props) {
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("library_articles")
        .select("*")
        .eq("id", articleId)
        .maybeSingle();
      setRow(data);
      setLoading(false);
    })();
  }, [articleId]);

  const share = async () => {
    if (!row) return;
    const t = pick(row, "title", language);
    try {
      if ((navigator as any).share) await (navigator as any).share({ title: t, text: `${t}\n${APP_CONFIG.URL}` });
      else {
        await navigator.clipboard.writeText(`${t}\n${APP_CONFIG.URL}`);
        toast({ title: L(language, "Copied", "Copiado", "Copiado") });
      }
    } catch {}
  };

  if (loading || !row) {
    return (
      <SimpleScreen title="…" icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  const title = pick(row, "title", language);
  const summary = pick(row, "summary", language);
  const body = pick(row, "body", language);

  return (
    <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
      {summary && <p className="text-zinc-400 -mt-2 mb-4">{summary}</p>}
      {body && (
        <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed whitespace-pre-line">
          {body}
        </div>
      )}
      <div className="mt-6">
        <button
          onClick={share}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 text-orange-400 py-3 font-medium hover:bg-orange-500/10"
        >
          <Share2 className="w-4 h-4" /> {L(language, "Share", "Compartir", "Compartilhar")}
        </button>
      </div>
    </SimpleScreen>
  );
}