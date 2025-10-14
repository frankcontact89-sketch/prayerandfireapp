import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, Moon, Zap, Shield, Download, Globe, Smartphone, User } from "lucide-react";

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

export function SettingsScreen({ t, userName, userEmail, onAdminClick, onSignOut }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("settings")}
      </h2>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {t("profile")}
          </h3>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Name:</span> {userName || "User"}
          </p>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Email:</span> {userEmail}
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Push Notifications */}
        <button className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95">
          <Bell className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Push Alerts</p>
          <p className="text-xs text-muted-foreground mt-1">On</p>
        </button>

        {/* Dark Mode */}
        <button className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95">
          <Moon className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Dark Mode</p>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </button>

        {/* Performance */}
        <button className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95">
          <Zap className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Performance</p>
          <p className="text-xs text-muted-foreground mt-1">Optimized</p>
        </button>

        {/* Privacy */}
        <button className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95">
          <Shield className="w-6 h-6 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Privacy</p>
          <p className="text-xs text-muted-foreground mt-1">Secure</p>
        </button>
      </div>

      {/* Advanced Features */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Advanced
        </h3>
        
        {/* Offline Mode */}
        <button className="w-full bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-colors text-left flex items-center gap-3">
          <Download className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Offline Mode</p>
            <p className="text-xs text-muted-foreground">Download content for offline access</p>
          </div>
        </button>

        {/* Multi-Device Sync */}
        <button className="w-full bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-colors text-left flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Device Sync</p>
            <p className="text-xs text-muted-foreground">Sync across all your devices</p>
          </div>
        </button>

        {/* Auto-Translation */}
        <button className="w-full bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-colors text-left flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Auto-Translate</p>
            <p className="text-xs text-muted-foreground">Automatic content translation</p>
          </div>
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
