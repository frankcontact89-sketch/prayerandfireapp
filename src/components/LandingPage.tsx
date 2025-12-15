import React from "react";
import { Flame, Mail, CreditCard } from "lucide-react";
import prayerFireLogo from "@/assets/prayer-fire-logo.jpg";

interface LandingPageProps {
  t: (key: string) => string;
  onOpenApp: () => void;
  onOpenLegal: (section?: string) => void;
}

export function LandingPage({ t, onOpenApp, onOpenLegal }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[hsl(20,40%,6%)] to-black flex flex-col">
      {/* Hero Section - Centered */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 py-16">
        {/* Logo */}
        <div className="flex justify-center items-center mb-6">
          <img
            src={prayerFireLogo}
            alt="Prayer & Fire Logo"
            className="w-32 h-32 object-contain rounded-full border-2 border-primary/30"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-primary mb-4">
          Prayer & Fire App
        </h1>

        {/* Description */}
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          A faith-based mobile application for prayer, community, and spiritual growth.
          Equipping and empowering people through prayer, biblical teaching, and spiritual resources.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={onOpenApp}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            Open Web App
          </button>

          <button
            disabled
            className="bg-card text-muted-foreground py-3 rounded-xl cursor-not-allowed border border-border"
          >
            App Store (Coming Soon)
          </button>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="py-8 px-6 border-t border-border/20">
        <div className="max-w-md mx-auto">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6 text-xs">
            <button
              onClick={() => onOpenLegal("privacy")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal("terms")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal("refunds")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Refund Policy
            </button>
            <button
              onClick={() => onOpenLegal("support")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Support
            </button>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Prayer & Fire</span>
            </div>
            <a href="mailto:frankcontact89@gmail.com" className="hover:text-primary transition-colors">
              frankcontact89@gmail.com
            </a>
            <p>© {new Date().getFullYear()} Prayer & Fire App</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
