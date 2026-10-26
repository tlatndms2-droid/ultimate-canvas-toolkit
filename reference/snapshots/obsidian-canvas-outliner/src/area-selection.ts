import type {Presentation} from './presentation';
import type {Area} from './model';

export type Rect={x:number;y:number;width:number;height:number};
export function resizeArea(origin:Rect,direction:string,dx:number,dy:number):Rect {
 let left=origin.x,right=origin.x+origin.width,top=origin.y,bottom=origin.y+origin.height;
 if(direction.includes('e'))right=Math.max(left+40,right+dx);
 if(direction.includes('w'))left=Math.min(right-40,left+dx);
 if(direction.includes('s'))bottom=Math.max(top+40,bottom+dy);
 if(direction.includes('n'))top=Math.min(bottom-40,top+dy);
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function numberedAreaName(names:string[],requested='Presentation Group') {
 const text=requested.trim()||'Presentation Group',base=text.replace(/\d+$/,'').trim()||'Presentation Group';
 const used=new Set(names);let n=1;
 while(used.has(base+n))n++;
 if(/\d+$/.test(text)&&!used.has(text))return text;
 return base+n;
}
export function marqueeSelection(areas:Area[],box:Rect,initial:Set<string>,mode:'replace'|'add'|'subtract') {
 const hits=areas.filter(a=>a.x<=box.x+box.width&&a.x+a.width>=box.x&&a.y<=box.y+box.height&&a.y+a.height>=box.y).map(a=>a.id);
 const result=new Set(mode==='replace'?[]:initial);
 for(const id of hits)mode==='subtract'?result.delete(id):result.add(id);
 return result;
}

/** PT areas are presentation metadata, never native Canvas nodes. */
export class AreaSelection {
 enabled=false;ids=new Set<string>();toolbar:HTMLElement|null=null;path='';
 private lastAreas:Area[]|null=null;
 private painted:{ids:Set<string>;enabled:boolean;layer:HTMLElement|null;toolbar:HTMLElement|null;first:Element|null}|null=null;
 cleanup:((cancel?:boolean)=>void)|null=null;
 private nativeCanvas:any=null;
 private restoreNative:(()=>void)|null=null;
 private normalInitial=new Set<string>();
 constructor(readonly pt:Presentation){
  const p=pt.p;
  p.registerDomEvent(document,'pointerdown',e=>this.down(e),true);
  p.registerDomEvent(document,'pointerdown',e=>{
   if(this.enabled||e.button!==0||!p.adapter.element()?.contains(e.target as Node)||this.control(e.target))return;
   this.normalInitial=new Set(this.ids);
   if(!e.shiftKey&&!e.altKey){this.ids=new Set();this.paint();}
  },true);
  p.registerDomEvent(window,'keydown',e=>{
   if(!this.enabled&&e.key==='Escape'&&p.adapter.element()?.contains(e.target as Node)&&!pt.inputFocused(e)){this.ids=new Set();this.paint();}
  },true);
  for(const type of ['click','dblclick','contextmenu','paste','cut','beforeinput','drop'] as const)p.registerDomEvent(document,type,e=>{
   if(this.enabled&&p.adapter.element()?.contains(e.target as Node)&&!this.control(e.target)){
    e.preventDefault();e.stopImmediatePropagation();
   }
  },true);
  p.registerDomEvent(window,'keydown',e=>{
   const target=e.target as HTMLElement;
   if(!this.enabled||(!p.adapter.element()?.contains(target)&&!target.closest('.co-remote'))||target.closest('input,textarea,select,[contenteditable=true],.cm-editor')||e.isComposing)return;
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(this.cleanup)this.cleanup(true);else{this.ids=new Set();this.paint();}return;}
   if(this.cleanup)return;
   const remove=e.key==='Delete'||e.key==='Backspace',undo=(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z';
   const arrow=e.key.startsWith('Arrow');
   if(remove||undo||arrow){e.preventDefault();e.stopImmediatePropagation();
    if(undo){p.undo(e.shiftKey);this.sync();return;}
    const ids=new Set(this.ids);if(!ids.size)return;
    if(remove){p.change(s=>{s.areas=s.areas.filter(a=>!ids.has(a.id));s.steps=s.steps.filter(x=>x.kind!=='area'||!ids.has(x.target));if(!s.steps.some(x=>x.id===s.current))s.current=s.steps[0]?.id??null;});this.ids=new Set();}
    else {const n=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0,dy=e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0;p.change(s=>{for(const a of s.areas)if(ids.has(a.id)){a.x+=dx;a.y+=dy;}});}
    this.paint();
   }else if(!['p','v','o','f','1','!','+','-','=','0',' ','Shift','Control','Alt','Meta','Home','End','PageUp','PageDown'].includes(e.key.toLowerCase())&&!['Shift','Control','Alt','Meta','Home','End','PageUp','PageDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  p.register(()=>{this.cleanup?.(true);this.toolbar?.remove();this.restoreNative?.();});
 }
 /** Extend the native marquee only; panning and node dragging never enter this path. */
 syncNative(){
  const c=this.pt.p.adapter.canvas;if(c===this.nativeCanvas)return;
  this.restoreNative?.();this.restoreNative=null;this.nativeCanvas=c;
  if(!c?.handleDragToSelect||!c.handleDragWithPan)return;
  const original=c.handleDragToSelect,owner=this;
  const wrapped=function(this:any,e:PointerEvent,...args:any[]){
   const p=owner.pt.p;
   if(owner.enabled||p.state()?.presentation||!p.store.settings.vision||e.ctrlKey||e.metaKey)return original.call(this,e,...args);
   const start=this.posFromEvt(e),initial=new Set(owner.normalInitial),areas=p.state()?.areas??[],path=p.adapter.file?.path;
   const mode=e.altKey?'subtract':e.shiftKey?'add':'replace';
   const drag=this.handleDragWithPan;
   this.handleDragWithPan=function(event:PointerEvent,handlers:any){
    const update=(ev:PointerEvent)=>{if(path!==p.adapter.file?.path||owner.enabled||p.state()?.presentation||!p.store.settings.vision)return;const end=c.posFromEvt(ev);owner.ids=marqueeSelection(areas,{x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)},initial,mode);owner.paint();};
    return drag.call(this,event,{...handlers,move:(ev:PointerEvent)=>{handlers.move?.(ev);update(ev);},end:(ev:PointerEvent)=>{handlers.move?.(ev);handlers.end?.(ev);if(ev.ctrlKey||ev.metaKey)owner.ids=initial;else update(ev);owner.paint();},cancel:(...a:any[])=>{handlers.cancel?.(...a);owner.ids=path===p.adapter.file?.path?initial:new Set();owner.paint();}});
   };
   try{return original.call(this,e,...args);}finally{this.handleDragWithPan=drag;}
  };
  c.handleDragToSelect=wrapped;this.restoreNative=()=>{if(c.handleDragToSelect===wrapped)c.handleDragToSelect=original;};
 }
 control(target:EventTarget|null){return (target as HTMLElement)?.closest?.('.canvas-controls,.canvas-card-menu,.co-area-selection-tools,.co-presentation-chrome,input,textarea,select,[contenteditable=true],.cm-editor');}
 toggle(){this.set(!this.enabled);}
 set(value:boolean){
  const p=this.pt.p;if(value&&(p.state()?.presentation||!p.store.settings.vision||!p.adapter.canvas))return;
  this.cleanup?.(true);this.enabled=value;this.ids.clear();this.pt.selectedArea=null;this.pt.drawing=false;
  if(value){for(const n of p.adapter.canvas.nodes.values())if(n.isEditing)n.blur?.();p.adapter.canvas.deselectAll?.();}
  this.pt.lastKey='';p.renderAll();p.adapter.element()?.focus();
 }
 sync(){
  this.syncNative();
  const p=this.pt.p,wrapper=p.adapter.element(),path=p.adapter.file?.path??'',s=p.state();
  if(path!==this.path||s?.presentation||!p.store.settings.vision){this.cleanup?.(true);this.enabled=false;this.ids.clear();this.path=path;}
  if(s?.areas!==this.lastAreas){this.lastAreas=s?.areas??null;const valid=new Set(s?.areas.map(a=>a.id));this.ids=new Set([...this.ids].filter(id=>valid.has(id)));}
  if(!wrapper||!s||s.presentation||!p.store.settings.vision){wrapper?.classList.remove('co-area-selection-mode');this.toolbar?.remove();this.toolbar=null;return;}
  if(!this.toolbar?.isConnected||this.toolbar.parentElement!==wrapper){this.toolbar?.remove();this.toolbar=wrapper.createDiv({cls:'co-area-selection-tools'});const button=this.toolbar.createEl('button',{cls:'co-area-selection-toggle'});button.onclick=()=>this.toggle();this.toolbar.createSpan({cls:'co-area-selection-count'});}
  this.paint();
 }
 paint(){
  const last=this.painted;
  if(last&&last.ids===this.ids&&last.enabled===this.enabled&&last.layer===this.pt.layer&&last.toolbar===this.toolbar&&last.first===(this.pt.layer?.firstElementChild??null))return;
  this.painted={ids:this.ids,enabled:this.enabled,layer:this.pt.layer,toolbar:this.toolbar,first:this.pt.layer?.firstElementChild??null};
  const wrapper=this.pt.p.adapter.element();wrapper?.classList.toggle('co-area-selection-mode',this.enabled);
  wrapper?.querySelectorAll<HTMLElement>('.co-pt-area[data-area]').forEach(el=>el.classList.toggle('co-multi-selected',this.ids.has(el.dataset.area!)));
  const button=this.toolbar?.querySelector('button');if(button){button.textContent='PT 그룹만 선택 '+(this.enabled?'ON':'OFF');button.setAttribute('aria-pressed',String(this.enabled));button.setAttribute('aria-label','PT 그룹만 선택');}
  const count=this.toolbar?.querySelector('.co-area-selection-count');if(count)count.textContent=this.enabled?`${this.ids.size}개 선택 · Shift 추가 · Alt 빼기`:'';
  document.querySelectorAll('.co-remote-area-select').forEach(el=>{el.textContent='PT 그룹만 선택 '+(this.enabled?'ON':'OFF');el.setAttribute('aria-pressed',String(this.enabled));});
 }
 down(e:PointerEvent){
  const p=this.pt.p,wrapper=p.adapter.element(),s=p.state();
  if(!this.enabled||!wrapper||!s||s.presentation||e.button!==0||!wrapper.contains(e.target as Node)||this.control(e.target))return;
  e.preventDefault();e.stopImmediatePropagation();this.cleanup?.(true);this.pt.cancel();wrapper.focus();p.adapter.canvas.deselectAll?.();
  const start=p.adapter.toCanvas(e);if(!start)return;
  const path=p.adapter.file?.path,initial=new Set(this.ids),areas=s.areas.map(a=>({...a}));
  const handle=(e.target as HTMLElement).closest<HTMLElement>('.co-pt-resize,.co-area-handle');
  const label=(handle??(e.target as HTMLElement).closest('.co-pt-label'))?.closest<HTMLElement>('[data-area]');
  const hit=label?areas.find(a=>a.id===label.dataset.area):areas.filter(a=>start.x>=a.x&&start.x<=a.x+a.width&&start.y>=a.y&&start.y<=a.y+a.height).sort((a,b)=>a.width*a.height-b.width*b.height)[0];
  const mode=e.altKey?'subtract':e.shiftKey?'add':'replace';
  const resizing=!!handle&&!!hit&&mode==='replace',moving=!resizing&&!!label&&!!hit&&mode==='replace';
  if((moving||resizing)&&!this.ids.has(hit!.id))this.ids=new Set([hit!.id]);
  let resized:Rect|null=null;
  const moveIds=new Set(this.ids);let moved=false,dx=0,dy=0;
  const ghost=wrapper.createDiv({cls:'co-area-selection-box'+(mode==='subtract'?' is-subtract':'')});ghost.style.display='none';
  this.pt.editing=true;wrapper.setPointerCapture(e.pointerId);
  const move=(ev:PointerEvent)=>{
   if(ev.pointerId!==e.pointerId)return;
   ev.preventDefault();ev.stopImmediatePropagation();
   if(path!==p.adapter.file?.path){finish(true);return;}
   if(!moved&&Math.hypot(ev.clientX-e.clientX,ev.clientY-e.clientY)<4)return;moved=true;
   const end=p.adapter.toCanvas(ev);if(!end)return;dx=Math.round(end.x-start.x);dy=Math.round(end.y-start.y);
   if(resizing){resized=resizeArea(hit!,handle!.dataset.direction!,dx,dy);const b=p.adapter.canvas.getViewportBBox(),z=2**p.adapter.canvas.zoom;const el=handle!.closest<HTMLElement>('[data-area]')!;Object.assign(el.style,{left:(resized.x-b.minX)*z+'px',top:(resized.y-b.minY)*z+'px',width:resized.width*z+'px',height:resized.height*z+'px'});}
   else if(moving){const zoom=2**p.adapter.canvas.zoom;wrapper.querySelectorAll<HTMLElement>('.co-pt-area[data-area]').forEach(el=>{if(moveIds.has(el.dataset.area!))el.style.transform=`translate(${dx*zoom}px,${dy*zoom}px)`;});}
   else {const r=wrapper.getBoundingClientRect();Object.assign(ghost.style,{display:'block',left:Math.min(e.clientX,ev.clientX)-r.left+'px',top:Math.min(e.clientY,ev.clientY)-r.top+'px',width:Math.abs(ev.clientX-e.clientX)+'px',height:Math.abs(ev.clientY-e.clientY)+'px'});this.ids=marqueeSelection(areas,{x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)},initial,mode);}
   this.paint();
  };
  const up=(ev:PointerEvent)=>{if(ev.pointerId===e.pointerId){ev.preventDefault();ev.stopImmediatePropagation();finish(ev.type==='pointercancel');}};
  const finish=(cancel=false)=>{
   document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',up,true);
   if(wrapper.hasPointerCapture(e.pointerId))wrapper.releasePointerCapture(e.pointerId);
   ghost.remove();wrapper.querySelectorAll<HTMLElement>('.co-pt-area').forEach(el=>el.style.transform='');this.cleanup=null;this.pt.editing=false;
   if(cancel||path!==p.adapter.file?.path)this.ids=initial;
   else if(moved&&resizing&&resized)p.change(state=>{const a=state.areas.find(a=>a.id===hit!.id);if(a)Object.assign(a,resized);});
   else if(moved&&moving&&(dx||dy))p.change(state=>{for(const a of state.areas){const origin=areas.find(x=>x.id===a.id);if(origin&&moveIds.has(a.id)){a.x=origin.x+dx;a.y=origin.y+dy;}}});
   else if(!moved){this.ids=new Set(mode==='replace'?[]:initial);if(hit){if(mode==='subtract'||(mode==='add'&&initial.has(hit.id)))this.ids.delete(hit.id);else this.ids.add(hit.id);}}
   this.pt.lastKey='';this.pt.render();this.paint();
  };
  this.cleanup=finish;document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);this.paint();
 }
}
