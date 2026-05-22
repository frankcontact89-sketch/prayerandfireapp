import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, DollarSign, CreditCard, Sparkles } from "lucide-react";

interface GivingScreenProps {
  t: (key: string) => string;
}

export function GivingScreen({ t }: GivingScreenProps) {
  const STRIPE_SUBSCRIPTION = "https://buy.stripe.com/9B6cN5fAc0c29GTfij7bW03";

  const STRIPE_ONETIME = "https://buy.stripe.com/9B66oHco06AqdX9dab7bW01";

  const [givingType, setGivingType] = useState<"subscription" | "onetime" | "project">("subscription");

  const handleGive = () => {
    if (givingType === "subscription") {
      window.open(STRIPE_SUBSCRIPTION, "_blank");
    } else {
      window.open(STRIPE_ONETIME, "_blank");
    }
  };

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 bg-black text-white">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-400 font-semibold">SUPPORT PRAYER & FIRE</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Giving</h1>

        <p className="text-zinc-400 leading-relaxed max-w-md mx-auto">Support Prayer & Fire global mission.</p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => setGivingType("subscription")}
          className={`rounded-2xl border p-5 transition-all duration-300 ${
            givingType === "subscription"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Heart className="w-6 h-6" />
            <span className="text-sm font-semibold">Monthly</span>
          </div>
        </button>

        <button
          onClick={() => setGivingType("onetime")}
          className={`rounded-2xl border p-5 transition-all duration-300 ${
            givingType === "onetime"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <DollarSign className="w-6 h-6" />
            <span className="text-sm font-semibold">One-Time</span>
          </div>
        </button>

        <button
          onClick={() => setGivingType("project")}
          className={`rounded-2xl border p-5 transition-all duration-300 ${
            givingType === "project"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <CreditCard className="w-6 h-6" />
            <span className="text-sm font-semibold">Mission</span>
          </div>
        </button>
      </div>

      {/* Main Card */}
      <Card className="bg-zinc-950 border border-zinc-800 rounded-3xl p-7 shadow-2xl">
        {givingType === "subscription" && (
          <div className="space-y-6">
            <div>
              <p className="text-orange-400 uppercase tracking-widest text-sm font-bold mb-2">Monthly Support</p>

              <h2 className="text-3xl font-bold mb-3">Help Sustain the Mission</h2>

              <p className="text-zinc-400 leading-relaxed">Support the Prayer & Fire mission around the world.</p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-orange-500 hover:bg-orange-600"
            >
              Set Up Monthly Giving
            </Button>
          </div>
        )}

        {givingType === "onetime" && (
          <div className="space-y-6">
            <div>
              <p className="text-orange-400 uppercase tracking-widest text-sm font-bold mb-2">One-Time Gift</p>

              <h2 className="text-3xl font-bold mb-3">Support the Work</h2>

              <p className="text-zinc-400 leading-relaxed">Your support helps expand Prayer & Fire global mission.</p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-orange-500 hover:bg-orange-600"
            >
              Give Now
            </Button>
          </div>
        )}

        {givingType === "project" && (
          <div className="space-y-6">
            <div>
              <p className="text-orange-400 uppercase tracking-widest text-sm font-bold mb-2">Mission Support</p>

              <h2 className="text-3xl font-bold mb-3">Expand Global Outreach</h2>

              <p className="text-zinc-400 leading-relaxed">
                Help support Prayer & Fire global mission around the world.
              </p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-orange-500 hover:bg-orange-600"
            >
              Support Mission
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
