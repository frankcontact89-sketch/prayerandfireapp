import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, ArrowLeft, Trash2, MessageSquarePlus, Send, X, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { setLastSeenNotificationsAtNow } from "@/lib/notifications-last-seen";

interface NotificationsScreenProps { t: (key: string) => string; onBack: () => void; }
interface Notification { id: string; title: string; message: string; type: string; link: string | null; is_read: boolean; created_at: string; user_id?: string | null; }

export function NotificationsScreen({ t, onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("[NotificationsScreen] Mounting...");
    
    fetchNotifications();

    const saved = localStorage.getItem('notifications_enabled');
    if (saved !== null) setNotificationsEnabled(JSON.parse(saved));

    // Subscribe to realtime changes for this screen
    const channel = supabase
      .channel('notifications-screen-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        console.log("[NotificationsScreen] New notification received via realtime:", payload.new);
        fetchNotifications();
      })
      .subscribe((status) => {
        console.log("[NotificationsScreen] Realtime subscription status:", status);
      });

    return () => {
      console.log("[NotificationsScreen] Unmounting...");
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[NotificationsScreen] No user, skipping fetch");
      setLoading(false);
      return;
    }

    console.log("[NotificationsScreen] Fetching notifications for user:", user.id);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[NotificationsScreen] Fetch error:", error);
      toast({ title: t("error"), description: t("failedToLoadNotifications"), variant: "destructive" });
    } else {
      console.log("[NotificationsScreen] Fetched notifications:", data?.length || 0, data);
      setNotifications((data || []) as Notification[]);
    }

    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    console.log("[NotificationsScreen] Marking as read:", id);
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      console.error("[NotificationsScreen] markAsRead error:", error);
    }
    // Update local state immediately
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log("[NotificationsScreen] Marking all as read");

    // Mark user-specific notifications as read in the backend
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    // Update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast({ title: t("success"), description: t("allMarkedAsRead") });
  };
  const deleteAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().or(`user_id.eq.${user.id},user_id.is.null`).eq("is_read", true);
    toast({ title: t("success"), description: t("readNotificationsDeleted") });
    fetchNotifications();
  };
  const deleteNotification = async (id: string) => { await supabase.from("notifications").delete().eq("id", id); fetchNotifications(); };
  const openNotification = async (notification: Notification) => { 
    setSelectedNotification(notification); 
    if (!notification.is_read) {
      await markAsRead(notification.id);
      // Also update local last seen to prevent this from appearing unread again
      setLastSeenNotificationsAtNow();
    }
  };
  const toggleNotifications = (enabled: boolean) => { setNotificationsEnabled(enabled); localStorage.setItem('notifications_enabled', JSON.stringify(enabled)); toast({ title: enabled ? t("notificationsEnabled") : t("notificationsDisabled"), description: enabled ? t("youWillReceiveNotifications") : t("notificationsDisabledMsg") }); };
  const sendFeedback = async () => {
    if (!feedbackMessage.trim()) { toast({ title: t("error"), description: t("pleaseEnterFeedback"), variant: "destructive" }); return; }
    setSendingFeedback(true);
    const { error } = await supabase.from("notifications").insert({ title: "User Feedback", message: feedbackMessage.trim(), type: "feedback", user_id: null });
    if (error) toast({ title: t("error"), description: t("failedToSendFeedback"), variant: "destructive" });
    else { toast({ title: t("success"), description: t("thankYouFeedback") }); setFeedbackMessage(""); setFeedbackOpen(false); }
    setSendingFeedback(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (selectedNotification) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={() => setSelectedNotification(null)} className="text-primary hover:text-primary/80 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h2 className="text-lg font-semibold text-foreground">{t("notification")}</h2>
          <button onClick={() => setSelectedNotification(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3"><div className="p-3 rounded-full bg-primary text-primary-foreground"><Flame className="w-6 h-6" /></div><div><h3 className="text-xl font-bold text-foreground">{selectedNotification.title}</h3><p className="text-sm text-muted-foreground">{new Date(selectedNotification.created_at).toLocaleDateString()}</p></div></div>
            <div className="bg-muted/30 rounded-lg p-6"><p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p></div>
            {selectedNotification.link && (
              <Button 
                onClick={() => {
                  // Handle in-app navigation for store links
                  if (selectedNotification.link === '/store' || selectedNotification.link?.startsWith('/store')) {
                    setSelectedNotification(null);
                    // Trigger navigation via parent - for now open external
                    window.location.hash = selectedNotification.link;
                  } else {
                    window.open(selectedNotification.link!, "_blank");
                  }
                }} 
                className="w-full"
              >
                {t("viewMore")}
              </Button>
            )}
            <Button variant="destructive" onClick={() => { deleteNotification(selectedNotification.id); setSelectedNotification(null); }} className="w-full"><Trash2 className="w-4 h-4 mr-2" />{t("deleteNotification")}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="max-w-2xl mx-auto p-6"><div className="text-center text-muted-foreground">{t("loading")}</div></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-primary hover:text-primary/80 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h2 className="text-2xl font-bold text-foreground">🔔 {t("notifications")}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Settings className="w-4 h-4" /></Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t("notificationSettings")}</DialogTitle></DialogHeader>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3"><Flame className={`w-5 h-5 ${notificationsEnabled ? "text-orange-500" : "text-muted-foreground"}`} /><div><p className="font-medium text-foreground">{t("enableNotifications")}</p><p className="text-sm text-muted-foreground">{notificationsEnabled ? t("youWillReceiveNotifications") : t("notificationsDisabledMsg")}</p></div></div>
                <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><MessageSquarePlus className="w-4 h-4 mr-1" />{t("feedback")}</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t("suggestionOrFeedback")}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">{t("feedbackDescription")}</p>
              <Textarea placeholder={t("writeFeedback")} value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} rows={4} maxLength={500} />
              <div className="flex justify-between items-center"><span className="text-xs text-muted-foreground">{feedbackMessage.length}/500</span><Button onClick={sendFeedback} disabled={sendingFeedback || !feedbackMessage.trim()}><Send className="w-4 h-4 mr-1" />{sendingFeedback ? t("sending") : t("send")}</Button></div>
            </DialogContent>
          </Dialog>
          {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllAsRead}>{t("markAllRead")}</Button>}
          {notifications.filter(n => n.is_read).length > 0 && <Button variant="outline" size="sm" onClick={deleteAllRead} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" />{t("deleteRead")}</Button>}
        </div>
      </div>
      {!notificationsEnabled && <Card className="p-4 bg-muted/30 border-dashed"><div className="flex items-center gap-3"><Flame className="w-5 h-5 text-muted-foreground" /><p className="text-muted-foreground">{t("enableInSettings")}</p></div></Card>}
      {notifications.length === 0 ? <div className="text-center p-12 space-y-4"><Flame className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground text-lg">{t("noNotificationsYet")}</p></div> : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`} onClick={() => openNotification(notification)}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full relative ${!notification.is_read ? "bg-orange-500/20 text-orange-500" : "bg-muted text-muted-foreground"}`}><Flame className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2"><h4 className={`font-semibold ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>{notification.title}</h4>{!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}</div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-3"><span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleDateString()}</span><button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium flex items-center gap-1"><Trash2 className="w-3 h-3" />{t("delete")}</button></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
