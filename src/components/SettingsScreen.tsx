import React, { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Languages, Share2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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

  const handleShareApp = async () => {
    const appUrl = "https://prayerandfire.org";

    const shareData = {
      title: "Prayer & Fire",
      text: "Join Prayer & Fire global movement.",
      url: appUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(appUrl);

      toast({
        title: "Link copied",
        description: "Prayer & Fire link copied to clipboard.",
      });
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      await navigator.clipboard.writeText(appUrl);

      toast({
        title: "Link copied",
        description: "Prayer & Fire link copied to clipboard.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-4xl font-bold text-white mb-8">Settings</h2>

      {/* Profile Card */}
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

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Notifications */}
        <button onClick={onNotificationsClick} className="bg-card border border-border rounded-3xl p-6 text-left">
          <Bell className="w-8 h-8 text-orange-500 mb-5" />

          <h3 className="text-2xl text-white font-medium">Notifications</h3>

          <p className="text-zinc-500 mt-2">View</p>
        </button>

        {/* Language */}
        <button onClick={setLanguage} className="bg-card border border-border rounded-3xl p-6 text-left">
          <Languages className="w-8 h-8 text-orange-500 mb-5" />

          <h3 className="text-2xl text-white font-medium">Language</h3>

          <p className="text-zinc-500 mt-2">Change Language</p>
        </button>

        {/* Share */}
        <button onClick={handleShareApp} className="bg-card border border-border rounded-3xl p-6 text-left">
          <Share2 className="w-8 h-8 text-orange-500 mb-5" />

          <h3 className="text-2xl text-white font-medium">Share Prayer & Fire App</h3>

          <p className="text-zinc-500 mt-2">Invite your friends</p>
        </button>

        {/* Legal */}
        <button onClick={onLegalClick} className="bg-card border border-border rounded-3xl p-6 text-left">
          <Scale className="w-8 h-8 text-orange-500 mb-5" />

          <h3 className="text-2xl text-white font-medium">Legal & Policies</h3>

          <p className="text-zinc-500 mt-2">View</p>
        </button>
      </div>

      {/* Admin */}
      {isAdmin && !isGuest && (
        <button
          onClick={onAdminClick}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl text-2xl transition-all"
        >
          Admin Panel
        </button>
      )}

      {/* Sign Out */}
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
