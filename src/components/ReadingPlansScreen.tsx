import React, { useEffect, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";

interface Props {
  onBack: () => void;
  language: string;
  onOpenPlan: (id: string) => void;
}

export function ReadingPlansScreen({ onBack, language, onOpenPlan }: Props) {
  const [plans, setPlans] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reading_plans")
        .select("*")
        .eq("is_published", true)
        .order("order_index");
      setPlans(data || []);

      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prog } = await supabase
          .from("reading_plan_progress")
          .select("plan_id")
          .eq("user_id", u.user.id);
        const map: Record<string, number> = {};
        (prog || []).forEach((p: any) => {
          map[p.plan_id] = (map[p.plan_id] || 0) + 1;
        });
        setProgress(map);
      }
      setLoading(false);
    })();
  }, []);

  const title = L(language, "Reading Plans", "Planes de Lectura", "Planos de Leitura");

  if (loading) {
    return (
      <SimpleScreen title={title} icon={<CalendarDays className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  if (plans.length === 0) return null;

  return (
    <SimpleScreen
      title={title}
      icon={<CalendarDays className="w-6 h-6" />}
      onBack={onBack}
      subtitle={L(
        language,
        "Follow a structured plan to grow in Scripture.",
        "Sigue un plan estructurado para crecer en la Escritura.",
        "Siga um plano estruturado para crescer nas Escrituras."
      )}
    >
      <div className="space-y-3">
        {plans.map((p) => {
          const done = progress[p.id] || 0;
          const total = p.duration_days || 1;
          const pct = Math.min(100, Math.round((done / total) * 100));
          return (
            <button
              key={p.id}
              onClick={() => onOpenPlan(p.id)}
              className="w-full text-left rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 hover:border-orange-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-3">
                  <h3 className="font-bold text-white">{pick(p, "title", language)}</h3>
                  <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                    {pick(p, "description", language)}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                    <span>{p.duration_days} {L(language, "days", "días", "dias")}</span>
                    <span>•</span>
                    <span>{done}/{total} {L(language, "completed", "completados", "concluídos")}</span>
                  </div>
                  <div className="h-1.5 mt-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </SimpleScreen>
  );
}