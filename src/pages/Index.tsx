import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [username, setUsername] = useState("");
  const { toast } = useToast();

  // Auth states
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

  const text = {
    en: {
      signIn: "Sign In",
      register: "Register",
      forgot: "Forgot Password or Username?",
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
      store: "Store",
      comingSoon: "Our products and courses are coming soon!",
      emailLabel: "Email",
      passwordLabel: "Password",
      usernameLabel: "Username",
    },
    es: {
      signIn: "Iniciar sesión",
      register: "Registrarse",
      forgot: "¿Olvidaste tu contraseña o usuario?",
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
      store: "Tienda",
      comingSoon: "¡Nuestros productos y cursos llegarán pronto!",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      usernameLabel: "Usuario",
    },
  };

  // Products placeholder for future use
  const products = [
    // Example: { id: 1, name: "Prayer & Fire T-shirt", price: 19.99, image: "https://via.placeholder.com/150" }
  ];

  const t = (k: string) => text[lang as keyof typeof text][k as keyof typeof text.en] || k;

  const STRIPE = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const YT = "https://youtube.com/@prayerandfire";
  const IG = "https://www.instagram.com/prayerandfire/";
  const WA = "https://wa.me/";
  const ZOOM = "https://zoom.us";

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
    setPage("login");
    toast({ title: "Logged out successfully" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading Prayer & Fire...</p>
      </div>
    );
  }

  if (!user || page === "login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4">
        <img
          src="https://i.imgur.com/4Q9QpMo.png"
          alt="Prayer & Fire Logo"
          className="w-44 h-44 mb-6"
        />
        
        {authMode === "signup" && (
          <input
            type="text"
            placeholder={t("usernameLabel")}
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
            className="w-80 mb-3 p-3 rounded-lg border border-input bg-background"
          />
        )}
        <input
          type="email"
          placeholder={t("emailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-80 mb-3 p-3 rounded-lg border border-input bg-background"
        />
        {authMode !== "reset" && (
          <input
            type="password"
            placeholder={t("passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-80 mb-4 p-3 rounded-lg border border-input bg-background"
          />
        )}

        <button
          onClick={handleAuth}
          className="w-80 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90"
        >
          {authMode === "signin" ? t("signIn") : authMode === "signup" ? t("register") : t("forgot")}
        </button>

        {authMode === "signin" && (
          <>
            <button
              onClick={() => setAuthMode("signup")}
              className="w-80 text-primary mt-3 font-medium"
            >
              {t("register")}
            </button>
            <button
              onClick={() => setAuthMode("reset")}
              className="w-80 text-primary font-medium"
            >
              {t("forgot")}
            </button>
          </>
        )}

        {(authMode === "signup" || authMode === "reset") && (
          <button
            onClick={() => setAuthMode("signin")}
            className="w-80 text-primary mt-3 font-medium"
          >
            ← {t("signIn")}
          </button>
        )}
      </div>
    );
  }

  const LeftMenu = () => (
    <div className="absolute top-0 left-0 w-64 h-full bg-card shadow-lg p-6 z-50">
      <h2 className="text-xl font-bold text-primary mb-4">👤 {t("profileMenu")}</h2>
      <ul className="space-y-3">
        <li>
          <button onClick={() => { setPage("profile"); setLeftOpen(false); }}>
            {t("profile")}
          </button>
        </li>
        <li>
          <a href={STRIPE} target="_blank" rel="noopener noreferrer">
            💳 {t("subscription")}
          </a>
        </li>
        <li>
          <button onClick={() => setLang(lang === "en" ? "es" : "en")}>
            🌐 {t("language")} {lang === "en" ? "English" : "Español"}
          </button>
        </li>
        <li>
          <button onClick={handleLogout}>🚪 {t("logout")}</button>
        </li>
      </ul>
      <button
        onClick={() => setLeftOpen(false)}
        className="absolute top-3 right-3 text-muted-foreground text-2xl"
      >
        ✕
      </button>
    </div>
  );

  const RightMenu = () => (
    <div className="absolute top-0 right-0 w-64 h-full bg-card shadow-lg p-6 z-50">
      <h2 className="text-xl font-bold text-primary mb-4">📂 {t("media")}</h2>
      <ul className="space-y-3">
        <li><a href={YT} target="_blank">▶️ YouTube</a></li>
        <li><a href={IG} target="_blank">📸 Instagram</a></li>
        <li><a href={WA} target="_blank">💬 WhatsApp</a></li>
        <li><a href={ZOOM} target="_blank">🎥 Zoom</a></li>
      </ul>
      <button
        onClick={() => setRightOpen(false)}
        className="absolute top-3 right-3 text-muted-foreground text-2xl"
      >
        ✕
      </button>
    </div>
  );

  const Layout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="relative flex flex-col min-h-screen bg-background">
      {leftOpen && <LeftMenu />}
      {rightOpen && <RightMenu />}
      <div className="flex justify-between items-center px-4 py-3 bg-card border-b border-border shadow-sm">
        <button onClick={() => setLeftOpen(true)}>☰</button>
        <h1 className="text-xl font-bold text-primary">{title}</h1>
        <button onClick={() => setRightOpen(true)}>⋮</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {children}
      </div>
      <div className="flex justify-around bg-card border-t border-border py-3">
        <button onClick={() => setPage("home")}>🏠</button>
        <button onClick={() => setPage("live")}>📡</button>
        <button onClick={() => setPage("store")}>🛒</button>
        <button onClick={() => setPage("giving")}>❤️</button>
        <button onClick={() => setPage("profile")}>👤</button>
      </div>
    </div>
  );

  if (page === "home")
    return (
      <Layout title={t("home")}>
        <h2 className="text-2xl font-bold text-primary mb-2">🏠 {t("home")}</h2>
        <p className="mb-4">{t("welcome")}</p>
        <p className="text-foreground mb-6">Welcome back, {username || user.email}! 🔥</p>
        <a
          href={YT}
          target="_blank"
          rel="noopener noreferrer"
          className="w-80 bg-primary text-primary-foreground py-3 rounded-lg font-semibold block"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "live")
    return (
      <Layout title={t("live")}>
        <h2 className="text-2xl font-bold text-primary mb-2">📡 {t("live")}</h2>
        <p className="mb-4">{t("liveText")}</p>
        <a
          href={YT}
          target="_blank"
          rel="noopener noreferrer"
          className="w-80 bg-primary text-primary-foreground py-3 rounded-lg font-semibold block mt-4"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "store")
    return (
      <Layout title={t("store")}>
        <h2 className="text-2xl font-bold text-primary mb-2">🛒 {t("store")}</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground">{t("comingSoon")}</p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="p-4 border border-border rounded-lg w-80 bg-card shadow-sm mb-3"
            >
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-40 object-cover mb-2 rounded"
              />
              <h3 className="font-bold text-foreground">{p.name}</h3>
              <p className="text-muted-foreground mb-2">${p.price}</p>
              <a
                href={STRIPE}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-primary text-primary-foreground py-2 rounded font-semibold text-center hover:opacity-90"
              >
                Buy Now
              </a>
            </div>
          ))
        )}
      </Layout>
    );

  if (page === "giving")
    return (
      <Layout title={t("giving")}>
        <h2 className="text-2xl font-bold text-primary mb-4">❤️ {t("giving")}</h2>
        <p className="mb-6 whitespace-pre-line">{t("givingText")}</p>
        <a
          href={STRIPE}
          target="_blank"
          rel="noopener noreferrer"
          className="w-80 bg-primary text-primary-foreground py-3 rounded-lg font-semibold block mb-3"
        >
          {t("subscribe")}
        </a>
        <button className="w-80 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold">
          {t("gift")}
        </button>
      </Layout>
    );

  if (page === "profile")
    return (
      <Layout title={t("profile")}>
        <h2 className="text-2xl font-bold text-primary mb-2">👤 {t("profile")}</h2>
        <p className="mb-4">{t("profileText")}</p>
        <div className="text-foreground space-y-2">
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </Layout>
    );
}
