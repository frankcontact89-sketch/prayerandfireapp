import React, { useEffect, useState } from "react";
import { CalendarDays, Check, Play } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";
import { useToast } from "@/hooks/use-toast";
import { localizeBibleRefs, localizeDayLabel } from "@/lib/localize-bible-refs";
import { ContentActions } from "./content/ContentActions";

interface Props {
  planId: string;
  onBack: () => void;
  language: string;
}

export function ReadingPlanDetailScreen({ planId, onBack, language }: Props) {
  const [plan, setPlan] = useState<any | null>(null);
  const [days, setDays] = useState<any[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }, { data: u }] = await Promise.all([
        supabase.from("reading_plans").select("*").eq("id", planId).maybeSingle(),
        supabase.from("reading_plan_days").select("*").eq("plan_id", planId).order("day_number"),
        supabase.auth.getUser(),
      ]);
      setPlan(p);
      setDays(d || []);
      const uid = u.user?.id || null;
      setUserId(uid);
      if (uid) {
        const { data: prog } = await supabase
          .from("reading_plan_progress")
          .select("day_number")
          .eq("plan_id", planId)
          .eq("user_id", uid);
        setDone(new Set((prog || []).map((x: any) => x.day_number)));
      }
      setLoading(false);
    })();
  }, [planId]);

  const toggleDay = async (day: number) => {
    if (!userId) return;
    if (done.has(day)) {
      await supabase.from("reading_plan_progress").delete()
        .eq("user_id", userId).eq("plan_id", planId).eq("day_number", day);
      const n = new Set(done); n.delete(day); setDone(n);
    } else {
      const { error } = await supabase.from("reading_plan_progress").insert({
        user_id: userId, plan_id: planId, day_number: day,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      const n = new Set(done); n.add(day); setDone(n);
    }
  };

  if (loading || !plan) {
    return (
      <SimpleScreen title="…" icon={<CalendarDays className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  const total = plan.duration_days || days.length;
  const completed = done.size;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const nextDay = days.find((d) => !done.has(d.day_number));

  const scrollToNext = () => {
    if (!nextDay) return;
    const el = document.getElementById(`plan-day-${nextDay.day_number}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <SimpleScreen
      title={pick(plan, "title", language)}
      icon={<CalendarDays className="w-6 h-6" />}
      onBack={onBack}
      subtitle={pick(plan, "description", language)}
    >
      <div className="mb-4 rounded-2xl border border-orange-500/20 bg-zinc-950/70 p-4">
        <div className="flex items-center justify-between text-sm text-zinc-300 mb-2">
          <span>{completed}/{total} {L(language, "days completed", "días completados", "dias concluídos")}</span>
          <span className="text-orange-400 font-bold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
        </div>
        {nextDay && (
          <button
            onClick={scrollToNext}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-black font-bold py-2.5"
          >
            <Play className="w-4 h-4" />
            {L(language, "Continue reading", "Continuar lectura", "Continuar leitura")} · {localizeDayLabel(nextDay.day_number, language)}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {days.map((d) => {
          const isDone = done.has(d.day_number);
          const dayTitle = pick(d, "title", language);
          return (
            <div
              key={d.id}
              id={`plan-day-${d.day_number}`}
              className={`rounded-xl border p-3 ${
                isDone ? "border-orange-500/40 bg-orange-500/5" : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDay(d.day_number)}
                  aria-label="Toggle"
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone
                      ? "bg-orange-500 border-orange-500 text-black"
                      : "border-zinc-600"
                  }`}
                >
                  {isDone && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider text-orange-400 font-bold">
                    {localizeDayLabel(d.day_number, language)}
                  </div>
                  {dayTitle && <div className="font-semibold text-white">{dayTitle}</div>}
                  <div className="text-sm text-zinc-300 mt-1">
                    {(d.passages || []).map((p: string) => localizeBibleRefs(p, language)).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ContentActions
        itemType="reading_plan"
        itemId={plan.id}
        title={pick(plan, "title", language)}
        shareText={pick(plan, "description", language)}
        language={language}
      />
    </SimpleScreen>
  );
}