import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, ArrowLeft, Trash2 } from "lucide-react";
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
}

export function ProfileScreen({ t, language, setLanguage, signOut, onBack }: ProfileScreenProps) {
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
    if (!userId) return null;
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setImage(urlWithTimestamp);
      toast({ title: t("success"), description: t("profilePhotoUpdated") });
      return publicUrl;
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || t("couldNotUploadPhoto"), variant: "destructive" });
      return null;
    } finally { setLoading(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    setShowImageDialog(false);
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
        <div className="flex items-center justify-center gap-6">
          <button onClick={signOut} className="text-primary font-bold py-3 hover:underline">{t("signout")}</button>
          <span className="text-muted-foreground">|</span>
          <button onClick={() => setShowDeleteDialog(true)} className="text-destructive font-bold py-3 hover:underline flex items-center gap-1"><Trash2 className="w-4 h-4" />{t("deleteAccount")}</button>
        </div>
      </div>
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("choosePhotoSource")}</AlertDialogTitle><AlertDialogDescription>{t("selectHowToAddPhoto")}</AlertDialogDescription></AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => cameraInputRef.current?.click()}><Camera className="w-8 h-8" /><span>{t("takePhoto")}</span></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => fileInputRef.current?.click()}><Upload className="w-8 h-8" /><span>{t("uploadPhoto")}</span></Button>
          </div>
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
