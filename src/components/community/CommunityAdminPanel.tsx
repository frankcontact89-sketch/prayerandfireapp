import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Ban, Check, Crown, Flag, Pencil, ShieldCheck, ShieldMinus, Trash2, User, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Words } from "./i18n";

const db: any = supabase;

type Row = { id: string; user_id: string; status: string; created_at: string; name: string; email?: string | null; avatar?: string | null };
type AdminRow = { user_id: string; role: string; name: string; avatar?: string | null; can_create_groups?: boolean };
type GroupRow = { id: string; name: string; description?: string | null; created_by?: string | null; updated_at?: string | null; memberCount: number };
type Report = { id: string; reporter_id: string; reported_user_id: string | null; message_id: string | null; group_id: string | null; reason: string; details?: string | null; created_at: string; status: string; body?: string | null; mediaType?: string | null; reporterName?: string; reportedName?: string; reportedIsBoss?: boolean };
type Props = { t: Words; meId: string; isOwner: boolean; onClose: () => void; onChanged: () => void };

export default function CommunityAdminPanel({ t, meId, isOwner, onClose, onChanged }: Props) {
  const [tab, setTab] = useState<"requests" | "admins" | "groups" | "moderation">("requests");
  const [reports, setReports] = useState<Report[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AdminRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteGroup, setDeleteGroup] = useState<GroupRow | null>(null);

  const load = useCallback(async () => {
    const { data: reqs } = await db.from("community_access_requests").select("id,user_id,status,created_at").order("created_at", { ascending: false });
    const { data: ads } = await db.from("community_admins").select("user_id,role,can_create_groups");
    const ids = Array.from(new Set([...(reqs || []).map((r: any) => r.user_id), ...(ads || []).map((a: any) => a.user_id)]));
    const { data: profs } = ids.length ? await db.from("profiles").select("id,username,email,avatar_url").in("id", ids) : { data: [] };
    const pm = new Map((profs || []).map((p: any) => [p.id, p]));
    const nameOf = (id: string) => { const p: any = pm.get(id); return p?.username || p?.email?.split("@")[0] || "Prayer & Fire Member"; };
    setRows((reqs || []).filter((r: any) => r.status === "pending").map((r: any) => ({ ...r, name: nameOf(r.user_id), email: (pm.get(r.user_id) as any)?.email, avatar: (pm.get(r.user_id) as any)?.avatar_url })));
    setAdmins((ads || []).map((a: any) => ({ ...a, name: nameOf(a.user_id), avatar: (pm.get(a.user_id) as any)?.avatar_url })));
    setApprovedUsers((reqs || []).filter((r: any) => r.status === "approved" && !(ads || []).some((a: any) => a.user_id === r.user_id)).map((r: any) => ({ user_id: r.user_id, role: "member", name: nameOf(r.user_id), avatar: (pm.get(r.user_id) as any)?.avatar_url })));

    const { data: gs } = await db.from("community_groups").select("id,name,description,created_by,updated_at").order("updated_at", { ascending: false });
    const built: GroupRow[] = [];
    for (const g of gs || []) {
      const { count } = await db.from("community_group_members").select("*", { count: "exact", head: true }).eq("group_id", g.id);
      built.push({ ...g, memberCount: count || 0 });
    }
    setGroups(built);

    const { data: reps } = await db.from("community_reports").select("id,reporter_id,reported_user_id,message_id,group_id,reason,details,created_at,status").eq("status", "pending").order("created_at", { ascending: false });
    const repRows: any[] = reps || [];
    const msgIds = repRows.map((r) => r.message_id).filter(Boolean);
    const { data: msgs } = msgIds.length ? await db.from("community_messages").select("id,body,media_type,deleted_at").in("id", msgIds) : { data: [] };
    const msgMap = new Map((msgs || []).map((m: any) => [m.id, m]));
    const repIds = Array.from(new Set(repRows.flatMap((r) => [r.reporter_id, r.reported_user_id].filter(Boolean))));
    const { data: repProfs } = repIds.length ? await db.from("profiles").select("id,username,email").in("id", repIds) : { data: [] };
    const rpm = new Map((repProfs || []).map((p: any) => [p.id, p]));
    const { data: bosses } = await db.from("community_admins").select("user_id,role").eq("role", "owner");
    const bossSet = new Set((bosses || []).map((b: any) => b.user_id));
    const label = (id?: string | null) => { if (!id) return "—"; const p: any = rpm.get(id); return p?.username || p?.email?.split("@")[0] || "Prayer & Fire Member"; };
    setReports(repRows.map((r) => { const m: any = r.message_id ? msgMap.get(r.message_id) : null; return { ...r, body: m?.deleted_at ? null : m?.body, mediaType: m?.media_type, reporterName: label(r.reporter_id), reportedName: label(r.reported_user_id), reportedIsBoss: !!r.reported_user_id && bossSet.has(r.reported_user_id) }; }));
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("community-admin-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_access_requests" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_admins" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_reports" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_groups" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_group_members" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const review = async (id: string, status: "approved" | "rejected") => { setBusy(id); await db.from("community_access_requests").update({ status, reviewed_by: meId, reviewed_at: new Date().toISOString() }).eq("id", id); setBusy(null); await load(); onChanged(); };
  const toggleAdmin = async (userId: string, makeAdmin: boolean) => { setBusy(userId); if (makeAdmin) await db.from("community_admins").insert({ user_id: userId, role: "admin", granted_by: meId, can_create_groups: false }); else await db.from("community_admins").delete().eq("user_id", userId).neq("role", "owner"); setBusy(null); await load(); onChanged(); };
  const toggleCreate = async (userId: string, value: boolean) => { setBusy(userId); await db.from("community_admins").update({ can_create_groups: value }).eq("user_id", userId).neq("role", "owner"); setBusy(null); await load(); };
  const saveGroup = async () => { if (!editGroup) return; const nextName = editName.trim(); if (!nextName) return; setBusy(editGroup.id); const { error } = await db.from("community_groups").update({ name: nextName, description: editDescription.trim(), updated_at: new Date().toISOString() }).eq("id", editGroup.id); setBusy(null); if (!error) { setEditGroup(null); await load(); onChanged(); } };
  const confirmDeleteGroup = async () => { if (!deleteGroup) return; setBusy(deleteGroup.id); const { error } = await db.from("community_groups").delete().eq("id", deleteGroup.id); setBusy(null); if (!error) { setDeleteGroup(null); await load(); onChanged(); } };

  const resolveReport = async (r: Report, action: "dismissed" | "content_removed" | "restricted") => {
    setBusy(r.id);
    if (action === "content_removed" && r.message_id) await db.from("community_messages").update({ deleted_at: new Date().toISOString() }).eq("id", r.message_id);
    if (action === "restricted" && r.reported_user_id && !r.reportedIsBoss) {
      await db.from("community_access_requests").update({ status: "restricted", reviewed_by: meId, reviewed_at: new Date().toISOString() }).eq("user_id", r.reported_user_id);
      await db.from("community_group_members").delete().eq("user_id", r.reported_user_id);
    }
    await db.from("community_reports").update({ status: "reviewed", action, reviewed_by: meId, reviewed_at: new Date().toISOString() }).eq("id", r.id);
    setBusy(null); await load(); onChanged();
  };

  const Avatar = ({ src, name }: { src?: string | null; name: string }) => <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 grid place-items-center text-orange-400 shrink-0">{src ? <img src={src} alt="" className="w-full h-full object-cover" /> : name ? <span className="font-black">{name[0]?.toUpperCase()}</span> : <User className="w-5 h-5" />}</div>;
  const title = tab === "requests" ? t.requestsPanel : tab === "admins" ? t.manageAdmins : tab === "groups" ? "Groups" : t.moderation;

  return (
    <div className="fixed inset-0 z-[110] bg-[#080808] text-white flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <header className="shrink-0 h-16 px-3 flex items-center gap-3 border-b border-white/10 bg-black/95"><button onClick={onClose} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center"><ArrowLeft className="w-5 h-5" /></button><b className="flex-1 truncate">{title}</b></header>
      <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto">{(isOwner ? (["requests", "admins", "groups", "moderation"] as const) : (["requests", "groups", "moderation"] as const)).map((x) => <button key={x} onClick={() => setTab(x)} className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${tab === x ? "bg-orange-500 text-black border-orange-400" : "bg-zinc-950 border-white/10 text-zinc-300"}`}>{x === "requests" ? t.requestsPanel : x === "admins" ? t.manageAdmins : x === "groups" ? "Groups" : t.moderation}</button>)}</div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-10">
        {tab === "groups" ? (
          groups.length === 0 ? <p className="text-center text-zinc-500 py-16">No groups</p> : groups.map((g) => <div key={g.id} className="flex items-center gap-3 py-4 border-b border-white/10"><div className="w-11 h-11 rounded-full bg-orange-500/10 text-orange-400 grid place-items-center shrink-0"><Users className="w-5 h-5" /></div><div className="flex-1 min-w-0"><div className="font-semibold truncate">{g.name}</div><div className="text-xs text-zinc-500 truncate">{g.memberCount} {t.members}{g.description ? ` · ${g.description}` : ""}</div></div><button onClick={() => { setEditGroup(g); setEditName(g.name); setEditDescription(g.description || ""); }} aria-label={t.edit} className="w-10 h-10 rounded-full bg-zinc-900 text-orange-400 grid place-items-center"><Pencil className="w-4 h-4" /></button><button onClick={() => setDeleteGroup(g)} aria-label={t.delete} className="w-10 h-10 rounded-full bg-zinc-900 text-red-400 grid place-items-center"><Trash2 className="w-4 h-4" /></button></div>)
        ) : tab === "moderation" ? (
          reports.length === 0 ? <p className="text-center text-zinc-500 py-16">{t.noReports}</p> : reports.map((r) => <div key={r.id} className="py-4 border-b border-white/10 space-y-2"><div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest"><Flag className="w-3.5 h-3.5" />{r.reason}</div><div className="text-sm"><span className="text-zinc-500">{t.reportedBy} </span><b>{r.reporterName}</b><span className="text-zinc-500"> · </span><b className="text-red-300">{r.reportedName}</b>{r.reportedIsBoss && <Crown className="inline w-3.5 h-3.5 ml-1 text-orange-400" />}</div><div className="rounded-xl bg-zinc-900 border border-white/10 p-3 text-sm text-zinc-300"><div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{t.reportedContent}</div>{r.body || (r.mediaType ? r.mediaType : "—")}</div>{r.details && <p className="text-xs text-zinc-400 italic">{r.details}</p>}<div className="text-[11px] text-zinc-500">{new Date(r.created_at).toLocaleString()}</div><div className="flex flex-wrap gap-2 pt-1"><button disabled={busy === r.id} onClick={() => resolveReport(r, "dismissed")} className="px-3 h-10 rounded-full bg-zinc-900 border border-white/10 text-xs font-bold flex items-center gap-2"><Check className="w-4 h-4" /> {t.dismiss}</button>{r.message_id && <button disabled={busy === r.id} onClick={() => resolveReport(r, "content_removed")} className="px-3 h-10 rounded-full bg-zinc-900 border border-white/10 text-orange-300 text-xs font-bold flex items-center gap-2"><Trash2 className="w-4 h-4" /> {t.removeContent}</button>}{r.reported_user_id && !r.reportedIsBoss && <button disabled={busy === r.id} onClick={() => resolveReport(r, "restricted")} className="px-3 h-10 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2"><Ban className="w-4 h-4" /> {t.restrictMember}</button>}</div></div>)
        ) : tab === "requests" ? (
          rows.length === 0 ? <p className="text-center text-zinc-500 py-16">{t.noRequests}</p> : rows.map((r) => <div key={r.id} className="flex items-center gap-3 py-3 border-b border-white/10"><Avatar src={r.avatar} name={r.name} /><div className="flex-1 min-w-0"><div className="font-semibold truncate">{r.name}</div>{r.email && <div className="text-xs text-zinc-500 truncate">{r.email}</div>}</div><button disabled={busy === r.id} onClick={() => review(r.id, "approved")} aria-label={t.approve} className="w-10 h-10 rounded-full bg-orange-500 text-black grid place-items-center"><Check className="w-5 h-5" /></button><button disabled={busy === r.id} onClick={() => review(r.id, "rejected")} aria-label={t.reject} className="w-10 h-10 rounded-full bg-zinc-900 text-red-400 grid place-items-center"><X className="w-5 h-5" /></button></div>)
        ) : (
          <>{admins.map((a) => <div key={a.user_id} className="flex items-center gap-3 py-3 border-b border-white/10"><Avatar src={a.avatar} name={a.name} /><div className="flex-1 min-w-0"><div className="font-semibold truncate">{a.name}</div><div className="text-xs text-orange-400 flex items-center gap-1">{a.role === "owner" ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}{a.role === "owner" ? t.owner : t.admin}</div></div>{a.role !== "owner" && <div className="flex items-center gap-2"><button disabled={busy === a.user_id} onClick={() => toggleCreate(a.user_id, !a.can_create_groups)} className={`px-3 h-9 rounded-full text-[11px] font-bold border ${a.can_create_groups ? "bg-orange-500 text-black border-orange-400" : "bg-zinc-900 text-zinc-400 border-white/10"}`}>{t.createGroupsPerm}</button><button disabled={busy === a.user_id} onClick={() => toggleAdmin(a.user_id, false)} aria-label={t.removeAdmin} className="w-10 h-10 rounded-full bg-zinc-900 text-red-400 grid place-items-center shrink-0"><ShieldMinus className="w-5 h-5" /></button></div>}</div>)}<div className="text-xs uppercase tracking-widest text-zinc-500 font-bold pt-6 pb-2">{t.approved}</div>{approvedUsers.map((u) => <div key={u.user_id} className="flex items-center gap-3 py-3 border-b border-white/10"><Avatar src={u.avatar} name={u.name} /><div className="flex-1 min-w-0 font-semibold truncate">{u.name}</div><button disabled={busy === u.user_id} onClick={() => toggleAdmin(u.user_id, true)} className="px-3 h-10 rounded-full bg-orange-500/15 text-orange-300 text-xs font-bold border border-orange-500/30">{t.makeAdmin}</button></div>)}</>
        )}
      </div>

      {editGroup && <div className="fixed inset-0 z-[130] bg-black/80 flex items-end" onClick={() => setEditGroup(null)}><div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between items-center"><b>{t.edit}</b><button onClick={() => setEditGroup(null)}><X /></button></div><input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-5 w-full h-12 bg-zinc-900 rounded-xl px-3 outline-none" /><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder={t.desc} className="mt-3 w-full bg-zinc-900 rounded-xl p-3 outline-none" rows={4} /><button disabled={busy === editGroup.id || !editName.trim()} onClick={saveGroup} className="mt-4 w-full h-12 rounded-xl bg-orange-500 text-black font-black disabled:opacity-50">{t.save}</button></div></div>}

      {deleteGroup && <div className="fixed inset-0 z-[140] bg-black/80 grid place-items-center px-8" onClick={() => setDeleteGroup(null)}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.delete}: {deleteGroup.name}</b><p className="mt-2 text-sm text-zinc-400">This removes the group for all members. This action cannot be undone.</p><div className="mt-6 flex gap-3"><button onClick={() => setDeleteGroup(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button disabled={busy === deleteGroup.id} onClick={confirmDeleteGroup} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black disabled:opacity-50">{t.delete}</button></div></div></div>}
    </div>
  );
}
