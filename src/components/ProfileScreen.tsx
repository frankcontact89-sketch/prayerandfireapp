import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Youtube, MessageCircle, Video, Camera, Upload, User } from "lucide-react";
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
}

export function ProfileScreen({
  t,
  language,
  setLanguage,
  signOut,
}: ProfileScreenProps) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.username || "");
        if (profile.avatar_url) {
          // Agregar timestamp para evitar caché
          const urlWithTimestamp = `${profile.avatar_url}?t=${Date.now()}`;
          setImage(urlWithTimestamp);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return null;

    try {
      setLoading(true);

      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      // Subir la imagen a storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Agregar timestamp para evitar caché del navegador
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Actualizar el perfil con la nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Usar la URL con timestamp para actualizar la imagen inmediatamente
      setImage(urlWithTimestamp);
      
      toast({
        title: t("Success", "Éxito"),
        description: t("Profile photo updated", "Foto de perfil actualizada"),
      });

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

  const socialLinks = [
    {
      icon: Instagram,
      url: "https://instagram.com/seloprayerandfire",
      label: "Instagram",
    },
    { icon: MessageCircle, url: "https://wa.me/1XXXXXXXXXX", label: "WhatsApp" },
    { icon: Youtube, url: "https://youtube.com", label: "YouTube" },
    { icon: Video, url: "https://zoom.us", label: "Zoom" },
  ];

  return (
    <>
      <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
        <h2 className="text-3xl font-extrabold text-foreground">
          {t("Profile", "Perfil")}
        </h2>

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
                  src={image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
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

        {/* Photo/Avatar Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => setShowImageDialog(true)}
            disabled={loading}
            className="w-full h-12 font-bold inline-flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {t("Upload Photo or Take Photo", "Subir Foto o Tomar Foto")}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 font-bold"
            onClick={() =>
              toast({
                title: t("Coming soon", "Próximamente"),
                description: t(
                  "You'll be able to create an AI avatar soon.",
                  "Pronto podrás crear tu avatar con IA."
                ),
              })
            }
          >
            {t("Create Avatar", "Crear Avatar")}
          </Button>
        </div>

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

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full text-center text-primary font-bold py-3 hover:underline"
        >
          {t("Sign Out", "Cerrar Sesión")}
        </button>
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
