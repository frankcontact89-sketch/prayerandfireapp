import { audioTransportStats, iceExpiryMs, localAudioDescription, usableTurnServers, type PrayerIceCredentials } from "./prayerAudioTransport";
import { GENERAL_PRAYER_ROOM_ID } from "./generalPrayerRoom";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Mic, MicOff, Hand, MoreHorizontal, ChevronDown, Users, Volume2, AudioLines, Phone, Smartphone, Bluetooth, Headphones, Check, Settings2 } from "lucide-react";
import { nativePrayerAudio, prayerAudioRoute } from "./prayerAudioRoute";
import { supabase } from "@/integrations/supabase/client";

// Small-group WebRTC beta: Realtime broadcasts are signaling only; microphone
// audio flows peer-to-peer. Private Realtime channel policies are required.
type Signal = { from: string; to: string } & (
  { kind: "offer" | "answer"; data: RTCSessionDescriptionInit } |
  { kind: "ice"; data: RTCIceCandidateInit }
);
type Participant = { id: string; name: string; hand?: boolean; muted?: boolean };
const EXTRA_REACTIONS = ["🫶", "🙇", "😇", "🥹", "🕯️", "📖", "🌍", "🌿", "☀️", "🎶", "💛", "💙"];
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
  const iceCredentials = useRef<{ generation: number; expiresAt: number; servers: RTCIceServer[] }>();
  const iceRequest = useRef<{ generation: number; promise: Promise<RTCIceServer[]> }>();
  const [extraReactions, setExtraReactions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>();
  const [profileOpen, setProfileOpen] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [reportStatus, setReportStatus] = useState<"confirm" | "sending" | "sent" | "error">();
  const [localMutes, setLocalMutes] = useState<Set<string>>(() => new Set());
  const localMutesRef = useRef(new Set<string>());
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
    if (!connected) return;
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
  }, [connected]);

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

  const getIceServers = useCallback(async () => {
    const version = generation.current;
    const cached = iceCredentials.current;
    if (cached?.generation === version && cached.expiresAt > Date.now() + 60_000) return cached.servers;
    if (iceRequest.current?.generation === version) return iceRequest.current.promise;

    const fallback = RTC_CONFIG.iceServers ?? [];
    const promise = (async () => {
      const relay = await supabase.functions.invoke<PrayerIceCredentials>("community-push", {
        body: { kind: "ice", group_id: groupId },
        signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(12_000) : undefined,
      }).catch(() => null);
      const turnServers = usableTurnServers(relay?.data);
      const providerStun = relay?.data?.iceServers?.flatMap(server => {
        const urls = [server?.urls].flat().filter(url => typeof url === "string" && /^stun:/i.test(url));
        return urls.length ? [{ urls }] : [];
      }) ?? [];
      const servers = [...(turnServers.length && providerStun.length ? providerStun : fallback), ...turnServers];
      if (generation.current === version && turnServers.length) {
        iceCredentials.current = { generation: version, expiresAt: iceExpiryMs(relay?.data?.expiresAt), servers };
      }
      if (!turnServers.length) console.warn("[voice-room] TURN credentials unavailable; using STUN");
      return servers;
    })();
    iceRequest.current = { generation: version, promise };
    try { return await promise; }
    finally { if (iceRequest.current?.promise === promise) iceRequest.current = undefined; }
  }, [groupId]);

  const getPeer = useCallback(async (id: string): Promise<RTCPeerConnection> => {
    const existing = peers.current.get(id);
    if (existing) return existing;
    const version = generation.current;
    const iceServers = await getIceServers();
    if (version !== generation.current || !knownParticipants.current.has(id)) throw new Error("Audio participant no longer present");
    const concurrent = peers.current.get(id);
    if (concurrent) return concurrent;
    const pc = new RTCPeerConnection({ iceServers });
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
      el.muted = localMutesRef.current.has(id);
      el.srcObject = remoteAudio;
      const playRemote = () => {
        if (peers.current.get(id) !== pc) return;
        void el.play().catch(() => { if (peers.current.get(id) === pc) setAudioBlocked(true); });
      };
      event.track.addEventListener("unmute", playRemote, { once: true });
      playRemote();
    };
    let restartAttempted = false;
    pc.onconnectionstatechange = () => {
      if (peers.current.get(id) !== pc) return;
      if (pc.connectionState === "connected") watchAudio(Date.now() + 12000);
      else if (pc.connectionState === "failed") {
        clearTimeout(peerTimers.current.get(id));
        if (userId < id && !restartAttempted && pc.signalingState === "stable") {
          restartAttempted = true;
          setPeerState(id, "connecting");
          void (async () => {
            const freshServers = await getIceServers();
            if (peers.current.get(id) !== pc) return;
            pc.setConfiguration({ ...pc.getConfiguration(), iceServers: freshServers });
            pc.restartIce();
            watchAudio(Date.now() + 18000);
            const description = await localAudioDescription(pc, await pc.createOffer({ iceRestart: true }));
            if (peers.current.get(id) === pc) await send({ from: userId, to: id, kind: "offer", data: description });
          })().catch(() => markFailed("ICE_RESTART_FAILED"));
        } else markFailed("PEER_FAILED");
      } else if (pc.connectionState === "disconnected") {
        setPeerState(id, "connecting");
        watchAudio(Date.now() + 18000);
      }
    };
    peers.current.set(id, pc);
    return pc;
  }, [send, userId, setPeerState, analyseAudio, getIceServers]);

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

  useEffect(() => {
    const muteMicrophone = () => {
      stream.current?.getAudioTracks().forEach(track => { track.enabled = false; });
      mutedRef.current = true;
      setMuted(true);
      void publishPresence();
    };
    // The native iOS call can continue behind the lock screen. A real page
    // exit still mutes immediately, as does hiding the browser version.
    const onVisibilityChange = () => {
      if (!nativePrayerAudio && document.visibilityState === "hidden") muteMicrophone();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", muteMicrophone);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", muteMicrophone);
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
        for (const track of mic.getAudioTracks()) {
          track.addEventListener("ended", () => {
            fail("MICROPHONE_TRACK_ENDED", true, t(
              "The microphone stopped. Reconnecting…",
              "El micrófono se detuvo. Reconectando…",
              "O microfone parou. Reconectando…",
            ));
          }, { once: true });
        }
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
          if (!cancelled && generation.current === thisGeneration && knownParticipants.current.has(payload?.from) && (REACTIONS.includes(payload?.emoji) || EXTRA_REACTIONS.includes(payload?.emoji))) {
            showReaction(payload.from, payload.emoji);
          }
        });
        const earlySignals = new Map<string, { received: number; signals: Signal[] }>();
        const signalWork = new Map<string, Promise<void>>();
        const handleSignal = async (msg: Signal) => {
          if (cancelled || generation.current !== thisGeneration || !roomParticipants.has(msg.from)) return;
          try {
            const existing = peers.current.has(msg.from);
            const pc = await getPeer(msg.from);
            if (cancelled || generation.current !== thisGeneration || peers.current.get(msg.from) !== pc) return;
            if (msg.kind === "offer") {
              if (existing && pc.remoteDescription) {
                const iceServers = await getIceServers();
                if (cancelled || generation.current !== thisGeneration || peers.current.get(msg.from) !== pc) return;
                pc.setConfiguration({ ...pc.getConfiguration(), iceServers });
              }
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
            if (userId >= p.id || offering.current.has(p.id) || peers.current.get(p.id)?.localDescription) continue;
            offering.current.add(p.id);
            void (async () => {
              const pc = await getPeer(p.id);
              if (cancelled || generation.current !== thisGeneration || pc.signalingState !== "stable" || pc.localDescription) return;
              const offer = await pc.createOffer();
              if (cancelled || peers.current.get(p.id) !== pc) return;
              const description = await localAudioDescription(pc, offer);
              if (cancelled || generation.current !== thisGeneration || peers.current.get(p.id) !== pc) return;
              await send({ from: userId, to: p.id, kind: "offer", data: description });
            })().catch(error => {
              if (!cancelled && generation.current === thisGeneration && roomParticipants.has(p.id)) {
                diagnose("SIGNAL_OFFER_FAILED");
                console.warn("[voice-room] offer error", error);
                setPeerState(p.id, "failed");
              }
            }).finally(() => { if (generation.current === thisGeneration) offering.current.delete(p.id); });
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
  }, [groupId, userId, userName, getPeer, getIceServers, flushIce, send, disposePeer, attempt, channelClosed, analyseAudio, showReaction, publishPresence, setPeerState, t, language, labels.connecting, labels.connected, labels.failure]);

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

  const systemCall = useRef<string>();
  const closeRoom = useRef(onClose);
  closeRoom.current = onClose;

  const applyMute = useCallback((next: boolean) => {
    const tracks = stream.current?.getAudioTracks().filter(track => track.readyState === "live");
    if (!tracks?.length) return false;
    tracks.forEach(track => { track.enabled = !next; });
    mutedRef.current = next;
    setMuted(next);
    void publishPresence();
    return true;
  }, [publishPresence]);

  useEffect(() => {
    if (!nativePrayerAudio || !connected) return;
    let disposed = false;
    let callId: string | undefined;
    const muteListener = prayerAudioRoute.addListener("systemMute", ({ id, actionID, muted }) => {
      void prayerAudioRoute.completeSystemMute({ actionID, applied: !disposed && id === callId && applyMute(muted) }).catch(() => {});
    });
    const endListener = prayerAudioRoute.addListener("systemCallEnded", ({ id }) => {
      if (disposed || id !== callId) return;
      applyMute(true);
      closeRoom.current();
    });
    void Promise.all([muteListener, endListener]).then(async () => {
      if (disposed) return;
      const { id } = await prayerAudioRoute.startSystemCall({ name });
      if (disposed) { await prayerAudioRoute.endSystemCall({ id }); return; }
      callId = id;
      systemCall.current = id;
      await prayerAudioRoute.requestSystemMute({ id, muted: mutedRef.current });
    }).catch(error => {
      console.warn("[prayer-room] CallKit unavailable", error);
      if (callId) {
        if (systemCall.current === callId) systemCall.current = undefined;
        void prayerAudioRoute.endSystemCall({ id: callId }).catch(() => {});
      }
    });
    return () => {
      disposed = true;
      if (callId && systemCall.current === callId) systemCall.current = undefined;
      if (callId) void prayerAudioRoute.endSystemCall({ id: callId }).catch(() => {});
      void muteListener.then(listener => listener.remove()).catch(() => {});
      void endListener.then(listener => listener.remove()).catch(() => {});
    };
  }, [connected, name, applyMute]);

  const toggleMute = () => {
    if (!connected || document.visibilityState !== "visible") return;
    const next = !mutedRef.current;
    const id = systemCall.current;
    if (id) void prayerAudioRoute.requestSystemMute({ id, muted: next }).catch(() => setAudioBlocked(true));
    else if (!applyMute(next)) {
      setStatus(t("The microphone stopped. Retry the connection.", "El micrófono se detuvo. Reintenta la conexión.", "O microfone parou. Tente reconectar."));
      setFailed(true);
      return;
    }
    void audioContext.current?.resume().catch(() => {});
    void resumeRemoteAudio();
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
  const lowerHandLabel = t("Lower hand", "Bajar la mano", "Abaixar a mão");
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
    const banner = <div className={`flex min-h-14 items-center gap-1 px-2 ${minimizedCallHost
      ? "border-b border-border bg-card text-foreground"
      : "fixed inset-x-3 bottom-[max(76px,calc(env(safe-area-inset-bottom)+68px))] z-[160] mx-auto max-w-md rounded-full bg-card text-foreground shadow-lg"}`}>
      <button type="button" onClick={onRestore} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
        aria-label={t("Return to call", "Volver a la llamada", "Voltar à chamada")}>
        <span className="flex shrink-0 -space-x-1">
          {participants.slice(0, 2).map(person => {
            const avatar = profiles[person.id]?.avatar_url || (person.id === userId ? userAvatar : null);
            return <span key={person.id} className={`relative grid size-7 place-items-center rounded-full bg-[#5C061F] text-xs text-[#FFE6B2] ring-2 ${speaking.has(person.id) ? "ring-[#C39143]" : "ring-card"}`}>
              {person.name.charAt(0).toUpperCase()}
              {avatar && <img src={avatar} alt="" className="absolute inset-0 size-full rounded-full object-cover" onError={event => { event.currentTarget.hidden = true; }} />}
            </span>;
          })}
          {participants.length > 2 && <span className="grid size-7 place-items-center rounded-full bg-secondary text-[10px]">+{participants.length - 2}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{audioStatus || (connected ? `${count} · ${duration}` : status)}</span>
        </span>
      </button>
      <button type="button" className="grid size-11 place-items-center rounded-full bg-secondary" disabled={!connected} aria-label={muted ? labels.unmute : labels.mute}
        onClick={toggleMute}>{muted ? <MicOff size={17} /> : <Mic size={17} />}</button>
      <button type="button" className="grid size-11 place-items-center rounded-full bg-red-600 text-white" aria-label={labels.leave}
        onClick={onClose}><Phone size={17} className="rotate-[135deg]" /></button>
    </div>;
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
            <span className="flex min-w-0 items-center gap-2"><span className="truncate">{profiles[person.id]?.username || person.name}</span>{(person.id === userId ? hand : person.hand) && <Hand size={15} className="shrink-0 text-[#B7893E]" aria-label={labels.raised} />}</span>{(person.id === userId ? muted : person.muted) ? <MicOff size={15} /> : <Mic size={15} />}
          </li>)}
        </ul>}
        {connected && hand && (
          <div className="pointer-events-none absolute inset-x-0 top-24 z-[5] flex justify-center">
            <button type="button" onClick={toggleHand} className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B7893E] bg-[#5C061F] px-4 text-sm font-semibold text-white shadow-md">
              <Hand size={16} aria-hidden="true" />{lowerHandLabel}
            </button>
          </div>
        )}
        {connected && audioStatus && <p className="mt-2 text-center text-sm text-muted-foreground" role={failed || peerFailed ? "alert" : "status"}>{audioStatus}</p>}
        {audioBlocked && <button type="button" className="mt-2 rounded-lg bg-secondary p-2 text-sm"
          onClick={() => { void audioContext.current?.resume().catch(() => {}); void resumeRemoteAudio(); }}>
          {t("Enable audio", "Activar audio", "Ativar áudio")}
        </button>}
        {(failed || peerFailed) && <button type="button" className="mt-2 rounded-lg bg-secondary p-2 text-sm" onClick={() => setAttempt(n => n + 1)}>{labels.retry}</button>}
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 ${hand ? "pt-16" : "pt-5"}`}>
          <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-y-4">
            {participants.map(person => {
              const local = person.id === userId;
              const isMuted = local ? muted : person.muted;
              const profile = profiles[person.id];
              const displayName = profile?.username || person.name;
              const avatar = profile?.avatar_url || (local ? userAvatar : null);
              const talking = !isMuted && speaking.has(person.id);
              return <div key={person.id} className={`flex min-w-0 flex-col items-center gap-2 px-1 ${participants.length === 1 ? "basis-full" : "basis-1/3"}`}>
                <button type="button" disabled={local} aria-label={displayName} onClick={() => { setSelectedPerson(person.id); setProfileOpen(false); setContactError(false); setReportStatus(undefined); }}
                  className={`relative grid place-items-center rounded-full bg-[#5C061F] font-semibold text-[#FFE6B2] size-[clamp(3.75rem,22vw,6rem)] text-xl sm:text-2xl ${talking ? "ring-2 ring-[#BB8A3E] ring-offset-2 ring-offset-background" : ""}`}>
                  {talking && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#C39143] motion-safe:animate-ping" />}
                  {displayName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}
                  {avatar && <img key={avatar} src={avatar} alt="" className="absolute inset-0 size-full rounded-full object-cover"
                    onError={event => { event.currentTarget.hidden = true; }} />}
                  <span className={`absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full ring-2 ring-background ${isMuted ? "bg-secondary text-foreground" : "bg-[#5C061F] text-white"}`}>
                    {isMuted ? <MicOff size={13} aria-label={t("Muted", "Silenciado", "Silenciado")} /> : <Mic size={13} aria-label={t("Microphone on", "Micrófono activo", "Microfone ativo")} />}
                  </span>
                  {(local ? hand : person.hand) && <Hand size={15} aria-label={labels.raised} className="absolute -left-2 -top-1 rounded bg-background text-[#A8782D]" />}
                  {reactions[person.id] && <span key={reactions[person.id]} className="absolute -right-3 -top-2 z-[1] rounded-full bg-background px-1 text-lg shadow motion-safe:animate-in motion-safe:fade-in" role="status">{reactions[person.id]}</span>}
                </button>
                <span className="relative flex h-4 w-full justify-center">
                  {talking && <AudioLines size={16} aria-hidden="true" className="text-[#A8782D] dark:text-[#E5BB70] motion-safe:animate-pulse" />}
                </span>
                <span className="-mt-1 max-w-full truncate text-xs font-medium">{displayName}{local ? ` · ${labels.you}` : ""}</span>
              </div>;
            })}
          </div>
        </div>
        {selectedPerson && participants.some(person => person.id === selectedPerson) && (
          <div className="mb-2 max-h-[35%] shrink-0 overflow-y-auto rounded-xl border border-border bg-card p-3">
            <p className="truncate font-semibold">{profiles[selectedPerson]?.username || participants.find(person => person.id === selectedPerson)?.name}</p>
            <button type="button" className="min-h-11 px-2 text-sm" onClick={() => {
              const next = new Set(localMutesRef.current);
              if (next.has(selectedPerson)) next.delete(selectedPerson);
              else next.add(selectedPerson);
              localMutesRef.current = next;
              setLocalMutes(next);
              const audio = audioNodes.current.get(selectedPerson);
              if (audio) audio.muted = next.has(selectedPerson);
            }}>{localMutes.has(selectedPerson)
              ? t("Restore audio for me", "Restaurar audio para mí", "Restaurar áudio para mim")
              : t("Mute for me", "Silenciar para mí", "Silenciar para mim")}</button>
            <button type="button" className="min-h-11 px-2 text-sm" aria-expanded={profileOpen} onClick={() => setProfileOpen(show => !show)}>
              {t("View profile", "Ver perfil", "Ver perfil")}
            </button>
            <button type="button" className="min-h-11 px-2 text-sm" disabled={reportStatus === "sending" || reportStatus === "sent"}
              onClick={() => setReportStatus("confirm")}>{t("Report", "Denunciar", "Denunciar")}</button>
            {nativePrayerAudio && <button type="button" className="min-h-11 px-2 text-sm" onClick={() => {
              const displayName = profiles[selectedPerson]?.username || participants.find(person => person.id === selectedPerson)?.name;
              if (displayName) {
                setContactError(false);
                void prayerAudioRoute.presentContact({ name: displayName }).catch(() => setContactError(true));
              }
            }}>{t("Add contact", "Agregar contacto", "Adicionar contato")}</button>}
            {contactError && <p role="alert" className="text-sm text-destructive">{t("Could not open Contacts", "No se pudo abrir Contactos", "Não foi possível abrir Contatos")}</p>}
            {profileOpen && (
              <div className="mb-1 flex items-center gap-2 rounded-lg bg-secondary p-2">
                {profiles[selectedPerson]?.avatar_url && <img src={profiles[selectedPerson].avatar_url!} alt="" className="size-10 rounded-full object-cover"
                  onError={event => { event.currentTarget.hidden = true; }} />}
                <span className="truncate text-sm">{profiles[selectedPerson]?.username || participants.find(person => person.id === selectedPerson)?.name}</span>
              </div>
            )}
            {reportStatus === "confirm" && <div className="flex flex-wrap items-center gap-2 text-sm">
              <p>{t("Send a report to Community moderators?", "¿Enviar un reporte a los moderadores de Community?", "Enviar uma denúncia aos moderadores da Community?")}</p>
              <button type="button" className="min-h-11 px-2 font-semibold text-destructive" onClick={async () => {
                setReportStatus("sending");
                try {
                  const { error } = await supabase.from("community_reports").insert({
                    reporter_id: userId, reported_user_id: selectedPerson, reason: "prayer_room_conduct",
                  });
                  setReportStatus(error ? "error" : "sent");
                } catch { setReportStatus("error"); }
              }}>{t("Send report", "Enviar reporte", "Enviar denúncia")}</button>
            </div>}
            {reportStatus === "sent" && <p role="status" className="text-sm">{t("Report sent", "Reporte enviado", "Denúncia enviada")}</p>}
            {reportStatus === "error" && <p role="alert" className="text-sm text-destructive">{t("Could not send the report", "No se pudo enviar el reporte", "Não foi possível enviar a denúncia")}</p>}
            <button type="button" className="min-h-11 px-2 text-sm" disabled={reportStatus === "sending"} onClick={() => setSelectedPerson(undefined)}>
              {t("Close", "Cerrar", "Fechar")}
            </button>
          </div>
        )}
        <footer className="relative mx-auto flex w-full max-w-[360px] shrink-0 items-center justify-between gap-1 rounded-full bg-secondary px-2 py-2 shadow-md sm:px-3"
          onClick={event => event.stopPropagation()}>
          {menu === "reactions" && <div className="absolute bottom-full left-1/2 z-10 mb-2 grid w-full -translate-x-1/2 grid-cols-6 gap-0.5 rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
            {(extraReactions ? EXTRA_REACTIONS : REACTIONS).map(emoji => <button type="button" key={emoji} className="grid min-h-11 min-w-0 place-items-center rounded-lg text-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                closeMenu();
                if (!connected || Date.now() - (reactionSentAt.current.get(userId) ?? 0) < 750) return;
                showReaction(userId, emoji);
                void channel.current?.send({ type: "broadcast", event: "reaction", payload: { from: userId, emoji } });
              }}>{emoji}</button>)}
            <button type="button" className="col-span-6 min-h-11 rounded-lg text-sm hover:bg-accent" onClick={() => setExtraReactions(value => !value)}>
              {extraReactions ? t("Back", "Volver", "Voltar") : t("More emojis", "Más emojis", "Mais emojis")}
            </button>
          </div>}
          {menu === "route" && <div className="absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-2xl border border-border bg-popover p-2 text-sm shadow-lg">
            <p className="px-2 py-1 font-semibold">{t("Audio output", "Salida de audio", "Saída de áudio")}</p>
            {routes?.options.map(route => {
              const Icon = route.kind === "automatic" ? Settings2 : route.kind === "phone" ? Smartphone : route.kind === "bluetooth" ? Bluetooth : route.kind === "headphones" ? Headphones : Volume2;
              const title = route.kind === "automatic" ? t("Automatic", "Automática", "Automática")
                : route.kind === "speaker" ? t("Speaker", "Altavoz", "Alto-falante")
                : route.kind === "headphones" ? t("Headphones", "Auriculares", "Fones de ouvido")
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
            aria-label={hand ? lowerHandLabel : labels.hand} onClick={toggleHand}><Hand size={19} /></button>
          <button type="button" className={control(muted ? "bg-muted text-muted-foreground ring-border" : activeTone)} disabled={!connected} aria-pressed={!muted}
            aria-label={muted ? labels.unmute : labels.mute} onClick={toggleMute}>{muted ? <MicOff size={19} /> : <Mic size={19} />}</button>
          <button type="button" className={control("bg-red-600 text-white ring-red-700 hover:bg-red-700")} aria-label={labels.leave} onClick={onClose}><Phone size={19} className="rotate-[135deg]" /></button>
        </footer>
      </section>
    </div>
  );
}
