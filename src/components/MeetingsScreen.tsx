import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Video, Users, MessageSquare, Link2, PhoneOff, Mic, MicOff, Camera, CameraOff, SwitchCamera, Hand, Copy, Flame, Crown, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDonorStatus } from "@/hooks/useDonorStatus";

type CallType = "oneToOne" | "group";

type Participant = {
  id: string;
  name: string;
  isHost?: boolean;
  micOn?: boolean;
  camOn?: boolean;
  handRaised?: boolean;
};

interface MeetingsScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function MeetingsScreen({ t, onBack }: MeetingsScreenProps) {
  const { isDonor, loading: donorLoading } = useDonorStatus();
  
  const [isLeader, setIsLeader] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<CallType>("group");

  // Authorization code
  const [meetingCodeInput, setMeetingCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // In-call controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [usingFrontCam, setUsingFrontCam] = useState(true);
  const [handRaised, setHandRaised] = useState(false);

  // Panels
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { id: string; from: string; text: string; ts: number }[]
  >([
    {
      id: "m1",
      from: "Prayer & Fire",
      text: "Acceso solo con código (para personas autorizadas).",
      ts: Date.now(),
    },
  ]);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "p1", name: "Tú", isHost: true, micOn: true, camOn: true },
  ]);

  // Keep local participant in sync
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "p1" ? { ...p, micOn, camOn, handRaised } : p
      )
    );
  }, [micOn, camOn, handRaised]);

  const canJoin = useMemo(
    () => meetingCodeInput.trim().length >= 4,
    [meetingCodeInput]
  );

  function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function leaderCreateCode() {
    const code = generateCode();
    setActiveCode(code);
    setMessages((prev) => [
      ...prev,
      {
        id: "sys-code-" + Date.now(),
        from: "Sistema",
        text: `Código creado: ${code}`,
        ts: Date.now(),
      },
    ]);
    setShareOpen(true);
  }

  function startMeetingAsLeader() {
    if (!isLeader) return;
    const code = activeCode ?? generateCode();
    setActiveCode(code);
    setInCall(true);
    setMicOn(true);
    setCamOn(true);
    setUsingFrontCam(true);
    setHandRaised(false);

    setParticipants([
      { id: "p1", name: "Tú", isHost: true, micOn: true, camOn: true },
      { id: "p2", name: "Invitado", micOn: true, camOn: false },
    ]);

    setMessages((prev) => [
      ...prev,
      {
        id: "sys-start-" + Date.now(),
        from: "Sistema",
        text: `Reunión iniciada. Código: ${code}`,
        ts: Date.now(),
      },
    ]);
  }

  function joinMeetingAsGuest() {
    const code = meetingCodeInput.trim();
    setActiveCode(code);
    setInCall(true);
    setMicOn(true);
    setCamOn(true);
    setUsingFrontCam(true);
    setHandRaised(false);

    setParticipants([
      { id: "p1", name: "Tú", isHost: false, micOn: true, camOn: true },
      { id: "p2", name: "Líder", isHost: true, micOn: true, camOn: true },
    ]);

    setMessages((prev) => [
      ...prev,
      {
        id: "sys-join-" + Date.now(),
        from: "Sistema",
        text: `Te uniste con el código: ${code}`,
        ts: Date.now(),
      },
    ]);
  }

  function hangUp() {
    setInCall(false);
    setParticipantsOpen(false);
    setChatOpen(false);
    setShareOpen(false);

    setMessages((prev) => [
      ...prev,
      {
        id: "sys-end-" + Date.now(),
        from: "Sistema",
        text: "Reunión finalizada.",
        ts: Date.now(),
      },
    ]);
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: "u-" + Date.now(), from: "Tú", text, ts: Date.now() },
    ]);
    setChatInput("");
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessages((prev) => [
        ...prev,
        {
          id: "sys-copy-" + Date.now(),
          from: "Sistema",
          text: "Copiado.",
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "sys-copyfail-" + Date.now(),
          from: "Sistema",
          text: "No se pudo copiar. Copia el código manualmente.",
          ts: Date.now(),
        },
      ]);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">
            {inCall ? "Reunión" : "Meetings"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {inCall ? `Código: ${activeCode}` : "Acceso por código"}
          </p>
        </div>
        {inCall && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setParticipantsOpen(true)}
              className="gap-1"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Gente</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen(true)}
              className="gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="gap-1"
            >
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Código</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {!inCall ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Reuniones</CardTitle>
                <CardDescription>
                  Solo personas autorizadas pueden entrar usando un código.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Leader toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                  <div>
                    <p className="font-semibold text-foreground">Modo líder</p>
                    <p className="text-xs text-muted-foreground">
                      Solo líderes pueden crear códigos e iniciar reuniones.
                    </p>
                  </div>
                  <Switch
                    checked={isLeader}
                    onCheckedChange={setIsLeader}
                  />
                </div>

                {/* Call type */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tipo</p>
                  <div className="flex gap-2">
                    <Button
                      variant={callType === "oneToOne" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCallType("oneToOne")}
                      className={callType === "oneToOne" ? "bg-primary text-primary-foreground" : ""}
                    >
                      1:1
                    </Button>
                    <Button
                      variant={callType === "group" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCallType("group")}
                      className={callType === "group" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Grupo
                    </Button>
                  </div>
                </div>

                {/* Leader actions */}
                {isLeader ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-border bg-muted/30">
                      <p className="text-xs text-muted-foreground">Código de acceso</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xl font-black tracking-wider text-foreground">
                          {activeCode ?? "—"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={leaderCreateCode}
                        >
                          Crear
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Comparte el código solo con personas autorizadas.
                      </p>
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={startMeetingAsLeader}
                      disabled={!activeCode}
                    >
                      <Video className="w-4 h-4" />
                      Iniciar reunión
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setShareOpen(true)}
                      disabled={!activeCode}
                    >
                      <Link2 className="w-4 h-4" />
                      Compartir código
                    </Button>
                  </div>
                ) : (
                  /* Guest join */
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-border bg-muted/30">
                      <p className="text-sm font-semibold text-foreground">Entrar con código</p>
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={meetingCodeInput}
                          onChange={(e) => setMeetingCodeInput(e.target.value)}
                          placeholder="Código"
                          className="flex-1"
                        />
                        <Button
                          onClick={joinMeetingAsGuest}
                          disabled={!canJoin}
                        >
                          Entrar
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        Si no tienes código, pide acceso a un líder.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              {isDonor ? (
                <span className="text-primary">✓ Reuniones sin límite de tiempo</span>
              ) : (
                "Gratis • Acceso por código • Sin link público"
              )}
            </p>
          </>
        ) : (
          /* In-call view */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reunión en curso</CardTitle>
                {isDonor && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Ilimitado
                  </span>
                )}
              </div>
              <CardDescription>
                {activeCode ? `Código: ${activeCode}` : "Acceso por código"}
                {isDonor && " • Sin límite de tiempo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
                {/* Video area */}
                <div className="aspect-video flex items-center justify-center relative bg-background/50">
                  <div className="text-center px-4">
                    <Flame className="w-12 h-12 text-primary mx-auto" />
                    <p className="mt-2 text-lg font-bold text-foreground">Prayer & Fire</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {camOn ? "Cámara encendida" : "Cámara apagada"}
                    </p>
                  </div>

                  {/* Corner badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-foreground">
                      {callType === "group" ? "Grupo" : "1:1"}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2">
                    {handRaised && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary">
                        ✋ Mano levantada
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        micOn
                          ? "bg-muted border-border text-muted-foreground"
                          : "bg-destructive/15 border-destructive/30 text-destructive"
                      )}
                    >
                      {micOn ? "Mic ON" : "Mic OFF"}
                    </span>
                  </div>
                </div>

                {/* Control Bar */}
                <div className="p-3 border-t border-border bg-muted/50">
                  <div className="flex flex-wrap gap-2 justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={micOn ? "default" : "destructive"}
                        size="sm"
                        onClick={() => setMicOn((v) => !v)}
                        className="gap-1"
                      >
                        {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        <span className="hidden sm:inline">{micOn ? "Mic" : "Silencio"}</span>
                      </Button>

                      <Button
                        variant={camOn ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setCamOn((v) => !v)}
                        className="gap-1"
                      >
                        {camOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                        <span className="hidden sm:inline">{camOn ? "Cámara" : "Apagada"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsingFrontCam((v) => !v)}
                        className="gap-1"
                      >
                        <SwitchCamera className="w-4 h-4" />
                        <span className="hidden sm:inline">{usingFrontCam ? "Frontal" : "Trasera"}</span>
                      </Button>

                      <Button
                        variant={handRaised ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHandRaised((v) => !v)}
                        className="gap-1"
                      >
                        <Hand className="w-4 h-4" />
                        <span className="hidden sm:inline">Mano</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParticipantsOpen(true)}
                        className="gap-1"
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Gente</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChatOpen(true)}
                        className="gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Chat</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareOpen(true)}
                        className="gap-1"
                      >
                        <Link2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Código</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={hangUp}
                        className="gap-1"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Salir</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participants Modal */}
      <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participantes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {p.name}
                    {p.isHost && (
                      <span className="ml-2 text-xs text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
                        Líder
                      </span>
                    )}
                    {p.handRaised && (
                      <span className="ml-2 text-xs text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
                        ✋
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.micOn ? "Mic ON" : "Mic OFF"} • {p.camOn ? "Cam ON" : "Cam OFF"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <ScrollArea className="h-64 pr-2">
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-xl border p-3",
                      m.from === "Tú"
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <p className="text-xs text-muted-foreground">{m.from}</p>
                    <p className="text-sm text-foreground">{m.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
              />
              <Button onClick={sendChat}>Enviar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir código</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Código</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-black tracking-wider text-foreground">
                  {activeCode ?? "—"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeCode && copyToClipboard(activeCode)}
                  disabled={!activeCode}
                  className="gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (!activeCode) return;
                const pseudoLink = `${window.location.origin}/meet/${activeCode}`;
                copyToClipboard(pseudoLink);
              }}
              disabled={!activeCode}
            >
              <Link2 className="w-4 h-4" />
              Copiar link (opcional)
            </Button>

            <p className="text-xs text-muted-foreground">
              Consejo: comparte el código por mensaje directo a personas autorizadas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
