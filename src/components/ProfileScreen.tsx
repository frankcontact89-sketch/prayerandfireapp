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
  t: (en: string, es: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  signOut: () => void;
  onBack?: () => void;
}

export function ProfileScreen({
  t,
  language,
  setLanguage,
  signOut,
  onBack,
}: ProfileScreenProps) {
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile load error:", profileError);
      }

      let currentProfile = profile;
      if (!currentProfile) {
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: user.id, username: user.email?.split("@")[0] || "", email: user.email || "" })
          .select()
          .single();
        if (insertError) {
          console.error("Profile insert error:", insertError);
        } else {
          currentProfile = inserted;
        }
      }

      if (currentProfile) {
        setName(currentProfile.username || "");
        if (currentProfile.avatar_url) {
          const urlWithTimestamp = `${currentProfile.avatar_url}?t=${Date.now()}`;
          setImage(urlWithTimestamp);
        } else {
          // Generate a default avatar if none exists
          await generateDefaultAvatar(user.id, currentProfile.username || user.email || "User");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const generateDefaultAvatar = async (userId: string, name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: { userId, name }
      });

      if (error) throw error;

      if (data?.avatarUrl) {
        const urlWithTimestamp = `${data.avatarUrl}?t=${Date.now()}`;
        setImage(urlWithTimestamp);
        
        // Update profile with generated avatar
        await supabase
          .from('profiles')
          .update({ avatar_url: data.avatarUrl })
          .eq('id', userId);
      }
    } catch (error) {
      console.error("Error generating avatar:", error);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return null;

    try {
      setLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Preload the image to ensure immediate render, then update state
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = urlWithTimestamp;
      });

      setImage(urlWithTimestamp);
      
      toast({
        title: t("Success", "Éxito"),
        description: t("Profile photo updated", "Foto de perfil actualizada"),
      });

      // Refresh profile from backend to keep in sync
      await loadProfile();

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error.message || t("Could not upload photo", "No se pudo subir la foto"),
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    setShowImageDialog(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: name,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: t("Success", "Éxito"),
        description: t("Profile updated", "Perfil actualizado"),
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || t("Could not save changes", "No se pudieron guardar los cambios"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete user data from profiles
      if (userId) {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('purchases').delete().eq('user_id', userId);
        await supabase.from('event_rsvps').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
      }

      // Sign out the user (account deletion requires admin API)
      await supabase.auth.signOut();
      
      toast({
        title: t("Account Deleted", "Cuenta Eliminada"),
        description: t("Your account data has been deleted", "Los datos de tu cuenta han sido eliminados"),
      });
      
      signOut();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error.message || t("Could not delete account", "No se pudo eliminar la cuenta"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-3xl font-extrabold text-foreground">
            {t("Profile", "Perfil")}
          </h2>
        </div>

        {/* Profile Photo */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={() => setShowImageDialog(true)}
            disabled={loading}
            className="relative cursor-pointer group"
          >
            <div className="w-32 h-32 rounded-full bg-muted border-4 border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
              {image ? (
                <img
                  key={image}
                  src={image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={async () => {
                    // If image fails to load, generate a new one
                    setImage(null);
                    if (userId && name) {
                      await generateDefaultAvatar(userId, name);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {name ? name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
          </button>
          <p className="text-sm text-muted-foreground font-medium">
            {t("Change Photo", "Cambiar Foto")}
          </p>
        </div>

        {/* Photo Actions */}
        <Button
          onClick={() => setShowImageDialog(true)}
          disabled={loading}
          className="w-full h-12 font-bold inline-flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {t("Upload Photo or Take Photo", "Subir Foto o Tomar Foto")}
        </Button>

        {/* Profile Form */}
        <div className="space-y-4">
          <Input
            placeholder={t("Name", "Nombre")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="h-12"
          />
          <Button 
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full h-12 font-bold"
          >
            {loading ? t("Saving...", "Guardando...") : t("Save Changes", "Guardar Cambios")}
          </Button>
        </div>

        {/* Sign Out and Delete Account */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={signOut}
            className="text-primary font-bold py-3 hover:underline"
          >
            {t("Sign Out", "Cerrar Sesión")}
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive font-bold py-3 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            {t("Delete Account", "Borrar Cuenta")}
          </button>
        </div>
      </div>

      {/* Image Source Dialog */}
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Choose Photo Source", "Elegir Fuente de Foto")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Select how you want to add your photo", "Selecciona cómo quieres agregar tu foto")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => {
                cameraInputRef.current?.click();
              }}
            >
              <Camera className="w-8 h-8" />
              <span>{t("Take Photo", "Tomar Foto")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-8 h-8" />
              <span>{t("Upload Photo", "Subir Foto")}</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("Cancel", "Cancelar")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t("Delete Account", "Borrar Cuenta")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
                "¿Estás seguro de que quieres borrar tu cuenta? Esta acción no se puede deshacer y todos tus datos serán eliminados permanentemente."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("Cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("Deleting...", "Eliminando...") : t("Delete", "Eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
