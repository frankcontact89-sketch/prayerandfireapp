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

        {/* Founders Section */}
        <section className="mt-6 pt-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Founders
          </h3>

          <div className="grid gap-5 justify-items-center">
            {/* Founder */}
            <div className="flex flex-col items-center">
              <img
                src={alineRamiro}
                alt="Aline Ramiro"
                className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary"
              />
              <div className="font-semibold text-foreground">Aline Ramiro</div>
              <div className="text-sm text-foreground/80">Founder</div>
            </div>

            {/* President */}
            <div className="flex flex-col items-center">
              <img
                src={franciscoRivera}
                alt="Francisco Rivera"
                className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary"
              />
              <div className="font-semibold text-foreground">Francisco Rivera</div>
              <div className="text-sm text-foreground/80">President</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
