import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  t: (en: string, es: string) => string;
}

export function EventsScreen({ t }: EventsScreenProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
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
          title: t("Error", "Error"),
          description: t("You must be signed in to RSVP", "Debes iniciar sesión para confirmar asistencia"),
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
        toast({
          title: t("RSVP cancelled", "Asistencia cancelada"),
        });
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id });

        if (error) throw error;
        setRsvps((prev) => new Set(prev).add(eventId));
        toast({
          title: t("RSVP confirmed!", "¡Asistencia confirmada!"),
        });
      }

      loadEvents();
    } catch (error) {
      console.error("Error with RSVP:", error);
      toast({
        title: t("Error", "Error"),
        description: t("Failed to update RSVP", "No se pudo actualizar la asistencia"),
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
        <Calendar className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">
          {t("Upcoming Events", "Próximos Eventos")}
        </h1>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            {t("No events scheduled", "No hay eventos programados")}
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full md:w-48 h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">{event.title}</h3>
                  
                  {event.description && (
                    <p className="text-muted-foreground">{event.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(event.event_date).toLocaleString()}</span>
                    </div>

                    {event.is_online ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-primary" />
                        <span>{t("Online Event", "Evento en Línea")}</span>
                      </div>
                    ) : event.location ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      <span>
                        {event.rsvp_count} {t("attending", "asistiendo")}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRSVP(event.id)}
                    variant={rsvps.has(event.id) ? "secondary" : "default"}
                  >
                    {rsvps.has(event.id)
                      ? t("Cancel RSVP", "Cancelar Asistencia")
                      : t("RSVP", "Confirmar Asistencia")}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
