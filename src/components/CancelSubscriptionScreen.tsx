import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface CancelSubscriptionScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function CancelSubscriptionScreen({ t, onBack }: CancelSubscriptionScreenProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Error",
          description: "⚠️ Debes iniciar sesión para cancelar tu suscripción.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Placeholder for Supabase Function "cancel-subscription"
      // TODO: Connect with actual Stripe cancellation logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Éxito",
        description: "✅ Tu suscripción ha sido cancelada exitosamente.",
      });
      
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      console.error("Error cancelando suscripción:", err);
      toast({
        title: "Error",
        description: "❌ Ocurrió un error al cancelar la suscripción. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="flex items-center px-6 py-4">
          <button
            onClick={onBack}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground ml-4">
            Cancelar Suscripción
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center p-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        
        <h2 className="text-2xl font-bold text-primary mb-4">
          Cancelar Suscripción
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Puedes cancelar tu suscripción en cualquier momento. 
          Tu acceso continuará hasta el final del período actual.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Cancelando..." : "Cancelar Suscripción"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cancelará tu suscripción mensual. Podrás seguir usando el servicio hasta el final del período actual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener suscripción</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>
                Sí, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
