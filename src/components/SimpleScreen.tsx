import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleScreenProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function SimpleScreen({ title, subtitle, onBack, icon, children }: SimpleScreenProps) {
  return (
    <div className="bg-black text-white">
      <div className="max-w-[430px] md:max-w-[680px] lg:max-w-[820px] mx-auto px-5 pt-1 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            {icon && <span className="text-orange-500">{icon}</span>}
            <h1 className="text-2xl font-extrabold">{title}</h1>
          </div>
        </div>
        {subtitle && <p className="text-zinc-400 mb-6 text-sm">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function ComingSoonBlock({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-zinc-950/60 p-8 text-center">
      <div className="text-5xl mb-3">🔥</div>
      <p className="text-zinc-300">{text}</p>
    </div>
  );
}