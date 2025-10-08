import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignInScreenProps {
  setUser: (user: any) => void;
  t: (en: string, es: string) => string;
}

export function SignInScreen({ setUser, t }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    if (!email || !password) {
      toast({
        title: t("Error", "Error"),
        description: t("Please fill all fields", "Por favor llena todos los campos"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          await supabase.from("profiles").insert([
            {
              id: data.user.id,
              email: data.user.email,
              username: email.split("@")[0],
            },
          ]);

          toast({
            title: t("Account created!", "¡Cuenta creada!"),
            description: t("You can now sign in", "Ya puedes iniciar sesión"),
          });
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error: any) {
      toast({
        title: t("Error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Fire_icon.svg/512px-Fire_icon.svg.png"
              alt="Fire Icon"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-5xl font-extrabold text-primary tracking-tight">
            PRAYER & FIRE
          </h1>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />

          <Button 
            onClick={handleAuth} 
            className="w-full h-12 text-base font-bold"
            disabled={loading}
          >
            {loading ? t("Loading...", "Cargando...") : (isSignUp ? t("Create Account", "Crear Cuenta") : t("Sign In", "Iniciar Sesión"))}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full h-12 text-base font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            disabled={loading}
          >
            {isSignUp ? t("Already have an account? Sign In", "¿Ya tienes cuenta? Inicia Sesión") : t("Create Account", "Crear Cuenta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
