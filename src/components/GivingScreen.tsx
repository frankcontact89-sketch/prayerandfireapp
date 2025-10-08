import React from "react";
import { Button } from "@/components/ui/button";

interface GivingScreenProps {
  t: (en: string, es: string) => string;
}

export function GivingScreen({ t }: GivingScreenProps) {
  const STRIPE_SUBSCRIPTION = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";

  const givingOptions = [
    { 
      title: t("Monthly Subscription", "Suscripción Mensual"), 
      action: () => window.open(STRIPE_SUBSCRIPTION, "_blank") 
    },
    { 
      title: t("One-Time Give", "Donación Única"), 
      action: () => {} 
    },
    { 
      title: t("Support Project", "Apoyar Proyecto"), 
      action: () => {} 
    },
  ];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-foreground">
          {t("Giving", "Ofrendas")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "Support Prayer & Fire.",
            "Apoya Prayer & Fire."
          )}
        </p>
      </div>

      <div className="space-y-4">
        {givingOptions.map((option, index) => (
          <Button
            key={index}
            onClick={option.action}
            className="w-full h-14 text-lg font-bold"
          >
            {option.title}
          </Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t(
            "Thank you for supporting our mission.",
            "Gracias por apoyar nuestra misión."
          )}
        </p>
      </div>
    </div>
  );
}
