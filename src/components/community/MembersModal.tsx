import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Crown, Search, ShieldCheck, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Words } from "./i18n";

const db: any = supabase;

type P = { id: string; name: string; email?: string | null; avatar?: string | null; role?: string };
type Props = { t: Words; groupId: string; mode: "add" | "admins"; canManage: boolean; onClose: () => void; onChanged: () => void };

export default function MembersModal({ t, groupId, mode, canManage, onClose, onChanged }: Props) {
  const [list, setList] = useState<P[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: mems } = await db.from("community_group_members").select("user_id,role").eq("group_id", groupId);
    const memberIds = (mems || []).map((m: any) => m.user_id);

    if (mode === "admins") {
      const { data: profs } = memberIds.length ? await db.from("profiles").select("id,username,email,avatar_url").in("id", memberIds) : { data: [] };
      const pm = new Map((profs || []).map((p: any) => [p.id, p]));
      setList(
        (mems || []).map((m: any) => {
          const p: any = pm.get(m.user_id) || {};
          return { id: m.user_id, name: p.username || p.email?.split("@")[0] || "Member", email: p.email, avatar: p.avatar_url, role: m.role };
        })
      );
      setLoading(false);
      return;
    }

    const { data: reqs } = await db.from("community_access_requests").select("user_id").eq("status", "approved");
    const { data: ads } = await db.from("community_admins").select("user_id");
    const eligible = Array.from(new Set([...(reqs || []).map((r: any) => r.user_id), ...(ads || []).map((a: any) => a.user_id)])).filter(
      (id) => !memberIds.includes(id)
    );
    let profs: any[] = [];
    if (eligible.length) {
      const res = await db.from("profiles").select("id,username,email,avatar_url").in("id", eligible);
      profs = res.data || [];
    }
    if (!profs.length && eligible.length) {
      // profile rows unreadable/missing: still allow adding by user id
      profs = eligible.map((id) => ({ id, username: null, email: null, avatar_url: null }));
    }
    setList(profs.map((p: any) => ({ id: p.id, name: p.username || p.email?.split("@")[0] || "Member", email: p.email, avatar: p.avatar_url })));
    setLoading(false);
  }, [groupId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) => p.name.toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s));
  }, [list, q]);

  const addMembers = async () => {
    if (!chosen.length || !canManage) return;
    setBusy(true);
    const { error } = await db.from("community_group_members").insert(chosen.map((id) => ({ group_id: groupId, user_id: id, role: "member" })));
    setBusy(false);
    if (error) return;
    onChanged();
    onClose();
  };

  const setRole = async (userId: string, role: string) => {
    if (!canManage) return;
    await db.from("community_group_members").update({ role }).eq("group_id", groupId).eq("user_id", userId);
    await load();
    onChanged();
  };
  const remove = async (userId: string) => {
    if (!canManage) return;
    await db.from("community_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#080808] text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <header className="shrink-0 h-16 px-3 flex items-center gap-3 border-b border-white/10 bg-black/95">
        <button onClick={onClose} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <b className="flex-1 truncate">{mode === "add" ? t.addMembers : t.admins}</b>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-28">
        <div className="sticky top-0 bg-[#080808] py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="w-full h-11 rounded-xl bg-zinc-900 border border-white/10 pl-9 pr-3 outline-none text-sm" />
          </div>
        </div>
        {loading && <div className="py-10 text-center text-zinc-500 text-sm">…</div>}
        {!loading && !filtered.length && <div className="py-10 text-center text-zinc-500 text-sm">{mode === "add" ? t.noResults : t.noResults}</div>}
        {filtered.map((p) => {
          const active = chosen.includes(p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/10">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 grid place-items-center text-orange-400 shrink-0">
                {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.name ? <span className="font-black">{p.name[0]?.toUpperCase()}</span> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                {mode === "admins" ? (
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    {p.role === "owner" ? <Crown className="w-3 h-3 text-orange-400" /> : p.role === "admin" ? <ShieldCheck className="w-3 h-3 text-orange-400" /> : null}
                    {p.role === "owner" ? t.owner : p.role === "admin" ? t.admin : t.member}
                  </div>
                ) : (
                  p.email && <div className="text-xs text-zinc-500 truncate">{p.email}</div>
                )}
              </div>

              {mode === "add" ? (
                <button
                  onClick={() => setChosen((v) => (active ? v.filter((x) => x !== p.id) : [...v, p.id]))}
                  className={`w-7 h-7 rounded-full border grid place-items-center ${active ? "bg-orange-500 border-orange-500 text-black" : "border-zinc-600"}`}
                  aria-label={p.name}
                >
                  {active && <Check className="w-4 h-4" />}
                </button>
              ) : (
                canManage &&
                p.role !== "owner" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRole(p.id, p.role === "admin" ? "member" : "admin")}
                      className="px-3 h-9 rounded-full bg-orange-500/15 text-orange-300 text-xs font-bold border border-orange-500/30"
                    >
                      {p.role === "admin" ? t.removeAdmin : t.makeAdmin}
                    </button>
                    <button onClick={() => remove(p.id)} aria-label={t.delete} className="w-9 h-9 rounded-full bg-zinc-900 text-red-400 grid place-items-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {mode === "add" && (
        <div className="shrink-0 p-4 border-t border-white/10 bg-black">
          <button onClick={addMembers} disabled={!chosen.length || busy} className="w-full h-14 rounded-2xl bg-orange-500 text-black font-black disabled:bg-zinc-800 disabled:text-zinc-500">
            {t.addMembers} {chosen.length ? `(${chosen.length})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}