import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { YOUTUBE_CONFIG } from "@/config/youtube";
import fireIcon from "@/assets/fire-icon.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-background py-10 px-5">
      <div className="flex flex-col items-center mb-8">
        <div className="text-7xl mb-3">🔥</div>
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
