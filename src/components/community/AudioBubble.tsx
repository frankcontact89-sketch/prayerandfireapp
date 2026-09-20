import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Pause, Play, User } from "lucide-react";

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/** True on Safari and on the iOS Capacitor WKWebView (whose UA has no "Safari" token). */
const noWebmSupport = (() => {
  if (typeof document === "undefined") return false;
  try {
    return document.createElement("audio").canPlayType("audio/webm") === "";
  } catch {
    return false;
  }
})();

/** Historic recordings were stored as *.webm even though the bytes are MP4/AAC. */
const looksWebm = (u: string) => /\.webm$/i.test(u.split("?")[0]);

/** Fetch the file and hand it to <audio> as a blob with the *real* MIME type. */
async function blobUrlWithRealMime(u: string): Promise<string | undefined> {
  const r = await fetch(u);
  if (!r.ok) return undefined;
  const buf = await r.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 12));
  const ftyp = String.fromCharCode(...head.slice(4, 8)) === "ftyp";
  const ebml = head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  const header = (r.headers.get("content-type") || "").split(";")[0].trim();
  const type = ftyp ? "audio/mp4" : ebml ? "audio/webm" : header || "audio/mp4";
  return URL.createObjectURL(new Blob([buf], { type }));
}

type Props = {
  url: string;
  mine?: boolean;
  avatar?: string | null;
  name?: string;
  time: string;
  errorLabel: string;
  /** Re-signs the private storage path and returns a fresh URL (expired links). */
  resolve?: () => Promise<string | undefined>;
  downloadLabel?: string;
  onPlayed?: () => void | Promise<void>;
  status?: "sent" | "delivered" | "read";
  seekLabel?: string;
  playLabel?: string;
  pauseLabel?: string;
};

export default function AudioBubble({ url, mine, avatar, name, time, errorLabel, resolve, downloadLabel, onPlayed, status, seekLabel = "Audio position", playLabel = "Play", pauseLabel = "Pause" }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState(url);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [failed, setFailed] = useState(false);\n  const [rate, setRate] = useState<1 | 1.5 | 2>(1);
  // 0 = original url, 1 = re-signed url, 2 = blob fallback, 3 = gave up
  const stage = useRef(0);
  const objUrl = useRef<string | null>(null);
  const wantPlay = useRef(false);
  const playedReported = useRef(false);
  const seeking = useRef(false);

  useEffect(() => {
    stage.current = 0;
    setSrc(url);
    setFailed(false);
    setCur(0);
    setDur(0);
    playedReported.current = false;
  }, [url]);

  // WebKit refuses files whose URL extension contradicts the container, so for
  // legacy ".webm" objects (real bytes are MP4/AAC) we pre-load a typed blob.
  useEffect(() => {
    let alive = true;
    if (!noWebmSupport || !looksWebm(url)) return;
    (async () => {
      try {
        const o = await blobUrlWithRealMime(url);
        if (!alive || !o) return;
        if (objUrl.current) URL.revokeObjectURL(objUrl.current);
        objUrl.current = o;
        stage.current = 2;
        setSrc(o);
        setFailed(false);
      } catch {
        /* the onError recovery chain still applies */
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);

  useEffect(
    () => () => {
      if (objUrl.current) URL.revokeObjectURL(objUrl.current);
    },
    []
  );

  /** Try the next recovery strategy instead of showing an error right away. */
  const recover = async () => {
    if (stage.current === 0 && resolve) {
      stage.current = 1;
      const fresh = await resolve();
      if (fresh) {
        setSrc(fresh);
        return;
      }
    }
    if (stage.current < 2) {
      stage.current = 2;
      try {
        const o = await blobUrlWithRealMime(src);
        if (o) {
          if (objUrl.current) URL.revokeObjectURL(objUrl.current);
          objUrl.current = o;
          setSrc(o);
          setFailed(false);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    stage.current = 3;
    setFailed(true);
  };

  const toggle = async () => {
    const a = ref.current;
    if (!a) return;
    try {
      if (a.paused) {
        wantPlay.current = true;
        await a.play();
        setPlaying(true);
      } else {
        wantPlay.current = false;
        a.pause();
        setPlaying(false);
      }
    } catch {
      recover();
    }
  };

  const cycleRate = () => {\n    const next: 1 | 1.5 | 2 = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;\n    setRate(next);\n    if (ref.current) ref.current.playbackRate = next;\n  };\n\n  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const bars = 26;

  const seekAt = (element: HTMLDivElement, clientX: number) => {
    const audio = ref.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setCur(audio.currentTime);
    setDur(audio.duration);
  };

  return (
    <div className="relative grid min-w-[236px] grid-cols-[44px_40px_minmax(0,1fr)] items-center gap-2.5">
      <div className={`h-11 w-11 overflow-hidden rounded-full shrink-0 grid place-items-center ring-1 ${mine ? "bg-foreground/10 text-foreground ring-foreground/10" : "bg-muted text-primary ring-border"}`}>
        {avatar ? (
          <img src={avatar} alt={name || ""} className="w-full h-full object-cover" />
        ) : name ? (
          <span className="font-black text-sm">{name[0]?.toUpperCase()}</span>
        ) : (
          <User className="w-5 h-5" />
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        data-message-swipe-control
        aria-label={playing ? pauseLabel : playLabel}
        className={`h-10 w-10 rounded-full grid place-items-center shrink-0 transition-transform active:scale-95 ${mine ? "bg-foreground/15 text-foreground" : "bg-primary text-primary-foreground"}`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        {failed ? (
          <div className={`text-xs ${mine ? "text-black/70" : "text-zinc-400"}`}>
            {errorLabel}
            {" · "}
            <a href={url} target="_blank" rel="noreferrer" className="underline">
              {downloadLabel || "open"}
            </a>
          </div>
        ) : (
          <div
            data-message-gesture-ignore
            role="slider"
            tabIndex={0}
            aria-label={seekLabel}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.floor(dur))}
            aria-valuenow={Math.max(0, Math.floor(cur))}
            className="flex h-9 touch-none cursor-pointer items-center gap-[2px] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onPointerDown={(event) => {
              event.stopPropagation();
              seeking.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              seekAt(event.currentTarget, event.clientX);
            }}
            onPointerMove={(event) => {
              if (!seeking.current) return;
              event.stopPropagation();
              seekAt(event.currentTarget, event.clientX);
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              seeking.current = false;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              event.stopPropagation();
              seeking.current = false;
            }}
            onKeyDown={(event) => {
              const audio = ref.current;
              if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              const next = Math.max(0, Math.min(audio.duration, audio.currentTime + (event.key === "ArrowRight" ? 5 : -5)));
              audio.currentTime = next;
              setCur(next);
            }}
          >
            {Array.from({ length: bars }).map((_, i) => {
              const active = (i / bars) * 100 <= pct;
              const h = 6 + ((i * 7) % 16);
              return (
                <span
                  key={i}
                  style={{ height: h }}
                    className={`w-[3px] rounded-full transition-colors ${
                    active ? (mine ? "bg-foreground" : "bg-primary") : mine ? "bg-foreground/25" : "bg-muted-foreground/50"
                  }`}
                />
              );
            })}
          </div>
        )}
        <div className={`mt-0.5 flex items-center justify-between gap-2 text-xs leading-none ${mine ? "text-foreground/65" : "text-muted-foreground"}`}>
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              data-message-gesture-ignore
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); cycleRate(); }}
              aria-label={`Playback speed ${rate}x`}
              className={`h-7 min-w-10 rounded-full px-2 text-[11px] font-black ${mine ? "bg-black/15 text-foreground" : "bg-muted text-foreground"}`}
            >
              {rate}x
            </button>
            <span className="tabular-nums">{fmt(cur)} / {fmt(dur)}</span>
          </div>
          <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
            {time}
            {mine && status === "read" && <CheckCheck className="h-4 w-4 text-sky-700" />}
            {mine && status === "delivered" && <CheckCheck className="h-4 w-4 text-foreground/50" />}
            {mine && (!status || status === "sent") && <Check className="h-4 w-4 text-foreground/50" />}
          </span>
        </div>
      </div>

      <audio
        ref={ref}
        src={src}
        preload="metadata"
        playsInline
        onCanPlay={() => {
          if (wantPlay.current && ref.current?.paused) ref.current.play().then(() => setPlaying(true)).catch(() => {});
        }}
        onPlay={() => { if (ref.current) ref.current.playbackRate = rate; setPlaying(true); if (!playedReported.current) { playedReported.current = true; Promise.resolve(onPlayed?.()).catch(() => {}); } }}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration;
          if (isFinite(d) && d > 0) setDur(d);
          else {
            // Streamed webm/mp4 recordings report Infinity until seeked to the end.
            const a = e.target as HTMLAudioElement;
            const onDur = () => {
              if (isFinite(a.duration) && a.duration > 0) {
                setDur(a.duration);
                a.currentTime = 0;
                a.removeEventListener("durationchange", onDur);
              }
            };
            a.addEventListener("durationchange", onDur);
            try {
              a.currentTime = 1e6;
            } catch {
              /* ignore */
            }
          }
        }}
        onTimeUpdate={(e) => {
          const a = e.target as HTMLAudioElement;
          setCur(a.currentTime);
          if (!isFinite(dur) || dur === 0) {
            if (isFinite(a.duration)) setDur(a.duration);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setCur(0);
        }}
        onError={() => recover()}
        // display:none can stop playback in some WKWebView builds — hide visually instead.
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}