import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { YOUTUBE_CONFIG } from "@/config/youtube";
import prayerFireLogo from "@/assets/prayer-fire-main-logo.jpg";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-background py-10 px-5">
      <div className="flex flex-col items-center mb-8">
        <img src={prayerFireLogo} alt="Prayer & Fire Logo" className="w-32 h-32 mb-3 object-contain" />
        <h1 className="text-4xl font-bold text-foreground">Prayer & Fire</h1>
      </div>

      <YouTubeFeed
        apiKey={YOUTUBE_CONFIG.apiKey}
        channelId={YOUTUBE_CONFIG.channelId}
        t={t}
      />
    </div>
  );
}
