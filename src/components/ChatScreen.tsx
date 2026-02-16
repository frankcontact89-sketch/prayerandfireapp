import React, { useState } from "react";
import { ArrowLeft, MessageSquare, Video, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoCallScreen } from "@/components/VideoCallScreen";
import { MeetingsScreen } from "@/components/MeetingsScreen";

type View = "home" | "messages" | "video" | "contacts" | "meetings";

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

export function ChatScreen({ t, onBack }: ChatScreenProps) {
  const [view, setView] = useState<View>("home");

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
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Messages coming soon.</p>
            </Card>
          </div>
        )}

        {view === "video" && (
          <VideoCallScreen t={t} onBack={() => setView("home")} />
        )}

        {view === "contacts" && (
          <div className="space-y-3">
            <Card className="p-4">
              <p className="text-muted-foreground text-sm">Contacts coming soon.</p>
            </Card>
          </div>
        )}

        {view === "meetings" && (
          <MeetingsScreen t={t} onBack={() => setView("home")} />
        )}
      </div>
    </div>
  );
}
