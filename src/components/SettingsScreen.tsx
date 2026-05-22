import React, { useEffect, useState } from "react";
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
  userName,
  userEmail,
  onAdminClick,
  onProfileClick,
  onNotificationsClick,
  onLegalClick,
  onSignOut,
  setLanguage,
  isGuest,
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
      setAvatarUrl(`${profile.avatar_url}?t=${Date.now()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-32">
      <h2 className="text-4xl font-bold text-white mb-8">Settings</h2>

      <button onClick={onProfileClick} className="w-full bg-card border border-border rounded-3xl p-5 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-orange-500" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-white">Profile</h3>
              <p className="text-zinc-400 mt-2">Name: {userName || "User"}</p>
              <p className="text-zinc-400">Email: {userEmail}</p>
            </div>
          </div>

          <span className="text-zinc-500 text-lg">Edit</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-5">
        <SettingsTile icon={<Bell />} title="Notifications" sub="View" onClick={onNotificationsClick} />

        <SettingsTile icon={<Languages />} title="Language" sub="Change Language" onClick={setLanguage} />

        <SettingsTile icon={<Scale />} title="Legal & Policies" sub="View" onClick={onLegalClick} />
      </div>

      {isAdmin && !isGuest && (
        <button
          onClick={onAdminClick}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl text-2xl"
        >
          Admin Panel
        </button>
      )}

      {!isGuest && (
        <button
          onClick={onSignOut}
          className="w-full border border-border bg-card text-white py-5 rounded-2xl text-2xl"
        >
          Sign Out
        </button>
      )}
    </div>
  );
}

function SettingsTile({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="bg-card border border-border rounded-3xl p-6 text-left min-h-[170px]">
      <div className="text-orange-500 mb-5 [&_svg]:w-8 [&_svg]:h-8">{icon}</div>
      <h3 className="text-2xl text-white font-medium">{title}</h3>
      <p className="text-zinc-500 mt-2">{sub}</p>
    </button>
  );
}
