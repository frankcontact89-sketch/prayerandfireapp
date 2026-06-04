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

  const [givingType, setGivingType] = useState<"subscription" | "onetime">("subscription");

  const handleGive = () => {
    if (givingType === "subscription") {
      window.open(STRIPE_SUBSCRIPTION, "_blank");
    } else {
      window.open(STRIPE_ONETIME, "_blank");
    }
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-24 bg-black text-white max-w-[430px] md:max-w-[640px] lg:max-w-[768px] mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-3">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-[13px] text-orange-400 font-semibold tracking-wide uppercase">{t("supportPrayerFire")}</span>
        </div>

        <h1 className="text-[30px] font-extrabold tracking-tight mb-2">{t("giving_title")}</h1>

        <p className="text-zinc-300 text-[15px] leading-relaxed max-w-sm mx-auto">
          {t("giving_hero_subtitle")}
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setGivingType("subscription")}
          className={`rounded-2xl border p-4 transition-all duration-300 ${
            givingType === "subscription"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <Heart className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("monthly")}</span>
          </div>
        </button>

        <button
          onClick={() => setGivingType("onetime")}
          className={`rounded-2xl border p-4 transition-all duration-300 ${
            givingType === "onetime"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <DollarSign className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("oneTime")}</span>
          </div>
        </button>

        <button
          onClick={() => setGivingType("project")}
          className={`rounded-2xl border p-4 transition-all duration-300 ${
            givingType === "project"
              ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
              : "bg-zinc-950 border-zinc-800 text-zinc-400"
          }`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <CreditCard className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("giving_mission_label")}</span>
          </div>
        </button>
      </div>

      {/* Main Card */}
      <Card className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
        {givingType === "subscription" && (
          <div className="space-y-5">
            <div>
              <p className="text-orange-400 uppercase tracking-[0.25em] text-[11px] font-bold mb-2">{t("giving_monthly_eyebrow")}</p>
              <h2 className="text-[22px] font-semibold mb-2">{t("giving_monthly_title")}</h2>
              <p className="text-zinc-200 text-[15px] leading-relaxed">{t("giving_monthly_desc")}</p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-[50px] rounded-2xl text-[15px] font-bold bg-orange-500 hover:bg-orange-600"
            >
              {t("setUpMonthlyGiving")}
            </Button>
          </div>
        )}

        {givingType === "onetime" && (
          <div className="space-y-5">
            <div>
              <p className="text-orange-400 uppercase tracking-[0.25em] text-[11px] font-bold mb-2">{t("giving_onetime_eyebrow")}</p>
              <h2 className="text-[22px] font-semibold mb-2">{t("giving_onetime_title")}</h2>
              <p className="text-zinc-200 text-[15px] leading-relaxed">{t("giving_onetime_desc")}</p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-[50px] rounded-2xl text-[15px] font-bold bg-orange-500 hover:bg-orange-600"
            >
              {t("giveNow")}
            </Button>
          </div>
        )}

        {givingType === "project" && (
          <div className="space-y-5">
            <div>
              <p className="text-orange-400 uppercase tracking-[0.25em] text-[11px] font-bold mb-2">{t("giving_mission_eyebrow")}</p>
              <h2 className="text-[22px] font-semibold mb-2">{t("giving_mission_title")}</h2>
              <p className="text-zinc-200 text-[15px] leading-relaxed">{t("giving_mission_desc")}</p>
            </div>

            <Button
              onClick={handleGive}
              className="w-full h-[50px] rounded-2xl text-[15px] font-bold bg-orange-500 hover:bg-orange-600"
            >
              {t("giving_mission_btn")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
