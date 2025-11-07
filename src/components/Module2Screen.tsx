import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, ShoppingBag } from "lucide-react";

interface Module2ScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function Module2Screen({ t, onBack }: Module2ScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-8 text-center space-y-6 border-primary/20">
        <div className="flex justify-center">
          <GraduationCap className="w-20 h-20 text-primary" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Cursos Prayer & Fire
        </h1>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          Nuestros cursos espirituales ahora están disponibles en la tienda. 
          Aprende sobre ayuno, oración, adoración y más para profundizar tu 
          relación con Dios.
        </p>

        <div className="pt-4 space-y-3">
          <Button
            onClick={onBack}
            size="lg"
            className="w-full gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Ver Cursos en la Tienda
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Haz clic para explorar todos los cursos disponibles
          </p>
        </div>
      </Card>
    </div>
  );
}
