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

  // Messages modals state
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [pickContactOpen, setPickContactOpen] = useState(false);
  const [pickIntent, setPickIntent] = useState<"message" | "edit" | "delete" | null>(null);
  const [messageContactFormOpen, setMessageContactFormOpen] = useState<"add" | "edit" | "delete" | null>(null);
  const [messageContactName, setMessageContactName] = useState("");
  const [messageContactPhone, setMessageContactPhone] = useState("");
  const [messageTargetContactId, setMessageTargetContactId] = useState<string>("");

  // Contacts view state
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactFormMode, setContactFormMode] = useState<"add" | "edit">("add");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactActionsOpen, setContactActionsOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);

  const messageSelectedContact = useMemo(
    () => contacts.find((c) => c.id === messageTargetContactId) || null,
    [contacts, messageTargetContactId]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  // Messages functions
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
      setMessageTargetContactId(contact.id);
      setMessageContactName(contact.name);
      setMessageContactPhone(contact.phone || "");
      setMessageContactFormOpen("edit");
    } else if (pickIntent === "delete") {
      setMessageTargetContactId(contact.id);
      setMessageContactFormOpen("delete");
    }
    setPickIntent(null);
  }

  function openAddContactFromMessages() {
    setNewMenuOpen(false);
    setMessageContactFormOpen("add");
    setMessageContactName("");
    setMessageContactPhone("");
  }

  function saveNewContactFromMessages() {
    const name = messageContactName.trim();
    if (!name) return;
    const c: Contact = { id: "c" + Date.now(), name, phone: messageContactPhone.trim() || undefined };
    setContacts((prev) => [c, ...prev]);
    setMessageContactFormOpen(null);
  }

  function saveEditContactFromMessages() {
    if (!messageSelectedContact) return;
    const name = messageContactName.trim();
    if (!name) return;
    setContacts((prev) => prev.map((c) => (c.id === messageSelectedContact.id ? { ...c, name, phone: messageContactPhone.trim() || undefined } : c)));
    setChats((prev) => prev.map((ch) => (ch.contactId === messageSelectedContact.id ? { ...ch, title: name } : ch)));
    setMessageContactFormOpen(null);
  }

  function deleteContactFromMessages() {
    if (!messageSelectedContact) return;
    setContacts((prev) => prev.filter((c) => c.id !== messageSelectedContact.id));
    setChats((prev) => prev.filter((ch) => ch.contactId !== messageSelectedContact.id));
    setMessageTargetContactId("");
    setMessageContactFormOpen(null);
  }

  // Contacts view functions
  function openAddContact() {
    setContactFormMode("add");
    setContactName("");
    setContactPhone("");
    setContactFormOpen(true);
  }

  function openEditContact(contact: Contact) {
    setContactFormMode("edit");
    setSelectedContactId(contact.id);
    setContactName(contact.name);
    setContactPhone(contact.phone || "");
    setContactFormOpen(true);
  }

  function saveContact() {
    const n = contactName.trim();
    if (!n) return;

    if (contactFormMode === "add") {
      const id = "c" + Date.now();
      setContacts((prev) => [{ id, name: n, phone: contactPhone.trim() || undefined }, ...prev]);
    } else {
      if (!selectedContact) return;
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id ? { ...c, name: n, phone: contactPhone.trim() || undefined } : c
        )
      );
      setChats((prev) => prev.map((ch) => (ch.contactId === selectedContact.id ? { ...ch, title: n } : ch)));
    }

    setContactFormOpen(false);
  }

  function askDeleteContact(contact: Contact) {
    setSelectedContactId(contact.id);
    setContactActionsOpen(false);
    setDeleteContactOpen(true);
  }

  function doDeleteContact() {
    if (!selectedContact) return;
    setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id));
    setChats((prev) => prev.filter((ch) => ch.contactId !== selectedContact.id));
    setDeleteContactOpen(false);
    setSelectedContactId("");
  }

  function openContactActions(contact: Contact) {
    setSelectedContactId(contact.id);
    setContactActionsOpen(true);
  }

  function startChatFromContact(contactId: string) {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    const existing = chats.find((c) => c.contactId === contactId);
    if (!existing) {
      setChats((prev) => [
        { id: "ch" + Date.now(), title: contact.name, last: "Nuevo chat", unread: 0, contactId: contact.id },
        ...prev,
      ]);
    }
    setContactActionsOpen(false);
    setView("messages");
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

          {view === "contacts" && (
            <Button onClick={openAddContact} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Add
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
              <button
                key={c.id}
                type="button"
                onClick={() => openContactActions(c)}
                className="w-full text-left rounded-2xl border border-border bg-card/50 hover:bg-card/80 transition p-4"
              >
                <div className="font-semibold text-foreground">{c.name}</div>
                {c.phone && <div className="text-sm text-muted-foreground">{c.phone}</div>}
              </button>
            ))}
          </div>
        )}

        {view === "meetings" && (
          <MeetingsScreen t={t} onBack={() => setView("home")} />
        )}
      </div>

      {/* +New Menu Modal (Messages) */}
      <Dialog open={newMenuOpen} onOpenChange={setNewMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>+ New</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <ActionButton label="Nuevo mensaje" icon={MessageSquare} onClick={() => openPickContact("message")} />
            <ActionButton label="Nuevo contacto" icon={Users} onClick={openAddContactFromMessages} />
            <ActionButton label="Editar contacto" icon={Pencil} onClick={() => openPickContact("edit")} />
            <ActionButton label="Borrar contacto" icon={Trash2} danger onClick={() => openPickContact("delete")} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pick Contact Modal (Messages) */}
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

      {/* Add Contact Modal (Messages) */}
      <Dialog open={messageContactFormOpen === "add"} onOpenChange={() => setMessageContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={messageContactName}
              onChange={(e) => setMessageContactName(e.target.value)}
              placeholder="Nombre"
            />
            <Input
              value={messageContactPhone}
              onChange={(e) => setMessageContactPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
            <Button onClick={saveNewContactFromMessages} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal (Messages) */}
      <Dialog open={messageContactFormOpen === "edit"} onOpenChange={() => setMessageContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={messageContactName}
              onChange={(e) => setMessageContactName(e.target.value)}
              placeholder="Nombre"
            />
            <Input
              value={messageContactPhone}
              onChange={(e) => setMessageContactPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
            <Button onClick={saveEditContactFromMessages} className="w-full">
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Modal (Messages) */}
      <Dialog open={messageContactFormOpen === "delete"} onOpenChange={() => setMessageContactFormOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-muted-foreground">
              ¿Borrar a <span className="font-bold text-foreground">{messageSelectedContact?.name ?? "este contacto"}</span>?
              <div className="text-xs mt-1">También se eliminarán sus chats.</div>
            </div>
            <Button onClick={deleteContactFromMessages} variant="destructive" className="w-full">
              Borrar
            </Button>
            <Button onClick={() => setMessageContactFormOpen(null)} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Actions Modal (Contacts view) */}
      <Dialog open={contactActionsOpen} onOpenChange={setContactActionsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedContact?.name ?? "Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <ActionButton
              label="Message"
              icon={MessageSquare}
              onClick={() => {
                if (selectedContact) startChatFromContact(selectedContact.id);
              }}
            />
            <ActionButton
              label="Edit"
              icon={Pencil}
              onClick={() => {
                if (selectedContact) {
                  setContactActionsOpen(false);
                  openEditContact(selectedContact);
                }
              }}
            />
            <ActionButton
              label="Delete"
              icon={Trash2}
              danger
              onClick={() => {
                if (selectedContact) askDeleteContact(selectedContact);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Contact Form (Contacts view) */}
      <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{contactFormMode === "add" ? "New contact" : "Edit contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name"
            />
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone (optional)"
            />
            <Button onClick={saveContact} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirm (Contacts view) */}
      <Dialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-muted-foreground">
              Delete <span className="font-bold text-foreground">{selectedContact?.name ?? "this contact"}</span>?
              <div className="text-xs mt-1">Chats with this contact will also be removed.</div>
            </div>
            <Button onClick={doDeleteContact} variant="destructive" className="w-full">
              Delete
            </Button>
            <Button onClick={() => setDeleteContactOpen(false)} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}