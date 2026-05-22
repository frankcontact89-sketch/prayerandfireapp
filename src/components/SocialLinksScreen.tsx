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
            <ArrowLeft className="w-6 h-6 text-orange-500" />
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

          {whatsappLinks.length === 0 && (
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 text-center">
              <p className="text-zinc-400">No WhatsApp links are available right now.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 pt-6 pb-24">
      <header className="mb-8">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-orange-500 font-semibold">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/20 via-zinc-950 to-black p-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-bold tracking-wide">CONNECT</span>
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
          className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-orange-500 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
        >
          <Globe2 className="w-6 h-6 text-orange-500" />
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
          className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
        >
          <Mail className="w-6 h-6" />
          Email Ministry
        </button>

        <button
          onClick={onNavigateToEvents}
          className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 px-6 flex items-center justify-center gap-3 active:scale-95 transition"
        >
          <Calendar className="w-6 h-6" />
          Events
        </button>
      </section>
    </div>
  );
}
