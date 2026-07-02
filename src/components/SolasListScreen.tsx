import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, ChevronRight } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";

interface Props {
  onBack: () => void;
  onOpen: (slug: string) => void;
  language: string;
}

interface Sola {
  id: string;
  slug: string;
  latin: string;
  name_en: string; name_es: string; name_pt: string;
  translation_en: string; translation_es: string; translation_pt: string;
}

export function SolasListScreen({ onBack, onOpen, language }: Props) {
  const [rows, setRows] = useState<Sola[]>([]);

  useEffect(() => {
    supabase.from("solas").select("*").order("order_index").then(({ data }) => {
      setRows((data as Sola[]) || []);
    });
  }, []);

  const pick = (row: any, field: string) => row[`${field}_${language}`] || row[`${field}_en`];

  return (
    <SimpleScreen
      title={language === "es" ? "Los Cinco Solas" : language === "pt" ? "Os Cinco Solas" : "The Five Solas"}
      subtitle={language === "es" ? "Las cinco doctrinas de la Reforma Protestante." : language === "pt" ? "As cinco doutrinas da Reforma Protestante." : "The five doctrines of the Protestant Reformation."}
      icon={<Landmark className="w-6 h-6" />}
      onBack={onBack}
    >
      <div className="space-y-3">
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpen(r.slug)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-orange-500/20 bg-zinc-950/60 hover:bg-orange-500/5 text-left"
          >
            <div className="flex-1">
              <div className="text-orange-400 font-black text-lg">{r.latin}</div>
              <div className="text-zinc-300 text-sm">{pick(r, "translation")}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </button>
        ))}
      </div>
    </SimpleScreen>
  );
}