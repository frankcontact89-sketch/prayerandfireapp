import React from "react";
import { Flame, BookOpen, HandHeart, Calendar, Sparkles, Users, ArrowRight, Quote } from "lucide-react";
import realisticFlame from "@/assets/realistic-flame.png";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

const VERSE = {
  text: "Be still, and know that I am God.",
  ref: "Psalm 46:10",
};

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="relative min-h-screen pb-10">
      {/* Subtle fire background */}
      <div
        className="fixed inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-6 space-y-5">
        {/* Welcome hero */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <img src={entryLogo} alt="Prayer & Fire" className="w-12 h-12 object-contain" loading="lazy" />
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/80 font-semibold">{t("welcome")}</p>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">Prayer & Fire</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
        </section>

        {/* Verse of the Day */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Verse of the Day</h2>
          </div>
          <p className="text-lg text-foreground italic leading-relaxed">"{VERSE.text}"</p>
          <p className="text-sm text-primary font-semibold mt-2">— {VERSE.ref}</p>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <ActionTile
            icon={<HandHeart className="w-6 h-6" />}
            title="Prayer Request"
            sub="Submit yours"
            onClick={() => window.location.assign("mailto:prayerandfireglobal@gmail.com?subject=Prayer%20Request")}
          />
          <ActionTile
            icon={<Users className="w-6 h-6" />}
            title="Global Prayer"
            sub="Join the chain"
            onClick={() => window.location.assign("mailto:prayerandfireglobal@gmail.com?subject=Join%20Global%20Prayer")}
          />
        </section>

        {/* Upcoming meeting */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Next Prayer Meeting</h2>
          </div>
          <p className="text-lg font-bold text-foreground">Global Night of Prayer</p>
          <p className="text-sm text-muted-foreground mt-1">Friday · 8:00 PM · Online</p>
          <button className="mt-4 w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2">
            View Events <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        {/* Featured devotional */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Featured Devotional</h2>
          </div>
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Walking in Daily Fire</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                A 7-day journey to renew your prayer life and rekindle the flame of the Spirit.
              </p>
            </div>
          </div>
        </section>

        {/* Featured book */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Featured Resource</h2>
          </div>
          <div className="flex gap-4">
            <img
              src={vozInteriorBook}
              alt="VOZ INTERIOR"
              className="w-20 h-28 object-cover rounded-lg border border-border"
              loading="lazy"
            />
            <div className="flex-1">
              <h3 className="font-bold text-foreground">VOZ INTERIOR</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A book to help you hear the inner voice of God in your daily walk.
              </p>
              <button
                onClick={() => window.open("https://a.co/d/dfgHEvM", "_blank")}
                className="mt-3 text-sm text-primary font-semibold hover:underline"
              >
                Learn more →
              </button>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Our Mission</h2>
          <p className="text-sm text-foreground leading-relaxed">
            To ignite hearts with the fire of the Holy Spirit, strengthen believers through prayer, and build a
            global community rooted in faith, unity, and love.
          </p>
        </section>
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-card border border-border p-4 text-left hover:border-primary/40 hover:bg-card/80 transition-all active:scale-95"
    >
      <div className="text-primary mb-2">{icon}</div>
      <div className="font-bold text-foreground text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </button>
  );
}
