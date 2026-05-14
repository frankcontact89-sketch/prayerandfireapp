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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          ←
        </Button>
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-foreground">
            {t("select_language")}
          </h1>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {LANGUAGES.map(([name, code]) => (
            <Button
              key={code}
              variant={selectedLanguage === code ? "default" : "outline"}
              className="justify-between"
              onClick={() => handleSelectLanguage(code as string, name as string)}
            >
              <span>{name}</span>
              {selectedLanguage === code && <Check className="w-4 h-4" />}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleSaveChanges}
          disabled={!hasChanges}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {t("saveChanges")}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("translation_note")}
      </p>
    </div>
  );
}
