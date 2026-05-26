import React, { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Scale, LogOut, Languages } from "lucide-react";
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
  language,
  setLanguage,
  userName,
  userEmail,
  onAdminClick,
  onProfileClick,
  onNotificationsClick,
  onLegalClick,
  onSignOut,
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-3 pb-24 space-y-3">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      <button onClick={onProfileClick} className="w-full bg-card border border-border rounded-2xl p-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-orange-500/30 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-orange-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white">Profile</h3>
            <p className="text-xs text-zinc-400">Name: {userName || "User"}</p>
            <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
          </div>

          <span className="text-zinc-500 text-xs">Edit</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left"
        >
          <Bell className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          <p className="text-xs text-zinc-500">View</p>
        </button>

        <button onClick={onLegalClick} className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left">
          <Scale className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white">Legal</h3>
          <p className="text-xs text-zinc-500">View</p>
        </button>

        <button onClick={setLanguage} className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left">
          <Languages className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white">Language</h3>
          <p className="text-xs text-zinc-500 uppercase">{language || "EN"}</p>
        </button>
      </div>

      {isAdmin && !isGuest && (
        <button
          onClick={onAdminClick}
          className="w-full max-w-xs mx-auto block bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm"
        >
          Admin Panel
        </button>
      )}

      {!isGuest && (
        <button
          onClick={onSignOut}
          className="w-full bg-card border border-border text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      )}
    </div>
  );
}
