import React from "react";
import { ChevronRight, Shield, User, LogOut } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface SettingsScreenProps {
  t: (en: string, es: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onSignOut: () => void;
}

export function SettingsScreen({ t, language, setLanguage, onAdminClick, onProfileClick, onSignOut }: SettingsScreenProps) {
  const { isAdmin, loading } = useUserRole();
  
  const settingsOptions = [
    { title: t("General", "General") },
    { title: t("Notifications", "Notificaciones") },
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

      <button
        onClick={onProfileClick}
        className="w-full flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-foreground" />
          <span className="font-bold text-lg text-foreground">
            {t("Profile", "Perfil")}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">
          {t("Language", "Idioma")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("UI available in English and Spanish", "Interfaz disponible en inglés y español")}
        </p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full py-3 px-4 rounded-lg font-bold bg-muted text-foreground border border-border cursor-pointer"
        >
          <option value="en">🇺🇸 English (UI Supported)</option>
          <option value="es">🇪🇸 Español (UI Supported)</option>
          <option value="pt">🇧🇷 Português</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="nl">🇳🇱 Nederlands</option>
          <option value="pl">🇵🇱 Polski</option>
          <option value="ru">🇷🇺 Русский</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="ja">🇯🇵 日本語</option>
          <option value="ko">🇰🇷 한국어</option>
          <option value="ar">🇸🇦 العربية</option>
          <option value="hi">🇮🇳 हिन्दी</option>
          <option value="tr">🇹🇷 Türkçe</option>
        </select>
        <button
          onClick={() => {
            const message = language === "es" 
              ? "Idioma guardado correctamente" 
              : "Language saved successfully";
            alert(message);
          }}
          className="w-full py-3 px-4 rounded-lg font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {t("Save", "Guardar")}
        </button>
      </div>

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
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-between p-5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-600">{t("Sign Out", "Cerrar Sesión")}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-600" />
        </button>
      </div>
    </div>
  );
}
