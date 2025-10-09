import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FLAME_LOGO = "data:image/png;base64,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";

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
            <img 
              src={FLAME_LOGO} 
              alt="Prayer & Fire Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-5xl font-extrabold text-primary tracking-tight">
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
