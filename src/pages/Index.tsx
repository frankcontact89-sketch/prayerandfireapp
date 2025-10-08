import React, { useState, useEffect } from "react";
import { SignInScreen } from "@/components/SignInScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { LiveStreamScreen } from "@/components/LiveStreamScreen";
import { LiveChatScreen } from "@/components/LiveChatScreen";
import { EventsScreen } from "@/components/EventsScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { Home, Heart, User, Settings, Instagram, Youtube, MessageCircle, Video, Flame, Share2, Tv, Calendar, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });
  const [loading, setLoading] = useState(true);

  const t = (en: string, es: string) => {
    if (language === "es") return es;
    if (language === "en") return en;
    
    // For other languages, try to use cached translation or return English
    const cacheKey = `${language}_${en}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
    
    return en; // Fallback to English while translation loads
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

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem("app_language", newLang);
    
    // Pre-translate common UI strings when language changes
    if (newLang !== "en" && newLang !== "es") {
      const commonStrings = [
        "Home", "Stream", "Chat", "Giving", "Settings", "Profile", 
        "Events", "Sign Out", "Loading...", "Welcome"
      ];
      commonStrings.forEach(str => translateText(str, newLang));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary text-lg">{t("Loading...", "Cargando...")}</div>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen setUser={setUser} t={t} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          {/* Settings Left */}
          <button
            onClick={() => setPage("settings")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-semibold hidden sm:inline">Settings</span>
          </button>

          {/* Title Center with Icon */}
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-extrabold text-primary tracking-tight">
              PRAYER & FIRE
            </h1>
          </div>

          {/* Menu Right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setPage("events")}>
                <Calendar className="w-4 h-4 mr-2" />
                {t("Events", "Eventos")}
              </DropdownMenuItem>
              <div className="h-px bg-border my-1" />
              <DropdownMenuItem onClick={() => window.open("https://instagram.com/seloprayerandfire", "_blank")}>
                <Instagram className="w-4 h-4 mr-2 text-pink-600" />
                Instagram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("https://wa.me/1XXXXXXXXXX", "_blank")}>
                <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("https://youtube.com", "_blank")}>
                <Youtube className="w-4 h-4 mr-2 text-red-600" />
                YouTube
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("https://zoom.us", "_blank")}>
                <Video className="w-4 h-4 mr-2 text-blue-600" />
                Zoom
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {page === "home" && <HomeScreen t={t} />}
        {page === "stream" && <LiveStreamScreen t={t} />}
        {page === "chat" && <LiveChatScreen t={t} />}
        {page === "events" && <EventsScreen t={t} />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "shopping" && <ShoppingScreen t={t} />}
        {page === "profile" && (
          <ProfileScreen
            t={t}
            language={language}
            setLanguage={handleLanguageChange}
            signOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          />
        )}
        {page === "settings" && (
          <SettingsScreen 
            t={t} 
            language={language}
            setLanguage={handleLanguageChange}
            onAdminClick={() => setPage("admin")}
            onProfileClick={() => setPage("profile")}
            onSignOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          />
        )}
        {page === "admin" && <AdminPanel t={t} onBack={() => setPage("settings")} />}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-40">
        <nav className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl px-6 py-3 flex gap-8 items-center">
          <button
            onClick={() => setPage("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-bold whitespace-nowrap">{t("Home", "Inicio")}</span>
          </button>
          <button
            onClick={() => setPage("stream")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "stream" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-xs font-bold whitespace-nowrap">{t("Stream", "Stream")}</span>
          </button>
          <button
            onClick={() => setPage("chat")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "chat" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-bold whitespace-nowrap">{t("Chat", "Chat")}</span>
          </button>
          <button
            onClick={() => setPage("giving")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "giving" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs font-bold whitespace-nowrap">{t("Give", "Dar")}</span>
          </button>
          <button
            onClick={() => setPage("shopping")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "shopping" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-bold whitespace-nowrap">{t("Shop", "Tienda")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
