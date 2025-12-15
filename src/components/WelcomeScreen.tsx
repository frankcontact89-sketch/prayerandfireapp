import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  t: (key: string) => string;
  onContinue: () => void;
  onExploreStore: () => void;
}

export function WelcomeScreen({ t, onContinue, onExploreStore }: WelcomeScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(onContinue, 300);
  };

  const handleExploreStore = () => {
    setIsExiting(true);
    setTimeout(onExploreStore, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
    >
      {/* Logo */}
      <div className="mb-6 animate-scale-in">
        <img 
          src="/logo.png" 
          alt="Prayer & Fire" 
          className="w-[140px] h-auto"
        />
      </div>

      {/* Title */}
      <h1 className="text-[34px] font-bold text-white mb-2.5">
        Prayer & Fire
      </h1>

      {/* Subtitle */}
      <p className="text-lg font-semibold text-primary mb-4">
        {t("welcomeSubtitle") || "Welcome to Prayer & Fire."}
      </p>

      {/* Message */}
      <p className="text-[15px] text-white/85 max-w-[420px] mb-9 leading-relaxed">
        {t("welcomeMessage") || "A global movement dedicated to prayer, faith, spiritual growth, and transformation through Jesus Christ."}
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3.5 w-full max-w-[280px]">
        <Button 
          onClick={handleContinue}
          className="bg-primary hover:bg-primary/90 text-black rounded-[10px] py-3.5 text-base font-semibold w-full"
        >
          {t("startJourney") || "Start Your Journey"}
        </Button>
        
        <Button 
          onClick={handleExploreStore}
          variant="outline"
          className="bg-transparent text-primary border-primary hover:bg-primary/10 rounded-[10px] py-3.5 text-base font-semibold w-full"
        >
          {t("exploreStore") || "Explore Store & Courses"}
        </Button>
      </div>
    </div>
  );
}
