import React,{useEffect,useRef,useState}from"react";
import{X,RotateCcw}from"lucide-react";

type Point={x:number;y:number};
const dist=(a:Touch,b:Touch)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
const midpoint=(a:Touch,b:Touch):Point=>({x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2});

export default function ImageViewer({url,title,onClose}:{url:string;title?:string;onClose:()=>void}){
 const[scale,setScale]=useState(1);
 const[pos,setPos]=useState<Point>({x:0,y:0});
 const scaleRef=useRef(1),posRef=useRef<Point>({x:0,y:0});
 const pinch=useRef<{distance:number;scale:number;mid:Point;pos:Point}|null>(null);
 const pan=useRef<{x:number;y:number;pos:Point}|null>(null);
 const lastTap=useRef(0);

 useEffect(()=>{scaleRef.current=scale},[scale]);
 useEffect(()=>{posRef.current=pos},[pos]);
 useEffect(()=>()=>{pinch.current=null;pan.current=null},[]);

 const reset=()=>{setScale(1);setPos({x:0,y:0});pinch.current=null;pan.current=null};
 const clampScale=(v:number)=>Math.min(5,Math.max(1,v));

 const onTouchStart=(e:React.TouchEvent)=>{
  if(e.touches.length===2){
   const a=e.touches[0],b=e.touches[1];
   pinch.current={distance:Math.max(1,dist(a,b)),scale:scaleRef.current,mid:midpoint(a,b),pos:posRef.current};
   pan.current=null;
  }else if(e.touches.length===1){
   const t=e.touches[0];
   pan.current={x:t.clientX,y:t.clientY,pos:posRef.current};
  }
 };

 const onTouchMove=(e:React.TouchEvent)=>{
  if(e.touches.length===2&&pinch.current){
   e.preventDefault();
   const a=e.touches[0],b=e.touches[1];
   const nextScale=clampScale(pinch.current.scale*(dist(a,b)/pinch.current.distance));
   const mid=midpoint(a,b);
   const ratio=nextScale/pinch.current.scale;
   const nextPos={
    x:(pinch.current.pos.x-pinch.current.mid.x)*ratio+mid.x,
    y:(pinch.current.pos.y-pinch.current.mid.y)*ratio+mid.y
   };
   setScale(nextScale);setPos(nextPos);
  }else if(e.touches.length===1&&pan.current&&scaleRef.current>1){
   e.preventDefault();
   const t=e.touches[0];
   setPos({x:pan.current.pos.x+(t.clientX-pan.current.x),y:pan.current.pos.y+(t.clientY-pan.current.y)});
  }
 };

 const onTouchEnd=(e:React.TouchEvent)=>{
  if(e.touches.length<2)pinch.current=null;
  if(e.touches.length===1){
   const t=e.touches[0];pan.current={x:t.clientX,y:t.clientY,pos:posRef.current};
  }else pan.current=null;
  if(scaleRef.current<=1.02)reset();
 };

 const onClick=(e:React.MouseEvent)=>{
  const now=Date.now();
  if(now-lastTap.current<280){
   e.stopPropagation();
   if(scaleRef.current>1)reset();
   else{setScale(2.5);setPos({x:0,y:0})}
   lastTap.current=0;
  }else lastTap.current=now;
 };

 return <div className="fixed inset-0 z-[220] bg-black text-white flex flex-col" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)",colorScheme:"dark"}}>
  <header className="relative z-20 shrink-0 h-14 px-2 flex items-center gap-2 bg-black/90 border-b border-white/10">
   <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full grid place-items-center bg-zinc-900"><X className="w-5 h-5"/></button>
   <div className="flex-1 min-w-0 text-center"><div className="truncate text-sm font-semibold">{title||"Photo"}</div><div className="text-[11px] text-zinc-500">Pinch to zoom · Double tap</div></div>
   <button onClick={reset} aria-label="Reset zoom" className="w-11 h-11 rounded-full grid place-items-center bg-zinc-900"><RotateCcw className="w-5 h-5"/></button>
  </header>
  <div className="relative flex-1 min-h-0 overflow-hidden grid place-items-center" onClick={onClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{touchAction:"none"}}>
   <img src={url} alt={title||""} draggable={false} className="max-w-full max-h-full object-contain select-none will-change-transform" style={{transform:`translate3d(${pos.x}px,${pos.y}px,0) scale(${scale})`,transformOrigin:"center",transition:pinch.current||pan.current?"none":"transform 160ms ease-out",WebkitUserSelect:"none",WebkitTouchCallout:"none"}}/>
  </div>
 </div>;
}
