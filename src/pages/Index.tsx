import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Bell, Quote, Sparkles, HandHeart, BookOpen, User as UserIcon, Menu, Library as LibraryIcon, MessageCircle } from "lucide-react";

import { SignInScreen } from "@/components/SignInScreen";
import { EventsScreen } from "@/components/EventsScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { SocialLinksScreen } from "@/components/SocialLinksScreen";
import { NotificationsScreen } from "@/components/NotificationsScreen";
import { LegalCenter } from "@/components/LegalCenter";
import { BibleScreen } from "@/components/BibleScreen";
import { LanguagesScreen } from "@/components/LanguagesScreen";
import { AppDrawer } from "@/components/AppDrawer";
import { SolasListScreen } from "@/components/SolasListScreen";
import { SolaDetailScreen } from "@/components/SolaDetailScreen";
import { GreekWordsListScreen } from "@/components/GreekWordsListScreen";
import { GreekWordDetailScreen } from "@/components/GreekWordDetailScreen";
import { AboutScreen } from "@/components/StaticScreens";
import { DailyDevotionalScreen } from "@/components/DailyDevotionalScreen";
import { ReadingPlansScreen } from "@/components/ReadingPlansScreen";
import { ReadingPlanDetailScreen } from "@/components/ReadingPlanDetailScreen";
import { ChristianLibraryScreen } from "@/components/ChristianLibraryScreen";
import { LibraryArticleScreen } from "@/components/LibraryArticleScreen";
import { FavoritesScreen } from "@/components/FavoritesScreen";

import { supabase } from "@/integrations/supabase/client";
import { BibleRefProvider, type ParsedRef } from "@/lib/bible-refs";
import { translations } from "@/config/translations";
import { getLastReadAtMs, setLastReadAtNow } from "@/lib/notifications-last-seen";

import realisticFlame from "@/assets/realistic-flame.png";

const SUPPORTED_LANGUAGE_CODES = ["en", "es", "pt"];

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
  const fallback = (dailyContent[verseIndex] as any)[safeLang] || dailyContent[verseIndex].en;
  // Verse of the day is managed in the admin panel (verses table); the bundled
  // list is only a fallback when the table is empty or unreachable (offline).
  const [dbVerse, setDbVerse] = useState<{ verse: string; ref: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("verses")
          .select("text_en,ref_en,text_es,ref_es,text_pt,ref_pt")
          .eq("is_active", true)
          .order("order_index", { ascending: true });
        if (error) throw error;
        if (cancelled || !data?.length) return;
        const dayIndex = Math.floor(Date.now() / 86400000) % data.length;
        const row: any = data[dayIndex];
        const text = row[`text_${safeLang}`] || row.text_en;
        const ref = row[`ref_${safeLang}`] || row.ref_en;
        if (text) setDbVerse({ verse: text, ref: ref || "" });
      } catch (err) {
        console.error("Verse of the day could not be loaded", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeLang]);

  const today = dbVerse ? { ...fallback, verse: dbVerse.verse, ref: dbVerse.ref } : fallback;

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
    <div className="relative min-h-full overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none"
        style={{ backgroundImage: `url(${realisticFlame})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#641431]/20 blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[430px] px-4 pb-7 pt-4 md:max-w-[680px] lg:max-w-[820px]">
        <header className="relative mb-4 overflow-hidden rounded-[28px] border border-[#E5BB70]/20 bg-gradient-to-br from-[#301124]/90 via-[#1A0D18]/95 to-[#09080B] px-5 py-5 text-center shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#5C061F]/45 blur-3xl" />
          <div role="img" aria-label="Prayer & Fire" className="relative mx-auto mb-3 flex h-[66px] w-[66px] items-center justify-center rounded-full border border-[#E5BB70]/75 bg-[#5C061F] shadow-[0_6px_26px_rgba(219,179,117,0.14)]">
            <img src="/prayer-fire-official-logo.webp" alt="Prayer and Fire — logotipo oficial" className="h-full w-full rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          </div>
          <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-[#E8BD74]">PRAYER & FIRE</p>
          <h1 className="relative mx-auto max-w-[330px] text-[27px] font-extrabold leading-[1.12] tracking-tight">
            {L.tagline}<span className="block text-[#E8BD74]">{L.connects}</span>
          </h1>
          <p className="relative mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-zinc-300">{t("home_hero_subtitle")}</p>
        </header>

        <div className="space-y-3">
          <section className="rounded-[24px] border border-[#E5BB70]/25 bg-gradient-to-br from-[#21111C] via-[#170E16] to-[#100C12] p-5 shadow-[0_10px_32px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8BD74]">{L.verse}</p>
              <BookOpen className="h-4 w-4 text-[#E8BD74]" aria-hidden="true" />
            </div>
            <p className="text-[17px] font-medium leading-relaxed text-white">"{today.verse}"</p>
            <p className="mt-3 text-sm font-bold text-[#E8BD74]">— {today.ref}</p>
          </section>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <section className="min-w-0 rounded-[22px] border border-[#E5BB70]/20 bg-[#25101F]/90 p-4">
              <HandHeart className="mb-3 h-5 w-5 text-[#E8BD74]" aria-hidden="true" />
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8BD74]">{L.prayer}</p>
              <p className="break-words text-[13px] leading-relaxed text-zinc-100">{today.prayer}</p>
            </section>
            <section className="min-w-0 rounded-[22px] border border-[#E5BB70]/20 bg-[#18121D]/95 p-4">
              <Sparkles className="mb-3 h-5 w-5 text-[#E8BD74]" aria-hidden="true" />
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8BD74]">{L.reflection}</p>
              <p className="break-words text-[13px] leading-relaxed text-zinc-100">{today.reflection}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [page, setPageState] = useState<string>(() => {
    try {
      const savedPage = localStorage.getItem("pf_last_page") || "home";
      return savedPage === "profile" ? "settings" : savedPage;
    } catch {
      return "home";
    }
  });
  const [eventsOrigin, setEventsOrigin] = useState<string>("home");
  const pageRef = useRef(page);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const pageScrollPositionsRef = useRef<Record<string, number>>({});
  const pendingScrollRestoreRef = useRef<string | null>(null);

  const setPage = useCallback((p: string) => {
    const currentPage = pageRef.current;
    if (currentPage !== p) {
      const scrollContainer = contentScrollRef.current;
      if (scrollContainer) {
        pageScrollPositionsRef.current[currentPage] = scrollContainer.scrollTop;
      }
      pendingScrollRestoreRef.current = p;
    }
    pageRef.current = p;
    setPageState(p);
    try {
      localStorage.setItem("pf_last_page", p);
    } catch {}
  }, []);

  useEffect(() => {
    pageRef.current = page;

    if (pendingScrollRestoreRef.current !== page) return;
    pendingScrollRestoreRef.current = null;

    const savedScrollTop = pageScrollPositionsRef.current[page] || 0;
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) return;

    let attempts = 0;
    let timeoutId = 0;
    let frameId = 0;
    const restore = () => {
      scrollContainer.scrollTop = savedScrollTop;
      attempts += 1;
      if (attempts < 12) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(restore);
        }, 100);
      }
    };

    frameId = window.requestAnimationFrame(restore);
    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [page]);
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingBibleRef, setPendingBibleRef] = useState<
    (ParsedRef & { nonce: number }) | null
  >(null);
  const [bibleReturnTo, setBibleReturnTo] = useState<string | null>(null);
  const [bibleReading, setBibleReading] = useState(false);

  const openBibleRef = useCallback(
    (ref: ParsedRef) => {
      const origin = pageRef.current;
      if (origin && origin !== "bible") setBibleReturnTo(origin);
      setPendingBibleRef({ ...ref, nonce: Date.now() });
      setPage("bible");
    },
    [setPage],
  );

  const updateHeaderAvatar = useCallback((nextAvatar: string | null) => {
    setAvatarUrl(nextAvatar);
  }, []);

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
    let prevUserId: string | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      const nextUser = currentSession?.user ?? null;
      setUser(nextUser);
      // Only force Home on a true login transition (no user -> user),
      // not on session restore / token refresh after backgrounding.
      if (event === "SIGNED_IN" && !prevUserId && nextUser) {
        setPage("home");
      }
      if (event === "SIGNED_OUT") {
        setPage("home");
        setUnreadNotifications(0);
      }
      prevUserId = nextUser?.id ?? null;
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        prevUserId = session?.user?.id ?? null;
        // Do NOT reset to Home on resume — keep the last visited page.
      })
      .catch(() => {
        // Never leave the native app stuck on startup if session restore fails.
        setUser(null);
        prevUserId = null;
      })
      .finally(() => setLoading(false));

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

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && profile?.avatar_url) {
          setAvatarUrl(`${profile.avatar_url}?t=${Date.now()}`);
        } else if (!cancelled) {
          setAvatarUrl(null);
        }
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, page]);

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
      <div className="flex items-center justify-center min-h-dvh bg-background">
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
    <BibleRefProvider openRef={openBibleRef}>
    <div
      className="fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-black font-sans"
    >
      <div
        className="relative z-30 shrink-0 bg-black border-b border-zinc-800"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex justify-between items-center px-4 h-11">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage("settings")}
              aria-label={t("profile")}
              className="w-10 h-10 -ml-1 flex items-center justify-center"
            >
              <span className="h-9 w-9 rounded-full border border-[#D6AA69]/40 bg-zinc-900 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t("profile")} className="h-full w-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <UserIcon className="w-5 h-5 text-[#E8BD74]" />
                )}
              </span>
            </button>
            {unreadNotifications > 0 && (
              <button
                onClick={openNotifications}
                aria-label={t("notifications")}
                className="relative w-10 h-10 flex items-center justify-center text-blue-500"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              </button>
            )}
          </div>

          {!bibleReading && (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Menu"
              className="text-[#E8BD74] w-10 h-10 flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        language={language}
        t={t}
        onNavigate={(p) => setPage(p)}
      />

      <div
        ref={contentScrollRef}
        className={`flex-1 min-h-0 overflow-y-auto bg-black ${page === "bible" ? "pt-0" : "pt-3"}`}
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
      >
        {page === "home" && <HomeScreen t={t} language={language} />}
        {page === "shopping" && <ShoppingScreen t={t} />}
        {page === "bible" && (
          <BibleScreen
            t={t}
            language={language}
            initialRef={pendingBibleRef}
            onInitialRefApplied={() => setPendingBibleRef(null)}
            onReadingChange={setBibleReading}
            onExitToOrigin={
              bibleReturnTo
                ? () => {
                    const target = bibleReturnTo;
                    setBibleReturnTo(null);
                    setPage(target);
                  }
                : undefined
            }
          />
        )}

        {page === "settings" && (
          <SettingsScreen
            t={t}
            language={language}
            setLanguage={() => setShowLanguages(true)}
            userName={userName}
            userEmail={user?.email || ""}
            onAdminClick={() => setPage("admin")}
            onNotificationsClick={openNotifications}
            onLegalClick={() => setPage("legal")}
            onProfileUpdated={updateHeaderAvatar}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onSignOut={async () => {
              try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
              } catch (err) {
                console.error("Sign out failed", err);
              } finally {
                setUser(null);
                setPage("home");
              }
            }}
            isGuest={false}
          />
        )}

        {page === "social" && (
          <SocialLinksScreen
            t={t}
            onBack={() => setPage("home")}
            onNavigateToEvents={() => {
              setEventsOrigin("social");
              setPage("events");
            }}
          />
        )}
        {page === "events" && <EventsScreen t={t} onBack={() => setPage(eventsOrigin)} />}
        {page === "admin" && <AdminPanel t={t} onBack={() => setPage("settings")} />}
        {page === "notifications" && <NotificationsScreen t={t} onBack={() => setPage("settings")} />}
        {page === "legal" && <LegalCenter t={t} onBack={() => setPage("settings")} />}

        {page === "library" && (
          <ChristianLibraryScreen
            onBack={() => setPage("home")}
            language={language}
            onOpenArticle={(id) => setPage(`article:${id}`)}
            onNavigate={(p) => setPage(p)}
          />
        )}
        {page === "favorites" && (
          <FavoritesScreen
            onBack={() => setPage("home")}
            language={language}
            onOpen={(p) => setPage(p)}
          />
        )}
        {page.startsWith("article:") && (
          <LibraryArticleScreen
            articleId={page.slice(8)}
            onBack={() => setPage("library")}
            language={language}
          />
        )}
        {page === "devotional" && (
          <DailyDevotionalScreen onBack={() => setPage("home")} language={language} />
        )}
        {page === "reading-plans" && (
          <ReadingPlansScreen
            onBack={() => setPage("home")}
            language={language}
            onOpenPlan={(id) => setPage(`plan:${id}`)}
          />
        )}
        {page.startsWith("plan:") && (
          <ReadingPlanDetailScreen
            planId={page.slice(5)}
            onBack={() => setPage("reading-plans")}
            language={language}
          />
        )}
        {page === "about" && <AboutScreen onBack={() => setPage("home")} language={language} />}
        {page === "solas" && (
          <SolasListScreen
            onBack={() => setPage("home")}
            onOpen={(slug) => setPage(`sola:${slug}`)}
            language={language}
          />
        )}
        {page.startsWith("sola:") && (
          <SolaDetailScreen
            slug={page.slice(5)}
            onBack={() => setPage("solas")}
            language={language}
          />
        )}
        {page === "greek-words" && (
          <GreekWordsListScreen
            onBack={() => setPage("home")}
            onOpen={(slug) => setPage(`greek:${slug}`)}
            language={language}
          />
        )}
        {page.startsWith("greek:") && (
          <GreekWordDetailScreen
            slug={page.slice(6)}
            onBack={() => setPage("greek-words")}
            language={language}
          />
        )}
      </div>

      {page !== "admin" && (
      <div className="relative z-50 shrink-0 bg-black border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex justify-around items-center h-[64px] px-4 max-w-[430px] md:max-w-[680px] lg:max-w-[820px] mx-auto">
          <button aria-label={t("home")} onClick={() => setPage("home")} className={page === "home" ? "text-[#E8BD74]" : "text-zinc-500"}>
            <Flame className="w-6 h-6" />
          </button>
          <button aria-label={language === "es" ? "Comunidad" : language === "pt" ? "Comunidade" : "Community"} onClick={() => navigate("/community")} className="text-zinc-500">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button aria-label={t("holy_bible")} onClick={() => { setBibleReturnTo(null); setPage("bible"); }} className={page === "bible" ? "text-[#E8BD74]" : "text-zinc-500"}>
            <BookOpen className="w-6 h-6" />
          </button>
          <button aria-label={language === "es" ? "Biblioteca" : language === "pt" ? "Biblioteca" : "Library"} onClick={() => setPage("library")} className={page === "library" || page.startsWith("article:") ? "text-[#E8BD74]" : "text-zinc-500"}>
            <LibraryIcon className="w-6 h-6" />
          </button>
        </nav>
      </div>
      )}
    </div>
    </BibleRefProvider>
  );
}
