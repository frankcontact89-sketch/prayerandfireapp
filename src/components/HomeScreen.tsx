import React, { useEffect, useState } from "react";
import {
  Flame, BookOpen, HandHeart, Calendar, Sparkles, Users, ArrowRight,
  Quote, Heart, Globe2, GraduationCap, ShoppingBag, MessageCircle, Star
} from "lucide-react";
import realisticFlame from "@/assets/realistic-flame.png";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";
import prayerJournal from "@/assets/prayer-journal.jpg";

interface HomeScreenProps {
  t: (key: string) => string;
}

const VERSES = [
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { text: "Ask, and it will be given to you; seek, and you will find.", ref: "Matthew 7:7" },
  { text: "For where two or three gather in my name, there am I with them.", ref: "Matthew 18:20" },
  { text: "The prayer of a righteous person is powerful and effective.", ref: "James 5:16" },
];

function useDailyVerse() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return VERSES[day % VERSES.length];
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const verse = useDailyVerse();
  const [loading, setLoading] = useState(true);
  const [prayerCount, setPrayerCount] = useState(0);

  useEffect(() => {
    const tm = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(tm);
  }, []);

  useEffect(() => {
    const target = 12847;
    let n = 12500;
    const id = setInterval(() => {
      n += Math.floor(Math.random() * 5) + 1;
      if (n >= target) { n = target; clearInterval(id); }
      setPrayerCount(n);
    }, 80);
    return () => clearInterval(id);
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
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">{prayerCount.toLocaleString()} prayers shared this week</span>
          </div>
        </section>

        {/* Verse of the Day */}
        <section className="rounded-2xl bg-card border border-border p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Verse of the Day</h2>
          </div>
          <p className="text-lg text-foreground italic leading-relaxed">"{verse.text}"</p>
          <p className="text-sm text-primary font-semibold mt-2">— {verse.ref}</p>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <ActionTile icon={<HandHeart className="w-6 h-6" />} title="Prayer Request" sub="Submit yours"
            onClick={() => mailto("Prayer Request")} />
          <ActionTile icon={<Users className="w-6 h-6" />} title="Global Prayer" sub="Join the chain"
            onClick={() => mailto("Join Global Prayer")} />
          <ActionTile icon={<Heart className="w-6 h-6" />} title="Testimony" sub="Share yours"
            onClick={() => mailto("Share Testimony")} />
          <ActionTile icon={<Globe2 className="w-6 h-6" />} title="Missions" sub="Support work"
            onClick={() => mailto("Support Missions")} />
        </section>

        {/* Upcoming meeting */}
        <section className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Next Prayer Meeting</h2>
          </div>
          <p className="text-lg font-bold text-foreground">Global Night of Prayer</p>
          <p className="text-sm text-muted-foreground mt-1">Friday · 8:00 PM · Online</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>Worship</Badge><Badge>Intercession</Badge><Badge>Live</Badge>
          </div>
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
              <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                <Star className="w-3 h-3 fill-primary" /><Star className="w-3 h-3 fill-primary" />
                <Star className="w-3 h-3 fill-primary" /><Star className="w-3 h-3 fill-primary" />
                <Star className="w-3 h-3 fill-primary" />
                <span className="text-muted-foreground ml-1">4.9 · 2.1k readers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured course */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Featured Course</h2>
          </div>
          <h3 className="font-bold text-foreground text-lg">Prayer Foundations</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Learn the biblical patterns of prayer that shape a life of intimacy with God.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">8 lessons · Self-paced</span>
            <span className="text-primary font-bold">View →</span>
          </div>
        </section>

        {/* Featured book */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Featured Resource</h2>
          </div>
          <div className="flex gap-4">
            <img src={vozInteriorBook} alt="VOZ INTERIOR"
              className="w-20 h-28 object-cover rounded-lg border border-border" loading="lazy" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground">VOZ INTERIOR</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A book to help you hear the inner voice of God in your daily walk.
              </p>
              <button onClick={() => window.open("https://a.co/d/dfgHEvM", "_blank")}
                className="mt-3 text-sm text-primary font-semibold hover:underline">
                Learn more →
              </button>
            </div>
          </div>
        </section>

        {/* Prayer Journal product */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">From the Store</h2>
          </div>
          <div className="flex gap-4">
            <img src={prayerJournal} alt="Prayer Journal"
              className="w-20 h-28 object-cover rounded-lg border border-border" loading="lazy" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Prayer Journal</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Premium leather-bound journal to record prayers, answers, and reflections.
              </p>
              <p className="mt-2 text-primary font-bold">$24.99</p>
            </div>
          </div>
        </section>

        {/* Community Prayer Wall */}
        <section className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Community Prayer Wall</h2>
          </div>
          <div className="space-y-3">
            <PrayerCard name="Sarah" text="Praying for healing for my mother. Thank you, family." count={48} />
            <PrayerCard name="David" text="God provided a new job after 6 months of waiting!" count={132} />
            <PrayerCard name="Maria" text="Lifting up our missionaries in West Africa." count={67} />
          </div>
          <button onClick={() => mailto("Add Prayer to Wall")}
            className="mt-4 w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
            Add your prayer <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        {/* Missions */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/15 to-card border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Missions Highlight</h2>
          </div>
          <h3 className="font-bold text-foreground text-lg">Reaching the Nations</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Currently supporting outreach in 14 countries across 4 continents. Every prayer fuels the mission.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Countries" value="14" />
            <Stat label="Partners" value="63" />
            <Stat label="Lives" value="9.2k" />
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{children}</span>;
}

function PrayerCard({ name, text, count }: { name: string; text: string; count: number }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border p-3">
      <p className="text-sm text-foreground">{text}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>— {name}</span>
        <span className="flex items-center gap-1 text-primary"><Heart className="w-3 h-3 fill-primary" /> {count} praying</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border p-3">
      <div className="text-xl font-extrabold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
