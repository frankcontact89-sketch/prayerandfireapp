import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Camera } from "lucide-react";

export default function ProfileAvatarScreen() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", data.user.id)
          .single();
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    };
    fetchUser();
  }, []);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setAvatarUrl(publicUrl);

      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      
      toast({
        title: "✅ Avatar actualizado",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Error al subir el avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center text-center p-5">
      <h1 className="text-primary text-3xl font-bold mb-5">Mi Perfil</h1>

      <div className="mb-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-[120px] h-[120px] rounded-full object-cover border-3 border-primary"
          />
        ) : (
          <div className="w-[120px] h-[120px] rounded-full bg-muted flex justify-center items-center border-3 border-primary text-4xl">
            🔥
          </div>
        )}
      </div>

      <label className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg cursor-pointer mb-2.5 inline-flex items-center gap-2">
        <Camera className="w-5 h-5" />
        {uploading ? "Subiendo..." : "Subir Foto o Tomar Foto"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={uploadAvatar}
          className="hidden"
        />
      </label>

      <Button
        variant="outline"
        onClick={() => toast({
          title: "🎨 Próximamente",
          description: "Pronto podrás crear tu avatar con IA personalizada.",
        })}
      >
        Crear Avatar
      </Button>
    </div>
  );
}
