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
}

export function SignInScreen({ setUser, t, onShowLanguages, currentLanguage = "en" }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isForgotUsername, setIsForgotUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const friendlyError = (msg: string | undefined): string => {
    if (!msg) return "An unexpected error occurred";
    if (/for security purposes/i.test(msg) || /only request this after/i.test(msg) || /rate limit/i.test(msg)) {
      return "Please wait a few seconds before requesting another confirmation email.";
    }
    return msg;
  };

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }
    if (resendCooldown > 0) {
      toast({ title: "Please wait", description: "Please wait before requesting another confirmation email." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast({ title: "Email sent", description: "Confirmation email resent. Please check your inbox." });
      setResendCooldown(45);
    } catch (error: any) {
      console.error("Resend confirmation error:", error);
      toast({ title: "Error", description: friendlyError(error?.message), variant: "destructive" });
      if (/only request this after|rate limit|for security purposes/i.test(error?.message || "")) {
        setResendCooldown(45);
      }
    } finally {
      setLoading(false);
    }
  };

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
        const { data, error } = await supabase.rpc("get_username_by_email", { _email: email });

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
          description: `Your username is: ${data}`,
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

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast({
        title: "Error",
        description: !trimmedEmail && !password
          ? "Please enter your email and password"
          : !trimmedEmail
            ? "Please enter your email"
            : "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          console.error("Signup error:", error);
          throw error;
        }

        if (data.user) {
          if (data.session) {
            setUser(data.user);
            toast({
              title: "Welcome!",
              description: "Account created successfully",
            });
          } else {
            toast({
              title: "Account created",
              description: "Please check your email and confirm your account before signing in.",
            });
            setAwaitingConfirmation(true);
            setResendCooldown(45);
            setIsSignUp(false);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }

        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const msg = error?.message || "";
      if (/email not confirmed/i.test(msg)) {
        setAwaitingConfirmation(true);
        toast({
          title: "Email not confirmed",
          description: "Please check your email and confirm your account before signing in.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: friendlyError(msg),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-background p-6"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={entryLogo} alt="Prayer & Fire Logo" className="w-32 h-32 object-contain animate-pulse" />

          <h1 className="text-[32px] font-bold text-foreground text-center mt-6 tracking-tight">{t("appName")}</h1>
        </div>

        <div className="mt-6 space-y-[15px]">
          <Input
            type="email"
            placeholder="Email"
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
            {loading
              ? t("loading")
              : isForgotUsername
                ? "Find Username"
                : isForgotPassword
                  ? t("send")
                  : isSignUp
                    ? t("signup")
                    : "Sign In"}
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

          {awaitingConfirmation && !isForgotPassword && !isForgotUsername && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground text-center">
                Please check your email and confirm your account before signing in.
              </p>
              <Button
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={loading || resendCooldown > 0}
                className="w-full rounded-xl h-12"
              >
                {resendCooldown > 0
                  ? `Resend confirmation email (${resendCooldown}s)`
                  : "Resend confirmation email"}
              </Button>
            </div>
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
