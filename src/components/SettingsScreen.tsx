import React from "react";
import { ChevronRight } from "lucide-react";

interface SettingsScreenProps {
  t: (en: string, es: string) => string;
}

export function SettingsScreen({ t }: SettingsScreenProps) {
  const settingsOptions = [
    { title: t("General", "General") },
    { title: t("Notifications", "Notificaciones") },
    { title: t("Account", "Cuenta") },
    { title: t("Help", "Ayuda") },
  ];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-extrabold text-foreground">
        {t("Settings", "Ajustes")}
      </h2>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {settingsOptions.map((option, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
          >
            <span className="font-semibold text-foreground">{option.title}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
