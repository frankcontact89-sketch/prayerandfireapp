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
import { CreditCard, DollarSign, Heart } from "lucide-react";

interface GivingScreenProps {
  t: (en: string, es: string) => string;
}

export function GivingScreen({ t }: GivingScreenProps) {
  const STRIPE_SUBSCRIPTION = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  
  const [givingType, setGivingType] = useState<"subscription" | "onetime" | "project">("subscription");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedProject, setSelectedProject] = useState("");

  const paymentMethods = [
    { value: "stripe", label: t("Credit/Debit Card", "Tarjeta de Crédito/Débito"), icon: CreditCard },
    { value: "cashapp", label: "Cash App", icon: DollarSign },
    { value: "paypal", label: "PayPal", icon: Heart },
    { value: "venmo", label: "Venmo", icon: DollarSign },
    { value: "zelle", label: "Zelle", icon: DollarSign },
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
      // Handle one-time giving based on payment method
      const paymentLinks: Record<string, string> = {
        stripe: `https://buy.stripe.com/test_onetime?amount=${amount}`,
        cashapp: `https://cash.app/$PrayerAndFire/${amount}`,
        paypal: `https://paypal.me/prayerandfire/${amount}`,
        venmo: `https://venmo.com/prayerandfire?amount=${amount}`,
        zelle: `mailto:giving@prayerandfire.org?subject=Zelle Payment ${amount}`,
      };
      window.open(paymentLinks[paymentMethod], "_blank");
    } else if (givingType === "project") {
      // Handle project support
      window.open(`https://buy.stripe.com/test_project_${selectedProject}?amount=${amount}`, "_blank");
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
        </Card>
      )}

      {/* One-Time Giving Option */}
      {givingType === "onetime" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground">
            {t("One-Time Gift", "Donación Única")}
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="amount">{t("Amount", "Cantidad")}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
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
            disabled={!amount || parseFloat(amount) <= 0}
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
            <Label htmlFor="project-amount">{t("Amount", "Cantidad")}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="project-amount"
                type="number"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
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
            disabled={!selectedProject || !amount || parseFloat(amount) <= 0}
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
