import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle, Instagram, Calendar, ArrowLeft, Mail,
  HandHeart, BookOpen, Heart, Users, Globe2, Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FloatingFireButton } from "@/components/FloatingFireButton";

interface SocialLink { id: string; title: string; url: string; icon?: string; is_active: boolean; }
interface SocialLinksScreenProps { t: (key: string) => string; onBack: () => void; onNavigateToEvents: () => void; }

const CONTACT = "prayerandfireglobal@gmail.com";
const mailto = (subject: string) =>
  window.open(`mailto:${CONTACT}?subject=${encodeURIComponent(subject)}`, "_blank");

export function SocialLinksScreen({ t, onBack, onNavigateToEvents }: SocialLinksScreenProps) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppContacts, setShowWhatsAppContacts] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase.from("app_links").select("*").eq("is_active", true).order("order_index");
    if (error) toast({ title: t("error"), description: t("couldNotLoadLinks"), variant: "destructive" });
    else setLinks(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse bg-white/5" />)}
      </div>
    );
  }

  const whatsappLinks = links.filter(l => l.icon?.toLowerCase() === "whatsapp");
  const instagramLinks = links.filter(l => l.icon?.toLowerCase() === "instagram");

  if (showWhatsAppContacts) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setShowWhatsAppContacts(false)} className="text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">💬 {t("whatsappContacts")}</h2>
        </div>
        {whatsappLinks.map((link) => (
          <button key={link.id} onClick={() => window.open(link.url, "_blank")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <MessageCircle className="w-5 h-5" />{link.title}
          </button>
        ))}
        <FloatingFireButton onClick={() => setShowWhatsAppContacts(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-foreground">🌐 {t("connect")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("connect_subtitle")}</p>
      </header>

      {/* Engagement grid */}
      <section className="grid grid-cols-2 gap-3">
        <Tile icon={<HandHeart />} label={t("connect_prayer_request")} sub={t("connect_submit_request")}
          onClick={() => mailto("Prayer Request")} />
        <Tile icon={<BookOpen />} label={t("connect_bible_study")} sub={t("connect_join_group")}
          onClick={() => mailto("Join Bible Study")} />
        <Tile icon={<Heart />} label={t("connect_testimonies")} sub={t("connect_share_or_read")}
          onClick={() => mailto("Share Testimony")} />
        <Tile icon={<Users />} label={t("connect_volunteer")} sub={t("connect_serve_with_us")}
          onClick={() => mailto("Volunteer with Prayer & Fire")} />
        <Tile icon={<Globe2 />} label={t("connect_missions")} sub={t("connect_support_outreach")}
          onClick={() => mailto("Support Missions")} />
        <Tile icon={<Phone />} label={t("connect_contact_ministry")} sub={t("connect_reach_team")}
          onClick={() => mailto("Contact Ministry")} />
      </section>

      {/* Channels */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("connect_channels")}</h3>

        {whatsappLinks.length > 0 && (
          <button onClick={() => setShowWhatsAppContacts(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <MessageCircle className="w-5 h-5" />{t("connect_whatsapp_community")}
          </button>
        )}

        {instagramLinks.map((link) => (
          <button key={link.id} onClick={() => window.open(link.url, "_blank")}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <Instagram className="w-5 h-5" />{link.title}
          </button>
        ))}

        <button onClick={() => mailto("Hello Prayer & Fire")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
          <Mail className="w-5 h-5" />{t("connect_email_ministry")}
        </button>

        <button onClick={onNavigateToEvents}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
          <Calendar className="w-5 h-5" />{t("events")}
        </button>
      </section>

      {/* Global Movement */}
      <section className="rounded-2xl bg-gradient-to-br from-primary/15 to-card border border-primary/20 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">{t("connect_global_title")}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("connect_global_desc")}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t("connect_global_sub")}
        </p>
      </section>

      <FloatingFireButton onClick={onBack} />
    </div>
  );
}

function Tile({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; }) {
  return (
    <button onClick={onClick}
      className="rounded-2xl bg-card border border-border p-4 text-left hover:border-primary/40 hover:bg-card/80 transition-all active:scale-95">
      <div className="text-primary mb-2 [&_svg]:w-6 [&_svg]:h-6">{icon}</div>
      <div className="font-bold text-foreground text-sm">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </button>
  );
}

