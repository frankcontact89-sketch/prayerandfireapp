import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  is_online: boolean;
  is_active: boolean;
  rsvp_count?: number;
}

interface Attendee {
  id: string;
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
    email: string;
  };
}

export function AdminEvents({ t }: { t: (en: string, es: string) => string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    is_online: false
  });
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedEventAttendees, setSelectedEventAttendees] = useState<Attendee[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      toast({ title: "Error loading events", variant: "destructive" });
    } else {
      setEvents(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(formData)
        .eq("id", editingEvent.id);

      if (error) {
        toast({ title: "Error updating event", variant: "destructive" });
      } else {
        toast({ title: "Event updated successfully" });
        resetForm();
        fetchEvents();
      }
    } else {
      const { error } = await supabase
        .from("events")
        .insert([formData]);

      if (error) {
        toast({ title: "Error creating event", variant: "destructive" });
      } else {
        toast({ title: "Event created successfully" });
        resetForm();
        fetchEvents();
      }
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      event_date: "",
      location: "",
      is_online: false
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting event", variant: "destructive" });
    } else {
      toast({ title: "Event deleted successfully" });
      fetchEvents();
    }
  };

  const fetchAttendees = async (eventId: string, eventTitle: string) => {
    setSelectedEventTitle(eventTitle);
    
    const { data: rsvps, error } = await supabase
      .from("event_rsvps")
      .select("id, user_id, created_at")
      .eq("event_id", eventId);

    if (error) {
      toast({ title: "Error loading attendees", variant: "destructive" });
      return;
    }

    // Fetch profiles for each RSVP
    const attendeesWithProfiles: Attendee[] = [];
    for (const rsvp of rsvps || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", rsvp.user_id)
        .maybeSingle();
      
      attendeesWithProfiles.push({
        ...rsvp,
        profile: profile || undefined
      });
    }

    setSelectedEventAttendees(attendeesWithProfiles);
    setAttendeesDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("Manage Events", "Administrar Eventos")}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              {t("Add Event", "Agregar Evento")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? t("Edit Event", "Editar Evento") : t("Add Event", "Agregar Evento")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder={t("Title", "Título")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                placeholder={t("Description", "Descripción")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
              <Input
                placeholder={t("Location", "Ubicación")}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_online}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
                />
                <label>{t("Online Event", "Evento En Línea")}</label>
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? t("Update", "Actualizar") : t("Create", "Crear")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Title", "Título")}</TableHead>
              <TableHead>{t("Date", "Fecha")}</TableHead>
              <TableHead>{t("Location", "Ubicación")}</TableHead>
              <TableHead>{t("Type", "Tipo")}</TableHead>
              <TableHead>{t("Actions", "Acciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>{event.location || "-"}</TableCell>
                <TableCell>
                  {event.is_online ? t("Online", "En Línea") : t("In-Person", "Presencial")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(event);
                        setFormData({
                          title: event.title,
                          description: event.description || "",
                          event_date: event.event_date,
                          location: event.location || "",
                          is_online: event.is_online,
                        });
                        setIsOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t("Edit", "Editar")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchAttendees(event.id, event.title)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {t("Attendees", "Asistentes")} ({event.rsvp_count || 0})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("Delete", "Borrar")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Attendees Dialog */}
      <Dialog open={attendeesDialogOpen} onOpenChange={setAttendeesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("Attendees for", "Asistentes para")} {selectedEventTitle}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {selectedEventAttendees.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t("No attendees yet", "Sin asistentes aún")}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedEventAttendees.map((attendee, index) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {attendee.profile?.username || t("Unknown User", "Usuario Desconocido")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {attendee.profile?.email || "-"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

