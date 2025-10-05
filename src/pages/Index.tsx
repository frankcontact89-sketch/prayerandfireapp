import React, { useState } from "react";

export default function Index() {
  const [page, setPage] = useState("login");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [search, setSearch] = useState("");

  const STRIPE = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const YT = "https://youtube.com";
  const IG = "https://instagram.com";
  const WA = "https://wa.me/1XXXXXXXXXX";
  const ZOOM = "https://zoom.us";

  // === Recent services (replace later with your real ones) ===
  const services = [
    {
      id: 1,
      title: "Revival Sunday — The Fire Returns",
      date: "Sep 29, 2025",
      image:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: 2,
      title: "Midweek Service — Faith Over Fear",
      date: "Sep 24, 2025",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
      url: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
    },
    {
      id: 3,
      title: "Youth Night — Chosen Generation",
      date: "Sep 20, 2025",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
      url: "https://www.youtube.com/watch?v=3GwjfUFyY6M",
    },
  ];

  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  // ===== LOGIN (clean minimal) =====
  if (page === "login") {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-white"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
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
            Sign In
          </button>

          <div className="flex justify-between mt-5 text-sm text-[#FF6600] font-medium">
            <button>Register</button>
            <button>Forgot Password?</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== LEFT MENU =====
  const LeftMenu = () => (
    <div
      className="absolute top-0 left-0 w-64 h-full bg-white shadow-2xl p-6 z-50 border-r border-gray-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <h2 className="text-lg font-semibold text-[#111] mb-6">Profile</h2>
      <ul className="space-y-4 text-gray-700">
        <li>
          <button onClick={() => setPage("profile")}>Account</button>
        </li>
        <li>
          <a href={STRIPE} target="_blank" rel="noopener noreferrer">
            Subscription
          </a>
        </li>
        <li>
          <button onClick={() => setPage("login")}>Logout</button>
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
    <div
      className="absolute top-0 right-0 w-64 h-full bg-white shadow-2xl p-6 z-50 border-l border-gray-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <h2 className="text-lg font-semibold text-[#111] mb-6">Media & Links</h2>
      <ul className="space-y-4 text-gray-700">
        <li>
          <a href={YT} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
        </li>
        <li>
          <a href={IG} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
        <li>
          <a href={WA} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </li>
        <li>
          <a href={ZOOM} target="_blank" rel="noopener noreferrer">
            Zoom
          </a>
        </li>
      </ul>
      <button
        onClick={() => setRightOpen(false)}
        className="absolute top-3 right-3 text-gray-400 text-2xl"
      >
        ✕
      </button>
    </div>
  );

  // ===== BASE LAYOUT =====
  const Layout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      className="relative flex flex-col min-h-screen bg-white text-gray-900"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
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

      <div className="flex-1 flex flex-col items-center justify-start text-left px-4 pt-6 overflow-y-auto">
        {children}
      </div>

      <div className="flex justify-around bg-[#fafafa] border-t border-gray-200 py-3 text-gray-700 text-sm font-medium">
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
      <Layout title="Home">
        <div className="w-full max-w-xl mx-auto">
          {/* Search Bar */}
          <div className="sticky top-0 bg-white z-10 mb-5">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#FF6600]">
              <span className="text-gray-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none text-gray-800"
              />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-[#111] mb-4">
            Recent Services
          </h2>

          {filtered.length === 0 ? (
            <p className="text-gray-500">No services found.</p>
          ) : (
            <div className="space-y-5">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="w-full h-44 bg-gray-100">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{s.date}</div>
                    <div className="text-lg font-semibold text-[#111] mb-3">
                      {s.title}
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#FF6600] text-white rounded-md text-sm font-semibold hover:bg-orange-600 transition"
                    >
                      Watch Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );

  if (page === "live")
    return (
      <Layout title="Live">
        <div className="w-full max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-[#111] mb-4">Live Stream</h2>
          <p className="text-gray-500 mb-6">Join our live experience.</p>
          <a
            href={YT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-64 bg-[#FF6600] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Join Live
          </a>
        </div>
      </Layout>
    );

  if (page === "store")
    return (
      <Layout title="Store">
        <div className="w-full max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#111] mb-4">Store</h2>
          <p className="text-gray-500">
            Our Store and Resources are coming soon.
          </p>
        </div>
      </Layout>
    );

  if (page === "giving")
    return (
      <Layout title="Giving">
        <div className="w-full max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-[#111] mb-4">Giving</h2>
          <p className="text-gray-500 mb-6 whitespace-pre-line">
            Support Prayer & Fire for just $6.99/month.
            {"\n"}Thank you for fueling the fire.
          </p>
          <a
            href={STRIPE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-64 bg-[#FF6600] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition mb-3"
          >
            Subscribe $6.99
          </a>
          <button className="inline-block w-64 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold">
            One-time Gift
          </button>
        </div>
      </Layout>
    );

  if (page === "profile")
    return (
      <Layout title="Profile">
        <div className="w-full max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#111] mb-4">Account</h2>
          <p className="text-gray-500">Manage your account and preferences.</p>
        </div>
      </Layout>
    );
}
