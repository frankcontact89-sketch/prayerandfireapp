import React, { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Languages, Scale, LogOut, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsScreenProps {
  t: (key: string) => string;
  language: string;
  setLanguage: () => void;
  userName: string;
  userEmail: string;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onLegalClick: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isGuest?: boolean;
}

export function SettingsScreen({
  t,
  language,
  setLanguage,
  userName,
  userEmail,
  onAdminClick,
  onProfileClick,
  onNotificationsClick,
  onLegalClick,
  onSignOut,
  isDarkMode,
  onToggleDarkMode,
  isGuest,
}: SettingsScreenProps) {
  const { isAdmin } = useUserRole();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

    if (profile?.avatar_url) {
      setAvatarUrl(`${profile.avatar_url}?t=${Date.now()}`);
    }
  };

  const label = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 pb-32 space-y-5">
      <h2 className="text-3xl font-bold text-white">{label("settings", "Settings")}</h2>

      <button onClick={onProfileClick} className="w-full bg-card border border-border rounded-2xl p-4 text-left">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-orange-500/30 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-orange-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-white">{label("profile", "Profile")}</h3>
            <p className="text-sm text-zinc-400">
              {label("name", "Name")}: {userName || "User"}
            </p>
            <p className="text-sm text-zinc-400 truncate">
              {label("email", "Email")}: {userEmail}
            </p>
          </div>

          <span className="text-zinc-500 text-sm">{label("edit", "Edit")}</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-2xl p-4 h-[135px] text-left"
        >
          <Bell className="w-7 h-7 text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-white">{label("notifications", "Notifications")}</h3>
          <p className="text-sm text-zinc-500">{label("view", "View")}</p>
        </button>

        <button onClick={setLanguage} className="bg-card border border-border rounded-2xl p-4 h-[135px] text-left">
          <Languages className="w-7 h-7 text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-white">{label("language", "Language")}</h3>
          <p className="text-sm text-zinc-500">{language.toUpperCase()}</p>
        </button>

        <button onClick={onLegalClick} className="bg-card border border-border rounded-2xl p-4 h-[135px] text-left">
          <Scale className="w-7 h-7 text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-white">Legal</h3>
          <p className="text-sm text-zinc-500">{label("view", "View")}</p>
        </button>

        <button onClick={onToggleDarkMode} className="bg-card border border-border rounded-2xl p-4 h-[135px] text-left">
          <Moon className="w-7 h-7 text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-white">Theme</h3>
          <p className="text-sm text-zinc-500">{isDarkMode ? "Dark" : "Light"}</p>
        </button>
      </div>

      {isAdmin && !isGuest && (
        <button onClick={onAdminClick} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-xl">
          Admin Panel
        </button>
      )}

      {!isGuest && (
        <button
          onClick={onSignOut}
          className="w-full bg-card border border-border text-white font-bold py-4 rounded-2xl text-xl flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      )}
    </div>
  );
}
