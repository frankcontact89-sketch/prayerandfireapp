import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Check, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface LanguagesScreenProps {
  t: (key: string) => string;
  currentLanguage: string;
  onLanguageChange: (code: string, name: string) => void;
  onBack: () => void;
}

const LANGUAGES = [
  ["English", "en"],
  ["Español", "es"],
  ["Português", "pt"],
  ["Français", "fr"],
  ["Italiano", "it"],
  ["Deutsch", "de"],
  ["中文", "zh"],
  ["日本語", "ja"],
  ["한국어", "ko"],
  ["العربية", "ar"],
  ["हिन्दी", "hi"],
  ["Русский", "ru"],
  ["Kiswahili", "sw"],
];

export function LanguagesScreen({ t, currentLanguage, onLanguageChange, onBack }: LanguagesScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [selectedName, setSelectedName] = useState(() => {
    const found = LANGUAGES.find(([, code]) => code === currentLanguage);
    return found ? found[0] : "English";
  });

  const { toast } = useToast();

  const handleSelectLanguage = (code: string, name: string) => {
    setSelectedLanguage(code);
    setSelectedName(name);
  };

  const handleSaveChanges = () => {
    onLanguageChange(selectedLanguage, selectedName);
    toast({
      title: t("languageSaved"),
      description: `${t("languagePreferenceSet")} ${selectedName}`,
    });
  };

  const hasChanges = selectedLanguage !== currentLanguage;

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          ←
        </Button>

        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-extrabold text-white">{t("select_language")}</h1>
        </div>
      </div>

      <Card className="p-6 bg-zinc-950 border-zinc-800">
        <div className="grid grid-cols-1 gap-3">
          {LANGUAGES.map(([name, code]) => (
            <Button
              key={code}
              variant={selectedLanguage === code ? "default" : "outline"}
              className="justify-between h-14 text-lg"
              onClick={() => handleSelectLanguage(code, name)}
            >
              <span>{name}</span>
              {selectedLanguage === code && <Check className="w-5 h-5" />}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleSaveChanges} disabled={!hasChanges} className="gap-2">
          <Save className="w-4 h-4" />
          {t("saveChanges")}
        </Button>
      </div>

      <p className="text-center text-sm text-zinc-400">{t("translation_note")}</p>
    </div>
  );
}
