import {registerRuntimeCleanup} from './runtime-cleanup';
/** Selection belongs to a runtime Undo snapshot, never to the saved Canvas file. */
export class SelectionHistory {
 private states=new WeakMap<object,string[]>();
 private patched=new WeakSet<object>();
 constructor(readonly register:(cb:()=>void)=>void){}
 capture(c:any){
  const state=c.history.data[c.history.current];
  if(state&&typeof state==='object')this.states.set(state,[...c.selection].map((n:any)=>n.id));
 }
 observe(c:any){
  if(this.patched.has(c))return;this.patched.add(c);this.capture(c);
  const controller=this,history=c.history,push=history.push,apply=c.applyHistory;
  const pushWrapper=function(this:any,data:any){const result=push.call(this,data);const state=this.data[this.current];if(state&&!controller.states.has(state))controller.states.set(state,[...c.selection].map((n:any)=>n.id));return result;};
  const applyWrapper=function(this:any,data:any){
   this.requestPushHistory?.cancel?.();
   const ids=controller.states.get(data),result=apply.call(this,data);
   this.requestPushHistory?.cancel?.();
   if(ids){this.deselectAll();for(const id of ids){const item=this.nodes.get(id)||this.edges.get(id);if(item)this.select(item);}}
   return result;
  };
  history.push=pushWrapper;c.applyHistory=applyWrapper;
  registerRuntimeCleanup(this,c,()=>{if(history.push===pushWrapper)history.push=push;if(c.applyHistory===applyWrapper)c.applyHistory=apply;});
 }
}
