import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  MessageSquarePlus,
  Users,
  Flame,
  Mic,
  Video,
  Image as ImageIcon,
  Megaphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCallScreen } from "@/components/VideoCallScreen";
import { MeetingsScreen } from "@/components/MeetingsScreen";

type View = "home" | "video" | "meetings";

interface ChatScreenProps {
  t: (key: string) => string;
  onBack?: () => void;
}

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  onSelect: () => void;
}

export function ChatScreen({ t, onBack }: ChatScreenProps) {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const actions: QuickAction[] = [
    { id: "new-chat", icon: MessageSquarePlus, label: "New Chat", description: "Start a private conversation", onSelect: closeMenu },
    { id: "group", icon: Users, label: "Create Group", description: "Invite people to a shared space", onSelect: closeMenu },
    { id: "prayer", icon: Flame, label: "Prayer Room", description: "Gather in real-time prayer", onSelect: closeMenu },
    { id: "voice", icon: Mic, label: "Voice Room", description: "Open a live audio room", onSelect: closeMenu },
    { id: "meeting", icon: Video, label: "Start Meeting", description: "Begin a video meeting", onSelect: () => { closeMenu(); setView("meetings"); } },
    { id: "media", icon: ImageIcon, label: "Share Media", description: "Send photos or files", onSelect: closeMenu },
    { id: "announce", icon: Megaphone, label: "Announcements", description: "Broadcast to your community", onSelect: closeMenu },
  ];

  if (view === "video") return <VideoCallScreen t={t} onBack={() => setView("home")} />;
  if (view === "meetings") return <MeetingsScreen t={t} onBack={() => setView("home")} />;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="w-10 h-10 rounded-full hover:bg-card/60"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Prayer & Fire Network</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full hover:bg-card/60"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="mt-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-11 pl-11 pr-4 rounded-full bg-card/60 border border-border/60 backdrop-blur text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>
      </header>

      {/* Empty / clean message list state */}
      <main className="relative z-10 flex-1 px-5 pb-32">
        <div className="h-full flex flex-col items-center justify-center text-center pt-16">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-5 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.4)]">
            <MessageSquarePlus className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-lg font-medium text-foreground">No conversations yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Tap the button below to start a chat, open a prayer room, or begin a meeting.
          </p>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-8 right-6 z-30 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.6)] flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
        aria-label="New action"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Action Sheet */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center animate-fade-in"
          onClick={closeMenu}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl mx-2 mb-2 rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl shadow-2xl animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fade-in 0.25s ease-out, scale-in 0.2s ease-out" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Quick Actions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose how you want to connect</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMenu}
                className="w-9 h-9 rounded-full hover:bg-background/60"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-3 pb-4 max-h-[70vh] overflow-y-auto">
              {actions.map((action, idx) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onSelect}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-background/60 active:bg-background/80 transition-colors text-left group"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{action.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </div>
  );
}
