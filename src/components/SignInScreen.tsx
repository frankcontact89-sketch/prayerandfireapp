import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

export function SignInScreen({ setUser, t, currentLanguage = "en" }: SignInScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    const id = window.setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const showError = (message: string) =>
    toast({ title: t("error"), description: message, variant: "destructive" });

  const friendlyError = (msg?: string): string => {
    const text = (msg || "").trim();
    if (!text) return L("Something went wrong. Please try again.", "Algo salió mal. Inténtalo de nuevo.", "Algo deu errado. Tente novamente.");
    if (/password.*at least|password.*characters|weak password/i.test(text))
      return L("Password must contain at least 6 characters.", "La contraseña debe tener por lo menos 6 caracteres.", "A senha deve ter pelo menos 6 caracteres.");
    if (/already registered|already been registered|user already exists/i.test(text))
      return L("This email is already registered. Please sign in instead.", "Este correo ya está registrado. Inicia sesión en su lugar.", "Este e-mail já está registrado. Faça login em vez disso.");
    if (/invalid email|email address.*invalid/i.test(text))
      return L("Enter a valid email address.", "Escribe un correo electrónico válido.", "Digite um endereço de e-mail válido.");
    if (/for security purposes|only request this after|rate limit|too many requests/i.test(text))
      return L("Please wait a moment before trying again.", "Espera un momento antes de intentarlo nuevamente.", "Aguarde um momento antes de tentar novamente.");
    if (/invalid login credentials/i.test(text))
      return L("Incorrect email or password.", "Correo o contraseña incorrectos.", "E-mail ou senha incorretos.");
    if (/email not confirmed/i.test(text))
      return L("Confirm your email before signing in.", "Confirma tu correo antes de iniciar sesión.", "Confirme seu e-mail antes de entrar.");
    if (/database error|saving new user|unexpected_failure/i.test(text))
      return L("We could not finish creating the account. Please try again in a moment.", "No pudimos terminar de crear la cuenta. Inténtalo nuevamente en un momento.", "Não foi possível concluir a criação da conta. Tente novamente em instantes.");
    return text;
  };

  const validateCredentials = (): string | null => {
    const normalizedEmail = email.trim().toLowerCase();
    if (isSignUp && !displayName.trim()) return L("Please enter your name.", "Escribe tu nombre.", "Digite seu nome.");
    if (!normalizedEmail) return L("Please enter your email.", "Escribe tu correo electrónico.", "Digite seu e-mail.");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return L("Enter a valid email address.", "Escribe un correo electrónico válido.", "Digite um endereço de e-mail válido.");
    if (!password && !isForgotPassword && !isForgotUsername) return L("Please enter your password.", "Escribe tu contraseña.", "Digite sua senha.");
    if (isSignUp && password.length < 6) return L("Password must contain at least 6 characters.", "La contraseña debe tener por lo menos 6 caracteres.", "A senha deve ter pelo menos 6 caracteres.");
    return null;
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return showError(L("Please enter your email.", "Escribe tu correo electrónico.", "Digite seu e-mail."));
    if (resendCooldown > 0) return;
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
      showError(friendlyError(error?.message));
      if (/only request this after|rate limit|for security purposes/i.test(error?.message || "")) setResendCooldown(45);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const validationError = validateCredentials();
    if (validationError) return showError(validationError);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: normalizedName, name: normalizedName, username: normalizedName },
        },
      });
      if (error) throw error;

      if (data.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0) {
        showError(L("This email is already registered. Please sign in instead.", "Este correo ya está registrado. Inicia sesión en su lugar.", "Este e-mail já está registrado. Faça login em vez disso."));
        setIsSignUp(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          try {
            await (supabase as any)
              .from("profiles")
              .upsert({ id: data.user.id, username: normalizedName, email: normalizedEmail }, { onConflict: "id" });
          } catch {}
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
      console.error("Prayer & Fire sign-up failed:", error);
      showError(friendlyError(error?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    const validationError = validateCredentials();
    if (validationError) return showError(validationError);
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw error;
      if (data.user) {
        await supabase.auth.getUser();
        setUser(data.user);
      }
    } catch (error: any) {
      if (/email not confirmed/i.test(error?.message || "")) setAwaitingConfirmation(true);
      showError(friendlyError(error?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isForgotUsername) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return showError(L("Please enter your email.", "Escribe tu correo electrónico.", "Digite seu e-mail."));
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_username_by_email", { _email: normalizedEmail });
        if (error) throw error;
        if (!data) return showError(t("noAccountFound"));
        toast({ title: t("usernameFound"), description: `${t("yourUsernameIs")} ${data}` });
        setIsForgotUsername(false);
      } catch (error: any) {
        showError(friendlyError(error?.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isForgotPassword) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return showError(L("Please enter your email.", "Escribe tu correo electrónico.", "Digite seu e-mail."));
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: t("emailSent"), description: t("checkEmailResetPassword") });
        setIsForgotPassword(false);
      } catch (error: any) {
        showError(friendlyError(error?.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignUp) await handleSignUp();
    else await handleSignIn();
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
          {isSignUp && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {L(
                "Create your Prayer & Fire profile. You can add or change your photo after signing in.",
                "Crea tu perfil de Prayer & Fire. Podrás agregar o cambiar tu foto después de iniciar sesión.",
                "Crie seu perfil do Prayer & Fire. Você poderá adicionar ou alterar sua foto depois de entrar.",
              )}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-[15px]">
          {isSignUp && (
            <Input
              type="text"
              placeholder={L("Your name", "Tu nombre", "Seu nome")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 focus:border-primary transition-colors"
            />
          )}

          <Input
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 focus:border-primary transition-colors"
          />

          {!isForgotPassword && !isForgotUsername && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border rounded-xl text-foreground h-12 px-4 pr-12 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={showPassword ? L("Hide password", "Ocultar contraseña", "Ocultar senha") : L("Show password", "Mostrar contraseña", "Mostrar senha")}
              >
                {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
              </button>
            </div>
          )}

          <Button
            onClick={isForgotUsername || isForgotPassword ? handleAuth : isSignUp ? handleSignUp : handleSignIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-semibold mt-[25px] transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? t("loading") : isForgotUsername ? t("findUsername") : isForgotPassword ? t("send") : isSignUp ? t("signup") : t("signin")}
          </Button>

          {!isForgotPassword && !isForgotUsername && (
            <Button
              variant="outline"
              onClick={() => {
                setIsSignUp((prev) => !prev);
                setAwaitingConfirmation(false);
              }}
              className="w-full bg-transparent border-2 border-border text-foreground hover:bg-secondary hover:border-primary rounded-xl h-12 text-base font-medium transition-all duration-200"
              disabled={loading}
            >
              {isSignUp ? t("alreadyHaveAccount") : t("signup")}
            </Button>
          )}

          {awaitingConfirmation && !isForgotPassword && !isForgotUsername && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground text-center">{t("confirmEmailBeforeSignIn")}</p>
              <Button
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={loading || resendCooldown > 0}
                className="w-full rounded-xl h-12"
              >
                {resendCooldown > 0 ? `${t("resendConfirmationEmail")} (${resendCooldown}s)` : t("resendConfirmationEmail")}
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
