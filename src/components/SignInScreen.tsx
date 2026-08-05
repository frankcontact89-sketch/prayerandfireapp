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

  const L = (en: string, es: string, pt: string) =>
    currentLanguage === "es" ? es : currentLanguage === "pt" ? pt : en;

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const friendlyError = (msg: string | undefined): string => {
    if (!msg) return t("unexpectedError");
    if (/for security purposes/i.test(msg) || /only request this after/i.test(msg) || /rate limit/i.test(msg)) {
      return t("waitBeforeConfirmation");
    }
    if (/invalid login credentials/i.test(msg)) {
      return t("incorrectEmailOrPassword");
    }
    if (/email not confirmed/i.test(msg)) {
      return t("confirmEmailBeforeSignIn");
    }
    return t("somethingWrongTryAgain");
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast({ title: t("error"), description: t("pleaseEnterEmail"), variant: "destructive" });
      return;
    }
    if (resendCooldown > 0) {
      toast({ title: t("pleaseWait"), description: t("waitBeforeConfirmation") });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast({ title: t("emailSent"), description: t("confirmationEmailResent") });
      setResendCooldown(45);
    } catch (error: any) {
      console.error("Resend confirmation error:", error);
      toast({ title: t("error"), description: friendlyError(error?.message), variant: "destructive" });
      if (/only request this after|rate limit|for security purposes/i.test(error?.message || "")) {
        setResendCooldown(45);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isForgotUsername) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        toast({
          title: t("error"),
          description: t("pleaseEnterEmail"),
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_username_by_email", { _email: normalizedEmail });

        if (error) throw error;

        if (!data) {
          toast({
            title: t("error"),
            description: t("noAccountFound"),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t("usernameFound"),
          description: `${t("yourUsernameIs")} ${data}`,
        });
        setIsForgotUsername(false);
      } catch (error: any) {
        console.error("Forgot username error:", error);
        toast({
          title: t("error"),
          description: friendlyError(error?.message),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isForgotPassword) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        toast({
          title: t("error"),
          description: t("pleaseEnterEmail"),
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast({
          title: t("emailSent"),
          description: t("checkEmailResetPassword"),
        });
        setIsForgotPassword(false);
      } catch (error: any) {
        console.error("Password reset request error:", error);
        toast({
          title: t("error"),
          description: friendlyError(error?.message),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignUp) {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  };

  const validateCredentials = (): string | null => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail && !password) return t("pleaseEnterEmailPassword");
    if (!normalizedEmail) return t("pleaseEnterEmail");
    if (!password) return t("pleaseEnterPassword");
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateCredentials();
    if (validationError) {
      toast({ title: t("error"), description: validationError, variant: "destructive" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) {
        console.error("Signup error:", error);
        if (/already registered|already been registered|user already exists/i.test(error.message || "")) {
          toast({
            title: t("error"),
            description: L(
              "This email is already registered. Please sign in instead.",
              "Este correo ya está registrado. Inicia sesión en su lugar.",
              "Este e-mail já está registrado. Faça login em vez disso.",
            ),
            variant: "destructive",
          });
          setIsSignUp(false);
          return;
        }
        throw error;
      }

      // Supabase returns a user with empty identities when the email already exists
      if (data.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
        toast({
          title: t("error"),
          description: L(
            "This email is already registered. Please sign in instead.",
            "Este correo ya está registrado. Inicia sesión en su lugar.",
            "Este e-mail já está registrado. Faça login em vez disso.",
          ),
          variant: "destructive",
        });
        setIsSignUp(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          setUser(data.user);
          toast({ title: t("welcome"), description: t("accountCreatedSuccessfully") });
        } else {
          toast({ title: t("accountCreated"), description: t("confirmEmailBeforeSignIn") });
          setAwaitingConfirmation(true);
          setResendCooldown(45);
          setIsSignUp(false);
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: t("error"), description: friendlyError(error?.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    const validationError = validateCredentials();
    if (validationError) {
      toast({ title: t("error"), description: validationError, variant: "destructive" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        if (/email not confirmed/i.test(error.message || "")) {
          setAwaitingConfirmation(true);
          toast({
            title: t("emailNotConfirmed"),
            description: t("confirmEmailBeforeSignIn"),
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        await supabase.auth.getUser();
        setUser(data.user);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({ title: t("error"), description: friendlyError(error?.message), variant: "destructive" });
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
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 focus:border-primary transition-colors"
          />

          {!isForgotPassword && !isForgotUsername && (
            <Input
              type="password"
              placeholder={t("password")}
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
                ? t("findUsername")
                : isForgotPassword
                  ? t("send")
                  : isSignUp
                    ? t("signup")
                    : t("signin")}
          </Button>

          {!isForgotPassword && !isForgotUsername && (
            <Button
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full bg-transparent border-2 border-border text-foreground hover:bg-secondary hover:border-primary rounded-xl h-12 text-base font-medium transition-all duration-200"
              disabled={loading}
            >
              {isSignUp ? t("alreadyHaveAccount") : t("signup")}
            </Button>
          )}

          {awaitingConfirmation && !isForgotPassword && !isForgotUsername && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground text-center">
                {t("confirmEmailBeforeSignIn")}
              </p>
              <Button
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={loading || resendCooldown > 0}
                className="w-full rounded-xl h-12"
              >
                {resendCooldown > 0
                  ? `${t("resendConfirmationEmail")} (${resendCooldown}s)`
                  : t("resendConfirmationEmail")}
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
                {t("forgot")}
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
                {t("forgotUsername")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
