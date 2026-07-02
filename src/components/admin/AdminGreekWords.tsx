import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GraduationCap, Edit, Trash2, Plus } from "lucide-react";

const LANGS = ["en", "es", "pt"] as const;
const TRANS_FIELDS = ["meaning", "biblical_usage", "explanation"] as const;

const emptyForm = {
  slug: "", order_index: 0, greek: "", transliteration: "", pronunciation: "",
  scripture_refs: "",
  meaning_en: "", meaning_es: "", meaning_pt: "",
  biblical_usage_en: "", biblical_usage_es: "", biblical_usage_pt: "",
  explanation_en: "", explanation_es: "", explanation_pt: "",
};

export function AdminGreekWords() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const { toast } = useToast();

  useEffect(() => { fetchRows(); }, []);
  const fetchRows = async () => {
    const { data } = await supabase.from("greek_words").select("*").order("order_index");
    setRows(data || []); setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.greek || !form.transliteration) {
      toast({ title: "Error", description: "Slug, Greek and transliteration are required", variant: "destructive" });
      return;
    }
    const payload = { ...form, order_index: Number(form.order_index) || 0 };
    const { error } = editingId
      ? await supabase.from("greek_words").update(payload).eq("id", editingId)
      : await supabase.from("greek_words").insert([payload]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingId ? "Updated" : "Added" });
      setDialogOpen(false); setForm(emptyForm); setEditingId(null); fetchRows();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    const { error } = await supabase.from("greek_words").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchRows(); }
  };

  const edit = (row: any) => {
    setEditingId(row.id);
    const f: any = { ...emptyForm };
    for (const k of Object.keys(emptyForm)) f[k] = row[k] ?? (emptyForm as any)[k];
    setForm(f);
    setDialogOpen(true);
  };

  if (loading) return <div className="text-center p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-6 h-6" /> Greek Words</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Word
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit Word" : "New Greek Word"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="slug (e.g. agape) *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                <Input type="number" placeholder="order" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: e.target.value })} />
              </div>
              <Input placeholder="Greek (e.g. ἀγάπη) *" value={form.greek} onChange={(e) => setForm({ ...form, greek: e.target.value })} required />
              <Input placeholder="Transliteration *" value={form.transliteration} onChange={(e) => setForm({ ...form, transliteration: e.target.value })} required />
              <Input placeholder="Pronunciation" value={form.pronunciation} onChange={(e) => setForm({ ...form, pronunciation: e.target.value })} />
              <Input placeholder="Scripture refs (e.g. John 3:16; Rom 5:8)" value={form.scripture_refs} onChange={(e) => setForm({ ...form, scripture_refs: e.target.value })} />

              {TRANS_FIELDS.map((f) => (
                <div key={f} className="space-y-1">
                  <div className="text-xs font-bold uppercase text-muted-foreground">{f.replace("_", " ")}</div>
                  {LANGS.map((l) => (
                    <Textarea key={l} rows={2} placeholder={l.toUpperCase()} value={form[`${f}_${l}`]} onChange={(e) => setForm({ ...form, [`${f}_${l}`]: e.target.value })} />
                  ))}
                </div>
              ))}
              <Button type="submit" className="w-full">{editingId ? "Update" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border border-border rounded-lg p-3 flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="font-black text-lg text-primary">{r.greek}</div>
                <div className="text-sm italic text-muted-foreground">{r.transliteration}</div>
              </div>
              <div className="text-sm text-muted-foreground truncate">{r.meaning_en}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => edit(r)}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="destructive" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}