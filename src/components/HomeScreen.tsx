import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="relative min-h-screen py-8 px-4">
      {/* Fire background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 dark:opacity-15"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-center">{t("appName")}</h1>
          <p className="text-lg text-muted-foreground text-center max-w-md">
            {t("welcome")}
          </p>
        </div>

      </div>
    </div>
  );
}
