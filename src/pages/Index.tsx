import React, { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import realisticFlame from "@/assets/realistic-flame.png";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const lang = (typeof window !== "undefined" && localStorage.getItem("pf_lang")) || "en";

  const [verse, setVerse] = useState<{ text: string; ref: string } | null>(null);
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

    setVerse(verses[Math.floor(Math.random() * verses.length)]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/10 blur-[140px]" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-orange-500/10 blur-[120px]" />

      <div className="relative z-10 px-6 pt-8 pb-28">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={entryLogo}
            alt="Prayer & Fire"
            className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.45)] mb-4"
          />

          <p className="uppercase tracking-[0.35em] text-white/80 text-xs font-semibold mb-3">PRAYER & FIRE</p>

          <h1 className="text-[42px] leading-[0.95] font-extrabold tracking-tight max-w-[330px]">
            Prayer that
            <span className="block text-orange-500">connects nations.</span>
          </h1>

          <p className="text-zinc-400 mt-5 text-base leading-relaxed max-w-sm">
            A global movement to ignite hearts, deepen prayer, and walk together in faith.
          </p>
        </div>

        <div className="relative h-[55px] mb-[-10px]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-[130px] rounded-[100%] border-t border-orange-500/30 bg-gradient-to-t from-orange-500/10 to-transparent blur-[1px]" />
        </div>

        <section className="relative rounded-[30px] border border-orange-500/20 bg-zinc-950/85 backdrop-blur-xl p-6 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.10)]">
          <div className="absolute inset-0 bg-orange-500/[0.03]" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-orange-400 uppercase tracking-[0.22em] text-xs font-bold">PRAYER / VERSE OF THE DAY</p>

              <Quote className="w-5 h-5 text-orange-400" />
            </div>

            {verse ? (
              <>
                <p className="text-[30px] leading-[1.2] font-light text-white">"{verse.text}"</p>

                <p className="text-orange-400 text-xl font-bold mt-7">— {verse.ref}</p>
              </>
            ) : (
              <p className="text-zinc-500">No verse available.</p>
            )}

            <div className="mt-8 pt-6 border-t border-orange-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <p className="text-orange-400 uppercase tracking-[0.22em] text-xs font-bold">DAILY REFLECTION</p>
              </div>

              <p className="text-zinc-300 text-base leading-relaxed font-light">
                God is still moving even in seasons where you cannot yet see the full picture. Stay faithful. Stay close
                to Him.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
