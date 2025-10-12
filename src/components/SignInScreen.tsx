import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import prayerFireLogo from "@/assets/prayer-fire-logo-new.jpg";

interface SignInScreenProps {
  setUser: (user: any) => void;
  t: (key: string) => string;
}

export function SignInScreen({ setUser, t }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    if (isForgotPassword) {
      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your email",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) throw error;

        toast({
          title: "Email sent!",
          description: "Check your email to reset your password",
        });
        setIsForgotPassword(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill all fields",
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
            title: "Account created!",
            description: "You can now sign in",
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
        title: "Error",
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
            <img src={prayerFireLogo} alt="Prayer & Fire Logo" className="w-32 h-32 rounded-full" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            PRAYER & FIRE
          </h1>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
          {!isForgotPassword && (
            <Input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />
          )}

          <Button 
            onClick={handleAuth} 
            className="w-full h-12 text-base font-bold"
            disabled={loading}
          >
            {loading ? t("loading") : 
              isForgotPassword ? t("send") :
              (isSignUp ? t("signup") : t("signin"))}
          </Button>

          {!isForgotPassword && (
            <Button 
              variant="outline" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full h-12 text-base font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              disabled={loading}
            >
              {isSignUp ? "Already have account?" : t("signup")}
            </Button>
          )}

          <button
            onClick={() => {
              setIsForgotPassword(!isForgotPassword);
              setIsSignUp(false);
            }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors underline"
            disabled={loading}
          >
            {isForgotPassword ? t("back") : t("forgot")}
          </button>
        </div>
      </div>
    </div>
  );
}
