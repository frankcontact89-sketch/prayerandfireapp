import React, { useState, useEffect, useCallback } from "react";
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
import { LanguagesScreen } from "@/components/LanguagesScreen";

import { supabase } from "@/integrations/supabase/client";
import { translations } from "@/config/translations";
import { getLastReadAtMs, setLastReadAtNow } from "@/lib/notifications-last-seen";

import realisticFlame from "@/assets/realistic-flame.png";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

const SUPPORTED_LANGUAGE_CODES = ["en", "es", "pt", "fr", "it", "de"];

const dailyContent = [
  {
    en: {
      verse: "The Lord is my shepherd; I shall not want.",
      ref: "Psalm 23:1",
      prayer: "Lord, guide me today and help me trust Your care.",
      reflection: "God is not distant. He leads, provides, and walks with you through every season.",
    },
    es: {
      verse: "El Señor es mi pastor; nada me faltará.",
      ref: "Salmo 23:1",
      prayer: "Señor, guíame hoy y ayúdame a confiar en Tu cuidado.",
      reflection: "Dios no está lejos. Él guía, provee y camina contigo en cada temporada.",
    },
    pt: {
      verse: "O Senhor é o meu pastor; nada me faltará.",
      ref: "Salmo 23:1",
      prayer: "Senhor, guia-me hoje e ajuda-me a confiar no Teu cuidado.",
      reflection: "Deus não está distante. Ele guia, provê e caminha contigo em cada estação.",
    },
    fr: {
      verse: "L’Éternel est mon berger; je ne manquerai de rien.",
      ref: "Psaume 23:1",
      prayer: "Seigneur, guide-moi aujourd’hui et aide-moi à faire confiance à Tes soins.",
      reflection: "Dieu n’est pas loin. Il guide, pourvoit et marche avec toi en toute saison.",
    },
    it: {
      verse: "Il Signore è il mio pastore; nulla mi mancherà.",
      ref: "Salmo 23:1",
      prayer: "Signore, guidami oggi e aiutami a confidare nella Tua cura.",
      reflection: "Dio non è lontano. Egli guida, provvede e cammina con te in ogni stagione.",
    },
    de: {
      verse: "Der Herr ist mein Hirte; mir wird nichts mangeln.",
      ref: "Psalm 23:1",
      prayer: "Herr, führe mich heute und hilf mir, Deiner Fürsorge zu vertrauen.",
      reflection: "Gott ist nicht fern. Er führt, versorgt und geht mit dir durch jede Zeit.",
    },
  },
  {
    en: {
      verse: "I can do all things through Christ who strengthens me.",
      ref: "Philippians 4:13",
      prayer: "Christ, strengthen my heart and renew my faith today.",
      reflection: "Your strength does not come from pressure. It comes from Christ working in you.",
    },
    es: {
      verse: "Todo lo puedo en Cristo que me fortalece.",
      ref: "Filipenses 4:13",
      prayer: "Cristo, fortalece mi corazón y renueva mi fe hoy.",
      reflection: "Tu fuerza no viene de la presión. Viene de Cristo obrando en ti.",
    },
    pt: {
      verse: "Tudo posso em Cristo que me fortalece.",
      ref: "Filipenses 4:13",
      prayer: "Cristo, fortalece meu coração e renova minha fé hoje.",
      reflection: "Tua força não vem da pressão. Ela vem de Cristo agindo em você.",
    },
    fr: {
      verse: "Je puis tout par Christ qui me fortifie.",
      ref: "Philippiens 4:13",
      prayer: "Christ, fortifie mon cœur et renouvelle ma foi aujourd’hui.",
      reflection: "Ta force ne vient pas de la pression. Elle vient de Christ qui agit en toi.",
    },
    it: {
      verse: "Io posso ogni cosa in Cristo che mi fortifica.",
      ref: "Filippesi 4:13",
      prayer: "Cristo, rafforza il mio cuore e rinnova la mia fede oggi.",
      reflection: "La tua forza non viene dalla pressione. Viene da Cristo che opera in te.",
    },
    de: {
      verse: "Ich vermag alles durch Christus, der mich stärkt.",
      ref: "Philipper 4:13",
      prayer: "Christus, stärke mein Herz und erneuere heute meinen Glauben.",
      reflection: "Deine Kraft kommt nicht aus Druck. Sie kommt von Christus, der in dir wirkt.",
    },
  },
  {
    en: {
      verse: "If God is for us, who can be against us?",
      ref: "Romans 8:31",
      prayer: "Lord, remind me today that You are with me.",
      reflection: "When God stands with you, no opposition is final.",
    },
    es: {
      verse: "Si Dios es por nosotros, ¿quién contra nosotros?",
      ref: "Romanos 8:31",
      prayer: "Señor, recuérdame hoy que Tú estás conmigo.",
      reflection: "Cuando Dios está contigo, ninguna oposición tiene la última palabra.",
    },
    pt: {
      verse: "Se Deus é por nós, quem será contra nós?",
      ref: "Romanos 8:31",
      prayer: "Senhor, lembra-me hoje que Tu estás comigo.",
      reflection: "Quando Deus está contigo, nenhuma oposição é final.",
    },
    fr: {
      verse: "Si Dieu est pour nous, qui sera contre nous?",
      ref: "Romains 8:31",
      prayer: "Seigneur, rappelle-moi aujourd’hui que Tu es avec moi.",
      reflection: "Quand Dieu est avec toi, aucune opposition n’a le dernier mot.",
    },
    it: {
      verse: "Se Dio è per noi, chi sarà contro di noi?",
      ref: "Romani 8:31",
      prayer: "Signore, ricordami oggi che Tu sei con me.",
      reflection: "Quando Dio è con te, nessuna opposizione è definitiva.",
    },
    de: {
      verse: "Ist Gott für uns, wer kann gegen uns sein?",
      ref: "Römer 8:31",
      prayer: "Herr, erinnere mich heute daran, dass Du mit mir bist.",
      reflection: "Wenn Gott mit dir ist, hat kein Widerstand das letzte Wort.",
    },
  },
  {
    en: {
      verse: "In all things God works for the good of those who love Him.",
      ref: "Romans 8:28",
      prayer: "Lord, work even this for good.",
      reflection: "God is writing a story bigger than this moment.",
    },
    es: {
      verse: "A los que aman a Dios, todas las cosas les ayudan a bien.",
      ref: "Romanos 8:28",
      prayer: "Señor, obra aun en esto para bien.",
      reflection: "Dios está escribiendo una historia más grande que este momento.",
    },
    pt: {
      verse: "Todas as coisas cooperam para o bem daqueles que amam a Deus.",
      ref: "Romanos 8:28",
      prayer: "Senhor, transforma até isto em bem.",
      reflection: "Deus está escrevendo uma história maior que este momento.",
    },
    fr: {
      verse: "Toutes choses concourent au bien de ceux qui aiment Dieu.",
      ref: "Romains 8:28",
      prayer: "Seigneur, fais aussi travailler cela pour le bien.",
      reflection: "Dieu écrit une histoire plus grande que ce moment.",
    },
    it: {
      verse: "Tutte le cose cooperano al bene di quelli che amano Dio.",
      ref: "Romani 8:28",
      prayer: "Signore, opera anche in questo per il bene.",
      reflection: "Dio sta scrivendo una storia più grande di questo momento.",
    },
    de: {
      verse: "Alle Dinge dienen denen zum Besten, die Gott lieben.",
      ref: "Römer 8:28",
      prayer: "Herr, wirke auch hierin zum Guten.",
      reflection: "Gott schreibt eine Geschichte, die größer ist als dieser Moment.",
    },
  },
];

function getFreshVerseIndex() {
  const lastIndex = Number(localStorage.getItem("pf_last_verse_index") || "-1");
  let nextIndex = Math.floor(Math.random() * dailyContent.length);

  if (dailyContent.length > 1) {
    while (nextIndex === lastIndex) {
      nextIndex = Math.floor(Math.random() * dailyContent.length);
    }
  }

  localStorage.setItem("pf_last_verse_index", String(nextIndex));
  return nextIndex;
}

function HomeScreen({ t, language }: { t: (k: any) => string; language: string }) {
  const [verseIndex] = useState(() => getFreshVerseIndex());
  const safeLang = SUPPORTED_LANGUAGE_CODES.includes(language) ? language : "en";
  const today = (dailyContent[verseIndex] as any)[safeLang] || dailyContent[verseIndex].en;

  const labels: any = {
    en: {
      verse: "VERSE OF THE DAY",
      prayer: "DAILY PRAYER",
      reflection: "DAILY REFLECTION",
      tagline: "Prayer that",
      connects: "connects nations.",
    },
    es: {
      verse: "VERSÍCULO DEL DÍA",
      prayer: "ORACIÓN DIARIA",
      reflection: "REFLEXIÓN DIARIA",
      tagline: "Oración que",
      connects: "conecta naciones.",
    },
    pt: {
      verse: "VERSÍCULO DO DIA",
      prayer: "ORAÇÃO DIÁRIA",
      reflection: "REFLEXÃO DIÁRIA",
      tagline: "Oração que",
      connects: "conecta nações.",
    },
    fr: {
      verse: "VERSET DU JOUR",
      prayer: "PRIÈRE DU JOUR",
      reflection: "RÉFLEXION DU JOUR",
      tagline: "Une prière qui",
      connects: "unit les nations.",
    },
    it: {
      verse: "VERSO DEL GIORNO",
      prayer: "PREGHIERA DEL GIORNO",
      reflection: "RIFLESSIONE DEL GIORNO",
      tagline: "Preghiera che",
      connects: "connette le nazioni.",
    },
    de: {
      verse: "VERS DES TAGES",
      prayer: "TÄGLICHES GEBET",
      reflection: "TÄGLICHE REFLEXION",
      tagline: "Gebet, das",
      connects: "Nationen verbindet.",
    },
  };

  const L = labels[safeLang] || labels.en;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none"
        style={{ backgroundImage: `url(${realisticFlame})`, backgroundSize: "cover", backgroundPosition: "center" }}
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

          <p className="text-zinc-300 mt-2 text-[14px] leading-snug max-w-sm">{t("home_hero_subtitle")}</p>
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
      if (saved && SUPPORTED_LANGUAGE_CODES.includes(saved)) return saved;
    } catch {}
    return "en";
  });

  const setLanguage = useCallback((lang: string) => {
    const safeLang = SUPPORTED_LANGUAGE_CODES.includes(lang) ? lang : "en";
    setLanguageState(safeLang);
    localStorage.setItem("pf_lang", safeLang);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("pf_dark_mode");
    return saved === "true" || saved === null;
  });

  const [loading, setLoading] = useState(true);
  const [userName] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const t = (key: keyof typeof translations.en): string => {
    const safeLanguage = (translations as any)[language] ? language : "en";
    return (translations as any)[safeLanguage]?.[key] || translations.en[key] || String(key);
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
      if (event === "SIGNED_IN") setPage("home");
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
    if (user) fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  const openNotifications = () => {
    setLastReadAtNow();
    setUnreadNotifications(0);
    setPage("notifications");
  };

  if (showLanguages) {
    return (
      <LanguagesScreen
        t={t}
        currentLanguage={language}
        onLanguageChange={(code: string) => {
          setLanguage(code);
          setShowLanguages(false);
        }}
        onBack={() => setShowLanguages(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary text-lg">{t("loading")}</div>
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
              className={`relative ${unreadNotifications > 0 ? "text-blue-500" : "text-orange-500"}`}
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
