import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Heart } from "lucide-react";
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

  const handleGiving = () => {
    setIsExiting(true);
    setTimeout(onGiving, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background p-6 transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center animate-scale-in">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-lg shadow-primary/30">
            <img 
              src={prayerFireLogo} 
              alt="Prayer & Fire" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          {t("welcomeTitle")}
        </h1>

        {/* Body Text */}
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>{t("welcomeBody1")}</p>
          <p>{t("welcomeBody2")}</p>
          <p className="font-medium text-foreground">{t("welcomeBody3")}</p>
          <p className="text-2xl">🙏🔥</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleContinue}
            className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          >
            <Flame className="w-5 h-5 mr-2" />
            {t("continue")}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleGiving}
            className="w-full h-12 text-base font-medium hover:bg-primary/10 transition-colors"
          >
            <Heart className="w-4 h-4 mr-2" />
            {t("viewGivingOptions")}
          </Button>
        </div>
      </div>
    </div>
  );
}
