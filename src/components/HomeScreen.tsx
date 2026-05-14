import React, { useEffect, useState } from "react";
import {
  Flame, BookOpen, HandHeart, Calendar, Sparkles, Users,
  Quote, Heart, Globe2, GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import realisticFlame from "@/assets/realistic-flame.png";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const lang = (typeof window !== "undefined" && localStorage.getItem("pf_lang")) || "en";
  const [verse, setVerse] = useState<{ text: string; ref: string } | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [versesRes, contentRes] = await Promise.all([
        supabase.from("verses").select("text_en,ref_en,text_es,ref_es,text_pt,ref_pt").eq("is_active", true),
        supabase.from("app_content").select("key,value_en,value_es,value_pt"),
      ]);
      const vs = (versesRes.data || []).map((v: any) => ({
        text: v[`text_${lang}`] || v.text_en || "",
        ref: v[`ref_${lang}`] || v.ref_en || "",
      })).filter((v) => v.text);
      if (vs.length) setVerse(vs[Math.floor(Math.random() * vs.length)]);
      const map: Record<string, string> = {};
      (contentRes.data || []).forEach((r: any) => {
        const v = r[`value_${lang}`] || r.value_en;
        if (v) map[r.key] = v;
      });
      setContent(map);
      setLoading(false);
    })();
  }, [lang]);

  // Use admin-managed content with translation fallback
  const c = (key: string) => content[key] || t(key);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-28" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const mailto = (subject: string) =>
    window.location.assign(`mailto:prayerandfireglobal@gmail.com?subject=${encodeURIComponent(subject)}`);

  return (
    <div className="relative min-h-screen pb-12">
      <div
        className="fixed inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${realisticFlame})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-6 space-y-5 animate-fade-in">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/30 p-6 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-3">
            <img src={entryLogo} alt="Prayer & Fire" className="w-14 h-14 object-contain animate-pulse-quick" />
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-bold">{t("welcome")}</p>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">Prayer & Fire</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("home_hero_subtitle")}
          </p>
        </section>

        {/* Verse of the Day */}
        <section className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_verse_title")}</h2>
          </div>
          {verse ? (
            <>
              <p className="text-lg text-foreground italic leading-relaxed">"{verse.text}"</p>
              <p className="text-sm text-primary font-semibold mt-2">— {verse.ref}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("loading")}</p>
          )}
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <ActionTile icon={<HandHeart className="w-6 h-6" />} title={t("home_prayer_request")} sub={t("home_submit_yours")}
            onClick={() => mailto("Prayer Request")} />
          <ActionTile icon={<Users className="w-6 h-6" />} title={t("home_monthly_gathering")} sub={t("home_join_us")}
            onClick={() => mailto("Join Monthly Global Prayer Gathering")} />
          <ActionTile icon={<Heart className="w-6 h-6" />} title={t("home_testimony")} sub={t("home_share_yours")}
            onClick={() => mailto("Share Testimony")} />
        </section>

        {/* Monthly Global Prayer */}
        <section className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_monthly_gathering")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("home_monthly_desc")}
          </p>
        </section>

        {/* Featured devotional */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_featured_devotional")}</h2>
          </div>
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{c("home_devotional_title")}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {c("home_devotional_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Featured course */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_featured_course")}</h2>
          </div>
          <h3 className="font-bold text-foreground text-lg">{c("home_course_title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {c("home_course_desc")}
          </p>
        </section>

        {/* Featured book */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_featured_resource")}</h2>
          </div>
          <div className="flex gap-4">
            <img src={vozInteriorBook} alt="VOZ INTERIOR"
              className="w-20 h-28 object-cover rounded-lg border border-border" loading="lazy" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground">VOZ INTERIOR</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {c("home_book_desc")}
              </p>
              <button onClick={() => window.open("https://a.co/d/dfgHEvM", "_blank", "noopener,noreferrer")}
                className="mt-3 text-sm text-primary font-semibold hover:underline">
                {t("home_view_amazon")} →
              </button>
            </div>
          </div>
        </section>

        {/* Missions */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/15 to-card border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_missions_short")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {c("home_missions_desc")}
          </p>
        </section>

        {/* Mission */}
        <section className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">{t("home_our_mission")}</h2>
          <p className="text-sm text-foreground leading-relaxed">
            {c("home_mission_text")}
          </p>
        </section>
      </div>
    </div>
  );
}

function ActionTile({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; }) {
  return (
    <button onClick={onClick}
      className="rounded-2xl bg-card border border-border p-4 text-left hover:border-primary/40 hover:bg-card/80 transition-all active:scale-95">
      <div className="text-primary mb-2">{icon}</div>
      <div className="font-bold text-foreground text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </button>
  );
}
