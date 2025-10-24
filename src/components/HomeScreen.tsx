import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  return (
    <div className="relative min-h-screen py-8 px-4 overflow-hidden">
      {/* Animated Fire background */}
      <div className="fixed inset-0 z-0">
        {/* Main fire background with flicker animation */}
        <div 
          className="absolute inset-0 opacity-40 dark:opacity-20 animate-[flicker_1.5s_ease-in-out_infinite]"
          style={{
            backgroundImage: `url(${realisticFlame})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Secondary fire layer with different timing for depth */}
        <div 
          className="absolute inset-0 opacity-25 dark:opacity-15 animate-[flicker_2s_ease-in-out_infinite_0.5s]"
          style={{
            backgroundImage: `url(${realisticFlame})`,
            backgroundSize: '110%',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)'
          }}
        />
        
        {/* Animated flame particles */}
        <div className="absolute bottom-0 left-1/4 w-4 h-4 bg-primary/80 rounded-full blur-sm animate-[flameRise_3s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-0 left-1/3 w-3 h-3 bg-accent/70 rounded-full blur-sm animate-[flameRise_2.5s_ease-in-out_infinite_0.5s]"></div>
        <div className="absolute bottom-0 left-1/2 w-5 h-5 bg-primary/90 rounded-full blur-sm animate-[flameRise_3.5s_ease-in-out_infinite_1s]"></div>
        <div className="absolute bottom-0 left-2/3 w-3 h-3 bg-accent/80 rounded-full blur-sm animate-[flameRise_2.8s_ease-in-out_infinite_1.5s]"></div>
        <div className="absolute bottom-0 right-1/4 w-4 h-4 bg-primary/75 rounded-full blur-sm animate-[flameRise_3.2s_ease-in-out_infinite_2s]"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent animate-[intensePulse_2s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-center drop-shadow-lg">{t("appName")}</h1>
          <p className="text-lg text-muted-foreground text-center max-w-md drop-shadow-md">
            {t("welcome")}
          </p>
        </div>
      </div>
    </div>
  );
}
