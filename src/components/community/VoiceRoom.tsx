import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Mic, MicOff, PhoneOff, Hand, MoreHorizontal, Video, VideoOff, SwitchCamera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Small-group WebRTC beta: Realtime broadcasts are signaling only; microphone
// audio flows peer-to-peer. Private Realtime channel policies are required.
type Signal = { from: string; to: string } & (
  { kind: "offer" | "answer"; data: RTCSessionDescriptionInit } |
  { kind: "ice"; data: RTCIceCandidateInit }
);
type Participant = { id: string; name: string; hand?: boolean; muted?: boolean; video?: boolean };
const REACTIONS = ["🙏", "❤️", "🔥", "👏", "🙌", "👍"];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export default function VoiceRoom({ groupId, name, userId, userName, onClose, language, channelClosed, startWithVideo }: {
  groupId: string; name: string; userId: string; userName: string; onClose: () => void; language: string;
  startWithVideo?: boolean;
  channelClosed: MutableRefObject<Promise<unknown>>;
}) {
  const [muted, setMuted] = useState(true);
  const [hand, setHand] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, { avatar_url: string | null; username: string | null }>>({});
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [reactionMenu, setReactionMenu] = useState(false);
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());
  const [videos, setVideos] = useState<Record<string, MediaStream>>({});
  const [cameraBusy, setCameraBusy] = useState(false);
  const cameraBusyRef = useRef(false);
  const [cameraError, setCameraError] = useState(false);
  const iceServers = useRef(RTC_CONFIG.iceServers);
  const camera = useRef<MediaStreamTrack | null>(null);
  const facing = useRef<"user" | "environment">("user");
  const mutedRef = useRef(true);
  const reactionTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const audioContext = useRef<AudioContext | null>(null);
  const analysers = useRef(new Map<string, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }>());
  const t = (en: string, es: string, pt: string) => language === "es" ? es : language === "pt" ? pt : en;
  const stream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const audioNodes = useRef(new Map<string, HTMLAudioElement>());
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const iceQueues = useRef(new Map<string, RTCIceCandidateInit[]>());
  const offering = useRef(new Set<string>());
  const knownParticipants = useRef(new Set<string>());
  const alive = useRef(true);
  const connecting = useRef(false);
  const generation = useRef(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const handRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const reconnectOnOnline = useRef(false);
  const announced = useRef(false);
  const retryRef = useRef<() => void>(() => {});
  retryRef.current = () => setAttempt(n => n + 1);
  const labels = language === "es"
    ? { connecting: "Conectando…", connected: "Conectado", you: "Tú", title: "Sala de oración", mute: "Silenciar", unmute: "Activar micrófono", leave: "Salir", raised: "Mano levantada", hand: "Levantar la mano", participants: "Participantes", retry: "Reintentar conexión", failure: "No se pudo conectar. Comprueba tu conexión y los permisos de la sala." }
    : language === "pt"
    ? { connecting: "Conectando…", connected: "Conectado", you: "Você", title: "Sala de oração", mute: "Silenciar", unmute: "Ativar microfone", leave: "Sair", raised: "Mão levantada", hand: "Levantar a mão", participants: "Participantes", retry: "Tentar novamente", failure: "Não foi possível conectar. Verifique a conexão e as permissões da sala." }
    : { connecting: "Connecting…", connected: "Connected", you: "You", title: "Prayer room", mute: "Mute", unmute: "Unmute", leave: "Leave", raised: "Hand raised", hand: "Raise hand", participants: "Participants", retry: "Retry connection", failure: "Could not connect. Check your connection and room permissions." };

  const publishPresence = useCallback(() => channel.current?.track({
    name: userName, hand: handRef.current, muted: mutedRef.current, video: Boolean(camera.current),
  }), [userName]);

  const showReaction = useCallback((id: string, emoji: string) => {
    clearTimeout(reactionTimers.current.get(id));
    setReactions(current => ({ ...current, [id]: emoji }));
    reactionTimers.current.set(id, setTimeout(() => {
      reactionTimers.current.delete(id);
      setReactions(current => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }, 3000));
  }, []);

  const analyseAudio = useCallback((id: string, media: MediaStream) => {
    const context = audioContext.current;
    if (!context || !media.getAudioTracks().length) return;
    analysers.current.get(id)?.source.disconnect();
    try {
      const source = context.createMediaStreamSource(media);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysers.current.set(id, { source, analyser });
    } catch { /* Some devices allow playback without an analysis node. */ }
  }, []);

  const participantIds = participants.map(person => person.id).sort().join(",");
  useEffect(() => {
    if (!participantIds) return;
    let active = true;
    void supabase.from("profiles").select("id, avatar_url, username")
      .in("id", participantIds.split(",")).then(({ data }) => {
        if (active && data) setProfiles(Object.fromEntries(data.map(profile => [profile.id, profile])));
      });
    return () => { active = false; };
  }, [participantIds]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = new Set<string>();
      for (const [id, { analyser }] of analysers.current) {
        const samples = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(samples);
        const power = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0);
        if (power / samples.length > 0.002) next.add(id);
      }
      setSpeaking(previous => previous.size === next.size && [...next].every(id => previous.has(id)) ? previous : next);
    }, 180);
    return () => clearInterval(timer);
  }, []);

  const disposePeer = useCallback((id: string) => {
    analysers.current.get(id)?.source.disconnect();
    analysers.current.delete(id);
    setVideos(current => { const next = { ...current }; delete next[id]; return next; });
    peers.current.get(id)?.close(); peers.current.delete(id);
    const node = audioNodes.current.get(id);
    if (node) { node.pause(); node.srcObject = null; node.remove(); }
    audioNodes.current.delete(id);
    iceQueues.current.delete(id);
    offering.current.delete(id);
  }, []);

  const send = useCallback(async (signal: Signal) => {
    await channel.current?.send({ type: "broadcast", event: "rtc", payload: signal });
  }, []);

  const getPeer = useCallback((id: string): RTCPeerConnection => {
    const existing = peers.current.get(id);
    if (existing) return existing;
    const pc = new RTCPeerConnection({ iceServers: iceServers.current });
    stream.current?.getTracks().forEach(track => pc.addTrack(track, stream.current!));
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        console.warn("[voice-room] ICE connection failed", { groupId, peerId: id });
        setFailed(true);
        setStatus(language === "es" ? "No se pudo establecer el audio. Reintenta la conexión." : language === "pt" ? "Não foi possível estabelecer o áudio. Tente novamente." : "Could not establish audio. Retry the connection.");
      }
    };
    pc.onicecandidate = event => {
      if (event.candidate) void send({ from: userId, to: id, kind: "ice", data: event.candidate.toJSON() });
    };
    pc.ontrack = event => {
      if (event.track.kind === "video") {
        setVideos(current => ({ ...current, [id]: new MediaStream([event.track]) }));
        return;
      }
      const remoteAudio = new MediaStream([event.track]);
      analyseAudio(id, remoteAudio);
      let el = audioNodes.current.get(id);
      if (!el) {
        el = document.createElement("audio");
        el.autoplay = true;
        el.setAttribute("playsinline", "");
        // On iOS WKWebView, display:none can prevent remote audio playback.
        // Keep the element visually hidden without removing it from layout.
        Object.assign(el.style, {
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: "0",
          pointerEvents: "none",
        });
        document.body.appendChild(el);
        audioNodes.current.set(id, el);
      }
      el.srcObject = remoteAudio;
      void el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        // A connected peer does not repair a failed room signaling channel.
        // Keep any room-level error visible until the member retries.
        if (channel.current?.state === "joined") {
          setFailed(false);
          setStatus(language === "es" ? "Audio conectado" : language === "pt" ? "Áudio conectado" : "Audio connected");
        }
      } else if (pc.connectionState === "failed") {
        setStatus(language === "es" ? "Falló el audio con un participante. Reintenta la conexión." : language === "pt" ? "Falha no áudio com um participante. Tente novamente." : "Audio connection to a participant failed. Please retry.");
        setFailed(true);
      }
    };
    peers.current.set(id, pc);
    return pc;
  }, [send, userId, language, groupId, analyseAudio]);

  const flushIce = useCallback(async (id: string) => {
    const pc = peers.current.get(id);
    if (!pc?.remoteDescription) return;
    const pending = iceQueues.current.get(id) || [];
    iceQueues.current.delete(id);
    for (const candidate of pending) await pc.addIceCandidate(candidate).catch(() => {});
  }, []);

  // Never leave the microphone transmitting after the user backgrounds the app
  // or switches away from the prayer room. Returning requires another tap.
  useEffect(() => {
    const muteWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        stream.current?.getAudioTracks().forEach(track => { track.enabled = false; });
        mutedRef.current = true;
        setMuted(true);
        void publishPresence();
      }
    };
    document.addEventListener("visibilitychange", muteWhenHidden);
    window.addEventListener("pagehide", muteWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", muteWhenHidden);
      window.removeEventListener("pagehide", muteWhenHidden);
    };
  }, [publishPresence]);

  // Retry once the device regains internet connectivity, rather than requiring
  // the member to close and reopen the prayer room.
  useEffect(() => {
    const retryWhenOnline = () => { if (failed || reconnectOnOnline.current) retryRef.current(); };
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [failed]);

  useEffect(() => {
    const roomPeers = peers.current;
    const roomOffers = offering.current;
    const roomParticipants = knownParticipants.current;
    const roomReactionTimers = reactionTimers.current;
    const roomAnalysers = analysers.current;
    alive.current = true;
    const thisGeneration = ++generation.current;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let subscribeTimer: ReturnType<typeof setTimeout> | null = null;
    const stopSubscribeTimer = () => {
      if (subscribeTimer !== null) clearTimeout(subscribeTimer);
      subscribeTimer = null;
    };
    const start = async () => {
      if (connecting.current) return;
      connecting.current = true;
      reconnectOnOnline.current = false;
      setFailed(false);
      setConnected(false);
      setParticipants([]);
      setAudioBlocked(false);
      mutedRef.current = true;
      setMuted(true);
      setHand(false);
      handRef.current = false;
      setStatus(labels.connecting);
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("Live audio is not supported on this device");
        // Private Realtime channels need the current signed-in member's JWT. Without
        // this, the signaling subscription can fail even when the app UI is logged in.
        const { data: sessionData, error: authError } = await supabase.auth.getSession();
        if (authError || !sessionData.session?.access_token) {
          throw new Error(language === "es" ? "Tu sesión expiró. Inicia sesión de nuevo." : language === "pt" ? "Sua sessão expirou. Entre novamente." : "Your session expired. Please sign in again.");
        }
        // Let a previous listener leave the topic before subscribing again.
        await channelClosed.current;
        await supabase.realtime.setAuth(sessionData.session.access_token);
        if (cancelled || generation.current !== thisGeneration) return;
        iceServers.current = RTC_CONFIG.iceServers;
        const relay = await supabase.functions.invoke<{ iceServers?: RTCIceServer[] }>("community-push", {
          body: { kind: "ice", group_id: groupId }, signal: AbortSignal.timeout(3000),
        }).catch(() => null);
        if (cancelled || generation.current !== thisGeneration) return;
        if (relay?.data?.iceServers?.length) iceServers.current = [...(RTC_CONFIG.iceServers ?? []), ...relay.data.iceServers];
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
        if (cancelled || generation.current !== thisGeneration) { mic.getTracks().forEach(t => t.stop()); return; }
        // Join listening first: do not transmit microphone audio without an explicit tap.
        mic.getAudioTracks().forEach(track => { track.enabled = false; });
        stream.current = mic;
        try {
          audioContext.current = new AudioContext();
          void audioContext.current.resume().catch(() => {});
          analyseAudio(userId, mic);
        } catch { /* Voice playback does not require audio analysis. */ }
        const ch = supabase.channel(`voice-room:${groupId}`, {
          config: { private: true, broadcast: { self: false }, presence: { key: userId } },
        });
        channel.current = ch;
        ch.on("broadcast", { event: "reaction" }, ({ payload }) => {
          if (!cancelled && generation.current === thisGeneration && knownParticipants.current.has(payload?.from) && REACTIONS.includes(payload?.emoji)) {
            showReaction(payload.from, payload.emoji);
          }
        });
        ch.on("broadcast", { event: "rtc" }, async ({ payload }) => {
          if (cancelled || generation.current !== thisGeneration) return;
          const msg = payload as Signal;
          if (!msg || typeof msg.from !== "string" || msg.from === userId || (msg.to && msg.to !== userId) || !knownParticipants.current.has(msg.from)) return;
          try {
            const pc = getPeer(msg.from);
            if (msg.kind === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await flushIce(msg.from);
              const video = pc.getTransceivers().find(item => item.receiver.track.kind === "video");
              if (video) {
                video.direction = "sendrecv";
                await video.sender.replaceTrack(camera.current);
              }
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
          if (cancelled || generation.current !== thisGeneration) return;
          const state = ch.presenceState<{ name?: string; hand?: boolean; muted?: boolean; video?: boolean }>();
          const people = Object.entries(state).filter(([id]) => id !== userId && !id.startsWith("observer:")).map(([id, values]) => ({ id, name: values[0]?.name || "Member", hand: !!values[0]?.hand, muted: values[0]?.muted !== false, video: values[0]?.video === true }));
          roomParticipants.clear();
          for (const person of people) roomParticipants.add(person.id);
          setParticipants([{ id: userId, name: userName }, ...people]);
          if (state[userId]?.length && !announced.current) {
            announced.current = true;
            if (!people.length) void supabase.functions.invoke("community-push", { body: { kind: "call", group_id: groupId } }).catch(() => {});
          }
          for (const id of peers.current.keys()) if (!people.some(p => p.id === id)) disposePeer(id);
          // Only the lexicographically smaller id initiates each peer connection.
          for (const p of people) if (userId < p.id) {
            // ICE may create a peer before presence sync; it still needs an offer.
            const pc = getPeer(p.id);
            if (pc.signalingState !== "stable" || pc.localDescription || offering.current.has(p.id)) continue;
            offering.current.add(p.id);
            void (async () => {
              if (!pc.getTransceivers().some(item => item.receiver.track.kind === "video")) {
                pc.addTransceiver(camera.current ?? "video", { direction: "sendrecv" });
              }
              const offer = await pc.createOffer();
              if (cancelled || pc.signalingState === "closed") return;
              await pc.setLocalDescription(offer);
              await send({ from: userId, to: p.id, kind: "offer", data: offer });
            })().catch(() => { if (!cancelled) { setStatus(language === "es" ? "No se pudo iniciar el audio." : language === "pt" ? "Não foi possível iniciar o áudio." : "Failed to initiate audio"); setFailed(true); } }).finally(() => offering.current.delete(p.id));
          }
        });
        ch.subscribe(async (state, error) => {
          if (cancelled || generation.current !== thisGeneration) return;
          if (state === "SUBSCRIBED") {
            stopSubscribeTimer();
            if (!stream.current) {
              retryRef.current();
              return;
            }
            const presenceStatus = await ch.track({ name: userName, hand: handRef.current, muted: mutedRef.current, video: Boolean(camera.current) });
            if (cancelled) return;
            if (presenceStatus !== "ok") { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setParticipants([]); console.warn("[voice-room] presence tracking failed", { groupId, presenceStatus }); setConnected(false); setStatus(labels.failure); setFailed(true); }
            else if (stream.current?.getAudioTracks().some(track => track.readyState === "live")) { reconnectAttempts.current = 0; setFailed(false); setConnected(true); setStatus(labels.connected); }
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
            stopSubscribeTimer();
            reconnectOnOnline.current = true;
            console.warn("[voice-room] signaling channel unavailable", { groupId, state, error });
            // The WebRTC media connection can remain alive after signaling fails.
            // Immediately stop transmitting and close peer audio connections so
            // a user never unknowingly broadcasts while the UI says disconnected.
            stream.current?.getTracks().forEach(track => track.stop());
            stream.current = null;
            camera.current?.stop();
            camera.current = null;
            setVideos({});
            setParticipants([]);
            setMuted(true);
            for (const peerId of Array.from(peers.current.keys())) disposePeer(peerId);
            setConnected(false);
            setStatus(labels.failure);
            setFailed(true);
            if (!reconnectTimer && reconnectAttempts.current < 2) reconnectTimer = setTimeout(() => {
              if (!cancelled && navigator.onLine) {
                reconnectAttempts.current += 1;
                retryRef.current();
              }
            }, 4000);
          }
        });
        // A missing SUBSCRIBED/CHANNEL_ERROR callback must not leave the room
        // displaying "Connecting…" forever. Offer an explicit retry instead.
        subscribeTimer = setTimeout(() => {
          if (cancelled || generation.current !== thisGeneration || ch.state === "joined") return;
          stream.current?.getTracks().forEach(track => track.stop());
          stream.current = null;
          setParticipants([]);
          setMuted(true);
          setConnected(false);
          setStatus(labels.failure);
          setFailed(true);
        }, 20000);
      } catch (error) {
        stopSubscribeTimer();
        if (cancelled || generation.current !== thisGeneration) return;
        stream.current?.getTracks().forEach(track => track.stop());
        stream.current = null;
        setParticipants([]);
        const reason = error instanceof Error ? error.name : "";
        const micDenied = reason === "NotAllowedError" || reason === "PermissionDeniedError";
        setStatus(micDenied
          ? (language === "es" ? "Permite el acceso al micrófono en Ajustes para entrar a la sala." : language === "pt" ? "Permita o acesso ao microfone nos Ajustes para entrar na sala." : "Allow microphone access in Settings to join the room.")
          : error instanceof Error ? error.message : labels.failure);
        console.error("[voice-room] connection failed", { groupId, reason, error });
        setFailed(true);
      }
    };
    const stopOnOffline = () => {
      reconnectOnOnline.current = true;
      const activeChannel = channel.current;
      generation.current += 1;
      stopSubscribeTimer();
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      camera.current?.stop();
      camera.current = null;
      for (const id of roomPeers.keys()) disposePeer(id);
      if (activeChannel) {
        channel.current = null;
        channelClosed.current = supabase.removeChannel(activeChannel);
      }
      setVideos({});
      setParticipants([]);
      mutedRef.current = true;
      setMuted(true);
      setConnected(false);
      setStatus(labels.failure);
      setFailed(true);
    };
    window.addEventListener("offline", stopOnOffline);
    void start();
    return () => {
      window.removeEventListener("offline", stopOnOffline);
      cancelled = true;
      stopSubscribeTimer();
      clearTimeout(reconnectTimer);
      generation.current++;
      alive.current = false;
      if (channel.current) channelClosed.current = supabase.removeChannel(channel.current);
      setParticipants([]);
      channel.current = null;
      roomOffers.clear();
      roomParticipants.clear();
      for (const id of Array.from(roomPeers.keys())) disposePeer(id);
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      camera.current?.stop();
      camera.current = null;
      setVideos({});
      for (const timer of roomReactionTimers.values()) clearTimeout(timer);
      roomReactionTimers.clear();
      setReactions({});
      roomAnalysers.clear();
      if (audioContext.current) void audioContext.current.close().catch(() => {});
      audioContext.current = null;
      connecting.current = false;
    };
  }, [groupId, userId, userName, getPeer, flushIce, send, disposePeer, attempt, channelClosed, analyseAudio, showReaction, language, labels.connecting, labels.connected, labels.failure]);

  const toggleHand = () => {
    if (!connected) return;
    const next = !handRef.current;
    handRef.current = next;
    setHand(next);
    if (channel.current?.state === "joined") void publishPresence()?.catch(() => {});
  };

  const toggleMute = () => {
    if (!connected || !stream.current || document.visibilityState !== "visible") return;
    const next = !muted;
    stream.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    mutedRef.current = next;
    setMuted(next);
    void audioContext.current?.resume().catch(() => {});
    void publishPresence();
  };

  const changeCamera = useCallback(async (enable: boolean, nextFacing = facing.current) => {
    if (!connected || cameraBusyRef.current) return;
    cameraBusyRef.current = true;
    setCameraBusy(true);
    setCameraError(false);
    const roomGeneration = generation.current;
    let next: MediaStreamTrack | null = null;
    try {
      if (enable) {
        // iOS may require the current camera to be released before switching lenses.
        if (nextFacing !== facing.current) {
          camera.current?.stop();
          camera.current = null;
        }
        next = (await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextFacing }, width: { ideal: 640 }, height: { ideal: 480 } },
        })).getVideoTracks()[0] ?? null;
      }
      if (generation.current !== roomGeneration || channel.current?.state !== "joined") {
        next?.stop();
        return;
      }
      const senders = [...peers.current.values()].flatMap(peer => peer.getTransceivers())
        .filter(item => item.receiver.track.kind === "video").map(item => item.sender);
      await Promise.all(senders.map(sender => sender.replaceTrack(next)));
      if (generation.current !== roomGeneration || channel.current?.state !== "joined") {
        next?.stop();
        return;
      }
      camera.current?.stop();
      camera.current = next;
      facing.current = nextFacing;
      setVideos(current => {
        const updated = { ...current };
        if (next) updated[userId] = new MediaStream([next]);
        else delete updated[userId];
        return updated;
      });
      void publishPresence();
    } catch {
      next?.stop();
      setCameraError(true);
      if (!camera.current) {
        setVideos(current => { const updated = { ...current }; delete updated[userId]; return updated; });
        void publishPresence();
      }
    } finally {
      cameraBusyRef.current = false;
      setCameraBusy(false);
    }
  }, [connected, publishPresence, userId]);

  const autoVideo = useRef(startWithVideo);
  useEffect(() => {
    if (connected && autoVideo.current) {
      autoVideo.current = false;
      void changeCamera(true);
    }
  }, [changeCamera, connected]);

  const videoEnabled = Boolean(videos[userId]);
  const buttonClass = "grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-40 sm:size-14";
  return (
    <section role="dialog" aria-modal="true" aria-label={labels.title}
      className="fixed inset-0 z-[90] flex flex-col bg-background px-4 text-foreground"
      style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{labels.title}</p>
          <h2 className="truncate text-lg font-semibold">{name}</h2>
        </div>
        <div className="flex gap-2">
          {videoEnabled && <button type="button" className={buttonClass} disabled={cameraBusy}
            aria-label={t("Switch camera", "Cambiar cámara", "Alternar câmera")}
            onClick={() => void changeCamera(true, facing.current === "user" ? "environment" : "user")}><SwitchCamera size={19} /></button>}
          <button type="button" className={buttonClass} disabled={!connected || cameraBusy} aria-pressed={videoEnabled}
            aria-label={videoEnabled ? t("Turn camera off", "Apagar cámara", "Desligar câmera") : t("Turn camera on", "Encender cámara", "Ligar câmera")}
            onClick={() => void changeCamera(!videoEnabled)}>{videoEnabled ? <Video size={19} /> : <VideoOff size={19} />}</button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-wrap justify-between gap-x-3 gap-y-1 py-3 text-sm">
        <p role="status" className={connected && !failed ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>{status === "Connecting…" ? labels.connecting : status}</p>
        <span className="text-muted-foreground">{labels.participants} ({participants.length})</span>
      </div>
      {cameraError && <p role="alert" className="mb-2 text-center text-sm text-destructive">{t("Camera unavailable. Check permissions and try again.", "Cámara no disponible. Revisa los permisos e inténtalo de nuevo.", "Câmera indisponível. Verifique as permissões e tente novamente.")}</p>}
      {audioBlocked && <button type="button" className="mb-2 rounded-lg bg-secondary p-2"
        onClick={() => { void audioContext.current?.resume().catch(() => {}); void Promise.all([...audioNodes.current.values()].map(node => node.play())).then(() => setAudioBlocked(false)).catch(() => {}); }}>
        {t("Enable audio", "Activar audio", "Ativar áudio")}
      </button>}
      {failed && <button type="button" className="mb-2 rounded-lg bg-secondary p-2" onClick={() => setAttempt(n => n + 1)}>{labels.retry}</button>}
      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto">
        <div className={`grid gap-2 ${participants.length === 1 ? "mx-auto max-w-64 grid-cols-1" : participants.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          {participants.map(person => {
            const local = person.id === userId;
            const isMuted = local ? muted : person.muted;
            const profile = profiles[person.id];
            const displayName = profile?.username || person.name;
            const video = local || person.video ? videos[person.id] : undefined;
            return (
              <div key={person.id} className="relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-xl border border-border bg-card px-2 py-4">
                {video ? <video className="aspect-video w-full rounded-lg object-cover" autoPlay playsInline muted
                  ref={element => { if (element && element.srcObject !== video) element.srcObject = video; }} /> :
                  <div className={`relative grid size-16 shrink-0 place-items-center rounded-full bg-[#5C061F] text-lg font-semibold text-[#FFE6B2] transition-shadow ${!isMuted && speaking.has(person.id) ? "ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.65)]" : ""}`}>
                    {displayName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}
                    {profile?.avatar_url && <img src={profile.avatar_url} alt="" className="absolute inset-0 size-full rounded-full object-cover"
                      onError={event => { event.currentTarget.hidden = true; }} />}
                  </div>}
                {reactions[person.id] && <span className="absolute right-2 top-2 rounded-full bg-background px-1.5 py-0.5 text-xl shadow" role="status">{reactions[person.id]}</span>}
                <span className="max-w-full truncate text-sm font-medium">{displayName}{local ? ` · ${labels.you}` : ""}</span>
                <div className="flex gap-2 text-muted-foreground">
                  {isMuted ? <MicOff size={15} aria-label={t("Microphone muted", "Micrófono silenciado", "Microfone silenciado")} /> :
                    <Mic size={15} aria-label={t("Microphone on", "Micrófono activo", "Microfone ativo")} />}
                  {(local ? hand : person.hand) && <Hand size={15} aria-label={labels.raised} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <footer className="relative mx-auto flex w-full max-w-2xl justify-center gap-3 border-t border-border pt-3">
        {reactionMenu && <div className="absolute bottom-full mb-2 flex max-w-full flex-wrap justify-center rounded-2xl border border-border bg-popover p-1 shadow-lg">
          {REACTIONS.map(emoji => <button type="button" key={emoji} className="grid size-10 place-items-center rounded-full text-xl hover:bg-accent"
            onClick={() => {
              setReactionMenu(false);
              showReaction(userId, emoji);
              void channel.current?.send({ type: "broadcast", event: "reaction", payload: { from: userId, emoji } });
            }}>{emoji}</button>)}
        </div>}
        <button type="button" onClick={toggleMute} disabled={!connected} className={`${buttonClass} ${muted ? "ring-1 ring-red-500" : ""}`} aria-pressed={!muted} aria-label={muted ? labels.unmute : labels.mute}>{muted ? <MicOff size={20} /> : <Mic size={20} />}</button>
        <button type="button" onClick={toggleHand} disabled={!connected} className={`${buttonClass} ${hand ? "ring-2 ring-[#D5AD6C]" : ""}`} aria-pressed={hand}
          aria-label={hand ? t("Lower hand", "Bajar la mano", "Abaixar a mão") : labels.hand}><Hand size={20} /></button>
        <button type="button" disabled={!connected} onClick={() => setReactionMenu(open => !open)} className={buttonClass} aria-expanded={reactionMenu}
          aria-label={t("Reactions", "Reacciones", "Reações")}><MoreHorizontal size={20} /></button>
        <button type="button" onClick={onClose} className="grid size-12 place-items-center rounded-full bg-red-600 text-white hover:bg-red-700 sm:size-14" aria-label={labels.leave}><PhoneOff size={20} /></button>
      </footer>
    </section>
  );
}
