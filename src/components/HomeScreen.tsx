import React, { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import realisticFlame from "@/assets/realistic-flame.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const lang = (typeof window !== "undefined" && localStorage.getItem("pf_lang")) || "en";

  const [verse, setVerse] = useState<{
    text: string;
    ref: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerse();
  }, []);

  const loadVerse = async () => {
    const { data } = await supabase
      .from("verses")
      .select("text_en,ref_en,text_es,ref_es,text_pt,ref_pt")
      .eq("is_active", true);

    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    const verses = data.map((v: any) => ({
      text: v[`text_${lang}`] || v.text_en,
      ref: v[`ref_${lang}`] || v.ref_en,
    }));

    const random = verses[Math.floor(Math.random() * verses.length)];

    setVerse(random);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Blue glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/10 blur-[140px]" />

      {/* Orange glow */}
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-orange-500/10 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 px-6 pt-10 pb-24">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={realisticFlame} alt="Prayer & Fire" className="w-20 h-20 object-contain" />
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.4em] text-orange-400 text-xs font-bold mb-4">PRAYER & FIRE</p>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Prayer that
            <span className="block text-orange-500">connects nations.</span>
          </h1>

          <p className="text-zinc-400 mt-6 text-lg leading-relaxed max-w-md mx-auto">
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
        </div>

        {/* Verse Card */}
        <section className="relative rounded-[32px] border border-blue-500/20 bg-zinc-950/80 backdrop-blur-xl p-8 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.08)] mb-6">
          <div className="absolute inset-0 bg-blue-500/5" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-blue-400 uppercase tracking-[0.3em] text-xs font-bold">VERSE OF THE DAY</p>

              <Quote className="w-6 h-6 text-blue-400" />
            </div>

            {verse ? (
              <>
                <p className="text-3xl leading-tight font-light text-white">"{verse.text}"</p>

                <p className="text-blue-400 text-xl font-bold mt-8">— {verse.ref}</p>
              </>
            ) : (
              <p className="text-zinc-500">No verse available.</p>
            )}
          </div>
        </section>

        {/* Daily Reflection */}
        <section className="rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-zinc-950 to-black p-7 shadow-[0_0_40px_rgba(249,115,22,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <p className="text-orange-400 uppercase tracking-[0.3em] text-xs font-bold">DAILY REFLECTION</p>

            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>

          <p className="text-2xl leading-relaxed text-white font-light">
            God is still working even in the quiet seasons of your life.
          </p>

          <div className="flex justify-center gap-3 mt-8">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
        </section>
      </div>
    </div>
  );
}
