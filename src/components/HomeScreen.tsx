import React, { useEffect, useState } from "react";
import {
  Flame, BookOpen, HandHeart, Calendar, Sparkles, Users, ArrowRight,
  Quote, Heart, Globe2, GraduationCap
} from "lucide-react";
import realisticFlame from "@/assets/realistic-flame.png";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

const VERSES = [
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
  { text: "Call to Me and I will answer you.", ref: "Jeremiah 33:3" },
  { text: "Walk by faith, not by sight.", ref: "2 Corinthians 5:7" },
  { text: "The prayer of a righteous person is powerful and effective.", ref: "James 5:16" },
  { text: "Come to Me, all who labor and are heavy laden.", ref: "Matthew 11:28" },
  { text: "Abide in Me, and I in you.", ref: "John 15:4" },
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)]);
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
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">40+ countries represented in prayer</span>
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
          <ActionTile icon={<Users className="w-6 h-6" />} title="Monthly Global Prayer Gathering" sub="Join us"
            onClick={() => mailto("Join Monthly Global Prayer Gathering")} />
          <ActionTile icon={<Heart className="w-6 h-6" />} title="Testimony" sub="Share yours"
            onClick={() => mailto("Share Testimony")} />
          <ActionTile icon={<Globe2 className="w-6 h-6" />} title="Missions / Support" sub="Get involved"
            onClick={() => mailto("Support Missions")} />
        </section>

        {/* Monthly Global Prayer */}
        <section className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Monthly Global Prayer Gathering</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Join believers from around the world for a monthly time of worship and intercession. See the Events screen for the next gathering.
          </p>
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
              <button onClick={() => window.open("https://a.co/d/dfgHEvM", "_blank", "noopener,noreferrer")}
                className="mt-3 text-sm text-primary font-semibold hover:underline">
                View on Amazon →
              </button>
            </div>
          </div>
        </section>

        {/* Missions */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/15 to-card border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Missions / Support</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Support prayer, discipleship, and outreach efforts.
          </p>
          <button onClick={() => mailto("Support Missions")}
            className="mt-4 w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
            Get involved <ArrowRight className="w-4 h-4" />
          </button>
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
