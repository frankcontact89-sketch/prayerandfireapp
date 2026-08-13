import React, { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Send, Trash2 } from "lucide-react";
import type { Words } from "./i18n";

export function pickAudioMime(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/mpeg", ext: "mp3" },
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  const MR: any = typeof window !== "undefined" ? (window as any).MediaRecorder : undefined;
  for (const c of candidates) {
    if (MR && typeof MR.isTypeSupported === "function" && MR.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "m4a" };
}

/** Extension that always matches the real container the recorder produced. */
export function extForMime(type?: string | null): string {
  const m = (type || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("webm")) return "webm";
  return "m4a";
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const MAX_SECONDS = 20 * 60;

type Props = { t: Words; onSend: (file: File) => Promise<void> | void; onClose: () => void };

export default function VoiceRecorder({ t, onSend, onClose }: Props) {
  const [secs, setSecs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState<number[]>(Array(24).fill(4));
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const cancelled = useRef(false);
  const ext = useRef("m4a");
  const raf = useRef<number | null>(null);
  const ctx = useRef<AudioContext | null>(null);

  const cleanup = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((x) => x.stop());
    ctx.current?.close().catch(() => {});
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!alive) {
          s.getTracks().forEach((x) => x.stop());
          return;
        }
        stream.current = s;
        const picked = pickAudioMime();
        ext.current = picked.ext;
        const r = picked.mime ? new MediaRecorder(s, { mimeType: picked.mime }) : new MediaRecorder(s);
        chunks.current = [];
        r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        r.onstop = async () => {
          cleanup();
          if (cancelled.current) {
            onClose();
            return;
          }
          const type = r.mimeType || picked.mime || "audio/mp4";
          // Never trust the pre-flight guess: the real container wins so the
          // filename extension and the Content-Type always agree.
          ext.current = extForMime(type);
          const blob = new Blob(chunks.current, { type });
          const file = new File([blob], `voice-${Date.now()}.${ext.current}`, { type });
          setBusy(true);
          try {
            await onSend(file);
          } finally {
            onClose();
          }
        };
        rec.current = r;
        r.start(250);

        // live level meter
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AC) {
          const ac: AudioContext = new AC();
          ctx.current = ac;
          const an = ac.createAnalyser();
          an.fftSize = 256;
          ac.createMediaStreamSource(s).connect(an);
          const buf = new Uint8Array(an.frequencyBinCount);
          const tick = () => {
            an.getByteFrequencyData(buf);
            const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
            setLevel((prev) => [...prev.slice(1), Math.max(4, Math.min(24, (avg / 255) * 40))]);
            raf.current = requestAnimationFrame(tick);
          };
          raf.current = requestAnimationFrame(tick);
        }
      } catch {
        onClose();
      }
    })();
    return () => {
      alive = false;
      cancelled.current = true;
      try {
        if (rec.current && rec.current.state !== "inactive") rec.current.stop();
      } catch {}
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (rec.current?.state !== "recording") return;
      setSecs((s) => {
        const n = s + 1;
        if (n >= MAX_SECONDS) {
          cancelled.current = false;
          try {
            rec.current?.stop();
          } catch {
            /* ignore */
          }
        }
        return n;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stopAndSend = () => {
    cancelled.current = false;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  };
  const cancel = () => {
    cancelled.current = true;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
    else onClose();
  };
  const togglePause = () => {
    const r = rec.current;
    if (!r) return;
    if (r.state === "recording") {
      r.pause();
      setPaused(true);
    } else if (r.state === "paused") {
      r.resume();
      setPaused(false);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <button onClick={cancel} aria-label={t.cancel} className="w-11 h-11 rounded-full bg-zinc-900 text-red-400 grid place-items-center shrink-0">
        <Trash2 className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0 h-11 rounded-full bg-zinc-900 border border-red-500/40 px-3 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 ${paused ? "" : "animate-pulse"}`} />
        <Mic className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm tabular-nums text-red-300 shrink-0">{fmt(secs)}</span>
        <div className="flex-1 min-w-0 flex items-center gap-[2px] overflow-hidden h-6">
          {level.map((h, i) => (
            <span key={i} style={{ height: paused ? 4 : h }} className="w-[3px] rounded-full bg-orange-500/80" />
          ))}
        </div>
        <button onClick={togglePause} aria-label={paused ? t.resume : t.pause} className="w-8 h-8 rounded-full bg-black/40 text-orange-400 grid place-items-center shrink-0">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
      <button
        onClick={stopAndSend}
        disabled={busy}
        aria-label={t.send}
        className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center shrink-0 disabled:opacity-60"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}