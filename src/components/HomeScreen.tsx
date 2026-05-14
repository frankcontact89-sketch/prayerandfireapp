import React, { useEffect, useState } from "react";
import {
  Flame, BookOpen, HandHeart, Calendar, Sparkles, Users,
  Quote, Heart, Globe2, GraduationCap
} from "lucide-react";
import realisticFlame from "@/assets/realistic-flame.png";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

const VERSES_BY_LANG: Record<string, { text: string; ref: string }[]> = {
  en: [
    { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    { text: "Pray without ceasing.", ref: "1 Thessalonians 5:17" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
    { text: "Cast all your anxiety on Him because He cares for you.", ref: "1 Peter 5:7" },
    { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
    { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
    { text: "Seek first the kingdom of God.", ref: "Matthew 6:33" },
    { text: "The Lord is my light and my salvation.", ref: "Psalm 27:1" },
  ],
  es: [
    { text: "Estad quietos, y conoced que yo soy Dios.", ref: "Salmo 46:10" },
    { text: "Orad sin cesar.", ref: "1 Tesalonicenses 5:17" },
    { text: "Jehová es mi pastor; nada me faltará.", ref: "Salmo 23:1" },
    { text: "Todo lo puedo en Cristo que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.", ref: "Salmo 119:105" },
    { text: "Echad toda vuestra ansiedad sobre Él, porque Él tiene cuidado de vosotros.", ref: "1 Pedro 5:7" },
    { text: "El gozo del Señor es vuestra fuerza.", ref: "Nehemías 8:10" },
    { text: "Confía en Jehová con todo tu corazón.", ref: "Proverbios 3:5" },
    { text: "Buscad primeramente el reino de Dios.", ref: "Mateo 6:33" },
    { text: "Jehová es mi luz y mi salvación.", ref: "Salmo 27:1" },
  ],
  pt: [
    { text: "Aquietai-vos, e sabei que eu sou Deus.", ref: "Salmo 46:10" },
    { text: "Orai sem cessar.", ref: "1 Tessalonicenses 5:17" },
    { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmo 23:1" },
    { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
    { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmo 119:105" },
    { text: "Lançai sobre Ele toda a vossa ansiedade, porque Ele tem cuidado de vós.", ref: "1 Pedro 5:7" },
    { text: "A alegria do Senhor é a vossa força.", ref: "Neemias 8:10" },
    { text: "Confia no Senhor de todo o teu coração.", ref: "Provérbios 3:5" },
    { text: "Buscai primeiro o reino de Deus.", ref: "Mateus 6:33" },
    { text: "O Senhor é a minha luz e a minha salvação.", ref: "Salmo 27:1" },
  ],
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const lang = (typeof window !== "undefined" && localStorage.getItem("pf_lang")) || "en";
  const verses = VERSES_BY_LANG[lang] || VERSES_BY_LANG.en;
  const [verse] = useState(() => verses[Math.floor(Math.random() * verses.length)]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tm = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(tm);
  }, []);

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
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">{t("home_countries")}</span>
          </div>
        </section>

        {/* Verse of the Day */}
        <section className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t("home_verse_title")}</h2>
          </div>
          <p className="text-lg text-foreground italic leading-relaxed">"{verse.text}"</p>
          <p className="text-sm text-primary font-semibold mt-2">— {verse.ref}</p>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <ActionTile icon={<HandHeart className="w-6 h-6" />} title={t("home_prayer_request")} sub={t("home_submit_yours")}
            onClick={() => mailto("Prayer Request")} />
          <ActionTile icon={<Users className="w-6 h-6" />} title={t("home_monthly_gathering")} sub={t("home_join_us")}
            onClick={() => mailto("Join Monthly Global Prayer Gathering")} />
          <ActionTile icon={<Heart className="w-6 h-6" />} title={t("home_testimony")} sub={t("home_share_yours")}
            onClick={() => mailto("Share Testimony")} />
          <ActionTile icon={<Globe2 className="w-6 h-6" />} title={t("home_missions_short")} sub={t("home_get_involved")}
            onClick={() => mailto("Support Missions")} />
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
              <h3 className="font-bold text-foreground">{t("home_devotional_title")}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {t("home_devotional_desc")}
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
          <h3 className="font-bold text-foreground text-lg">{t("home_course_title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("home_course_desc")}
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
                {t("home_book_desc")}
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
            {t("home_missions_desc")}
          </p>
        </section>

        {/* Mission */}
        <section className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">{t("home_our_mission")}</h2>
          <p className="text-sm text-foreground leading-relaxed">
            {t("home_mission_text")}
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
