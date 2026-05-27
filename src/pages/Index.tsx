import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Heart, Settings, Share2, ShoppingBag, Flame, Bell, Quote, Sparkles, HandHeart, BookOpen } from "lucide-react";

import { SignInScreen } from "@/components/SignInScreen";
import { EventsScreen } from "@/components/EventsScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { SocialLinksScreen } from "@/components/SocialLinksScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { NotificationsScreen } from "@/components/NotificationsScreen";
import { LegalCenter } from "@/components/LegalCenter";
import { BibleStudyScreen } from "@/components/BibleStudyScreen";
import { BibleScreen } from "@/components/BibleScreen";

import { supabase } from "@/integrations/supabase/client";
import { translations, SupportedLanguage } from "@/config/translations";
import { getLastReadAtMs, setLastReadAtNow } from "@/lib/notifications-last-seen";

import realisticFlame from "@/assets/realistic-flame.png";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

const dailyContent = [
  {
    verse: "The Lord is my shepherd; I shall not want.",
    ref: "Psalm 23:1",
    prayer: "Lord, guide me today and help me trust Your care.",
    reflection: "God is not distant. He leads, provides, and walks with you through every season.",
  },
  {
    verse: "I can do all things through Christ who strengthens me.",
    ref: "Philippians 4:13",
    prayer: "Christ, strengthen my heart and renew my faith today.",
    reflection: "Your strength does not come from pressure. It comes from Christ working in you.",
  },
  {
    verse: "The joy of the Lord is my strength.",
    ref: "Nehemiah 8:10",
    prayer: "Lord, restore Your joy in me today.",
    reflection: "Joy is not the absence of difficulty. It is the strength of God inside the difficulty.",
  },
  {
    verse: "Give thanks to the Lord, for He is good.",
    ref: "Psalm 107:1",
    prayer: "Lord, teach me to see Your goodness today.",
    reflection: "Gratitude opens your eyes to what God is already doing around you.",
  },
  {
    verse: "Be still, and know that I am God.",
    ref: "Psalm 46:10",
    prayer: "Lord, quiet my heart so I can hear You today.",
    reflection: "Stillness is not weakness. It is where God reveals Himself most clearly.",
  },
  {
    verse: "For we walk by faith, not by sight.",
    ref: "2 Corinthians 5:7",
    prayer: "Lord, help me trust You beyond what I can see.",
    reflection: "Faith sees what eyes cannot. Trust God's hand even in the unknown.",
  },
  {
    verse: "The Lord is my light and my salvation; whom shall I fear?",
    ref: "Psalm 27:1",
    prayer: "Lord, be my light in every dark place.",
    reflection: "When God is your light, fear loses its grip on your heart.",
  },
  {
    verse: "Cast all your anxiety on Him because He cares for you.",
    ref: "1 Peter 5:7",
    prayer: "Lord, I release my worries into Your hands.",
    reflection: "God is not too busy for your burdens. He invites you to bring them all.",
  },
  {
    verse: "Trust in the Lord with all your heart.",
    ref: "Proverbs 3:5",
    prayer: "Lord, teach me to trust You more than my own understanding.",
    reflection: "Real trust begins where self-reliance ends.",
  },
  {
    verse: "My grace is sufficient for you.",
    ref: "2 Corinthians 12:9",
    prayer: "Lord, let Your grace carry me where my strength runs out.",
    reflection: "God's grace meets you exactly where you feel most weak.",
  },
  {
    verse: "Weeping may stay for the night, but rejoicing comes in the morning.",
    ref: "Psalm 30:5",
    prayer: "Lord, hold me through the night until joy returns.",
    reflection: "Seasons of sorrow are real, but they are never the final word.",
  },
  {
    verse: "The Lord will fight for you; you need only to be still.",
    ref: "Exodus 14:14",
    prayer: "Lord, fight my battles as I rest in You.",
    reflection: "Sometimes obedience looks like stillness and trust.",
  },
  {
    verse: "Come to Me, all you who are weary, and I will give you rest.",
    ref: "Matthew 11:28",
    prayer: "Jesus, I come to You today. Give me Your rest.",
    reflection: "Rest is not a reward for finishing. It is a gift from Jesus right now.",
  },
  {
    verse: "He restores my soul.",
    ref: "Psalm 23:3",
    prayer: "Lord, restore every weary place in me.",
    reflection: "God does not just patch you up. He restores you completely.",
  },
  {
    verse: "Delight yourself in the Lord, and He will give you the desires of your heart.",
    ref: "Psalm 37:4",
    prayer: "Lord, shape my desires to match Your heart.",
    reflection: "Delighting in God reshapes what you want until His will becomes your joy.",
  },
  {
    verse: "If God is for us, who can be against us?",
    ref: "Romans 8:31",
    prayer: "Lord, remind me today that You are with me.",
    reflection: "When God stands with you, no opposition is final.",
  },
  {
    verse: "Seek first the kingdom of God and His righteousness.",
    ref: "Matthew 6:33",
    prayer: "Lord, take first place in my heart today.",
    reflection: "When God is first, everything else finds its right order.",
  },
  {
    verse: "The name of the Lord is a fortified tower; the righteous run to it and are safe.",
    ref: "Proverbs 18:10",
    prayer: "Lord, be my refuge today.",
    reflection: "There is real safety in the name of Jesus.",
  },
  {
    verse: "I have loved you with an everlasting love.",
    ref: "Jeremiah 31:3",
    prayer: "Lord, let Your love anchor me today.",
    reflection: "God's love for you has no end and no condition.",
  },
  {
    verse: "Greater is He who is in you than he who is in the world.",
    ref: "1 John 4:4",
    prayer: "Holy Spirit, rise up in me today.",
    reflection: "The power inside you is greater than the pressure around you.",
  },
  {
    verse: "Be strong and courageous. Do not be afraid; the Lord your God will be with you.",
    ref: "Joshua 1:9",
    prayer: "Lord, give me courage to follow You today.",
    reflection: "Courage is not the absence of fear; it is trusting God in the middle of it.",
  },
  {
    verse: "The steadfast love of the Lord never ceases; His mercies are new every morning.",
    ref: "Lamentations 3:22-23",
    prayer: "Lord, thank You for Your fresh mercy today.",
    reflection: "Today carries new mercy, not yesterday's failures.",
  },
  {
    verse: "In all things God works for the good of those who love Him.",
    ref: "Romans 8:28",
    prayer: "Lord, work even this for good.",
    reflection: "God is writing a story bigger than this moment.",
  },
  {
    verse: "He gives strength to the weary and increases the power of the weak.",
    ref: "Isaiah 40:29",
    prayer: "Lord, refill me with Your strength.",
    reflection: "Weakness in your hands becomes strength in God's hands.",
  },
  {
    verse: "The Lord is close to the brokenhearted.",
    ref: "Psalm 34:18",
    prayer: "Lord, draw near to every hurting place in me.",
    reflection: "God is nearest when your heart feels most broken.",
  },
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer, present your requests to God.",
    ref: "Philippians 4:6",
    prayer: "Lord, I trade my anxiety for trust today.",
    reflection: "Prayer turns worry into worship.",
  },
  {
    verse: "The peace of God, which transcends all understanding, will guard your hearts.",
    ref: "Philippians 4:7",
    prayer: "Lord, guard my heart with Your peace.",
    reflection: "God's peace does not depend on circumstances.",
  },
  {
    verse: "Wait for the Lord; be strong and take heart and wait for the Lord.",
    ref: "Psalm 27:14",
    prayer: "Lord, teach me to wait well.",
    reflection: "Waiting on God is not wasted time. It is sacred time.",
  },
  {
    verse: "Your word is a lamp for my feet, a light on my path.",
    ref: "Psalm 119:105",
    prayer: "Lord, let Your Word lead my steps today.",
    reflection: "God gives enough light for the next step, not always the whole road.",
  },
  {
    verse: "Ask and it will be given to you; seek and you will find.",
    ref: "Matthew 7:7",
    prayer: "Lord, I seek You today with all my heart.",
    reflection: "God responds to a heart that truly seeks Him.",
  },
  {
    verse: "He must become greater; I must become less.",
    ref: "John 3:30",
    prayer: "Lord, let Your name be lifted in my life.",
    reflection: "True freedom begins when Christ takes center stage.",
  },
  {
    verse: "Let everything that has breath praise the Lord.",
    ref: "Psalm 150:6",
    prayer: "Lord, let my life be praise to You today.",
    reflection: "Praise is the natural overflow of a heart that knows God.",
  },
  {
    verse: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    ref: "Hebrews 11:1",
    prayer: "Lord, grow my faith today.",
    reflection: "Faith stands firm even when sight has nothing to show.",
  },
];

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function HomeScreen({ t, language }: { t: (k: any) => string; language: string }) {
  const today = useMemo(() => {
    const idx = getDayOfYear(new Date()) % dailyContent.length;
    return dailyContent[idx];
  }, []);

  const labels = {
    en: { verse: "VERSE OF THE DAY", prayer: "DAILY PRAYER", reflection: "DAILY REFLECTION", tagline: "Prayer that", connects: "connects nations." },
    es: { verse: "VERSÍCULO DEL DÍA", prayer: "ORACIÓN DIARIA", reflection: "REFLEXIÓN DIARIA", tagline: "Oración que", connects: "conecta naciones." },
    pt: { verse: "VERSÍCULO DO DIA", prayer: "ORAÇÃO DIÁRIA", reflection: "REFLEXÃO DIÁRIA", tagline: "Oração que", connects: "conecta nações." },
  } as const;
  const L = (labels as any)[language] || labels.en;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 px-5 pt-3 pb-5 max-w-[430px] mx-auto">
        <div className="flex flex-col items-center text-center mb-5">
          <img
            src={entryLogo}
            alt="Prayer & Fire"
            className="w-[72px] h-[72px] object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.45)] mb-3"
          />

          <p className="uppercase tracking-[0.3em] text-white/80 text-xs font-semibold mb-2">PRAYER & FIRE</p>

          <h1 className="text-[26px] leading-[1.05] font-extrabold tracking-tight max-w-[320px]">
            {L.tagline}
            <span className="block text-orange-500">{L.connects}</span>
          </h1>

          <p className="text-zinc-300 mt-2 text-[14px] leading-snug max-w-sm">
            {t("home_hero_subtitle")}
          </p>
        </div>

        <section className="relative w-full rounded-2xl border border-orange-500/20 bg-zinc-950/90 backdrop-blur-xl p-5 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.10)]">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-400 uppercase tracking-[0.2em] text-[10px] font-bold">{L.verse}</p>
              <Quote className="w-4 h-4 text-orange-400" />
            </div>

            <p className="text-[16px] leading-relaxed font-light text-white">"{today.verse}"</p>
            <p className="text-orange-400 text-sm font-bold mt-2">— {today.ref}</p>

            <div className="mt-3 pt-2.5 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-1">
                <HandHeart className="w-3.5 h-3.5 text-orange-400" />
                <p className="text-orange-400 uppercase tracking-[0.2em] text-[10px] font-bold">{L.prayer}</p>
              </div>
              <p className="text-zinc-200 text-[14px] leading-snug">{today.prayer}</p>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <p className="text-orange-400 uppercase tracking-[0.2em] text-[10px] font-bold">{L.reflection}</p>
              </div>
              <p className="text-zinc-200 text-[14px] leading-snug">{today.reflection}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [showLanguages, setShowLanguages] = useState(false);

  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("pf_lang");
      if (saved && ["en", "es", "pt"].includes(saved)) return saved;
    } catch {}
    return "en";
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    try { localStorage.setItem("pf_lang", lang); } catch {}
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("pf_dark_mode");
    return saved === "true" || saved === null;
  });

  const [loading, setLoading] = useState(true);
  const [userName] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const t = (key: keyof typeof translations.en): string => {
    const lang = language as SupportedLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("pf_dark_mode", String(newMode));
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setUser(currentSession?.user ?? null);

      if (event === "SIGNED_IN") {
        setPage("home");
      }

      if (event === "SIGNED_OUT") {
        setPage("home");
        setUnreadNotifications(0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setPage("home");
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const lastReadAtMs = getLastReadAtMs();
    const lastReadAtISO = lastReadAtMs > 0 ? new Date(lastReadAtMs).toISOString() : null;

    const { count: userUnread } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    let broadcastUnread = 0;

    if (lastReadAtISO) {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .gt("created_at", lastReadAtISO);

      broadcastUnread = count || 0;
    }

    setUnreadNotifications((userUnread || 0) + broadcastUnread);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  const openNotifications = () => {
    setLastReadAtNow();
    setUnreadNotifications(0);
    setPage("notifications");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        setUser={(newUser: any) => {
          setUser(newUser);
          setPage("home");
        }}
        t={t}
        onShowLanguages={() => setShowLanguages(true)}
        currentLanguage={language}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black font-sans">
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800 pt-[env(safe-area-inset-top)]">
        <div className="flex justify-between items-center px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setPage("settings")} className="text-orange-500">
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={openNotifications}
              className={`relative transition-colors duration-300 ${
                unreadNotifications > 0 ? "text-blue-500" : "text-orange-500"
              }`}
            >
              <Bell className="w-5 h-5" />

              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>

          <button onClick={() => setPage("social")} className="text-orange-500">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-[90px]">
        {page === "home" && <HomeScreen t={t} language={language} />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "shopping" && <ShoppingScreen t={t} />}
        {page === "bible" && <BibleScreen />}

        {page === "settings" && (
          <SettingsScreen
            t={t}
            language={language}
            setLanguage={() => setShowLanguages(true)}
            userName={userName}
            userEmail={user?.email || ""}
            onAdminClick={() => setPage("admin")}
            onProfileClick={() => setPage("profile")}
            onNotificationsClick={openNotifications}
            onLegalClick={() => setPage("legal")}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onSignOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setPage("home");
            }}
            isGuest={false}
          />
        )}

        {page === "social" && (
          <SocialLinksScreen t={t} onBack={() => setPage("home")} onNavigateToEvents={() => setPage("events")} />
        )}

        {page === "events" && <EventsScreen t={t} />}

        {page === "admin" && <AdminPanel t={t} onBack={() => setPage("settings")} />}

        {page === "profile" && (
          <ProfileScreen
            t={t}
            language={language}
            setLanguage={setLanguage}
            onBack={() => setPage("settings")}
            signOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setPage("home");
            }}
          />
        )}

        {page === "notifications" && <NotificationsScreen t={t} onBack={() => setPage("settings")} />}

        {page === "legal" && <LegalCenter t={t} onBack={() => setPage("settings")} />}

        {page === "bible_study" && (
          <BibleStudyScreen onBack={() => setPage("home")} onContact={() => setPage("home")} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex justify-around items-center h-[64px] px-6 max-w-[430px] mx-auto">
          <button onClick={() => setPage("home")} className={page === "home" ? "text-orange-500" : "text-zinc-500"}>
            <Flame className="w-7 h-7" />
          </button>

          <button onClick={() => setPage("bible")} className={page === "bible" ? "text-orange-500" : "text-zinc-500"}>
            <BookOpen className="w-7 h-7" />
          </button>

          <button onClick={() => setPage("giving")} className={page === "giving" ? "text-orange-500" : "text-zinc-500"}>
            <Heart className="w-7 h-7" />
          </button>

          <button
            onClick={() => setPage("shopping")}
            className={page === "shopping" ? "text-orange-500" : "text-zinc-500"}
          >
            <ShoppingBag className="w-7 h-7" />
          </button>
        </nav>
      </div>
    </div>
  );
}
