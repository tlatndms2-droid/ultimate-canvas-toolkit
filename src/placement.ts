import {Notice} from 'obsidian';
import type UctPlugin from './main';
const M=require('../vendor/portal/src/model.cjs');
type Part={item:any;nodes:any[];edges:any[];metadata:any[];x:number;y:number;width:number;height:number};
export class MiniPlacement {
  private ids:string[]=[];private overlay:HTMLElement|null=null;private parts:Part[]=[];private context:any;private point:{x:number;y:number}|null=null;private busy=false;private collided=false;
  get active(){return this.busy||this.ids.length>0;}
  constructor(private root:UctPlugin){
    root.registerDomEvent(document,'dragover',(event:DragEvent)=>this.over(event),true);
    root.registerDomEvent(document,'drop',(event:DragEvent)=>{void this.drop(event);},true);
    root.registerDomEvent(document,'dragend',()=>{this.cancel();if(!this.busy)this.root.mini.refresh();},true);
    root.registerDomEvent(document,'keydown',(event:KeyboardEvent)=>{if(event.key==='Escape')this.cancel();},true);
  }
  start(ids:string[]){this.cancel();this.ids=[...ids];}
  trackPointer(event:PointerEvent,finish=false){const target=document.elementFromPoint(event.clientX,event.clientY);const input={target,clientX:event.clientX,clientY:event.clientY,shiftKey:event.shiftKey,preventDefault:()=>event.preventDefault(),stopImmediatePropagation:()=>event.stopImmediatePropagation(),dataTransfer:null} as unknown as DragEvent;if(finish)return this.drop(input);this.over(input);}
  cancel(){this.overlay?.remove();this.overlay=null;this.ids=[];this.parts=[];this.context=null;this.point=null;}
  private prepare(context:any){
    let y=0;this.parts=[];
    for(const id of this.ids){const item=this.root.library.items[id];if(!item)continue;let material;
      if(item.uctPortal){const transfer=item.uctPortal.transfer;const b=M.bounds(transfer.nodes);material={nodes:transfer.nodes.map((n:any)=>({...n,x:n.x-b.x,y:n.y-b.y})),edges:transfer.edges,metadata:[],width:b.width,height:b.height};}
      else{const bundle=this.root.palette.canvas.createItemBundle([item],context);material={...bundle,width:bundle.bounds.width,height:bundle.bounds.height};}
      this.parts.push({item,nodes:material.nodes,edges:material.edges,metadata:material.metadata??[],x:0,y,width:Math.max(1,material.width),height:Math.max(1,material.height)});y+=Math.max(1,material.height)+48;
    }
    this.context=context;this.overlay=document.body.createDiv({cls:'uct-placement'});
    for(const part of this.parts)for(const node of part.nodes){const card=this.overlay.createDiv({cls:'uct-placement-node',text:node.type==='text'?(node.text??'').split('\n')[0]:node.file?.split('/').at(-1)??node.label??'Card'});Object.assign(card.style,{left:(node.x+part.x)+'px',top:(node.y+part.y)+'px',width:node.width+'px',height:node.height+'px'});}
  }
  private over(event:DragEvent){if(!this.ids.length||this.busy)return;const ctx=this.root.palette?.canvas.contextForTarget(event.target);if(!ctx)return;event.preventDefault();event.stopImmediatePropagation();if(event.dataTransfer)event.dataTransfer.dropEffect=event.shiftKey?'copy':'move';if(!this.context||this.context.runtime!==ctx.runtime)this.prepare(ctx);const point=ctx.runtime.posFromClient?.({x:event.clientX,y:event.clientY})??ctx.runtime.posFromEvt?.(event);if(!point)return;this.point=point;const probe=ctx.runtime.posFromClient?.({x:event.clientX+20,y:event.clientY});const scale=probe?20/Math.abs(probe.x-point.x):1;Object.assign(this.overlay!.style,{left:event.clientX+'px',top:event.clientY+'px',transform:`scale(${scale})`});const nodes=this.parts.flatMap(p=>p.nodes.map(n=>({...n,x:n.x+p.x,y:n.y+p.y})));this.collided=this.root.palette.canvas.bundleCollides(ctx,{nodes},point,new Set(),'avoid-content-overlap');this.overlay?.toggleClass('is-collision',this.collided);}
  async drop(event:DragEvent){
    if(!this.ids.length||!this.context||!this.point||this.busy)return;const ctx=this.root.palette.canvas.contextForTarget(event.target);if(!ctx||ctx.runtime!==this.context.runtime)return;
    event.preventDefault();event.stopImmediatePropagation();if(this.collided){new Notice('다른 카드와 겹치지 않는 위치에 놓아 주세요.');this.cancel();return;}
    const parts=[...this.parts],point={...this.point},copy=event.shiftKey;this.busy=true;
    try{
      this.root.portal.discover();const s=this.root.session(ctx.view);if(!s)throw Error('현재 Canvas 공간이 아직 준비되지 않았습니다.');this.root.portal.capture(s);let after=structuredClone(s.root);const before=structuredClone(s.root);const added:string[]=[];const metadata:any[]=[];
      for(const part of parts){
        if(!this.root.library.items[part.item.id])throw Error('보관 항목이 변경되었습니다. 다시 배치하세요.');
        if(part.item.uctPortal){const transfer=part.item.uctPortal.transfer;const bounds=M.bounds(transfer.nodes);const result=M.pasteTransfer(after,transfer,s.current,{x:point.x+part.x-bounds.x,y:point.y+part.y-bounds.y});after=result.root;added.push(...result.nodes.map((n:any)=>n.id));}
        else{const target=M.space(after,s.current);const shifted=part.nodes.map(n=>({...n,x:n.x+part.x+point.x,y:n.y+part.y+point.y}));target.nodes.push(...shifted);target.edges.push(...part.edges);added.push(...shifted.map(n=>n.id));metadata.push(...part.metadata);}
      }
      try{await this.root.portal.commitRoot(s,after,added,true);}catch(error){await this.root.portal.commitRoot(s,before,[],true);throw error;}
      for(const [space,graph]of [['root',after],...Object.entries(after.canvasPortal?.portals??{}).map(([id,p]:[string,any])=>[id,p.graph])] as [string,any][]){for(const node of graph.nodes??[])if(node.uctMetadata){const key=space==='root'?ctx.file.path:ctx.file.path+'#uct-portal:'+space;this.root.palette.store.setMetadataRecord(key,node.id,node.uctMetadata,Date.now());}}
      for(const entry of metadata)this.root.palette.store.setCanvasNodeMetadata(ctx.file.path,entry.nodeId,entry.metadata);
      this.root.palette.store.changed();
      if(!copy)for(const part of parts)delete this.root.library.items[part.item.id];
      try{await this.root.saveLibrary();}catch(error){for(const part of parts)this.root.library.items[part.item.id]=part.item;throw error;}new Notice(copy?'복사해 배치했습니다. Mini에도 남아 있습니다.':'배치했습니다. Mini에서 옮겨졌습니다.');
    }catch(error){console.error('UCT placement',error);new Notice(error instanceof Error?error.message:String(error));}
    finally{this.busy=false;this.cancel();this.root.mini.refresh();}
  }
}
