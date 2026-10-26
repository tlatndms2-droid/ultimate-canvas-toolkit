import {CanvasDocument,CanvasState,Store,clone,emptyCanvas,purgeMissing,sync,uid} from './model';
export const markerId=(doc:CanvasDocument)=>doc.canvasOutliner?.version===1&&typeof doc.canvasOutliner.id==='string'?doc.canvasOutliner.id:null;
export interface IdentityTransfer {previous:string|null;identity:string;state:CanvasState}
export class CanvasIdentity {
 private tail:Promise<unknown>=Promise.resolve();
 readonly pending=new Map<string,number>();
 constructor(private io:{store:()=>Store;read:(path:string)=>Promise<CanvasDocument>;
  write:(path:string,previous:string|null,id:string)=>Promise<CanvasDocument>;save:()=>Promise<void>}){}
 ensure(path:string,explicit?:CanvasState):Promise<void>{
  this.pending.set(path,(this.pending.get(path)??0)+1);
  const run=this.tail.catch(()=>{}).then(()=>this.apply(path,explicit));
  this.tail=run;return run.finally(()=>{const left=(this.pending.get(path)??1)-1;if(left)this.pending.set(path,left);else this.pending.delete(path);});
 }
 async drain(){await this.tail;}
 private async apply(path:string,explicit?:CanvasState){
  const store=this.io.store(),journal=store.identityTransfers??(store.identityTransfers={});
  const doc=await this.io.read(path);if(!Array.isArray(doc.nodes)||!Array.isArray(doc.edges))throw Error('Invalid Canvas: '+path);
  const incoming=markerId(doc),existing=store.canvases[path];
  let transfer=journal[path];
  if(!transfer){
   if(!explicit&&existing?.identity&&existing.identity===incoming)return;
   let state:CanvasState,id:string;
   if(explicit){state=clone(explicit);id=uid();}
   else if(existing&&!existing.identity){
    // Adopt each pre-identity path's own configuration, never infer its owner from content.
    state=clone(existing);id=incoming&&!Object.entries(store.canvases).some(([p,s])=>p!==path&&s.identity===incoming)?incoming:uid();
   }else if(incoming){
    const sources=Object.entries(store.canvases).filter(([p,s])=>p!==path&&s.identity===incoming);
    if(sources.length!==1)throw Error('Canvas 원본 구성 식별 실패: '+path);
    state=clone(sources[0][1]);id=uid();
   }else{state=clone(existing??emptyCanvas());id=existing?.identity??uid();}
   state.identity=id;transfer={previous:incoming,identity:id,state};journal[path]=transfer;
  }
  // Persist the complete configuration before changing the file identity. A restart
  // can finish either side of the two-file update without guessing a source.
  await this.io.save();
  const written=await this.io.write(path,transfer.previous,transfer.identity);
  const state=clone(transfer.state);sync(state,written);purgeMissing(state);
  state.identity=transfer.identity;store.canvases[path]=state;delete journal[path];
  try{await this.io.save();}catch(error){
   if(existing)store.canvases[path]=existing;else delete store.canvases[path];
   journal[path]=transfer;throw error;
  }
 }
}
