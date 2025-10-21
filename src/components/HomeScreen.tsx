import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="relative min-h-screen py-8 px-4 overflow-hidden">
      {/* 🔥 Fondo con energía tipo Tesla */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
      >
        <source src="https://cdn.pixabay.com/vimeo/271117941/fire-14136.mp4" type="video/mp4" />
      </video>

      {/* 🔆 Capa de energía animada */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-black/60 animate-pulse-slow"></div>

      {/* ✨ Efecto de flujo (Tesla style) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,120,0,0.15),transparent_60%)] animate-energyFlow"></div>

      {/* 🌟 Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center min-h-[80vh]">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">{t("appName")}</h1>
        <p className="text-gray-300 mt-3 text-lg">{t("welcome")}</p>
      </div>
    </div>
  );
}
