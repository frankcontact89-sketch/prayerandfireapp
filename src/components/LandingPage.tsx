import React from "react";
import { Flame, Heart, BookOpen, Users, CreditCard, Mail, ExternalLink, Smartphone } from "lucide-react";
import prayerFireLogo from "@/assets/prayer-fire-logo.jpg";

interface LandingPageProps {
  t: (key: string) => string;
  onOpenApp: () => void;
  onOpenLegal: (section?: string) => void;
}

export function LandingPage({ t, onOpenApp, onOpenLegal }: LandingPageProps) {
  const features = [
    { icon: Flame, title: "Prayer Content", description: "Daily prayers and devotionals to strengthen your faith" },
    { icon: BookOpen, title: "Courses", description: "Spiritual growth courses on prayer, fasting, and more" },
    { icon: Users, title: "Community", description: "Connect with a faith-based community" },
    { icon: Heart, title: "Giving", description: "Support the ministry through secure donations" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center relative z-10">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-lg shadow-primary/30">
              <img src={prayerFireLogo} alt="Prayer & Fire" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Prayer & Fire App
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A faith-based mobile application for prayer, community, and spiritual growth. 
            Equipping and empowering people through prayer, biblical teaching, and spiritual resources.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onOpenApp}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/30"
            >
              <ExternalLink className="w-5 h-5" />
              Open Web App
            </button>
            <button
              disabled
              className="flex items-center gap-2 px-8 py-4 bg-card border border-border text-muted-foreground rounded-xl font-semibold text-lg cursor-not-allowed opacity-70"
            >
              <Smartphone className="w-5 h-5" />
              App Store (Coming Soon)
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payments Section */}
      <section className="py-16 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Secure Payments</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            All payments and donations are processed securely through Stripe. 
            We do not store any credit card or banking information.
          </p>
          <p className="text-sm text-muted-foreground">
            Donations are voluntary and tax-deductible where applicable.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            Have questions or need support? We're here to help.
          </p>
          <a 
            href="mailto:support@prayerandfire.app" 
            className="text-primary hover:underline text-lg font-medium"
          >
            support@prayerandfire.app
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Legal Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            <button
              onClick={() => onOpenLegal("privacy")}
              className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal("terms")}
              className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal("refunds")}
              className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
            >
              Refund Policy
            </button>
            <button
              onClick={() => onOpenLegal("payments")}
              className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
            >
              Payments & Subscriptions
            </button>
            <button
              onClick={() => onOpenLegal("support")}
              className="text-muted-foreground hover:text-primary text-sm transition-colors text-left"
            >
              Support & Contact
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-8" />

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Prayer & Fire App</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
              <a href="mailto:support@prayerandfire.app" className="hover:text-primary transition-colors">
                support@prayerandfire.app
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="https://prayerandfireapp.com" className="hover:text-primary transition-colors">
                prayerandfireapp.com
              </a>
            </div>
            <p>© {new Date().getFullYear()} Prayer & Fire App</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
