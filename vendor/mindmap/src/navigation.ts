import {registerRuntimeCleanup} from './runtime-cleanup';
import type { App } from 'obsidian';
import type { Card, CanvasData, Direction } from './layout';

export function nearestCard(data:CanvasData,id:string,direction:Direction):Card|null {
 const a=data.nodes.find(n=>n.id===id);if(!a)return null;
 const horizontal=direction==='left'||direction==='right',positive=direction==='right'||direction==='down';
 const ax=a.x+a.width/2,ay=a.y+a.height/2;
 const candidates=data.nodes.filter(b=>b.id!==id&&b.type!=='group'&&(positive?(horizontal?b.x+b.width/2>ax:b.y+b.height/2>ay):(horizontal?b.x+b.width/2<ax:b.y+b.height/2<ay))).map(b=>{
  const dx=Math.max(0,b.x-a.x-a.width,a.x-b.x-b.width),dy=Math.max(0,b.y-a.y-a.height,a.y-b.y-b.height);
  const direct=horizontal ? b.y<a.y+a.height&&b.y+b.height>a.y : b.x<a.x+a.width&&b.x+b.width>a.x;
  return {b,direct,distance:Math.hypot(dx,dy),axis:horizontal?Math.abs(b.y+b.height/2-ay):Math.abs(b.x+b.width/2-ax)};
 });
 candidates.sort((a,b)=>Number(b.direct)-Number(a.direct)||a.distance-b.distance||a.axis-b.axis||a.b.id.localeCompare(b.b.id));
 return candidates[0]?.b||null;
}
export type Waypoint={kind:'card';node:string;name:string}|{kind:'camera';x:number;y:number;zoom:number;name:string};
type Registry=Record<string,Waypoint>;
interface Host {app:App;settings:{panDuration:number;panStep?:number;zoomStepPercent?:number};register(cb:()=>void):void}
export class NavigationController {
 private patched=new WeakSet<object>();
 private overlays=new Map<any,HTMLElement>();
 private motion:{frame:number;c:any}|null=null;
 constructor(private host:Host){host.register(()=>{this.cancel();for(const overlay of this.overlays.values())overlay.remove();this.overlays.clear();});}
 cancel(){if(this.motion){cancelAnimationFrame(this.motion.frame);this.motion=null;}}
 registry(data:CanvasData):Registry {
  const raw=(data.canvasMindmap as any)?.waypoints;if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const result:Registry={};
  for(const [number,entry] of Object.entries(raw) as [string,any][]){
   if(!/^[1-9]$/.test(number)||!entry||typeof entry.name!=='string')continue;
   if(entry.kind==='card'&&typeof entry.node==='string')result[number]={kind:'card',node:entry.node,name:entry.name};
   if(entry.kind==='camera'&&[entry.x,entry.y,entry.zoom].every(Number.isFinite))result[number]={kind:'camera',x:entry.x,y:entry.y,zoom:entry.zoom,name:entry.name};
  }return result;
 }
 observe(c:any){
  if(this.patched.has(c))return;this.patched.add(c);
  const observer=new MutationObserver(()=>this.positionBadges(c));
  observer.observe(c.canvasEl,{attributes:true,attributeFilter:['style'],subtree:true});
  registerRuntimeCleanup(this.host,c,()=>observer.disconnect());
  // Each native Canvas snapshot carries the separate waypoint namespace. Native
  // deletion snapshots omit missing cards; native Undo restores the prior namespace.
  const original=c.getData,controller=this;
  const wrapper=function(this:any):CanvasData {
   const data:CanvasData=original.call(this),namespace=data.canvasMindmap as any;
   if(namespace?.waypoints){const entries=controller.registry(data);for(const [number,entry] of Object.entries(entries))if(entry.kind==='card'&&!data.nodes.some(n=>n.id===entry.node))delete entries[number];return {...data,canvasMindmap:{...namespace,waypoints:entries}};}
   return data;
  };
  c.getData=wrapper;registerRuntimeCleanup(this.host,c,()=>{if(c.getData===wrapper)c.getData=original;});
 }
 focus(c:any,n:any){this.move(c,n.x+n.width/2,n.y+n.height/2,c.zoom);}
 selectNearest(c:any){
  const cards=[...c.nodes.values()].filter((n:any)=>n.getData().type!=='group') as any[];
  cards.sort((a,b)=>Math.hypot(a.x+a.width/2-c.x,a.y+a.height/2-c.y)-Math.hypot(b.x+b.width/2-c.x,b.y+b.height/2-c.y));
  if(cards[0]){c.selectOnly(cards[0]);this.focus(c,cards[0]);}
 }
 cameraKey(c:any,code:string){
  this.cancel();const pan=this.host.settings.panStep,percent=this.host.settings.zoomStepPercent;const step=(Number.isFinite(pan)&&pan!>0?pan!:60)/Math.pow(2,c.zoom),zoomStep=Number.isFinite(percent)&&percent!>0?Math.log2(1+percent!/100):0.1;
  const x=c.tx+(code==='ArrowRight'?step:code==='ArrowLeft'?-step:0),y=c.ty+(code==='ArrowDown'?step:code==='ArrowUp'?-step:0);
  const zoom=Math.max(c.config.minZoom??-4,Math.min(c.config.maxZoom??2,c.tZoom+(code==='ZoomIn'?zoomStep:code==='ZoomOut'?-zoomStep:0)));
  c.tx=x;c.ty=y;c.tZoom=zoom;c.zoomCenter=null;c.markViewportChanged();
 }
 navigate(c:any,n:any,direction:Direction){const target=nearestCard(c.getData(),n.id,direction);if(!target)return;const node=c.nodes.get(target.id);c.selectOnly(node);this.move(c,target.x+target.width/2,target.y+target.height/2,c.zoom);}
 move(c:any,x:number,y:number,zoom:number){
  this.cancel();
  const start={x:c.x,y:c.y,zoom:c.zoom},time=performance.now(),duration=Math.max(0,this.host.settings.panDuration);
  if(!duration){c.setViewport(x,y,zoom);return;}
  const motion={c,frame:0};this.motion=motion;
  const tick=(now:number)=>{if(this.motion!==motion)return;const t=Math.min(1,(now-time)/duration),e=t*t*(3-2*t);c.setViewport(start.x+(x-start.x)*e,start.y+(y-start.y)*e,start.zoom+(zoom-start.zoom)*e);this.badges(c);if(t<1)motion.frame=requestAnimationFrame(tick);else this.motion=null;};
  motion.frame=requestAnimationFrame(tick);
 }
 call(c:any,number:string){const entry=this.registry(c.getData())[number];if(!entry)return;
  if(entry.kind==='card'){const node=c.nodes.get(entry.node);if(!node)return;c.selectOnly(node);this.move(c,node.x+node.width/2,node.y+node.height/2,c.zoom);}
  else this.move(c,entry.x,entry.y,entry.zoom);
 }
 register(c:any,number:string,node?:any){
  this.observe(c);const data=c.getData(),entries=this.registry(data),previous=entries[number];
  if(node){const card=node.getData();if(card.type==='group')return;
   if(previous?.kind==='card'&&previous.node===node.id)delete entries[number];
   else entries[number]={kind:'card',node:node.id,name:card.type==='text'?(String(card.text||'').split('\n')[0].trim()||`카드 ${number}`):String(card.file||card.url||`카드 ${number}`).split('/').pop()!};
  }else entries[number]={kind:'camera',x:c.x,y:c.y,zoom:c.zoom,name:`카메라 Waypoint ${number}`};
  this.commit(c,data,entries);
 }
 rename(c:any,number:string,name:string){const data=c.getData(),entries=this.registry(data);if(!entries[number])return;entries[number]={...entries[number],name};this.commit(c,data,entries);}
 remove(c:any,number:string){const data=c.getData(),entries=this.registry(data);if(!entries[number])return;delete entries[number];this.commit(c,data,entries);}
 private commit(c:any,before:CanvasData,entries:Registry){
  const after={...before,canvasMindmap:{...(before.canvasMindmap as object||{}),version:1,waypoints:entries}};
  c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
  try{c.setData(after);c.requestSave(false);this.badges(c);}catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);throw error;}
 }
 private positionBadges(c:any){
  const overlay=this.overlays.get(c);if(!overlay)return;
  const w=c.wrapperEl.clientWidth,h=c.wrapperEl.clientHeight;
  for(const badge of [...overlay.children] as HTMLElement[]){const n=c.nodes.get(badge.dataset.node);if(!n)continue;const pos=c.domFromPos({x:n.x,y:n.y});badge.style.left=String(w/2+pos.x)+'px';badge.style.top=String(h/2+pos.y)+'px';}
 }
 badges(active:any){
  for(const [c,overlay] of this.overlays){if(c!==active||!c.wrapperEl.isConnected){overlay.remove();this.overlays.delete(c);}}
  if(!active)return;this.observe(active);
  const overlay:HTMLElement=this.overlays.get(active)||active.wrapperEl.createDiv({cls:'canvas-mindmap-badges'});this.overlays.set(active,overlay);
  const entries=this.registry(active.getData()),groups=new Map<string,string[]>();
  for(const [number,entry] of Object.entries(entries))if(entry.kind==='card'){const numbers=groups.get(entry.node)||[];numbers.push(number);groups.set(entry.node,numbers);}
  const rect=active.wrapperEl.getBoundingClientRect();
  for(const child of [...overlay.children] as HTMLElement[])if(!groups.has(child.dataset.node!))child.remove();
  for(const [id,numbers] of groups){const n=active.nodes.get(id);if(!n)continue;let badge=[...overlay.children].find(el=>(el as HTMLElement).dataset.node===id) as HTMLElement|undefined;
   if(!badge){badge=overlay.createDiv({cls:'canvas-mindmap-badge'});badge.dataset.node=id;}
   badge.textContent=numbers.join(' ');badge.setAttribute('aria-label',`Waypoint ${numbers.join(', ')}`);
   const position=active.domFromPos({x:n.x,y:n.y});badge.style.left=`${rect.width/2+position.x}px`;badge.style.top=`${rect.height/2+position.y}px`;
  }
 }
}
