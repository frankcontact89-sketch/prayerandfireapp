import React, { useMemo, useState } from "react";
import { ArrowLeft, Plus, MessageSquare, Video, Users, Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoCallScreen } from "@/components/VideoCallScreen";
import { MeetingsScreen } from "@/components/MeetingsScreen";

type View = "home" | "messages" | "video" | "contacts" | "meetings";
type Contact = { id: string; name: string; phone?: string };
type Chat = { id: string; title: string; last: string; unread?: number; contactId?: string };

interface ChatScreenProps {
  t: (key: string) => string;
  onBack?: () => void;
}

function CardRow({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card/50 hover:bg-card/80 transition p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-lg font-semibold text-foreground">{title}</div>
      </div>
      <div className="text-primary text-xl">›</div>
    </button>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 flex items-center gap-3 transition ${
        danger
          ? "bg-destructive/10 border-destructive/25 text-destructive hover:bg-destructive/15"
          : "bg-muted/50 border-border text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

export function ChatScreen({ t, onBack }: ChatScreenProps) {
  const [view, setView] = useState<View>("home");

  // Demo data
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "c1", name: "PRAYER & FIRE 🔥" },
    { id: "c2", name: "LÍDERES / P&F 🔥" },
    { id: "c3", name: "DIRECTORIA P&F 🔥" },
    { id: "c4", name: "Emmanuel Frommelt" },
  ]);

  const [chats, setChats] = useState<Chat[]>([
    { id: "ch1", title: "PRAYER & FIRE 🔥", last: "Shalom, amados… 🙏", unread: 71, contactId: "c1" },
    { id: "ch2", title: "LÍDERES / P&F 🔥", last: "Olá liderança… 🔥", unread: 26, contactId: "c2" },
    { id: "ch3", title: "DIRECTORIA P&F 🔥", last: "Con respeto…", unread: 5, contactId: "c3" },
    { id: "ch4", title: "Emmanuel Frommelt", last: "I found it in Instagram…", unread: 0, contactId: "c4" },
  ]);

  // Modals state
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [pickContactOpen, setPickContactOpen] = useState(false);
  const [pickIntent, setPickIntent] = useState<"message" | "edit" | "delete" | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState<"add" | "edit" | "delete" | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [targetContactId, setTargetContactId] = useState<string>("");

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === targetContactId) || null,
    [contacts, targetContactId]
  );

  function openPickContact(intent: "message" | "edit" | "delete") {
    setNewMenuOpen(false);
    setPickIntent(intent);
    setPickContactOpen(true);
  }

  function handleContactPicked(contact: Contact) {
    setPickContactOpen(false);
    if (pickIntent === "message") {
      const existing = chats.find((c) => c.contactId === contact.id);
      if (!existing) {
        setChats((prev) => [
          { id: "ch" + Date.now(), title: contact.name, last: "Nuevo chat", unread: 0, contactId: contact.id },
          ...prev,
        ]);
      }
    } else if (pickIntent === "edit") {
      setTargetContactId(contact.id);
      setContactName(contact.name);
      setContactPhone(contact.phone || "");
      setContactFormOpen("edit");
    } else if (pickIntent === "delete") {
      setTargetContactId(contact.id);
      setContactFormOpen("delete");
    }
    setPickIntent(null);
  }

  function openAddContact() {
    setNewMenuOpen(false);
    setContactFormOpen("add");
    setContactName("");
    setContactPhone("");
  }

  function saveNewContact() {
    const name = contactName.trim();
    if (!name) return;
    const c: Contact = { id: "c" + Date.now(), name, phone: contactPhone.trim() || undefined };
    setContacts((prev) => [c, ...prev]);
    setContactFormOpen(null);
  }

  function saveEditContact() {
    if (!selectedContact) return;
    const name = contactName.trim();
    if (!name) return;
    setContacts((prev) => prev.map((c) => (c.id === selectedContact.id ? { ...c, name, phone: contactPhone.trim() || undefined } : c)));
    setChats((prev) => prev.map((ch) => (ch.contactId === selectedContact.id ? { ...ch, title: name } : ch)));
    setContactFormOpen(null);
  }

  function deleteContactNow() {
    if (!selectedContact) return;
    setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id));
    setChats((prev) => prev.filter((ch) => ch.contactId !== selectedContact.id));
    setTargetContactId("");
    setContactFormOpen(null);
  }

  const topTitle =
    view === "home" ? "Chat" :
    view === "messages" ? "Messages" :
    view === "video" ? "Video Call" :
    view === "contacts" ? "Contacts" : "Meetings";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "home" && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setView("home")}
                className="w-10 h-10 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Prayer & Fire</div>
              <div className="text-lg font-bold text-foreground">{topTitle}</div>
            </div>
          </div>

          {view === "messages" && (
            <Button onClick={() => setNewMenuOpen(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
        {view === "home" && (
          <div className="space-y-3">
            <CardRow icon={MessageSquare} title="Messages" onClick={() => setView("messages")} />
            <CardRow icon={Video} title="Video Call" onClick={() => setView("video")} />
            <CardRow icon={Users} title="Contacts" onClick={() => setView("contacts")} />
            <CardRow icon={Calendar} title="Meetings" onClick={() => setView("meetings")} />
          </div>
        )}

        {view === "messages" && (
          <div className="space-y-3">
            {chats.map((c) => (
              <Card
                key={c.id}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition"
              >
                <div>
                  <div className="font-semibold text-foreground">{c.title}</div>
                  <div className="text-sm text-muted-foreground">{c.last}</div>
                </div>
                {c.unread ? (
                  <div className="px-2 py-1 rounded-full bg-primary text-primary-foreground font-black text-xs">
                    {c.unread}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}

        {view === "video" && (
          <VideoCallScreen t={t} onBack={() => setView("home")} />
        )}

        {view === "contacts" && (
          <div className="space-y-3">
            {contacts.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="font-semibold text-foreground">{c.name}</div>
                {c.phone && <div className="text-sm text-muted-foreground">{c.phone}</div>}
              </Card>
            ))}
          </div>
        )}

        {view === "meetings" && (
          <MeetingsScreen t={t} onBack={() => setView("home")} />
        )}
      </div>

      {/* +New Menu Modal */}
      <Dialog open={newMenuOpen} onOpenChange={setNewMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>+ New</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <ActionButton label="Nuevo mensaje" icon={MessageSquare} onClick={() => openPickContact("message")} />
            <ActionButton label="Nuevo contacto" icon={Users} onClick={openAddContact} />
            <ActionButton label="Editar contacto" icon={Pencil} onClick={() => openPickContact("edit")} />
            <ActionButton label="Borrar contacto" icon={Trash2} danger onClick={() => openPickContact("delete")} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pick Contact Modal */}
      <Dialog open={pickContactOpen} onOpenChange={setPickContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona un contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-auto">
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left rounded-xl border border-border bg-muted/50 hover:bg-muted p-3 transition"
                onClick={() => handleContactPicked(c)}
              >
                <div className="font-semibold text-foreground">{c.name}</div>
                {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={contactFormOpen === "add"} onOpenChange={() => setContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre"
            />
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
            <Button onClick={saveNewContact} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={contactFormOpen === "edit"} onOpenChange={() => setContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre"
            />
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
            <Button onClick={saveEditContact} className="w-full">
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Modal */}
      <Dialog open={contactFormOpen === "delete"} onOpenChange={() => setContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-muted-foreground">
              ¿Borrar a <span className="font-bold text-foreground">{selectedContact?.name ?? "este contacto"}</span>?
              <div className="text-xs mt-1">También se eliminarán sus chats.</div>
            </div>
            <Button onClick={deleteContactNow} variant="destructive" className="w-full">
              Borrar
            </Button>
            <Button onClick={() => setContactFormOpen(null)} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
