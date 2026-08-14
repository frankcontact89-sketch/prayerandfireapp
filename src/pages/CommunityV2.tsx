import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{ArrowLeft,Ban,Bell,BellOff,Camera,Flag,ChevronRight,CornerUpLeft,LogOut,Mic,MoreHorizontal,Paperclip,Plus,Search,Send,Settings,ShieldCheck,Star,Trash2,UserPlus,Users,X}from"lucide-react";
import{supabase}from"@/integrations/supabase/client";
import CreateGroupModal,{type CreatedGroup}from"@/components/community/CreateGroupModal";
import AccessGate from"@/components/community/AccessGate";
import CommunityAdminPanel from"@/components/community/CommunityAdminPanel";
import MembersModal from"@/components/community/MembersModal";
import AudioBubble from"@/components/community/AudioBubble";
import VoiceRecorder from"@/components/community/VoiceRecorder";
import ReactionEmojiPicker from"@/components/community/ReactionEmojiPicker";
import{dict,getLang}from"@/components/community/i18n";
import{isBlockedContent}from"@/lib/content-filter";
import entryLogo from"@/assets/prayer-fire-entry-logo.png";

type Group=CreatedGroup&{role?:string;muted?:boolean;archived?:boolean;memberCount?:number;description?:string};
type DiscoverGroup={id:string;name:string;description?:string|null;avatar?:string;memberCount:number};
type Msg={id:string;sender_id:string;body?:string|null;media_url?:string|null;media_type?:string|null;created_at:string;deleted_at?:string|null;starred?:boolean;reply_to?:string|null;mine?:boolean;url?:string};
type Sender={name:string;avatar?:string|null};
const db:any=supabase;
const EMOJIS=["👍","❤️","😂","😮","😢","🙏","🔥"];
type Rx={user_id:string;emoji:string};

export default function CommunityV2(){
 const lang=getLang();
 const t=dict[lang];
 const emojiTitle=lang==="es"?"Elige una reacción":lang==="pt"?"Escolha uma reação":"Choose a reaction";
 const forwardLabel=lang==="es"?"Enviar / Reenviar":lang==="pt"?"Enviar / Encaminhar":"Send / Forward";
 const sharedLabel=lang==="es"?"Listo para enviar":lang==="pt"?"Pronto para enviar":"Ready to send";
 const[me,setMe]=useState<any>(null);
 const[access,setAccess]=useState<"loading"|"none"|"pending"|"rejected"|"approved">("loading");
 const[staffRole,setStaffRole]=useState<"owner"|"admin"|null>(null);
 const[canCreate,setCanCreate]=useState(false);
 const[requesting,setRequesting]=useState(false);
 const[panel,setPanel]=useState(false);
 const[pendingCount,setPendingCount]=useState(0);
 const[membersModal,setMembersModal]=useState<null|"add"|"admins">(null);
 const[groups,setGroups]=useState<Group[]>([]),[selected,setSelected]=useState<Group|null>(null),[msgs,setMsgs]=useState<Msg[]>([]),[senders,setSenders]=useState<Record<string,Sender>>({}),[q,setQ]=useState(""),[filter,setFilter]=useState<"all"|"unread"|"groups"|"discover">("all"),[create,setCreate]=useState(false),[info,setInfo]=useState(false),[draft,setDraft]=useState(""),[rec,setRec]=useState(false),[edit,setEdit]=useState(false),[name,setName]=useState(""),[desc,setDesc]=useState(""),[confirmDel,setConfirmDel]=useState<Msg|null>(null),[menu,setMenu]=useState<Msg|null>(null),[replyTo,setReplyTo]=useState<Msg|null>(null),[reactions,setReactions]=useState<Record<string,Rx[]>>({}),[reactBar,setReactBar]=useState<Msg|null>(null),[emojiPicker,setEmojiPicker]=useState<Msg|null>(null),[rxDetail,setRxDetail]=useState<Msg|null>(null),[flash,setFlash]=useState("");
 const[discoverList,setDiscoverList]=useState<DiscoverGroup[]>([]),[discoverLoading,setDiscoverLoading]=useState(false),[noAccessGroup,setNoAccessGroup]=useState<DiscoverGroup|null>(null),[confirmDelGroup,setConfirmDelGroup]=useState(false);
 const file=useRef<HTMLInputElement>(null),photo=useRef<HTMLInputElement>(null),end=useRef<HTMLDivElement>(null);
 const press=useRef<number|null>(null);
 const[blocks,setBlocks]=useState<string[]>([]),[reportFor,setReportFor]=useState<Msg|null>(null),[reportReason,setReportReason]=useState("harassment"),[reportNote,setReportNote]=useState(""),[blockFor,setBlockFor]=useState<Msg|null>(null),[busyMod,setBusyMod]=useState(false);
 const REASONS:[string,string][]=[["harassment",t.reasonHarassment],["hate",t.reasonHate],["sexual",t.reasonSexual],["violence",t.reasonViolence],["spam",t.reasonSpam],["privacy",t.reasonPrivacy],["other",t.reasonOther]];

 const isStaff=!!staffRole;
 const isOwner=staffRole==="owner";
 const canManageGroup=(g:Group|null)=>!!g&&(isStaff||g.role==="owner"||g.role==="admin");

 const signed=async(path?:string|null)=>{if(!path)return undefined;const{data}=await supabase.storage.from("community-media").createSignedUrl(path,3600);return data?.signedUrl};

 const loadAccess=useCallback(async(uid:string)=>{
  const{data:adm}=await db.from("community_admins").select("role,can_create_groups").eq("user_id",uid).maybeSingle();
  if(adm){setStaffRole(adm.role==="owner"?"owner":"admin");setCanCreate(adm.role==="owner"||adm.can_create_groups!==false);setAccess("approved");return true}
  setStaffRole(null);setCanCreate(false);
  const{data:req}=await db.from("community_access_requests").select("status").eq("user_id",uid).maybeSingle();
  if(!req){setAccess("none");return false}
  setAccess(req.status==="approved"?"approved":req.status==="pending"?"pending":"rejected");
  return req.status==="approved";
 },[]);

 const loadGroups=useCallback(async(uid:string)=>{
  const{data:m}=await db.from("community_group_members").select("group_id,role,muted,archived").eq("user_id",uid);
  const ids=(m||[]).map((x:any)=>x.group_id);
  if(!ids.length){setGroups([]);return}
  const{data:g}=await db.from("community_groups").select("id,name,description,avatar_url,updated_at").in("id",ids).order("updated_at",{ascending:false});
  const mm=new Map((m||[]).map((x:any)=>[x.group_id,x]));
  setGroups(await Promise.all((g||[]).map(async(x:any)=>{
   const z:any=mm.get(x.id)||{};
   const{count}=await db.from("community_group_members").select("*",{count:"exact",head:true}).eq("group_id",x.id);
   return{id:x.id,name:x.name,subtitle:x.description||`${count||0} ${t.members}`,description:x.description||"",unread:0,lastTime:new Date(x.updated_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),avatar:x.avatar_url?await signed(x.avatar_url):undefined,role:z.role,muted:z.muted,archived:z.archived,memberCount:count||0};
  })));
 },[t.members]);

 const loadDiscover=useCallback(async()=>{
  setDiscoverLoading(true);
  const{data,error}=await db.rpc("discover_community_groups");
  if(error){setDiscoverList([]);setDiscoverLoading(false);return}
  const rows=await Promise.all((data||[]).map(async(x:any)=>({id:x.id,name:x.name,description:x.description,avatar:x.avatar_url?await signed(x.avatar_url):undefined,memberCount:Number(x.member_count)||0})));
  setDiscoverList(rows);setDiscoverLoading(false);
 },[]);

 const loadSenders=useCallback(async(ids:string[])=>{
  if(!ids.length)return;
  const{data}=await db.from("profiles").select("id,username,email,avatar_url").in("id",ids);
  setSenders(prev=>{const next={...prev};(data||[]).forEach((p:any)=>{next[p.id]={name:p.username||p.email?.split("@")[0]||"Member",avatar:p.avatar_url}});return next});
 },[]);

 const loadReactions=useCallback(async(ids:string[])=>{
  if(!ids.length)return;
  const{data:rx}=await db.from("community_reactions").select("message_id,user_id,emoji").in("message_id",ids);
  const map:Record<string,Rx[]>={};(rx||[]).forEach((r:any)=>{(map[r.message_id]=map[r.message_id]||[]).push({user_id:r.user_id,emoji:r.emoji})});
  setReactions(map);
  loadSenders(Array.from(new Set((rx||[]).map((r:any)=>r.user_id))));
 },[loadSenders]);
 const loadMsgs=useCallback(async(id:string,uid?:string)=>{
  const{data}=await db.from("community_messages").select("id,sender_id,body,media_url,media_type,created_at,deleted_at,starred,reply_to").eq("group_id",id).order("created_at");
  const rows=await Promise.all((data||[]).map(async(x:any)=>({...x,mine:x.sender_id===(uid||me?.id),url:x.media_url&&!x.deleted_at?await signed(x.media_url):undefined})));
  setMsgs(rows);
  loadSenders(Array.from(new Set(rows.map((r:any)=>r.sender_id))));
  const ids=rows.map((r:any)=>r.id);
  if(ids.length)await loadReactions(ids);else setReactions({});
  setTimeout(()=>end.current?.scrollIntoView({behavior:"smooth"}),30);
 },[me?.id,loadSenders,loadReactions]);

 useEffect(()=>{(async()=>{
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setAccess("none");return}
  const{data:p}=await db.from("profiles").select("username,avatar_url").eq("id",user.id).maybeSingle();
  setMe({id:user.id,name:p?.username||user.email?.split("@")[0]||"Prayer & Fire Member",avatar:p?.avatar_url});
  const{data:bl}=await db.from("community_blocks").select("blocked_id").eq("blocker_id",user.id);
  setBlocks((bl||[]).map((b:any)=>b.blocked_id));
  const ok=await loadAccess(user.id);
  if(ok)await loadGroups(user.id);
 })()},[loadAccess,loadGroups]);

 const loadPending=useCallback(async()=>{
  const{count}=await db.from("community_access_requests").select("*",{count:"exact",head:true}).eq("status","pending");
  setPendingCount(count||0);
 },[]);
 useEffect(()=>{if(!isStaff)return;loadPending();
  const c=supabase.channel("community-requests").on("postgres_changes",{event:"*",schema:"public",table:"community_access_requests"},()=>loadPending()).subscribe();
  return()=>{supabase.removeChannel(c)};
 },[isStaff,loadPending]);

 useEffect(()=>{if(!me)return;
  const c=supabase.channel(`access:${me.id}`)
   .on("postgres_changes",{event:"*",schema:"public",table:"community_access_requests",filter:`user_id=eq.${me.id}`},async()=>{const ok=await loadAccess(me.id);if(ok)await loadGroups(me.id)})
   .subscribe();
  return()=>{supabase.removeChannel(c)};
 },[me?.id,loadAccess,loadGroups]);

 useEffect(()=>{if(!selected||!me)return;loadMsgs(selected.id,me.id);
  const c=supabase.channel(`chat:${selected.id}`).on("postgres_changes",{event:"*",schema:"public",table:"community_messages",filter:`group_id=eq.${selected.id}`},()=>loadMsgs(selected.id,me.id)).subscribe();
  const rc=supabase.channel(`rx:${selected.id}`).on("postgres_changes",{event:"*",schema:"public",table:"community_reactions"},()=>{setMsgs(cur=>{loadReactions(cur.map(x=>x.id));return cur})}).subscribe();
  return()=>{supabase.removeChannel(c);supabase.removeChannel(rc)};
 },[selected?.id,me?.id,loadMsgs,loadReactions]);

 useEffect(()=>{if(!me||access!=="approved")return;
  const c=supabase.channel(`list:${me.id}`)
   .on("postgres_changes",{event:"*",schema:"public",table:"community_group_members",filter:`user_id=eq.${me.id}`},()=>loadGroups(me.id))
   .on("postgres_changes",{event:"*",schema:"public",table:"community_groups"},()=>loadGroups(me.id))
   .subscribe();
  return()=>{supabase.removeChannel(c)};
 },[me?.id,access,loadGroups]);

 useEffect(()=>{if(filter==="discover"&&access==="approved")loadDiscover()},[filter,access,loadDiscover]);

 const visible=useMemo(()=>groups.filter(g=>!g.archived&&(filter!=="unread"||g.unread>0)&&(g.name+" "+g.subtitle).toLowerCase().includes(q.toLowerCase())),[groups,q,filter]);

 const requestAccess=async()=>{
  if(!me)return;setRequesting(true);
  await db.from("community_access_requests").insert({user_id:me.id,status:"pending"});
  await loadAccess(me.id);setRequesting(false);
 };

 const createGroup=async(g:CreatedGroup)=>{
  if(!me||!canCreate)return;
  let path:string|undefined;
  if(g.avatar?.startsWith("blob:")){const b=await fetch(g.avatar).then(r=>r.blob());path=`${me.id}/groups/${crypto.randomUUID()}.jpg`;await supabase.storage.from("community-media").upload(path,b,{contentType:b.type||"image/jpeg"})}
  const{data:x,error}=await db.from("community_groups").insert({name:g.name,description:g.subtitle,avatar_url:path||null,created_by:me.id}).select().single();
  if(error||!x)return;
  await db.from("community_group_members").insert([{group_id:x.id,user_id:me.id,role:"owner"},...(g.memberIds||[]).map(id=>({group_id:x.id,user_id:id,role:"member"}))]);
  await loadGroups(me.id);setCreate(false);
 };

 const send=async()=>{if(!draft.trim()||!selected||!me)return;const body=draft.trim().slice(0,10000);
  if(isBlockedContent(body)){toast(t.contentBlocked);return}
  const r=replyTo?.id||null;setDraft("");setReplyTo(null);
  const{error}=await db.from("community_messages").insert({group_id:selected.id,sender_id:me.id,body,reply_to:r});
  if(error){setDraft(body);toast(/CONTENT_BLOCKED/.test(error.message||"")?t.contentBlocked:error.message||"")}};

 const upload=async(f?:File)=>{
  if(!f||!selected||!me||f.size>50*1024*1024)return;
  const kind=f.type.startsWith("image/")?"image":f.type.startsWith("video/")?"video":f.type.startsWith("audio/")?"audio":"document";
  const safe=f.name.replace(/[^\w.\-]+/g,"_");
  const path=`${me.id}/${selected.id}/${Date.now()}-${safe}`;
  const{error}=await supabase.storage.from("community-media").upload(path,f,{contentType:f.type||"application/octet-stream",upsert:false});
  if(error)return;
  const r=replyTo?.id||null;setReplyTo(null);
  await db.from("community_messages").insert({group_id:selected.id,sender_id:me.id,media_url:path,media_type:kind,reply_to:r});
 };

 const deleteMsg=async(m:Msg)=>{
  if(!me||!selected)return;
  if(!(m.sender_id===me.id||canManageGroup(selected)))return;
  await db.from("community_messages").update({deleted_at:new Date().toISOString()}).eq("id",m.id);
  setConfirmDel(null);setMenu(null);
  setMsgs(v=>v.map(x=>x.id===m.id?{...x,deleted_at:new Date().toISOString(),url:undefined}:x));
 };

 const toast=(s:string)=>{setFlash(s);window.setTimeout(()=>setFlash(""),1600)};
 const react=async(m:Msg,emoji:string)=>{
  if(!me)return;setMenu(null);setReactBar(null);setEmojiPicker(null);
  const mine=(reactions[m.id]||[]).find(r=>r.user_id===me.id);
  const remove=mine?.emoji===emoji;
  setReactions(v=>{const list=(v[m.id]||[]).filter(r=>r.user_id!==me.id);return{...v,[m.id]:remove?list:[...list,{user_id:me.id,emoji}]}});
  if(remove){await db.from("community_reactions").delete().eq("message_id",m.id).eq("user_id",me.id);return}
  await db.from("community_reactions").upsert({message_id:m.id,user_id:me.id,emoji},{onConflict:"message_id,user_id"});
 };
 const forwardMsg=async(m:Msg)=>{
  setMenu(null);
  const text=m.body||"";
  const url=m.url||"";
  try{
   if(navigator.share){await navigator.share({text:text||undefined,url:url||undefined});return}
   await navigator.clipboard.writeText([text,url].filter(Boolean).join("\n"));
   toast(sharedLabel);
  }catch{/* cancelled or unavailable */}
 };


 const submitReport=async()=>{
  if(!me||!reportFor||reportFor.sender_id===me.id)return;
  setBusyMod(true);
  await db.from("community_reports").insert({reporter_id:me.id,reported_user_id:reportFor.sender_id,message_id:reportFor.id,group_id:selected?.id||null,reason:reportReason,details:reportNote.trim()||null,status:"pending"});
  setBusyMod(false);setReportFor(null);setReportNote("");setReportReason("harassment");toast(t.reportSent);
 };
 const confirmBlock=async()=>{
  if(!me||!blockFor||blockFor.sender_id===me.id)return;
  setBusyMod(true);
  const target=blockFor.sender_id;
  await db.from("community_blocks").insert({blocker_id:me.id,blocked_id:target});
  setBlocks(v=>Array.from(new Set([...v,target])));
  setBusyMod(false);setBlockFor(null);toast(t.blockedDone);
 };
 const memberUpdate=async(ch:any)=>{if(!selected||!me)return;await db.from("community_group_members").update(ch).eq("group_id",selected.id).eq("user_id",me.id);setSelected(s=>s?{...s,...ch}:s);setGroups(v=>v.map(g=>g.id===selected.id?{...g,...ch}:g))};
 const saveGroup=async()=>{if(!selected||!canManageGroup(selected))return;await db.from("community_groups").update({name:name.trim()||selected.name,description:desc.trim(),updated_at:new Date().toISOString()}).eq("id",selected.id);setSelected(s=>s?{...s,name:name.trim()||s.name,description:desc.trim(),subtitle:desc.trim()||s.subtitle}:s);setEdit(false)};
 const changePhoto=async(f?:File)=>{if(!f||!selected||!me||!canManageGroup(selected))return;const path=`${me.id}/groups/${selected.id}-${Date.now()}.jpg`;await supabase.storage.from("community-media").upload(path,f,{contentType:f.type,upsert:true});await db.from("community_groups").update({avatar_url:path}).eq("id",selected.id);const url=await signed(path);setSelected(s=>s?{...s,avatar:url}:s)};
 const deleteGroupNow=async()=>{if(!selected||!me||!canManageGroup(selected))return;await db.from("community_group_members").delete().eq("group_id",selected.id);await db.from("community_groups").delete().eq("id",selected.id);setConfirmDelGroup(false);setSelected(null);setInfo(false);loadGroups(me.id);loadDiscover()};
 const leave=async()=>{if(!selected||!me)return;await db.from("community_group_members").delete().eq("group_id",selected.id).eq("user_id",me.id);setSelected(null);setInfo(false);loadGroups(me.id)};

 if(access==="loading")return <div className="fixed inset-0 bg-black" />;
 if(access!=="approved")return <AccessGate t={t} status={access} busy={requesting} onRequest={requestAccess} onBack={()=>window.history.back()} />;
 if(panel&&isStaff)return <CommunityAdminPanel t={t} meId={me.id} isOwner={isOwner} onClose={()=>setPanel(false)} onChanged={()=>me&&loadGroups(me.id)} />;
 if(membersModal&&selected)return <MembersModal t={t} groupId={selected.id} mode={membersModal} canManage={canManageGroup(selected)} onClose={()=>setMembersModal(null)} onChanged={()=>me&&loadGroups(me.id)} />;

 if(selected&&info)return <div className="fixed inset-0 bg-[#080808] text-white overflow-y-auto" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}><header className="sticky top-0 z-20 h-16 bg-black/95 border-b border-white/10 px-3 flex items-center gap-3"><button onClick={()=>setInfo(false)} className="w-10 h-10 grid place-items-center"><ArrowLeft/></button><b className="flex-1">{t.info}</b>{canManageGroup(selected)&&<button onClick={()=>{setName(selected.name);setDesc(selected.description||"");setEdit(true)}} className="w-10 h-10 grid place-items-center"><Settings/></button>}</header><div className="p-6 text-center border-b border-white/10"><button onClick={()=>canManageGroup(selected)&&photo.current?.click()} className="relative w-28 h-28 rounded-full overflow-hidden bg-zinc-900"><img src={selected.avatar||entryLogo} alt="" className="w-full h-full object-cover"/>{canManageGroup(selected)&&<span className="absolute bottom-0 inset-x-0 bg-black/70 py-2 flex justify-center"><Camera className="w-5 h-5"/></span>}</button><input ref={photo} type="file" accept="image/*" className="hidden" onChange={e=>{changePhoto(e.target.files?.[0]);e.target.value=""}}/><h2 className="text-2xl font-black mt-4">{selected.name}</h2><p className="text-zinc-400 text-sm">{selected.memberCount||0} {t.members}</p>{selected.description&&<p className="mt-3 text-zinc-300">{selected.description}</p>}</div><div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>memberUpdate({muted:!selected.muted})} className="w-full h-14 px-4 flex items-center gap-3">{selected.muted?<Bell/>:<BellOff/>}<span className="flex-1 text-left">{selected.muted?t.unmute:t.mute}</span><ChevronRight/></button></div>{canManageGroup(selected)&&<div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setMembersModal("add")} className="w-full h-14 px-4 flex items-center gap-3 border-b border-white/5"><UserPlus/><span className="flex-1 text-left">{t.addMembers}</span><ChevronRight/></button><button onClick={()=>setMembersModal("admins")} className="w-full h-14 px-4 flex items-center gap-3"><ShieldCheck/><span className="flex-1 text-left">{t.admins}</span><ChevronRight/></button></div>}<div className="m-4 rounded-2xl border border-white/10 bg-zinc-950"><button onClick={leave} className="w-full h-14 px-4 flex items-center gap-3 text-red-400"><LogOut/><span>{t.exit}</span></button></div>{edit&&<div className="fixed inset-0 z-50 bg-black/70 flex items-end"><div className="w-full rounded-t-3xl bg-zinc-950 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between"><b>{t.edit}</b><button onClick={()=>setEdit(false)}><X/></button></div><input value={name} onChange={e=>setName(e.target.value)} className="mt-5 w-full h-12 bg-zinc-900 rounded-xl px-3"/><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder={t.desc} className="mt-3 w-full bg-zinc-900 rounded-xl p-3" rows={4}/><button onClick={saveGroup} className="mt-4 w-full h-12 rounded-xl bg-orange-500 text-black font-black">{t.save}</button></div></div>}</div>;

 if(selected)return <div className="fixed inset-0 bg-[#080808] text-white flex flex-col" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
  <header className="shrink-0 min-h-16 px-2 bg-black/95 border-b border-white/10 flex items-center gap-2"><button onClick={()=>setSelected(null)} aria-label={t.back} className="w-10 h-10 grid place-items-center"><ArrowLeft/></button><button onClick={()=>setInfo(true)} className="flex-1 min-w-0 flex items-center gap-2 text-left"><img src={selected.avatar||entryLogo} alt="" className="w-11 h-11 rounded-full object-cover"/><div className="min-w-0"><b className="block truncate">{selected.name}</b><span className="text-xs text-zinc-400">{selected.memberCount||0} {t.members}</span></div></button><button onClick={()=>setInfo(true)} aria-label={t.info} className="w-9 h-9 grid place-items-center"><MoreHorizontal className="w-5 h-5"/></button></header>
  <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
    {msgs.filter(m=>!blocks.includes(m.sender_id)).map(m=>{
     const s=senders[m.sender_id]||(m.sender_id===me?.id?{name:me?.name,avatar:me?.avatar}:undefined);
    const time=new Date(m.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
    const canDelete=m.sender_id===me?.id||canManageGroup(selected);
    const parent=m.reply_to?msgs.find(x=>x.id===m.reply_to):undefined;
    if(m.deleted_at)return null;
    return <div key={m.id} className={`flex ${m.mine?"justify-end":"justify-start"}`}>
     <div
      onContextMenu={e=>{e.preventDefault();setReactBar(m)}}
      onTouchStart={()=>{press.current=window.setTimeout(()=>setReactBar(m),400)}}
      onTouchEnd={()=>{if(press.current)window.clearTimeout(press.current)}}
      onTouchMove={()=>{if(press.current)window.clearTimeout(press.current)}}
      style={{WebkitTouchCallout:"none",WebkitUserSelect:reactBar?.id===m.id?"none":undefined}}
      className={`group relative max-w-[86%] rounded-2xl px-3 py-2 select-none ${(reactions[m.id]||[]).length?"mb-4":""} ${m.mine?"bg-orange-500 text-black":"bg-zinc-900"}`}
     >
      {reactBar?.id===m.id&&<div className={`absolute -top-14 z-40 ${m.mine?"right-0":"left-0"} flex items-center gap-1 rounded-full bg-zinc-950 border border-orange-500/40 shadow-xl shadow-black/60 px-2 py-1.5`}>
       {EMOJIS.map(e=><button key={e} onClick={ev=>{ev.stopPropagation();react(m,e)}} className={`w-9 h-9 shrink-0 rounded-full text-xl grid place-items-center ${(reactions[m.id]||[]).some(r=>r.user_id===me?.id&&r.emoji===e)?"bg-orange-500/25":""}`}>{e}</button>)}
       <button onClick={ev=>{ev.stopPropagation();setReactBar(null);setEmojiPicker(m)}} aria-label={emojiTitle} className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 grid place-items-center text-orange-400"><Plus className="w-4 h-4"/></button>
      </div>}
      {!m.mine&&s&&<div className="text-[11px] font-bold text-orange-400 mb-0.5">{s.name}</div>}
      {parent&&<div className={`mb-1 rounded-lg px-2 py-1 text-[11px] border-l-2 ${m.mine?"bg-black/10 border-black/40 text-black/70":"bg-black/40 border-orange-500 text-zinc-400"}`}><b>{senders[parent.sender_id]?.name||t.member}</b><div className="truncate">{parent.deleted_at?t.messageDeleted:parent.body||t.media}</div></div>}
      {m.body&&<p className="whitespace-pre-wrap break-words">{m.body}</p>}
      {m.media_type==="image"&&m.url&&<img src={m.url} alt="" className="rounded-xl max-h-80"/>}
      {m.media_type==="video"&&m.url&&<video src={m.url} controls playsInline preload="metadata" className="rounded-xl max-h-80"/>}
      {m.media_type==="audio"&&m.url&&<AudioBubble url={m.url} mine={m.mine} avatar={s?.avatar||(m.mine?me?.avatar:undefined)} name={s?.name||(m.mine?me?.name:undefined)} time={time} errorLabel={t.audioError} downloadLabel={t.download} resolve={()=>signed(m.media_url)}/>} 
      {m.media_type==="document"&&m.url&&<a href={m.url} target="_blank" rel="noreferrer" className="underline">{t.document}</a>}
      {m.media_type!=="audio"&&<div className="text-[10px] opacity-60 text-right mt-1 flex items-center justify-end gap-2">{m.starred&&<Star className="w-3 h-3 fill-current"/>}{time}</div>}
      {(reactions[m.id]||[]).length>0&&<button onClick={ev=>{ev.stopPropagation();const mineRx=(reactions[m.id]||[]).find(r=>r.user_id===me?.id);if(mineRx)react(m,mineRx.emoji);else setRxDetail(m)}} className={`absolute -bottom-3.5 ${m.mine?"left-2":"right-2"} flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] bg-zinc-800 border border-white/10 text-white`}>
       {Array.from(new Set((reactions[m.id]||[]).map(r=>r.emoji))).slice(0,3).map(e=><span key={e}>{e}</span>)}
       {(reactions[m.id]||[]).length>1&&<span className="text-[11px] text-zinc-300">{(reactions[m.id]||[]).length}</span>}
      </button>}
      <button onClick={()=>setMenu(m)} aria-label={t.options} className={`absolute top-1 ${m.mine?"-left-8":"-right-8"} w-7 h-7 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 grid place-items-center`}><MoreHorizontal className="w-4 h-4"/></button>
      {canDelete&&m.media_type==="audio"&&m.starred&&<Star className="absolute -top-2 -right-2 w-3 h-3 text-orange-400 fill-current"/>}
     </div>
    </div>;
   })}
   <div ref={end}/>
  </main>
  <div className="shrink-0 p-2 border-t border-white/10 bg-black">
   {replyTo&&!rec&&<div className="mb-2 flex items-center gap-2 rounded-xl bg-zinc-900 border-l-2 border-orange-500 px-3 py-2 text-xs"><CornerUpLeft className="w-4 h-4 text-orange-400 shrink-0"/><div className="flex-1 min-w-0"><b className="text-orange-400">{t.replying} {replyTo.mine?t.you:senders[replyTo.sender_id]?.name||""}</b><div className="truncate text-zinc-400">{replyTo.body||t.media}</div></div><button onClick={()=>setReplyTo(null)} aria-label={t.cancel}><X className="w-4 h-4"/></button></div>}
   {rec?<VoiceRecorder t={t} onSend={upload} onClose={()=>setRec(false)}/>:
   <div className="flex gap-2">
    <button onClick={()=>file.current?.click()} className="w-11 h-11 rounded-full bg-zinc-900 grid place-items-center"><Paperclip/></button>
    <input ref={file} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={e=>{upload(e.target.files?.[0]);e.target.value=""}}/>
    <div className="flex-1 bg-zinc-900 rounded-full px-4 flex items-center gap-2 min-w-0"><input maxLength={10000} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();send()}}} placeholder={t.type} className="flex-1 bg-transparent outline-none min-w-0"/><button onClick={()=>file.current?.click()} aria-label={t.media}><Camera className="w-5 h-5"/></button></div>
    {draft.trim()?<button onClick={send} aria-label={t.send} className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center"><Send/></button>:<button onClick={()=>setRec(true)} aria-label={t.voiceMessage} className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center"><Mic/></button>}
   </div>}
  </div>
  {flash&&<div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-zinc-900 border border-white/10 px-4 py-2 text-sm">{flash}</div>}
  {menu&&<div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={()=>setMenu(null)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-4 pb-[max(20px,env(safe-area-inset-bottom))]">
   <div className="flex justify-between items-center mb-3"><b>{t.options}</b><button onClick={()=>setMenu(null)} aria-label={t.cancel}><X/></button></div>
   <div className="flex gap-2 pb-3 overflow-x-auto">{EMOJIS.map(e=><button key={e} onClick={()=>react(menu,e)} className={`w-11 h-11 shrink-0 rounded-full border text-xl grid place-items-center ${(reactions[menu.id]||[]).some(r=>r.user_id===me?.id&&r.emoji===e)?"bg-orange-500/20 border-orange-500/60":"bg-zinc-900 border-white/10"}`}>{e}</button>)}<button onClick={()=>{const mm=menu;setMenu(null);setEmojiPicker(mm)}} aria-label={emojiTitle} className="w-11 h-11 shrink-0 rounded-full bg-zinc-900 border border-white/10 text-orange-400 grid place-items-center"><Plus className="w-5 h-5"/></button></div>
   <button onClick={()=>{setReplyTo(menu);setMenu(null)}} className="w-full h-13 py-3 px-2 flex items-center gap-3 border-t border-white/5"><CornerUpLeft className="w-5 h-5 text-orange-400"/><span>{t.reply}</span></button>
   <button onClick={()=>forwardMsg(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Send className="w-5 h-5 text-orange-400"/><span>{forwardLabel}</span></button>
   {menu.sender_id!==me?.id&&<button onClick={()=>{const mm=menu;setMenu(null);setReportFor(mm)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Flag className="w-5 h-5 text-orange-400"/><span>{t.report}</span></button>}
   {menu.sender_id!==me?.id&&<button onClick={()=>{const mm=menu;setMenu(null);setBlockFor(mm)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5 text-red-400"><Ban className="w-5 h-5"/><span>{t.block}</span></button>}
   {(menu.sender_id===me?.id||canManageGroup(selected))&&<button onClick={()=>{setConfirmDel(menu);setMenu(null)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5 text-red-400"><Trash2 className="w-5 h-5"/><span>{t.deleteMsg}</span></button>}
  </div></div>}
  <ReactionEmojiPicker open={!!emojiPicker} title={emojiTitle} selected={emojiPicker?(reactions[emojiPicker.id]||[]).find(r=>r.user_id===me?.id)?.emoji:undefined} onClose={()=>setEmojiPicker(null)} onPick={emoji=>emojiPicker&&react(emojiPicker,emoji)}/>
  {reactBar&&<div className="fixed inset-0 z-30" onClick={()=>setReactBar(null)}/>} 
  {rxDetail&&<div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={()=>setRxDetail(null)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-4 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto">
   <div className="flex justify-between items-center mb-3"><b>{t.reactions}</b><button onClick={()=>setRxDetail(null)} aria-label={t.cancel}><X/></button></div>
   {(reactions[rxDetail.id]||[]).map(r=><div key={r.user_id+r.emoji} className="flex items-center gap-3 py-2.5 border-t border-white/5">
    <img src={(senders[r.user_id]?.avatar)||entryLogo} alt="" className="w-9 h-9 rounded-full object-cover"/>
    <span className="flex-1 truncate">{r.user_id===me?.id?t.you:senders[r.user_id]?.name||t.member}</span>
    <span className="text-xl">{r.emoji}</span>
   </div>)}
  </div></div>}
  {reportFor&&<div className="fixed inset-0 z-[60] bg-black/80 flex items-end" onClick={()=>setReportFor(null)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-4 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto">
   <div className="flex justify-between items-center mb-3"><b>{t.reportTitle}</b><button onClick={()=>setReportFor(null)} aria-label={t.cancel}><X/></button></div>
   <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">{t.reportReason}</div>
   <div className="space-y-2">{REASONS.map(([k,label])=><button key={k} onClick={()=>setReportReason(k)} className={`w-full text-left px-4 py-3 rounded-2xl border ${reportReason===k?"bg-orange-500/15 border-orange-500/60 text-orange-200":"bg-zinc-900 border-white/10 text-zinc-300"}`}>{label}</button>)}</div>
   <textarea value={reportNote} onChange={e=>setReportNote(e.target.value.slice(0,500))} placeholder={t.reportDetails} rows={3} className="mt-3 w-full rounded-2xl bg-zinc-900 border border-white/10 p-3 outline-none text-sm"/>
   <button disabled={busyMod} onClick={submitReport} className="mt-3 w-full h-12 rounded-2xl bg-orange-500 text-black font-black disabled:opacity-60">{t.submit}</button>
  </div></div>}
  {blockFor&&<div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center px-8" onClick={()=>setBlockFor(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6">
   <b className="text-lg">{t.blockTitle}</b><p className="text-sm text-zinc-400 mt-2">{t.blockBody}</p>
   <div className="mt-6 flex gap-3"><button onClick={()=>setBlockFor(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button disabled={busyMod} onClick={confirmBlock} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black disabled:opacity-60">{t.block}</button></div>
  </div></div>}
  {confirmDel&&<div className="fixed inset-0 z-50 bg-black/80 grid place-items-center px-8" onClick={()=>setConfirmDel(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.deleteMsg}</b><div className="mt-6 flex gap-3"><button onClick={()=>setConfirmDel(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={()=>deleteMsg(confirmDel)} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black">{t.delete}</button></div></div></div>}
 </div>;

 return <div className="fixed inset-0 bg-black text-white overflow-hidden" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}><div className="max-w-xl mx-auto h-full bg-[#080808] flex flex-col"><header className="shrink-0 px-4 pt-3 pb-3 border-b border-white/5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><button onClick={()=>window.history.back()} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center shrink-0"><ArrowLeft className="w-5 h-5"/></button><img src={entryLogo} alt="Prayer & Fire" className="w-11 h-11 rounded-full object-cover shrink-0 bg-zinc-900"/><div className="min-w-0"><div className="text-[10px] tracking-[.2em] text-orange-400 font-bold">PRAYER &amp; FIRE</div><h1 className="text-xl font-black truncate">{t.title}</h1>{me&&<div className="text-xs text-zinc-500 truncate">{me.name}</div>}</div></div><div className="flex items-center gap-2 shrink-0">{isStaff&&<button onClick={()=>setPanel(true)} aria-label={t.requestsPanel} className="relative w-11 h-11 rounded-full bg-zinc-900 text-orange-400 grid place-items-center"><ShieldCheck className="w-5 h-5"/>{pendingCount>0&&<span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-orange-500 text-black text-[11px] font-black grid place-items-center">{pendingCount}</span>}</button>}{canCreate&&<button onClick={()=>setCreate(true)} className="w-11 h-11 rounded-full bg-orange-500 text-black grid place-items-center" aria-label={t.new}><Plus className="w-5 h-5"/></button>}</div></div></header><div className="shrink-0 px-4 py-3"><div className="bg-zinc-900 border border-white/10 rounded-2xl h-12 px-4 flex items-center gap-2"><Search className="w-5 h-5 text-zinc-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} className="bg-transparent outline-none flex-1 min-w-0"/></div><div className="flex gap-2 mt-3">{(["all","unread","groups"] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-semibold border ${filter===f?"bg-orange-500 text-black border-orange-400":"bg-zinc-950 border-white/10 text-zinc-300"}`}>{t[f]}</button>)}</div></div><div className="flex-1 min-h-0 overflow-y-auto px-3 pb-8">{visible.length===0?<div className="py-20 text-center px-8"><div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 grid place-items-center mx-auto mb-4"><Users className="w-7 h-7"/></div><h2 className="font-bold text-lg">{t.empty}</h2><p className="text-sm text-zinc-500 mt-2">{canCreate?t.sub:`${t.sub} ${t.onlyAdminsCreate}`}</p></div>:visible.map(g=><button key={g.id} onClick={()=>setSelected(g)} className="w-full text-left flex gap-3 px-2 py-3.5 border-b border-white/10 active:bg-white/5 rounded-xl"><img src={g.avatar||entryLogo} alt="" className="w-14 h-14 rounded-full object-cover"/><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div className="font-extrabold truncate">{g.name}</div><span className="text-[11px] text-zinc-500">{g.lastTime}</span></div><div className="text-sm text-zinc-400 truncate mt-1">{g.subtitle}</div></div></button>)}</div>{canCreate&&<CreateGroupModal open={create} onClose={()=>setCreate(false)} onCreate={createGroup} language={lang}/>}</div></div>;
}
