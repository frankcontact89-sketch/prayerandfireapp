import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, User } from "lucide-react";

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

type Props = {
  url: string;
  mine?: boolean;
  avatar?: string | null;
  name?: string;
  time: string;
  errorLabel: string;
};

export default function AudioBubble({ url, mine, avatar, name, time, errorLabel }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setCur(0);
    setDur(0);
  }, [url]);

  const toggle = async () => {
    const a = ref.current;
    if (!a) return;
    try {
      if (a.paused) {
        await a.play();
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
    } catch {
      setFailed(true);
    }
  };

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const bars = 26;

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
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
          <div className={`text-xs ${mine ? "text-black/70" : "text-zinc-400"}`}>{errorLabel}</div>
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
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration;
          if (isFinite(d)) setDur(d);
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
        onError={() => setFailed(true)}
        className="hidden"
      />
    </div>
  );
}