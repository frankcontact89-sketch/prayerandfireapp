import React from "react";
import { Users, Flame, Globe2, Image as ImageIcon, MessageCircle, ChevronRight, Lock } from "lucide-react";

interface CommunityHubProps {
  t: (key: string) => string;
  onNavigate?: (page: string) => void;
}

type Section = {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: string;
  target?: string;
};

export function CommunityHubScreen({ t, onNavigate }: CommunityHubProps) {
  const sections: Section[] = [
    {
      id: "community",
      icon: Users,
      title: t("ph_community_title") || "Community",
      subtitle: t("ph_community_sub") || "Ministry, mission, men's, women's, youth & country groups.",
    },
    {
      id: "prayer",
      icon: Flame,
      title: t("ph_prayer_title") || "Prayer Rooms",
      subtitle: t("ph_prayer_sub") || "Prayer requests, live prayer, testimonies & urgent alerts.",
    },
    {
      id: "missions",
      icon: Globe2,
      title: t("ph_missions_title") || "Missions",
      subtitle: t("ph_missions_sub") || "Mozambique, Africa, Asia. Updates, volunteers & support.",
      target: "giving",
    },
    {
      id: "media",
      icon: ImageIcon,
      title: t("ph_media_title") || "Media",
      subtitle: t("ph_media_sub") || "Sermon clips, photos, videos and ministry updates.",
      target: "events",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="px-6 pt-8 pb-6 border-b border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            {t("ph_hero_kicker") || "Global Ministry"}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          {t("ph_hero_title") || "Prayer & Fire Community"}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t("ph_hero_sub") || "A global movement of prayer, missions, and discipleship. Connect with believers across nations."}
        </p>
      </div>

      {/* Sections */}
      <div className="px-4 pt-6 space-y-3">
        {sections.map((s) => {
          const Icon = s.icon;
          const clickable = !!s.target && !!onNavigate;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onNavigate!(s.target!)}
              className={`w-full text-left rounded-2xl border border-border bg-card p-5 flex items-start gap-4 transition ${
                clickable ? "hover:border-primary/40 hover:bg-card/80 active:scale-[0.99]" : "opacity-95"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  {!clickable && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase px-2 py-0.5 rounded-full bg-muted/50 border border-border">
                      <Lock className="w-2.5 h-2.5" />
                      {t("ph_preview") || "Preview"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-snug">{s.subtitle}</p>
              </div>
              {clickable && <ChevronRight className="w-5 h-5 text-muted-foreground mt-3 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Vision footer */}
      <div className="px-6 mt-8">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">
              {t("ph_vision_kicker") || "Coming Together"}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {t("ph_vision_body") ||
              "Prayer & Fire is being built into a global communication platform for prayer warriors, missionaries, and ministry leaders. New community features are rolling out gradually."}
          </p>
        </div>
      </div>
    </div>
  );
}
