import React, { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, Scale, LogOut, Languages, Trash2, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsScreenProps {
  t: (key: string) => string;
  language: string;
  setLanguage: () => void;
  userName: string;
  userEmail: string;
  onAdminClick: () => void;
  onNotificationsClick: () => void;
  onLegalClick: () => void;
  onSignOut: () => void;
  onEditProfileClick?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isGuest?: boolean;
}

export function SettingsScreen({
  t,
  language,
  setLanguage,
  onAdminClick,
  onNotificationsClick,
  onLegalClick,
  onSignOut,
  onEditProfileClick,
  isGuest,
}: SettingsScreenProps) {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").delete().eq("id", user.id);
        await supabase.from("purchases").delete().eq("user_id", user.id);
        await supabase.from("event_rsvps").delete().eq("user_id", user.id);
        await supabase.from("notifications").delete().eq("user_id", user.id);
      }
      await supabase.auth.signOut();
      toast({ title: t("accountDeleted"), description: t("accountDataDeleted") });
      onSignOut();
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message || t("couldNotDeleteAccount"), variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="max-w-[430px] md:max-w-[640px] lg:max-w-[768px] mx-auto px-4 py-3 pb-24 space-y-3">
      <h2 className="text-2xl font-bold text-white">{t("settings")}</h2>

      <div className="grid grid-cols-2 gap-3">
        {!isGuest && onEditProfileClick && (
          <button onClick={onEditProfileClick} className="bg-card border border-border rounded-2xl p-3 min-h-[96px] text-left">
            <UserIcon className="w-6 h-6 text-orange-500 mb-2" />
            <h3 className="text-sm font-bold text-white leading-tight">{t("profile")}</h3>
          </button>
        )}
        <button onClick={setLanguage} className="bg-card border border-border rounded-2xl p-3 min-h-[96px] text-left">
          <Languages className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white leading-tight">{t("language")}</h3>
          <p className="text-xs text-zinc-500 uppercase">{language || "EN"}</p>
        </button>

        <button
          onClick={onNotificationsClick}
          className="bg-card border border-border rounded-2xl p-3 min-h-[96px] text-left"
        >
          <Bell className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white leading-tight">{t("notifications")}</h3>
        </button>

        <button onClick={onLegalClick} className="bg-card border border-border rounded-2xl p-3 min-h-[96px] text-left">
          <Scale className="w-6 h-6 text-orange-500 mb-2" />
          <h3 className="text-sm font-bold text-white leading-tight">{t("privacy")}</h3>
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
        <>
          <button
            onClick={onSignOut}
            className="w-full bg-card border border-border text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t("signout")}
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full bg-card border border-destructive/40 text-destructive font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("deleteAccount")}
          </button>
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{t("deleteAccountConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccountConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
