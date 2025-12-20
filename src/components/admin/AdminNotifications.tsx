import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminNotifications({ t }: { t: (key: string) => string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    setSending(true);
    console.log("[AdminNotifications] Sending broadcast notification...");
    
    const notificationData = { 
      title: "Prayer & Fire", 
      message: message.trim(), 
      type: "admin_message",
      user_id: null,
      link: null,
      is_read: false
    };
    
    console.log("[AdminNotifications] Insert data:", notificationData);
    
    const { data, error } = await supabase
      .from("notifications")
      .insert([notificationData])
      .select();

    if (error) {
      console.error("[AdminNotifications] Insert error:", error);
      toast({ title: "Error sending notification", description: error.message, variant: "destructive" });
    } else {
      console.log("[AdminNotifications] Insert success:", data);
      toast({ title: "✅ Message sent!", description: "All users will receive this notification." });
      setMessage("");
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📢 Send Broadcast Message</h2>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Message to all users
            </label>
            <Textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
          </div>
          <Button type="submit" className="w-full" disabled={sending || !message.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send to All Users"}
          </Button>
        </form>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          ⚡ This will send a notification titled "Prayer & Fire" to all users instantly.
        </p>
      </div>
    </div>
  );
}
