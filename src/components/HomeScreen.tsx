import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";
import alineRamiro from "@/assets/aline-ramiro.jpg";
import franciscoRivera from "@/assets/francisco-rivera.jpg";

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

        {/* Leadership Section */}
        <section className="mt-12 pt-6 border-t border-border/30 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-8">
            Liderazgo
          </h3>

          <div className="flex flex-col gap-8 items-center">
            {/* Fundadora */}
            <div className="flex flex-col items-center">
              <img
                src={alineRamiro}
                alt="Aline Ramiro"
                className="w-36 h-36 rounded-full object-cover mb-3 border-2 border-primary/30 shadow-lg"
              />
              <strong className="text-primary text-sm">Fundadora</strong>
              <p className="text-foreground font-medium">Aline Ramiro</p>
            </div>

            {/* Presidente General */}
            <div className="flex flex-col items-center">
              <img
                src={franciscoRivera}
                alt="Francisco Rivera"
                className="w-36 h-36 rounded-full object-cover mb-3 border-2 border-primary/30 shadow-lg"
              />
              <strong className="text-primary text-sm">Presidente General</strong>
              <p className="text-foreground font-medium">Francisco Rivera</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
