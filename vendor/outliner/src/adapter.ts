import {App,TFile,WorkspaceLeaf} from 'obsidian';
import {CanvasDocument,CanvasNode} from './model';
// Canvas methods below are Obsidian internal APIs, isolated here and feature-detected.
export class CanvasAdapter {
 constructor(readonly app:App){}
 leaf:WorkspaceLeaf|null=null;
 private recentLeaves:WorkspaceLeaf[]=[];
 get view():any{return this.leaf?.view;}
 get canvas():any{return this.view?.getViewType?.()==='canvas'?this.view.canvas:null;}
 get file():TFile|null{return this.view?.file??null;}
 activate(leaf:WorkspaceLeaf|null){if(leaf?.view.getViewType()==='canvas'){this.leaf=leaf;this.recentLeaves=[leaf,...this.recentLeaves.filter(l=>l!==leaf)];}}
 reconcileLeaves(leaves:WorkspaceLeaf[]){this.recentLeaves=this.recentLeaves.filter(l=>leaves.includes(l));if(!this.leaf||!leaves.includes(this.leaf)){this.leaf=this.recentLeaves[0]??leaves[0]??null;if(this.leaf)this.activate(this.leaf);}}
 document():CanvasDocument|null {const c=this.canvas,v=this.view;if(!c?.getData)return null;
  // Canvas save(true) clears the graph while unloading, before its file changes.
  // A loaded empty Canvas has string data; null means the graph is not authoritative.
  if(typeof v.data!=='string'||typeof v.lastSavedData!=='string')return null;
  return c.getData();}
 element():HTMLElement|null{return this.canvas?.wrapperEl??this.canvas?.canvasEl??this.view?.containerEl??null;}
 node(id:string):any{return this.canvas?.nodes?.get(id);}
 selection():string[]{return [...(this.canvas?.selection??[])].map((n:any)=>n.id);}
 async open(path:string){const f=this.app.vault.getAbstractFileByPath(path);if(f instanceof TFile){const leaf=this.app.workspace.getLeaf(false);await leaf.openFile(f);this.activate(leaf);}}
 select(id:string,padding=40){const c=this.canvas,n=this.node(id);if(!c||!n)return; c.selectOnly?.(n);this.fit(n.getData?.()??n,padding,0);}
 bounds():{x:number;y:number;width:number;height:number}|null {const c=this.canvas;if(!c)return null;if(c.getViewportBBox){const b=c.getViewportBBox();return{x:b.minX,y:b.minY,width:b.maxX-b.minX,height:b.maxY-b.minY}}const r=this.element()?.getBoundingClientRect();const z=2**(c.zoom??0);return {x:(c.x??0)-(r?.width??800)/z/2,y:(c.y??0)-(r?.height??600)/z/2,width:(r?.width??800)/z,height:(r?.height??600)/z};}
 fit(rect:{x:number;y:number;width:number;height:number},padding:number,duration:number){const c=this.canvas;if(!c)return;const box={minX:rect.x-padding,minY:rect.y-padding,maxX:rect.x+rect.width+padding,maxY:rect.y+rect.height+padding};if(c.zoomToBbox)c.zoomToBbox(box,{duration});else if(c.zoomToBounds)c.zoomToBounds(box);else if(c.setViewport){const r=this.element()?.getBoundingClientRect();c.setViewport({x:rect.x+rect.width/2,y:rect.y+rect.height/2,zoom:Math.min((r?.width??800)/(rect.width+padding*2),(r?.height??600)/(rect.height+padding*2))});}}
 toCanvas(e:{clientX:number;clientY:number}):{x:number;y:number}|null{const c=this.canvas;if(c?.posFromEvt)return c.posFromEvt(e);const r=this.element()?.getBoundingClientRect();const v=c?.getViewport?.()??c?.viewport;if(!r||!v)return null;return {x:(e.clientX-r.left-r.width/2)/(c.zoom??v.zoom??1)+v.x,y:(e.clientY-r.top-r.height/2)/(c.zoom??v.zoom??1)+v.y};}
 nodeElement(id:string):HTMLElement|null{const n=this.node(id);return n?.nodeEl??n?.containerEl??null;}
 async texts(doc:CanvasDocument){const map=new Map<string,string>();for(const n of doc.nodes){if(n.type==='text')map.set(n.id,n.text??'');else if(n.type==='file'&&n.file?.toLowerCase().endsWith('.md')){const f=this.app.vault.getAbstractFileByPath(n.file);if(f instanceof TFile)map.set(n.id,await this.app.vault.cachedRead(f));}}return map;}
}
