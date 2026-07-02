import React, { useEffect, useState } from "react";
import { Heart, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";

interface Props {
  onBack: () => void;
  language: string;
  onOpen: (page: string) => void;
}

type FavRow = { id: string; item_type: string; item_id: string; created_at: string };

export function FavoritesScreen({ onBack, language, onOpen }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) { setLoading(false); return; }

      const { data: favs } = await supabase
        .from("favorites").select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const rows = (favs as FavRow[] | null) || [];
      // Hide any favorites of hidden features
      const visible = rows.filter((r) => r.item_type !== "devotional" && r.item_type !== "reading_plan");

      const groups: Record<string, string[]> = {};
      for (const r of visible) (groups[r.item_type] ||= []).push(r.item_id);

      const enriched: any[] = [];
      if (groups["article"]?.length) {
        const { data } = await supabase.from("library_articles")
          .select("id,title_en,title_es,title_pt,summary_en,summary_es,summary_pt")
          .in("id", groups["article"]);
        (data || []).forEach((a: any) => enriched.push({
          kind: "article", key: a.id,
          title: pick(a, "title", language),
          summary: pick(a, "summary", language),
          nav: `article:${a.id}`,
        }));
      }
      if (groups["sola"]?.length) {
        const { data } = await supabase.from("solas")
          .select("slug,name_en,name_es,name_pt,translation_en,translation_es,translation_pt")
          .in("slug", groups["sola"]);
        (data || []).forEach((s: any) => enriched.push({
          kind: "sola", key: s.slug,
          title: pick(s, "name", language),
          summary: pick(s, "translation", language),
          nav: `sola:${s.slug}`,
        }));
      }
      if (groups["greek_word"]?.length) {
        const { data } = await supabase.from("greek_words")
          .select("slug,greek,transliteration,meaning_en,meaning_es,meaning_pt")
          .in("slug", groups["greek_word"]);
        (data || []).forEach((g: any) => enriched.push({
          kind: "greek_word", key: g.slug,
          title: `${g.greek} — ${g.transliteration}`,
          summary: pick(g, "meaning", language),
          nav: `greek:${g.slug}`,
        }));
      }

      setItems(enriched);
      setLoading(false);
    })();
  }, [language]);

  const title = L(language, "Favorites", "Favoritos", "Favoritos");
  const empty = L(language,
    "You haven't saved anything yet. Tap the heart on any article, sola, or word to save it here.",
    "Aún no has guardado nada. Toca el corazón en cualquier artículo, sola o palabra para guardarlo aquí.",
    "Você ainda não salvou nada. Toque no coração em qualquer artigo, sola ou palavra para salvá-lo aqui.");

  return (
    <SimpleScreen title={title} icon={<Heart className="w-6 h-6" />} onBack={onBack}>
      {loading ? (
        <div className="text-zinc-400 text-center py-10">…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-orange-500/20 bg-zinc-950/60 p-6 text-center text-zinc-300 text-sm">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={`${it.kind}-${it.key}`}
              onClick={() => onOpen(it.nav)}
              className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 hover:border-orange-500/40 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{it.title}</div>
                {it.summary && (
                  <div className="text-sm text-zinc-400 line-clamp-2 mt-0.5">{it.summary}</div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500" />
            </button>
          ))}
        </div>
      )}
    </SimpleScreen>
  );
}