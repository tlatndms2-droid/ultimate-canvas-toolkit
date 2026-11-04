import type {PlacementRecord} from './placement-journal';
type IO={prepare(record:PlacementRecord):Promise<void>;discard(id:string):Promise<void>};
type Ticket={record:PlacementRecord;signature:string;ready:Promise<void>};
const signature=(record:PlacementRecord)=>JSON.stringify({...record,id:undefined});
/** Prepare one gesture's recovery record before release, without changing either graph. */
export class PlacementPreparation {
 private ticket?:Ticket;
 private cleanup:Promise<void>=Promise.resolve();
 private owned=new Set<string>();
 private io:IO;
 constructor(io:IO){this.io=io;}
 owns(id:string){return this.owned.has(id);}
 begin(record:PlacementRecord){
  this.cancel();const copy=structuredClone(record);this.owned.add(copy.id);
  const ready=this.cleanup.then(()=>this.io.prepare(copy));void ready.catch(()=>{});
  this.ticket={record:copy,signature:signature(copy),ready};
 }
 cancel(){
  const ticket=this.ticket;if(!ticket)return;this.ticket=undefined;
  // Preparation failure never creates an in-memory journal entry to discard.
  this.cleanup=ticket.ready.then(()=>this.io.discard(ticket.record.id),()=>{}).finally(()=>this.owned.delete(ticket.record.id));
  void this.cleanup.catch(()=>{});
 }
 async claim(record:PlacementRecord):Promise<string>{
  const ticket=this.ticket;
  if(ticket?.signature===signature(record)){
   this.ticket=undefined;
   try{await ticket.ready;return ticket.record.id;}finally{this.owned.delete(ticket.record.id);}
  }
  this.cancel();await this.cleanup;await this.io.prepare(record);return record.id;
 }
 async finish(){this.cancel();await this.cleanup;}
}
