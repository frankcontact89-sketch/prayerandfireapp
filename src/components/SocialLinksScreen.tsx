import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Instagram, Calendar, ArrowLeft, Mail, Globe2, ExternalLink, Sparkles } from "lucide-react";
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

const CONTACT = "prayerandfireglobal@gmail.com";

const openEmail = (subject: string) => {
  window.open(`mailto:${CONTACT}?subject=${encodeURIComponent(subject)}`, "_blank");
};

export function SocialLinksScreen({ t, onBack, onNavigateToEvents }: SocialLinksScreenProps) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppContacts, setShowWhatsAppContacts] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase.from("app_links").select("*").eq("is_active", true).order("order_index");

    if (error) {
      toast({
        title: "Error",
        description: "Could not load links.",
        variant: "destructive",
      });
    } else {
      setLinks(data || []);
    }

    setLoading(false);
  };

  const whatsappLinks = links.filter((link) => link.icon?.toLowerCase() === "whatsapp");
  const instagramLinks = links.filter((link) => link.icon?.toLowerCase() === "instagram");

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-5 py-5 space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (showWhatsAppContacts) {
    return (
      <div className="min-h-screen bg-black text-white px-5 pt-4 pb-24 max-w-[430px] mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setShowWhatsAppContacts(false)}>
            <ArrowLeft className="w-5 h-5 text-blue-400" />
          </button>
          <h1 className="text-lg font-bold">{t("connect_whatsapp_community")}</h1>
        </div>

        <div className="space-y-3">
          {whatsappLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => window.open(link.url, "_blank")}
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              {link.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 pt-3 pb-24 max-w-[430px] mx-auto">
      <header className="mb-4">
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </button>

        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1a0d0d] via-[#09090f] to-[#10182b] p-4 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/30 px-3 py-1 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-400 text-xs font-bold tracking-wide uppercase">{t("connect")}</span>
          </div>

          <h1 className="text-2xl font-extrabold mb-2">Prayer & Fire</h1>

          <p className="text-zinc-400 leading-snug text-[13px]">{t("connect_subtitle")}</p>
        </div>
      </header>

      <section className="space-y-2.5 mb-6">
        <button
          onClick={() => window.open("https://prayerandfire.org", "_blank")}
          className="w-full rounded-xl bg-zinc-950 border border-blue-400/30 hover:border-blue-400 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-[0_0_24px_rgba(59,130,246,0.08)]"
        >
          <Globe2 className="w-5 h-5 text-blue-400" />
          {t("connect_official_website")}
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
        </button>

        {whatsappLinks.length > 0 && (
          <button
            onClick={() => setShowWhatsAppContacts(true)}
            className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            {t("connect_whatsapp_community")}
          </button>
        )}

        {instagramLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => window.open(link.url, "_blank")}
            className="w-full rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm"
          >
            <Instagram className="w-5 h-5" />
            {link.title}
          </button>
        ))}

        <button
          onClick={() => openEmail("Contact Prayer & Fire")}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm shadow-[0_0_30px_rgba(37,99,235,0.25)]"
        >
          <Mail className="w-5 h-5" />
          {t("connect_email_ministry")}
        </button>

        <button
          onClick={onNavigateToEvents}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-blue-600 hover:opacity-90 text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 active:scale-95 transition text-sm"
        >
          <Calendar className="w-5 h-5" />
          {t("events")}
        </button>
      </section>
    </div>
  );
}
