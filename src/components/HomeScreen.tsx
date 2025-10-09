import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { YOUTUBE_CONFIG } from "@/config/youtube";
import fireIcon from "@/assets/fire-icon.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex flex-col items-center mb-8">
        <img src={fireIcon} alt="Fire" className="w-24 h-24 mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Prayer & Fire</h1>
      </div>

      <YouTubeFeed
        apiKey={YOUTUBE_CONFIG.apiKey}
        channelId={YOUTUBE_CONFIG.channelId}
        t={t}
      />
    </div>
  );
}
