import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Heart, Settings, Share2, ShoppingBag, Flame, Bell, Quote, Sparkles, HandHeart } from "lucide-react";

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
];

function HomeScreen() {
  const today = useMemo(() => {
    return dailyContent[Math.floor(Math.random() * dailyContent.length)];
  }, []);

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

      <div className="relative z-10 px-6 pt-8 pb-28">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={entryLogo}
            alt="Prayer & Fire"
            className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.45)] mb-4"
          />

          <p className="uppercase tracking-[0.35em] text-white/80 text-xs font-semibold mb-3">PRAYER & FIRE</p>

          <h1 className="text-[42px] leading-[0.95] font-extrabold tracking-tight max-w-[330px]">
            Prayer that
            <span className="block text-orange-500">connects nations.</span>
          </h1>

          <p className="text-zinc-400 mt-5 text-base leading-relaxed max-w-sm">
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
        </div>

        <section className="relative rounded-[30px] border border-orange-500/20 bg-zinc-950/90 backdrop-blur-xl p-6 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.10)]">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-orange-400 uppercase tracking-[0.22em] text-xs font-bold">VERSE OF THE DAY</p>
              <Quote className="w-5 h-5 text-orange-400" />
            </div>

            <p className="text-[28px] leading-[1.2] font-light text-white">"{today.verse}"</p>
            <p className="text-orange-400 text-xl font-bold mt-6">— {today.ref}</p>

            <div className="mt-8 pt-6 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-3">
                <HandHeart className="w-4 h-4 text-orange-400" />
                <p className="text-orange-400 uppercase tracking-[0.22em] text-xs font-bold">DAILY PRAYER</p>
              </div>
              <p className="text-zinc-300 text-base leading-relaxed">{today.prayer}</p>
            </div>

            <div className="mt-7 pt-6 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <p className="text-orange-400 uppercase tracking-[0.22em] text-xs font-bold">DAILY REFLECTION</p>
              </div>
              <p className="text-zinc-300 text-base leading-relaxed">{today.reflection}</p>
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

  const [language, setLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("pf_lang");
      if (saved && ["en", "es", "pt"].includes(saved)) return saved;
    } catch {}
    return "en";
  });

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

      <div className="flex-1 overflow-y-auto pb-20">
        {page === "home" && <HomeScreen />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "shopping" && <ShoppingScreen t={t} />}

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

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800">
        <nav className="flex justify-around items-center py-3 px-4 max-w-2xl mx-auto">
          <button onClick={() => setPage("home")} className={page === "home" ? "text-orange-500" : "text-zinc-500"}>
            <Flame className="w-6 h-6" />
          </button>

          <button onClick={() => setPage("giving")} className={page === "giving" ? "text-orange-500" : "text-zinc-500"}>
            <Heart className="w-6 h-6" />
          </button>

          <button
            onClick={() => setPage("shopping")}
            className={page === "shopping" ? "text-orange-500" : "text-zinc-500"}
          >
            <ShoppingBag className="w-6 h-6" />
          </button>
        </nav>
      </div>
    </div>
  );
}
