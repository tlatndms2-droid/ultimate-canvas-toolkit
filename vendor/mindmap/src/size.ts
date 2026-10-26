import {registerRuntimeCleanup} from './runtime-cleanup';
import { Component, MarkdownRenderer, type App } from 'obsidian';
import type { CanvasData } from './layout';

export function swapCards(input:CanvasData,id:string,down:boolean,tolerance:number):CanvasData|null {
 const a=input.nodes.find(n=>n.id===id);if(!a)return null;
 const b=input.nodes.filter(n=>n.id!==id&&n.type!=='group'&&Math.abs(n.x-a.x)<=tolerance&&(down?n.y>a.y:n.y<a.y)).sort((n,m)=>Math.abs(n.y-a.y)-Math.abs(m.y-a.y))[0];
 if(!b)return null;
 const data:CanvasData=JSON.parse(JSON.stringify(input)),first=down?a:b,last=down?b:a;
 const top=data.nodes.find(n=>n.id===first.id)!,bottom=data.nodes.find(n=>n.id===last.id)!;
 const gap=last.y-first.y-first.height;
 bottom.x=first.x;bottom.y=first.y;top.x=last.x;top.y=first.y+last.height+gap;
 return data;
}
export interface SizeSettings { resizeStep:number; swapTolerance:number; width:number|null; height:number|null }
interface Host { app:App; settings:SizeSettings; register(cb:()=>void):void }
function snapshotKey(value:unknown):string|undefined{return JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);}
export class SizeController {
 private hold:{c:any;id:string;key:string;before:CanvasData}|null=null;
 private disposed=false;
 private canvases=new WeakSet<object>();
 private committed=new WeakMap<object,string>();
 constructor(private host:Host){host.register(()=>{this.finish();this.disposed=true;});}
 observe(c:any){
  if(!this.canvases.has(c)){
   this.canvases.add(c);const history=c.history,original=history.push,controller=this;
   const wrapper=function(this:any,data:CanvasData){if(controller.hold?.c===c)return;if(snapshotKey(this.data[this.current])===snapshotKey(data))return;return original.call(this,data);};
   history.push=wrapper;registerRuntimeCleanup(this.host,c,()=>{if(history.push===wrapper)history.push=original;});
  }

 }
 keyup(key:string){if(this.hold&&(key===this.hold.key||key==='Control'||key==='Shift'))this.finish();}
 finish(){const h=this.hold;if(!h)return;this.hold=null;h.c.requestPushHistory.cancel?.();const after=h.c.getData();if(JSON.stringify(after)!==JSON.stringify(h.before)){h.c.pushHistory(after);this.committed.set(h.c,JSON.stringify(after));h.c.requestSave();}}
 swap(c:any,n:any,down:boolean){this.finish();const before=c.getData(),after=swapCards(before,n.id,down,this.host.settings.swapTolerance);if(after)this.apply(c,before,after);}
 resize(c:any,n:any,key:string){
  if(this.hold&&(this.hold.c!==c||this.hold.id!==n.id||this.hold.key!==key))this.finish();
  if(!this.hold){const before=c.getData();c.requestPushHistory.cancel?.();c.pushHistory(before);this.hold={c,id:n.id,key,before};}
  const min=c.config.minContainerDimension;if(!Number.isFinite(min))return;
  const data:CanvasData=c.getData();const card=data.nodes.find(v=>v.id===n.id)!;
  const delta=this.host.settings.resizeStep;
  if(key==='ArrowRight')card.width+=delta;if(key==='ArrowLeft')card.width=Math.max(min,card.width-delta);
  if(key==='ArrowDown')card.height+=delta;if(key==='ArrowUp')card.height=Math.max(min,card.height-delta);
  if(n.isEditing){n.resize({width:card.width,height:card.height});}else c.importData(data,true);c.requestPushHistory.cancel?.();c.requestSave();
 }
 private apply(c:any,before:CanvasData,after:CanvasData){
  c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
  try{c.setData(after);this.committed.set(c,JSON.stringify(c.getData()));c.requestSave();}catch(error){c.importData(before,true);c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave();throw error;}
 }
 private fitting=false;
 private fitEpoch=0;
 cancelPendingFit(){this.fitEpoch++;}
 async fitSelection(c:any){
  if(this.fitting||c.readonly)return;
  const nodes=[...c.selection].filter((n:any)=>n.getData().type==='text'&&c.nodes.get(n.id)===n) as any[];
  if(!nodes.length)return;this.fitting=true;this.finish();
  const epoch=this.fitEpoch,before:CanvasData=structuredClone(c.getData()),after=structuredClone(before);
  try{
   for(const n of nodes){const size=await this.autoFit(c,n);if(size)Object.assign(after.nodes.find(v=>v.id===n.id)!,size);}
   if(this.disposed||epoch!==this.fitEpoch||c.readonly||snapshotKey(before)!==snapshotKey(c.getData()))return;
   if(snapshotKey(before)!==snapshotKey(after)){
    c.requestPushHistory.cancel?.();c.pushHistory(before);
    for(const n of nodes){const size=after.nodes.find(v=>v.id===n.id)!;n.resize({width:size.width,height:size.height});}
    c.requestPushHistory.cancel?.();c.pushHistory(c.getData());c.requestSave(false);
   }
  }finally{this.fitting=false;}
 }
 private async autoFit(c:any,n:any){
  if(this.disposed||c.readonly||c.nodes.get(n.id)!==n)return;
  const initialText=n.text,width=n.width;
  if(!String(initialText||'').trim()){const defaults=c.config.defaultTextNodeDimensions,w=this.host.settings.width??defaults.width,h=this.host.settings.height??defaults.height;if(n.width!==w||n.height!==h){return {width:w,height:h};}return;}
  const owner=n.nodeEl.ownerDocument;
  const measure=owner.body.createDiv({cls:'canvas-node canvas-mindmap-measure'});
  Object.assign(measure.style,{position:'fixed',left:'-100000px',top:'0',width:`${width}px`,height:'auto',transform:'none',visibility:'hidden',pointerEvents:'none'});
  const container=measure.createDiv({cls:'canvas-node-container'});container.style.position='relative';container.style.height='auto';
  const content=container.createDiv({cls:'canvas-node-content markdown-embed'});content.style.height='auto';
  const embed=content.createDiv({cls:'markdown-embed-content'});
  const preview=embed.createDiv({cls:'markdown-preview-view markdown-rendered'});Object.assign(preview.style,{height:'auto',minHeight:'0',overflow:'visible'});
  const sizer=preview.createDiv({cls:'markdown-preview-sizer markdown-preview-section'});sizer.style.minHeight='0';
  for(const element of [container,content,embed,preview,sizer])Object.assign(element.style,{position:'relative',display:'block',height:'auto',minHeight:'0',maxHeight:'none',overflow:'visible'});
  preview.style.display='flex';preview.style.flexDirection='column';sizer.style.flex='0 0 auto';
  measure.style.setProperty('--canvas-node-height',`${n.height}px`);
  const component=new Component();component.load();
  try{
   await MarkdownRenderer.render(this.host.app,initialText,sizer,c.view.file.path,component);
   // Canvas preview wraps each rendered block; retain that structure so paragraph margins match.
   for(const child of [...sizer.children]){const block=owner.createElement('div');block.className=`el-${child.tagName.toLowerCase()}`;child.replaceWith(block);block.appendChild(child);}
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   if(this.disposed||c.nodes.get(n.id)!==n||n.text!==initialText||n.width!==width)return;
   // Native Canvas uses size containment on the container; its own rect is not content height.
   const cs=getComputedStyle(container),cc=getComputedStyle(content);
   const px=(s:string)=>parseFloat(s)||0;
   // Measure the rendered content's intrinsic width, including explicit line breaks.
   // Remove size containment only on the hidden measuring copy.
   for(const element of [measure,container,content,embed,preview,sizer]){
    element.style.contain='none';element.style.maxWidth='none';element.style.width='max-content';
   }
   // Reserve the native preview scrollbar gutter during measurement, preventing
   // a shorter live card from wrapping an extra line while it is being fitted.
   preview.style.overflowY='scroll';
   const fittedWidth=Math.min(width,Math.max(c.config.minContainerDimension,Math.ceil(container.getBoundingClientRect().width)));
   if(!Number.isFinite(fittedWidth))return;
   measure.style.width=`${fittedWidth}px`;
   for(const element of [container,content,embed,preview,sizer])element.style.width='';
   let height=n.height;
   // Canvas top/bottom spacers depend on card height. Resolve that native CSS relationship.
   for(let i=0;i<10;i++){
    measure.style.setProperty('--canvas-node-height',`${height}px`);
    const next=Math.max(c.config.minContainerDimension,Math.ceil(content.getBoundingClientRect().height+px(cs.paddingTop)+px(cs.paddingBottom)+px(cs.borderTopWidth)+px(cs.borderBottomWidth)+px(cc.marginTop)+px(cc.marginBottom)));
    if(next===height)break;height=next;
   }
   if(!Number.isFinite(height)||(height===n.height&&fittedWidth===n.width))return;
   return {width:fittedWidth,height};
  }finally{component.unload();measure.remove();}
 }
}
