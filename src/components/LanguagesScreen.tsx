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
    <div
      className="bg-black text-white p-6 space-y-6"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 7rem)",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          ←
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-6 h-6 text-orange-500 shrink-0" />
          <h1 className="text-2xl font-extrabold text-white truncate">{t("select_language")}</h1>
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
    </div>
  );
}
