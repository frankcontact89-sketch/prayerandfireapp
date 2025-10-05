import React, { useState } from "react";

export default function Index() {
  const [page, setPage] = useState("login");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [lang, setLang] = useState("en");

  const text = {
    en: {
      signIn: "Sign In",
      register: "Register",
      forgot: "Forgot Password?",
      home: "Home",
      welcome: "Welcome to Prayer & Fire",
      joinLive: "Join Live Service",
      live: "Live",
      liveText: "Watch our live stream and connect.",
      giving: "Giving",
      givingText:
        "Support Prayer & Fire for just $6.99/month.\nThank you for fueling the fire.",
      subscribe: "Subscribe $6.99",
      gift: "One-time Gift",
      profile: "Profile",
      profileText: "Manage your account and preferences.",
      store: "Store",
      comingSoon: "Our Store and Resources are coming soon.",
      language: "Language: ",
      logout: "Logout",
    },
  };

  const STRIPE = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const YT = "https://youtube.com";
  const IG = "https://instagram.com";
  const WA = "https://wa.me/1XXXXXXXXXX";
  const ZOOM = "https://zoom.us";

  const t = (k: string) => text[lang as keyof typeof text][k as keyof typeof text.en] || k;

  // ===== LOGIN (MODERN TESLA STYLE) =====
  if (page === "login") {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-[#f8f8f8]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="w-11/12 max-w-md text-center">
          <h1 className="text-5xl font-semibold text-[#111] mb-3 tracking-tight">
            Prayer & Fire
          </h1>
          <p className="text-gray-500 text-lg mb-10 tracking-wide">
            Join the movement.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-gray-800"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-gray-800"
          />

          <button
            onClick={() => setPage("home")}
            className="w-full bg-[#FF6600] text-white py-3 rounded-lg font-semibold tracking-wide hover:bg-orange-600 transition"
          >
            {t("signIn")}
          </button>

          <div className="flex justify-between mt-5 text-sm text-[#FF6600] font-medium">
            <button>{t("register")}</button>
            <button>{t("forgot")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== LEFT MENU =====
  const LeftMenu = () => (
    <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-2xl p-6 z-50 border-r border-gray-100">
      <h2 className="text-lg font-semibold text-[#FF6600] mb-6">Profile</h2>
      <ul className="space-y-4 text-gray-700">
        <li>
          <button onClick={() => { setPage("profile"); setLeftOpen(false); }}>{t("profile")}</button>
        </li>
        <li>
          <a href={STRIPE} target="_blank" rel="noopener noreferrer">
            Subscription
          </a>
        </li>
        <li>
          <button onClick={() => setLang(lang === "en" ? "es" : "en")}>
            {t("language")} {lang === "en" ? "English" : "Español"}
          </button>
        </li>
        <li>
          <button onClick={() => setPage("login")}>{t("logout")}</button>
        </li>
      </ul>
      <button
        onClick={() => setLeftOpen(false)}
        className="absolute top-3 right-3 text-gray-400 text-2xl"
      >
        ✕
      </button>
    </div>
  );

  // ===== RIGHT MENU =====
  const RightMenu = () => (
    <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-2xl p-6 z-50 border-l border-gray-100">
      <h2 className="text-lg font-semibold text-[#FF6600] mb-6">Media</h2>
      <ul className="space-y-4 text-gray-700">
        <li><a href={YT} target="_blank">YouTube</a></li>
        <li><a href={IG} target="_blank">Instagram</a></li>
        <li><a href={WA} target="_blank">WhatsApp</a></li>
        <li><a href={ZOOM} target="_blank">Zoom</a></li>
      </ul>
      <button
        onClick={() => setRightOpen(false)}
        className="absolute top-3 right-3 text-gray-400 text-2xl"
      >
        ✕
      </button>
    </div>
  );

  // ===== LAYOUT BASE =====
  const Layout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      className="relative flex flex-col min-h-screen bg-white text-gray-900"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {leftOpen && <LeftMenu />}
      {rightOpen && <RightMenu />}

      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => setLeftOpen(true)} className="text-xl">
          ☰
        </button>
        <h1 className="text-xl font-semibold text-[#111]">{title}</h1>
        <button onClick={() => setRightOpen(true)} className="text-xl">
          ⋮
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        {children}
      </div>

      <div className="flex justify-around bg-[#fafafa] border-t border-gray-200 py-3 text-gray-600 text-lg font-medium">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("live")}>Live</button>
        <button onClick={() => setPage("store")}>Store</button>
        <button onClick={() => setPage("giving")}>Giving</button>
        <button onClick={() => setPage("profile")}>Profile</button>
      </div>
    </div>
  );

  // ===== PAGES =====
  if (page === "home")
    return (
      <Layout title={t("home")}>
        <h2 className="text-4xl font-semibold mb-4 text-[#111]">{t("welcome")}</h2>
        <p className="text-gray-500 mb-8">
          Faith. Unity. Purpose. Join us live or explore our resources.
        </p>
        <a
          href={YT}
          target="_blank"
          className="w-60 bg-[#FF6600] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "live")
    return (
      <Layout title={t("live")}>
        <h2 className="text-3xl font-semibold text-[#111] mb-3">{t("live")}</h2>
        <p className="text-gray-500 mb-5">{t("liveText")}</p>
        <a
          href={YT}
          target="_blank"
          className="w-60 bg-[#FF6600] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          {t("joinLive")}
        </a>
      </Layout>
    );

  if (page === "store")
    return (
      <Layout title={t("store")}>
        <h2 className="text-3xl font-semibold text-[#111] mb-3">{t("store")}</h2>
        <p className="text-gray-500">{t("comingSoon")}</p>
      </Layout>
    );

  if (page === "giving")
    return (
      <Layout title={t("giving")}>
        <h2 className="text-3xl font-semibold text-[#111] mb-4">{t("giving")}</h2>
        <p className="text-gray-500 mb-6 whitespace-pre-line">{t("givingText")}</p>
        <a
          href={STRIPE}
          target="_blank"
          className="w-60 bg-[#FF6600] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition block mb-3"
        >
          {t("subscribe")}
        </a>
        <button className="w-60 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold">
          {t("gift")}
        </button>
      </Layout>
    );

  if (page === "profile")
    return (
      <Layout title={t("profile")}>
        <h2 className="text-3xl font-semibold text-[#111] mb-3">{t("profile")}</h2>
        <p className="text-gray-500">{t("profileText")}</p>
      </Layout>
    );
}
