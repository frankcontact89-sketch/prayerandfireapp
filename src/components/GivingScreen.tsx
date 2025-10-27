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
import { Separator } from "@/components/ui/separator";
import { CreditCard, DollarSign, Heart, BookOpen, ExternalLink } from "lucide-react";

interface GivingScreenProps {
  t: (en: string, es: string) => string;
}

export function GivingScreen({ t }: GivingScreenProps) {
  const STRIPE_SUBSCRIPTION = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const STRIPE_ONETIME = "https://buy.stripe.com/test_4gM4gz4Tqc2xgdr365gUM02";
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  
  const [givingType, setGivingType] = useState<"subscription" | "onetime" | "project">("subscription");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedProject, setSelectedProject] = useState("");

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

      <Separator className="my-8" />

      {/* Featured Book Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {t("Featured Book", "Libro Destacado")}
            </h2>
          </div>
          <p className="text-muted-foreground">
            {t(
              "Discover The Fire Within — a devotional that ignites your faith and passion for God's presence.",
              "Descubre The Fire Within — un devocional que enciende tu fe y pasión por la presencia de Dios."
            )}
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            <img
              src="https://m.media-amazon.com/images/I/61fZ3n6J2lL._SY466_.jpg"
              alt="The Fire Within"
              className="w-40 h-auto rounded-lg shadow-lg"
            />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">The Fire Within</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("Available on Amazon", "Disponible en Amazon")}
              </p>
              <Button asChild className="w-full gap-2">
                <a href={BOOK_LINK} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  {t("Buy on Amazon", "Comprar en Amazon")}
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
        <p>
          {t(
            "Donations are processed securely through Stripe.",
            "Las donaciones se procesan de forma segura a través de Stripe."
          )}
        </p>
        <p>
          {t(
            "Books and products are available via Amazon and our official store soon.",
            "Los libros y productos están disponibles en Amazon y próximamente en nuestra tienda oficial."
          )}
        </p>
      </div>
    </div>
  );
}
