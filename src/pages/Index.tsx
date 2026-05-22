import React, { useEffect, useState, useCallback } from "react";
import { Heart, Settings, Share2, ShoppingBag, Flame, Bell, Quote, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SignInScreen } from "@/components/SignInScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { SocialLinksScreen } from "@/components/SocialLinksScreen";
import realisticFlame from "@/assets/realistic-flame.png";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

const dailyPrayers = [
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "The joy of the Lord is my strength.", ref: "Nehemiah 8:10" },
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my light and my salvation.", ref: "Psalm 27:1" },
  { text: "Give thanks to the Lord, for He is good.", ref: "Psalm 107:1" },
];

function PremiumHome() {
  const [prayer] = useState(() => {
    return dailyPrayers[Math.floor(Math.random() * dailyPrayers.length)];
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Orange glow */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/10 blur-[140px]" />

      {/* Content */}
      <div className="relative z-10 px-6 pt-8 pb-28">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-10">
          <img
            src={entryLogo}
            alt="Prayer & Fire"
            className="w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.55)] mb-5"
          />

          <p className="uppercase tracking-[0.4em] text-white/80 text-xs font-semibold mb-4">PRAYER & FIRE</p>

          <h1 className="text-[50px] leading-[0.95] font-extrabold tracking-tight max-w-[340px]">
            Prayer that
            <span className="block text-orange-500">connects nations.</span>
          </h1>

          <p className="text-zinc-400 mt-6 text-lg leading-relaxed max-w-sm">
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
        </div>

        {/* Planet glow */}
        <div className="relative h-[90px] mb-[-20px]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-[180px] rounded-[100%] border-t border-orange-500/20 bg-gradient-to-t from-orange-500/10 to-transparent" />
        </div>

        {/* Verse Card */}
        <section className="relative rounded-[34px] border border-orange-500/20 bg-zinc-950/90 backdrop-blur-xl p-8 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.10)]">
          <div className="absolute inset-0 bg-orange-500/[0.02]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <p className="text-orange-400 uppercase tracking-[0.28em] text-xs font-bold">PRAYER / VERSE OF THE DAY</p>

              <Quote className="w-6 h-6 text-orange-400" />
            </div>

            {/* Verse */}
            <p className="text-[42px] leading-[1.15] font-light text-white">"{prayer.text}"</p>

            <p className="text-orange-400 text-2xl font-bold mt-10">— {prayer.ref}</p>

            {/* Reflection */}
            <div className="mt-12 pt-8 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-orange-400" />

                <p className="text-orange-400 uppercase tracking-[0.25em] text-xs font-bold">DAILY REFLECTION</p>
              </div>

              <p className="text-zinc-300 text-lg leading-relaxed font-light">
                God is still moving even in seasons where you cannot yet see the full picture. Stay faithful. Stay close
                to Him.
              </p>

              {/* Dots */}
              <div className="flex justify-center gap-3 mt-10">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
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
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openNotifications = () => {
    setUnreadNotifications(0);
  };

  const bellColor = unreadNotifications > 0 ? "text-blue-400" : "text-orange-500";

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <SignInScreen
        setUser={setUser}
        t={(k) => k}
        currentLanguage="en"
        onShowLanguages={() => {}}
        onContinueAsGuest={() => {}}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-5">
            <button onClick={() => setPage("settings")} className="text-orange-500">
              <Settings className="w-6 h-6" />
            </button>

            <button onClick={openNotifications} className={bellColor}>
              <Bell className="w-6 h-6" />
            </button>
          </div>

          <button onClick={() => setPage("social")} className="text-orange-500">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* PAGES */}
      <div className="flex-1 overflow-y-auto pb-24">
        {page === "home" && <PremiumHome />}

        {page === "giving" && <GivingScreen t={(k) => k} />}

        {page === "shopping" && <ShoppingScreen t={(k) => k} />}

        {page === "settings" && (
          <SettingsScreen
            t={(k) => k}
            language="en"
            setLanguage={() => {}}
            userName=""
            userEmail={user?.email || ""}
            onAdminClick={() => {}}
            onProfileClick={() => {}}
            onNotificationsClick={openNotifications}
            onLegalClick={() => {}}
            isDarkMode={true}
            onToggleDarkMode={() => {}}
            onSignOut={async () => {
              await supabase.auth.signOut();
            }}
            isGuest={false}
          />
        )}

        {page === "social" && (
          <SocialLinksScreen t={(k) => k} onBack={() => setPage("home")} onNavigateToEvents={() => {}} />
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/5">
        <nav className="flex justify-around items-center py-4">
          <button onClick={() => setPage("home")} className={page === "home" ? "text-orange-500" : "text-zinc-500"}>
            <Flame className="w-7 h-7" />
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
