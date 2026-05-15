import React, { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  MessageSquarePlus,
  Users,
  Flame,
  Mic,
  Video,
  Image as ImageIcon,
  X,
  ArrowLeft,
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
  ];

  if (view === "video") return <VideoCallScreen t={t} onBack={() => setView("home")} />;
  if (view === "meetings") return <MeetingsScreen t={t} onBack={() => setView("home")} />;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[26rem] h-[26rem] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-background/70 border-b border-border/40">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center hover:bg-card/50 transition"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-[22px] font-semibold tracking-tight truncate">Prayer &amp; Fire</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card/40 hover:bg-card/70 border border-border/40 transition"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button
              className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card/40 hover:bg-card/70 border border-border/40 transition"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Search field */}
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages, people, rooms"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-card/50 border border-border/50 backdrop-blur text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
        </div>
      </header>

      {/* Message list area (empty premium state) */}
      <main className="relative z-10 flex-1 px-5 pb-32 pt-8">
        <div className="flex flex-col items-center justify-center text-center pt-16 animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-primary/30 blur-2xl" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 backdrop-blur-xl flex items-center justify-center shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.55)]">
              <MessageSquarePlus className="w-9 h-9 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Your inbox is quiet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[18rem] leading-relaxed">
            Start a conversation, open a prayer room, or host a meeting with your community.
          </p>
        </div>
      </main>

      {/* Floating Action Button — orange glass */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-24 right-5 z-30 w-15 h-15 w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-primary-foreground bg-gradient-to-br from-primary to-primary/80 border border-primary/40 backdrop-blur-xl shadow-[0_18px_50px_-10px_hsl(var(--primary)/0.7)] transition-all active:scale-95 hover:scale-[1.04]"
        aria-label="New action"
      >
        <Plus className="w-6 h-6" strokeWidth={2.4} />
      </button>

      {/* Premium Glass Action Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center animate-fade-in"
          onClick={closeMenu}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative w-full max-w-xl mx-2 mb-3 rounded-3xl border border-white/10 bg-card/70 backdrop-blur-2xl shadow-[0_-20px_80px_-10px_rgba(0,0,0,0.7)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scale-in 0.22s ease-out, fade-in 0.22s ease-out" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-foreground/20" />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div>
                <h3 className="text-base font-semibold">Quick Actions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose how you want to connect</p>
              </div>
              <button
                onClick={closeMenu}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-background/40 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 pb-5 max-h-[65vh] overflow-y-auto">
              {actions.map((action, idx) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onSelect}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-background/50 active:bg-background/70 transition-colors text-left animate-fade-in"
                  style={{ animationDelay: `${idx * 35}ms`, animationFillMode: "backwards" }}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{action.label}</div>
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
