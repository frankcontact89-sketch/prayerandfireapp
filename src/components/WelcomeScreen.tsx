import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import prayerFireLogo from "@/assets/prayer-fire-logo.jpg";

interface WelcomeScreenProps {
  t: (key: string) => string;
  onContinue: () => void;
  onGiving: () => void;
}

export function WelcomeScreen({ t, onContinue, onGiving }: WelcomeScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(onContinue, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
    >
      {/* Logo */}
      <div className="mb-6 animate-scale-in">
        <img 
          src={prayerFireLogo} 
          alt="Prayer & Fire Logo" 
          className="w-40 h-40 rounded-full object-cover"
        />
      </div>

      {/* Title */}
      <h1 className="text-[32px] font-bold text-white mb-1.5">
        Prayer & Fire
      </h1>

      {/* Subtitle */}
      <p className="text-lg font-semibold text-primary mb-3.5">
        {t("welcome") || "Welcome"}
      </p>

      {/* Message */}
      <p className="text-[15px] text-[#CCCCCC] max-w-[320px] mb-8 leading-relaxed">
        {t("welcomeBody1")}
        <br />
        {t("welcomeBody2")}
      </p>

      {/* Enter Button */}
      <Button 
        onClick={handleContinue}
        className="bg-primary hover:bg-primary/90 text-white rounded-[10px] px-7 py-3.5 text-base font-semibold"
      >
        {t("enterApp") || "Enter App"}
      </Button>
    </div>
  );
}
