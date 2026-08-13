import React from "react";
import { ArrowLeft, Clock, Lock, ShieldX } from "lucide-react";
import type { Words } from "./i18n";

type Props = {
  t: Words;
  status: "none" | "pending" | "rejected";
  busy: boolean;
  onRequest: () => void;
  onBack: () => void;
};

export default function AccessGate({ t, status, busy, onRequest, onBack }: Props) {
  const Icon = status === "pending" ? Clock : status === "rejected" ? ShieldX : Lock;
  const title = status === "pending" ? t.pendingTitle : status === "rejected" ? t.rejectedTitle : t.privateTitle;
  const body = status === "pending" ? t.pendingBody : status === "rejected" ? t.rejectedBody : t.privateBody;

  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="shrink-0 h-16 px-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onBack} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="text-[10px] tracking-[.2em] text-orange-400 font-bold">PRAYER &amp; FIRE</div>
          <h1 className="text-xl font-black">{t.title}</h1>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-8 text-center">
        <div className="max-w-sm">
          <div className="w-20 h-20 rounded-full bg-orange-500/10 text-orange-500 grid place-items-center mx-auto mb-6">
            <Icon className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="text-zinc-400 mt-3 leading-relaxed">{body}</p>
          {status === "none" && (
            <button
              onClick={onRequest}
              disabled={busy}
              className="mt-8 w-full h-14 rounded-2xl bg-orange-500 text-black font-black disabled:opacity-60"
            >
              {busy ? t.requesting : t.requestAccess}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}