import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminNotifications({ t }: { t: (en: string, es: string) => string }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("notifications")
      .insert([{ ...formData, user_id: null }]);

    if (error) {
      toast({ title: "Error sending notification", variant: "destructive" });
    } else {
      toast({ title: "Notification sent successfully" });
      setFormData({ title: "", message: "", type: "info" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t("Send Push Notification", "Enviar Notificación Push")}</h2>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={t("Notification Title", "Título de Notificación")}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            placeholder={t("Message", "Mensaje")}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
          />
          <Button type="submit" className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {t("Send to All Users", "Enviar a Todos los Usuarios")}
          </Button>
        </form>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "This will send a notification to all users. Make sure your message is clear and relevant.",
            "Esto enviará una notificación a todos los usuarios. Asegúrate de que tu mensaje sea claro y relevante."
          )}
        </p>
      </div>
    </div>
  );
}
