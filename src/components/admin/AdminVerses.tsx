import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Quote } from "lucide-react";

interface Verse {
  id: string;
  text_en: string | null; ref_en: string | null;
  text_es: string | null; ref_es: string | null;
  text_pt: string | null; ref_pt: string | null;
  is_active: boolean;
  order_index: number;
}

export function AdminVerses({ t }: { t: (en: string, es: string) => string }) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Verse | null>(null);
  const empty = { text_en: "", ref_en: "", text_es: "", ref_es: "", text_pt: "", ref_pt: "", is_active: true, order_index: 0 };
  const [form, setForm] = useState<any>(empty);
  const { toast } = useToast();

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data, error } = await supabase.from("verses").select("*").order("order_index");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setVerses((data as Verse[]) || []);
    setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text_en) {
      toast({ title: "Error", description: t("English text required", "Texto en inglés requerido"), variant: "destructive" });
      return;
    }
    const payload = { ...form, order_index: Number(form.order_index) || 0 };
    const { error } = editing
      ? await supabase.from("verses").update(payload).eq("id", editing.id)
      : await supabase.from("verses").insert([payload]);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? t("Updated", "Actualizado") : t("Added", "Agregado") }); setOpen(false); setEditing(null); setForm(empty); fetch(); }
  };

  const del = async (id: string) => {
    if (!confirm(t("Delete this verse?", "¿Eliminar este versículo?"))) return;
    const { error } = await supabase.from("verses").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: t("Deleted", "Eliminado") }); fetch(); }
  };

  const toggle = async (v: Verse) => {
    await supabase.from("verses").update({ is_active: !v.is_active }).eq("id", v.id);
    fetch();
  };

  const openEdit = (v: Verse) => { setEditing(v); setForm(v); setOpen(true); };

  if (loading) return <div className="text-center p-4">{t("Loading", "Cargando")}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Quote className="w-6 h-6" /> {t("Manage Verses", "Gestionar Versículos")}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(empty); }}>
              <Plus className="w-4 h-4 mr-1" />{t("Add Verse", "Agregar")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t("Edit Verse", "Editar") : t("New Verse", "Nuevo Versículo")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              {(["en", "es", "pt"] as const).map((l) => (
                <div key={l} className="space-y-2 border-l-2 border-primary/30 pl-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    {l === "en" ? "English" : l === "es" ? "Español" : "Português"}
                  </div>
                  <Textarea placeholder={t("Verse text", "Texto del versículo")} value={form[`text_${l}`] || ""}
                    onChange={(e) => setForm({ ...form, [`text_${l}`]: e.target.value })} rows={2} />
                  <Input placeholder={t("Reference (e.g. John 3:16)", "Referencia")} value={form[`ref_${l}`] || ""}
                    onChange={(e) => setForm({ ...form, [`ref_${l}`]: e.target.value })} />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Input type="number" placeholder="Order" value={form.order_index}
                  onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} className="w-24" />
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                  <label className="text-sm">{t("Active", "Activo")}</label>
                </div>
              </div>
              <Button type="submit" className="w-full">{editing ? t("Update", "Actualizar") : t("Add", "Agregar")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {verses.length === 0 ? (
          <div className="text-center text-muted-foreground p-6">{t("No verses yet.", "Sin versículos.")}</div>
        ) : verses.map((v) => (
          <div key={v.id} className={`border rounded-lg p-3 ${v.is_active ? "border-border" : "border-border/30 opacity-60"}`}>
            <div className="flex justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm italic">"{v.text_en}"</p>
                <p className="text-xs text-primary font-semibold mt-1">— {v.ref_en}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Switch checked={v.is_active} onCheckedChange={() => toggle(v)} />
                <Button variant="outline" size="sm" onClick={() => openEdit(v)}><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => del(v.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}