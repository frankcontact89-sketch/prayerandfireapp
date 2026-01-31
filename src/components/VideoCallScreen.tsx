import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mic, MicOff, Video, VideoOff, Phone, Users, MessageSquare, 
  Link2, Hand, RefreshCw, ArrowLeft, Copy, Wifi, Crown, Infinity
} from "lucide-react";
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

interface VideoCallScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function VideoCallScreen({ t, onBack }: VideoCallScreenProps) {
  const { isDonor, loading: donorLoading } = useDonorStatus();
  
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<CallType>("oneToOne");

  // Pre-call settings - unlimited for donors
  const freeLimitMinutes = isDonor ? null : 30; // null = unlimited
  const [wifiOnly] = useState(true);

  // Session
  const [meetingCode, setMeetingCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // Local states (in-call controls)
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
      text: "Bienvenido. Aquí podrás orar, conectar y reunirte.",
      ts: Date.now(),
    },
  ]);

  // Participants demo list
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "p1", name: "Tú", isHost: true, micOn: true, camOn: true },
    { id: "p2", name: "Invitado", micOn: true, camOn: false },
  ]);

  // Keep participant "Tú" in sync with local state
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "p1"
          ? { ...p, micOn, camOn, handRaised: handRaised }
          : p
      )
    );
  }, [micOn, camOn, handRaised]);

  const canJoin = useMemo(() => meetingCode.trim().length >= 4, [meetingCode]);

  function generateCode() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    return code;
  }

  function startMeetingNow() {
    const code = generateCode();
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

  function joinMeeting() {
    const code = meetingCode.trim();
    setActiveCode(code);
    setInCall(true);
    setMicOn(true);
    setCamOn(true);
    setUsingFrontCam(true);
    setHandRaised(false);

    setMessages((prev) => [
      ...prev,
      {
        id: "sys-join-" + Date.now(),
        from: "Sistema",
        text: `Te uniste a la reunión. Código: ${code}`,
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
        text: "Llamada finalizada.",
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
          text: "Copiado al portapapeles.",
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "sys-copyfail-" + Date.now(),
          from: "Sistema",
          text: "No se pudo copiar. Mantén presionado y copia el código.",
          ts: Date.now(),
        },
      ]);
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-4 pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={inCall ? hangUp : onBack}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {inCall ? "En llamada" : "Video Call"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {inCall ? `Código: ${activeCode}` : `Wi-Fi: ${wifiOnly ? "Sí" : "No"}`}
          </p>
        </div>
        {inCall && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setParticipantsOpen(true)}
              className="rounded-xl"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChatOpen(true)}
              className="rounded-xl"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShareOpen(true)}
              className="rounded-xl"
            >
              <Link2 className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {!inCall ? (
          <>
            {/* Start a call card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Start a call</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Llamadas y reuniones para conectar, orar y compartir.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Call type */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Call type</p>
                  <div className="flex gap-2">
                    <Button
                      variant={callType === "oneToOne" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCallType("oneToOne")}
                      className="rounded-full"
                    >
                      1:1
                    </Button>
                    <Button
                      variant={callType === "group" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCallType("group")}
                      className="rounded-full"
                    >
                      Grupo
                    </Button>
                  </div>
                </div>

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

                {/* Rules */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn(
                    "rounded-xl border p-3",
                    isDonor 
                      ? "border-primary/30 bg-primary/10" 
                      : "border-border bg-muted/30"
                  )}>
                    <p className="text-xs text-muted-foreground">
                      {isDonor ? "Tu plan" : "Límite gratis"}
                    </p>
                    <p className="text-lg font-bold flex items-center gap-1">
                      {isDonor ? (
                        <>
                          <Infinity className="w-4 h-4 text-primary" />
                          <span className="text-primary">Ilimitado</span>
                        </>
                      ) : (
                        `${freeLimitMinutes} min`
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Solo Wi-Fi</p>
                    <p className="text-lg font-bold flex items-center gap-1">
                      <Wifi className="w-4 h-4" />
                      {wifiOnly ? "Sí" : "No"}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={startMeetingNow} className="rounded-xl">
                    <Video className="w-4 h-4 mr-2" />
                    Iniciar video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={startMeetingNow}
                    className="rounded-xl"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Iniciar audio
                  </Button>
                </div>

                {/* Plan info */}
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-sm font-semibold mb-2">Plan</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {isDonor ? (
                      <>
                        <li className="text-primary font-medium">✓ Llamadas sin límite de tiempo</li>
                        <li>• Puedes crear reuniones cuando quieras.</li>
                        <li>• Acceso prioritario a nuevas funciones.</li>
                      </>
                    ) : (
                      <>
                        <li>• Gratis: hasta 30 min (solo Wi-Fi).</li>
                        <li>• Si se corta, puedes volver a entrar el mismo día.</li>
                        <li>• Por seguridad, para otro día se crea una nueva reunión.</li>
                        <li className="text-primary">• Donación $6.99: sin límite de tiempo.</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Join meeting card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Meetings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Inicia una reunión o únete con un código.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={startMeetingNow} className="w-full rounded-xl">
                  <Video className="w-4 h-4 mr-2" />
                  Start Meeting
                </Button>

                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-sm font-semibold mb-2">Join</p>
                  <div className="flex gap-2">
                    <Input
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      placeholder="Meeting code"
                      className="rounded-xl"
                    />
                    <Button
                      onClick={joinMeeting}
                      disabled={!canJoin}
                      className="rounded-xl"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* In-call view */}
            <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Reunión en curso</CardTitle>
                  {isDonor && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Ilimitado
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Código: {activeCode} • {isDonor ? "Sin límite de tiempo" : `Límite: ${freeLimitMinutes} min`}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Video area */}
                <div className="aspect-video bg-black/40 flex items-center justify-center relative border-y border-border">
                  <div className="text-center px-4">
                    <div className="text-5xl mb-2">🔥</div>
                    <p className="text-lg font-bold">Prayer & Fire</p>
                    <p className="text-sm text-muted-foreground">
                      {camOn ? "Cámara encendida (vista previa)" : "Cámara apagada"}
                    </p>
                  </div>

                  {/* Corner badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted/50 border border-border">
                      {callType === "group" ? "Grupo" : "1:1"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted/50 border border-border flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      {wifiOnly ? "Wi-Fi" : "Datos"}
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
                          ? "bg-muted/50 border-border"
                          : "bg-destructive/20 border-destructive/40 text-destructive"
                      )}
                    >
                      {micOn ? "Mic ON" : "Mic OFF"}
                    </span>
                  </div>
                </div>

                {/* Control bar */}
                <div className="p-3 bg-muted/20">
                  <div className="flex flex-wrap gap-2 justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={micOn ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => setMicOn((v) => !v)}
                        className="rounded-xl"
                      >
                        {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        <span className="hidden sm:inline ml-1">
                          {micOn ? "Mic" : "Silencio"}
                        </span>
                      </Button>

                      <Button
                        variant={camOn ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => setCamOn((v) => !v)}
                        className="rounded-xl"
                      >
                        {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        <span className="hidden sm:inline ml-1">
                          {camOn ? "Cámara" : "Apagada"}
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsingFrontCam((v) => !v)}
                        className="rounded-xl"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">
                          {usingFrontCam ? "Frontal" : "Trasera"}
                        </span>
                      </Button>

                      <Button
                        variant={handRaised ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHandRaised((v) => !v)}
                        className="rounded-xl"
                      >
                        <Hand className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Mano</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParticipantsOpen(true)}
                        className="rounded-xl"
                      >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Gente</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChatOpen(true)}
                        className="rounded-xl"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Chat</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareOpen(true)}
                        className="rounded-xl"
                      >
                        <Link2 className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Compartir</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={hangUp}
                        className="rounded-xl"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Colgar</span>
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Consejo: Para reuniones públicas, comparte solo el código con personas invitadas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShareOpen(true)}
                className="rounded-xl"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Compartir código
              </Button>
              <Button
                variant="outline"
                onClick={() => setChatOpen(true)}
                className="rounded-xl"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Abrir chat
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Participants Modal */}
      <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participantes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {participants.length} en la reunión
            </p>
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {p.name}
                      {p.isHost && (
                        <span className="text-xs bg-primary/20 border border-primary/40 text-primary px-2 py-0.5 rounded-full">
                          Host
                        </span>
                      )}
                      {p.handRaised && (
                        <span className="text-xs bg-primary/20 border border-primary/40 text-primary px-2 py-0.5 rounded-full">
                          ✋
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.micOn ? "Mic ON" : "Mic OFF"} • {p.camOn ? "Cam ON" : "Cam OFF"}
                    </p>
                  </div>

                  {participants.find((x) => x.id === "p1")?.isHost && p.id !== "p1" && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setParticipants((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, micOn: false } : x
                            )
                          )
                        }
                      >
                        <MicOff className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setParticipants((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, handRaised: false } : x
                            )
                          )
                        }
                      >
                        <Hand className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="max-h-64 overflow-auto space-y-2 pr-1">
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
                  <p className="text-sm">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje…"
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
              />
              <Button onClick={sendChat} className="rounded-xl">
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Comparte el código solo con personas invitadas.
            </p>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">Meeting code</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-black tracking-wider">
                  {activeCode ?? "—"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!activeCode) return;
                    copyToClipboard(activeCode);
                  }}
                  disabled={!activeCode}
                  className="rounded-xl"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                if (!activeCode) return;
                const pseudoLink = `${window.location.origin}/meet/${activeCode}`;
                copyToClipboard(pseudoLink);
              }}
              disabled={!activeCode}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Copiar link
            </Button>

            <p className="text-xs text-muted-foreground">
              Nota: el link real puede configurarse después. Por ahora el código es suficiente y más seguro.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
