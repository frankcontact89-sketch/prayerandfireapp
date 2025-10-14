import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { AnimatedFireLogo } from "@/components/AnimatedFireLogo";
import { YOUTUBE_CONFIG } from "@/config/youtube";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="flex flex-col items-center mb-10 gap-3">
        <AnimatedFireLogo />
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t("appName")}</h1>
      </div>

      <YouTubeFeed
        apiKey={YOUTUBE_CONFIG.apiKey}
        channelId={YOUTUBE_CONFIG.channelId}
        t={t}
      />
    </div>
  );
}
