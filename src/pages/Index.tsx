import React, { useState } from "react";
import { SignInScreen } from "@/components/SignInScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { Home, Heart, User, Settings, Instagram, Youtube, MessageCircle, Video, ShoppingBag, Flame } from "lucide-react";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [language, setLanguage] = useState("en");

  const t = (en: string, es: string) => (language === "en" ? en : es);

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

          {/* Social Links Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open("https://instagram.com/seloprayerandfire", "_blank")}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.open("https://wa.me/1XXXXXXXXXX", "_blank")}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.open("https://youtube.com", "_blank")}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.open("https://zoom.us", "_blank")}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Zoom"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {page === "home" && <HomeScreen t={t} />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "profile" && (
          <ProfileScreen
            t={t}
            language={language}
            setLanguage={setLanguage}
            signOut={() => setUser(null)}
          />
        )}
        {page === "settings" && <SettingsScreen t={t} />}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-40">
        <nav className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl px-6 py-3 flex gap-8 items-center max-w-md">
          <button
            onClick={() => setPage("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-bold">{t("Home", "Inicio")}</span>
          </button>
          <button
            onClick={() => setPage("giving")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "giving" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs font-bold">{t("Giving", "Ofrendas")}</span>
          </button>
          <button
            onClick={() => window.open("https://store.example.com", "_blank")}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground hover:text-primary"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-bold">{t("Store", "Tienda")}</span>
          </button>
          <button
            onClick={() => setPage("profile")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              page === "profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-bold">{t("Profile", "Perfil")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
