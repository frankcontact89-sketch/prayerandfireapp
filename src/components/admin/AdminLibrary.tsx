import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Library as LibraryIcon, Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";

const LANGS = ["en", "es", "pt"] as const;
const CATEGORIES = [
  "bible_studies","doctrine","christology","pneumatology","soteriology",
  "hermeneutics","homiletics","church_history","apologetics","leadership",
  "missions","sermons","articles",
] as const;

export function AdminLibrary() {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRows = async () => {
    const { data } = await supabase.from("library_articles").select("*")
      .order("category").order("order_index");
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchRows(); }, []);

  const setField = (id: string, k: string, v: any) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const create = async () => {
    const slug = `article-${Date.now()}`;
    const { error, data } = await supabase.from("library_articles").insert({
      slug, category: "articles" as any, title_en: "New Article", is_published: false,
    }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRows((r) => [data, ...r]);
  };

  const save = async (row: any) => {
    const d = drafts[row.id]; if (!d) return;
    const { error } = await supabase.from("library_articles").update(d).eq("id", row.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setDrafts((x) => { const n = { ...x }; delete n[row.id]; return n; });
    fetchRows();
  };

  const togglePub = async (row: any) => {
    await supabase.from("library_articles").update({ is_published: !row.is_published }).eq("id", row.id);
    fetchRows();
  };

  const remove = async (row: any) => {
    if (!confirm("Delete this article?")) return;
    await supabase.from("library_articles").delete().eq("id", row.id);
    fetchRows();
  };

  if (loading) return <div className="text-center p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <LibraryIcon className="w-6 h-6" /> Christian Library
        </h2>
        <Button onClick={create}><Plus className="w-4 h-4 mr-1" /> New Article</Button>
      </div>

      {rows.map((row) => {
        const d = drafts[row.id] || {};
        const val = (k: string) => (k in d ? d[k] : row[k] ?? "");
        return (
          <div key={row.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="bg-background border border-border rounded px-2 py-1 text-sm"
                  value={val("category")}
                  onChange={(e) => setField(row.id, "category", e.target.value)}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input className="w-52" placeholder="slug"
                  value={val("slug")} onChange={(e) => setField(row.id, "slug", e.target.value)} />
                <Input type="number" className="w-24" placeholder="order"
                  value={val("order_index")} onChange={(e) => setField(row.id, "order_index", parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePub(row)}>
                  {row.is_published ? <><Eye className="w-4 h-4 mr-1" />Published</> : <><EyeOff className="w-4 h-4 mr-1" />Draft</>}
                </Button>
                <Button size="sm" onClick={() => save(row)} disabled={!drafts[row.id]}>
                  <Save className="w-4 h-4 mr-1" />Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(row)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {LANGS.map((l) => (
              <Input key={`t-${l}`} placeholder={`Title ${l.toUpperCase()}`}
                value={val(`title_${l}`) || ""}
                onChange={(e) => setField(row.id, `title_${l}`, e.target.value)} />
            ))}
            {LANGS.map((l) => (
              <Textarea key={`s-${l}`} rows={2} placeholder={`Summary ${l.toUpperCase()}`}
                value={val(`summary_${l}`) || ""}
                onChange={(e) => setField(row.id, `summary_${l}`, e.target.value)} />
            ))}
            {LANGS.map((l) => (
              <Textarea key={`b-${l}`} rows={5} placeholder={`Body ${l.toUpperCase()}`}
                value={val(`body_${l}`) || ""}
                onChange={(e) => setField(row.id, `body_${l}`, e.target.value)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}