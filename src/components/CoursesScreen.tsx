import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Flame, Sparkles, BookOpen } from "lucide-react";

interface CoursesScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

interface DbCourse {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_label: string | null;
  link_url: string | null;
  link_type: string;
  price: number | null;
}

export default function CoursesScreen({ t, onBack }: CoursesScreenProps) {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,title,description,image_url,button_label,link_url,link_type,price")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      setCourses((data as DbCourse[]) || []);
      setLoading(false);
    })();
  }, []);

  const handleAction = (c: DbCourse) => {
    if (!c.link_url) return;
    window.open(c.link_url, "_blank", "noopener,noreferrer");
  };

  const iconFor = (idx: number) => {
    const icons = [Flame, Sparkles, BookOpen];
    const Icon = icons[idx % icons.length];
    return <Icon className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-muted/20 text-foreground"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">{t("myCourses")}</h1>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">{t("loading")}</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No courses available yet.</div>
        ) : (
          courses.map((c, idx) => {
            const disabled = !c.link_url;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.4)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-semibold text-foreground">{c.title}</h3>
                    {c.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.title} className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
                        {iconFor(idx)}
                      </div>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleAction(c)}
                    className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {c.button_label || "Learn More"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
