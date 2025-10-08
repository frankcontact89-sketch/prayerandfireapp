import React from "react";
import { ChevronRight, Shield } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface SettingsScreenProps {
  t: (en: string, es: string) => string;
  onAdminClick: () => void;
}

export function SettingsScreen({ t, onAdminClick }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();
  
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

      {!loading && isAdmin && (
        <button
          onClick={onAdminClick}
          className="w-full flex items-center justify-between p-5 bg-primary/10 border-2 border-primary rounded-xl hover:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div className="text-left">
              <span className="font-bold text-lg text-foreground">
                {t("Admin Panel", "Panel de Administración")}
              </span>
              <p className="text-sm text-muted-foreground">
                {t("Manage app content and settings", "Administrar contenido y configuración")}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      )}

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
