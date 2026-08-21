import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Crown, Link, Mail, Phone, Search, ShieldCheck, Trash2, User, X } from "lucide-react";
import { Share } from "@capacitor/share";
import { supabase } from "@/integrations/supabase/client";
import type { Words } from "./i18n";

const db: any = supabase;

type Person = {
  id: string;
  displayName: string;
  username?: string | null;
  avatar?: string | null;
  role?: string;
};
type Invite = { id: string; full_name: string | null };
type Props = {
  t: Words;
  groupId: string;
  mode: "add" | "admins";
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export default function MembersModal({ t, groupId, mode, canManage, onClose, onChanged }: Props) {
  const [list, setList] = useState<Person[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<Person | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const toPerson = (profile: any, role?: string): Person => ({
    id: profile.id,
    displayName: profile.username || "Prayer & Fire Member",
    username: profile.username,
    avatar: profile.avatar_url,
    role,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: mems } = await db
      .from("community_group_members")
      .select("user_id,role")
      .eq("group_id", groupId);
    const memberIds = (mems || []).map((member: any) => member.user_id);

    if (mode === "admins") {
      const { data: profiles } = memberIds.length
        ? await db.from("profiles").select("id,username,avatar_url").in("id", memberIds)
        : { data: [] };
      const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      setList(
        (mems || []).map((member: any) =>
          toPerson(profileById.get(member.user_id) || { id: member.user_id }, member.role),
        ),
      );
      setLoading(false);
      return;
    }

    const { data: requests } = await db
      .from("community_access_requests")
      .select("user_id")
      .eq("status", "approved");
    const { data: admins } = await db.from("community_admins").select("user_id");
    const eligible = Array.from(
      new Set([
        ...(requests || []).map((request: any) => request.user_id),
        ...(admins || []).map((admin: any) => admin.user_id),
      ]),
    ).filter((id) => !memberIds.includes(id));

    let profiles: any[] = [];
    if (eligible.length) {
      const result = await db
        .from("profiles")
        .select("id,username,avatar_url")
        .in("id", eligible);
      profiles = result.data || [];
    }
    if (!profiles.length && eligible.length) {
      profiles = eligible.map((id) => ({ id, username: null, avatar_url: null }));
    }
    setList(profiles.map((profile: any) => toPerson(profile)));

    // Email remains a temporary delivery mechanism, but recipient addresses never return to the client.
    const { data: pendingInvites } = await db
      .from("community_group_invites")
      .select("id,full_name")
      .eq("group_id", groupId)
      .eq("status", "pending");
    setInvites(pendingInvites || []);
    setLoading(false);
  }, [groupId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return list;
    return list.filter((person) =>
      `${person.displayName} ${person.username || ""}`
        .toLowerCase()
        .includes(search),
    );
  }, [list, q]);

  const addMembers = async () => {
    if (!chosen.length || !canManage) return;
    setBusy(true);
    const { error } = await db.from("community_group_members").upsert(
      chosen.map((id) => ({ group_id: groupId, user_id: id, role: "member" })),
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    setChosen([]);
    setMsg({ kind: "ok", text: t.addedMembers });
    await load();
    onChanged();
  };

  const sendInvite = async () => {
    if (!canManage || busy) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMsg({ kind: "err", text: t.invalidEmail });
      return;
    }
    setBusy(true);
    const { data, error } = await db.rpc("invite_group_member_by_email", {
      _group_id: groupId,
      _email: email,
      _full_name: inviteName.trim() || null,
    });
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.message.includes("NO_PERMISSION") ? t.noPermission : error.message });
      return;
    }
    setInviteName("");
    setInviteEmail("");
    setShowInvite(false);
    setMsg({
      kind: "ok",
      text: data === "added" ? t.memberAdded : data === "already_member" ? t.alreadyMemberMsg : t.inviteSent,
    });
    await load();
    onChanged();
  };

  const shareInvitationLink = async () => {
    // This is a non-privileged Community entry link. It does not expose group data or grant access.
    const url = "https://prayerandfire.org";
    try {
      await Share.share({
        title: "Prayer & Fire Community",
        text: "Join me in Prayer & Fire Community. Request access to connect, pray, and grow together.",
        url,
        dialogTitle: t.shareInvitationLink,
      });
      setMsg({ kind: "ok", text: t.invitationLinkShared });
    } catch {
      try {
        if (navigator.share) {
          await navigator.share({ title: "Prayer & Fire Community", url });
          setMsg({ kind: "ok", text: t.invitationLinkShared });
          return;
        }
        await navigator.clipboard.writeText(url);
        setMsg({ kind: "ok", text: t.invitationLinkShared });
      } catch {
        setMsg({ kind: "err", text: t.noPermission });
      }
    }
  };

  const cancelInvite = async (id: string) => {
    await db.from("community_group_invites").delete().eq("id", id);
    await load();
  };

  const setRole = async (userId: string, role: string) => {
    if (!canManage) return;
    const { error } = await db
      .from("community_group_members")
      .update({ role })
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) {
      setMsg({ kind: "err", text: t.noPermission });
      return;
    }
    await load();
    onChanged();
  };

  const remove = async (userId: string) => {
    if (!canManage) return;
    const { error } = await db
      .from("community_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    setConfirmRemove(null);
    if (error) {
      setMsg({ kind: "err", text: t.noPermission });
      return;
    }
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#080808] text-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-black px-3">
        <button onClick={onClose} aria-label={t.back} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-900"><ArrowLeft className="h-5 w-5" /></button>
        <b className="flex-1 truncate">{mode === "add" ? t.addMembers : `${t.members} & ${t.admins}`}</b>
      </header>

      <div className="shrink-0 bg-[#080808] px-4 pb-2 pt-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder={t.searchPeople} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 pl-9 pr-3 text-sm outline-none" /></div>
        {mode === "add" && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button onClick={() => setShowInvite((value) => !value)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-zinc-900 text-sm font-bold text-orange-300"><Mail className="h-4 w-4" />{t.inviteByEmail}</button>
          <button disabled aria-disabled="true" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-zinc-500"><Phone className="h-4 w-4" />{t.inviteByPhone}<span className="text-[10px]">{t.phoneComingSoon}</span></button>
          <button onClick={shareInvitationLink} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-zinc-200"><Link className="h-4 w-4" />{t.shareInvitationLink}</button>
        </div>}
        {mode === "add" && showInvite && <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950 p-3">
          <p className="text-xs text-zinc-500">{t.inviteHint}</p>
          <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder={t.fullName} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm outline-none" />
          <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} inputMode="email" autoCapitalize="none" placeholder={t.emailLabel} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm outline-none" />
          <button onClick={sendInvite} disabled={busy} className="mt-3 h-11 w-full rounded-xl bg-orange-500 font-black text-black disabled:bg-zinc-800 disabled:text-zinc-500">{t.sendInvite}</button>
        </div>}
        {msg && <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${msg.kind === "ok" ? "bg-orange-500/10 text-orange-300" : "bg-red-500/10 text-red-300"}`}><span className="flex-1">{msg.text}</span><button onClick={() => setMsg(null)} aria-label={t.cancel}><X className="h-3.5 w-3.5" /></button></div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4" style={{ paddingBottom: mode === "add" ? "8px" : "calc(24px + env(safe-area-inset-bottom))" }}>
        {mode === "add" && <div className="pb-2 pt-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{t.availablePeople}</div>}
        {loading && <div className="py-8 text-center text-sm text-zinc-500">…</div>}
        {!loading && !filtered.length && <div className="py-8 text-center text-sm text-zinc-500">{t.noResults}</div>}
        {filtered.map((person) => {
          const active = chosen.includes(person.id);
          return <div key={person.id} className="flex items-center gap-3 border-b border-white/5 py-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-900 text-orange-400">{person.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : person.displayName ? <span className="text-sm font-black">{person.displayName[0]?.toUpperCase()}</span> : <User className="h-5 w-5" />}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{person.displayName}</div>{mode === "admins" ? <div className="flex items-center gap-1 text-[11px] text-zinc-400">{person.role === "owner" ? <Crown className="h-3 w-3 text-orange-400" /> : person.role === "admin" ? <ShieldCheck className="h-3 w-3 text-orange-400" /> : null}{person.role === "owner" ? t.owner : person.role === "admin" ? t.admin : t.member}</div> : person.username && <div className="truncate text-[11px] text-zinc-500">@{person.username}</div>}</div>
            {mode === "add" ? <button onClick={() => setChosen((value) => (active ? value.filter((id) => id !== person.id) : [...value, person.id]))} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active ? "border-orange-500 bg-orange-500 text-black" : "border-zinc-600"}`} aria-label={person.displayName}>{active && <Check className="h-4 w-4" />}</button> : canManage && person.role !== "owner" && <div className="flex shrink-0 gap-2"><button onClick={() => setRole(person.id, person.role === "admin" ? "member" : "admin")} className="h-9 rounded-full border border-orange-500/30 bg-orange-500/15 px-3 text-xs font-bold text-orange-300">{person.role === "admin" ? t.removeAdmin : t.makeAdmin}</button><button onClick={() => setConfirmRemove(person)} aria-label={t.delete} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-red-400"><Trash2 className="h-4 w-4" /></button></div>}
          </div>;
        })}

        {mode === "add" && invites.length > 0 && <>
          <div className="pb-2 pt-5 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{t.pendingInvites}</div>
          {invites.map((invite) => <div key={invite.id} className="flex items-center gap-3 border-b border-white/5 py-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-orange-400"><Mail className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{invite.full_name || t.pendingInvitation}</div><div className="truncate text-[11px] text-zinc-500">{t.pendingInvitation}</div></div>
            {canManage && <button onClick={() => cancelInvite(invite.id)} aria-label={t.cancelInvite} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-red-400"><Trash2 className="h-4 w-4" /></button>}
          </div>)}
        </>}
      </div>

      {mode === "add" && <div className="shrink-0 border-t border-white/10 bg-black px-4 pt-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}><button onClick={addMembers} disabled={!chosen.length || busy} className="h-13 w-full rounded-2xl bg-orange-500 py-4 font-black text-black disabled:bg-zinc-800 disabled:text-zinc-500">{t.addMembers}{chosen.length ? ` (${chosen.length})` : ""}</button></div>}

      {confirmRemove && <div className="fixed inset-0 z-[140] grid place-items-center bg-black/80 px-8" onClick={() => setConfirmRemove(null)}><div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6"><b className="text-lg">{t.removeMember}</b><p className="mt-2 text-sm text-zinc-400">{confirmRemove.displayName}</p><div className="mt-6 flex gap-3"><button onClick={() => setConfirmRemove(null)} className="h-12 flex-1 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={() => remove(confirmRemove.id)} className="h-12 flex-1 rounded-2xl bg-red-500 font-black text-black">{t.delete}</button></div></div></div>}
    </div>
  );
}
