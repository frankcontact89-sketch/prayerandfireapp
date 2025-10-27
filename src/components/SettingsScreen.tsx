import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, Globe, User, Languages } from "lucide-react";

interface SettingsScreenProps {
  t: (key: string) => string;
  language: string;
  setLanguage: () => void;
  userName: string;
  userEmail: string;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsScreen({ t, userName, userEmail, onAdminClick, onProfileClick, onNotificationsClick, onSignOut, setLanguage, isDarkMode, onToggleDarkMode }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("settings")}
      </h2>

      {/* Profile Section */}
      <button
        onClick={onProfileClick}
        className="w-full bg-card border border-border rounded-xl p-5 space-y-3 hover:bg-secondary transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("profile")}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">{t("edit")}</span>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Name:</span> {userName || "User"}
          </p>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Email:</span> {userEmail}
          </p>
        </div>
      </button>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Push Notifications */}
        <button 
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Bell className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">{t("notifications")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("view")}</p>
        </button>

        {/* Language Selection */}
        <button 
          onClick={setLanguage}
          className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Languages className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">{t("language")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("changeLanguage")}</p>
        </button>
      </div>


      {/* Admin Panel Section */}
      {loading ? (
        <div className="text-muted-foreground text-center py-4">
          Loading admin status...
        </div>
      ) : (
        isAdmin && (
          <button
            onClick={onAdminClick}
            className="w-full px-4 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-95 font-semibold shadow-lg shadow-primary/20"
          >
            {t("adminPanel")}
          </button>
        )
      )}

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="mt-4 text-muted-foreground hover:text-destructive font-medium text-center w-full transition-colors"
      >
        {t("signout")}
      </button>
    </div>
  );
}
