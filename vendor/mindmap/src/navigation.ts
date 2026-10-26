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
interface Host {app:App;settings:{panDuration:number;panStep?:number;zoomStepPercent?:number};register(cb:()=>void):void}
export class NavigationController {
 private motion:{frame:number;c:any}|null=null;
 constructor(private host:Host){host.register(()=>this.cancel());}
 cancel(){if(this.motion){cancelAnimationFrame(this.motion.frame);this.motion=null;}}
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
  const tick=(now:number)=>{if(this.motion!==motion)return;const t=Math.min(1,(now-time)/duration),e=t*t*(3-2*t);c.setViewport(start.x+(x-start.x)*e,start.y+(y-start.y)*e,start.zoom+(zoom-start.zoom)*e);if(t<1)motion.frame=requestAnimationFrame(tick);else this.motion=null;};
  motion.frame=requestAnimationFrame(tick);
 }
}
