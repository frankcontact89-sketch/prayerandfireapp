import React, { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Scale, LogOut } from "lucide-react";
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
    <div className="max-w-2xl mx-auto px-5 py-5 pb-32 space-y-4">
      <h2 className="text-3xl font-bold text-white">Settings</h2>

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
            <h3 className="text-xl font-bold text-white">Profile</h3>
            <p className="text-sm text-zinc-400">Name: {userName || "User"}</p>
            <p className="text-sm text-zinc-400 truncate">{userEmail}</p>
          </div>

          <span className="text-zinc-500 text-sm">Edit</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-2xl p-4 h-[125px] text-left"
        >
          <Bell className="w-7 h-7 text-orange-500 mb-3" />
          <h3 className="text-lg font-bold text-white">Notifications</h3>
          <p className="text-sm text-zinc-500">View</p>
        </button>

        <button onClick={onLegalClick} className="bg-card border border-border rounded-2xl p-4 h-[125px] text-left">
          <Scale className="w-7 h-7 text-orange-500 mb-3" />
          <h3 className="text-lg font-bold text-white">Legal</h3>
          <p className="text-sm text-zinc-500">View</p>
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
