import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Languages, Scale } from "lucide-react";

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
  userEmail,
  onAdminClick,
  onProfileClick,
  onNotificationsClick,
  onLegalClick,
}: SettingsScreenProps) {
  const { isAdmin } = useUserRole();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
      <h1 className="text-4xl font-bold text-white">Settings</h1>

      {/* PROFILE */}
      <button onClick={onProfileClick} className="w-full bg-[#050505] border border-white/10 rounded-3xl p-5 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-black border border-orange-500/30 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-orange-500" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-3xl font-bold text-white">Profile</div>

              <div className="text-lg text-white/70 mt-2">Name: User</div>

              <div className="text-base text-white/50 truncate max-w-[180px]">{userEmail}</div>
            </div>
          </div>

          <div className="text-white/40 text-lg">Edit</div>
        </div>
      </button>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* NOTIFICATIONS */}
        <button
          onClick={onNotificationsClick}
          className="bg-[#050505] border border-white/10 rounded-3xl p-5 h-[170px] text-left"
        >
          <Bell className="w-10 h-10 text-orange-500 mb-6" />

          <div className="text-2xl font-semibold text-white">Notifications</div>

          <div className="text-white/45 text-lg mt-2">View</div>
        </button>

        {/* LANGUAGE */}
        <button
          onClick={setLanguage}
          className="bg-[#050505] border border-white/10 rounded-3xl p-5 h-[170px] text-left"
        >
          <Languages className="w-10 h-10 text-orange-500 mb-6" />

          <div className="text-2xl font-semibold text-white">Language</div>

          <div className="text-white/45 text-lg mt-2">Change Language</div>
        </button>

        {/* LEGAL */}
        <button
          onClick={onLegalClick}
          className="bg-[#050505] border border-white/10 rounded-3xl p-5 h-[170px] text-left"
        >
          <Scale className="w-10 h-10 text-orange-500 mb-6" />

          <div className="text-2xl font-semibold text-white">Legal & Policies</div>

          <div className="text-white/45 text-lg mt-2">View</div>
        </button>
      </div>

      {/* ADMIN */}
      {isAdmin && (
        <button onClick={onAdminClick} className="w-full bg-orange-500 text-white text-3xl font-bold rounded-3xl py-6">
          Admin Panel
        </button>
      )}
    </div>
  );
}
