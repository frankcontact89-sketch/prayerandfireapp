import React, { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

type SubmissionType = "prayer_request" | "testimony" | "contact";

interface SubmissionFormProps {
  type: SubmissionType;
  title: string;
  description: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  successMessage: string;
  onBack: () => void;
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

export function SubmissionForm({
  type,
  title,
  description,
  messageLabel,
  messagePlaceholder,
  submitLabel,
  successMessage,
  onBack,
}: SubmissionFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast({
        title: "Please check the form",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("submissions")
        .insert({
          type,
          name: parsed.data.name,
          email: parsed.data.email,
          message: parsed.data.message,
          user_id: user?.id ?? null,
        });

      if (error) throw error;

      toast({ title: successMessage });
      setName("");
      setEmail("");
      setMessage("");
      onBack();
    } catch (err) {
      console.error("Submission error:", err);
      toast({
        title: "Submission failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="sf-name">Name</Label>
          <Input
            id="sf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sf-email">Email</Label>
          <Input
            id="sf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={255}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sf-message">{messageLabel}</Label>
          <Textarea
            id="sf-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            rows={6}
            maxLength={2000}
            required
          />
          <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending..." : submitLabel}
        </Button>
      </form>
    </div>
  );
}