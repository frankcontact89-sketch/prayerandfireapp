import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Languages, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES } from "@/config/languages";

interface TranslationScreenProps {
  t: (key: string) => string;
}

export function TranslationScreen({ t }: TranslationScreenProps) {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to translate",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate", {
        body: { text: text.trim(), targetLang },
      });

      if (error) throw error;
      setTranslated(data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Error",
        description: "Translation failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Languages className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">
          Translation (130+ languages)
        </h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Text to translate
            </label>
            <Textarea
              placeholder="Enter text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target language (130+ available)
            </label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTranslate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              "Translate"
            )}
          </Button>

          {translated && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Translation:</h3>
              <p className="text-foreground">{translated}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
