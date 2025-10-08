import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Youtube, MessageCircle, Video, Camera } from "lucide-react";

interface ProfileScreenProps {
  t: (en: string, es: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  signOut: () => void;
}

export function ProfileScreen({
  t,
  language,
  setLanguage,
  signOut,
}: ProfileScreenProps) {
  const [name, setName] = useState("Guest");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const socialLinks = [
    {
      icon: Instagram,
      url: "https://instagram.com/seloprayerandfire",
      label: "Instagram",
    },
    { icon: MessageCircle, url: "https://wa.me/1XXXXXXXXXX", label: "WhatsApp" },
    { icon: Youtube, url: "https://youtube.com", label: "YouTube" },
    { icon: Video, url: "https://zoom.us", label: "Zoom" },
  ];

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 pb-32">
      <h2 className="text-3xl font-extrabold text-foreground">
        {t("Profile", "Perfil")}
      </h2>

      {/* Profile Photo */}
      <div className="flex flex-col items-center space-y-3">
        <label
          htmlFor="photo-upload"
          className="relative cursor-pointer group"
        >
          <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          {t("Change Photo", "Cambiar Foto")}
        </p>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        <Input
          placeholder={t("Name", "Nombre")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12"
        />
        <Input
          placeholder={t("Country", "País")}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-12"
        />
        <Input
          placeholder={t("Phone Number", "Número de Teléfono")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12"
        />
        <Button className="w-full h-12 font-bold">
          {t("Save Changes", "Guardar Cambios")}
        </Button>
      </div>

      {/* Language Toggle */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">
          {t("Language / Idioma", "Language / Idioma")}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setLanguage("en")}
            className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
              language === "en"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
              language === "es"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Español
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">
          {t("Connect With Us", "Conéctate Con Nosotros")}
        </h3>
        <div className="flex justify-center gap-4">
          {socialLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => window.open(link.url, "_blank")}
              className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={link.label}
            >
              <link.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full text-center text-primary font-bold py-3"
      >
        {t("Sign Out", "Cerrar Sesión")}
      </button>
    </div>
  );
}
