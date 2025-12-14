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
import { Heart, Settings, Share2, ShoppingBag, Flame, GraduationCap, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translations, SupportedLanguage } from "@/config/translations";
import { useToast } from "@/hooks/use-toast";
import { FloatingFireButton } from "@/components/FloatingFireButton";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [showLanguages, setShowLanguages] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("pf_dark_mode");
    return saved === "true" || saved === null;
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [newEventsCount, setNewEventsCount] = useState(0);
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

  const fetchUnreadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq("is_read", false);

    if (!error && data) {
      setUnreadNotifications(data.length);
    }
  };

  const fetchUpcomingEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString());

    if (!error && data) {
      setNewEventsCount(data.length);
    }
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch unread notifications and events, subscribe to changes
  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
      fetchUpcomingEvents();
      
      const notificationsChannel = supabase
        .channel('notifications-unread')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          () => {
            fetchUnreadNotifications();
          }
        )
        .subscribe();

      const eventsChannel = supabase
        .channel('events-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events'
          },
          () => {
            fetchUpcomingEvents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(eventsChannel);
      };
    }
  }, [user]);

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
            {unreadNotifications > 0 && (
              <button
                onClick={() => {
                  setUnreadNotifications(0);
                  setPage("notifications");
                }}
                className="relative animate-vibrate"
              >
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              </button>
            )}
            {newEventsCount > 0 && page !== "events" && (
              <button
                onClick={() => {
                  setNewEventsCount(0);
                  setPage("events");
                }}
                className="relative animate-vibrate"
              >
                <Calendar className="w-6 h-6 text-orange-500" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {newEventsCount}
                </span>
              </button>
            )}
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
        {page === "module2" && <Module2Screen t={t} onBack={() => setPage("home")} />}
        {page === "settings" && (
          <SettingsScreen 
            t={t} 
            language={language}
            setLanguage={() => setShowLanguages(true)}
            userName={userName}
            userEmail={user?.email || ""}
            onAdminClick={() => setPage("admin")}
            onProfileClick={() => setPage("profile")}
            onNotificationsClick={() => setPage("notifications")}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onSignOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          />
        )}
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
              fetchUnreadNotifications();
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
