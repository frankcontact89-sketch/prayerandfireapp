import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sunrise, Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";

const LANGS = ["en", "es", "pt"] as const;
const FIELDS = [
  "title", "scripture_reference", "scripture_text",
  "context", "reflection", "application", "prayer",
] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminDevotionals() {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRows = async () => {
    const { data } = await supabase
      .from("devotionals").select("*").order("date", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchRows(); }, []);

  const setField = (id: string, k: string, v: any) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const create = async () => {
    const { error, data } = await supabase.from("devotionals").insert({
      date: today(),
      title_en: "New Devotional",
      is_published: false,
    }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRows((r) => [data, ...r]);
  };

  const save = async (row: any) => {
    const d = drafts[row.id] || {};
    if (Object.keys(d).length === 0) return;
    setSavingId(row.id);
    const { error } = await supabase.from("devotionals").update(d).eq("id", row.id);
    setSavingId(null);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setDrafts((x) => { const n = { ...x }; delete n[row.id]; return n; });
    fetchRows();
  };

  const togglePublish = async (row: any) => {
    await supabase.from("devotionals").update({ is_published: !row.is_published }).eq("id", row.id);
    fetchRows();
  };

  const remove = async (row: any) => {
    if (!confirm("Delete this devotional?")) return;
    await supabase.from("devotionals").delete().eq("id", row.id);
    fetchRows();
  };

  const parseArr = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  if (loading) return <div className="text-center p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sunrise className="w-6 h-6" /> Devotionals
        </h2>
        <Button onClick={create}><Plus className="w-4 h-4 mr-1" /> New</Button>
      </div>

      {rows.map((row) => {
        const d = drafts[row.id] || {};
        const val = (k: string) => (k in d ? d[k] : row[k] ?? "");
        return (
          <div key={row.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Input
                type="date"
                className="w-40"
                value={val("date")}
                onChange={(e) => setField(row.id, "date", e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePublish(row)}>
                  {row.is_published ? <><Eye className="w-4 h-4 mr-1" />Published</> : <><EyeOff className="w-4 h-4 mr-1" />Draft</>}
                </Button>
                <Button size="sm" onClick={() => save(row)} disabled={savingId === row.id || !drafts[row.id]}>
                  <Save className="w-4 h-4 mr-1" />{savingId === row.id ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(row)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {FIELDS.map((f) => (
              <div key={f} className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase">{f.replace(/_/g, " ")}</div>
                <div className="grid gap-2">
                  {LANGS.map((l) => (
                    <Textarea
                      key={l}
                      rows={f === "reflection" || f === "context" || f === "scripture_text" ? 3 : 2}
                      placeholder={l.toUpperCase()}
                      value={val(`${f}_${l}`) || ""}
                      onChange={(e) => setField(row.id, `${f}_${l}`, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground uppercase">Reflection Questions (one per line)</div>
              <div className="grid gap-2">
                {LANGS.map((l) => (
                  <Textarea
                    key={l}
                    rows={3}
                    placeholder={l.toUpperCase()}
                    value={(d[`questions_${l}`] ?? row[`questions_${l}`] ?? []).join?.("\n") ?? ""}
                    onChange={(e) => setField(row.id, `questions_${l}`, parseArr(e.target.value))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground uppercase">Related Verses (one per line)</div>
              <Textarea
                rows={2}
                value={(d.related_verses ?? row.related_verses ?? []).join?.("\n") ?? ""}
                onChange={(e) => setField(row.id, "related_verses", parseArr(e.target.value))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}