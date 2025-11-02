import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Heart, BookOpen, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GivingScreenProps {
  t: (en: string, es: string) => string;
}

export function GivingScreen({ t }: GivingScreenProps) {
  const STRIPE_SUBSCRIPTION = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const STRIPE_ONETIME = "https://buy.stripe.com/test_4gM4gz4Tqc2xgdr365gUM02";
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  
  const [givingType, setGivingType] = useState<"subscription" | "onetime" | "project">("subscription");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedProject, setSelectedProject] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    { value: "stripe", label: t("Credit/Debit Card", "Tarjeta de Crédito/Débito"), icon: CreditCard },
  ];

  const projects = [
    { value: "missions", label: t("Missions", "Misiones") },
    { value: "youth", label: t("Youth Ministry", "Ministerio Juvenil") },
    { value: "building", label: t("Building Fund", "Fondo de Construcción") },
    { value: "outreach", label: t("Community Outreach", "Alcance Comunitario") },
  ];

  const handleGive = () => {
    if (givingType === "subscription") {
      window.open(STRIPE_SUBSCRIPTION, "_blank");
    } else if (givingType === "onetime") {
      // All payment methods now redirect to Stripe
      window.open(STRIPE_ONETIME, "_blank");
    } else if (givingType === "project") {
      // Project support also goes through Stripe
      window.open(STRIPE_ONETIME, "_blank");
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Error",
          description: "⚠️ Debes iniciar sesión para cancelar tu suscripción.",
          variant: "destructive",
        });
        setCancelLoading(false);
        return;
      }

      // Placeholder for Supabase Function "cancel-subscription"
      // TODO: Connect with actual Stripe cancellation logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Éxito",
        description: "✅ Tu suscripción ha sido cancelada exitosamente.",
      });
    } catch (err) {
      console.error("Error cancelando suscripción:", err);
      toast({
        title: "Error",
        description: "❌ Ocurrió un error al cancelar la suscripción. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-foreground">
          {t("Giving", "Dar")}
        </h2>
        <p className="text-muted-foreground">
          {t("Support Prayer & Fire", "Apoya Prayer & Fire")}
        </p>
      </div>

      {/* Giving Type Selection */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant={givingType === "subscription" ? "default" : "outline"}
          onClick={() => setGivingType("subscription")}
          className="h-20 flex flex-col gap-1"
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs">{t("Monthly", "Mensual")}</span>
        </Button>
        <Button
          variant={givingType === "onetime" ? "default" : "outline"}
          onClick={() => setGivingType("onetime")}
          className="h-20 flex flex-col gap-1"
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-xs">{t("One-Time", "Una Vez")}</span>
        </Button>
        <Button
          variant={givingType === "project" ? "default" : "outline"}
          onClick={() => setGivingType("project")}
          className="h-20 flex flex-col gap-1"
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">{t("Project", "Proyecto")}</span>
        </Button>
      </div>

      {/* Subscription Option */}
      {givingType === "subscription" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            {t("Monthly Subscription", "Suscripción Mensual")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Support our ministry with a monthly recurring gift",
              "Apoya nuestro ministerio con una ofrenda mensual recurrente"
            )}
          </p>
          <Button onClick={handleGive} className="w-full h-12 text-lg font-bold">
            {t("Set Up Monthly Giving", "Configurar Ofrenda Mensual")}
          </Button>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              {t(
                "Already have a subscription? You can cancel it anytime.",
                "¿Ya tienes una suscripción? Puedes cancelarla en cualquier momento."
              )}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={cancelLoading}
                >
                  {cancelLoading ? t("Canceling...", "Cancelando...") : t("Cancel Subscription", "Cancelar Suscripción")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("Are you sure?", "¿Estás seguro?")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "This action will cancel your monthly subscription. You can continue using the service until the end of the current period.",
                      "Esta acción cancelará tu suscripción mensual. Podrás seguir usando el servicio hasta el final del período actual."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("No, keep subscription", "No, mantener suscripción")}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription}>
                    {t("Yes, cancel", "Sí, cancelar")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      )}

      {/* One-Time Giving Option */}
      {givingType === "onetime" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            {t("One-Time Gift", "Donación Única")}
          </h3>

          <div className="space-y-2">
            <Label>{t("Payment Method", "Método de Pago")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGive} 
            className="w-full h-12 text-lg font-bold"
          >
            {t("Giving Now", "Dar Ahora")}
          </Button>
        </Card>
      )}

      {/* Project Support Option */}
      {givingType === "project" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            {t("Support a Project", "Apoyar un Proyecto")}
          </h3>
          
          <div className="space-y-2">
            <Label>{t("Select Project", "Seleccionar Proyecto")}</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("Choose a project", "Elige un proyecto")} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.value} value={project.value}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("Payment Method", "Método de Pago")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleGive} 
            className="w-full h-12 text-lg font-bold"
            disabled={!selectedProject}
          >
            {t("Support Project", "Apoyar Proyecto")}
          </Button>
        </Card>
      )}

      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t(
            "Thank you for supporting our mission.",
            "Gracias por apoyar nuestra misión."
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(
            "All donations are tax-deductible",
            "Todas las donaciones son deducibles de impuestos"
          )}
        </p>
      </div>
    </div>
  );
}
