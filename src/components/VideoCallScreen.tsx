import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Crown, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDonorStatus } from "@/hooks/useDonorStatus";

interface VideoCallScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-full text-sm font-semibold transition",
        "border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/30 text-foreground/85 hover:bg-muted/50 border-border"
      )}
    >
      {children}
    </button>
  );
}

export function VideoCallScreen({ t, onBack }: VideoCallScreenProps) {
  const { isDonor, loading: donorLoading } = useDonorStatus();
  
  const [modeLeader, setModeLeader] = useState(false);
  const [callType, setCallType] = useState<"oneToOne" | "group">("group");

  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");

  const canJoin = useMemo(() => code.trim().length >= 4, [code]);

  function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function startCall() {
    const newCode = generateCode();
    alert(`Reunión iniciada. Código: ${newCode}`);
  }

  function joinCall() {
    alert(`Entrando con código: ${code.trim()}`);
    setJoinOpen(false);
    setCode("");
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/60 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-xl"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="text-sm text-muted-foreground">Prayer & Fire</div>
              <div className="text-lg font-bold">Video Call</div>
            </div>
          </div>

          {/* Leader toggle */}
          <button
            type="button"
            onClick={() => setModeLeader((v) => !v)}
            className={cn(
              "px-3 py-2 rounded-xl border text-sm font-bold transition",
              modeLeader
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-muted/30 border-border text-foreground/80 hover:bg-muted/50"
            )}
            title="Modo líder"
          >
            {modeLeader ? "Líder: ON" : "Líder: OFF"}
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-5">
          {/* Donor status badge */}
          {isDonor && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary flex items-center gap-1">
                  <Infinity className="w-4 h-4" /> Tiempo ilimitado
                </p>
                <p className="text-xs text-muted-foreground">Gracias por tu donación $6.99+</p>
              </div>
            </div>
          )}

          {/* Call type pills */}
          <div className="flex gap-2">
            <Pill active={callType === "oneToOne"} onClick={() => setCallType("oneToOne")}>
              1:1
            </Pill>
            <Pill active={callType === "group"} onClick={() => setCallType("group")}>
              Grupo
            </Pill>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={startCall}
              disabled={!modeLeader}
              className={cn(
                "w-full px-4 py-3 rounded-xl font-black transition flex items-center justify-center gap-2",
                modeLeader
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/30 text-muted-foreground cursor-not-allowed"
              )}
            >
              🎥 Start
            </button>

            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="w-full px-4 py-3 rounded-xl font-black transition bg-muted/30 border border-border text-foreground hover:bg-muted/50 flex items-center justify-center gap-2"
            >
              🔑 Join (con código)
            </button>
          </div>

          {/* Plan info */}
          {!isDonor && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Plan gratuito</p>
              <p>Límite: 30 min. Dona $6.99+ para llamadas sin límite.</p>
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrar con código</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código"
              className="rounded-xl"
            />
            <Button
              onClick={joinCall}
              disabled={!canJoin}
              className="w-full rounded-xl"
            >
              Entrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
