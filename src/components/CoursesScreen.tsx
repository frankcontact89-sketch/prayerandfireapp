import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bannerPrayer from "@/assets/course-prayer-foundations.jpg";
import bannerDiscipline from "@/assets/course-spiritual-discipline.jpg";
import bannerBible from "@/assets/course-bible-study.jpg";

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
}

const fallbackBanner = (title: string): string => {
  const k = title.toLowerCase();
  if (k.includes("prayer foundation")) return bannerPrayer;
  if (k.includes("spiritual") || k.includes("discipline")) return bannerDiscipline;
  if (k.includes("bible")) return bannerBible;
  return bannerPrayer;
};

const fallbackButton = (title: string): string => {
  const k = title.toLowerCase();
  if (k.includes("prayer foundation")) return "Open Course";
  if (k.includes("spiritual") || k.includes("discipline")) return "Start Journey";
  if (k.includes("bible")) return "Begin Study";
  return "Learn More";
};

export default function CoursesScreen({ t, onBack }: CoursesScreenProps) {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,title,description,image_url,button_label,link_url,link_type")
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

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted/20 text-foreground">←</button>
          <h1 className="text-2xl font-bold">{t("myCourses")}</h1>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">{t("loading")}</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No courses available yet.</div>
        ) : (
          courses.map((c) => {
            const banner = c.image_url || fallbackBanner(c.title);
            const label = c.button_label || fallbackButton(c.title);
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_0_30px_-12px_hsl(var(--primary)/0.4)]"
              >
                <div className="relative w-full aspect-[16/9] bg-background">
                  <img
                    src={banner}
                    alt={c.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-foreground">{c.title}</h3>
                  {c.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                  )}
                  {c.link_url && (
                    <button
                      type="button"
                      onClick={() => handleAction(c)}
                      className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {label}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
