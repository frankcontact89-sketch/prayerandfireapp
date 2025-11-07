import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download } from "lucide-react";

interface Module2ScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function Module2Screen({ t, onBack }: Module2ScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-primary mb-6">
            🙏 Módulo 2: El Poder del Ayuno y la Oración
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            En este segundo módulo aprenderás cómo el ayuno y la oración abren
            puertas espirituales, fortalecen tu fe y preparan tu corazón para
            escuchar la voz de Dios. Este entrenamiento está diseñado para líderes,
            intercesores y todo creyente que desea profundizar en su relación con
            el Señor.
          </p>
        </div>

        {/* Video Section */}
        <Card className="mb-8 overflow-hidden border-primary/20 shadow-lg shadow-primary/10">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/1ZfE3Pux0Gg"
              title="Escuela Prayer & Fire - Módulo 2"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </Card>

        {/* Material de Estudio */}
        <Card className="p-6 mb-8 border-primary/20">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-3">
              📘 Material de Estudio
            </h3>
            <p className="text-muted-foreground mb-6">
              Descarga la guía de estudio para repasar los puntos clave del módulo y
              realizar tus reflexiones personales.
            </p>
            <Button
              asChild
              className="gap-2"
            >
              <a
                href="https://firebasestorage.googleapis.com/v0/b/sample-materials/o/ayuno.pdf?alt=media"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4" />
                Descargar Guía (PDF)
              </a>
            </Button>
          </div>
        </Card>

        {/* Reflexión */}
        <Card className="p-6 mb-8 border-primary/20 bg-card/50">
          <h3 className="text-xl font-semibold text-primary mb-4 text-center">
            🔥 Reflexión
          </h3>
          <p className="text-muted-foreground text-center leading-relaxed">
            Recuerda: el ayuno sin oración es solo hambre. El poder está en buscar
            a Dios con todo tu ser, dejando que su Espíritu transforme tu corazón.
          </p>
        </Card>

        {/* Siguiente Módulo */}
        <div className="text-center mb-8">
          <Button
            variant="outline"
            onClick={() => alert("El Módulo 3 estará disponible pronto 🔥")}
            className="border-primary text-primary hover:bg-primary/10"
          >
            ⏭️ Ir al Módulo 3
          </Button>
        </div>

        {/* Testimonios */}
        <Card className="p-6 mb-8 border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-2 text-center">
            💬 Testimonios del Módulo 2
          </h3>
          <p className="text-muted-foreground text-sm text-center">
            Próximamente podrás compartir cómo este módulo fortaleció tu vida
            espiritual y tu comunión con Dios.
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground/60 text-xs mt-12">
          © Prayer & Fire Global Church – Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
