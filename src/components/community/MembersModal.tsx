import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Crown, Mail, Search, ShieldCheck, Trash2, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Words } from "./i18n";

const db: any = supabase;

type P = { id: string; name: string; email?: string | null; avatar?: string | null; role?: string };
type Invite = { id: string; email: string; full_name: string | null };
type Props = { t: Words; groupId: string; mode: "add" | "admins"; canManage: boolean; onClose: () => void; onChanged: () => void };

export default function MembersModal({ t, groupId, mode, canManage, onClose, onChanged }: Props) {
  const [list, setList] = useState<P[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<P | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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
    if (!profs.length && eligible.length) profs = eligible.map((id) => ({ id, username: null, email: null, avatar_url: null }));
    setList(profs.map((p: any) => ({ id: p.id, name: p.username || p.email?.split("@")[0] || "Member", email: p.email, avatar: p.avatar_url })));

    const { data: inv } = await db.from("community_group_invites").select("id,email,full_name").eq("group_id", groupId).eq("status", "pending");
    setInvites(inv || []);
    setLoading(false);
  }, [groupId, mode]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) => p.name.toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s));
  }, [list, q]);

  const addMembers = async () => {
    if (!chosen.length || !canManage) return;
    setBusy(true);
    const { error } = await db.from("community_group_members").upsert(
      chosen.map((id) => ({ group_id: groupId, user_id: id, role: "member" })),
      { onConflict: "group_id,user_id", ignoreDuplicates: true }
    );
    setBusy(false);
    if (error) { setMsg({ kind: "err", text: error.message }); return; }
    setChosen([]);
    setMsg({ kind: "ok", text: t.addedMembers });
    await load();
    onChanged();
  };

  const sendInvite = async () => {
    if (!canManage || busy) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setMsg({ kind: "err", text: t.invalidEmail }); return; }
    setBusy(true);
    const { data, error } = await db.rpc("invite_group_member_by_email", { _group_id: groupId, _email: email, _full_name: inviteName.trim() || null });
    setBusy(false);
    if (error) { setMsg({ kind: "err", text: error.message.includes("NO_PERMISSION") ? t.noPermission : error.message }); return; }
    setInviteName(""); setInviteEmail(""); setShowInvite(false);
    setMsg({ kind: "ok", text: data === "added" ? t.memberAdded : data === "already_member" ? t.alreadyMemberMsg : t.inviteSent });
    await load();
    onChanged();
  };

  const cancelInvite = async (id: string) => {
    await db.from("community_group_invites").delete().eq("id", id);
    await load();
  };

  const setRole = async (userId: string, role: string) => {
    if (!canManage) return;
    const { error } = await db.from("community_group_members").update({ role }).eq("group_id", groupId).eq("user_id", userId);
    if (error) { setMsg({ kind: "err", text: t.noPermission }); return; }
    await load();
    onChanged();
  };

  const remove = async (userId: string) => {
    if (!canManage) return;
    const { error } = await db.from("community_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    setConfirmRemove(null);
    if (error) { setMsg({ kind: "err", text: t.noPermission }); return; }
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#080808] text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="shrink-0 h-14 px-3 flex items-center gap-3 border-b border-white/10 bg-black">
        <button onClick={onClose} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center"><ArrowLeft className="w-5 h-5" /></button>
        <b className="flex-1 truncate">{mode === "add" ? t.addMembers : `${t.members} & ${t.admins}`}</b>
      </header>

      <div className="shrink-0 px-4 pt-3 pb-2 bg-[#080808]">
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPeople} className="w-full h-11 rounded-xl bg-zinc-900 border border-white/10 pl-9 pr-3 outline-none text-sm" /></div>
        {mode === "add" && <button onClick={() => setShowInvite((v) => !v)} className="mt-3 w-full h-11 rounded-xl bg-zinc-900 border border-orange-500/30 text-orange-300 text-sm font-bold flex items-center justify-center gap-2"><Mail className="w-4 h-4" />{t.inviteByEmail}</button>}
        {mode === "add" && showInvite && <div className="mt-3 rounded-2xl bg-zinc-950 border border-white/10 p-3">
          <p className="text-xs text-zinc-500">{t.inviteHint}</p>
          <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder={t.fullName} className="mt-2 w-full h-11 rounded-xl bg-zinc-900 border border-white/10 px-3 outline-none text-sm" />
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} inputMode="email" autoCapitalize="none" placeholder={t.emailLabel} className="mt-2 w-full h-11 rounded-xl bg-zinc-900 border border-white/10 px-3 outline-none text-sm" />
          <button onClick={sendInvite} disabled={busy} className="mt-3 w-full h-11 rounded-xl bg-orange-500 text-black font-black disabled:bg-zinc-800 disabled:text-zinc-500">{t.sendInvite}</button>
        </div>}
        {msg && <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${msg.kind === "ok" ? "bg-orange-500/10 text-orange-300" : "bg-red-500/10 text-red-300"}`}><span className="flex-1">{msg.text}</span><button onClick={() => setMsg(null)} aria-label={t.cancel}><X className="w-3.5 h-3.5" /></button></div>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4" style={{ paddingBottom: mode === "add" ? "8px" : "calc(24px + env(safe-area-inset-bottom))" }}>
        {mode === "add" && <div className="pt-1 pb-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">{t.availablePeople}</div>}
        {loading && <div className="py-8 text-center text-zinc-500 text-sm">…</div>}
        {!loading && !filtered.length && <div className="py-8 text-center text-zinc-500 text-sm">{t.noResults}</div>}
        {filtered.map((p) => {
          const active = chosen.includes(p.id);
          return <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 grid place-items-center text-orange-400 shrink-0">{p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.name ? <span className="font-black text-sm">{p.name[0]?.toUpperCase()}</span> : <User className="w-5 h-5" />}</div>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{p.name}</div>{mode === "admins" ? <div className="text-[11px] text-zinc-400 flex items-center gap-1">{p.role === "owner" ? <Crown className="w-3 h-3 text-orange-400" /> : p.role === "admin" ? <ShieldCheck className="w-3 h-3 text-orange-400" /> : null}{p.role === "owner" ? t.owner : p.role === "admin" ? t.admin : t.member}</div> : p.email && <div className="text-[11px] text-zinc-500 truncate">{p.email}</div>}</div>
            {mode === "add" ? <button onClick={() => setChosen((v) => (active ? v.filter((x) => x !== p.id) : [...v, p.id]))} className={`w-7 h-7 rounded-full border grid place-items-center shrink-0 ${active ? "bg-orange-500 border-orange-500 text-black" : "border-zinc-600"}`} aria-label={p.name}>{active && <Check className="w-4 h-4" />}</button> : canManage && p.role !== "owner" && <div className="flex gap-2 shrink-0"><button onClick={() => setRole(p.id, p.role === "admin" ? "member" : "admin")} className="px-3 h-9 rounded-full bg-orange-500/15 text-orange-300 text-xs font-bold border border-orange-500/30">{p.role === "admin" ? t.removeAdmin : t.makeAdmin}</button><button onClick={() => setConfirmRemove(p)} aria-label={t.delete} className="w-9 h-9 rounded-full bg-zinc-900 text-red-400 grid place-items-center"><Trash2 className="w-4 h-4" /></button></div>}
          </div>;
        })}

        {mode === "add" && invites.length > 0 && <>
          <div className="pt-5 pb-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">{t.pendingInvites}</div>
          {invites.map((i) => <div key={i.id} className="flex items-center gap-3 py-2.5 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center text-orange-400 shrink-0"><Mail className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{i.full_name || i.email}</div><div className="text-[11px] text-zinc-500 truncate">{i.email} · {t.pendingInvitation}</div></div>
            {canManage && <button onClick={() => cancelInvite(i.id)} aria-label={t.cancelInvite} className="w-9 h-9 rounded-full bg-zinc-900 text-red-400 grid place-items-center shrink-0"><Trash2 className="w-4 h-4" /></button>}
          </div>)}
        </>}
      </div>

      {mode === "add" && <div className="shrink-0 px-4 pt-3 border-t border-white/10 bg-black" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}><button onClick={addMembers} disabled={!chosen.length || busy} className="w-full h-13 py-4 rounded-2xl bg-orange-500 text-black font-black disabled:bg-zinc-800 disabled:text-zinc-500">{t.addMembers}{chosen.length ? ` (${chosen.length})` : ""}</button></div>}

      {confirmRemove && <div className="fixed inset-0 z-[140] bg-black/80 grid place-items-center px-8" onClick={() => setConfirmRemove(null)}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.removeMember}</b><p className="mt-2 text-sm text-zinc-400">{confirmRemove.name}</p><div className="mt-6 flex gap-3"><button onClick={() => setConfirmRemove(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={() => remove(confirmRemove.id)} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black">{t.delete}</button></div></div></div>}
    </div>
  );
}
