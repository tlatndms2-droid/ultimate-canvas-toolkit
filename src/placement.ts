import {Notice} from 'obsidian';
import type UctPlugin from './main';
import {placementMetadata} from './placement-metadata';
import {PlacementJournal} from './placement-journal';
import {PlacementPreparation} from './placement-preparation';
import {preparePlacementImages,fittedImageSize} from './placement-image-size';
import {waitForActiveCanvasSave} from './placement-save-wait';
const M=require('../vendor/portal/src/model.cjs');
type Part={item:any;nodes:any[];edges:any[];metadata:any[];x:number;y:number;width:number;height:number};
export class MiniPlacement {
  private ids:string[]=[];private overlay:HTMLElement|null=null;private parts:Part[]=[];private context:any;private point:{x:number;y:number}|null=null;private busy=false;private collided=false;private collisionNodes:any[]=[];private contextKey="";
  private journal!:PlacementJournal;private ready=false;private idle:Promise<void>=Promise.resolve();private releaseIdle:(()=>void)|null=null;
  private backgroundCount=0;private backgroundIdle:Promise<void>=Promise.resolve();private releaseBackground:(()=>void)|null=null;
  private images?:ReturnType<typeof preparePlacementImages>;private fitted=new Set<string>();private generation=0;private waitingImages=false;
  private preparedItems=new Map<string,string>();
  private preparation?:PlacementPreparation;
  async initialize(){
    const root=this.root;this.journal=new PlacementJournal({readJournal:()=>this.root.readJSON(this.root.rootDir+'/placement-pending.json'),writeJournal:data=>this.root.writeJSON(this.root.rootDir+'/placement-pending.json',data),readCanvas:path=>this.root.readJSON(path),saveLibrary:()=>this.root.saveLibrary(),canvasIsSaving:path=>this.root.app.workspace.getLeavesOfType('canvas').some(leaf=>{const view=leaf.view as any;return view.file?.path===path&&(view.saving===true||view.saveAgain===true);}),libraryChanged:restored=>this.root.mini.refreshPlacementState?.(restored)},{get items(){return root.library.items;}});
    try{await this.journal.load();this.ready=true;
      // Reload can reuse an unsaved live Canvas: persist it before disk-only recovery.
      for(const record of this.journal.listRecords())for(const leaf of root.app.workspace.getLeavesOfType('canvas')){const view=leaf.view as any;if(view.file?.path!==record.path)continue;if(typeof view.data!=='string'||typeof view.lastSavedData!=='string')throw Error('Canvas is still loading');await view.save();}
      await this.journal.startupRecover();this.preparation=new PlacementPreparation(this.journal);}catch(error){console.error('UCT placement recovery',error);new Notice('이전 배치 저장을 확인하지 못했습니다. 복구 기록과 Mini 자료를 보존했습니다.');}
  }
  async shutdown(){this.cancel();await this.whenIdle();await this.preparation?.finish();}
  private lock(){this.busy=true;this.idle=new Promise(resolve=>this.releaseIdle=resolve);}
  private unlock(){this.busy=false;this.releaseIdle?.();this.releaseIdle=null;}
  private beginBackground(){if(this.backgroundCount++===0)this.backgroundIdle=new Promise(resolve=>this.releaseBackground=resolve);}
  private endBackground(){if(--this.backgroundCount===0){this.releaseBackground?.();this.releaseBackground=null;}}
  async whenIdle(){while(this.busy||this.backgroundCount){if(this.busy)await this.idle;else await this.backgroundIdle;}}
  private async retryPending(ids:string[]){
    this.lock();try{for(const record of this.journal.listRecords().filter(r=>Object.keys(r.itemSnapshots).some(id=>ids.includes(id)))){
      const session=[...(this.root.portal.sessions.values())] .find((s:any)=>s.v.file?.path===record.path);
      if(session){if(session.busy)throw Error('Canvas 작업이 진행 중입니다. 잠시 후 다시 시도하세요.');session.busy=true;try{this.root.portal.capture(session);await session.v.save();}finally{session.busy=false;}}
      await this.journal.settle(record.id);
    }new Notice('이미 배치한 자료의 저장을 마쳤습니다.');}catch(error){console.error('UCT pending placement',error);new Notice('이전 배치의 저장이 아직 끝나지 않았습니다. 중복 배치를 막고 원본을 보존합니다.');}finally{this.unlock();this.root.mini.flushDeferredRefresh?.();}
  }
  get active(){return this.busy||this.backgroundCount>0||this.ids.length>0;}
  get interacting(){return this.busy||this.ids.length>0;}
  constructor(private root:UctPlugin){
    root.registerDomEvent(document,'dragenter',(event:DragEvent)=>this.over(event),true);
    root.registerDomEvent(document,'dragover',(event:DragEvent)=>this.over(event),true);
    root.registerDomEvent(document,'drop',(event:DragEvent)=>{void this.drop(event);},true);
    // A native drag ends while an accepted asynchronous drop is still saving.
    // Only explicit cancellation may invalidate that in-flight transaction.
    root.registerDomEvent(document,'dragend',()=>{if(!this.busy&&!this.waitingImages)this.cancel();},true);
    root.registerDomEvent(document,'keydown',(event:KeyboardEvent)=>{if(event.key==='Escape')this.cancel();},true);
  }
  start(ids:string[]){if(this.busy){new Notice('이전 배치를 저장하고 있습니다.');return;}if(!this.ready){new Notice('배치 복구 기록을 확인 중입니다.');return;}const pending=new Set(this.journal.listRecords?.().filter(r=>!this.preparation?.owns(r.id)).flatMap(r=>Object.keys(r.itemSnapshots))??this.journal.pendingItemIds());if(ids.some(id=>pending.has(id))){void this.retryPending(ids);return;}this.cancel();this.ids=[...ids];this.images=preparePlacementImages(this.root.app,ids.map(id=>this.root.library.items[id]),()=>{if(!this.busy&&this.ids.length&&this.images?.ready)this.fitImages();});}
  trackPointer(event:PointerEvent,finish=false){const target=document.elementFromPoint(event.clientX,event.clientY);const input={target,clientX:event.clientX,clientY:event.clientY,shiftKey:event.shiftKey,preventDefault:()=>event.preventDefault(),stopImmediatePropagation:()=>event.stopImmediatePropagation(),dataTransfer:null} as unknown as DragEvent;if(finish){const generation=this.generation;return this.drop(input).finally(()=>{if(!this.busy&&this.generation===generation)this.cancel();});}this.over(input);}
  cancelPreparation(){if(this.waitingImages)this.cancel();}
  cancel(){this.generation++;this.preparation?.cancel();this.images?.dispose();this.images=undefined;this.fitted.clear();this.preparedItems.clear();this.overlay?.remove();this.overlay=null;this.ids=[];this.parts=[];this.context=null;this.point=null;this.collisionNodes=[];this.contextKey="";if(!this.busy)this.root.mini.flushDeferredRefresh?.();}
  private fitImages(){
    let changed=false;
    for(const part of this.parts){const size=this.images?.sizes.get(part.item.id);if(!size||this.fitted.has(part.item.id)||part.nodes.length!==1)continue;const node=part.nodes[0];if(node.type!=='file')continue;const fit=fittedImageSize(node.width,node.height,size);node.width=part.width=Math.max(1,fit.width);node.height=part.height=Math.max(1,fit.height);this.fitted.add(part.item.id);changed=true;}
    if(!changed)return;let y=0,index=0;
    for(const part of this.parts){part.y=y;y+=part.height+48;for(const node of part.nodes){const el=this.overlay?.children[index++] as HTMLElement|undefined;if(el)Object.assign(el.style,{left:(node.x+part.x)+'px',top:(node.y+part.y)+'px',width:node.width+'px',height:node.height+'px'});}}
    this.collisionNodes=this.parts.flatMap(p=>p.nodes.map(n=>({...n,x:n.x+p.x,y:n.y+p.y})));
    if(this.context&&this.point){this.collided=this.root.palette.canvas.bundleCollides(this.context,{nodes:this.collisionNodes},this.point,new Set(),'avoid-content-overlap');this.overlay?.toggleClass('is-collision',this.collided);}
  }
  private prepare(context:any,copy=false){
    this.preparation?.cancel();
    this.overlay?.remove();this.overlay=null;let y=0;this.parts=[];this.fitted.clear();this.preparedItems.clear();
    for(const id of this.ids){const item=this.root.library.items[id];if(!item)continue;let material;
      if(item.uctPortal){const transfer=item.uctPortal.transfer;const b=M.bounds(transfer.nodes);material={nodes:transfer.nodes.map((n:any)=>({...n,x:n.x-b.x,y:n.y-b.y})),edges:transfer.edges,metadata:[],width:b.width,height:b.height};}
      else{const bundle=this.root.palette.canvas.createItemBundle([item],context);
        // Legacy workspace export separates headings from bodies. Mini keeps
        // the collected card verbatim, including its first Markdown heading.
        if(item.type==='card'&&bundle.nodes.length===1&&bundle.nodes[0].type==='text'&&typeof item.content==='string')bundle.nodes[0].text=item.content;
        material={...bundle,width:bundle.bounds.width,height:bundle.bounds.height};}
      this.parts.push({item,nodes:material.nodes,edges:material.edges,metadata:material.metadata??[],x:0,y,width:Math.max(1,material.width),height:Math.max(1,material.height)});y+=Math.max(1,material.height)+48;
      this.preparedItems.set(item.id,JSON.stringify(item));
    }
    this.collisionNodes=this.parts.flatMap(p=>p.nodes.map(n=>({...n,x:n.x+p.x,y:n.y+p.y})));
    this.context=context;this.contextKey=this.root.spaceKey(context.file.path,context.view);this.overlay=document.body.createDiv({cls:'uct-placement'});
    for(const part of this.parts)for(const node of part.nodes){const card=this.overlay.createDiv({cls:'uct-placement-node',text:node.type==='text'?(node.text??'').split('\n')[0]:node.file?.split('/').at(-1)??node.label??'Card'});Object.assign(card.style,{left:(node.x+part.x)+'px',top:(node.y+part.y)+'px',width:node.width+'px',height:node.height+'px'});}
    this.fitImages();
    const session=this.preparation&&!copy&&!this.parts.some(p=>p.item.uctPortal)&&this.parts.length?this.root.session(context.view):null;
    if(session&&!session.busy&&!session.switching&&!context.runtime.readonly)this.preparation!.begin({id:crypto.randomUUID(),path:context.file.path,space:session.current??null,nodeIds:this.parts.flatMap(p=>p.nodes.map(n=>n.id)),itemSnapshots:Object.fromEntries(this.parts.map(p=>[p.item.id,structuredClone(p.item)])),copy:false});
  }
  private over(event:DragEvent){if(!this.ids.length||this.busy)return;const ctx=this.root.palette?.canvas.contextForTarget(event.target);if(!ctx){if(this.overlay)this.overlay.hidden=true;this.point=null;return;}event.preventDefault();event.stopImmediatePropagation();if(event.dataTransfer)event.dataTransfer.dropEffect=event.shiftKey?'copy':'move';if(!this.context||this.context.runtime!==ctx.runtime||this.contextKey!==this.root.spaceKey(ctx.file.path,ctx.view))this.prepare(ctx,event.shiftKey);if(this.overlay)this.overlay.hidden=false;const point=ctx.runtime.posFromClient?.({x:event.clientX,y:event.clientY})??ctx.runtime.posFromEvt?.(event);if(!point)return;this.point=point;const probe=ctx.runtime.posFromClient?.({x:event.clientX+20,y:event.clientY});const scale=probe?20/Math.abs(probe.x-point.x):1;Object.assign(this.overlay!.style,{left:event.clientX+'px',top:event.clientY+'px',transform:`scale(${scale})`});this.collided=this.root.palette.canvas.bundleCollides(ctx,{nodes:this.collisionNodes},point,new Set(),'avoid-content-overlap');this.overlay?.toggleClass('is-collision',this.collided);}
  async drop(event:DragEvent){
    if(!this.ids.length||this.busy)return;this.over(event);if(!this.context||!this.point)return;const ctx=this.root.palette.canvas.contextForTarget(event.target);if(!ctx||ctx.runtime!==this.context.runtime)return;
    event.preventDefault();event.stopImmediatePropagation();if(this.collided&&this.images?.ready!==false){new Notice('다른 카드와 겹치지 않는 위치에 놓아 주세요.');this.cancel();return;}
    let parts=[...this.parts];const point={...this.point},copy=event.shiftKey,generation=this.generation,contextKey=this.contextKey,path=ctx.file.path,images=this.images;this.lock();let lockedSession:any;let journalId:string|null=null;let commitStarted=false,released=false;
    try{
      // A modifier can change from move to copy after hover preparation.
      // A copy must never leave a move recovery record matching its new nodes.
      if(copy&&this.preparation)await this.preparation.finish();
      if(generation!==this.generation)return;
      if(images&&!images.ready){this.waitingImages=true;try{await images.done;}finally{this.waitingImages=false;}if(generation!==this.generation)return;
        if(ctx.view.file?.path!==path||ctx.view.canvas!==ctx.runtime||this.root.spaceKey(path,ctx.view)!==contextKey)throw Error('이미지 준비 중 배치 대상이 변경되어 취소했습니다. Mini 자료는 유지됩니다.');
        this.fitImages();parts=[...this.parts];}
      if(images?.failure)throw images.failure;
      if(images&&!images.valid())throw Error('이미지 원본이 변경되어 배치를 취소했습니다. 다시 놓아 주세요.');
      for(const [id,snapshot] of this.preparedItems)if(JSON.stringify(this.root.library.items[id])!==snapshot)throw Error('배치 준비 중 보관 자료가 변경되어 취소했습니다. 수정한 Mini 자료는 유지됩니다.');
      if(this.root.palette.canvas.bundleCollides(ctx,{nodes:parts.flatMap(p=>p.nodes.map(n=>({...n,x:n.x+p.x,y:n.y+p.y})))},point,new Set(),'avoid-content-overlap'))throw Error('다른 카드와 겹치지 않는 위치에 놓아 주세요.');
      this.overlay?.remove();this.overlay=null;
      this.root.portal.discover();const s=this.root.session(ctx.view);if(!s||s.busy||s.switching||s.preview||ctx.runtime.readonly)throw Error('현재 Canvas 공간이 아직 준비되지 않았습니다.');s.busy=true;lockedSession=s;this.root.portal.capture(s);const before=s.root;let after=structuredClone(before);const beforeJSON=copy?undefined:JSON.stringify(before);const added:string[]=[];const metadata:any[]=[];const targetSpace=s.current??null;const targetPath=ctx.file.path;
      for(const part of parts){
        if(!this.root.library.items[part.item.id])throw Error('보관 항목이 변경되었습니다. 다시 배치하세요.');
        if(part.item.uctPortal){const transfer=part.item.uctPortal.transfer;const bounds=M.bounds(transfer.nodes);const result=M.pasteTransfer(after,transfer,targetSpace,{x:point.x+part.x-bounds.x,y:point.y+part.y-bounds.y});after=result.root;added.push(...result.nodes.map((n:any)=>n.id));}
        else{const target=M.space(after,targetSpace);const shifted=part.nodes.map(n=>({...n,x:n.x+part.x+point.x,y:n.y+part.y+point.y}));target.nodes.push(...shifted);target.edges.push(...part.edges);added.push(...shifted.map(n=>n.id));metadata.push(...part.metadata);}
      }
      if(!added.length)throw Error('배치할 자료가 없습니다.');
      const writes=placementMetadata(before,after,targetSpace,targetPath,added,metadata,Date.now());
      // Embed the same metadata in the saved graph so restart recovery is complete.
      for(const write of writes){const space=write.key===targetPath?null:write.key.slice((targetPath+'#uct-portal:').length);const graph=M.space(after,space);const node=graph.nodes.find((n:any)=>n.id===write.nodeId);if(node)node.uctMetadata=structuredClone({...write.metadata,modifiedAt:write.modifiedAt});}
      if(!copy){journalId=crypto.randomUUID();
      const record={id:journalId,path:targetPath,space:targetSpace,nodeIds:added,itemSnapshots:Object.fromEntries(parts.map(part=>[part.item.id,structuredClone(part.item)])),copy};
      if(this.preparation)journalId=await this.preparation.claim(record);else await this.journal.prepare(record);}
      if(generation!==this.generation)throw Error('배치를 취소했습니다. Mini 자료는 유지됩니다.');
      for(const [id,snapshot] of this.preparedItems)if(JSON.stringify(this.root.library.items[id])!==snapshot)throw Error('저장 준비 중 보관 자료가 변경되어 취소했습니다. Mini 자료는 유지됩니다.');
      if(images&&!images.valid())throw Error('저장 준비 중 이미지 원본이 변경되어 배치를 취소했습니다.');
      if(ctx.view.file?.path!==targetPath||ctx.view.canvas!==ctx.runtime||(s.current??null)!==targetSpace)throw Error('배치 대상이 변경되어 취소했습니다. Mini 자료는 유지됩니다.');
      // Only a move awaits journal I/O before commit. Copies cannot interleave
      // with edits here; moves compare against the pre-await serialized graph.
      if(!copy){this.root.portal.capture(s);if(JSON.stringify(s.root)!==beforeJSON)throw Error('저장 준비 중 Canvas가 변경되어 배치를 취소했습니다. 다시 놓아 주세요.');}
      commitStarted=true;
      if(typeof this.root.portal.commitAddition==='function')await this.root.portal.commitAddition(s,after,added,true,()=>{if(!copy)this.root.mini.setPlacementPending?.(parts.map(part=>part.item.id),true);});
      else await this.root.portal.commitRoot(s,after,added,true);
      for(const write of writes)this.root.palette.store.setMetadataRecord(write.key,write.nodeId,write.metadata,write.modifiedAt);
      if(writes.length)this.root.palette.store.changed();
      if(this.root.canvasRuntime)this.root.canvasRuntime.changed(ctx.view,'graph',added);
      else if(writes.length)void this.root.modules.outliner?.refresh();
      if(!await waitForActiveCanvasSave(ctx.view))throw Error('Canvas 저장이 진행 중입니다.');
      if(journalId){await this.journal.settle(journalId,()=>{
        // Permit a new gesture once the destination is durable and the Mini
        // state is visible, while keeping the persistence/Outliner barrier.
        this.beginBackground();released=true;try{this.root.mini.setPlacementPending?.(parts.map(part=>part.item.id),false);}catch(error){console.error('UCT placement indicator',error);}
        if(lockedSession){lockedSession.busy=false;lockedSession=null;}this.unlock();this.cancel();
      });journalId=null;}
      else if(copy)await this.journal.verifyCopy({path:targetPath,space:targetSpace,nodeIds:added});
      new Notice(copy?'복사해 배치했습니다. Mini에도 남아 있습니다.':'배치했습니다. Mini에서 옮겨졌습니다.');
    }catch(error){if(journalId&&!commitStarted)try{await this.journal.discard(journalId);}catch(cleanup){console.error('UCT placement journal',cleanup);}console.error('UCT placement',error);new Notice(commitStarted?(copy?'복사한 Canvas의 저장을 확인하지 못했습니다. Mini 원본은 유지됩니다.':'배치 저장을 마치지 못했습니다. 복구 기록을 보존하여 중복 배치를 막습니다.'):error instanceof Error?error.message:String(error));}
    finally{if(released){this.endBackground();this.root.mini.flushDeferredRefresh?.();}else{this.root.mini.setPlacementPending?.(parts.map(part=>part.item.id),false);if(lockedSession)lockedSession.busy=false;this.unlock();this.cancel();}}
  }
}
