import React, { useEffect, useRef, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, Camera, Scale, LogOut, Languages, Trash2, Upload, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onProfileUpdated?: (avatarUrl: string | null) => void;
}

export function SettingsScreen({
  t,
  language,
  setLanguage,
  onAdminClick,
  onNotificationsClick,
  onLegalClick,
  onSignOut,
  userName,
  userEmail,
  onProfileUpdated,
  isGuest,
}: SettingsScreenProps) {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [profileName, setProfileName] = useState(userName || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, email")
          .eq("id", user.id)
          .maybeSingle();

        let currentProfile = profile;
        if (!currentProfile) {
          const { data: inserted } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: user.email?.split("@")[0] || userName || "",
              email: user.email || userEmail || "",
            })
            .select("username, avatar_url, email")
            .single();
          currentProfile = inserted;
        }

        if (cancelled || !currentProfile) return;
        setProfileName(currentProfile.username || userName || "");
        const nextAvatar = currentProfile.avatar_url ? `${currentProfile.avatar_url}?t=${Date.now()}` : null;
        setProfileImage(nextAvatar);
        onProfileUpdated?.(nextAvatar);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    })();
    return () => { cancelled = true; };
  }, [userEmail, userName, onProfileUpdated]);

  const uploadAvatar = async (file: File) => {
    if (!userId || !file) return;
    try {
      setSavingProfile(true);
      try { setProfileImage(URL.createObjectURL(file)); } catch {}

      const safeName = file.name || `photo-${Date.now()}.jpg`;
      const fileExt = (safeName.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      if (updateError) throw updateError;

      const nextAvatar = `${publicUrl}?t=${Date.now()}`;
      setProfileImage(nextAvatar);
      onProfileUpdated?.(nextAvatar);
      toast({ title: t("success"), description: t("profilePhotoUpdated") });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("couldNotUploadPhoto"),
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) await uploadAvatar(file);
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message || t("couldNotUploadPhoto"), variant: "destructive" });
    } finally {
      e.target.value = "";
      setShowImageDialog(false);
    }
  };

  const isNative = (() => {
    try {
      const cap = (globalThis as any)?.Capacitor;
      return cap?.isNativePlatform?.() === true;
    } catch {
      return false;
    }
  })();

  const loadCapCamera = async (): Promise<any | null> => {
    try {
      const cap = (globalThis as any)?.Capacitor;
      const fromGlobal = cap?.Plugins?.Camera;
      if (fromGlobal) return fromGlobal;
      const spec = "@capacitor" + "/camera";
      const mod: any = await import(/* @vite-ignore */ spec);
      return mod?.Camera ?? null;
    } catch (error) {
      console.error("Capacitor camera plugin not available", error);
      return null;
    }
  };

  const uploadFromDataUrl = async (dataUrl: string, ext: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.${ext || "jpg"}`, { type: blob.type || "image/jpeg" });
      await uploadAvatar(file);
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message || t("couldNotUploadPhoto"), variant: "destructive" });
    }
  };

  const pickNative = async (source: "CAMERA" | "PHOTOS") => {
    try {
      const CapCamera = await loadCapCamera();
      if (!CapCamera) {
        if (source === "CAMERA") cameraInputRef.current?.click();
        else fileInputRef.current?.click();
        return;
      }

      try {
        const permissions = await CapCamera.checkPermissions();
        const needsPermission =
          (source === "CAMERA" && permissions.camera !== "granted") ||
          (source === "PHOTOS" && permissions.photos !== "granted" && permissions.photos !== "limited");
        if (needsPermission) {
          const requested = await CapCamera.requestPermissions({
            permissions: source === "CAMERA" ? ["camera"] : ["photos"],
          });
          const granted =
            source === "CAMERA"
              ? requested.camera === "granted"
              : requested.photos === "granted" || requested.photos === "limited";
          if (!granted) {
            toast({
              title: t("error"),
              description: L(
                language,
                source === "CAMERA" ? "Camera permission denied." : "Photo library permission denied.",
                source === "CAMERA" ? "Permiso de cámara denegado." : "Permiso de fotos denegado.",
                source === "CAMERA" ? "Permissão da câmera negada." : "Permissão das fotos negada.",
              ),
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Camera permission error", error);
      }

      let photo: any;
      try {
        photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: "dataUrl",
          source,
          saveToGallery: false,
        });
      } catch (pickError: any) {
        const msg = String(pickError?.message || pickError || "");
        if (/cancel/i.test(msg)) return;
        if (source === "CAMERA") {
          try {
            photo = await CapCamera.getPhoto({
              quality: 85,
              allowEditing: false,
              resultType: "dataUrl",
              source: "PHOTOS",
              saveToGallery: false,
            });
          } catch {
            fileInputRef.current?.click();
            return;
          }
        } else {
          fileInputRef.current?.click();
          return;
        }
      }

      if (photo?.dataUrl) await uploadFromDataUrl(photo.dataUrl, photo.format || "jpg");
    } catch (error) {
      console.error("Photo picker error", error);
      fileInputRef.current?.click();
    } finally {
      setShowImageDialog(false);
    }
  };

  const isCameraCaptureSupported = () => {
    try {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      return "capture" in input;
    } catch {
      return false;
    }
  };

  const handleTakePhoto = () => {
    try {
      if (isNative) {
        void pickNative("CAMERA");
        return;
      }
      if (!isCameraCaptureSupported()) {
        fileInputRef.current?.click();
        return;
      }
      cameraInputRef.current?.click();
    } catch (error) {
      console.error("Take photo error", error);
      fileInputRef.current?.click();
    }
  };

  const handleUploadPhoto = () => {
    try {
      if (isNative) {
        void pickNative("PHOTOS");
        return;
      }
      fileInputRef.current?.click();
    } catch (error) {
      console.error("Upload photo error", error);
      toast({ title: t("error"), description: t("couldNotUploadPhoto"), variant: "destructive" });
    }
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    try {
      setSavingProfile(true);
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      if (error) throw error;
      setProfileImage(null);
      onProfileUpdated?.(null);
      toast({ title: t("success"), description: t("profilePhotoUpdated") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message || t("couldNotSaveChanges"), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    try {
      setSavingProfile(true);
      const { error } = await supabase.from("profiles").update({ username: profileName }).eq("id", userId);
      if (error) throw error;
      toast({ title: t("success"), description: t("profileUpdated") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message || t("couldNotSaveChanges"), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

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
    <div className="max-w-[430px] md:max-w-[680px] lg:max-w-[820px] mx-auto px-4 py-3 pb-24 space-y-3">
      <h2 className="text-2xl font-bold text-white">{t("settings")}</h2>

      {!isGuest && (
        <section className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowImageDialog(true)}
              disabled={savingProfile}
              className="relative h-20 w-20 shrink-0 rounded-full border-2 border-orange-500/40 bg-muted overflow-hidden flex items-center justify-center"
              aria-label={t("changePhoto")}
            >
              {profileImage ? (
                <img src={profileImage} alt={t("profile")} className="h-full w-full object-cover" crossOrigin="anonymous" />
              ) : (
                <UserIcon className="h-9 w-9 text-orange-500" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-zinc-500">{t("profile")}</p>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t("name")}
                disabled={savingProfile}
                className="mt-2 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleTakePhoto} disabled={savingProfile} className="h-11 gap-2">
              <Camera className="h-4 w-4" />
              {t("takePhoto")}
            </Button>
            <Button type="button" variant="outline" onClick={handleUploadPhoto} disabled={savingProfile} className="h-11 gap-2">
              <Upload className="h-4 w-4" />
              {t("uploadPhoto")}
            </Button>
            {profileImage && (
              <Button type="button" variant="outline" onClick={handleRemovePhoto} disabled={savingProfile} className="h-11 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                {L(language, "Remove Photo", "Eliminar foto", "Remover foto")}
              </Button>
            )}
            <Button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="h-11 gap-2">
              {savingProfile ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
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
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("choosePhotoSource")}</AlertDialogTitle>
            <AlertDialogDescription>{t("selectHowToAddPhoto")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button type="button" variant="outline" className="h-24 flex flex-col gap-2" onClick={handleTakePhoto} disabled={savingProfile}>
              <Camera className="w-8 h-8" />
              <span>{t("takePhoto")}</span>
            </Button>
            <Button type="button" variant="outline" className="h-24 flex flex-col gap-2" onClick={handleUploadPhoto} disabled={savingProfile}>
              <Upload className="w-8 h-8" />
              <span>{t("uploadPhoto")}</span>
            </Button>
          </div>
          {profileImage && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
              onClick={handleRemovePhoto}
              disabled={savingProfile}
            >
              <Trash2 className="w-5 h-5" />
              {L(language, "Remove Photo", "Eliminar foto", "Remover foto")}
            </Button>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingProfile}>{t("cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}
