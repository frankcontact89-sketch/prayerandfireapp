import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { AnimatedFireLogo } from "@/components/AnimatedFireLogo";
import { YOUTUBE_CONFIG } from "@/config/youtube";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-background py-10 px-5">
      <div className="flex flex-col items-center mb-8 gap-4">
        <AnimatedFireLogo />
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Prayer & Fire</h1>
      </div>

      <YouTubeFeed
        apiKey={YOUTUBE_CONFIG.apiKey}
        channelId={YOUTUBE_CONFIG.channelId}
        t={t}
      />
    </div>
  );
}
