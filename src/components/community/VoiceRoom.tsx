import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Hand, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Small-group WebRTC beta: Realtime broadcasts are signaling only; microphone
// audio flows peer-to-peer. Private Realtime channel policies are required.
type Signal = { from: string; to?: string; kind: "offer" | "answer" | "ice"; data: any };
type Participant = { id: string; name: string; hand?: boolean };
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VoiceRoom({ groupId, name, userId, userName, onClose, language }: {
  groupId: string; name: string; userId: string; userName: string; onClose: () => void; language: string;
}) {
  const [muted, setMuted] = useState(false);
  const [hand, setHand] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const stream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const audioNodes = useRef(new Map<string, HTMLAudioElement>());
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const iceQueues = useRef(new Map<string, RTCIceCandidateInit[]>());
  const alive = useRef(true);
  const connecting = useRef(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const handRef = useRef(false);
  const labels = language === "es"
    ? { connecting: "Conectando…", connected: "Conectado", you: "Tú", title: "Sala de oración", mute: "Silenciar", unmute: "Activar micrófono", leave: "Salir", raised: "Mano levantada", hand: "Levantar la mano", beta: "Beta · audio en vivo", participants: "Participantes", retry: "Reintentar conexión", failure: "No se pudo conectar. Comprueba tu conexión y los permisos de la sala." }
    : language === "pt"
    ? { connecting: "Conectando…", connected: "Conectado", you: "Você", title: "Sala de oração", mute: "Silenciar", unmute: "Ativar microfone", leave: "Sair", raised: "Mão levantada", hand: "Levantar a mão", beta: "Beta · áudio ao vivo", participants: "Participantes", retry: "Tentar novamente", failure: "Não foi possível conectar. Verifique a conexão e as permissões da sala." }
    : { connecting: "Connecting…", connected: "Connected", you: "You", title: "Prayer room", mute: "Mute", unmute: "Unmute", leave: "Leave", raised: "Hand raised", hand: "Raise hand", beta: "Beta · live audio", participants: "Participants", retry: "Retry connection", failure: "Could not connect. Check your connection and room permissions." };

  const disposePeer = useCallback((id: string) => {
    peers.current.get(id)?.close(); peers.current.delete(id);
    const node = audioNodes.current.get(id);
    if (node) { node.pause(); node.srcObject = null; node.remove(); }
    audioNodes.current.delete(id);
    iceQueues.current.delete(id);
  }, []);

  const send = useCallback(async (signal: Signal) => {
    await channel.current?.send({ type: "broadcast", event: "rtc", payload: signal });
  }, []);

  const getPeer = useCallback((id: string): RTCPeerConnection => {
    const existing = peers.current.get(id);
    if (existing) return existing;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    stream.current?.getTracks().forEach(track => pc.addTrack(track, stream.current!));
    pc.onicecandidate = event => {
      if (event.candidate) void send({ from: userId, to: id, kind: "ice", data: event.candidate.toJSON() });
    };
    pc.ontrack = event => {
      let el = audioNodes.current.get(id);
      if (!el) { el = document.createElement("audio"); el.autoplay = true; el.style.display = "none"; document.body.appendChild(el); audioNodes.current.set(id, el); }
      el.srcObject = event.streams[0];
      void el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setStatus(language === "es" ? "Falló el audio con un participante. Reintenta la conexión." : language === "pt" ? "Falha no áudio com um participante. Tente novamente." : "Audio connection to a participant failed. Please retry.");
        setFailed(true);
      }
    };
    peers.current.set(id, pc);
    return pc;
  }, [send, userId, language]);

  const flushIce = useCallback(async (id: string) => {
    const pc = peers.current.get(id);
    if (!pc?.remoteDescription) return;
    const pending = iceQueues.current.get(id) || [];
    iceQueues.current.delete(id);
    for (const candidate of pending) await pc.addIceCandidate(candidate).catch(() => {});
  }, []);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    const start = async () => {
      if (connecting.current) return;
      connecting.current = true;
      setFailed(false);
      setConnected(false);
      setParticipants([]);
      setAudioBlocked(false);
      setMuted(false);
      setHand(false);
      handRef.current = false;
      setStatus(labels.connecting);
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("Live audio is not supported on this device");
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
        if (cancelled) { mic.getTracks().forEach(t => t.stop()); return; }
        stream.current = mic;
        const ch = supabase.channel(`voice-room:${groupId}`, {
          config: { private: true, broadcast: { self: false }, presence: { key: userId } },
        });
        channel.current = ch;
        ch.on("broadcast", { event: "rtc" }, async ({ payload }) => {
          const msg = payload as Signal;
          if (msg.to && msg.to !== userId || msg.from === userId) return;
          try {
            const pc = getPeer(msg.from);
            if (msg.kind === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await flushIce(msg.from);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await send({ from: userId, to: msg.from, kind: "answer", data: answer });
            } else if (msg.kind === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await flushIce(msg.from);
            } else if (msg.kind === "ice") {
              if (pc.remoteDescription) await pc.addIceCandidate(msg.data);
              else iceQueues.current.set(msg.from, [...(iceQueues.current.get(msg.from) || []), msg.data]);
            }
          } catch { if (alive.current) { setStatus(language === "es" ? "No se pudo conectar con un participante." : language === "pt" ? "Não foi possível conectar a um participante." : "Could not connect to a participant"); setFailed(true); } }
        });
        ch.on("presence", { event: "sync" }, () => {
          const state = ch.presenceState();
          const people = Object.entries(state).filter(([id]) => id !== userId).map(([id, values]) => ({ id, name: (values[0] as any)?.name || "Member", hand: !!(values[0] as any)?.hand }));
          setParticipants([{ id: userId, name: userName }, ...people]);
          for (const id of peers.current.keys()) if (!people.some(p => p.id === id)) disposePeer(id);
          // Only the lexicographically smaller id initiates each peer connection.
          for (const p of people) if (userId < p.id && !peers.current.has(p.id)) {
            const pc = getPeer(p.id);
            void (async () => {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await send({ from: userId, to: p.id, kind: "offer", data: offer });
            })().catch(() => { setStatus(language === "es" ? "No se pudo iniciar el audio." : language === "pt" ? "Não foi possível iniciar o áudio." : "Failed to initiate audio"); setFailed(true); });
          }
        });
        ch.subscribe(async state => {
          if (cancelled) return;
          if (state === "SUBSCRIBED") {
            const presenceStatus = await ch.track({ name: userName, hand: handRef.current });
            if (presenceStatus !== "ok") { setConnected(false); setStatus(labels.failure); setFailed(true); }
            else { setConnected(true); setStatus(labels.connected); }
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
            setConnected(false);
            setStatus(labels.failure);
            setFailed(true);
          }
        });
      } catch (error) {
        if (cancelled) return;
        setStatus(error instanceof Error ? error.message : labels.failure);
        setFailed(true);
      }
    };
    void start();
    return () => {
      cancelled = true;
      alive.current = false;
      void channel.current?.unsubscribe();
      setParticipants([]);
      channel.current = null;
      for (const id of Array.from(peers.current.keys())) disposePeer(id);
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      connecting.current = false;
    };
  }, [groupId, userId, userName, getPeer, flushIce, send, disposePeer, attempt]);

  const toggleHand = () => {
    const next = !handRef.current;
    handRef.current = next;
    setHand(next);
    if (channel.current?.state === "joined") {
      void channel.current.track({ name: userName, hand: next }).catch(() => {});
    }
  };

  const toggleMute = () => {
    const next = !muted;
    stream.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
  };

  return (
    <section role="dialog" aria-modal="true" aria-label={labels.title} className="fixed inset-0 z-[90] flex flex-col bg-[#090709] p-5 text-white" style={{ paddingTop: "max(22px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
      <header className="flex items-center justify-between">
        <div><p className="text-xs uppercase tracking-widest text-[#E5BB70]">{labels.beta}</p><h2 className="mt-1 text-xl font-bold">{name}</h2></div>
        <button onClick={onClose} aria-label={labels.leave} className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><X /></button>
      </header>
      <p role="status" className={`mt-3 text-sm ${connected ? "text-emerald-300" : "text-zinc-400"}`}>{status === "Connecting…" ? labels.connecting : status}</p>
      {audioBlocked && <button type="button" onClick={()=>{void Promise.all(Array.from(audioNodes.current.values()).map(el=>el.play())).then(()=>setAudioBlocked(false)).catch(()=>setAudioBlocked(true));}} className="mt-4 min-h-12 rounded-xl border border-[#E5BB70]/50 bg-[#5C061F] px-5 font-semibold text-[#E5BB70]">{language==="es"?"Activar audio":language==="pt"?"Ativar áudio":"Enable audio"}</button>}
      {failed && <button type="button" onClick={()=>setAttempt(n=>n+1)} className="mt-4 min-h-12 rounded-xl border border-[#E5BB70]/50 bg-[#5C061F] px-5 font-semibold text-[#E5BB70]">{labels.retry}</button>}
      <div className="mt-8 flex items-center gap-2 text-[#E5BB70]"><Users size={19} /><span>{labels.participants} ({participants.length})</span></div>
      <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto">
        {participants.map(p => <div key={p.id} className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-[#E5BB70]/15 bg-[#220D19] p-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#5C061F] text-xl font-bold text-[#E5BB70]">{p.name[0]?.toUpperCase()}</span><span className="mt-2 max-w-full truncate text-sm">{p.name}{p.id === userId ? ` · ${labels.you}` : ""}</span>{(p.id === userId ? hand : !!p.hand) && <span className="mt-1 text-xs text-[#E5BB70]"><Hand className="inline h-3.5 w-3.5 mr-1" />{labels.raised}</span>}</div>)}
      </div>
      <div className="mt-auto flex items-center justify-center gap-4 pt-6">
        <button onClick={toggleMute} disabled={!connected || !stream.current} className={`flex h-16 w-16 items-center justify-center rounded-full ${muted ? "bg-red-950 text-red-200 ring-2 ring-red-400/50" : "bg-[#E5BB70] text-[#20131B]"} disabled:opacity-50`} aria-pressed={!muted} aria-label={muted ? labels.unmute : labels.mute}>{muted ? <MicOff /> : <Mic />}</button>
        <button onClick={toggleHand} disabled={!connected} aria-pressed={hand} className={`flex h-16 w-16 items-center justify-center rounded-full ${hand ? "bg-[#E5BB70] text-black" : "bg-zinc-800"}`} aria-label={hand ? labels.raised : labels.hand}><Hand /></button>
        <button onClick={onClose} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600" aria-label={labels.leave}><PhoneOff /></button>
      </div>
    </section>
  );
}
