import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

interface LiveChatScreenProps {
  t: (en: string, es: string) => string;
}

export function LiveChatScreen({ t }: LiveChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t("Error", "Error"),
          description: t("You must be signed in to send messages", "Debes iniciar sesión para enviar mensajes"),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("messages").insert({
        user_id: user.id,
        username: user.email?.split("@")[0] || "Anonymous",
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("Error", "Error"),
        description: t("Failed to send message", "No se pudo enviar el mensaje"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">{t("Loading...", "Cargando...")}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">
          {t("Live Chat", "Chat en Vivo")}
        </h1>
      </div>

      <Card className="p-6">
        <ScrollArea className="h-[500px] pr-4 mb-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-muted p-3 rounded-lg">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-primary">{msg.username}:</span>
                  <span className="text-foreground">{msg.content}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder={t("Type a message...", "Escribe un mensaje...")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
