import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, Trash2, Save, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";

const LANGS = ["en", "es", "pt"] as const;

export function AdminReadingPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [daysByPlan, setDaysByPlan] = useState<Record<string, any[]>>({});
  const [openPlan, setOpenPlan] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = async () => {
    const { data } = await supabase.from("reading_plans").select("*").order("order_index");
    setPlans(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const loadDays = async (planId: string) => {
    const { data } = await supabase.from("reading_plan_days").select("*")
      .eq("plan_id", planId).order("day_number");
    setDaysByPlan((m) => ({ ...m, [planId]: data || [] }));
  };

  const togglePlan = async (id: string) => {
    if (openPlan === id) { setOpenPlan(null); return; }
    setOpenPlan(id);
    if (!daysByPlan[id]) await loadDays(id);
  };

  const createPlan = async () => {
    const slug = `plan-${Date.now()}`;
    const { error, data } = await supabase.from("reading_plans").insert({
      slug, title_en: "New Plan", duration_days: 30, is_published: false,
    }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setPlans((p) => [...p, data]);
  };

  const setField = (id: string, k: string, v: any) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const savePlan = async (row: any) => {
    const d = drafts[row.id]; if (!d) return;
    const { error } = await supabase.from("reading_plans").update(d).eq("id", row.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setDrafts((x) => { const n = { ...x }; delete n[row.id]; return n; });
    fetchAll();
  };

  const togglePub = async (row: any) => {
    await supabase.from("reading_plans").update({ is_published: !row.is_published }).eq("id", row.id);
    fetchAll();
  };

  const removePlan = async (row: any) => {
    if (!confirm("Delete plan and all its days?")) return;
    await supabase.from("reading_plan_days").delete().eq("plan_id", row.id);
    await supabase.from("reading_plans").delete().eq("id", row.id);
    fetchAll();
  };

  const addDay = async (plan: any) => {
    const existing = daysByPlan[plan.id] || [];
    const nextNum = (existing[existing.length - 1]?.day_number || 0) + 1;
    const { error } = await supabase.from("reading_plan_days").insert({
      plan_id: plan.id, day_number: nextNum, passages: [],
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    loadDays(plan.id);
  };

  const saveDay = async (day: any) => {
    const d = drafts[day.id]; if (!d) return;
    const payload = { ...d };
    if (typeof payload.passages === "string") {
      payload.passages = payload.passages.split(/[\n,]/).map((x: string) => x.trim()).filter(Boolean);
    }
    const { error } = await supabase.from("reading_plan_days").update(payload).eq("id", day.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setDrafts((x) => { const n = { ...x }; delete n[day.id]; return n; });
    loadDays(day.plan_id);
  };

  const removeDay = async (day: any) => {
    if (!confirm("Delete this day?")) return;
    await supabase.from("reading_plan_days").delete().eq("id", day.id);
    loadDays(day.plan_id);
  };

  if (loading) return <div className="text-center p-4">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6" /> Reading Plans
        </h2>
        <Button onClick={createPlan}><Plus className="w-4 h-4 mr-1" /> New Plan</Button>
      </div>

      {plans.map((row) => {
        const d = drafts[row.id] || {};
        const val = (k: string) => (k in d ? d[k] : row[k] ?? "");
        const open = openPlan === row.id;
        const days = daysByPlan[row.id] || [];
        return (
          <div key={row.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button className="flex items-center gap-2 font-bold" onClick={() => togglePlan(row.id)}>
                {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {row.title_en} <span className="text-xs text-muted-foreground">/ {row.slug}</span>
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePub(row)}>
                  {row.is_published ? <><Eye className="w-4 h-4 mr-1" />Published</> : <><EyeOff className="w-4 h-4 mr-1" />Draft</>}
                </Button>
                <Button size="sm" onClick={() => savePlan(row)} disabled={!drafts[row.id]}>
                  <Save className="w-4 h-4 mr-1" />Save
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removePlan(row)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {open && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Slug" value={val("slug")} onChange={(e) => setField(row.id, "slug", e.target.value)} />
                  <Input type="number" placeholder="Duration days" value={val("duration_days")} onChange={(e) => setField(row.id, "duration_days", parseInt(e.target.value) || 0)} />
                </div>
                {LANGS.map((l) => (
                  <Input key={`t-${l}`} placeholder={`Title ${l.toUpperCase()}`}
                    value={val(`title_${l}`) || ""}
                    onChange={(e) => setField(row.id, `title_${l}`, e.target.value)} />
                ))}
                {LANGS.map((l) => (
                  <Textarea key={`d-${l}`} rows={2} placeholder={`Description ${l.toUpperCase()}`}
                    value={val(`description_${l}`) || ""}
                    onChange={(e) => setField(row.id, `description_${l}`, e.target.value)} />
                ))}

                <div className="flex items-center justify-between pt-2">
                  <h3 className="font-semibold">Days ({days.length})</h3>
                  <Button size="sm" onClick={() => addDay(row)}><Plus className="w-4 h-4 mr-1" />Add Day</Button>
                </div>

                {days.map((day) => {
                  const dd = drafts[day.id] || {};
                  const dval = (k: string) => (k in dd ? dd[k] : day[k] ?? "");
                  const passagesStr = typeof dd.passages === "string"
                    ? dd.passages
                    : (dd.passages ?? day.passages ?? []).join?.("\n") ?? "";
                  return (
                    <div key={day.id} className="border border-border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Input type="number" className="w-20" value={dval("day_number")}
                          onChange={(e) => setField(day.id, "day_number", parseInt(e.target.value) || 0)} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveDay(day)} disabled={!drafts[day.id]}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeDay(day)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {LANGS.map((l) => (
                        <Input key={l} placeholder={`Title ${l.toUpperCase()}`}
                          value={dval(`title_${l}`) || ""}
                          onChange={(e) => setField(day.id, `title_${l}`, e.target.value)} />
                      ))}
                      <Textarea rows={2} placeholder="Passages (one per line, e.g. John 1:1-14)"
                        value={passagesStr}
                        onChange={(e) => setField(day.id, "passages", e.target.value)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}