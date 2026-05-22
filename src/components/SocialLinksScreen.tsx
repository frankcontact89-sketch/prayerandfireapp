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
      <div className="min-h-screen bg-black px-5 py-8 space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (showWhatsAppContacts) {
    return (
      <div className="min-h-screen bg-black text-white px-5 pt-6 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setShowWhatsAppContacts(false)}>
            <ArrowLeft className="w-6 h-6 text-blue-400" />
          </button>
          <h1 className="text-2xl font-bold">WhatsApp Community</h1>
        </div>

        <div className="space-y-4">
          {whatsappLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => window.open(link.url, "_blank")}
              className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
            >
              <MessageCircle className="w-6 h-6" />
              {link.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 pt-6 pb-24">
      <header className="mb-8">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-blue-400 font-semibold">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#1a0d0d] via-[#09090f] to-[#10182b] p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/30 px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-bold tracking-wide">CONNECT</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-3">Prayer & Fire</h1>

          <p className="text-zinc-400 leading-relaxed">
            Connect with the ministry, send a message, join updates, and stay close to what God is doing through Prayer
            & Fire.
          </p>
        </div>
      </header>

      <section className="space-y-4 mb-8">
        <button
          onClick={() => window.open("https://prayerandfire.org", "_blank")}
          className="w-full rounded-2xl bg-zinc-950 border border-blue-400/30 hover:border-blue-400 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition shadow-[0_0_24px_rgba(59,130,246,0.08)]"
        >
          <Globe2 className="w-6 h-6 text-blue-400" />
          Official Website
          <ExternalLink className="w-4 h-4 text-zinc-500" />
        </button>

        {whatsappLinks.length > 0 && (
          <button
            onClick={() => setShowWhatsAppContacts(true)}
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
          >
            <MessageCircle className="w-6 h-6" />
            WhatsApp Community
          </button>
        )}

        {instagramLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => window.open(link.url, "_blank")}
            className="w-full rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
          >
            <Instagram className="w-6 h-6" />
            {link.title}
          </button>
        ))}

        <button
          onClick={() => openEmail("Contact Prayer & Fire")}
          className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition shadow-[0_0_30px_rgba(37,99,235,0.25)]"
        >
          <Mail className="w-6 h-6" />
          Email Ministry
        </button>

        <button
          onClick={onNavigateToEvents}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-blue-600 hover:opacity-90 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
        >
          <Calendar className="w-6 h-6" />
          Events
        </button>
      </section>
    </div>
  );
}
