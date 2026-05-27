import React, { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, User, Scale, LogOut, Languages, CreditCard } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/config/constants";

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

  const openCustomerPortal = () => {
    window.open("https://billing.stripe.com/p/login/cNi00j3Ru6Aq5qD1rt7bW00", "_blank");
  };

  return (
    <div className="max-w-[430px] mx-auto px-4 py-3 pb-24 space-y-3">
      <h2 className="text-2xl font-bold text-white">{t("settings")}</h2>

      <button onClick={onProfileClick} className="w-full bg-card border border-border rounded-2xl p-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-orange-500/30 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={t("profile")} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-orange-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white">{t("profile")}</h3>

            <p className="text-xs text-zinc-400">{userName || "User"}</p>

            <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
          </div>

          <span className="text-zinc-500 text-xs">›</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left"
        >
          <Bell className="w-6 h-6 text-orange-500 mb-2" />

          <h3 className="text-sm font-bold text-white">{t("notifications")}</h3>
        </button>

        <button onClick={onLegalClick} className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left">
          <Scale className="w-6 h-6 text-orange-500 mb-2" />

          <h3 className="text-sm font-bold text-white">{t("privacy")}</h3>
        </button>

        <button onClick={setLanguage} className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left">
          <Languages className="w-6 h-6 text-orange-500 mb-2" />

          <h3 className="text-sm font-bold text-white">{t("language")}</h3>

          <p className="text-xs text-zinc-500 uppercase">{language || "EN"}</p>
        </button>

        <button
          onClick={openCustomerPortal}
          className="bg-card border border-border rounded-2xl p-3 h-[96px] text-left"
        >
          <CreditCard className="w-6 h-6 text-orange-500 mb-2" />

          <h3 className="text-sm font-bold text-white">{t("manageSubscription")}</h3>

          <p className="text-xs text-zinc-500 mt-1">{t("billingCardsCancel")}</p>
        </button>
      </div>

      {isAdmin && !isGuest && (
        <button
          onClick={onAdminClick}
          className="w-full max-w-xs mx-auto block bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm"
        >
          {t("adminPanel")}
        </button>
      )}

      {!isGuest && (
        <button
          onClick={onSignOut}
          className="w-full bg-card border border-border text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />

          {t("signout")}
        </button>
      )}
    </div>
  );
}
