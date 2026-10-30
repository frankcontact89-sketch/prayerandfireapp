import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{ArrowLeft,Ban,Bell,BellOff,Camera,Check,CheckCheck,Clock,Copy,FileText,Flag,Flame,ChevronRight,CornerUpLeft,Info,Link2,LogOut,Mic,MoreHorizontal,Paperclip,Pin,PinOff,Plus,Search,Send,Settings,ShieldCheck,Star,Trash2,UserPlus,Users,X}from"lucide-react";
import{supabase}from"@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import CreateGroupModal,{type CreatedGroup}from"@/components/community/CreateGroupModal";
import AccessGate from"@/components/community/AccessGate";
import CommunityAdminPanel from"@/components/community/CommunityAdminPanel";
import MembersModal from"@/components/community/MembersModal";
import AudioBubble from"@/components/community/AudioBubble";
import VoiceRecorder from"@/components/community/VoiceRecorder";
import VoiceRoom from "@/components/community/VoiceRoom";
import ReactionEmojiPicker from"@/components/community/ReactionEmojiPicker";
import ImageViewer from"@/components/community/ImageViewer";
import ChatAppearanceModal,{readChatPrefs,wallpaperCss,type ChatPrefs}from"@/components/community/ChatAppearanceModal";
import{dict,getLang}from"@/components/community/i18n";
import{isBlockedContent}from"@/lib/content-filter";
import SafetyRulesModal from"@/components/community/SafetyRulesModal";
import PushToggle from"@/components/community/PushToggle";
import{ackDelivered,pushPreferred,resumePush,takePushOpen}from"@/lib/push";



type Group=CreatedGroup&{role?:string;createdBy?:string;muted?:boolean;mutedUntil?:string|null;archived?:boolean;favorite?:boolean;memberCount?:number;description?:string};
type DiscoverGroup={id:string;name:string;description?:string|null;avatar?:string;memberCount:number};
type Msg={id:string;sender_id:string;body?:string|null;media_url?:string|null;media_type?:string|null;created_at:string;deleted_at?:string|null;starred?:boolean;reply_to?:string|null;pinned_at?:string|null;mine?:boolean;url?:string};
type GroupMember={id:string;name:string;role?:string;avatar?:string|null};
type ReadReceipt={user_id:string;read_at:string};
type DeliveryReceipt={user_id:string;delivered_at:string};
type PlayReceipt={user_id:string;played_at:string};

type Sender={name:string;avatar?:string|null};
const db:any=supabase;
const EMOJIS=["👍","❤️","😂","😮","😢","🙏","🔥"];
type Rx={user_id:string;emoji:string};

export default function CommunityV2(){
 const brandLogo = useBrandLogo();
 const lang=getLang();
 const t=dict[lang];
 const emojiTitle=lang==="es"?"Elige una reacción":lang==="pt"?"Escolha uma reação":"Choose a reaction";
 const forwardLabel=lang==="es"?"Enviar / Reenviar":lang==="pt"?"Enviar / Encaminhar":"Send / Forward";
 const copyLabel=lang==="es"?"Copiar":lang==="pt"?"Copiar":"Copy";
 const copiedLabel=lang==="es"?"Copiado":lang==="pt"?"Copiado":"Copied";
 const mediaSectionLabel=lang==="es"?"Multimedia, enlaces y documentos":lang==="pt"?"Mídia, links e documentos":"Media, links and docs";
 const searchMessagesLabel=lang==="es"?"Buscar mensajes":lang==="pt"?"Buscar mensagens":"Search messages";
 const todayLabel=lang==="es"?"Hoy":lang==="pt"?"Hoje":"Today";
 const yesterdayLabel=lang==="es"?"Ayer":lang==="pt"?"Ontem":"Yesterday";
 const sharedLabel=lang==="es"?"Listo para enviar":lang==="pt"?"Pronto para enviar":"Ready to send";
 const savedLabel=lang==="es"?"Cambios guardados":lang==="pt"?"Alterações salvas":"Changes saved";
 const photoUpdatedLabel=lang==="es"?"Foto actualizada":lang==="pt"?"Foto atualizada":"Photo updated";
 const actionFailedLabel=lang==="es"?"No se pudo completar la acción":lang==="pt"?"Não foi possível concluir a ação":"Could not complete the action";
 const ownerLeaveBlockedLabel=lang==="es"?"El propietario del grupo no puede salir. Transfiere la propiedad o elimina el grupo.":lang==="pt"?"O proprietário do grupo não pode sair. Transfira a propriedade ou exclua o grupo.":"The group owner cannot leave. Transfer ownership or delete the group.";
 const leaveConfirmBody=lang==="es"?"¿Seguro que quieres salir de este grupo?":lang==="pt"?"Tem certeza de que deseja sair deste grupo?":"Are you sure you want to leave this group?";
 const archivedLabel=lang==="es"?"Archivados":lang==="pt"?"Arquivados":"Archived";
 const activeLabel=lang==="es"?"Activos":lang==="pt"?"Ativos":"Active";
 const unarchiveLabel=lang==="es"?"Desarchivar":lang==="pt"?"Desarquivar":"Unarchive";
 const L=(en:string,es:string,pt:string)=>lang==="es"?es:lang==="pt"?pt:en;
 const inviteLinkLabel=L("Invite link","Enlace de invitación","Link de convite");
 const inviteLinkReadyLabel=L("Invite link ready to share","Enlace de invitación listo para compartir","Link de convite pronto para compartilhar");
 const inviteLinkCopiedLabel=L("Invite link copied","Enlace copiado","Link copiado");
 const inviteJoinedLabel=L("You joined the group","Te uniste al grupo","Você entrou no grupo");
 const inviteAlreadyLabel=L("You are already in this group","Ya estás en este grupo","Você já está neste grupo");
 const inviteInvalidLabel=L("This invite link is no longer valid","Este enlace ya no es válido","Este link não é mais válido");
 const inviteNotApprovedLabel=L("Request community access first","Primero solicita acceso a la comunidad","Solicite acesso à comunidade primeiro");
 const pinLabel=L("Pin message","Fijar mensaje","Fixar mensagem");
 const starLabel=L("Star message","Destacar mensaje","Destacar mensagem");
 const unstarLabel=L("Unstar message","Quitar destacado","Remover destaque");
 const starredToast=L("Message starred","Mensaje destacado","Mensagem destacada");
 const unstarredToast=L("Star removed","Destacado quitado","Destaque removido");
 const starErrorToast=L("We could not update the star. Try again.","No pudimos actualizar el destacado. Inténtalo de nuevo.","Não foi possível atualizar o destaque. Tente novamente.");
 const unpinLabel=L("Unpin message","Quitar fijado","Desafixar mensagem");
 const pinnedLabel=L("Pinned","Fijado","Fixado");
 const pinnedDoneLabel=L("Message pinned","Mensaje fijado","Mensagem fixada");
 const unpinnedDoneLabel=L("Message unpinned","Mensaje desfijado","Mensagem desafixada");
 const muteForLabel=L("Mute notifications","Silenciar notificaciones","Silenciar notificações");
 const mute8hLabel=L("8 hours","8 horas","8 horas");
 const mute1wLabel=L("1 week","1 semana","1 semana");
 const muteAlwaysLabel=L("Always","Siempre","Sempre");
 const mutedUntilLabel=L("Muted until","Silenciado hasta","Silenciado até");
 const typingLabel=L("is typing…","está escribiendo…","está digitando…");
 const typingManyLabel=L("are typing…","están escribiendo…","estão digitando…");
 const messageInfoLabel=L("Message info","Información del mensaje","Informações da mensagem");
 const readByLabel=L("Read by","Leído por","Lido por");
 const sentLabel=L("Sent","Enviado","Enviado");
 const playedByLabel=L("Played","Reproducido","Reproduzido");
 const deliveredToLabel=L("Delivered","Entregado","Entregue");
 const noOtherRecipientsLabel=L("No other recipients in this group","No hay otros destinatarios en este grupo","Não há outros destinatários neste grupo");
 const audioPositionLabel=L("Audio position","Posición del audio","Posição do áudio");
 const playAudioLabel=L("Play audio","Reproducir audio","Reproduzir áudio");
 const pauseAudioLabel=L("Pause audio","Pausar audio","Pausar áudio");
 const pushSettingsLabel=L("Notifications","Notificaciones","Notificações");
 const locale=lang==="es"?"es-ES":lang==="pt"?"pt-BR":"en-US";
 const memberCountLabel=(n:number)=>n===1?L("1 member","1 miembro","1 membro"):L(`${n} members`,`${n} miembros`,`${n} membros`);

 const[me,setMe]=useState<any>(null);
 const[access,setAccess]=useState<"loading"|"none"|"pending"|"rejected"|"approved">("loading");
 const[staffRole,setStaffRole]=useState<"owner"|"admin"|null>(null);
 const[canCreate,setCanCreate]=useState(false);
 const[requesting,setRequesting]=useState(false);
 const[panel,setPanel]=useState(false);
 const[pendingCount,setPendingCount]=useState(0);
 const[membersModal,setMembersModal]=useState<null|"add"|"admins"|"members">(null);
 const[voiceRoomOpen,setVoiceRoomOpen]=useState(false);
 const[groups,setGroups]=useState<Group[]>([]),[selected,setSelected]=useState<Group|null>(null),[msgs,setMsgs]=useState<Msg[]>([]),[senders,setSenders]=useState<Record<string,Sender>>({}),[q,setQ]=useState(""),[filter,setFilter]=useState<"all"|"unread"|"groups"|"discover">("all"),[create,setCreate]=useState(false),[info,setInfo]=useState(false),[draft,setDraft]=useState(""),[rec,setRec]=useState(false),[edit,setEdit]=useState(false),[name,setName]=useState(""),[desc,setDesc]=useState(""),[confirmDel,setConfirmDel]=useState<Msg|null>(null),[menu,setMenu]=useState<Msg|null>(null),[replyTo,setReplyTo]=useState<Msg|null>(null),[reactions,setReactions]=useState<Record<string,Rx[]>>({}),[reactBar,setReactBar]=useState<Msg|null>(null),[emojiPicker,setEmojiPicker]=useState<Msg|null>(null),[rxDetail,setRxDetail]=useState<Msg|null>(null),[starredIds,setStarredIds]=useState<Set<string>>(new Set()),[flash,setFlash]=useState("");
 const[chatSearch,setChatSearch]=useState(false),[csq,setCsq]=useState(""),[mediaOpen,setMediaOpen]=useState(false),[imageViewer,setImageViewer]=useState<{url:string;title?:string}|null>(null),[readCounts,setReadCounts]=useState<Record<string,number>>({}),[deliveredCounts,setDeliveredCounts]=useState<Record<string,number>>({});
 const[pushSheet,setPushSheet]=useState(false);
 const[chatAppearanceOpen,setChatAppearanceOpen]=useState(false);
 const[chatPrefs,setChatPrefs]=useState<ChatPrefs>({wallpaper:"default",bubble:"#5C061F"});
 const pendingDeepLink=useRef<{groupId:string;messageId?:string}|null>(null);

 const[listLoading,setListLoading]=useState(true),[listError,setListError]=useState(false);
 const[discoverList,setDiscoverList]=useState<DiscoverGroup[]>([]),[discoverLoading,setDiscoverLoading]=useState(false),[noAccessGroup,setNoAccessGroup]=useState<DiscoverGroup|null>(null),[confirmDelGroup,setConfirmDelGroup]=useState(false),[confirmLeave,setConfirmLeave]=useState(false),[showArchived,setShowArchived]=useState(false);
 const file=useRef<HTMLInputElement>(null),photo=useRef<HTMLInputElement>(null),end=useRef<HTMLDivElement>(null);
 const press=useRef<number|null>(null);
 const swipe=useRef<{id:string;x:number;y:number;pointerId:number;locked:boolean;offset:number}|null>(null);
 const suppressSwipeClick=useRef<string|null>(null);
 const[reactionPlacement,setReactionPlacement]=useState({toolbarBelow:false,actionsAbove:false});
 const placeReactionMenu=(element:HTMLElement)=>{
  const bounds=element.getBoundingClientRect();
  // Keep the toolbar and action list on opposite sides of the selected bubble.
  // Otherwise short messages near a screen edge can make both menus overlap.
  const viewport=window.visualViewport;
  const visibleTop=viewport?.offsetTop??0;
  const visibleBottom=visibleTop+(viewport?.height??window.innerHeight);
  // Prefer reactions above the bubble, actions below. For messages close to
  // the top, put reactions below and actions above only when there is room.
  const toolbarBelow=bounds.top-visibleTop<76;
  const actionsAbove=!toolbarBelow&&visibleBottom-bounds.bottom<175&&bounds.top-visibleTop>285;
  setReactionPlacement({toolbarBelow,actionsAbove});
 };
 const visibleMessageIds=useRef<string[]>([]);
 const[swipeVisual,setSwipeVisual]=useState<{id:string;offset:number}|null>(null);
 const msgRefs=useRef<Record<string,HTMLDivElement|null>>({});
 const typingChannel=useRef<any>(null),lastTypingSent=useRef(0);
 const[members,setMembers]=useState<GroupMember[]>([]);
 const[typing,setTyping]=useState<Record<string,{name:string;at:number}>>({});
 const[muteSheet,setMuteSheet]=useState(false);
 const[inviteLink,setInviteLink]=useState<string|null>(null),[inviteBusy,setInviteBusy]=useState(false);
 const[mentionQuery,setMentionQuery]=useState<string|null>(null);
 const[highlightMsg,setHighlightMsg]=useState<string|null>(null);
 const[blocks,setBlocks]=useState<string[]>([]),[reportFor,setReportFor]=useState<Msg|null>(null),[reportReason,setReportReason]=useState("harassment"),[reportNote,setReportNote]=useState(""),[blockFor,setBlockFor]=useState<Msg|null>(null),[busyMod,setBusyMod]=useState(false);
 const[safety,setSafety]=useState(false);
 const[messageInfo,setMessageInfo]=useState<Msg|null>(null),[messageInfoReads,setMessageInfoReads]=useState<ReadReceipt[]>([]),[messageInfoPlays,setMessageInfoPlays]=useState<PlayReceipt[]>([]),[messageInfoDeliveries,setMessageInfoDeliveries]=useState<DeliveryReceipt[]>([]),[messageInfoMembers,setMessageInfoMembers]=useState<GroupMember[]>([]),[messageInfoBusy,setMessageInfoBusy]=useState(false);
 const REASONS:[string,string][]=[["harassment",t.reasonHarassment],["hate",t.reasonHate],["sexual",t.reasonSexual],["violence",t.reasonViolence],["spam",t.reasonSpam],["privacy",t.reasonPrivacy],["other",t.reasonOther]];

 const goBack=()=>{if(window.history.length>1)window.history.back();else window.location.assign("/")};
 const isStaff=!!staffRole;
 const isOwner=staffRole==="owner";
 const canManageGroup=(g:Group|null)=>!!g&&(isOwner||g.role==="owner"||g.role==="admin"||(!!me&&g.createdBy===me.id));
 const canDeleteGroup=(g:Group|null)=>!!g&&(isOwner||(!!me&&g.createdBy===me.id)||g.role==="owner");

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
  setListLoading(true);setListError(false);
  const{data:m,error:me1}=await db.from("community_group_members").select("group_id,role,muted,archived,favorite,muted_until").eq("user_id",uid);
  if(me1){setListError(true);setListLoading(false);return}
  const ids=(m||[]).map((x:any)=>x.group_id);
  if(!ids.length){setGroups([]);setListLoading(false);return}
  const{data:g,error:ge}=await db.from("community_groups").select("id,name,description,avatar_url,updated_at,created_by").in("id",ids).order("updated_at",{ascending:false});
  if(ge){setListError(true);setListLoading(false);return}
  const mm=new Map((m||[]).map((x:any)=>[x.group_id,x]));
  // Show the chat list immediately. Unread counts, member counts and signed avatars hydrate below.
  const quickRows=(g||[]).map((x:any)=>{
   const z:any=mm.get(x.id)||{};
   return{id:x.id,name:x.name,subtitle:x.description||"",description:x.description||"",unread:0,lastTime:new Date(x.updated_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),avatar:undefined,createdBy:x.created_by,role:z.role,muted:z.muted,mutedUntil:z.muted_until||null,archived:z.archived,favorite:z.favorite,memberCount:0};
  });
  setGroups(quickRows);setListLoading(false);
  // Hydrate real unread counts and previews without blocking the Community screen.
  const{data:allMsgs}=await db.from("community_messages").select("id,group_id,sender_id,body,media_type,created_at,deleted_at").in("group_id",ids).is("deleted_at",null).order("created_at");
  const otherIds=(allMsgs||[]).filter((x:any)=>x.sender_id!==uid).map((x:any)=>x.id);
  let readSet=new Set<string>();
  if(otherIds.length){
   const{data:rd}=await db.from("community_message_reads").select("message_id").eq("user_id",uid).in("message_id",otherIds);
   readSet=new Set((rd||[]).map((r:any)=>r.message_id));
  }
  const unreadBy:Record<string,number>={};const lastBy:Record<string,any>={};
  (allMsgs||[]).forEach((x:any)=>{
   lastBy[x.group_id]=x;
   if(x.sender_id!==uid&&!readSet.has(x.id))unreadBy[x.group_id]=(unreadBy[x.group_id]||0)+1;
  });
  const lastSenderIds=Array.from(new Set(Object.values(lastBy).map((x:any)=>x?.sender_id).filter((id:any)=>id&&id!==uid)));
  let lastSenderNames=new Map<string,string>();
  if(lastSenderIds.length){
   const{data:lastProfiles}=await db.from("profiles").select("id,username").in("id",lastSenderIds);
   lastSenderNames=new Map((lastProfiles||[]).map((p:any)=>[p.id,p.username||t.member]));
  }
  const rows=await Promise.all((g||[]).map(async(x:any)=>{
   const z:any=mm.get(x.id)||{};
   const{count}=await db.from("community_group_members").select("*",{count:"exact",head:true}).eq("group_id",x.id);
   const last=lastBy[x.id];
   const rawPreview=last?(last.body||(last.media_type?t.media:"")):"";
   const senderLabel=last?(last.sender_id===uid?L("You","Tú","Você"):(lastSenderNames.get(last.sender_id)||t.member)):"";
   const preview=last&&rawPreview?`${senderLabel}: ${rawPreview}`:rawPreview;
   const stamp=last?last.created_at:x.updated_at;
   return{id:x.id,name:x.name,subtitle:preview||x.description||`${count||0} ${(count||0)===1?t.member:t.members}`,description:x.description||"",unread:unreadBy[x.id]||0,lastTime:new Date(stamp).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),avatar:x.avatar_url?await signed(x.avatar_url):undefined,createdBy:x.created_by,role:z.role,muted:z.muted,mutedUntil:z.muted_until||null,archived:z.archived,favorite:z.favorite,memberCount:count||0};
  }));
  setGroups(rows);setListLoading(false);
 },[t.member,t.members,t.media]);


 const loadDiscover=useCallback(async()=>{
  setDiscoverLoading(true);
  const{data,error}=await db.rpc("discover_community_groups");
  if(error){setDiscoverList([]);setDiscoverLoading(false);return}
  const rows=await Promise.all((data||[]).map(async(x:any)=>({id:x.id,name:x.name,description:x.description,avatar:x.avatar_url?await signed(x.avatar_url):undefined,memberCount:Number(x.member_count)||0})));
  setDiscoverList(rows);setDiscoverLoading(false);
 },[]);

 const loadSenders=useCallback(async(ids:string[])=>{
  if(!ids.length)return;
  const{data}=await db.from("profiles").select("id,username,avatar_url").in("id",ids);
  setSenders(prev=>{const next={...prev};(data||[]).forEach((p:any)=>{next[p.id]={name:p.username||"Member",avatar:p.avatar_url}});return next});
 },[]);

 const reactionRequestSeq=useRef(0);
 const loadReactions=useCallback(async(ids:string[])=>{
  const seq=++reactionRequestSeq.current;
  if(!ids.length){setReactions({});return;}
  const{data:rx,error}=await db.from("community_reactions").select("message_id,user_id,emoji").in("message_id",ids);
  if(seq!==reactionRequestSeq.current||error)return;
  const visible=new Set(ids);
  const map:Record<string,Rx[]>={};
  (rx||[]).forEach((r:any)=>{if(!visible.has(r.message_id))return;(map[r.message_id]=map[r.message_id]||[]).push({user_id:r.user_id,emoji:r.emoji})});
  setReactions(map);
  loadSenders(Array.from(new Set((rx||[]).map((r:any)=>r.user_id))));
 },[loadSenders]);
 const messageLoadSeq=useRef(0);
 const loadMsgs=useCallback(async(id:string,uid?:string)=>{
  const request=++messageLoadSeq.current;
  const{data,error}=await db.from("community_messages").select("id,sender_id,body,media_url,media_type,created_at,deleted_at,starred,reply_to,pinned_at").eq("group_id",id).order("created_at");
  if(request!==messageLoadSeq.current)return;
  if(error){toast(L("Could not load messages. Please try again.","No se pudieron cargar los mensajes. Inténtalo de nuevo.","Não foi possível carregar as mensagens. Tente novamente."));return;}
  // Render message bubbles as soon as the database responds. Media URLs hydrate in the background.
  const rows=(data||[]).map((x:any)=>({...x,mine:x.sender_id===(uid||me?.id),url:undefined}));
  setMsgs(rows);
  const mediaRows=rows.filter((r:any)=>r.media_url&&!r.deleted_at);
  if(mediaRows.length){
   void Promise.allSettled(mediaRows.map(async(r:any)=>({id:r.id,url:await signed(r.media_url)}))).then(results=>{
    if(request!==messageLoadSeq.current)return;
    // A single expired or unavailable attachment must not prevent the rest from loading.
    const resolved=results.filter((x):x is PromiseFulfilledResult<{id:string;url:string}>=>x.status==="fulfilled").map(x=>x.value);
    const byId=new Map(resolved.map(x=>[x.id,x.url]));
    setMsgs(cur=>cur.map(x=>byId.has(x.id)?{...x,url:byId.get(x.id)}:x));
   });
  }
  loadSenders(Array.from(new Set(rows.map((r:any)=>r.sender_id))));
  const ids=rows.map((r:any)=>r.id);
  if(ids.length)await loadReactions(ids);else setReactions({});
  if(ids.length){
   const{data:st}=await db.from("community_message_stars").select("message_id").in("message_id",ids);
   if(request!==messageLoadSeq.current)return;
   setStarredIds(new Set((st||[]).map((r:any)=>r.message_id)));
  }else setStarredIds(new Set());
  const myId=uid||me?.id;
  if(ids.length&&myId){
   const fromOthers=rows.filter((r:any)=>r.sender_id!==myId&&!r.deleted_at).map((r:any)=>r.id);
   // Real device acknowledgement: these messages actually reached this device.
   if(fromOthers.length)await ackDelivered(fromOthers);
   if(request!==messageLoadSeq.current)return;
   const unreadOthers=fromOthers.map((id:string)=>({message_id:id,user_id:myId}));
   if(unreadOthers.length)await db.from("community_message_reads").upsert(unreadOthers,{onConflict:"message_id,user_id",ignoreDuplicates:true});
   if(request!==messageLoadSeq.current)return;
   const mineIds=rows.filter((r:any)=>r.sender_id===myId).map((r:any)=>r.id);
   if(mineIds.length){
    const{data:rd}=await db.from("community_message_reads").select("message_id,user_id").in("message_id",mineIds);
    if(request!==messageLoadSeq.current)return;
    const counts:Record<string,number>={};(rd||[]).forEach((r:any)=>{if(r.user_id!==myId)counts[r.message_id]=(counts[r.message_id]||0)+1});
    setReadCounts(counts);
    const{data:dd}=await db.from("community_message_deliveries").select("message_id,user_id").in("message_id",mineIds);
    if(request!==messageLoadSeq.current)return;
    const dc:Record<string,number>={};(dd||[]).forEach((r:any)=>{if(r.user_id!==myId)dc[r.message_id]=(dc[r.message_id]||0)+1});
    setDeliveredCounts(dc);
   }else{setReadCounts({});setDeliveredCounts({})}
  }

  setTimeout(()=>{if(request===messageLoadSeq.current)end.current?.scrollIntoView({behavior:"smooth"})},30);
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

 useEffect(()=>{visibleMessageIds.current=msgs.map(m=>m.id)},[msgs]);

 useEffect(()=>{if(!selected||!me)return;
  // Do not display messages, reactions or receipts from the previous group while this one loads.
  setMsgs([]);setReactions({});setStarredIds(new Set());setReadCounts({});setDeliveredCounts({});
  loadMsgs(selected.id,me.id);
  const c=supabase.channel(`chat:${selected.id}`).on("postgres_changes",{event:"*",schema:"public",table:"community_messages",filter:`group_id=eq.${selected.id}`},()=>loadMsgs(selected.id,me.id)).subscribe();
  const rc=supabase.channel(`rx:${selected.id}`).on("postgres_changes",{event:"*",schema:"public",table:"community_reactions"},()=>{const ids=visibleMessageIds.current;if(ids.length)void loadReactions(ids)}).subscribe();
  return()=>{
   // Invalidate pending fetches before another chat can render their results.
   messageLoadSeq.current+=1;
   reactionRequestSeq.current+=1;
   visibleMessageIds.current=[];
   supabase.removeChannel(c);supabase.removeChannel(rc);
  };
 },[selected?.id,me?.id,loadMsgs,loadReactions]);

 // group members (for @mentions and member actions)
 useEffect(()=>{if(!selected){setMembers([]);return}let alive=true;(async()=>{
  const{data:mm}=await db.from("community_group_members").select("user_id,role").eq("group_id",selected.id);
  const ids=(mm||[]).map((x:any)=>x.user_id);
  if(!ids.length){if(alive)setMembers([]);return}
  const{data:profs}=await db.from("profiles").select("id,username,avatar_url").in("id",ids);
  const pm=new Map((profs||[]).map((p:any)=>[p.id,p]));
  if(alive)setMembers((mm||[]).map((x:any)=>{const p:any=pm.get(x.user_id)||{};return{id:x.user_id,name:p.username||"Member",role:x.role,avatar:p.avatar_url}}));
 })();return()=>{alive=false}},[selected?.id]);

 // live profile identity: names/avatars always come from the user's own profile
 useEffect(()=>{
  const c=supabase.channel("profile-identity").on("postgres_changes",{event:"UPDATE",schema:"public",table:"profiles"},(payload:any)=>{
   const p:any=payload.new;if(!p?.id)return;
   const name=p.username||"Member";
   setSenders(prev=>prev[p.id]?{...prev,[p.id]:{name,avatar:p.avatar_url}}:prev);
   setMembers(prev=>prev.some(m=>m.id===p.id)?prev.map(m=>m.id===p.id?{...m,name,avatar:p.avatar_url}:m):prev);
   setMe(prev=>prev&&prev.id===p.id?{...prev,name,avatar:p.avatar_url}:prev);
  }).subscribe();
  return()=>{supabase.removeChannel(c)};
 },[]);

 // typing indicator (realtime broadcast only, nothing stored)
 useEffect(()=>{if(!selected||!me){typingChannel.current=null;setTyping({});return}
  setTyping({});
  const ch=supabase.channel(`typing:${selected.id}`,{config:{broadcast:{self:false}}})
   .on("broadcast",{event:"typing"},({payload}:any)=>{
    if(!payload?.id||payload.id===me.id)return;
    setTyping(v=>({...v,[payload.id]:{name:payload.name||t.member,at:Date.now()}}));
   })
   .subscribe();
  typingChannel.current=ch;
  const iv=window.setInterval(()=>setTyping(v=>{const now=Date.now();const next:typeof v={};let changed=false;Object.entries(v).forEach(([k,x])=>{if(now-x.at<4000)next[k]=x;else changed=true});return changed?next:v}),1500);
  return()=>{window.clearInterval(iv);typingChannel.current=null;supabase.removeChannel(ch)};
 },[selected?.id,me?.id,t.member]);

 const pingTyping=useCallback(()=>{
  const now=Date.now();
  if(!typingChannel.current||!me||now-lastTypingSent.current<1800)return;
  lastTypingSent.current=now;
  typingChannel.current.send({type:"broadcast",event:"typing",payload:{id:me.id,name:me.name}});
 },[me?.id,me?.name]);


 useEffect(()=>{if(!me||access!=="approved")return;
  const c=supabase.channel(`list:${me.id}`)
   .on("postgres_changes",{event:"*",schema:"public",table:"community_group_members",filter:`user_id=eq.${me.id}`},()=>loadGroups(me.id))
   .on("postgres_changes",{event:"*",schema:"public",table:"community_groups"},()=>loadGroups(me.id))
   .subscribe();
  return()=>{supabase.removeChannel(c)};
 },[me?.id,access,loadGroups]);

 useEffect(()=>{if(filter==="discover"&&access==="approved")loadDiscover()},[filter,access,loadDiscover]);

 const visible=useMemo(()=>groups.filter(g=>(showArchived?!!g.archived:!g.archived)&&(filter!=="unread"||g.unread>0)&&(g.name+" "+g.subtitle).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)),[groups,q,filter,showArchived]);

 useEffect(()=>{
  if(!selected||!me){setChatPrefs({wallpaper:"default",bubble:"#5C061F"});return}
  setChatPrefs(readChatPrefs(me.id,selected.id));
 },[selected?.id,me?.id]);
 const chatBackgroundStyle=chatPrefs.wallpaper.startsWith("data:image")
  ?{background:`url("${chatPrefs.wallpaper}") center / cover fixed`}
  :{background:wallpaperCss(chatPrefs.wallpaper)};

 const requestAccess=async()=>{
  if(!me)return;setRequesting(true);
  await db.from("community_access_requests").insert({user_id:me.id,status:"pending"});
  await loadAccess(me.id);setRequesting(false);
 };

 const createGroup=async(g:CreatedGroup):Promise<boolean>=>{
  if(!me||!canCreate){toast(t.noPermission);return false}
  let path:string|undefined;
  try {
   if(g.avatar?.startsWith("blob:")){
    const b=await fetch(g.avatar).then(r=>r.blob());
    const imagePath=`${me.id}/groups/${crypto.randomUUID()}.jpg`;
    const{error:uploadError}=await supabase.storage.from("community-media").upload(imagePath,b,{contentType:b.type||"image/jpeg"});
    if(uploadError){toast(uploadError.message||actionFailedLabel);return false}
    path=imagePath;
   }
   const{data:x,error}=await db.from("community_groups").insert({name:g.name,description:g.subtitle,avatar_url:path||null,created_by:me.id}).select().single();
   if(error||!x){toast(error?.message||actionFailedLabel);return false}
   const invitedIds=Array.from(new Set((g.memberIds||[]).filter(id=>id!==me.id)));
   const{error:membersError}=await db.from("community_group_members").insert([{group_id:x.id,user_id:me.id,role:"owner"},...invitedIds.map(id=>({group_id:x.id,user_id:id,role:"member"}))]);
   if(membersError){
    toast(L("Group created, but members could not be added. Open the group to retry.","Grupo creado, pero no se pudieron agregar los miembros. Abre el grupo e inténtalo de nuevo.","Grupo criado, mas não foi possível adicionar os membros. Abra o grupo e tente novamente."));
    await loadGroups(me.id);return true;
   }
   if(invitedIds.length)void dispatchPush({kind:"invite",group_id:x.id,user_ids:invitedIds});
   await loadGroups(me.id);
   return true;
  } catch(e){
   toast(e instanceof Error?e.message:actionFailedLabel);
   return false;
  }
 };

 // Server-side push dispatch. Credentials stay on the server; failures never block chat.
 const dispatchPush=async(payload:any)=>{try{await supabase.functions.invoke("community-push",{body:payload})}catch{/* push is best-effort */}};

 const send=async()=>{if(!draft.trim()||!selected||!me)return;const body=draft.trim().slice(0,10000);
  if(isBlockedContent(body)){toast(t.contentBlocked);return}
  const originalReply=replyTo;const r=originalReply?.id||null;setDraft("");setReplyTo(null);
  try{
   const{data:inserted,error}=await db.from("community_messages").insert({group_id:selected.id,sender_id:me.id,body,reply_to:r}).select("id").single();
   if(error||!inserted?.id){setDraft(current=>current||body);setReplyTo(current=>current||originalReply);toast(/CONTENT_BLOCKED/.test(error?.message||"")?t.contentBlocked:(error?.message||actionFailedLabel));return}
   void dispatchPush({kind:"message",message_id:inserted.id});
  }catch(e){setDraft(current=>current||body);setReplyTo(current=>current||originalReply);toast(e instanceof Error?e.message:actionFailedLabel)}
 };

 const upload=async(f?:File)=>{
  if(!f||!selected||!me)return;
  if(f.size>50*1024*1024){toast(L("Files must be 50 MB or smaller.","Los archivos deben ser de 50 MB o menos.","Os arquivos devem ter no máximo 50 MB."));return}
  const kind=f.type.startsWith("image/")?"image":f.type.startsWith("video/")?"video":f.type.startsWith("audio/")?"audio":"document";
  const safe=f.name.replace(/[^\w.-]+/g,"_");
  const path=`${me.id}/${selected.id}/${Date.now()}-${safe}`;
  try{
   const{error:uploadError}=await supabase.storage.from("community-media").upload(path,f,{contentType:f.type||"application/octet-stream",upsert:false});
   if(uploadError){toast(uploadError.message||actionFailedLabel);return}
   const r=replyTo?.id||null;
   const{data:inserted,error:messageError}=await db.from("community_messages").insert({group_id:selected.id,sender_id:me.id,media_url:path,media_type:kind,reply_to:r}).select("id").single();
   if(messageError||!inserted?.id){
    void supabase.storage.from("community-media").remove([path]);
    toast(messageError?.message||actionFailedLabel);
    return;
   }
   setReplyTo(null);
   void dispatchPush({kind:"message",message_id:inserted.id});
  }catch(e){toast(e instanceof Error?e.message:actionFailedLabel)}
 };


 const deleteMsg=async(m:Msg)=>{
  if(!me||!selected)return;
  if(!(m.sender_id===me.id||canManageGroup(selected)))return;
  await db.from("community_messages").update({deleted_at:new Date().toISOString()}).eq("id",m.id);
  setConfirmDel(null);setMenu(null);
  setMsgs(v=>v.map(x=>x.id===m.id?{...x,deleted_at:new Date().toISOString(),url:undefined}:x));
 };

 const toast=(s:string)=>{setFlash(s);window.setTimeout(()=>setFlash(""),1600)};
  const openReactionDetails=(m:Msg)=>{
   setMenu(null);setReactBar(null);setEmojiPicker(null);setRxDetail(m);
   const ids=Array.from(new Set((reactions[m.id]||[]).map(reaction=>reaction.user_id)));
   if(ids.length)loadSenders(ids);
  };
 const react=async(m:Msg,emoji:string)=>{
  if(!me)return;setMenu(null);setReactBar(null);setEmojiPicker(null);
  // An older reaction fetch must not replace the reaction just applied to this message.
  reactionRequestSeq.current += 1;
  const previous=reactions[m.id]||[];
  const mine=previous.find(r=>r.user_id===me.id);
  const remove=mine?.emoji===emoji;
   setReactions(v=>{const list=(v[m.id]||[]).filter(r=>r.user_id!==me.id);return{...v,[m.id]:remove?list:[...list,{user_id:me.id,emoji}]}});
   const{error}=remove
    ?await db.from("community_reactions").delete().eq("message_id",m.id).eq("user_id",me.id)
    :await db.from("community_reactions").upsert({message_id:m.id,user_id:me.id,emoji},{onConflict:"message_id,user_id"});
   if(error){
    // Do not overwrite a newer reaction if another tap happened while this request was pending.
    setReactions(v=>{
     const currentMine=(v[m.id]||[]).find(r=>r.user_id===me.id);
     const expected=remove?undefined:emoji;
     if(currentMine?.emoji!==expected)return v;
     const others=(v[m.id]||[]).filter(r=>r.user_id!==me.id);
     const oldMine=previous.find(r=>r.user_id===me.id);
     return {...v,[m.id]:oldMine?[...others,oldMine]:others};
    });
    toast(actionFailedLabel);
   }
 };
 const toggleStar=async(m:Msg)=>{
  setMenu(null);
  const uid=me?.id;
  if(!uid)return;
  const wasStarred=starredIds.has(m.id);
  setStarredIds(prev=>{const next=new Set(prev);if(wasStarred)next.delete(m.id);else next.add(m.id);return next});
  const{error}=wasStarred
   ?await db.from("community_message_stars").delete().eq("message_id",m.id).eq("user_id",uid)
   :await db.from("community_message_stars").insert({message_id:m.id,user_id:uid});
  if(error){
   console.error("Star update failed",error);
   setStarredIds(prev=>{const next=new Set(prev);if(wasStarred)next.add(m.id);else next.delete(m.id);return next});
   toast(starErrorToast);
   return;
  }
  toast(wasStarred?unstarredToast:starredToast);
 };
 const copyMsg=async(m:Msg)=>{
  setMenu(null);
  try{await navigator.clipboard.writeText(m.body||m.url||"");toast(copiedLabel)}catch{/* unavailable */}
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


 const openMessageInfo=async(m:Msg)=>{
   if(!me||!m.mine||!selected)return;
   setMenu(null);setMessageInfo(m);setMessageInfoReads([]);setMessageInfoPlays([]);setMessageInfoDeliveries([]);setMessageInfoMembers([]);setMessageInfoBusy(true);
   const membersPromise=db.from("community_group_members").select("user_id,role").eq("group_id",selected.id);
  const readsPromise=db.from("community_message_reads").select("user_id,read_at").eq("message_id",m.id).order("read_at",{ascending:true});
  const deliveriesPromise=db.from("community_message_deliveries").select("user_id,delivered_at").eq("message_id",m.id).order("delivered_at",{ascending:true});
  const playsPromise=m.media_type==="audio"?db.from("community_audio_plays").select("user_id,played_at").eq("message_id",m.id).order("played_at",{ascending:true}):Promise.resolve({data:[],error:null});
   const [{data:memberRows,error:memberError},{data:reads,error:readError},{data:deliveries,error:deliveryError},{data:plays,error:playError}]=await Promise.all([membersPromise,readsPromise,deliveriesPromise,playsPromise]);
   const recipientRows=(memberRows||[]).filter((row:any)=>row.user_id!==m.sender_id);
   const recipientIds=recipientRows.map((row:any)=>row.user_id);
   const{data:profiles,error:profileError}=recipientIds.length?await db.from("profiles").select("id,username,avatar_url").in("id",recipientIds):{data:[],error:null};
  setMessageInfoBusy(false);
   if(memberError||profileError||readError||playError||deliveryError){toast(memberError?.message||profileError?.message||readError?.message||deliveryError?.message||playError?.message||actionFailedLabel);return}
   const currentIds=new Set(recipientIds);
   const profileMap=new Map((profiles||[]).map((profile:any)=>[profile.id,profile]));
    const currentMembers:GroupMember[]=recipientRows.map((row:any)=>{const profile:any=profileMap.get(row.user_id)||{};return{id:String(row.user_id),name:String(profile.username||t.member),role:row.role?String(row.role):undefined,avatar:profile.avatar_url?String(profile.avatar_url):null}});
   setMessageInfoMembers(currentMembers);
   setMembers(previous=>{
    const currentMap=new Map(currentMembers.map(member=>[member.id,member]));
    if(m.sender_id===me.id)currentMap.set(me.id,{id:me.id,name:me.name||t.member,avatar:me.avatar});
     return Array.from(currentMap.values()) as GroupMember[];
   });
   setMessageInfoReads((reads||[]).filter((receipt:any)=>currentIds.has(receipt.user_id)));
   setMessageInfoDeliveries((deliveries||[]).filter((receipt:any)=>currentIds.has(receipt.user_id)));
   setMessageInfoPlays((plays||[]).filter((receipt:any)=>currentIds.has(receipt.user_id)));
 };

 const beginMessageGesture=(event:React.PointerEvent<HTMLDivElement>,m:Msg)=>{
  const target=event.target as HTMLElement;
  if(event.pointerType === "mouse" && event.button !== 0)return;
  if(target.closest("[data-message-gesture-ignore],a,video,input")||target.closest("button:not([data-message-swipe-control])"))return;
  if(press.current){window.clearTimeout(press.current);press.current=null}
  swipe.current={id:m.id,x:event.clientX,y:event.clientY,pointerId:event.pointerId,locked:false,offset:0};
  const messageElement=event.currentTarget;
  // Fast, deliberate long press: quick enough to feel native without firing on normal taps.
  press.current=window.setTimeout(()=>{
   press.current=null;
   if(swipe.current?.id!==m.id)return;
   placeReactionMenu(messageElement);
   setMenu(null);setEmojiPicker(null);setReactBar(m);
   try{navigator.vibrate?.(8)}catch{/* optional haptic */}
  },520);
 };
 const moveMessageGesture=(event:React.PointerEvent<HTMLDivElement>,m:Msg)=>{
  const active=swipe.current;
  if(!active||active.id!==m.id||active.pointerId!==event.pointerId)return;
  const dx=event.clientX-active.x,dy=event.clientY-active.y;
  // Give fingers a little natural movement before cancelling long press.
  if((Math.abs(dx)>10||Math.abs(dy)>10)&&press.current){window.clearTimeout(press.current);press.current=null}
  if(!active.locked){
   if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.15){swipe.current=null;setSwipeVisual(null);return}
   // Own messages swipe left for Message Info. Any message can swipe right to Reply.
   const horizontal=Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)+3;
   const allowed=horizontal&&((m.mine&&dx<0)||dx>0);
   if(!allowed)return;
   active.locked=true;
   if(press.current){window.clearTimeout(press.current);press.current=null}
   setReactBar(null);
   try{event.currentTarget.setPointerCapture(event.pointerId)}catch{/* iOS may already own pointer */}
  }
  const direction=m.mine&&dx<0?-1:1;
  if((direction<0&&dx>=0)||(direction>0&&dx<=0))return;
  event.preventDefault();
  const distance=Math.min(92,Math.max(0,Math.abs(dx)-2));
  const translated=distance<=52?distance:52+(distance-52)*0.28;
  active.offset=direction*translated;
  setSwipeVisual({id:m.id,offset:active.offset});
 };
 const endMessageGesture=(event:React.PointerEvent<HTMLDivElement>,m:Msg)=>{
  if(press.current){window.clearTimeout(press.current);press.current=null}
  const active=swipe.current;
  swipe.current=null;
  setSwipeVisual(null);
  if(active?.id===m.id&&active.locked){
   suppressSwipeClick.current=m.id;
   window.setTimeout(()=>{if(suppressSwipeClick.current===m.id)suppressSwipeClick.current=null},220);
  }
  if(active?.id===m.id&&active.locked&&Math.abs(active.offset)>=32){
   try{navigator.vibrate?.(6)}catch{/* optional haptic */}
   if(active.offset>0)setReplyTo(m);
   else if(m.mine)openMessageInfo(m);
  }
  try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{/* ignore */}
 };
 const cancelMessageGesture=(event:React.PointerEvent<HTMLDivElement>)=>{
  if(press.current){window.clearTimeout(press.current);press.current=null}
  swipe.current=null;
  setSwipeVisual(null);
  try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{/* ignore */}
 };

 const reportAudioPlayed=async(m:Msg)=>{
  if(!me||m.mine||m.media_type!=="audio")return;
  await db.from("community_audio_plays").upsert({message_id:m.id,user_id:me.id,played_at:new Date().toISOString()},{onConflict:"message_id,user_id"});
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
 const memberUpdate=async(ch:any)=>{if(!selected||!me)return;const{muted,archived,favorite,mutedUntil}=ch;const safe:any={};if(muted!==undefined)safe.muted=muted;if(archived!==undefined)safe.archived=archived;if(favorite!==undefined)safe.favorite=favorite;if(mutedUntil!==undefined)safe.muted_until=mutedUntil;if(!Object.keys(safe).length)return;const{error}=await db.from("community_group_members").update(safe).eq("group_id",selected.id).eq("user_id",me.id);if(error){toast(error.message||actionFailedLabel);return}setSelected(s=>s?{...s,...ch}:s);setGroups(v=>v.map(g=>g.id===selected.id?{...g,...ch}:g));toast(savedLabel)};
 const saveGroup=async()=>{if(!selected||!canManageGroup(selected))return;const nextName=name.trim()||selected.name;const nextDesc=desc.trim();const{error}=await db.from("community_groups").update({name:nextName,description:nextDesc,updated_at:new Date().toISOString()}).eq("id",selected.id);if(error){toast(error.message||actionFailedLabel);return}setSelected(s=>s?{...s,name:nextName,description:nextDesc,subtitle:nextDesc||s.subtitle}:s);setGroups(v=>v.map(g=>g.id===selected.id?{...g,name:nextName,description:nextDesc,subtitle:nextDesc||g.subtitle}:g));setEdit(false);toast(savedLabel)};
 const changePhoto=async(f?:File)=>{if(!f||!selected||!me||!canManageGroup(selected))return;const path=`${me.id}/groups/${selected.id}-${Date.now()}.jpg`;const{error:uploadError}=await supabase.storage.from("community-media").upload(path,f,{contentType:f.type,upsert:true});if(uploadError){toast(uploadError.message||actionFailedLabel);return}const{error:updateError}=await db.from("community_groups").update({avatar_url:path}).eq("id",selected.id);if(updateError){toast(updateError.message||actionFailedLabel);return}const url=await signed(path);setSelected(s=>s?{...s,avatar:url}:s);setGroups(v=>v.map(g=>g.id===selected.id?{...g,avatar:url}:g));toast(photoUpdatedLabel)};
 const deleteGroupNow=async()=>{if(!selected||!me||!canDeleteGroup(selected))return;const groupId=selected.id;const{error:memberError}=await db.from("community_group_members").delete().eq("group_id",groupId);if(memberError){toast(memberError.message||actionFailedLabel);return}const{error:groupError}=await db.from("community_groups").delete().eq("id",groupId);if(groupError){toast(groupError.message||actionFailedLabel);return}setConfirmDelGroup(false);setEdit(false);setSelected(null);setInfo(false);await loadGroups(me.id);toast(lang==="es"?"Grupo eliminado":lang==="pt"?"Grupo excluído":"Group deleted")};
 const leave=async()=>{if(!selected||!me)return;if(selected.role==="owner"||selected.createdBy===me.id){setConfirmLeave(false);toast(ownerLeaveBlockedLabel);return}const{error}=await db.from("community_group_members").delete().eq("group_id",selected.id).eq("user_id",me.id);if(error){toast(error.message||actionFailedLabel);return}setConfirmLeave(false);setSelected(null);setInfo(false);await loadGroups(me.id);toast(lang==="es"?"Saliste del grupo":lang==="pt"?"Você saiu do grupo":"You left the group")};

 // ---- invite links ----
 const buildInviteUrl=(token:string)=>`https://prayerandfire.app/community?invite=${encodeURIComponent(token)}`;
 const shareInviteLink=async(url:string)=>{
  try{
   if(navigator.share){await navigator.share({title:selected?.name,text:inviteLinkLabel,url});return}
   await navigator.clipboard.writeText(url);toast(inviteLinkCopiedLabel);
  }catch{try{await navigator.clipboard.writeText(url);toast(inviteLinkCopiedLabel)}catch{/* unavailable */}}
 };
 const makeInviteLink=async()=>{
  if(!selected||!canManageGroup(selected)||inviteBusy)return;
  setInviteBusy(true);
  const{data,error}=await db.rpc("create_group_invite_link",{_group_id:selected.id});
  setInviteBusy(false);
  if(error||!data){toast(/NO_PERMISSION/.test(error?.message||"")?t.noPermission:(error?.message||actionFailedLabel));return}
  const url=buildInviteUrl(String(data));
  setInviteLink(url);toast(inviteLinkReadyLabel);
 };
 const revokeInviteLinks=async()=>{
  if(!selected||!canManageGroup(selected))return;
  const{error}=await db.rpc("revoke_group_invite_links",{_group_id:selected.id});
  if(error){toast(error.message||actionFailedLabel);return}
  setInviteLink(null);toast(savedLabel);
 };
 useEffect(()=>{if(access!=="approved"||!me)return;
  const params=new URLSearchParams(window.location.search);
  const token=params.get("invite");
  if(!token)return;
  params.delete("invite");
  window.history.replaceState({},"",`${window.location.pathname}${params.toString()?`?${params}`:""}`);
  (async()=>{
   const{data,error}=await db.rpc("join_group_by_invite_token",{_token:token});
   if(error){toast(error.message||actionFailedLabel);return}
   const status=(data as any)?.status;
   if(status==="joined"){await loadGroups(me.id);toast(inviteJoinedLabel)}
   else if(status==="already_member")toast(inviteAlreadyLabel);
   else if(status==="not_approved")toast(inviteNotApprovedLabel);
   else toast(inviteInvalidLabel);
  })();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[access,me?.id]);

 // ---- push notifications: only resume users who already opted in ----
 useEffect(()=>{if(access!=="approved"||!me)return;
  if(pushPreferred())void resumePush();
 },[access,me?.id]);

 // ---- notification tap deep link ----
 useEffect(()=>{
  const apply=(d:{groupId:string;messageId?:string}|null)=>{if(d?.groupId)pendingDeepLink.current=d};
  apply(takePushOpen());
  const params=new URLSearchParams(window.location.search);
  const g=params.get("group");
  if(g){apply({groupId:g,messageId:params.get("message")||undefined});params.delete("group");params.delete("message");window.history.replaceState({},"",`${window.location.pathname}${params.toString()?`?${params}`:""}`)}
  const onOpen=(e:any)=>{apply(e?.detail);const target=groups.find(x=>x.id===e?.detail?.groupId);if(target)setSelected(target)};
  window.addEventListener("pf-push-open",onOpen as EventListener);
  return()=>window.removeEventListener("pf-push-open",onOpen as EventListener);
 },[groups]);

 useEffect(()=>{
  const d=pendingDeepLink.current;
  if(!d||!groups.length)return;
  const target=groups.find(x=>x.id===d.groupId);
  if(!target)return;
  pendingDeepLink.current=null;
  setSelected(target);
  if(d.messageId)window.setTimeout(()=>jumpToMsg(d.messageId!),900);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[groups]);

 // ---- pinned messages ----

 const pinned=useMemo(()=>msgs.filter(m=>m.pinned_at&&!m.deleted_at).sort((a,b)=>String(b.pinned_at).localeCompare(String(a.pinned_at))),[msgs]);
 const togglePin=async(m:Msg)=>{
  setMenu(null);
  if(!selected||!canManageGroup(selected)){toast(t.noPermission);return}
  const next=m.pinned_at?null:new Date().toISOString();
  const{error}=await db.from("community_messages").update({pinned_at:next}).eq("id",m.id);
  if(error){toast(/NO_PERMISSION/.test(error.message||"")?t.noPermission:(error.message||actionFailedLabel));return}
  setMsgs(v=>v.map(x=>x.id===m.id?{...x,pinned_at:next}:x));
  if(next)dispatchPush({kind:"pinned",message_id:m.id});
  toast(next?pinnedDoneLabel:unpinnedDoneLabel);

 };
 const jumpToMsg=(id:string)=>{
  const el=msgRefs.current[id];
  if(!el)return;
  el.scrollIntoView({behavior:"smooth",block:"center"});
  setHighlightMsg(id);window.setTimeout(()=>setHighlightMsg(h=>h===id?null:h),1600);
 };

 // ---- mute durations ----
 const muteFor=async(hours:number|null)=>{
  setMuteSheet(false);
  if(hours===0){await memberUpdate({muted:false,mutedUntil:null});return}
  const until=hours?new Date(Date.now()+hours*3600000).toISOString():null;
  await memberUpdate({muted:true,mutedUntil:until});
 };
 const muteActive=(g:Group|null)=>!!g?.muted&&(!g.mutedUntil||new Date(g.mutedUntil).getTime()>Date.now());

 // ---- @mentions ----
 const onDraftChange=(value:string)=>{
  setDraft(value);
  pingTyping();
  const m=value.match(/(?:^|\s)@([\p{L}\w.]*)$/u);
  setMentionQuery(m?m[1].toLowerCase():null);
 };
 const mentionOptions=useMemo(()=>{
  if(mentionQuery===null)return[] as GroupMember[];
  return members.filter(p=>p.id!==me?.id&&p.name.toLowerCase().includes(mentionQuery)).slice(0,5);
 },[mentionQuery,members,me?.id]);
 const pickMention=(p:GroupMember)=>{
  setDraft(d=>d.replace(/@([\p{L}\w.]*)$/u,`@${p.name.replace(/\s+/g,"")} `));
  setMentionQuery(null);
 };
 const renderBody=(text:string)=>text.split(/(@[\p{L}\w.]+)/u).map((part,i)=>part.startsWith("@")?<span key={i} className="font-bold text-[#E7BC7B] bg-[#5C061F]/30 rounded px-0.5">{part}</span>:<React.Fragment key={i}>{part}</React.Fragment>);
 const messageStatus=(m:Msg):"sent"|"delivered"|"read"=>readCounts[m.id]?"read":deliveredCounts[m.id]?"delivered":"sent";
 const messageStatusIcon=(m:Msg)=>messageStatus(m)==="read"?<CheckCheck className="w-3.5 h-3.5 text-sky-600"/>:messageStatus(m)==="delivered"?<CheckCheck className="w-3.5 h-3.5 text-black/50"/>:<Check className="w-3.5 h-3.5 text-black/50"/>;
 const receiptRows=(receipts:Array<ReadReceipt|DeliveryReceipt|PlayReceipt>,timeKey:"read_at"|"delivered_at"|"played_at")=>receipts.length===0?<div className="px-4 pb-4 text-sm text-muted-foreground">—</div>:receipts.map(receipt=>{const person=messageInfoMembers.find(member=>member.id===receipt.user_id);if(!person)return null;const timestamp=String((receipt as any)[timeKey]);return <div key={receipt.user_id} className="mx-4 flex items-center gap-3 border-t border-border py-3 first:border-t-0"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-bold text-primary ring-1 ring-border">{person.avatar?<img src={person.avatar} alt="" className="h-full w-full object-cover"/>:person.name[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-foreground">{person.name}</div><div className="text-xs text-muted-foreground">{new Date(timestamp).toLocaleDateString()}</div></div><time className="shrink-0 text-sm tabular-nums text-muted-foreground">{new Date(timestamp).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</time></div>});

 if(access==="loading")return <div className="fixed inset-0 bg-black" />;
 if(access!=="approved")return <AccessGate t={t} status={access} busy={requesting} onRequest={requestAccess} onBack={goBack} />;
 if(panel&&isStaff)return <CommunityAdminPanel t={t} meId={me.id} isOwner={isOwner} onClose={()=>setPanel(false)} onChanged={()=>me&&loadGroups(me.id)} />;
 if(membersModal&&selected)return <MembersModal t={t} groupId={selected.id} mode={membersModal} canManage={canManageGroup(selected)} onClose={()=>setMembersModal(null)} onChanged={()=>me&&loadGroups(me.id)} />;

 if(selected&&info)return <div className="fixed inset-0 bg-[#080808] text-white overflow-y-auto" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}><header className="sticky top-0 z-20 h-16 bg-black/95 border-b border-white/10 px-3 flex items-center gap-3"><button onClick={()=>setInfo(false)} className="w-10 h-10 grid place-items-center"><ArrowLeft/></button><b className="flex-1">{t.info}</b>{canManageGroup(selected)&&<button onClick={()=>{setName(selected.name);setDesc(selected.description||"");setEdit(true)}} className="w-10 h-10 grid place-items-center"><Settings/></button>}</header><div className="p-6 text-center border-b border-white/10"><button onClick={()=>canManageGroup(selected)&&photo.current?.click()} className="relative w-28 h-28 rounded-full overflow-hidden bg-zinc-900">{selected.avatar?<img src={selected.avatar} alt="" className="w-full h-full object-cover"/>:<span className="w-full h-full grid place-items-center bg-[#5C061F]"><img src={brandLogo} alt="" className="h-full w-full rounded-full object-cover" /></span>}{canManageGroup(selected)&&<span className="absolute bottom-0 inset-x-0 bg-black/70 py-2 flex justify-center"><Camera className="w-5 h-5"/></span>}</button><input ref={photo} type="file" accept="image/*" className="hidden" onChange={e=>{changePhoto(e.target.files?.[0]);e.target.value=""}}/><h2 className="text-2xl font-black mt-4">{selected.name}</h2><button type="button" onClick={()=>setMembersModal("members")} className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-zinc-200 active:bg-white/10" aria-label={L("View group members","Ver miembros del grupo","Ver membros do grupo")}><Users className="h-4 w-4 text-[#E5BB70]"/>{memberCountLabel(selected.memberCount||0)}<ChevronRight className="h-4 w-4 text-zinc-400"/></button>{selected.description&&<p className="mt-3 text-zinc-300">{selected.description}</p>}</div><div className="m-4 rounded-2xl overflow-hidden border border-[#E5BB70]/25 bg-zinc-950"><button onClick={()=>{setInfo(false);setVoiceRoomOpen(true)}} className="w-full min-h-14 px-4 py-3 flex items-center gap-3 text-left text-[#E5BB70]"><Mic className="w-5 h-5 shrink-0"/><span className="flex-1 font-semibold">{L("Join prayer voice room","Entrar en la sala de oración","Entrar na sala de oração")}</span><ChevronRight className="w-5 h-5"/></button></div><div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setMuteSheet(true)} className="w-full h-14 px-4 flex items-center gap-3 border-b border-white/5">{muteActive(selected)?<BellOff/>:<Bell/>}<span className="flex-1 text-left">{muteActive(selected)?(selected.mutedUntil?`${mutedUntilLabel} ${new Date(selected.mutedUntil).toLocaleString()}`:t.unmute):muteForLabel}</span><ChevronRight/></button><button onClick={()=>memberUpdate({archived:!selected.archived})} className="w-full h-14 px-4 flex items-center gap-3"><FileText/><span className="flex-1 text-left">{selected.archived?unarchiveLabel:archivedLabel}</span><ChevronRight/></button></div><div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setMediaOpen(true)} className="w-full h-14 px-4 flex items-center gap-3 border-b border-white/5"><FileText/><span className="flex-1 text-left">{mediaSectionLabel}</span><ChevronRight/></button><button onClick={()=>{setInfo(false);setChatSearch(true);setCsq("")}} className="w-full h-14 px-4 flex items-center gap-3"><Search/><span className="flex-1 text-left">{searchMessagesLabel}</span><ChevronRight/></button></div>{mediaOpen&&<div className="fixed inset-0 z-[70] bg-black/85 flex items-end" onClick={()=>setMediaOpen(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-zinc-950 border-t border-white/10 p-4 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between items-center mb-3"><b>{mediaSectionLabel}</b><button onClick={()=>setMediaOpen(false)} aria-label={t.cancel}><X/></button></div>{(()=>{const live=msgs.filter(m=>!m.deleted_at);const media=live.filter(m=>m.url&&(m.media_type==="image"||m.media_type==="video"));const docs=live.filter(m=>m.url&&(m.media_type==="document"||m.media_type==="audio"));const links=live.flatMap(m=>(m.body||"").match(/https?:\/\/\S+/g)||[]);if(!media.length&&!docs.length&&!links.length)return <p className="py-10 text-center text-sm text-zinc-500">{t.noResults}</p>;return <div className="space-y-4">{media.length>0&&<div className="grid grid-cols-3 gap-1.5">{media.map(m=>m.media_type==="image"?<img key={m.id} src={m.url} alt="" className="w-full aspect-square object-cover rounded-lg"/>:<video key={m.id} src={m.url} className="w-full aspect-square object-cover rounded-lg" muted playsInline/>)}</div>}{docs.map(m=><a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2.5 border-t border-white/5 text-sm"><FileText className="w-4 h-4 text-[#E5BB70] shrink-0"/><span className="truncate">{m.media_type==="audio"?t.voiceMessage:t.document}</span></a>)}{links.map((u,i)=><a key={u+i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2.5 border-t border-white/5 text-sm text-[#E7BC7B]"><Link2 className="w-4 h-4 shrink-0"/><span className="truncate">{u}</span></a>)}</div>})()}</div></div>}<div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setMembersModal("members")} className="w-full h-14 px-4 flex items-center gap-3 border-b border-white/5"><Users/><span className="flex-1 text-left">{t.currentMembers}</span><ChevronRight/></button><button onClick={()=>memberUpdate({favorite:!selected.favorite})} className="w-full h-14 px-4 flex items-center gap-3"><Star className={selected.favorite?"fill-current text-[#E5BB70]":"text-zinc-400"}/><span className="flex-1 text-left">{selected.favorite?(lang==="es"?"Quitar de favoritos":lang==="pt"?"Remover dos favoritos":"Remove from favorites"):(lang==="es"?"Agregar a favoritos":lang==="pt"?"Adicionar aos favoritos":"Add to favorites")}</span><ChevronRight/></button></div>{canManageGroup(selected)&&<div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setMembersModal("add")} className="w-full h-14 px-4 flex items-center gap-3 border-b border-white/5"><UserPlus/><span className="flex-1 text-left">{t.addMembers}</span><ChevronRight/></button><button onClick={()=>setMembersModal("admins")} className="w-full h-14 px-4 flex items-center gap-3"><ShieldCheck/><span className="flex-1 text-left">{t.admins}</span><ChevronRight/></button></div>}{canManageGroup(selected)&&<div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={makeInviteLink} disabled={inviteBusy} className="w-full h-14 px-4 flex items-center gap-3 disabled:opacity-60"><Link2/><span className="flex-1 text-left">{inviteLinkLabel}</span><ChevronRight/></button>{inviteLink&&<div className="px-4 pb-4 border-t border-white/5 pt-3"><p className="text-xs text-zinc-400 break-all">{inviteLink}</p><div className="mt-3 flex gap-2"><button onClick={()=>shareInviteLink(inviteLink)} className="flex-1 h-11 rounded-xl bg-[#5C061F] text-black font-black flex items-center justify-center gap-2"><Copy className="w-4 h-4"/>{L("Copy / share","Copiar / compartir","Copiar / compartilhar")}</button><button onClick={revokeInviteLinks} className="h-11 px-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold">{L("Revoke","Revocar","Revogar")}</button></div></div>}</div>}{muteSheet&&<div className="fixed inset-0 z-[62] bg-black/80 flex items-end" onClick={()=>setMuteSheet(false)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between items-center mb-3"><b>{muteForLabel}</b><button onClick={()=>setMuteSheet(false)} aria-label={t.cancel}><X/></button></div><button onClick={()=>muteFor(8)} className="w-full py-3 px-2 text-left border-t border-white/5">{mute8hLabel}</button><button onClick={()=>muteFor(168)} className="w-full py-3 px-2 text-left border-t border-white/5">{mute1wLabel}</button><button onClick={()=>muteFor(null)} className="w-full py-3 px-2 text-left border-t border-white/5">{muteAlwaysLabel}</button><button onClick={()=>muteFor(0)} className="w-full py-3 px-2 text-left border-t border-white/5 text-[#E7BC7B]">{t.unmute}</button></div></div>}<div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setChatAppearanceOpen(true)} className="w-full h-14 px-4 flex items-center gap-3"><Settings className="text-[#E5BB70]"/><span className="flex-1 text-left">{L("Chat appearance","Apariencia del chat","Aparência do chat")}</span><ChevronRight/></button></div>{chatAppearanceOpen&&me&&<ChatAppearanceModal uid={me.id} groupId={selected.id} language={lang} onClose={()=>setChatAppearanceOpen(false)} onChange={setChatPrefs}/>} <div className="m-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950"><button onClick={()=>setSafety(true)} className="w-full h-14 px-4 flex items-center gap-3"><ShieldCheck className="text-[#E5BB70]"/><span className="flex-1 text-left">{L("Community rules & safety","Reglas y seguridad de la Comunidad","Regras e segurança da Comunidade")}</span><ChevronRight/></button></div>{safety&&<SafetyRulesModal lang={lang} onClose={()=>setSafety(false)}/>}<div className="m-4 rounded-2xl border border-white/10 bg-zinc-950"><button onClick={()=>setConfirmLeave(true)} className="w-full h-14 px-4 flex items-center gap-3 text-red-400"><LogOut/><span>{t.exit}</span></button>{canDeleteGroup(selected)&&<button onClick={()=>setConfirmDelGroup(true)} className="w-full h-14 px-4 flex items-center gap-3 text-red-400 border-t border-white/5"><Trash2/><span>{t.deleteGroup}</span></button>}</div>{confirmLeave&&<div className="fixed inset-0 z-[61] bg-black/80 grid place-items-center px-8" onClick={()=>setConfirmLeave(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.exit}</b><p className="mt-2 text-sm text-zinc-400">{leaveConfirmBody}</p><div className="mt-6 flex gap-3"><button onClick={()=>setConfirmLeave(false)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={leave} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black">{t.exit}</button></div></div></div>}{confirmDelGroup&&<div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center px-8" onClick={()=>setConfirmDelGroup(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.deleteGroup}</b><p className="mt-2 text-sm text-zinc-400">{t.deleteGroupBody}</p><div className="mt-6 flex gap-3"><button onClick={()=>setConfirmDelGroup(false)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={deleteGroupNow} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black">{t.delete}</button></div></div></div>}{edit&&<div className="fixed inset-0 z-50 bg-black/70 flex items-end"><div className="w-full rounded-t-3xl bg-zinc-950 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between"><b>{t.edit}</b><button onClick={()=>setEdit(false)}><X/></button></div><button onClick={()=>photo.current?.click()} className="mt-5 w-full h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-2 text-sm font-bold"><Camera className="w-4 h-4"/>{lang==="es"?"Cambiar foto del grupo":lang==="pt"?"Alterar foto do grupo":"Change group photo"}</button><input value={name} onChange={e=>setName(e.target.value)} className="mt-5 w-full h-12 bg-zinc-900 rounded-xl px-3"/><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder={t.desc} className="mt-3 w-full bg-zinc-900 rounded-xl p-3" rows={4}/><button onClick={saveGroup} className="mt-4 w-full h-12 rounded-xl bg-[#5C061F] text-black font-black">{t.save}</button>{canDeleteGroup(selected)&&<button onClick={()=>{setEdit(false);setConfirmDelGroup(true)}} className="mt-3 w-full h-12 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2"><Trash2 className="w-5 h-5"/>{t.deleteGroup}</button>}</div></div>}</div>;

 if(selected)return <div className="fixed inset-0 flex flex-col bg-black text-white" style={{paddingTop:"env(safe-area-inset-top)",colorScheme:"dark"}}>
  <header className="shrink-0 min-h-16 px-2 bg-black/95 text-white border-b border-white/10 flex items-center gap-2 backdrop-blur"><button onClick={()=>{setSelected(null);if(me)loadGroups(me.id)}} aria-label={t.back} className="w-11 h-11 grid place-items-center"><ArrowLeft className="h-5 w-5"/></button><button onClick={()=>setInfo(true)} className="flex-1 min-w-0 flex items-center gap-2.5 text-left">{selected.avatar?<img src={selected.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"/>:<span className="w-11 h-11 shrink-0 rounded-full border border-[#E5BB70]/45 bg-[#5C061F] grid place-items-center"><img src={brandLogo} alt="" className="h-full w-full rounded-full object-cover" /></span>}<div className="min-w-0"><b className="block truncate text-[15px] leading-tight">{selected.name}</b><span className="text-xs text-zinc-400">{memberCountLabel(selected.memberCount||0)}</span></div></button><button onClick={()=>setVoiceRoomOpen(true)} aria-label={lang==="es"?"Entrar en sala de voz":lang==="pt"?"Entrar na sala de voz":"Join voice room"} className="flex h-11 w-11 items-center justify-center rounded-full text-[#E5BB70]" title={lang==="es"?"Sala de oración por voz":lang==="pt"?"Sala de oração por voz":"Prayer voice room"}><Mic className="h-5 w-5"/></button><button onClick={()=>{setChatSearch(v=>!v);setCsq("")}} aria-label={searchMessagesLabel} className="w-11 h-11 grid place-items-center"><Search className="w-5 h-5"/></button><button onClick={()=>setInfo(true)} aria-label={t.info} className="w-11 h-11 grid place-items-center"><MoreHorizontal className="w-5 h-5"/></button></header>
  {voiceRoomOpen && me?.id && <VoiceRoom groupId={selected.id} name={selected.name} userId={me.id} userName={me.name || "Member"} language={lang} onClose={()=>setVoiceRoomOpen(false)} />}
  {chatSearch&&<div className="shrink-0 px-3 py-2 bg-black border-b border-white/10"><div className="h-11 rounded-xl bg-zinc-900 border border-white/10 px-3 flex items-center gap-2"><Search className="w-4 h-4 text-zinc-500"/><input autoFocus value={csq} onChange={e=>setCsq(e.target.value)} placeholder={searchMessagesLabel} className="flex-1 bg-transparent outline-none text-sm min-w-0"/><button onClick={()=>{setChatSearch(false);setCsq("")}} aria-label={t.cancel}><X className="w-4 h-4"/></button></div></div>}
  {pinned.length>0&&<div className="shrink-0 px-3 py-2 bg-zinc-950 border-b border-white/10 space-y-1.5">{pinned.slice(0,3).map(p=><div key={p.id} className="flex items-center gap-2"><button onClick={()=>jumpToMsg(p.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left"><Pin className="w-4 h-4 text-[#E5BB70] shrink-0"/><span className="flex-1 min-w-0 truncate text-xs"><b className="text-[#E7BC7B]">{pinnedLabel}</b> <span className="text-zinc-300">{p.body||t.media}</span></span></button>{canManageGroup(selected)&&<button onClick={()=>togglePin(p)} aria-label={unpinLabel} className="w-7 h-7 rounded-full bg-zinc-900 grid place-items-center shrink-0"><PinOff className="w-3.5 h-3.5 text-zinc-400"/></button>}</div>)}</div>}
  <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-6 space-y-3.5" style={chatBackgroundStyle}>
    {msgs.filter(m=>!blocks.includes(m.sender_id)).filter(m=>!csq.trim()||(m.body||"").toLowerCase().includes(csq.trim().toLowerCase())).map((m,mi,arr)=>{
     const s=senders[m.sender_id]||(m.sender_id===me?.id?{name:me?.name,avatar:me?.avatar}:undefined);
    const time=new Date(m.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
    const canDeleteMessage=m.sender_id===me?.id||canManageGroup(selected);
    const parent=m.reply_to?msgs.find(x=>x.id===m.reply_to):undefined;
    if(m.deleted_at)return null;
    const dayOf=(v:string)=>new Date(v).toDateString();
    const prevVisible=arr.slice(0,mi).reverse().find(x=>!x.deleted_at);
    const showDay=!prevVisible||dayOf(prevVisible.created_at)!==dayOf(m.created_at);
    const today=new Date().toDateString();
    const yest=new Date(Date.now()-86400000).toDateString();
    const msgDate=new Date(m.created_at);
    const diffDays=Math.floor((new Date(today).getTime()-new Date(dayOf(m.created_at)).getTime())/86400000);
    const sameYear=msgDate.getFullYear()===new Date().getFullYear();
    const dayLabel=dayOf(m.created_at)===today?todayLabel:dayOf(m.created_at)===yest?yesterdayLabel:diffDays>=0&&diffDays<7?msgDate.toLocaleDateString(locale,{weekday:"long"}):msgDate.toLocaleDateString(locale,{weekday:"short",day:"numeric",month:"short",...(sameYear?{}:{year:"numeric"})});
    return <React.Fragment key={m.id}>
    {showDay&&<div className="flex justify-center py-2.5"><span className="rounded-full border border-white/10 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">{dayLabel}</span></div>}
    <div ref={el=>{msgRefs.current[m.id]=el}} className={`relative flex mb-1.5 ${m.mine?"justify-end":"justify-start"} ${reactBar?.id===m.id?"z-40 scale-[1.015] drop-shadow-[0_12px_22px_rgba(0,0,0,0.35)]":""} ${highlightMsg===m.id?"rounded-2xl ring-2 ring-[#E5BB70]/70":""}`}>
      {swipeVisual?.id===m.id&&<div aria-hidden="true" className={`absolute top-1/2 flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950 px-2.5 text-[#E5BB70] shadow-sm ${swipeVisual.offset<0?"right-1":"left-1"}`} style={{opacity:Math.min(1,Math.abs(swipeVisual.offset)/24),transform:`translateY(-50%) scale(${Math.min(1,0.86+Math.abs(swipeVisual.offset)/160)})`}}>{swipeVisual.offset<0?<Info className="h-4 w-4"/>:<CornerUpLeft className="h-4 w-4"/>}<span className="text-xs font-semibold">{swipeVisual.offset<0?t.info:t.reply}</span></div>}
     {!m.mine&&m.media_type!=="audio"&&<div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#5C061F] text-xs font-semibold text-[#EAC77D]" aria-label={s?.name||t.member}>
      {s?.avatar?<img src={s.avatar} alt="" className="h-full w-full object-cover" loading="lazy"/>:(s?.name||t.member).trim().charAt(0).toUpperCase()}
     </div>}
     <div
      onContextMenu={e=>{e.preventDefault();placeReactionMenu(e.currentTarget);setReactBar(m)}}
        onClickCapture={event=>{if(suppressSwipeClick.current===m.id){event.preventDefault();event.stopPropagation();suppressSwipeClick.current=null}}}
       onPointerDown={event=>beginMessageGesture(event,m)}
       onPointerMove={event=>moveMessageGesture(event,m)}
       onPointerUp={event=>endMessageGesture(event,m)}
       onPointerCancel={cancelMessageGesture}
       style={{WebkitTouchCallout:"none",WebkitUserSelect:reactBar?.id===m.id?"none":undefined,touchAction:"pan-y",backgroundColor:m.mine?(chatPrefs.bubble==="#ff6a00"?"#5C061F":chatPrefs.bubble):undefined,transform:swipeVisual?.id===m.id?`translateX(${swipeVisual.offset}px)`:"translateX(0)",transition:swipeVisual?.id===m.id?"none":"transform 180ms ease-out"}}
      className={`group relative ${m.media_type==="audio"?"w-[min(76vw,310px)] max-w-[calc(100vw-68px)]":!m.mine?"max-w-[calc(86%-2.5rem)]":"max-w-[86%]"} select-none shadow-sm ${m.media_type==="audio"?`px-2.5 py-2 border border-slate-300/80 bg-gradient-to-br from-[#F2F4F7] to-[#C9CED6] text-slate-900 ${m.mine?"rounded-2xl rounded-tr-md":"rounded-2xl rounded-tl-md"}`:`px-3 py-2.5 ${m.mine?"rounded-2xl rounded-tr-md bg-[#5C061F] text-[#FFF4DE]":"rounded-2xl rounded-tl-md border border-[#D2AA67]/20 bg-[#211820] text-[#F8F4EE]"}`}`}
     >
      {reactBar?.id===m.id&&<div className={`absolute ${reactionPlacement.toolbarBelow?"top-full mt-2":"-top-14"} z-40 ${m.mine?"right-0":"left-0"} flex w-max max-w-[calc(100vw-24px)] items-center gap-0.5 overflow-x-auto overscroll-contain rounded-full bg-black border border-[#E5BB70]/40 shadow-xl shadow-black/60 px-1 py-1`}>
       {EMOJIS.map(e=><button key={e} aria-label={`React ${e}`} data-message-gesture-ignore onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();react(m,e)}} className={`w-9 h-11 shrink-0 rounded-full text-lg grid place-items-center active:scale-95 transition-transform ${(reactions[m.id]||[]).some(r=>r.user_id===me?.id&&r.emoji===e)?"bg-[#5C061F]/25":""}`}>{e}</button>)}
       <button data-message-gesture-ignore onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();setReactBar(null);setEmojiPicker(m)}} aria-label={emojiTitle} className="w-9 h-11 shrink-0 rounded-full bg-zinc-900 border border-white/10 grid place-items-center text-[#E5BB70] active:scale-95 transition-transform"><Plus className="w-4 h-4"/></button>
      </div>}
      {reactBar?.id===m.id&&<div className={`absolute ${reactionPlacement.toolbarBelow?"bottom-full mb-2":reactionPlacement.actionsAbove?"bottom-full mb-[72px]":"top-full mt-2"} z-40 ${m.mine?"right-0":"left-0"} flex min-w-[210px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-[#E5BB70]/25 bg-black text-[#F8F4EE] shadow-2xl shadow-black/60`}>
       <button data-message-gesture-ignore onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();setReplyTo(m);setReactBar(null)}} className="flex min-h-11 items-center gap-3 px-4 text-left text-sm active:bg-white/10"><CornerUpLeft className="h-4 w-4 text-[#E5BB70]"/>{t.reply}</button>
       <button data-message-gesture-ignore onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();setReactBar(null);forwardMsg(m)}} className="flex min-h-11 items-center gap-3 border-t border-white/10 px-4 text-left text-sm active:bg-white/10"><Send className="h-4 w-4 text-[#E5BB70]"/>{forwardLabel}</button>
       <button data-message-gesture-ignore onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();setReactBar(null);setMenu(m)}} className="flex min-h-11 items-center gap-3 border-t border-white/10 px-4 text-left text-sm active:bg-white/10"><MoreHorizontal className="h-4 w-4 text-[#E5BB70]"/>{t.options}</button>
      </div>}
      {<div className={`text-[11px] font-bold mb-1 ${m.media_type==="audio"?"text-slate-800":m.mine?"text-[#F4D7A1]":"text-[#E7BD73]"}`}>{m.mine?(me?.name||t.you):(s?.name||t.member)}</div>}
      {(reactions[m.id]||[]).length>0&&<div className="absolute -bottom-3 right-2 z-10 flex justify-end">{(reactions[m.id]||[]).length>0&&<button data-message-gesture-ignore onClick={ev=>{ev.stopPropagation();openReactionDetails(m)}} aria-label={t.reactions} className="inline-flex min-h-6 max-w-full items-center gap-1 rounded-full border border-[#D5B574]/70 bg-[#22212A] px-2 py-0.5 text-[12px] text-[#F6D89B] shadow-sm">
       {Array.from(new Set((reactions[m.id]||[]).map(r=>r.emoji))).slice(0,3).map(e=><span key={e}>{e}</span>)}
       {(reactions[m.id]||[]).length>1&&<span className="text-[11px] text-zinc-300">{(reactions[m.id]||[]).length}</span>}
      </button>}</div>}
      {parent&&<div className={`mb-1 rounded-lg px-2 py-1 text-[11px] border-l-2 ${m.mine?"bg-black/20 border-[#E7BD73]/60 text-[#FFE7BC]":"bg-black/30 border-[#D2AA67] text-zinc-300"}`}><b>{senders[parent.sender_id]?.name||t.member}</b><div className="truncate">{parent.deleted_at?t.messageDeleted:parent.body||t.media}</div></div>}
      {m.pinned_at&&<div className={`flex items-center gap-1 text-[10px] mb-0.5 ${m.mine?"text-[#FFE7BC]/70":"text-[#E7BD73]"}`}><Pin className="w-3 h-3"/>{pinnedLabel}</div>}
       {m.body&&<p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-[1.45]">{renderBody(m.body)}</p>}
       {m.media_type==="image"&&m.url&&<img src={m.url} alt="" draggable={false} onClick={()=>setImageViewer({url:m.url!,title:m.mine?(me?.name||t.you):(s?.name||t.member)})} onContextMenu={e=>e.preventDefault()} className="max-h-80 rounded-xl object-cover select-none cursor-zoom-in"/>}
       {m.media_type==="video"&&m.url&&<video src={m.url} controls playsInline preload="metadata" className="max-h-80 rounded-xl"/>}
      {m.media_type==="audio"&&m.url&&(starredIds.has(m.id)||m.starred)&&<div className="flex justify-end -mt-1 mb-1"><Star className="w-3 h-3 fill-current text-[#E5BB70]"/></div>}
        {m.media_type==="audio"&&m.url&&<AudioBubble url={m.url} mine={m.mine} avatar={s?.avatar||(m.mine?me?.avatar:undefined)} name={s?.name||(m.mine?me?.name:undefined)} time={time} errorLabel={t.audioError} downloadLabel={t.download} resolve={()=>signed(m.media_url)} onPlayed={()=>reportAudioPlayed(m)} status={m.mine?messageStatus(m):undefined} seekLabel={audioPositionLabel} playLabel={playAudioLabel} pauseLabel={pauseAudioLabel}/>} 
      {m.media_type==="document"&&m.url&&<a href={m.url} target="_blank" rel="noreferrer" className="underline">{t.document}</a>}
        {m.media_type!=="audio"&&<div className="mt-1.5 flex items-center justify-end gap-1 text-xs tabular-nums opacity-65">{(starredIds.has(m.id)||m.starred)&&<Star className="mr-1 h-3 w-3 fill-current text-primary"/>}<time>{time}</time>{m.mine&&messageStatusIcon(m)}</div>}

      <button onClick={()=>setMenu(m)} aria-label={t.options} className={`absolute top-1 ${m.mine?"-left-8":"-right-8"} w-7 h-7 rounded-full bg-zinc-900/90 border border-white/10 text-zinc-300 grid place-items-center`}><MoreHorizontal className="w-4 h-4"/></button>
      {canDeleteMessage&&m.media_type==="audio"&&m.starred&&<Star className="absolute -top-2 -right-2 w-3 h-3 text-[#E5BB70] fill-current"/>}
     </div>
    </div>
    </React.Fragment>;
   })}
   <div ref={end} className="h-4" aria-hidden="true"/>
  </main>
  {Object.keys(typing).length>0&&<div className="shrink-0 px-4 pb-1 text-[11px] text-[#E7BC7B]">{Object.keys(typing).length===1?`${Object.values(typing)[0].name} ${typingLabel}`:typingManyLabel}</div>}
  <div className="shrink-0 border-t border-white/10 bg-black text-white px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
   {mentionOptions.length>0&&<div className="mb-2 rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden">{mentionOptions.map(p=><button key={p.id} onClick={()=>pickMention(p)} className="w-full px-3 py-2.5 flex items-center gap-2 text-left border-b border-white/5 last:border-0"><span className="w-7 h-7 rounded-full bg-zinc-900 grid place-items-center text-[#E5BB70] text-xs font-black overflow-hidden">{p.avatar?<img src={p.avatar} alt="" className="w-full h-full object-cover"/>:p.name[0]?.toUpperCase()}</span><span className="text-sm truncate">{p.name}</span></button>)}</div>}
   {replyTo&&!rec&&<div className="mb-2 flex items-center gap-2 rounded-xl bg-zinc-900 border-l-2 border-[#E5BB70] px-3 py-2 text-xs"><CornerUpLeft className="w-4 h-4 text-[#E5BB70] shrink-0"/><div className="flex-1 min-w-0"><b className="text-[#E5BB70]">{t.replying} {replyTo.mine?t.you:senders[replyTo.sender_id]?.name||""}</b><div className="truncate text-zinc-400">{replyTo.body||t.media}</div></div><button onClick={()=>setReplyTo(null)} aria-label={t.cancel}><X className="w-4 h-4"/></button></div>}
   {rec?<VoiceRecorder t={t} onSend={upload} onClose={()=>setRec(false)}/>:
   <div className="flex gap-2">
    <button onClick={()=>file.current?.click()} className="w-11 h-11 rounded-full bg-zinc-900 grid place-items-center"><Paperclip/></button>
    <input ref={file} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={e=>{upload(e.target.files?.[0]);e.target.value=""}}/>
    <div className="flex-1 bg-zinc-900 rounded-full px-4 flex items-center gap-2 min-w-0"><input maxLength={10000} value={draft} onChange={e=>onDraftChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setMentionQuery(null);send()}}} placeholder={t.type} className="flex-1 bg-transparent outline-none min-w-0"/><button onClick={()=>file.current?.click()} aria-label={t.media}><Camera className="w-5 h-5"/></button></div>
    {draft.trim()?<button onClick={send} aria-label={t.send} className="w-11 h-11 rounded-full bg-[#E5BB70] text-[#21101A] border border-[#FFF1C9]/70 grid place-items-center"><Send/></button>:<button onClick={()=>setRec(true)} aria-label={t.voiceMessage} className="w-11 h-11 rounded-full bg-[#E5BB70] text-[#21101A] border border-[#FFF1C9]/70 shadow-md shadow-black/30 grid place-items-center focus-visible:ring-2 focus-visible:ring-white active:scale-95 transition-transform"><Mic className="w-5 h-5"/></button>}
   </div>}
  </div>
  {flash&&<div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-zinc-900 border border-white/10 px-4 py-2 text-sm">{flash}</div>}
  {menu&&<div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={()=>setMenu(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-h-[min(82dvh,760px)] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-[#B68749]/25 bg-[#120D12] p-4 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl">
   <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden="true"/><div className="flex justify-between items-center mb-3"><b className="text-lg">{t.options}</b><button onClick={()=>setMenu(null)} aria-label={t.cancel} className="grid h-10 w-10 place-items-center rounded-full bg-white/5"><X className="h-5 w-5"/></button></div>
   <div className="flex gap-2 pb-3 overflow-x-auto overscroll-x-contain">{EMOJIS.map(e=><button key={e} onClick={()=>react(menu,e)} className={`w-11 h-11 shrink-0 rounded-full border text-xl grid place-items-center ${(reactions[menu.id]||[]).some(r=>r.user_id===me?.id&&r.emoji===e)?"bg-[#5C061F] border-[#D3AA67]":"bg-zinc-900 border-white/10"}`}>{e}</button>)}<button onClick={()=>{const mm=menu;setMenu(null);setEmojiPicker(mm)}} aria-label={emojiTitle} className="w-11 h-11 shrink-0 rounded-full bg-zinc-900 border border-white/10 text-[#D3AA67] grid place-items-center"><Plus className="w-5 h-5"/></button></div>
   <button onClick={()=>{setReplyTo(menu);setMenu(null)}} className="w-full h-13 py-3 px-2 flex items-center gap-3 border-t border-white/5"><CornerUpLeft className="w-5 h-5 text-[#E5BB70]"/><span>{t.reply}</span></button>
   {menu.mine&&<button onClick={()=>openMessageInfo(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Info className="w-5 h-5 text-[#E5BB70]"/><span>{messageInfoLabel}</span></button>}
   {canManageGroup(selected)&&<button onClick={()=>togglePin(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5">{menu.pinned_at?<PinOff className="w-5 h-5 text-[#E5BB70]"/>:<Pin className="w-5 h-5 text-[#E5BB70]"/>}<span>{menu.pinned_at?unpinLabel:pinLabel}</span></button>}
   <button onClick={()=>copyMsg(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Copy className="w-5 h-5 text-[#E5BB70]"/><span>{copyLabel}</span></button><button onClick={()=>forwardMsg(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Send className="w-5 h-5 text-[#E5BB70]"/><span>{forwardLabel}</span></button><button onClick={()=>toggleStar(menu)} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Star className={`w-5 h-5 text-[#E5BB70]${starredIds.has(menu.id)?" fill-current":""}`}/><span>{starredIds.has(menu.id)?unstarLabel:starLabel}</span></button>
   {menu.sender_id!==me?.id&&<button onClick={()=>{const mm=menu;setMenu(null);setReportFor(mm)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5"><Flag className="w-5 h-5 text-[#E5BB70]"/><span>{t.report}</span></button>}
   {menu.sender_id!==me?.id&&<button onClick={()=>{const mm=menu;setMenu(null);setBlockFor(mm)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5 text-red-400"><Ban className="w-5 h-5"/><span>{t.block}</span></button>}
   {(menu.sender_id===me?.id||canManageGroup(selected))&&<button onClick={()=>{setConfirmDel(menu);setMenu(null)}} className="w-full py-3 px-2 flex items-center gap-3 border-t border-white/5 text-red-400"><Trash2 className="w-5 h-5"/><span>{t.deleteMsg}</span></button>}
  </div></div>}
    {messageInfo&&<div className="fixed inset-0 z-[70] overflow-y-auto bg-background text-foreground" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
     <header className="sticky top-0 z-20 flex h-14 items-center border-b border-[#BA9259]/20 bg-background/95 px-2 backdrop-blur"><button onClick={()=>setMessageInfo(null)} aria-label={t.back} className="grid h-11 w-11 place-items-center"><ArrowLeft className="h-5 w-5"/></button><b className="flex-1 pr-11 text-center text-[17px]">{messageInfoLabel}</b></header>
     <div className="mx-auto max-w-xl px-4 pb-8 pt-6">
      <div className={`flex pb-6 ${messageInfo.sender_id===me?.id?"justify-end":"justify-start"}`}>
       <div className={`max-w-[88%] rounded-2xl px-3 py-2.5 shadow-sm ${messageInfo.sender_id===me?.id?"rounded-tr-md text-white":"rounded-tl-md bg-zinc-900 text-zinc-100"}`} style={messageInfo.sender_id===me?.id?{backgroundColor:chatPrefs.bubble}:undefined}>
        {messageInfo.sender_id!==me?.id&&<p className="mb-1 text-xs font-semibold text-[#E8BD74]">{senders[messageInfo.sender_id]?.name||t.member}</p>}
        {messageInfo.body&&<p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-[1.45]">{renderBody(messageInfo.body)}</p>}
        {messageInfo.media_type==="image"&&messageInfo.url&&<img src={messageInfo.url} alt="" onClick={()=>setImageViewer({url:messageInfo.url!,title:messageInfo.sender_id===me?.id?(me?.name||t.you):(senders[messageInfo.sender_id]?.name||t.member)})} className="max-h-64 rounded-xl object-cover cursor-zoom-in"/>}
        {messageInfo.media_type==="video"&&messageInfo.url&&<video src={messageInfo.url} controls playsInline preload="metadata" className="max-h-64 rounded-xl"/>}
        {messageInfo.media_type==="document"&&messageInfo.url&&<a href={messageInfo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 text-sm font-semibold"><FileText className="h-5 w-5"/><span>{t.document}</span></a>}
        {messageInfo.media_type==="audio"&&messageInfo.url&&<AudioBubble url={messageInfo.url} mine={messageInfo.sender_id===me?.id} avatar={senders[messageInfo.sender_id]?.avatar||(messageInfo.sender_id===me?.id?me?.avatar:undefined)} name={senders[messageInfo.sender_id]?.name||(messageInfo.sender_id===me?.id?me?.name:t.member)} time={new Date(messageInfo.created_at).toLocaleTimeString(locale,{hour:"numeric",minute:"2-digit"})} errorLabel={t.audioError} downloadLabel={t.download} resolve={()=>signed(messageInfo.media_url)} status={messageInfo.sender_id===me?.id?messageStatus(messageInfo):undefined} seekLabel={audioPositionLabel} playLabel={playAudioLabel} pauseLabel={pauseAudioLabel}/>} 
        {messageInfo.media_type!=="audio"&&<div className="mt-1.5 flex items-center justify-end gap-1 text-xs tabular-nums opacity-70"><time>{new Date(messageInfo.created_at).toLocaleTimeString(locale,{hour:"numeric",minute:"2-digit"})}</time>{messageStatusIcon(messageInfo)}</div>}
      </div>
     </div>
      <div className="overflow-hidden rounded-2xl border border-[#BA9259]/20 bg-card shadow-sm">
       <div className="flex items-center gap-3 px-4 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-muted"><Check className="h-4 w-4 text-muted-foreground"/></span><span className="flex-1 text-sm font-semibold">{sentLabel}</span><div className="text-right text-sm tabular-nums text-muted-foreground"><div>{new Date(messageInfo.created_at).toLocaleTimeString(locale,{hour:"numeric",minute:"2-digit"})}</div><div className="text-xs">{new Date(messageInfo.created_at).toLocaleDateString(locale)}</div></div></div>
       {messageInfoBusy?<div className="border-t border-border px-4 py-5 text-sm text-muted-foreground">{t.loading}</div>:messageInfoMembers.length===0?<div className="border-t border-border px-4 py-5 text-center text-sm text-muted-foreground">{noOtherRecipientsLabel}</div>:<>
        <section className="border-t border-border"><div className="flex items-center gap-3 px-4 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/10"><CheckCheck className="h-4 w-4 text-sky-600"/></span><span className="text-sm font-semibold">{readByLabel}</span></div>{receiptRows(messageInfoReads,"read_at")}</section>
        <section className="border-t border-border"><div className="flex items-center gap-3 px-4 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-muted"><CheckCheck className="h-4 w-4 text-muted-foreground"/></span><span className="text-sm font-semibold">{deliveredToLabel}</span></div>{receiptRows(messageInfoDeliveries,"delivered_at")}</section>
        {messageInfo.media_type==="audio"&&<section className="border-t border-border"><div className="flex items-center gap-3 px-4 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10"><Mic className="h-4 w-4 text-primary"/></span><span className="text-sm font-semibold">{playedByLabel}</span></div>{receiptRows(messageInfoPlays,"played_at")}</section>}
      </>}
     </div>
    </div>
   </div>}
  {imageViewer&&<ImageViewer url={imageViewer.url} title={imageViewer.title} onClose={()=>setImageViewer(null)}/>}
  <ReactionEmojiPicker open={!!emojiPicker} title={emojiTitle} selected={emojiPicker?(reactions[emojiPicker.id]||[]).find(r=>r.user_id===me?.id)?.emoji:undefined} onClose={()=>setEmojiPicker(null)} onPick={emoji=>emojiPicker&&react(emojiPicker,emoji)}/>
  {reactBar&&<div className="fixed inset-0 z-30 bg-black/35" onClick={()=>setReactBar(null)}/>} 
   {rxDetail&&<div className="fixed inset-0 z-50 flex items-end bg-black/80" onClick={()=>setRxDetail(null)}><div role="dialog" aria-modal="true" aria-labelledby="reaction-details-title" onClick={e=>e.stopPropagation()} className="max-h-[70vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-zinc-950 px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl">
    <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-zinc-700"/>
    <div className="mb-2 flex min-h-12 items-center justify-between"><b id="reaction-details-title" className="text-[17px]">{t.reactions}</b><button onClick={()=>setRxDetail(null)} aria-label={t.cancel} className="grid h-11 w-11 place-items-center rounded-full bg-zinc-900 text-zinc-200"><X className="h-5 w-5"/></button></div>
    {(reactions[rxDetail.id]||[]).length===0?<p className="border-t border-white/5 py-8 text-center text-sm text-zinc-500">{t.noReactions}</p>:(reactions[rxDetail.id]||[]).map(r=><div key={r.user_id+r.emoji} className="flex min-h-14 items-center gap-3 border-t border-white/5 py-2.5">
     <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-900 text-sm font-bold text-[#E5BB70]">{senders[r.user_id]?.avatar?<img src={senders[r.user_id]?.avatar||undefined} alt="" className="h-full w-full object-cover"/>:(r.user_id===me?.id?me?.name:senders[r.user_id]?.name||t.member)?.[0]?.toUpperCase()}</div>
     <span className="flex-1 truncate text-[15px] font-medium">{r.user_id===me?.id?t.you:senders[r.user_id]?.name||t.member}</span>
     <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
    </div>)}
  </div></div>}
  {reportFor&&<div className="fixed inset-0 z-[60] bg-black/80 flex items-end" onClick={()=>setReportFor(null)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-4 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto">
   <div className="flex justify-between items-center mb-3"><b>{t.reportTitle}</b><button onClick={()=>setReportFor(null)} aria-label={t.cancel}><X/></button></div>
   <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">{t.reportReason}</div>
   <div className="space-y-2">{REASONS.map(([k,label])=><button key={k} onClick={()=>setReportReason(k)} className={`w-full text-left px-4 py-3 rounded-2xl border ${reportReason===k?"bg-[#5C061F]/40 border-[#E5BB70]/60 text-[#E8BD74]":"bg-zinc-900 border-white/10 text-zinc-300"}`}>{label}</button>)}</div>
   <textarea value={reportNote} onChange={e=>setReportNote(e.target.value.slice(0,500))} placeholder={t.reportDetails} rows={3} className="mt-3 w-full rounded-2xl bg-zinc-900 border border-white/10 p-3 outline-none text-sm"/>
   <button disabled={busyMod} onClick={submitReport} className="mt-3 w-full h-12 rounded-2xl bg-[#5C061F] text-black font-black disabled:opacity-60">{t.submit}</button>
  </div></div>}
  {blockFor&&<div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center px-8" onClick={()=>setBlockFor(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6">
   <b className="text-lg">{t.blockTitle}</b><p className="text-sm text-zinc-400 mt-2">{t.blockBody}</p>
   <div className="mt-6 flex gap-3"><button onClick={()=>setBlockFor(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button disabled={busyMod} onClick={confirmBlock} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black disabled:opacity-60">{t.block}</button></div>
  </div></div>}
  {confirmDel&&<div className="fixed inset-0 z-50 bg-black/80 grid place-items-center px-8" onClick={()=>setConfirmDel(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6"><b className="text-lg">{t.deleteMsg}</b><div className="mt-6 flex gap-3"><button onClick={()=>setConfirmDel(null)} className="flex-1 h-12 rounded-2xl bg-zinc-900">{t.cancel}</button><button onClick={()=>deleteMsg(confirmDel)} className="flex-1 h-12 rounded-2xl bg-red-500 text-black font-black">{t.delete}</button></div></div></div>}
 </div>;

 return <div className="fixed inset-0 bg-black text-white overflow-hidden" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}><div className="max-w-xl mx-auto h-full bg-[#080808] flex flex-col"><header className="shrink-0 px-4 pt-3 pb-3 border-b border-white/5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><button onClick={goBack} aria-label={t.back} className="w-10 h-10 rounded-full bg-zinc-900 grid place-items-center shrink-0"><ArrowLeft className="w-5 h-5"/></button><span role="img" aria-label="Prayer & Fire" className="w-11 h-11 shrink-0 rounded-full border border-[#E5BB70]/60 bg-[#5C061F] grid place-items-center"><img src={brandLogo} alt="" className="h-full w-full rounded-full object-cover" /></span><div className="flex-1 min-w-0"><div className="text-[10px] tracking-[.2em] text-amber-300 font-bold">PRAYER &amp; FIRE</div><h1 className="text-lg font-bold leading-tight">{t.title}</h1>{me&&<div className="text-xs text-zinc-500 truncate">{me.name}</div>}</div></div><div className="flex items-center gap-1 shrink-0">{isStaff&&<button onClick={()=>setPanel(true)} aria-label={t.requestsPanel} className="relative w-9 h-9 rounded-full bg-zinc-900 text-[#D5AD6C] grid place-items-center"><ShieldCheck className="w-5 h-5"/>{pendingCount>0&&<span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#5C061F] text-black text-[11px] font-black grid place-items-center">{pendingCount}</span>}</button>}<button onClick={()=>setSafety(true)} aria-label={L("Community rules & safety","Reglas y seguridad de la Comunidad","Regras e segurança da Comunidade")} className="w-9 h-9 rounded-full bg-zinc-900 text-[#D5AD6C] grid place-items-center"><Info className="w-5 h-5"/></button>{safety&&<SafetyRulesModal lang={lang} onClose={()=>setSafety(false)}/>}<button onClick={()=>setPushSheet(true)} aria-label={pushSettingsLabel} className="w-9 h-9 rounded-full bg-zinc-900 text-[#D5AD6C] grid place-items-center"><Bell className="w-5 h-5"/></button><button onClick={()=>canCreate?setCreate(true):toast(t.onlyAdminsCreate)} className={`w-10 h-10 rounded-full grid place-items-center ${canCreate?"bg-[#5C061F] border border-[#D5AD6C]/40 text-[#FFE6B2]":"bg-zinc-900 text-zinc-500"}`} aria-label={t.new}><Plus className="w-5 h-5"/></button></div></div></header><div className="shrink-0 px-4 pt-3 pb-2"><div className="bg-zinc-900 border border-white/10 rounded-2xl h-12 px-4 flex items-center gap-2"><Search className="w-5 h-5 text-zinc-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search} className="bg-transparent outline-none flex-1 min-w-0"/></div><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={()=>setShowArchived(false)} className={`h-10 rounded-xl text-sm font-semibold ${!showArchived?"bg-[#5C061F] text-[#FFE6B2] border border-[#D5AD6C]/30":"bg-zinc-900 text-zinc-400"}`}>{activeLabel}</button><button onClick={()=>setShowArchived(true)} className={`h-10 rounded-xl text-sm font-semibold ${showArchived?"bg-[#5C061F] text-[#FFE6B2] border border-[#D5AD6C]/30":"bg-zinc-900 text-zinc-400"}`}>{archivedLabel}</button></div></div><div className="flex-1 min-h-0 overflow-y-auto px-3 pb-8">{listLoading?<div className="py-20 text-center text-zinc-500 text-sm">{t.loading}</div>:listError?<div className="py-20 text-center px-8"><p className="text-sm text-zinc-400">{t.loadError}</p><button onClick={()=>me&&loadGroups(me.id)} className="mt-4 h-11 px-6 rounded-2xl bg-[#5C061F] text-black font-black">{t.retry}</button></div>:visible.length===0?<div className="py-20 text-center px-8"><div className="w-16 h-16 rounded-full bg-[#5C061F]/30 text-[#E5BB70] grid place-items-center mx-auto mb-4"><Users className="w-7 h-7"/></div><h2 className="font-bold text-lg">{t.empty}</h2><p className="text-sm text-zinc-500 mt-2">{canCreate?t.sub:`${t.sub} ${t.onlyAdminsCreate}`}</p></div>:visible.map(g=><button key={g.id} onClick={()=>setSelected(g)} className="w-full min-h-[76px] text-left flex items-center gap-3 px-2 py-3 border-b border-white/10 active:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5AD6C] rounded-lg">{g.avatar?<img src={g.avatar} alt="" className="w-14 h-14 shrink-0 rounded-full object-cover border border-[#D5AD6C]/20"/>:<span className="w-14 h-14 shrink-0 rounded-full border border-[#E5BB70]/45 bg-[#5C061F] grid place-items-center"><img src={brandLogo} alt="" className="h-full w-full rounded-full object-cover" /></span>}<div className="min-w-0 flex-1"><div className="flex justify-between items-baseline gap-2"><div className="font-bold text-[16px] truncate flex items-center gap-1">{g.favorite&&<Star className="w-3.5 h-3.5 fill-current text-[#E5BB70] shrink-0"/>}<span className="truncate">{g.name}</span></div><span className={`shrink-0 text-[11px] tabular-nums ${g.unread>0?"text-[#D5AD6C] font-semibold":"text-zinc-500"}`}>{g.lastTime}</span></div><div className="flex justify-between items-center gap-2"><div className={`min-w-0 flex-1 text-[13px] truncate mt-1 ${g.unread>0?"text-zinc-100 font-medium":"text-zinc-400"}`}>{g.subtitle}</div><div className="flex items-center gap-1 shrink-0">{g.muted&&<BellOff className="w-3.5 h-3.5 text-zinc-500"/>}{g.unread>0&&<span className="min-w-5 h-5 px-1.5 rounded-full bg-[#5C061F] border border-[#D5AD6C]/40 text-[#FFE3AE] text-[11px] font-bold grid place-items-center shrink-0">{g.unread}</span>}</div></div></div></button>)}</div>{noAccessGroup&&<div className="fixed inset-0 z-[130] bg-black/80 grid place-items-center px-8" onClick={()=>setNoAccessGroup(null)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6 text-center">{noAccessGroup.avatar?<img src={noAccessGroup.avatar} alt="" className="w-16 h-16 rounded-full object-cover mx-auto"/>:<span className="w-16 h-16 rounded-full bg-[#5C061F] border border-[#E5BB70]/45 mx-auto grid place-items-center"><img src={brandLogo} alt="" className="h-full w-full rounded-full object-cover" /></span>}<b className="block mt-4 text-lg">{noAccessGroup.name}</b><p className="mt-1 text-xs text-zinc-500">{noAccessGroup.memberCount} {noAccessGroup.memberCount===1?t.member:t.members}</p><b className="block mt-4 text-[#E5BB70] text-sm">{t.noAccessTitle}</b><p className="mt-2 text-sm text-zinc-400">{t.noAccessBody}</p><button onClick={()=>setNoAccessGroup(null)} className="mt-6 w-full h-12 rounded-2xl bg-zinc-900">{t.back}</button></div></div>}{pushSheet&&<div className="fixed inset-0 z-[140] bg-black/80 flex items-end" onClick={()=>setPushSheet(false)}><div onClick={e=>e.stopPropagation()} className="w-full rounded-t-3xl bg-zinc-950 border-t border-white/10 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"><div className="flex justify-between items-center mb-3"><b>{pushSettingsLabel}</b><button onClick={()=>setPushSheet(false)} aria-label={t.cancel}><X/></button></div><PushToggle lang={lang}/></div></div>}{canCreate&&<CreateGroupModal open={create} onClose={()=>setCreate(false)} onCreate={createGroup} language={lang}/>}</div></div>;
}
