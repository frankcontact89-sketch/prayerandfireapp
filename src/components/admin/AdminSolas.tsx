import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Save } from "lucide-react";

const FIELDS = ["name", "translation", "explanation", "history", "verses", "application"] as const;
const LANGS = ["en", "es", "pt"] as const;

export function AdminSolas() {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchRows(); }, []);
  const fetchRows = async () => {
    const { data } = await supabase.from("solas").select("*").order("order_index");
    setRows(data || []);
    setLoading(false);
  };

  const setField = (id: string, field: string, value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  const save = async (row: any) => {
    const draft = drafts[row.id] || {};
    setSavingId(row.id);
    const update: any = {};
    for (const f of FIELDS) for (const l of LANGS) {
      const key = `${f}_${l}`;
      if (key in draft) update[key] = draft[key];
    }
    if (draft.latin) update.latin = draft.latin;
    const { error } = await supabase.from("solas").update(update).eq("id", row.id);
    setSavingId(null);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setDrafts((d) => { const n = { ...d }; delete n[row.id]; return n; }); fetchRows(); }
  };

  if (loading) return <div className="text-center p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Landmark className="w-6 h-6" /> Manage Five Solas
      </h2>
      <p className="text-sm text-muted-foreground">Edit each Sola in English, Spanish, and Portuguese.</p>

      {rows.map((row) => {
        const d = drafts[row.id] || {};
        return (
          <div key={row.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{row.latin}</div>
                <div className="text-xs text-muted-foreground">{row.slug}</div>
              </div>
              <Button size="sm" onClick={() => save(row)} disabled={savingId === row.id || !drafts[row.id]}>
                <Save className="w-4 h-4 mr-1" />{savingId === row.id ? "Saving…" : "Save"}
              </Button>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Latin</label>
              <Input value={d.latin ?? row.latin} onChange={(e) => setField(row.id, "latin", e.target.value)} />
            </div>
            {FIELDS.map((f) => (
              <div key={f} className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase">{f}</div>
                <div className="grid gap-2">
                  {LANGS.map((l) => (
                    <Textarea
                      key={l}
                      rows={f === "explanation" || f === "history" ? 3 : 2}
                      placeholder={l.toUpperCase()}
                      value={d[`${f}_${l}`] ?? row[`${f}_${l}`] ?? ""}
                      onChange={(e) => setField(row.id, `${f}_${l}`, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}