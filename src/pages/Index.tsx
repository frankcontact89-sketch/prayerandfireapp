import React, { useState } from "react";

export default function Index() {
  const [page, setPage] = useState("login");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [lang, setLang] = useState("en");

  const text = {
    en: {
      signIn: "Sign In",
      register: "Create Account",
      forgot: "Forgot Password or Username?",
      home: "Home",
      welcome: "Welcome to Prayer & Fire",
      joinLive: "Join Live Service",
      live: "Live Stream",
      liveText: "Watch our livestream and join live chats soon!",
      giving: "Giving",
      givingText:
        "Support Prayer & Fire for just $6.99/month.\nThank you for helping spread the fire!",
      subscribe: "Subscribe $6.99",
      gift: "One-time Gift",
      profile: "Profile",
      profileText: "Manage your account, language, and subscription.",
      store: "Store",
      comingSoon: "Our store and courses are coming soon!",
      language: "Language: ",
      logout: "Logout",
    },
    es: {
      signIn: "Iniciar sesión",
      register: "Crear cuenta",
      forgot: "¿Olvidaste tu contraseña o usuario?",
      home: "Inicio",
      welcome: "Bienvenido a Prayer & Fire",
      joinLive: "Ir al Servicio en Vivo",
      live: "En Vivo",
      liveText: "Mira nuestras transmisiones y únete al chat en vivo pronto.",
      giving: "Ofrendas",
      givingText:
        "Apoya a Prayer & Fire por solo $6.99/mes.\n¡Gracias por ayudar a expandir el fuego!",
      subscribe: "Suscribirse $6.99",
      gift: "Donación única",
      profile: "Perfil",
      profileText: "Administra tu cuenta, idioma y suscripción.",
      store: "Tienda",
      comingSoon: "Nuestra tienda y cursos estarán disponibles pronto.",
      language: "Idioma: ",
      logout: "Cerrar sesión",
    },
  };

  const STRIPE = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const YT = "https://youtube.com";
  const IG = "https://instagram.com";
  const WA = "https://wa.me/1XXXXXXXXXX";
  const ZOOM = "https://zoom.us";
  const t = (k: string) => text[lang as keyof typeof text][k as keyof typeof text.en] || k;

  // ===== LOGIN MODERNO =====
  if (page === "login") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{
          background: "linear-gradient(135deg, #fdf6f0, #f2f2f2)",
        }}
      >
        <div
          className="w-11/12 max-w-md bg-white shadow-xl rounded-2xl p-8 text-center"
          style={{ borderTop: "6px solid #FF6600" }}
        >
          <h1 className="text-3xl font-bold text-[#FF6600] mb-2">
            Prayer & Fire
          </h1>
          <p className="text-gray-500 mb-6">
            Connect. Pray. Give. Transform Lives.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
          />

          <button
            onClick={() => setPage("home")}
            className="w-full bg-[#FF6600] text-white py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 transition"
          >
            {t("signIn")}
          </button>

          <div className="flex justify-between mt-4 text-sm text-[#FF6600] font-medium">
            <button>{t("register")}</button>
            <button>{t("forgot")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MENÚ IZQUIERDO =====
  const LeftMenu = () => (
    <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-2xl p-6 z-50 rounded-r-xl">
      <h2 className="text-xl font-semibold text-[#FF6600] mb-4">Profile</h2>
      <ul className="space-y-3 text-gray-700">
        <li>
          <button onClick={() => { setPage("profile"); setLeftOpen(false); }}>
            {t("profile")}
          </button>
        </li>
        <li>
          <a href={STRIPE} target="_blank" rel="noopener noreferrer">
            💳 Subscription
          </a>
        </li>
        <li>
          <button onClick={() => setLang(lang === "en" ? "es" : "en")}>
            🌐 {t("language")} {lang === "en" ? "English" : "Español"}
          </button>
        </li>
        <li>
          <button onClick={() => setPage("login")}>🚪 {t("logout")}</button>
        </li>
      </ul>
      <button
        onClick={() => setLeftOpen(false)}
        className="absolute top-3 right-3 text-gray-500 text-2xl"
      >
        ✕
      </button>
    </div>
  );

  // ===== MENÚ DERECHO =====
  const RightMenu = () => (
    <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-2xl p-6 z-50 rounded-l-xl">
      <h2 className="text-xl font-semibold text-[#FF6600] mb-4">Media</h2>
      <ul className="space-y-3 text-gray-700">
        <li><a href={YT} target="_blank">▶️ YouTube</a></li>
        <li><a href={IG} target="_blank">📸 Instagram</a></li>
        <li><a href={WA} target="_blank">💬 WhatsApp</a></li>
        <li><a href={ZOOM} target="_blank">🎥 Zoom</a></li>
      </ul>
      <button
        onClick={() => setRightOpen(false)}
        className="absolute top-3 right-3 text-gray-500 text-2xl"
      >
        ✕
      </button>
    </div>
  );

  // ===== LAYOUT BASE =====
  const Layout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="relative flex flex-col min-h-screen bg-[#f9f9f9]">
      {leftOpen && <LeftMenu />}
      {rightOpen && <RightMenu />}

      <div className="flex justify-between items-center px-5 py-4 bg-white shadow-md border-b border-gray-200">
        <button onClick={() => setLeftOpen(true)} className="text-xl">☰</button>
        <h1 className="text-xl font-semibold text-[#FF6600]">{title}</h1>
        <button onClick={() => setRightOpen(true)} className="text-xl">⋮</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {children}
      </div>

      <div className="flex justify-around bg-white border-t border-gray-200 py-3 shadow-inner text-xl text-gray-700">
        <button onClick={() => setPage("home")}>🏠</button>
        <button onClick={() => setPage("live")}>📡</button>
        <button onClick={() => setPage("store")}>🛒</button>
        <button onClick={() => setPage("giving")}>❤️</button>
        <button onClick={() => setPage("profile")}>👤</button>
      </div>
    </div>
  );

  // ===== PÁGINAS =====
  const STRIPE_LINK = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";

  if (page === "home")
    return (
      <Layout title={t("home")}>
        <h2 className="text-3xl font-semibold text-[#FF6600] mb-3">
          {t("welcome")}
        </h2>
        <p className="text-gray-600 mb-5">
          Join our mission to ignite hearts and change lives.
        </p>
        <a
          href={YT}
          target="_blank"
          className="w-64 bg-[#FF6600] text-white py-3 rounded-lg font-semibold shadow hover:bg-orange-600 transition"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "live")
    return (
      <Layout title={t("live")}>
        <h2 className="text-2xl font-semibold text-[#FF6600] mb-3">
          📡 {t("live")}
        </h2>
        <p className="text-gray-600 mb-5">{t("liveText")}</p>
        <a
          href={YT}
          target="_blank"
          className="w-64 bg-[#FF6600] text-white py-3 rounded-lg font-semibold shadow hover:bg-orange-600 transition"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "store")
    return (
      <Layout title={t("store")}>
        <h2 className="text-2xl font-semibold text-[#FF6600] mb-2">🛒 {t("store")}</h2>
        <p className="text-gray-600">{t("comingSoon")}</p>
      </Layout>
    );

  if (page === "giving")
    return (
      <Layout title={t("giving")}>
        <h2 className="text-2xl font-semibold text-[#FF6600] mb-4">❤️ {t("giving")}</h2>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{t("givingText")}</p>
        <a
          href={STRIPE_LINK}
          target="_blank"
          className="w-64 bg-[#FF6600] text-white py-3 rounded-lg font-semibold shadow hover:bg-orange-600 transition block mb-3"
        >
          {t("subscribe")}
        </a>
        <button className="w-64 bg-gray-400 text-white py-3 rounded-lg font-semibold shadow">
          {t("gift")}
        </button>
      </Layout>
    );

  if (page === "profile")
    return (
      <Layout title={t("profile")}>
        <h2 className="text-2xl font-semibold text-[#FF6600] mb-3">👤 {t("profile")}</h2>
        <p className="text-gray-600">{t("profileText")}</p>
      </Layout>
    );
}
