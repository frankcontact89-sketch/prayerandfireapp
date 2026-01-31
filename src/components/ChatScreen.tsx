import React, { useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, Video, Users, Calendar, Camera, Phone, Plus, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { VideoCallScreen } from "@/components/VideoCallScreen";

type View = "hub" | "messages" | "video" | "contacts" | "meetings";

type Contact = {
  id: string;
  name: string;
  subtitle?: string;
};

type ChatThread = {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  unread?: number;
};

interface ChatScreenProps {
  t: (key: string) => string;
  onBack?: () => void;
}

export function ChatScreen({ t, onBack }: ChatScreenProps) {
  const [view, setView] = useState<View>("hub");

  const threads: ChatThread[] = useMemo(
    () => [
      {
        id: "pf-global",
        title: "🔥 PRAYER & FIRE 🔥",
        lastMessage: "Shalom, amados… 🙏",
        time: "10:35",
        unread: 71,
      },
      {
        id: "leaders",
        title: "LÍDERES / P&F 🔥",
        lastMessage: "Olá liderança… 🔥",
        time: "09:55",
        unread: 26,
      },
      {
        id: "board",
        title: "DIRECTORIA P&F 🔥",
        lastMessage: "Con respeto…",
        time: "09:54",
        unread: 5,
      },
      {
        id: "emmanuel",
        title: "Emmanuel Frommelt",
        lastMessage: "I found it in Instagram…",
        time: "09:56",
      },
    ],
    []
  );

  const contacts: Contact[] = useMemo(
    () => [
      { id: "c1", name: "Emmanuel Frommelt", subtitle: "Europe • Football" },
      { id: "c2", name: "Débora Eliseu", subtitle: "Angola • Prayer Team" },
      { id: "c3", name: "Silvia Santos", subtitle: "Leadership" },
      { id: "c4", name: "Zoraya Matins", subtitle: "English Group" },
    ],
    []
  );

  const ActionCard = ({ title, subtitle, icon: Icon, onClick }: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card/50 p-4 flex gap-3 items-center cursor-pointer shadow-lg hover:bg-card/80 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl grid place-items-center bg-primary/10 border border-primary/25">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-base text-foreground">{title}</div>
        <div className="text-muted-foreground text-sm">{subtitle}</div>
      </div>
      <div className="text-primary text-xl pl-2">›</div>
    </button>
  );

  const SectionHeader = ({ title, onBack: goBack, rightAction }: {
    title: string;
    onBack: () => void;
    rightAction?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between gap-3 mb-4">
      <Button
        variant="outline"
        size="icon"
        onClick={goBack}
        className="w-11 h-11 rounded-xl border-border bg-card/50"
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </Button>
      <div className="font-black text-xl text-foreground">{title}</div>
      <div className="min-w-[90px] flex justify-end">
        {rightAction || null}
      </div>
    </div>
  );

  const Pill = ({ text }: { text: string }) => (
    <span className="rounded-full px-3 py-2 border border-primary/30 bg-primary/10 text-primary-foreground/80 text-xs font-bold">
      {text}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 py-4 max-w-3xl w-full mx-auto">
        {view === "hub" && (
          <>
            <h1 className="text-3xl font-black text-foreground mb-2">Chat</h1>
            <p className="text-muted-foreground mb-4">
              Aquí está lo más importante: mensajes, videollamada, contactos y reuniones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActionCard
                title="Messages"
                subtitle="Text • Photos • Videos • Audios"
                icon={MessageSquare}
                onClick={() => setView("messages")}
              />
              <ActionCard
                title="Video Call"
                subtitle="Wi-Fi • 30 min free"
                icon={Video}
                onClick={() => setView("video")}
              />
              <ActionCard
                title="Contacts"
                subtitle="Save & manage contacts"
                icon={Users}
                onClick={() => setView("contacts")}
              />
              <ActionCard
                title="Meetings"
                subtitle="Create & join meetings"
                icon={Calendar}
                onClick={() => setView("meetings")}
              />
            </div>

            <Card className="mt-4 bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="font-bold mb-2 text-foreground">Plan (preview)</div>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                  <li>Gratis: reuniones 30 min (por Wi-Fi).</li>
                  <li>Si se corta, entran de nuevo el mismo día.</li>
                  <li>Para otro día: se crea otra reunión (sin link permanente).</li>
                  <li>Donación $6.99: reuniones sin límite de tiempo.</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {view === "messages" && (
          <>
            <SectionHeader
              title="Messages"
              onBack={() => setView("hub")}
              rightAction={
                <Button size="sm" className="h-10 rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
              }
            />

            <div className="flex gap-2 items-center mb-4">
              <Input
                placeholder="Search chats…"
                className="flex-1 h-12 rounded-xl bg-card/50 border-border"
              />
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border bg-card/50">
                <Camera className="w-5 h-5" />
              </Button>
            </div>

            <Card className="bg-card/50 border-border overflow-hidden">
              {threads.map((thread, idx) => (
                <div
                  key={thread.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                    idx < threads.length - 1 ? "border-b border-border/50" : ""
                  }`}
                  onClick={() => alert(`Open chat: ${thread.title} (mock)`)}
                >
                  <div className="w-11 h-11 rounded-xl grid place-items-center bg-card border border-border text-lg">
                    {thread.title.includes("PRAYER") ? "🔥" : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">{thread.title}</div>
                    <div className="text-muted-foreground text-sm truncate">{thread.lastMessage}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-muted-foreground text-xs">{thread.time}</div>
                    {thread.unread ? (
                      <span className="min-w-[26px] h-[22px] rounded-full bg-primary text-primary-foreground font-black text-xs grid place-items-center px-2">
                        {thread.unread}
                      </span>
                    ) : (
                      <div className="h-[22px]" />
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {view === "video" && (
          <VideoCallScreen t={t} onBack={() => setView("hub")} />
        )}

        {view === "contacts" && (
          <>
            <SectionHeader
              title="Contacts"
              onBack={() => setView("hub")}
              rightAction={
                <Button size="sm" className="h-10 rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              }
            />

            <div className="flex gap-2 items-center mb-4">
              <Input
                placeholder="Search contacts…"
                className="flex-1 h-12 rounded-xl bg-card/50 border-border"
              />
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border bg-card/50">
                <Import className="w-5 h-5" />
              </Button>
            </div>

            <Card className="bg-card/50 border-border overflow-hidden">
              {contacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                    idx < contacts.length - 1 ? "border-b border-border/50" : ""
                  }`}
                  onClick={() => alert(`Open contact: ${contact.name} (mock)`)}
                >
                  <div className="w-11 h-11 rounded-xl grid place-items-center bg-card border border-border text-lg">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">{contact.name}</div>
                    <div className="text-muted-foreground text-sm truncate">{contact.subtitle || "Contact"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl border-border bg-card/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Message ${contact.name} (mock)`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl border-border bg-card/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Call ${contact.name} (mock)`);
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {view === "meetings" && (
          <>
            <SectionHeader title="Meetings" onBack={() => setView("hub")} />

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <h2 className="font-bold text-lg text-foreground mb-2">Meetings (Zoom-style)</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Sin link permanente. Para otro día, se crea otra reunión.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="bg-card/30 border-border p-4">
                    <div className="w-10 h-10 rounded-xl grid place-items-center bg-primary/10 border border-primary/25 mb-3">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-black text-foreground mb-1">Start</div>
                    <div className="text-muted-foreground text-sm mb-3">Start a meeting now</div>
                    <Button className="w-full" onClick={() => alert("Start meeting now (mock)")}>
                      Start Meeting
                    </Button>
                  </Card>

                  <Card className="bg-card/30 border-border p-4">
                    <div className="w-10 h-10 rounded-xl grid place-items-center bg-primary/10 border border-primary/25 mb-3">
                      🔑
                    </div>
                    <div className="font-black text-foreground mb-1">Join</div>
                    <div className="text-muted-foreground text-sm mb-3">Enter meeting code</div>
                    <Input placeholder="Meeting code" className="mb-3 bg-card/50 border-border" />
                    <Button variant="outline" className="w-full" onClick={() => alert("Join meeting (mock)")}>
                      Join
                    </Button>
                  </Card>

                  <Card className="bg-card/30 border-border p-4">
                    <div className="w-10 h-10 rounded-xl grid place-items-center bg-primary/10 border border-primary/25 mb-3">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-black text-foreground mb-1">Schedule</div>
                    <div className="text-muted-foreground text-sm mb-3">Create for another day</div>
                    <Button variant="outline" className="w-full" onClick={() => alert("Schedule meeting (mock)")}>
                      Schedule
                    </Button>
                  </Card>
                </div>

                <Card className="mt-4 bg-card/30 border-border p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/50 text-muted-foreground">
                      <span>Free time</span>
                      <b className="text-foreground">30 minutes</b>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50 text-muted-foreground">
                      <span>Re-join same day</span>
                      <b className="text-foreground">Allowed</b>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/50 text-muted-foreground">
                      <span>Permanent link</span>
                      <b className="text-destructive">No</b>
                    </div>
                    <div className="flex justify-between py-2 text-muted-foreground">
                      <span>$6.99 donor</span>
                      <b className="text-primary">Unlimited</b>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
