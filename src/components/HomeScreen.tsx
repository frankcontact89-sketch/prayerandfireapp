import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface HomeScreenProps {
  t: (key: string) => string;
  onNavigateToModule2: () => void;
}

export function HomeScreen({ t, onNavigateToModule2 }: HomeScreenProps) {
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-center">{t("appName")}</h1>
          <p className="text-lg text-muted-foreground text-center max-w-md">
            {t("welcome")}
          </p>
        </div>

        {/* Escuela Card */}
        <div className="max-w-md mx-auto">
          <Card className="p-6 border-primary/20 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  🔥 Escuela Prayer & Fire
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Accede al Módulo 2: El Poder del Ayuno y la Oración
                </p>
                <Button 
                  onClick={onNavigateToModule2}
                  className="w-full"
                >
                  Ver Módulo 2
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
