import React, { useEffect, useState } from "react";
import { Library as LibraryIcon } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { pick } from "./content/lang";
import { MarkdownView } from "./content/MarkdownView";
import { ContentActions } from "./content/ContentActions";

interface Props {
  articleId: string;
  onBack: () => void;
  language: string;
}

export function LibraryArticleScreen({ articleId, onBack, language }: Props) {
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
      {body && <MarkdownView text={body} language={language} />}
      <ContentActions
        itemType="article"
        itemId={row.id}
        title={title}
        shareText={summary}
        language={language}
      />
    </SimpleScreen>
  );
}