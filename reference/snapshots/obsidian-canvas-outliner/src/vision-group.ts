import {addIcon,Menu,setIcon} from 'obsidian';
import type CanvasOutliner from './main';
import {Area,uid,matchesSearch} from './model';

export const VISION_ICON='co-vision-group';
export const VISION_ICON_SVG='<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/><path d="M6 12s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z"/><circle cx="12" cy="12" r="1.5"/>';
export function creationBounds(selected:Omit<Area,'id'|'name'>[],viewport:Omit<Area,'id'|'name'>|null){
 if(!selected.length)return viewport;
 const x=Math.min(...selected.map(n=>n.x)),y=Math.min(...selected.map(n=>n.y));
 return{x,y,width:Math.max(...selected.map(n=>n.x+n.width))-x,height:Math.max(...selected.map(n=>n.y+n.height))-y};
}

/** Native drag gathers contents synchronously. VG groups contribute only themselves. */
export function independentVisionDrag(canvas:any,visionIds:Set<string>,action:()=>any,node?:any){
 const selected=node&&!canvas.selection.has(node)?[node]:[...canvas.selection];
 const groups=selected.filter(n=>n.getData?.().type==='group');
 const original=canvas.getContainingNodes;
 canvas.getContainingNodes=function(box:any){
  const matching=groups.filter(n=>{const b=n.getBBox();return b.minX===box.minX&&b.minY===box.minY&&b.maxX===box.maxX&&b.maxY===box.maxY;});
  if(matching.length&&matching.every(n=>visionIds.has(n.id)))return [];
  return original.call(this,box);
 };
 try{return action();}finally{canvas.getContainingNodes=original;}
}

/** Native Canvas groups with an independent Outliner identity and visibility. */
export class VisionGroups {
 private wrapper:HTMLElement|null=null;
 private toolbar:HTMLElement|null=null;
 private restore:(()=>void)|null=null;
 private nativeRestore:(()=>void)|null=null;
 nativeActionPath='';
 private resize:ResizeObserver|null=null;
 private frame=0;
 private path='';
 constructor(private p:CanvasOutliner){
  addIcon(VISION_ICON,'<g transform="scale(4.1666667)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+VISION_ICON_SVG+'</g>');
  p.addCommand({id:'vision-group-create',name:'Vision Group 만들기',checkCallback:checking=>{if(!this.available())return false;if(!checking)this.createFromSelection();return true;}});
  p.addCommand({id:'vg-vision-toggle',name:'VG Vision ON/OFF',checkCallback:checking=>{if(!this.p.adapter.canvas)return false;if(!checking)this.toggle();return true;}});
  p.register(()=>this.detach());
 }
 private available(){return !!this.p.adapter.canvas&&!!this.p.state()&&!this.p.state()?.presentation;}
 get visible(){return this.p.store.settings.vgVision!==false;}
 toggle(){this.p.store.settings.vgVision=!this.visible;this.p.adapter.canvas?.updateSelection(()=>{});void this.p.save();this.p.renderAll();}
 undoNative(redo=false){const c=this.p.adapter.canvas;if(this.nativeActionPath!==this.p.adapter.file?.path||!c)return false;c[redo?'redo':'undo']();void this.p.refresh();this.p.renderAll();return true;}
 createFromSelection(){const doc=this.p.document(),ids=new Set(this.p.adapter.selection());if(!doc)return;const rect=creationBounds(doc.nodes.filter(n=>ids.has(n.id)),this.p.adapter.bounds());if(rect)this.create(rect);}
 create(rect:Omit<Area,'id'|'name'>){
  if(!this.available()||![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)return;
  const state=this.p.state()!,names=new Set((state.visionGroups??[]).map(a=>a.name));
  let n=1;while(names.has('Vision Group'+n))n++;
  const a={...rect,id:uid(),name:'Vision Group'+n,native:true};
  (state.visionGroups??=[]).push(a);this.insertNative(a);
  this.nativeActionPath=this.p.adapter.file!.path;
  this.p.adapter.canvas.selectOnly(this.p.adapter.node(a.id));
  void this.p.save();this.p.renderAll();
 }
 private insertNative(a:Area){
  const c=this.p.adapter.canvas;
  c.importData({nodes:[{id:a.id,type:'group',x:a.x,y:a.y,width:a.width,height:a.height,label:a.name}],edges:[]},false);
  c.requestSave();
 }
 private syncNative(){
  const state=this.p.state(),c=this.p.adapter.canvas;if(!state||!c)return;
  let changed=false;
  for(const a of state.visionGroups??[]){
   if(!a.native){a.native=true;this.insertNative(a);changed=true;}
   const node=c.nodes.get(a.id);if(!node)continue;
   const d=node.getData();
   if(a.x!==d.x||a.y!==d.y||a.width!==d.width||a.height!==d.height||a.name!==d.label){
    Object.assign(a,{x:d.x,y:d.y,width:d.width,height:d.height,name:d.label});changed=true;
   }
   node.nodeEl?.classList.add('co-vg-native');
   node.nodeEl?.classList.toggle('co-vg-hidden',!this.visible);
  }
  if(changed)void this.p.save();
 }
 renderRows(el:HTMLElement,groups:Area[],query:string){
  let count=0;
  for(const a of groups.filter(a=>this.p.adapter.node(a.id)&&(!query||matchesSearch(a.name,query)))){
   count++;const row=el.createDiv({cls:'co-row co-vision-group-row',attr:{'data-vision-group':a.id}});row.tabIndex=0;
   setIcon(row.createSpan({cls:'co-node-icon'}),VISION_ICON);row.createSpan({cls:'co-label',text:a.name});
   row.onclick=()=>this.p.adapter.select(a.id,this.p.store.settings.fitPadding);
   row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();row.click();}};
   row.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();const path=this.p.adapter.file?.path,m=new Menu();
    m.addItem(i=>i.setTitle('Vision Group 이름 변경').setIcon('pencil').onClick(()=>this.p.prompt('Vision Group 이름',a.name,name=>{if(this.p.adapter.file?.path===path){const node=this.p.adapter.node(a.id);if(node){node.setLabel(name);this.p.adapter.canvas.requestSave();this.nativeActionPath=path!;void this.p.refresh();this.p.renderAll();}}})));
    m.addItem(i=>i.setTitle('Vision Group 삭제').setIcon('trash').onClick(()=>{if(this.p.adapter.file?.path===path){const c=this.p.adapter.canvas,node=this.p.adapter.node(a.id);if(node){c.removeNode(node);c.requestSave();this.nativeActionPath=path!;void this.p.refresh();this.p.renderAll();}}}));m.showAtMouseEvent(e);
   };
  }return count;
 }
 render(){
  const wrapper=this.p.adapter.element(),path=this.p.adapter.file?.path??'';
  if(wrapper!==this.wrapper||path!==this.path){this.detach();this.path=path;this.wrapper=wrapper;if(wrapper)this.attach(wrapper);}
  if(!wrapper)return;
  if(this.toolbar){this.toolbar.setAttribute('aria-pressed',String(this.visible));this.toolbar.classList.toggle('is-active',this.visible);setIcon(this.toolbar,this.visible?'eye':'eye-off');}
  this.syncNative();
 }
 private schedule=()=>{if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.project();});};
 private project(){this.syncNative();}
 private attach(wrapper:HTMLElement){
  const c=this.p.adapter.canvas,owner=this,update=c.updateSelection,hit=c.hitTestNode,intersect=c.getIntersectingNodes,drag=c.handleSelectionDrag;
  const hidden=(node:any)=>!owner.visible&&owner.p.state()?.visionGroups?.some(a=>a.id===node.id);
  const selection=function(this:any,fn:()=>void){return update.call(this,()=>{fn();for(const n of this.selection)if(hidden(n))this.selection.delete(n);});};
  const intersections=function(this:any,...args:any[]){return intersect.apply(this,args).filter((n:any)=>!hidden(n));};
  const hitTest=function(this:any,pos:{x:number;y:number},padding=0){const n=hit.call(this,pos,padding);if(!n||!hidden(n))return n;return intersections.call(this,{minX:pos.x-padding,minY:pos.y-padding,maxX:pos.x+padding,maxY:pos.y+padding}).sort((a:any,b:any)=>b.zIndex-a.zIndex)[0]??null;};
  c.updateSelection=selection;c.getIntersectingNodes=intersections;c.hitTestNode=hitTest;
  const independentDrag=function(this:any,...args:any[]){return independentVisionDrag(this,new Set((owner.p.state()?.visionGroups??[]).map(a=>a.id)),()=>drag.apply(this,args),args[2]);};
  c.handleSelectionDrag=independentDrag;
  this.nativeRestore=()=>{if(c.updateSelection===selection)c.updateSelection=update;if(c.getIntersectingNodes===intersections)c.getIntersectingNodes=intersect;if(c.hitTestNode===hitTest)c.hitTestNode=hit;if(c.handleSelectionDrag===independentDrag)c.handleSelectionDrag=drag;};
  const group=wrapper.querySelector('.canvas-controls');if(group){this.toolbar=group.createEl('button',{cls:'canvas-control-item co-vg-toggle',attr:{'aria-label':'Vision Group 표시 전환','data-tooltip-position':'left'}});this.toolbar.onclick=()=>this.toggle();}
  const canvas=wrapper.querySelector('.canvas');
  if(canvas){const observer=new MutationObserver(()=>this.project());observer.observe(canvas,{childList:true});this.restore=()=>observer.disconnect();}
  this.resize=new ResizeObserver(this.schedule);this.resize.observe(wrapper);
 }
 private detach(){this.nativeRestore?.();this.nativeRestore=null;this.nativeActionPath='';this.restore?.();this.restore=null;this.resize?.disconnect();this.resize=null;this.toolbar?.remove();this.toolbar=null;cancelAnimationFrame(this.frame);this.frame=0;this.wrapper=null;}
}
