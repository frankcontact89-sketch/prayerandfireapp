import React, { useState, useEffect } from "react";
import { SignInScreen } from "@/components/SignInScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { EventsScreen } from "@/components/EventsScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { SocialLinksScreen } from "@/components/SocialLinksScreen";
import { LanguagesScreen } from "@/components/LanguagesScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { NotificationsScreen } from "@/components/NotificationsScreen";
import { Module2Screen } from "@/components/Module2Screen";
import { LegalCenter } from "@/components/LegalCenter";
import { LandingPage } from "@/components/LandingPage";
import { PublicLegalCenter } from "@/components/PublicLegalCenter";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Heart, Settings, Share2, ShoppingBag, Flame, GraduationCap, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translations, SupportedLanguage } from "@/config/translations";
import { useToast } from "@/hooks/use-toast";
import { FloatingFireButton } from "@/components/FloatingFireButton";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [showLanding, setShowLanding] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [publicLegalSection, setPublicLegalSection] = useState<string | undefined>(undefined);
  const [showLanguages, setShowLanguages] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("pf_dark_mode");
    return saved === "true" || saved === null;
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  // Removed: unreadNotifications state (badge removed)
  // Removed: newEventsCount state (badge removed)
  const [hasCoursesAccess, setHasCoursesAccess] = useState(false);
  const { toast } = useToast();

  // Apply dark mode class to html element
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("pf_dark_mode", String(newMode));
  };

  const t = (key: keyof typeof translations.en): string => {
    const lang = language as SupportedLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  // Function to translate text to selected language
  const translateText = async (text: string, targetLang: string) => {
    if (targetLang === "en" || targetLang === "es") return;
    
    const cacheKey = `${targetLang}_${text}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return;

    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, targetLang }
      });
      
      if (!error && data?.translatedText) {
        localStorage.setItem(cacheKey, data.translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const handleLanguageChange = async (langCode: string, langName: string) => {
    try {
      localStorage.setItem("pf_lang", langCode);
      setLanguage(langCode);
      
      // Pre-translate common UI strings for non-supported languages
      if (!["en", "es", "fr"].includes(langCode)) {
        const commonStrings = [
          "Home", "Stream", "Chat", "Giving", "Settings", "Profile", 
          "Events", "Sign Out", "Loading...", "Welcome", "Links", "Shopping"
        ];
        await Promise.all(commonStrings.map(str => translateText(str, langCode)));
      }
      
      toast({
        title: "Success",
        description: `Language changed to: ${langName} ✅`,
      });
      
      setPage("home");
    } catch (error) {
      console.error("Language change error:", error);
    }
  };

  // Removed: fetchUnreadNotifications (badge removed)

  // Removed: fetchUpcomingEvents (badge removed)

  const checkCoursesAccess = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setHasCoursesAccess(false);
      return;
    }

    const { data, error } = await supabase
      .from("purchases")
      .select(`id, products!inner(name)`)
      .eq("user_id", currentUser.id)
      .eq("products.name", "Cursos Prayer & Fire")
      .limit(1);

    if (!error && data && data.length > 0) {
      setHasCoursesAccess(true);
    } else {
      setHasCoursesAccess(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Reset welcome check when user signs out
      if (event === 'SIGNED_OUT') {
        setShowWelcome(false);
        setWelcomeChecked(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize user-related checks (no header badges)
  useEffect(() => {
    if (user) {
      checkWelcomeSeen();
      checkCoursesAccess();
    }
  }, [user]);

  // Check if user has seen welcome screen
  const checkWelcomeSeen = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setWelcomeChecked(true);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_seen")
      .eq("id", currentUser.id)
      .maybeSingle();

    // Only show welcome if profile exists and welcome_seen is false
    if (profile && profile.welcome_seen === false) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
    setWelcomeChecked(true);
  };

  // Mark welcome as seen
  const markWelcomeSeen = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    await supabase
      .from("profiles")
      .update({ welcome_seen: true })
      .eq("id", currentUser.id);

    setShowWelcome(false);
  };

  const handleWelcomeContinue = () => {
    markWelcomeSeen();
    setPage("home");
  };

  const handleWelcomeExploreStore = () => {
    markWelcomeSeen();
    setPage("shopping");
  };

  // Show public legal center if accessed from landing
  if (showLanding && publicLegalSection !== undefined) {
    return (
      <PublicLegalCenter 
        onBack={() => setPublicLegalSection(undefined)} 
        defaultOpen={publicLegalSection || undefined}
      />
    );
  }

  // Show public landing page first (no login required)
  if (showLanding && !user) {
    return (
      <LandingPage
        t={t}
        onOpenApp={() => setShowLanding(false)}
        onOpenLegal={(section) => setPublicLegalSection(section || "")}
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
        setUser={setUser}
        t={t}
        onShowLanguages={() => {}}
        currentLanguage={language}
      />
    );
  }

  // Show welcome screen ONLY for first-time users after check completes
  if (welcomeChecked && showWelcome) {
    return (
      <WelcomeScreen
        t={t}
        onContinue={handleWelcomeContinue}
        onExploreStore={handleWelcomeExploreStore}
      />
    );
  }

  if (showLanguages) {
    return (
      <LanguagesScreen
        t={t}
        currentLanguage={language}
        onLanguageChange={(code, name) => {
          handleLanguageChange(code, name);
          setShowLanguages(false);
        }}
        onBack={() => setShowLanguages(false)}
      />
    );
  }

  const openNotifications = () => {
    setPage("notifications");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          {/* Settings Left with Notification Flame */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage("settings")}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={() => setPage("events")}
              className="text-primary hover:text-primary/80 transition-colors"
              aria-label={t("events")}
            >
              <Calendar className="w-6 h-6" />
            </button>
          </div>

          {/* Title Center */}
          <h1 className="text-xl font-bold text-foreground">
            Prayer & Fire
          </h1>

          {/* Social Right */}
          <button
            onClick={() => setPage("social")}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {page === "home" && <HomeScreen t={t} />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "shopping" && <ShoppingScreen t={t} />}
        {page === "module2" && <Module2Screen t={t} onBack={() => setPage("home")} onGoToStore={() => setPage("shopping")} />}
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
            }}
          />
        )}
        {page === "legal" && <LegalCenter t={t} onBack={() => setPage("settings")} />}
        {page === "social" && <SocialLinksScreen t={t} onBack={() => setPage("home")} onNavigateToEvents={() => setPage("events")} />}
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
            }}
          />
        )}
        {page === "notifications" && (
          <NotificationsScreen 
            t={t} 
            onBack={() => {
              setPage("settings");
            }} 
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <nav className="flex justify-around items-center py-3 px-4 max-w-2xl mx-auto">
          <button
            onClick={() => setPage("home")}
            className={`flex flex-col items-center gap-1 transition-all ${
              page === "home" ? "text-primary animate-pulse" : "text-muted-foreground hover:scale-110"
            }`}
          >
            <Flame className="w-6 h-6" />
          </button>
          <button
            onClick={() => setPage("giving")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "giving" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className="w-6 h-6" />
          </button>
          <button
            onClick={() => setPage("module2")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "module2" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <GraduationCap className="w-6 h-6" />
          </button>
          <button
            onClick={() => setPage("shopping")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "shopping" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
          </button>
        </nav>
      </div>

      {/* Floating Fire Button */}
      <FloatingFireButton onClick={() => setPage("home")} />
    </div>
  );
}
