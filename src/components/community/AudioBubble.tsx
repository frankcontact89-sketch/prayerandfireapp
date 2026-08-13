import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, User } from "lucide-react";

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
};

export default function AudioBubble({ url, mine, avatar, name, time, errorLabel, resolve, downloadLabel }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState(url);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [failed, setFailed] = useState(false);
  // 0 = original url, 1 = re-signed url, 2 = blob fallback, 3 = gave up
  const stage = useRef(0);
  const objUrl = useRef<string | null>(null);
  const wantPlay = useRef(false);

  useEffect(() => {
    stage.current = 0;
    setSrc(url);
    setFailed(false);
    setCur(0);
    setDur(0);
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

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const bars = 26;

  return (
    <div className="relative flex items-center gap-3 min-w-[220px]">
      <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 grid place-items-center ${mine ? "bg-black/20 text-black" : "bg-zinc-800 text-orange-400"}`}>
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
        aria-label={playing ? "Pause" : "Play"}
        className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${mine ? "bg-black/20 text-black" : "bg-orange-500 text-black"}`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-[2px]" />}
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
          <div className="flex items-end gap-[2px] h-6">
            {Array.from({ length: bars }).map((_, i) => {
              const active = (i / bars) * 100 <= pct;
              const h = 6 + ((i * 7) % 16);
              return (
                <span
                  key={i}
                  style={{ height: h }}
                  className={`w-[3px] rounded-full transition-colors ${
                    active ? (mine ? "bg-black" : "bg-orange-500") : mine ? "bg-black/25" : "bg-zinc-600"
                  }`}
                />
              );
            })}
          </div>
        )}
        <div className={`flex justify-between text-[10px] mt-1 ${mine ? "text-black/70" : "text-zinc-400"}`}>
          <span>{fmt(playing || cur > 0 ? cur : dur)}</span>
          <span>{time}</span>
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
        onPlay={() => setPlaying(true)}
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