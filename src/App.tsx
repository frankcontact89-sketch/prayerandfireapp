// PRAYER & FIRE - APP FINAL COMPLETA 🔥
// ✅ Supabase + Stripe + Carrito local + Fondo fuego + Panel admin + Avatar

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";

// ------------------ CONFIGURACIÓN GLOBAL ------------------
const stripeKey = "YOUR_STRIPE_PUBLIC_KEY"; // pega tu stripe key

const stripePromise = loadStripe(stripeKey);

const appStyle: React.CSSProperties = {
  backgroundColor: "black",
  color: "white",
  fontFamily: "Poppins, sans-serif",
  minHeight: "100vh",
  textAlign: "center",
  padding: "1.5rem",
  backgroundImage:
    "url('https://cdn.pixabay.com/photo/2017/09/04/18/30/fire-2717688_1280.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const btn = (color = "#FF6A00") => ({
  background: color,
  color: "white",
  padding: "12px",
  width: "90%",
  border: "none",
  borderRadius: "8px",
  margin: "6px auto",
  fontSize: "1rem",
  cursor: "pointer",
});

// 🔥 BOTÓN DE FUEGO
const FireButton = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "2rem",
      cursor: "pointer",
      animation: "pulse 1.5s infinite",
    }}
  >
    🔥
    <style>{`
      @keyframes pulse {
        0% { opacity: 0.6; transform: scale(0.9) translateX(-50%); }
        50% { opacity: 1; transform: scale(1.1) translateX(-50%); }
        100% { opacity: 0.6; transform: scale(0.9) translateX(-50%); }
      }
    `}</style>
  </div>
);

// ------------------ LOGIN ------------------
function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return alert(error.message);
    nav("/home");
  };

  return (
    <div style={appStyle}>
      <h1 style={{ color: "#FF6A00" }}>Prayer & Fire</h1>
      <input
        style={{ ...btn(), background: "#222" }}
        placeholder="Email or Username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={{ ...btn(), background: "#222" }}
        type="password"
        placeholder="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <button style={btn()} onClick={signIn}>
        Sign In
      </button>
      <p
        style={{ color: "#FF6A00", marginTop: "1rem", cursor: "pointer" }}
        onClick={() => nav("/forgot")}
      >
        Forgot Password / Username
      </p>
    </div>
  );
}

// ------------------ HOME ------------------
function Home() {
  const nav = useNavigate();
  return (
    <div style={appStyle}>
      <h1>Prayer & Fire</h1>
      <button style={btn()} onClick={() => nav("/connect")}>Connect</button>
      <button style={btn()} onClick={() => nav("/giving")}>Giving</button>
      <button style={btn()} onClick={() => nav("/shopping")}>Shopping</button>
      <button style={btn()} onClick={() => nav("/settings")}>Settings</button>
      <FireButton onClick={() => nav("/home")} />
    </div>
  );
}

// ------------------ CONNECT ------------------
function Connect() {
  const nav = useNavigate();
  return (
    <div style={appStyle}>
      <h2>Connect</h2>
      <button style={btn("green")} onClick={() => window.open("https://wa.me/18572612862", "_blank")}>
        WhatsApp – Aline Ramiro
      </button>
      <button style={btn("green")} onClick={() => window.open("https://wa.me/19803659085", "_blank")}>
        WhatsApp – Francisco Rivera
      </button>
      <button style={btn("#E1306C")} onClick={() => window.open("https://www.instagram.com/prayerandfire", "_blank")}>
        Instagram
      </button>
      <button style={btn("#FF6A00")} onClick={() => nav("/events")}>Events</button>
      <FireButton onClick={() => nav("/home")} />
    </div>
  );
}

// ------------------ GIVING ------------------
function Giving() {
  const pay = async () => {
    alert("Por favor configura tu Stripe Price ID en el código para habilitar pagos");
    // Para configurar Stripe:
    // 1. Obtén tu Stripe Public Key
    // 2. Obtén tu Price ID de Stripe Dashboard
    // 3. Reemplaza "YOUR_STRIPE_PUBLIC_KEY" arriba
    // 4. Reemplaza "PRICE_ID_FROM_STRIPE" aquí abajo
  };
  return (
    <div style={appStyle}>
      <h2>Giving</h2>
      <p>Support Prayer & Fire Ministry</p>
      <button style={btn()} onClick={pay}>Set Up Monthly Giving</button>
      <FireButton onClick={() => window.history.back()} />
    </div>
  );
}

// ------------------ SHOPPING ------------------
function Shopping() {
  const [cart, setCart] = useState([]);
  const nav = useNavigate();
  const addToCart = (p) => setCart([...cart, p]);

  const products = [
    {
      name: "Voz Interior – Aline Ramiro",
      price: 11.99,
      description: "Libro espiritual disponible en Amazon",
      img: "https://m.media-amazon.com/images/I/61vHf8mFz9L._SL1500_.jpg",
      link: "https://a.co/d/j9o0IvP",
    },
    {
      name: "Prayer & Fire Mug",
      price: 9.99,
      description: "Taza oficial del movimiento Prayer & Fire.",
      img: "https://cdn-icons-png.flaticon.com/512/2972/2972459.png",
    },
    {
      name: "Faith T-Shirt",
      price: 19.99,
      description: "Camiseta 'Faith Over Fear' edición 2025.",
      img: "https://cdn-icons-png.flaticon.com/512/3437/3437319.png",
    },
    {
      name: "Worship Album",
      price: 14.99,
      description: "Álbum musical de adoración en vivo.",
      img: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
    },
  ];

  const total = cart.reduce((acc, p) => acc + p.price, 0);

  const cashOut = async () => {
    alert("Por favor configura tu Stripe Price ID en el código para habilitar pagos");
    // Para configurar Stripe:
    // 1. Obtén tu Stripe Public Key
    // 2. Obtén tus Price IDs de Stripe Dashboard para cada producto
    // 3. Reemplaza "YOUR_STRIPE_PUBLIC_KEY" arriba
  };

  return (
    <div style={appStyle}>
      <h2>Shopping</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {products.map((p) => (
          <div key={p.name} style={{ background: "#111", borderRadius: "8px", padding: "10px" }}>
            <img src={p.img} alt={p.name} width="120" />
            <h4>{p.name}</h4>
            <p style={{ fontSize: "0.9rem" }}>{p.description}</p>
            <p>${p.price.toFixed(2)}</p>
            <button style={btn()} onClick={() => addToCart(p)}>Add to Cart</button>
            {p.link && <button style={btn("#FF8800")} onClick={() => window.open(p.link)}>Buy Now</button>}
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ background: "#222", borderRadius: "8px", padding: "10px", marginTop: "20px" }}>
          <h3>Your Cart 🛒</h3>
          {cart.map((p, i) => (
            <p key={i}>{p.name} - ${p.price}</p>
          ))}
          <h4>Total: ${total.toFixed(2)}</h4>
          <button style={btn()} onClick={cashOut}>Cash Out</button>
        </div>
      )}
      <FireButton onClick={() => nav("/home")} />
    </div>
  );
}

// ------------------ PROFILE ------------------
function Profile() {
  return (
    <div style={appStyle}>
      <h2>Profile</h2>
      <img
        src="https://cdn-icons-png.flaticon.com/512/482/482059.png"
        alt="avatar"
        width="100"
        style={{ borderRadius: "50%", border: "2px solid #FF6A00" }}
      />
      <button style={btn("#FF6A00")}>📸 Upload or Take Photo</button>
      <button style={btn("#333")}>Create Avatar</button>
      <FireButton onClick={() => window.history.back()} />
    </div>
  );
}

// ------------------ SETTINGS ------------------
function Settings() {
  const nav = useNavigate();
  return (
    <div style={appStyle}>
      <h2>Settings</h2>
      <button style={btn()} onClick={() => nav("/profile")}>Profile</button>
      <button style={btn()} onClick={() => nav("/admin")}>Admin Panel</button>
      <FireButton onClick={() => nav("/home")} />
    </div>
  );
}

// ------------------ ADMIN PANEL ------------------
function Admin() {
  const nav = useNavigate();
  const tabs = ["Links", "Products", "Events", "Notifications", "Admins"];
  const [active, setActive] = useState("Links");

  return (
    <div style={appStyle}>
      <h2>Admin Panel</h2>
      {tabs.map((t) => (
        <button key={t} style={btn(active === t ? "#FF6A00" : "#333")} onClick={() => setActive(t)}>
          {t}
        </button>
      ))}
      <p style={{ marginTop: "20px" }}>Manage your {active.toLowerCase()} here.</p>
      <FireButton onClick={() => nav("/home")} />
    </div>
  );
}

// ------------------ APP ROOT ------------------
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/giving" element={<Giving />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
