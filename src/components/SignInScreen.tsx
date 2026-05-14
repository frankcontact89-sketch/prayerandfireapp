import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface SignInScreenProps {
  setUser: (user: any) => void;
  t: (key: string) => string;
  onShowLanguages?: () => void;
  currentLanguage?: string;
  onContinueAsGuest?: () => void;
}

export function SignInScreen({ setUser, t, onShowLanguages, currentLanguage = "en", onContinueAsGuest }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isForgotUsername, setIsForgotUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    if (isForgotUsername) {
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
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("email", email)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Error",
            description: "No account found with that email",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Username Found!",
          description: `Your username is: ${data.username}`,
        });
        setIsForgotUsername(false);
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
          // Create profile for the new user
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              email: data.user.email,
              username: email.split("@")[0],
              welcome_seen: false,
            },
          ]);

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          // If session exists (auto-confirm enabled), user is logged in automatically
          if (data.session) {
            setUser(data.user);
            toast({
              title: "Welcome!",
              description: "Account created successfully",
            });
          } else {
            // If no session, email confirmation is required
            toast({
              title: "Account created!",
              description: "Please check your email to confirm your account",
            });
            setIsSignUp(false);
          }
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
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={entryLogo} 
            alt="Prayer & Fire Logo" 
            className="w-32 h-32 object-contain animate-pulse"
          />
          <h1 className="text-[32px] font-bold text-foreground text-center mt-6 tracking-tight">
            {t("appName")}
          </h1>
        </div>

        <div className="mt-6 space-y-[15px]">
          <Input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 focus:border-primary transition-colors"
          />
          
          {!isForgotPassword && !isForgotUsername && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 focus:border-primary transition-colors"
            />
          )}

          <Button 
            onClick={handleAuth} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-semibold mt-[25px] transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? t("loading") : 
              isForgotUsername ? "Find Username" :
              isForgotPassword ? t("send") :
              (isSignUp ? t("signup") : "Sign In")}
          </Button>

          {!isForgotPassword && !isForgotUsername && (
            <Button 
              variant="outline" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full bg-transparent border-2 border-border text-foreground hover:bg-secondary hover:border-primary rounded-xl h-12 text-base font-medium transition-all duration-200"
              disabled={loading}
            >
              {isSignUp ? "Already have account?" : "Register"}
            </Button>
          )}

          {!isForgotPassword && !isForgotUsername && onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center mt-2"
              disabled={loading}
            >
              Continue as Guest
            </button>
          )}

          {(isForgotPassword || isForgotUsername) && (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setIsForgotUsername(false);
                setIsSignUp(false);
              }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center mt-[15px] block"
              disabled={loading}
            >
              {t("back")}
            </button>
          )}

          {!isForgotPassword && !isForgotUsername && (
            <div className="flex justify-center gap-4 mt-[15px]">
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setIsForgotUsername(false);
                  setIsSignUp(false);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                Forgot Password?
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => {
                  setIsForgotUsername(true);
                  setIsForgotPassword(false);
                  setIsSignUp(false);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                Forgot Username?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
