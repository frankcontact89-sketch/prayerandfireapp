import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar, MapPin, Users, Video, XCircle, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationHaptic } from "@/lib/haptics";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  is_online: boolean;
  rsvp_count: number;
  image_url: string | null;
}

interface EventsScreenProps {
  t: (key: string) => string;
  onNewEvents?: (count: number) => void;
}

export function EventsScreen({ t, onNewEvents }: EventsScreenProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [declines, setDeclines] = useState<Set<string>>(new Set());
  const [reminders, setReminders] = useState<Record<string, NodeJS.Timeout>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    loadUserRSVPs();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRSVPs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setRsvps(new Set(data?.map((r) => r.event_id) || []));
    } catch (error) {
      console.error("Error loading RSVPs:", error);
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t("error"),
          description: t("mustBeSignedIn"),
          variant: "destructive",
        });
        return;
      }

      const isRSVPed = rsvps.has(eventId);

      if (isRSVPed) {
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        setRsvps((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        toast({ title: t("rsvpCancelled") });
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        setRsvps((prev) => new Set(prev).add(eventId));
        toast({ title: t("rsvpConfirmed") });
      }

      setDeclines((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      
      loadEvents();
    } catch (error) {
      console.error("Error with RSVP:", error);
      toast({
        title: t("error"),
        description: t("failedToUpdateRsvp"),
        variant: "destructive",
      });
    }
  };

  const handleDecline = (eventId: string) => {
    setDeclines((prev) => new Set(prev).add(eventId));
    setRsvps((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    toast({
      title: t("responseSaved"),
      description: t("youDeclinedEvent"),
    });
  };

  const handleUndecline = (eventId: string) => {
    setDeclines((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const setReminder = (event: Event) => {
    const eventDate = new Date(event.event_date);
    const now = Date.now();
    
    // Only block if the event has already passed
    if (eventDate.getTime() <= now) {
      toast({
        title: t("error"),
        description: t("eventAlreadyPassed"),
        variant: "destructive",
      });
      return;
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Calculate reminder time: 10 minutes before, or immediately if less than 10 min
    const reminderTime = eventDate.getTime() - 10 * 60 * 1000;
    const delay = Math.max(reminderTime - now, 1000); // At least 1 second delay
    const timeoutId = setTimeout(() => {
      // Trigger notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Prayer & Fire: ${event.title}`, {
          body: t("eventStartingSoon"),
          icon: "/logo-prayer-fire.png",
          requireInteraction: true,
        });
      }
      
      // Vibrate if supported (safe fallback for iPhone)
      notificationHaptic();

      // Show toast notification
      toast({
        title: `🔔 ${event.title}`,
        description: t("eventStartingSoon"),
      });

      // Remove from reminders
      setReminders((prev) => {
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
    }, delay);

    setReminders((prev) => ({ ...prev, [event.id]: timeoutId }));
    
    toast({
      title: t("reminderSet"),
      description: t("reminderSetDescription"),
    });
  };

  const cancelReminder = (eventId: string) => {
    if (reminders[eventId]) {
      clearTimeout(reminders[eventId]);
      setReminders((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
      toast({
        title: t("reminderCancelled"),
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">{t("loading")}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">
          {t("upcomingEvents")}
        </h1>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            {t("noEventsScheduled")}
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full md:w-48 h-48 object-cover rounded-lg" />
                )}
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">{event.title}</h3>
                  {event.description && <p className="text-muted-foreground">{event.description}</p>}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(event.event_date).toLocaleString()}</span>
                    </div>
                    {event.is_online ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-primary" />
                        <span>{t("onlineEvent")}</span>
                      </div>
                    ) : event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!rsvps.has(event.id) && !declines.has(event.id) && (
                      <>
                        <Button onClick={() => handleRSVP(event.id)} variant="default">{t("confirm")}</Button>
                        <Button onClick={() => handleDecline(event.id)} variant="outline" className="flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {t("cantAttend")}
                        </Button>
                      </>
                    )}
                    {rsvps.has(event.id) && (
                      <Button onClick={() => handleRSVP(event.id)} variant="secondary">{t("cancelRsvp")}</Button>
                    )}
                    {declines.has(event.id) && (
                      <Button onClick={() => handleUndecline(event.id)} variant="outline">{t("changeMind")}</Button>
                    )}
                    {reminders[event.id] ? (
                      <Button onClick={() => cancelReminder(event.id)} variant="outline" size="sm" className="flex items-center gap-1">
                        <BellOff className="w-4 h-4" />
                        {t("cancelReminder")}
                      </Button>
                    ) : (
                      <Button onClick={() => setReminder(event)} variant="outline" size="sm" className="flex items-center gap-1">
                        <Bell className="w-4 h-4" />
                        {t("setReminder")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
