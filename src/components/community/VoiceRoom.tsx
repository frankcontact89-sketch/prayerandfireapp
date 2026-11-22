import { audioTransportStats, localAudioDescription, usableTurnServers } from "./prayerAudioTransport";
import { GENERAL_PRAYER_ROOM_ID } from "./generalPrayerRoom";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Mic, MicOff, Hand, MoreHorizontal, ChevronDown, Users, Volume2, AudioLines, Phone, Smartphone, Bluetooth, Check, Settings2 } from "lucide-react";
import { nativePrayerAudio, prayerAudioRoute } from "./prayerAudioRoute";
import { supabase } from "@/integrations/supabase/client";

// Small-group WebRTC beta: Realtime broadcasts are signaling only; microphone
// audio flows peer-to-peer. Private Realtime channel policies are required.
type Signal = { from: string; to: string } & (
  { kind: "offer" | "answer"; data: RTCSessionDescriptionInit } |
  { kind: "ice"; data: RTCIceCandidateInit }
);
type Participant = { id: string; name: string; hand?: boolean; muted?: boolean };
const REACTIONS = ["🙏", "❤️", "🔥", "👏", "🙌", "👍", "😂", "😊", "😮", "😢", "🕊️", "🎉", "😍", "💪", "🤝", "✨", "💯", "👋"];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export default function VoiceRoom({ groupId, name, userId, userName, userAvatar, onClose, language, channelClosed, minimized, minimizedCallHost, onConnectedRoomChange, onMinimize, onRestore }: {
  groupId: string; name: string; userId: string; userName: string; onClose: () => void; language: string;
  userAvatar?: string | null;
  minimized: boolean;
  onConnectedRoomChange?: (id: string | undefined) => void;
  minimizedCallHost?: HTMLDivElement | null;
  onMinimize: () => void;
  onRestore: () => void;
  channelClosed: MutableRefObject<Promise<unknown>>;
}) {
  const [muted, setMuted] = useState(true);
  const [hand, setHand] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    onConnectedRoomChange?.(connected ? groupId : undefined);
    return () => onConnectedRoomChange?.(undefined);
  }, [connected, groupId, onConnectedRoomChange]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, { avatar_url: string | null; username: string | null }>>({});
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());
  const iceServers = useRef(RTC_CONFIG.iceServers);
  const [menu, setMenu] = useState<"reactions" | "route" | "participants" | null>(null);
  const [routes, setRoutes] = useState<Awaited<ReturnType<typeof prayerAudioRoute.routes>>>();
  const [routeError, setRouteError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const joinedAt = useRef<number>();
  const reactionSentAt = useRef(new Map<string, number>());
  const mutedRef = useRef(true);
  const reactionTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const audioContext = useRef<AudioContext | null>(null);
  const analysers = useRef(new Map<string, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }>());
  const t = useCallback((en: string, es: string, pt: string) => language === "es" ? es : language === "pt" ? pt : en, [language]);
  const stream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const audioNodes = useRef(new Map<string, HTMLAudioElement>());
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const iceQueues = useRef(new Map<string, RTCIceCandidateInit[]>());
  const offering = useRef(new Set<string>());
  const knownParticipants = useRef(new Set<string>());
  const connecting = useRef(false);
  const generation = useRef(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [peerStates, setPeerStates] = useState<Record<string, "connecting" | "ready" | "failed">>({});
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
    name: userName, hand: handRef.current, muted: mutedRef.current, startedAt: joinedAt.current,
  }), [userName]);

  const showReaction = useCallback((id: string, emoji: string) => {
    const now = Date.now();
    if (now - (reactionSentAt.current.get(id) ?? 0) < 750) return;
    reactionSentAt.current.set(id, now);
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
    if (minimized) return;
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
  }, [minimized]);

  const setPeerState = useCallback((id: string, state: "connecting" | "ready" | "failed") => {
    setPeerStates(current => current[id] === state ? current : { ...current, [id]: state });
  }, []);

  const disposePeer = useCallback((id: string) => {
    clearTimeout(peerTimers.current.get(id));
    peerTimers.current.delete(id);
    analysers.current.get(id)?.source.disconnect();
    analysers.current.delete(id);
    reactionSentAt.current.delete(id);
    peers.current.get(id)?.close(); peers.current.delete(id);
    const node = audioNodes.current.get(id);
    if (node) { node.pause(); node.srcObject = null; node.remove(); }
    audioNodes.current.delete(id);
    iceQueues.current.delete(id);
    offering.current.delete(id);
    setPeerStates(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const send = useCallback(async (signal: Signal) => {
    const active = channel.current;
    if (!active || active.state !== "joined") throw new Error("Signaling channel unavailable");
    const result = await active.send({ type: "broadcast", event: "rtc", payload: signal });
    if (result !== "ok") throw new Error(`Signaling acknowledgment: ${result}`);
  }, []);

  const getPeer = useCallback((id: string): RTCPeerConnection => {
    const existing = peers.current.get(id);
    if (existing) return existing;
    const pc = new RTCPeerConnection({ iceServers: iceServers.current });
    stream.current?.getTracks().forEach(track => pc.addTrack(track, stream.current!));
    const markFailed = (reason: unknown) => {
      if (peers.current.get(id) !== pc) return;
      void audioTransportStats(pc).then(stats => {
        console.warn("[voice-room] peer transport failed", { reason, ...stats });
      }).catch(() => console.warn("[voice-room] peer transport failed", { reason, ice: pc.iceConnectionState }));
      setPeerState(id, "failed");
    };
    const watchAudio = (deadline: number) => {
      clearTimeout(peerTimers.current.get(id));
      const timer = setTimeout(async () => {
        if (peers.current.get(id) !== pc) return;
        try {
          const stats = await audioTransportStats(pc);
          if (peers.current.get(id) !== pc) return;
          if (pc.connectionState === "connected" && stats.inboundPackets > 0) {
            peerTimers.current.delete(id);
            setPeerState(id, "ready");
            return;
          }
        } catch (error) { console.warn("[voice-room] audio stats unavailable", error); }
        if (peers.current.get(id) !== pc) return;
        if (Date.now() >= deadline) markFailed("NO_INBOUND_AUDIO");
        else watchAudio(deadline);
      }, 1500);
      peerTimers.current.set(id, timer);
    };
    setPeerState(id, "connecting");
    watchAudio(Date.now() + 18000);
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") markFailed("ICE_FAILED");
    };
    pc.onicecandidateerror = event => {
      console.warn("[voice-room] ICE server error", { code: event.errorCode });
    };
    pc.onicecandidate = event => {
      if (event.candidate) void send({ from: userId, to: id, kind: "ice", data: event.candidate.toJSON() })
        .catch(error => console.warn("[voice-room] trickle ICE delivery failed", error));
    };
    pc.ontrack = event => {
      if (event.track.kind !== "audio") return;
      const remoteAudio = event.streams[0] ?? new MediaStream([event.track]);
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
      const playRemote = () => {
        if (peers.current.get(id) !== pc) return;
        void el.play().catch(() => { if (peers.current.get(id) === pc) setAudioBlocked(true); });
      };
      event.track.addEventListener("unmute", playRemote, { once: true });
      playRemote();
    };
    pc.onconnectionstatechange = () => {
      if (peers.current.get(id) !== pc) return;
      if (pc.connectionState === "connected") watchAudio(Date.now() + 12000);
      else if (pc.connectionState === "failed") {
        clearTimeout(peerTimers.current.get(id));
        markFailed("PEER_FAILED");
      } else if (pc.connectionState === "disconnected") {
        setPeerState(id, "connecting");
        watchAudio(Date.now() + 18000);
      }
    };
    peers.current.set(id, pc);
    return pc;
  }, [send, userId, setPeerState, analyseAudio]);

  const flushIce = useCallback(async (id: string) => {
    const pc = peers.current.get(id);
    if (!pc?.remoteDescription) return;
    const pending = iceQueues.current.get(id) || [];
    iceQueues.current.delete(id);
    for (const candidate of pending) {
      try { await pc.addIceCandidate(candidate); }
      catch (error) { console.warn("[voice-room] queued ICE candidate rejected", error); }
    }
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
    const thisGeneration = ++generation.current;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let subscribeTimer: ReturnType<typeof setTimeout> | null = null;
    const stopSubscribeTimer = () => {
      if (subscribeTimer !== null) clearTimeout(subscribeTimer);
      subscribeTimer = null;
    };
    let phase = "channel-cleanup";
    const diagnose = (code: string) => {
      console.warn("[prayer-room]", { code, phase, attempt, online: navigator.onLine });
    };
    const release = () => {
      stopSubscribeTimer();
      generation.current += 1;
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      for (const id of roomPeers.keys()) disposePeer(id);
      const activeChannel = channel.current;
      channel.current = null;
      if (activeChannel) {
        channelClosed.current = Promise.all([channelClosed.current, supabase.removeChannel(activeChannel)]);
      }
      setParticipants([]);
      mutedRef.current = true;
      setMuted(true);
      setConnected(false);
    };
    const fail = (code: string, retry = false, message = labels.failure) => {
      if (cancelled || generation.current !== thisGeneration) return;
      diagnose(code);
      release();
      reconnectOnOnline.current = retry;
      setStatus(message);
      setFailed(true);
      if (retry && !reconnectTimer && reconnectAttempts.current < 5) {
        reconnectTimer = setTimeout(() => {
          if (!cancelled && navigator.onLine) {
            reconnectAttempts.current += 1;
            retryRef.current();
          }
        }, Math.min(2000 * 2 ** reconnectAttempts.current, 15000));
      }
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
        // Finish leaving the old channel before reading the current session.
        await channelClosed.current.catch(error => { console.warn('[voice-room] previous channel cleanup failed', error); });
        if (cancelled || generation.current !== thisGeneration) return;
        phase = "authentication";
        const { data: sessionData, error: authError } = await supabase.auth.getSession();
        if (authError || !sessionData.session?.access_token) {
          fail("SESSION_UNAVAILABLE", false, language === "es" ? "Tu sesión expiró. Inicia sesión de nuevo." : language === "pt" ? "Sua sessão expirou. Entre novamente." : "Your session expired. Please sign in again.");
          return;
        }
        // Let Realtime use the Supabase client's current access token callback.
        await supabase.realtime.setAuth();
        if (cancelled || generation.current !== thisGeneration) return;
        phase = "relay";
        iceServers.current = RTC_CONFIG.iceServers;
        const relay = await supabase.functions.invoke<{ iceServers?: RTCIceServer[]; expiresAt?: number }>("community-push", {
          body: { kind: "ice", group_id: groupId }, signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(8000) : undefined,
        }).catch(() => null);
        if (cancelled || generation.current !== thisGeneration) return;
        const turnServers = usableTurnServers(relay?.data);
        iceServers.current = [...(RTC_CONFIG.iceServers ?? []), ...turnServers];
        if (!turnServers.length) diagnose(!relay || relay.error ? "TURN_REQUEST_FAILED" : "TURN_CREDENTIALS_UNAVAILABLE");
        if (nativePrayerAudio) {
          phase = "audio-session";
          try { await prayerAudioRoute.prepare(); }
          catch {
            fail("AUDIO_SESSION_ACTIVATION_FAILED", false, t("Could not activate iPhone audio.", "No se pudo activar el audio del iPhone.", "Não foi possível ativar o áudio do iPhone."));
            return;
          }
        }
        if (cancelled || generation.current !== thisGeneration) return;
        phase = "microphone";
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
          config: { private: true, broadcast: { self: false, ack: true }, presence: { key: userId } },
        });
        channel.current = ch;
        ch.on("broadcast", { event: "reaction" }, ({ payload }) => {
          if (!cancelled && generation.current === thisGeneration && knownParticipants.current.has(payload?.from) && REACTIONS.includes(payload?.emoji)) {
            showReaction(payload.from, payload.emoji);
          }
        });
        const earlySignals = new Map<string, { received: number; signals: Signal[] }>();
        const signalWork = new Map<string, Promise<void>>();
        const handleSignal = async (msg: Signal) => {
          if (cancelled || generation.current !== thisGeneration || !roomParticipants.has(msg.from)) return;
          try {
            const pc = getPeer(msg.from);
            if (msg.kind === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await flushIce(msg.from);
              for (const transceiver of pc.getTransceivers()) {
                if (transceiver.receiver.track.kind === "video") transceiver.direction = "inactive";
              }
              const answer = await localAudioDescription(pc, await pc.createAnswer());
              if (cancelled || generation.current !== thisGeneration || peers.current.get(msg.from) !== pc) return;
              await send({ from: userId, to: msg.from, kind: "answer", data: answer });
            } else if (msg.kind === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
              await flushIce(msg.from);
            } else if (msg.kind === "ice") {
              if (pc.remoteDescription) await pc.addIceCandidate(msg.data);
              else {
                const queued = iceQueues.current.get(msg.from) ?? [];
                if (queued.length < 64) queued.push(msg.data);
                iceQueues.current.set(msg.from, queued);
              }
            }
          } catch (error) {
            if (!cancelled && generation.current === thisGeneration) {
              diagnose(`SIGNAL_${msg.kind.toUpperCase()}_FAILED`);
              console.warn("[voice-room] signaling error", error);
              setPeerState(msg.from, "failed");
            }
          }
        };
        const enqueueSignal = (msg: Signal) => {
          const next = (signalWork.get(msg.from) ?? Promise.resolve()).then(() => handleSignal(msg));
          signalWork.set(msg.from, next);
          void next.finally(() => { if (signalWork.get(msg.from) === next) signalWork.delete(msg.from); });
        };
        ch.on("broadcast", { event: "rtc" }, ({ payload }) => {
          if (cancelled || generation.current !== thisGeneration) return;
          const msg = payload as Signal;
          if (!msg || typeof msg.from !== "string" || msg.from === userId || msg.to !== userId || !msg.data ||
              (msg.kind !== "offer" && msg.kind !== "answer" && msg.kind !== "ice")) return;
          if (roomParticipants.has(msg.from)) { enqueueSignal(msg); return; }
          const now = Date.now();
          for (const [id, batch] of earlySignals) if (now - batch.received > 15000) earlySignals.delete(id);
          const batch = earlySignals.get(msg.from);
          if (batch) {
            if (batch.signals.length < 64) batch.signals.push(msg);
          } else if (earlySignals.size < 32) {
            earlySignals.set(msg.from, { received: now, signals: [msg] });
          }
        });
        ch.on("presence", { event: "sync" }, () => {
          if (cancelled || generation.current !== thisGeneration) return;
          const state = ch.presenceState<{ name?: string; hand?: boolean; muted?: boolean; startedAt?: number }>();
          const now = Date.now();
          let earliest = joinedAt.current ?? now;
          for (const [id, entries] of Object.entries(state)) {
            const startedAt = entries[0]?.startedAt;
            if (id !== userId && !id.startsWith("observer:") && typeof startedAt === "number" && startedAt > 0 && startedAt <= now) {
              earliest = Math.min(earliest, startedAt);
            }
          }
          if (earliest !== joinedAt.current) {
            joinedAt.current = earliest;
            setElapsed(Math.floor((now - earliest) / 1000));
            if (state[userId]?.length) void publishPresence();
          }
          const people = Object.entries(state).filter(([id]) => id !== userId && !id.startsWith("observer:")).map(([id, values]) => ({ id, name: values[0]?.name || "Member", hand: !!values[0]?.hand, muted: values[0]?.muted !== false }));
          roomParticipants.clear();
          for (const person of people) {
            roomParticipants.add(person.id);
            const batch = earlySignals.get(person.id);
            earlySignals.delete(person.id);
            if (batch && now - batch.received <= 15000) batch.signals.forEach(enqueueSignal);
          }
          setParticipants([{ id: userId, name: userName }, ...people]);
          if (state[userId]?.length && !announced.current) {
            announced.current = true;
            if (!people.length && groupId !== GENERAL_PRAYER_ROOM_ID) void supabase.functions.invoke("community-push", { body: { kind: "call", group_id: groupId } }).catch(() => {});
          }
          for (const id of peers.current.keys()) if (!people.some(p => p.id === id)) disposePeer(id);
          // Only the lexicographically smaller id initiates each peer connection.
          for (const p of people) {
            const pc = getPeer(p.id);
            if (userId >= p.id) continue;
            if (pc.signalingState !== "stable" || pc.localDescription || offering.current.has(p.id)) continue;
            offering.current.add(p.id);
            void (async () => {
              const offer = await pc.createOffer();
              if (cancelled || pc.signalingState === "closed") return;
              const description = await localAudioDescription(pc, offer);
              if (cancelled || generation.current !== thisGeneration || peers.current.get(p.id) !== pc) return;
              await send({ from: userId, to: p.id, kind: "offer", data: description });
            })().catch(error => {
              if (!cancelled && generation.current === thisGeneration && peers.current.get(p.id) === pc) {
                diagnose("SIGNAL_OFFER_FAILED");
                console.warn("[voice-room] offer error", error);
                setPeerState(p.id, "failed");
              }
            }).finally(() => { if (peers.current.get(p.id) === pc) offering.current.delete(p.id); });
          }
        });
        phase = "subscription";
        ch.subscribe(async (state, error) => {
          if (cancelled || generation.current !== thisGeneration) return;
          if (state === "SUBSCRIBED") {
            if (!stream.current) return;
            phase = "presence";
            joinedAt.current ??= Date.now();
            try {
              const result = await ch.track({ name: userName, hand: handRef.current, muted: mutedRef.current, startedAt: joinedAt.current });
              if (cancelled || generation.current !== thisGeneration) return;
              if (result !== "ok") { fail(`PRESENCE_${result.toUpperCase()}`, true); return; }
              stopSubscribeTimer();
              if (!stream.current?.getAudioTracks().some(track => track.readyState === "live")) {
                fail("MICROPHONE_TRACK_ENDED", true);
                return;
              }
              phase = "connected";
              reconnectAttempts.current = 0;
              setFailed(false);
              setConnected(true);
              setStatus(labels.connected);
            } catch { fail("PRESENCE_EXCEPTION", true); }
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
            const denied = /unauthori[sz]ed|permission|forbidden/i.test(error?.message ?? "");
            fail(denied ? "CHANNEL_PERMISSION_DENIED" : state, !denied, denied ? t('Room access denied', 'Acceso a la sala denegado', 'Acesso à sala negado') : t('Connection interrupted. Reconnecting…', 'Conexión interrumpida. Reconectando…', 'Conexão interrompida. Reconectando…'));
          }
        });
        subscribeTimer = setTimeout(() => fail("ROOM_JOIN_TIMEOUT", true), 20000);
      } catch (error) {
        const reason = error instanceof Error ? error.name : "";
        const micDenied = reason === "NotAllowedError" || reason === "PermissionDeniedError";
        fail(micDenied ? "MICROPHONE_PERMISSION_DENIED" : "ROOM_START_FAILED", false, micDenied
          ? (language === "es" ? "Permite el acceso al micrófono en Ajustes para entrar a la sala." : language === "pt" ? "Permita o acesso ao microfone nos Ajustes para entrar na sala." : "Allow microphone access in Settings to join the room.")
          : labels.failure);
      }
    };
    const stopOnOffline = () => fail("NETWORK_OFFLINE", true);
    window.addEventListener("offline", stopOnOffline);
    void start();
    return () => {
      window.removeEventListener("offline", stopOnOffline);
      cancelled = true;
      stopSubscribeTimer();
      clearTimeout(reconnectTimer);
      generation.current++;
      if (channel.current) channelClosed.current = Promise.all([channelClosed.current, supabase.removeChannel(channel.current)]);
      setParticipants([]);
      channel.current = null;
      roomOffers.clear();
      roomParticipants.clear();
      for (const id of Array.from(roomPeers.keys())) disposePeer(id);
      stream.current?.getTracks().forEach(t => t.stop());
      stream.current = null;
      for (const timer of roomReactionTimers.values()) clearTimeout(timer);
      roomReactionTimers.clear();
      setReactions({});
      roomAnalysers.clear();
      if (audioContext.current) void audioContext.current.close().catch(() => {});
      audioContext.current = null;
      connecting.current = false;
    };
  }, [groupId, userId, userName, getPeer, flushIce, send, disposePeer, attempt, channelClosed, analyseAudio, showReaction, publishPresence, setPeerState, t, language, labels.connecting, labels.connected, labels.failure]);

  const toggleHand = () => {
    if (!connected) return;
    const next = !handRef.current;
    handRef.current = next;
    setHand(next);
    if (channel.current?.state === "joined") void publishPresence()?.catch(() => {});
  };

  const resumeRemoteAudio = useCallback(async () => {
    const elements = [...audioNodes.current.values()];
    const outcomes = await Promise.allSettled(elements.map(element => element.play()));
    setAudioBlocked(outcomes.some(result => result.status === "rejected"));
  }, []);

  const toggleMute = () => {
    if (!connected || !stream.current || document.visibilityState !== "visible") return;
    const tracks = stream.current.getAudioTracks().filter(track => track.readyState === "live");
    if (!tracks.length) {
      setStatus(t("The microphone stopped. Retry the connection.", "El micrófono se detuvo. Reintenta la conexión.", "O microfone parou. Tente reconectar."));
      setFailed(true);
      return;
    }
    const next = !mutedRef.current;
    tracks.forEach(track => { track.enabled = !next; });
    mutedRef.current = next;
    setMuted(next);
    void audioContext.current?.resume().catch(() => {});
    void resumeRemoteAudio();
    void publishPresence();
  };

  const refreshRoutes = useCallback(() => {
    if (nativePrayerAudio) void prayerAudioRoute.routes().then(setRoutes).catch(() => setRouteError(true));
  }, []);

  useEffect(() => {
    if (!nativePrayerAudio || !connected) return;
    refreshRoutes();
    const route = prayerAudioRoute.addListener("routeChanged", refreshRoutes);
    const interruption = prayerAudioRoute.addListener("interrupted", ({ ended }) => {
      if (ended) {
        void prayerAudioRoute.prepare().then(() => {
          refreshRoutes();
          return resumeRemoteAudio();
        }).catch(() => setAudioBlocked(true));
        return;
      }
      stream.current?.getAudioTracks().forEach(track => { track.enabled = false; });
      mutedRef.current = true;
      setMuted(true);
      void publishPresence();
    });
    return () => {
      void route.then(listener => listener.remove()).catch(() => {});
      void interruption.then(listener => listener.remove()).catch(() => {});
      void prayerAudioRoute.reset().catch(() => {});
    };
  }, [connected, refreshRoutes, publishPresence, resumeRemoteAudio]);

  useEffect(() => {
    const update = () => {
      if (joinedAt.current !== undefined) setElapsed(Math.floor((Date.now() - joinedAt.current) / 1000));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const duration = [
    ...(elapsed >= 3600 ? [Math.floor(elapsed / 3600)] : []),
    Math.floor(elapsed / 60) % 60, elapsed % 60,
  ].map(value => String(value).padStart(2, "0")).join(":");
  const count = `${participants.length} ${participants.length === 1 ? t("participant", "participante", "participante") : labels.participants.toLowerCase()}`;
  const control = (tone = "bg-background text-foreground ring-border") =>
    `grid size-12 shrink-0 place-items-center rounded-full ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 sm:size-14 ${tone}`;
  const buttonClass = "grid size-11 place-items-center rounded-full bg-secondary text-foreground focus-visible:ring-2 focus-visible:ring-primary";
  const activeTone = "bg-[#5C061F] text-white ring-[#B7893E]";
  const handTone = "bg-[#E5BB70] text-[#361321] ring-[#98702D]";
  const closeMenu = () => setMenu(null);
  const selectRoute = async (route: string) => {
    try {
      await prayerAudioRoute.select({ route });
      setRouteError(false);
      refreshRoutes();
      void resumeRemoteAudio();
    } catch { setRouteError(true); }
  };

  const peerFailed = Object.values(peerStates).includes("failed");
  const waitingForPeer = participants.some(person => person.id !== userId && peerStates[person.id] !== "ready");
  const audioStatus = failed ? status : peerFailed
    ? t("Could not establish audio with a participant.", "No se pudo establecer audio con un participante.", "Não foi possível estabelecer áudio com um participante.")
    : waitingForPeer ? t("Connecting audio…", "Conectando audio…", "Conectando áudio…") : "";
  if (minimized) {
    const banner = <button type="button" onClick={onRestore}
      className={`flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium ${minimizedCallHost
        ? "w-full border-b border-border bg-card text-foreground"
        : "fixed inset-x-3 bottom-[max(76px,calc(env(safe-area-inset-bottom)+68px))] z-[160] mx-auto w-[calc(100%-24px)] max-w-md rounded-full bg-[#5C061F] text-white shadow-lg"}`}
      aria-label={t("Return to call", "Volver a la llamada", "Voltar à chamada")}>
      <span className={`size-2 shrink-0 rounded-full ${connected && !audioStatus && !audioBlocked ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{name} · {audioStatus || (connected ? count : status)}</span>
      <span className="shrink-0 tabular-nums">{duration}</span>
      <Phone size={16} className="shrink-0" aria-hidden="true" />
    </button>;
    return minimizedCallHost ? createPortal(banner, minimizedCallHost) : banner;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/35" onClick={() => { if (menu) closeMenu(); }}>
      <section role="dialog" aria-modal="true" aria-label={labels.title}
        className="relative flex h-[min(78dvh,720px)] min-h-0 w-full max-w-2xl flex-col rounded-t-[2rem] bg-background px-3 text-foreground shadow-2xl sm:px-5"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <button type="button" className="mx-auto flex h-6 w-16 shrink-0 items-center justify-center"
          aria-label={t("Minimize call", "Minimizar llamada", "Minimizar chamada")} onClick={() => { closeMenu(); onMinimize(); }}>
          <span className="h-1 w-9 rounded-full bg-muted-foreground/40" />
        </button>
        <header className="grid shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-start gap-2 border-b border-border pb-3 text-center">
          <button type="button" className={buttonClass} aria-label={t("Minimize call", "Minimizar llamada", "Minimizar chamada")}
            onClick={() => { closeMenu(); onMinimize(); }}><ChevronDown size={20} /></button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{name}</h2>
            <p className="text-xs text-muted-foreground tabular-nums" role="status">
              {connected ? `${count} · ${duration}` : status === "Connecting…" ? labels.connecting : status}
            </p>
          </div>
          <button type="button" className={buttonClass} aria-label={labels.participants} aria-expanded={menu === "participants"}
            onClick={event => { event.stopPropagation(); setMenu(current => current === "participants" ? null : "participants"); }}><Users size={18} /></button>
        </header>
        {menu === "participants" && <ul onClick={event => event.stopPropagation()} className="absolute inset-x-3 top-24 z-10 max-h-[45%] overflow-auto rounded-2xl border border-border bg-popover p-3 shadow-lg" aria-label={labels.participants}>
          {participants.map(person => <li key={person.id} className="flex min-h-10 items-center justify-between gap-2 border-b border-border text-sm last:border-0">
            <span className="truncate">{profiles[person.id]?.username || person.name}</span>{(person.id === userId ? muted : person.muted) ? <MicOff size={15} /> : <Mic size={15} />}
          </li>)}
        </ul>}
        {connected && audioStatus && <p className="mt-2 text-center text-sm text-muted-foreground" role={failed || peerFailed ? "alert" : "status"}>{audioStatus}</p>}
        {audioBlocked && <button type="button" className="mt-2 rounded-lg bg-secondary p-2 text-sm"
          onClick={() => { void audioContext.current?.resume().catch(() => {}); void resumeRemoteAudio(); }}>
          {t("Enable audio", "Activar audio", "Ativar áudio")}
        </button>}
        {(failed || peerFailed) && <button type="button" className="mt-2 rounded-lg bg-secondary p-2 text-sm" onClick={() => setAttempt(n => n + 1)}>{labels.retry}</button>}
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-y-4">
            {participants.map(person => {
              const local = person.id === userId;
              const isMuted = local ? muted : person.muted;
              const profile = profiles[person.id];
              const displayName = profile?.username || person.name;
              const avatar = profile?.avatar_url || (local ? userAvatar : null);
              const talking = !isMuted && speaking.has(person.id);
              return <div key={person.id} className={`flex min-w-0 flex-col items-center gap-2 px-1 ${participants.length === 1 ? "basis-full" : participants.length > 4 ? "basis-1/3" : "basis-1/2"}`}>
                <div className={`relative grid place-items-center rounded-full bg-[#5C061F] font-semibold text-[#FFE6B2] ${participants.length === 1 ? "size-28 text-3xl sm:size-32" : participants.length <= 4 ? "size-[76px] text-xl sm:size-24" : "size-14 text-sm sm:size-20"} ${talking ? "ring-2 ring-[#BB8A3E] ring-offset-2 ring-offset-background" : ""}`}>
                  {talking && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#C39143] motion-safe:animate-ping" />}
                  {displayName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}
                  {avatar && <img key={avatar} src={avatar} alt="" className="absolute inset-0 size-full rounded-full object-cover"
                    onError={event => { event.currentTarget.hidden = true; }} />}
                  <span className={`absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full ring-2 ring-background ${isMuted ? "bg-secondary text-foreground" : "bg-[#5C061F] text-white"}`}>
                    {isMuted ? <MicOff size={13} aria-label={t("Muted", "Silenciado", "Silenciado")} /> : <Mic size={13} aria-label={t("Microphone on", "Micrófono activo", "Microfone ativo")} />}
                  </span>
                  {(local ? hand : person.hand) && <Hand size={15} aria-label={labels.raised} className="absolute -left-2 -top-1 rounded bg-background text-[#A8782D]" />}
                  {talking && <AudioLines size={16} aria-hidden="true" className="absolute -left-4 bottom-1 text-[#A8782D]" />}
                  {reactions[person.id] && <span key={reactions[person.id]} className="absolute -right-3 -top-2 z-[1] rounded-full bg-background px-1 text-lg shadow motion-safe:animate-in motion-safe:fade-in" role="status">{reactions[person.id]}</span>}
                </div>
                <span className="max-w-full truncate text-xs font-medium">{displayName}{local ? ` · ${labels.you}` : ""}</span>
              </div>;
            })}
          </div>
        </div>
        <footer className="relative mx-auto flex w-full max-w-[360px] shrink-0 items-center justify-between gap-1 rounded-full bg-secondary px-2 py-2 shadow-md sm:px-3"
          onClick={event => event.stopPropagation()}>
          {menu === "reactions" && <div className="absolute bottom-full left-1/2 z-10 mb-2 grid w-full min-w-[288px] -translate-x-1/2 grid-cols-6 gap-0.5 rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
            {REACTIONS.map(emoji => <button type="button" key={emoji} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                closeMenu();
                if (!connected || Date.now() - (reactionSentAt.current.get(userId) ?? 0) < 750) return;
                showReaction(userId, emoji);
                void channel.current?.send({ type: "broadcast", event: "reaction", payload: { from: userId, emoji } });
              }}>{emoji}</button>)}
          </div>}
          {menu === "route" && <div className="absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-2xl border border-border bg-popover p-2 text-sm shadow-lg">
            <p className="px-2 py-1 font-semibold">{t("Audio output", "Salida de audio", "Saída de áudio")}</p>
            {routes?.options.map(route => {
              const Icon = route.kind === "automatic" ? Settings2 : route.kind === "phone" ? Smartphone : route.kind === "bluetooth" ? Bluetooth : Volume2;
              const title = route.kind === "automatic" ? t("Automatic", "Automática", "Automática")
                : route.kind === "speaker" ? t("Speaker", "Altavoz", "Alto-falante")
                : route.name;
              return <button type="button" key={route.id} onClick={() => void selectRoute(route.id)}
                aria-pressed={routes.selected === route.id} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-accent">
                <Icon size={17} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1">{title}</span>
                {routes.selected === route.id && <Check size={17} aria-hidden="true" />}
              </button>;
            })}
            {routeError && <p role="alert" className="px-2 text-destructive">{t("Audio output unavailable", "Salida de audio no disponible", "Saída de áudio indisponível")}</p>}
          </div>}
          <button type="button" className={control(menu === "reactions" ? activeTone : undefined)} disabled={!connected} aria-expanded={menu === "reactions"}
            aria-label={t("Reactions", "Reacciones", "Reações")} onClick={() => setMenu(current => current === "reactions" ? null : "reactions")}><MoreHorizontal size={20} /></button>
          <button type="button" className={control(routes?.selected === "speaker" || menu === "route" ? activeTone : undefined)} disabled={!connected || !nativePrayerAudio}
            aria-expanded={menu === "route"} aria-label={t("Audio output", "Salida de audio", "Saída de áudio")}
            onClick={() => { refreshRoutes(); setMenu(current => current === "route" ? null : "route"); }}><Volume2 size={19} /></button>
          <button type="button" className={control(hand ? handTone : undefined)} disabled={!connected} aria-pressed={hand}
            aria-label={hand ? t("Lower hand", "Bajar la mano", "Abaixar a mão") : labels.hand} onClick={toggleHand}><Hand size={19} /></button>
          <button type="button" className={control(muted ? "bg-muted text-muted-foreground ring-border" : activeTone)} disabled={!connected} aria-pressed={!muted}
            aria-label={muted ? labels.unmute : labels.mute} onClick={toggleMute}>{muted ? <MicOff size={19} /> : <Mic size={19} />}</button>
          <button type="button" className={control("bg-red-600 text-white ring-red-700 hover:bg-red-700")} aria-label={labels.leave} onClick={onClose}><Phone size={19} className="rotate-[135deg]" /></button>
        </footer>
      </section>
    </div>
  );
}
