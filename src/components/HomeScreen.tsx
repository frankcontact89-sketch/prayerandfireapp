import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { YOUTUBE_CONFIG } from "@/config/youtube";

interface HomeScreenProps {
  t: (en: string, es: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-extrabold text-foreground">
        {t("Recent Services", "Servicios Recientes")}
      </h2>

      <YouTubeFeed
        apiKey={YOUTUBE_CONFIG.apiKey}
        channelId={YOUTUBE_CONFIG.channelId}
        t={t}
      />
    </div>
  );
}
