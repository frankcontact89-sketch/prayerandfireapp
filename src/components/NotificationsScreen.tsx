import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationsScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsScreen({ t, onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      });
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar como leída",
        variant: "destructive",
      });
    } else {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq("is_read", false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      });
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    return type === "info" ? <Bell className="w-5 h-5" /> : <Bell className="w-5 h-5" />;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-muted-foreground">
          {t("loading")}...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              🔔 {t("notifications")}
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center p-12 space-y-4">
          <BellOff className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            No tienes notificaciones
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-all duration-200 hover:shadow-md ${
                !notification.is_read ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  !notification.is_read ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-semibold ${
                      !notification.is_read ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        Marcar como leída
                      </button>
                    )}
                    {notification.link && (
                      <button
                        onClick={() => window.open(notification.link!, "_blank")}
                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        Ver más
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
