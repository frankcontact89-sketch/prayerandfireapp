import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, ShieldCheck, ShieldMinus, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Words } from "./i18n";

const db: any = supabase;

type Row = { id: string; user_id: string; status: string; created_at: string; name: string; email?: string | null; avatar?: string | null };
type AdminRow = { user_id: string; role: string; name: string; avatar?: string | null };

type Props = { t: Words; meId: string; isOwner: boolean; onClose: () => void; onChanged: () => void };

export default function CommunityAdminPanel({ t, meId, isOwner, onClose, onChanged }: Props) {
  const [tab, setTab] = useState<"requests" | "admins">("requests");
  const [rows, setRows] = useState<Row[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AdminRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: reqs } = await db
      .from("community_access_requests")
      .select("id,user_id,status,created_at")
      .order("created_at", { ascending: false });
    const { data: ads } = await db.from("community_admins").select("user_id,role");
    const ids = Array.from(new Set([...(reqs || []).map((r: any) => r.user_id), ...(ads || []).map((a: any) => a.user_id)]));
    const { data: profs } = ids.length
      ? await db.from("profiles").select("id,username,email,avatar_url").in("id", ids)
      : { data: [] };
    const pm = new Map((profs || []).map((p: any) => [p.id, p]));
    const nameOf = (id: string) => {
      const p: any = pm.get(id);
      return p?.username || p?.email?.split("@")[0] || "Prayer & Fire Member";
    };
    setRows(
      (reqs || [])
        .filter((r: any) => r.status === "pending")
        .map((r: any) => ({ ...r, name: nameOf(r.user_id), email: (pm.get(r.user_id) as any)?.email, avatar: (pm.get(r.user_id) as any)?.avatar_url }))
    );
    setAdmins((ads || []).map((a: any) => ({ ...a, name: nameOf(a.user_id), avatar: (pm.get(a.user_id) as any)?.avatar_url })));
    setApprovedUsers(
      (reqs || [])
        .filter((r: any) => r.status === "approved" && !(ads || []).some((a: any) => a.user_id === r.user_id))
        .map((r: any) => ({ user_id: r.user_id, role: "member", name: nameOf(r.user_id), avatar: (pm.get(r.user_id) as any)?.avatar_url }))
    );
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("community-admin-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_access_requests" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_admins" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    await db.from("community_access_requests").update({ status, reviewed_by: meId, reviewed_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    await load();
    onChanged();
  };

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setBusy(userId);
    if (makeAdmin) await db.from("community_admins").insert({ user_id: userId, role: "admin", granted_by: meId });
    else await db.from("community_admins").delete().eq("user_id", userId).neq("role", "owner");
    setBusy(null);
    await load();
    onChanged();
  };

  const Avatar = ({ src, name }: { src?: string | null; name: string }) => (
    <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 grid place-items-center text-orange-400 shrink-0">
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : name ? <span className="font-black">{name[0]?.toUpperCase()}</span> : <User className="w-5 h-5" />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-[#080808] text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <header className="shrink-0 h-16 px-3 flex items-center gap-3 border-b border-white/10 bg-black/95">
        <button onClick={onClose} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <b className="flex-1 truncate">{tab === "requests" ? t.requestsPanel : t.manageAdmins}</b>
      </header>

      {isOwner && (
        <div className="shrink-0 flex gap-2 px-4 py-3">
          {(["requests", "admins"] as const).map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${tab === x ? "bg-orange-500 text-black border-orange-400" : "bg-zinc-950 border-white/10 text-zinc-300"}`}
            >
              {x === "requests" ? t.requestsPanel : t.manageAdmins}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-10">
        {tab === "requests" ? (
          rows.length === 0 ? (
            <p className="text-center text-zinc-500 py-16">{t.noRequests}</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/10">
                <Avatar src={r.avatar} name={r.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{r.name}</div>
                  {r.email && <div className="text-xs text-zinc-500 truncate">{r.email}</div>}
                </div>
                <button disabled={busy === r.id} onClick={() => review(r.id, "approved")} aria-label={t.approve} className="w-10 h-10 rounded-full bg-orange-500 text-black grid place-items-center">
                  <Check className="w-5 h-5" />
                </button>
                <button disabled={busy === r.id} onClick={() => review(r.id, "rejected")} aria-label={t.reject} className="w-10 h-10 rounded-full bg-zinc-900 text-red-400 grid place-items-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )
        ) : (
          <>
            {admins.map((a) => (
              <div key={a.user_id} className="flex items-center gap-3 py-3 border-b border-white/10">
                <Avatar src={a.avatar} name={a.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{a.name}</div>
                  <div className="text-xs text-orange-400 flex items-center gap-1">
                    {a.role === "owner" ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {a.role === "owner" ? t.owner : t.admin}
                  </div>
                </div>
                {a.role !== "owner" && (
                  <button disabled={busy === a.user_id} onClick={() => toggleAdmin(a.user_id, false)} aria-label={t.removeAdmin} className="w-10 h-10 rounded-full bg-zinc-900 text-red-400 grid place-items-center">
                    <ShieldMinus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold pt-6 pb-2">{t.approved}</div>
            {approvedUsers.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 py-3 border-b border-white/10">
                <Avatar src={u.avatar} name={u.name} />
                <div className="flex-1 min-w-0 font-semibold truncate">{u.name}</div>
                <button disabled={busy === u.user_id} onClick={() => toggleAdmin(u.user_id, true)} className="px-3 h-10 rounded-full bg-orange-500/15 text-orange-300 text-xs font-bold border border-orange-500/30">
                  {t.makeAdmin}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}