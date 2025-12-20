import React from "react";
import alineRamiro from "@/assets/aline-ramiro.jpg";
import franciscoRivera from "@/assets/francisco-rivera.jpg";

interface QuienesSomosScreenProps {
  t: (key: string) => string;
}

export function QuienesSomosScreen({ t }: QuienesSomosScreenProps) {
  return (
    <main className="min-h-screen bg-background text-foreground py-6 px-4 pb-12">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-3">Quiénes Somos</h1>
        <p className="text-muted-foreground leading-relaxed">
          Prayer & Fire es un movimiento levantado por Dios para encender el fuego
          de Su presencia en las naciones por medio de oración, adoración, enseñanza
          y servicio.
        </p>
      </header>

      {/* Visión / Misión */}
      <section className="grid gap-4 mb-7">
        <div className="border border-border/30 rounded-xl p-4 bg-card/50">
          <h3 className="text-primary font-semibold mb-2">Visión</h3>
          <p className="text-foreground/90 leading-relaxed">
            Levantar una generación encendida en el Espíritu, firme en la Palabra y
            comprometida con el Reino de Dios.
          </p>
        </div>

        <div className="border border-border/30 rounded-xl p-4 bg-card/50">
          <h3 className="text-primary font-semibold mb-2">Misión</h3>
          <p className="text-foreground/90 leading-relaxed">
            Equipar y conectar personas para vivir una vida de oración y fuego,
            llevando el evangelio con poder, amor y discipulado.
          </p>
        </div>
      </section>

      {/* Fundadores */}
      <section className="border-t border-border/30 pt-6 text-center">
        <h2 className="text-xl font-semibold mb-5">Fundadores</h2>

        <div className="grid gap-6 justify-items-center">
          {/* Aline */}
          <div className="flex flex-col items-center">
            <img
              src={alineRamiro}
              alt="Aline Ramiro"
              className="w-28 h-28 rounded-full object-cover border-2 border-primary mb-3 shadow-lg"
            />
            <div className="text-lg font-bold text-foreground">Aline Ramiro</div>
            <div className="text-primary font-semibold mt-1">Fundadora</div>
          </div>

          {/* Francisco */}
          <div className="flex flex-col items-center">
            <img
              src={franciscoRivera}
              alt="Francisco Rivera"
              className="w-28 h-28 rounded-full object-cover border-2 border-primary mb-3 shadow-lg"
            />
            <div className="text-lg font-bold text-foreground">Francisco Rivera</div>
            <div className="text-primary font-semibold mt-1">Presidente General</div>
          </div>
        </div>
      </section>
    </main>
  );
}
