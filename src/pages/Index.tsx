import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  // Auth form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setUsername(data.username);
        });
    }
  }, [user]);

  const t = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      en: {
        signIn: "Sign In",
        register: "Register",
        forgot: "Forgot Password?",
        home: "Home",
        welcome: "Welcome to Prayer & Fire!",
        joinLive: "Join Live Service",
        live: "Live Stream",
        liveText: "Watch our livestream and join live chats soon!",
        giving: "Giving",
        givingText: "Support Prayer & Fire for just $6.99/month.\nThank you for helping spread the fire!",
        subscribe: "Subscribe $6.99",
        gift: "One-time Gift",
        profile: "Profile",
        profileText: "Manage your account, language, and subscription.",
        profileMenu: "Profile Menu",
        subscription: "Subscription",
        language: "Language: ",
        logout: "Logout",
        media: "Media & Links",
        youtube: "YouTube",
        instagram: "Instagram",
        whatsapp: "WhatsApp",
        zoom: "Zoom",
        emailLabel: "Email",
        passwordLabel: "Password",
        usernameLabel: "Username",
      },
      es: {
        signIn: "Iniciar sesión",
        register: "Registrarse",
        forgot: "¿Olvidaste tu contraseña?",
        home: "Inicio",
        welcome: "¡Bienvenido a Prayer & Fire!",
        joinLive: "Ir al Servicio en Vivo",
        live: "En Vivo",
        liveText: "Mira nuestras transmisiones y únete al chat en vivo pronto.",
        giving: "Ofrendas",
        givingText: "Apoya a Prayer & Fire por solo $6.99/mes.\n¡Gracias por ayudar a expandir el fuego!",
        subscribe: "Suscribirse $6.99",
        gift: "Donación única",
        profile: "Perfil",
        profileText: "Administra tu cuenta, idioma y suscripción.",
        profileMenu: "Menú de Perfil",
        subscription: "Suscripción",
        language: "Idioma: ",
        logout: "Cerrar sesión",
        media: "Medios y Enlaces",
        youtube: "YouTube",
        instagram: "Instagram",
        whatsapp: "WhatsApp",
        zoom: "Zoom",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        usernameLabel: "Usuario",
      },
    };
    return (texts[language]?.[key]) || key;
  };

  const STRIPE_LINK = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const YOUTUBE_LINK = "https://youtube.com/@prayerandfire";
  const INSTAGRAM_LINK = "https://www.instagram.com/prayerandfire/";
  const WHATSAPP_LINK = "https://wa.me/";
  const ZOOM_LINK = "https://zoom.us";

  const handleAuth = async () => {
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
      } else if (authMode === "signup") {
        if (!signupUsername || signupUsername.length < 3) {
          toast({ 
            title: "Invalid username", 
            description: "Username must be at least 3 characters",
            variant: "destructive" 
          });
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        if (error) throw error;
        
        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            username: signupUsername,
            email: email,
          });
        }
        
        toast({ title: "Account created! Please check your email." });
      } else if (authMode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`
        });
        if (error) throw error;
        toast({ title: "Password reset email sent!" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("home");
    toast({ title: "Logged out successfully" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading Prayer & Fire...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black text-primary mb-2">Prayer & Fire</h1>
          <p className="text-muted-foreground">🔥 Spreading the Fire</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          {authMode === "signup" && (
            <Input
              type="text"
              placeholder={t("usernameLabel")}
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              className="bg-background border-input"
            />
          )}
          <Input
            type="email"
            placeholder={t("emailLabel")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background border-input"
          />
          {authMode !== "reset" && (
            <Input
              type="password"
              placeholder={t("passwordLabel")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-input"
            />
          )}

          <button
            onClick={handleAuth}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            {authMode === "signin" ? t("signIn") : authMode === "signup" ? t("register") : t("forgot")}
          </button>

          {authMode === "signin" && (
            <>
              <button
                onClick={() => setAuthMode("signup")}
                className="w-full text-primary py-2 font-medium hover:underline"
              >
                {t("register")}
              </button>
              <button
                onClick={() => setAuthMode("reset")}
                className="w-full text-primary py-2 font-medium hover:underline"
              >
                {t("forgot")}
              </button>
            </>
          )}

          {(authMode === "signup" || authMode === "reset") && (
            <button
              onClick={() => setAuthMode("signin")}
              className="w-full text-primary py-2 font-medium hover:underline"
            >
              ← {t("signIn")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const LeftMenu = () => (
    <div className="fixed top-0 left-0 w-64 h-full bg-card shadow-2xl p-6 z-50 animate-in slide-in-from-left">
      <h2 className="text-xl font-bold text-primary mb-6">👤 {t("profileMenu")}</h2>
      <ul className="space-y-4 text-foreground">
        <li>
          <button onClick={() => { setPage("profile"); setLeftMenuOpen(false); }} className="hover:text-primary transition">
            {t("profile")}
          </button>
        </li>
        <li>
          <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
            💳 {t("subscription")}
          </a>
        </li>
        <li>
          <button onClick={() => setLanguage(language === "en" ? "es" : "en")} className="hover:text-primary transition">
            🌐 {t("language")} {language === "en" ? "English" : "Español"}
          </button>
        </li>
        <li>
          <button onClick={handleLogout} className="hover:text-primary transition">
            🚪 {t("logout")}
          </button>
        </li>
      </ul>
      <button
        onClick={() => setLeftMenuOpen(false)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
      >
        ✕
      </button>
    </div>
  );

  const RightMenu = () => (
    <div className="fixed top-0 right-0 w-64 h-full bg-card shadow-2xl p-6 z-50 animate-in slide-in-from-right">
      <h2 className="text-xl font-bold text-primary mb-6">📂 {t("media")}</h2>
      <ul className="space-y-4 text-foreground">
        <li><a href={YOUTUBE_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">▶️ {t("youtube")}</a></li>
        <li><a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">📸 {t("instagram")}</a></li>
        <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">💬 {t("whatsapp")}</a></li>
        <li><a href={ZOOM_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">🎥 {t("zoom")}</a></li>
      </ul>
      <button
        onClick={() => setRightMenuOpen(false)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
      >
        ✕
      </button>
    </div>
  );

  const Layout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="relative flex flex-col min-h-screen bg-background">
      {leftMenuOpen && <LeftMenu />}
      {rightMenuOpen && <RightMenu />}
      {(leftMenuOpen || rightMenuOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => { setLeftMenuOpen(false); setRightMenuOpen(false); }}
        />
      )}

      <div className="flex justify-between items-center px-4 py-4 bg-card border-b border-border shadow-sm">
        <button onClick={() => setLeftMenuOpen(true)} className="text-2xl hover:text-primary transition">☰</button>
        <h1 className="text-xl font-bold text-primary">{title}</h1>
        <button onClick={() => setRightMenuOpen(true)} className="text-2xl hover:text-primary transition">⋮</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
        {children}
      </div>

      <div className="flex justify-around bg-card border-t border-border py-4 shadow-lg">
        <button onClick={() => setPage("home")} className={`text-2xl transition ${page === "home" ? "text-primary" : "hover:text-primary"}`}>🏠</button>
        <button onClick={() => setPage("live")} className={`text-2xl transition ${page === "live" ? "text-primary" : "hover:text-primary"}`}>📡</button>
        <button onClick={() => setPage("giving")} className={`text-2xl transition ${page === "giving" ? "text-primary" : "hover:text-primary"}`}>❤️</button>
        <button onClick={() => setPage("profile")} className={`text-2xl transition ${page === "profile" ? "text-primary" : "hover:text-primary"}`}>👤</button>
      </div>
    </div>
  );

  if (page === "home") {
    return (
      <Layout title={t("home")}>
        <h2 className="text-3xl font-bold text-primary mb-4">🏠 {t("home")}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{t("welcome")}</p>
        <p className="text-foreground mb-8">Welcome back, {username || user.email}! 🔥</p>
        <a
          href={YOUTUBE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition block text-center"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );
  }

  if (page === "live") {
    return (
      <Layout title={t("live")}>
        <h2 className="text-3xl font-bold text-primary mb-4">📡 {t("live")}</h2>
        <p className="text-muted-foreground mb-8 max-w-md">{t("liveText")}</p>
        <a
          href={YOUTUBE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition block text-center"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );
  }

  if (page === "giving") {
    return (
      <Layout title={t("giving")}>
        <h2 className="text-3xl font-bold text-primary mb-4">❤️ {t("giving")}</h2>
        <p className="text-muted-foreground mb-8 max-w-md whitespace-pre-line">{t("givingText")}</p>

        <div className="w-full max-w-sm space-y-3">
          <a
            href={STRIPE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition text-center"
          >
            {t("subscribe")}
          </a>

          <button className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition">
            {t("gift")}
          </button>
        </div>
      </Layout>
    );
  }

  if (page === "profile") {
    return (
      <Layout title={t("profile")}>
        <h2 className="text-3xl font-bold text-primary mb-4">👤 {t("profile")}</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{t("profileText")}</p>
        <div className="text-foreground space-y-2">
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </Layout>
    );
  }

  return null;
};

export default Index;
