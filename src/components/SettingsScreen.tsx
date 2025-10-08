import React from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface SettingsScreenProps {
  t: (en: string, es: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  userName: string;
  userEmail: string;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onSignOut: () => void;
}

export function SettingsScreen({ t, language, setLanguage, userName, userEmail, onAdminClick, onProfileClick, onSignOut }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("⚙️ Settings", "⚙️ Configuración")}
      </h2>

      {/* Profile Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-primary">
          {t("Profile", "Perfil")}
        </h3>
        <p className="text-foreground">
          {t("Name:", "Nombre:")} {userName || t("User", "Usuario")}
        </p>
        <p className="text-foreground">
          {t("Email:", "Email:")} {userEmail}
        </p>
      </div>

      {/* Language Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-primary">
          {t("Language", "Idioma")}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              language === "en" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              language === "es" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLanguage("fr")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              language === "fr" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            FR
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-primary">
          {t("Notifications", "Notificaciones")}
        </h3>
        <p className="text-muted-foreground">
          🔔 {t("Enabled (simulated)", "Habilitado (simulado)")}
        </p>
      </div>

      {/* Admin Panel Section */}
      {loading ? (
        <div className="text-muted-foreground">
          {t("Loading admin status...", "Cargando estado de administrador...")}
        </div>
      ) : (
        isAdmin && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary">
              {t("Admin", "Administrador")}
            </h3>
            <button
              onClick={onAdminClick}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
            >
              {t("Open Admin Panel", "Abrir Panel de Administración")}
            </button>
          </div>
        )
      )}

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="mt-8 text-primary hover:text-primary/80 font-semibold text-center w-full"
      >
        {t("Sign Out", "Cerrar Sesión")}
      </button>
    </div>
  );
}
