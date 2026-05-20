import React from "react";
import { BookOpen, ArrowLeft, Mail } from "lucide-react";
import { Button } from "./ui/button";

interface BibleStudyScreenProps {
  onBack: () => void;
  onContact: () => void;
}

export function BibleStudyScreen({ onBack, onContact }: BibleStudyScreenProps) {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Bible Study</h1>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Grow in the Word with the Prayer & Fire community. To receive
        information about upcoming Bible study sessions and resources, send us
        a message and we'll be in touch.
      </p>

      <div className="mt-8">
        <Button onClick={onContact} className="w-full gap-2">
          <Mail className="w-4 h-4" />
          Contact the Ministry
        </Button>
      </div>
    </div>
  );
}