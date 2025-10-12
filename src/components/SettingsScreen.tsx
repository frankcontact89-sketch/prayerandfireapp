import React from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface SettingsScreenProps {
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  userName: string;
  userEmail: string;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onSignOut: () => void;
}

export function SettingsScreen({ t, language, setLanguage, userName, userEmail, onAdminClick, onProfileClick, onSignOut }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        ⚙️ {t("settings")}
      </h2>

      {/* Profile Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-primary">
          {t("profile")}
        </h3>
        <p className="text-foreground">
          Name: {userName || "User"}
        </p>
        <p className="text-foreground">
          Email: {userEmail}
        </p>
      </div>

      {/* Language Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-primary">
          {t("language")}
        </h3>
        <button
          onClick={() => setLanguage(language)}
          className="w-full px-4 py-3 bg-secondary text-foreground rounded-xl border border-border hover:bg-secondary/80 transition-colors text-left"
        >
          🌍 {t("changeLanguage")}
        </button>
        <p className="text-sm text-muted-foreground">
          🌐 Select your preferred language (130+ available)
        </p>
      </div>

      {/* Notifications Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-primary">
          {t("notifications")}
        </h3>
        <p className="text-muted-foreground">
          🔔 Enabled (simulated)
        </p>
      </div>

      {/* Admin Panel Section */}
      {loading ? (
        <div className="text-muted-foreground">
          Loading admin status...
        </div>
      ) : (
        isAdmin && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary">
              {t("admin")}
            </h3>
            <button
              onClick={onAdminClick}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
            >
              {t("adminPanel")}
            </button>
          </div>
        )
      )}

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="mt-8 text-primary hover:text-primary/80 font-semibold text-center w-full"
      >
        {t("signout")}
      </button>
    </div>
  );
}
