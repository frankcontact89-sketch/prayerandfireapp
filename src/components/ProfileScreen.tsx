import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, ArrowLeft, Trash2, User as UserIcon, Pencil, Globe, Bell, Shield, LogOut, ChevronRight } from "lucide-react";
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

interface ProfileScreenProps {
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  signOut: () => void;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenPrivacy?: () => void;
  onOpenLanguage?: () => void;
}

export function ProfileScreen({ t, language, setLanguage, signOut, onBack, onOpenNotifications, onOpenPrivacy, onOpenLanguage }: ProfileScreenProps) {
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      let currentProfile = profile;
      if (!currentProfile) {
        const { data: inserted } = await supabase.from("profiles").insert({ id: user.id, username: user.email?.split("@")[0] || "", email: user.email || "" }).select().single();
        currentProfile = inserted;
      }
      if (currentProfile) {
        setName(currentProfile.username || "");
        if (currentProfile.avatar_url) setImage(`${currentProfile.avatar_url}?t=${Date.now()}`);
      }
    } catch (error) { console.error("Error loading profile:", error); }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId || !file) return null;
    try {
      setLoading(true);
      const safeName = (file as any)?.name || `photo-${Date.now()}.jpg`;
      const fileExt = (safeName.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      // Save locally first (preview) so user sees it even if upload fails
      try {
        const localUrl = URL.createObjectURL(file);
        setImage(localUrl);
      } catch {}
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setImage(urlWithTimestamp);
      toast({ title: t("success"), description: t("profilePhotoUpdated") });
      return publicUrl;
    } catch (error: any) {
      console.error("uploadAvatar error:", error);
      toast({
        title: t("error"),
        description: t("photoUploadUnavailable") || "Photo upload is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return null;
    } finally { setLoading(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e?.target?.files?.[0];
      if (!file) {
        // user cancelled — do nothing
        return;
      }
      await uploadAvatar(file);
    } catch (err: any) {
      console.error("File select error:", err);
      toast({
        title: t("error"),
        description: t("photoUploadUnavailable") || "Photo upload is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
    } finally {
      try { if (e?.target) e.target.value = ""; } catch {}
      setShowImageDialog(false);
    }
  };

  const isNative = (() => {
    try {
      const cap = (globalThis as any)?.Capacitor;
      return cap?.isNativePlatform?.() === true;
    } catch { return false; }
  })();

  // On a real device the Capacitor bridge injects the plugin on the global object.
  // (Dynamic import doesn't work because the JS bundle is served remotely.)
  const loadCapCamera = async (): Promise<any | null> => {
    try {
      const cap = (globalThis as any)?.Capacitor;
      const fromGlobal = cap?.Plugins?.Camera;
      if (fromGlobal) return fromGlobal;
      const spec = '@capacitor' + '/camera';
      const mod: any = await import(/* @vite-ignore */ spec);
      return mod?.Camera ?? null;
    } catch (e) {
      console.error("Capacitor camera plugin not available", e);
      return null;
    }
  };

  const uploadFromDataUrl = async (dataUrl: string, ext: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.${ext || 'jpg'}`, { type: blob.type || 'image/jpeg' });
      await uploadAvatar(file);
    } catch (err) {
      console.error("uploadFromDataUrl error", err);
      toast({
        title: t("error"),
        description: "Photo upload is unavailable on this device. Please choose a photo from your library.",
      });
    }
  };

  const pickNative = async (source: 'CAMERA' | 'PHOTOS') => {
    try {
      const CapCamera = await loadCapCamera();
      if (!CapCamera) {
        // Plugin missing — fall back to the web file inputs so the user can
        // still take/choose a photo instead of being blocked.
        try {
          if (source === 'CAMERA') cameraInputRef.current?.click();
          else fileInputRef.current?.click();
        } catch (e) { console.error(e); }
        return;
      }
      // Request permissions first; never crash on denial
      try {
        const perm = await CapCamera.checkPermissions();
        const needsReq =
          (source === 'CAMERA' && perm.camera !== 'granted') ||
          (source === 'PHOTOS' && perm.photos !== 'granted' && perm.photos !== 'limited');
        if (needsReq) {
          const req = await CapCamera.requestPermissions({
            permissions: source === 'CAMERA' ? ['camera'] : ['photos'],
          });
          const granted =
            source === 'CAMERA'
              ? req.camera === 'granted'
              : req.photos === 'granted' || req.photos === 'limited';
          if (!granted) {
            toast({
              title: t("error"),
              description:
                source === 'CAMERA'
                  ? "Camera permission denied. Please enable it in Settings."
                  : "Photo library permission denied. Please enable it in Settings.",
            });
            return;
          }
        }
      } catch (permErr) {
        console.error("permission error", permErr);
      }

      let photo: any;
      try {
        photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: 'dataUrl',
          source,
          saveToGallery: false,
        });
      } catch (pickErr: any) {
        const msg = String(pickErr?.message || pickErr || "");
        // User cancelled — silent
        if (/cancel/i.test(msg)) return;
        console.error("getPhoto error", pickErr);
        if (source === 'CAMERA') {
          // Camera failed — automatically fall back to the photo library
          try {
            photo = await CapCamera.getPhoto({
              quality: 85,
              allowEditing: false,
              resultType: 'dataUrl',
              source: 'PHOTOS',
              saveToGallery: false,
            });
          } catch (libErr: any) {
            if (/cancel/i.test(String(libErr?.message || libErr || ""))) return;
            try { fileInputRef.current?.click(); } catch {}
            return;
          }
        } else {
          try { fileInputRef.current?.click(); } catch {}
          return;
        }
      }

      if (!photo || !photo.dataUrl) return; // empty result — no-op
      await uploadFromDataUrl(photo.dataUrl, photo.format || 'jpg');
    } catch (err) {
      console.error("pickNative fatal", err);
      try { fileInputRef.current?.click(); } catch {}
    } finally {
      setShowImageDialog(false);
    }
  };

  const isCameraCaptureSupported = () => {
    try {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      const supportsCapture = "capture" in input;
      return supportsCapture;
    } catch {
      return false;
    }
  };

  const handleTakePhoto = () => {
    try {
      if (isNative) {
        void pickNative('CAMERA');
        return;
      }
      if (!isCameraCaptureSupported()) {
        toast({
          title: t("error") || "Camera unavailable",
          description: t("cameraUnavailableUseLibrary") || "Camera not available. Opening photo library instead.",
        });
        try { fileInputRef.current?.click(); } catch (e) { console.error(e); }
        return;
      }
      try {
        cameraInputRef.current?.click();
      } catch (e) {
        console.error("camera click failed", e);
        toast({
          title: t("error"),
          description: t("photoUploadUnavailable") || "Photo upload is temporarily unavailable. Please try again later.",
        });
      }
    } catch (err: any) {
      console.error("Take photo error:", err);
      toast({
        title: t("error"),
        description: t("photoUploadUnavailable") || "Photo upload is temporarily unavailable. Please try again later.",
      });
    }
  };

  const handleUploadPhoto = () => {
    try {
      if (isNative) {
        void pickNative('PHOTOS');
        return;
      }
      fileInputRef.current?.click();
    } catch (err: any) {
      console.error("Upload photo error:", err);
      toast({
        title: t("error"),
        description: t("photoUploadUnavailable") || "Photo upload is temporarily unavailable. Please try again later.",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').update({ username: name }).eq('id', userId);
      if (error) throw error;
      toast({ title: t("success"), description: t("profileUpdated") });
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || t("couldNotSaveChanges"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
      setImage(null);
      toast({ title: t("success"), description: t("profilePhotoUpdated") });
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || t("couldNotSaveChanges"), variant: "destructive" });
    } finally {
      setLoading(false);
      setShowImageDialog(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (userId) {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('purchases').delete().eq('user_id', userId);
        await supabase.from('event_rsvps').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
      }
      await supabase.auth.signOut();
      toast({ title: t("accountDeleted"), description: t("accountDataDeleted") });
      signOut();
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || t("couldNotDeleteAccount"), variant: "destructive" });
    } finally { setDeleting(false); setShowDeleteDialog(false); }
  };

  return (
    <>
      <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
        <div className="flex items-center gap-4">
          {onBack && <button onClick={onBack} className="text-primary hover:text-primary/80 transition-colors"><ArrowLeft className="w-6 h-6" /></button>}
          <h2 className="text-3xl font-extrabold text-foreground">{t("profile")}</h2>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <button onClick={() => setShowImageDialog(true)} disabled={loading} className="relative cursor-pointer group">
            <div className="w-32 h-32 rounded-full bg-muted border-4 border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
              {image ? <img key={image} src={image} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center"><span className="text-4xl font-bold text-primary">{name ? name.charAt(0).toUpperCase() : "?"}</span></div>}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 group-hover:scale-110 transition-transform"><Camera className="w-5 h-5 text-primary-foreground" /></div>
          </button>
          <p className="text-sm text-muted-foreground font-medium">{t("changePhoto")}</p>
        </div>
        <Button onClick={() => setShowImageDialog(true)} disabled={loading} className="w-full h-12 font-bold inline-flex items-center justify-center gap-2"><Camera className="w-5 h-5" />{t("uploadPhotoOrTake")}</Button>
        <div className="space-y-4">
          <Input placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="h-12" />
          <Button onClick={handleSaveProfile} disabled={loading} className="w-full h-12 font-bold">{loading ? t("saving") : t("saveChanges")}</Button>
        </div>
        <ProfileMenu
          language={language}
          onOpenLanguage={onOpenLanguage}
          onOpenNotifications={onOpenNotifications}
          onOpenPrivacy={onOpenPrivacy}
          signOut={signOut}
          onDeleteAccount={() => setShowDeleteDialog(true)}
        />
      </div>
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("choosePhotoSource")}</AlertDialogTitle><AlertDialogDescription>{t("selectHowToAddPhoto")}</AlertDialogDescription></AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handleTakePhoto}><Camera className="w-8 h-8" /><span>{t("takePhoto")}</span></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handleUploadPhoto}><Upload className="w-8 h-8" /><span>{t("uploadPhoto")}</span></Button>
          </div>
          {image && (
            <Button
              variant="outline"
              className="w-full h-12 border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
              onClick={handleRemovePhoto}
              disabled={loading}
            >
              <Trash2 className="w-5 h-5" />
              {L(language, "Remove Photo", "Eliminar foto", "Remover foto")}
            </Button>
          )}
          <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="text-destructive">{t("deleteAccountConfirmTitle")}</AlertDialogTitle><AlertDialogDescription>{t("deleteAccountConfirm")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting ? t("deleting") : t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </>
  );
}

function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

interface ProfileMenuProps {
  language: string;
  onOpenLanguage?: () => void;
  onOpenNotifications?: () => void;
  onOpenPrivacy?: () => void;
  signOut: () => void;
  onDeleteAccount: () => void;
}

function ProfileMenu({ language, onOpenLanguage, onOpenNotifications, onOpenPrivacy, signOut, onDeleteAccount }: ProfileMenuProps) {
  const scrollTop = () => { try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {} };
  const items: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }[] = [
    { icon: <UserIcon className="w-5 h-5" />, label: L(language, "My Account", "Mi cuenta", "Minha conta"), onClick: scrollTop },
    { icon: <Pencil className="w-5 h-5" />, label: L(language, "Edit Profile", "Editar perfil", "Editar perfil"), onClick: scrollTop },
    { icon: <Globe className="w-5 h-5" />, label: L(language, "Language", "Idioma", "Idioma"), onClick: onOpenLanguage },
    { icon: <Bell className="w-5 h-5" />, label: L(language, "Notifications", "Notificaciones", "Notificações"), onClick: onOpenNotifications },
    { icon: <Shield className="w-5 h-5" />, label: L(language, "Privacy", "Privacidad", "Privacidade"), onClick: onOpenPrivacy },
    { icon: <LogOut className="w-5 h-5" />, label: L(language, "Sign Out", "Cerrar sesión", "Sair"), onClick: signOut, danger: true },
    { icon: <Trash2 className="w-5 h-5" />, label: L(language, "Delete Account", "Eliminar cuenta", "Excluir conta"), onClick: onDeleteAccount, danger: true },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      {items.filter(i => !!i.onClick).map((i, idx, arr) => (
        <button
          key={i.label}
          onClick={i.onClick}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors ${idx < arr.length - 1 ? "border-b border-border/60" : ""} ${i.danger ? "text-destructive" : "text-foreground"}`}
        >
          <span className={i.danger ? "text-destructive" : "text-primary"}>{i.icon}</span>
          <span className="flex-1 font-semibold">{i.label}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
