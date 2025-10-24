import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Instagram, Calendar, Flame, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FloatingFireButton } from "@/components/FloatingFireButton";

interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  is_active: boolean;
}

interface SocialLinksScreenProps {
  t: (key: string) => string;
  onBack: () => void;
  onNavigateToEvents: () => void;
}

export function SocialLinksScreen({ t, onBack, onNavigateToEvents }: SocialLinksScreenProps) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppContacts, setShowWhatsAppContacts] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("app_links")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (error) {
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los enlaces",
        variant: "destructive" 
      });
    } else {
      setLinks(data || []);
    }
    setLoading(false);
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case "whatsapp":
        return <MessageCircle className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getButtonColor = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case "whatsapp":
        return "bg-green-600 hover:bg-green-700";
      case "instagram":
        return "bg-pink-600 hover:bg-pink-700";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-muted-foreground">
          {t("loading")}...
        </div>
      </div>
    );
  }

  const whatsappLinks = links.filter(link => link.icon?.toLowerCase() === "whatsapp");
  const otherLinks = links.filter(link => link.icon?.toLowerCase() !== "whatsapp");

  if (showWhatsAppContacts) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowWhatsAppContacts(false)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            💬 Contactos de WhatsApp
          </h2>
        </div>
        
        {whatsappLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => window.open(link.url, "_blank")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {link.title}
          </button>
        ))}

        <button
          onClick={() => setShowWhatsAppContacts(false)}
          className="mt-6 flex items-center justify-center gap-2 w-full text-primary hover:text-primary/80 font-semibold transition-all hover:scale-110 active:scale-95"
        >
          <Flame className="w-5 h-5 animate-pulse" />
        </button>

        <FloatingFireButton onClick={() => setShowWhatsAppContacts(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        🌐 {t("connect")}
      </h2>
      
      {whatsappLinks.length > 0 && (
        <button
          onClick={() => setShowWhatsAppContacts(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </button>
      )}

      {otherLinks.map((link) => (
        <button
          key={link.id}
          onClick={() => window.open(link.url, "_blank")}
          className={`w-full ${getButtonColor(link.icon)} text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors`}
        >
          {getIconComponent(link.icon)}
          {link.title}
        </button>
      ))}

      <button
        onClick={onNavigateToEvents}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        {t("events")}
      </button>

      <button
        onClick={onBack}
        className="mt-6 flex items-center justify-center gap-2 w-full text-primary hover:text-primary/80 font-semibold transition-all hover:scale-110 active:scale-95"
      >
        <Flame className="w-5 h-5 animate-pulse" />
      </button>

      {/* Floating Fire Button */}
      <FloatingFireButton onClick={onBack} />
    </div>
  );
}