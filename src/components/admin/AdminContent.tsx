import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save } from "lucide-react";

interface ContentRow {
  id: string;
  key: string;
  label: string | null;
  value_en: string | null;
  value_es: string | null;
  value_pt: string | null;
}

export function AdminContent({ t }: { t: (en: string, es: string) => string }) {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<ContentRow>>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data, error } = await supabase.from("app_content").select("*").order("key");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setRows((data as ContentRow[]) || []);
    setLoading(false);
  };

  const setField = (id: string, field: keyof ContentRow, value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  const save = async (row: ContentRow) => {
    const draft = drafts[row.id] || {};
    setSavingId(row.id);
    const { error } = await supabase.from("app_content").update({
      value_en: draft.value_en ?? row.value_en,
      value_es: draft.value_es ?? row.value_es,
      value_pt: draft.value_pt ?? row.value_pt,
    }).eq("id", row.id);
    setSavingId(null);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: t("Saved", "Guardado") }); fetch(); setDrafts((d) => { const n = { ...d }; delete n[row.id]; return n; }); }
  };

  if (loading) return <div className="text-center p-4">{t("Loading", "Cargando")}...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6" /> {t("Manage Home Content", "Gestionar Contenido")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("Edit text shown on the Home screen in all 3 languages.", "Edita el texto del Inicio en los 3 idiomas.")}
      </p>

      <div className="space-y-4">
        {rows.map((row) => {
          const d = drafts[row.id] || {};
          return (
            <div key={row.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{row.label || row.key}</div>
                  <div className="text-xs text-muted-foreground">{row.key}</div>
                </div>
                <Button size="sm" onClick={() => save(row)} disabled={savingId === row.id || !drafts[row.id]}>
                  <Save className="w-4 h-4 mr-1" />{savingId === row.id ? t("Saving...", "Guardando...") : t("Save", "Guardar")}
                </Button>
              </div>
              {(["en", "es", "pt"] as const).map((lang) => (
                <div key={lang} className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    {lang === "en" ? "English" : lang === "es" ? "Español" : "Português"}
                  </label>
                  <Textarea
                    value={(d as any)[`value_${lang}`] ?? (row as any)[`value_${lang}`] ?? ""}
                    onChange={(e) => setField(row.id, `value_${lang}` as keyof ContentRow, e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}