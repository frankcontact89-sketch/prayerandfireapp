import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, MessageCircle, Instagram, Video, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "whatsapp":
        return <MessageCircle className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "zoom":
        return <Video className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getButtonColor = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case "youtube":
        return "bg-red-600 hover:bg-red-700";
      case "whatsapp":
        return "bg-green-600 hover:bg-green-700";
      case "instagram":
        return "bg-pink-600 hover:bg-pink-700";
      case "zoom":
        return "bg-blue-600 hover:bg-blue-700";
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        🌐 {t("connect")}
      </h2>
      
      {links.map((link) => (
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
        className="mt-6 text-primary hover:text-primary/80 font-semibold text-center w-full"
      >
        {t("back")}
      </button>
    </div>
  );
}