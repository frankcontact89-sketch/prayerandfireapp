import React from "react";
import { YouTubeFeed } from "@/components/YouTubeFeed";
import { YOUTUBE_CONFIG } from "@/config/youtube";
import fireBackground from "@/assets/fire-background-wallpaper.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="relative min-h-screen py-8 px-4">
      {/* Fire background */}
      <div 
        className="fixed inset-0 z-0 opacity-20 dark:opacity-10"
        style={{
          backgroundImage: `url(${fireBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col items-center mb-10 gap-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t("appName")}</h1>
        </div>

        <YouTubeFeed
          apiKey={YOUTUBE_CONFIG.apiKey}
          channelId={YOUTUBE_CONFIG.channelId}
          t={t}
        />
      </div>
    </div>
  );
}
