import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
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

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
      <h2 className="text-3xl font-extrabold text-foreground">
        {t("Profile", "Perfil")}
      </h2>

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
  );
}
