interface Host {register(cb:()=>void):void}
// Cleanup must not keep a closed Canvas (or a removed card) alive until plugin unload.
const owners=new WeakMap<Host,{refs:Set<WeakRef<object>>;callbacks:WeakMap<object,Array<()=>void>>;finalizer:FinalizationRegistry<WeakRef<object>>}>();
export function registerRuntimeCleanup(host:Host,target:object,cleanup:()=>void){
 let owner=owners.get(host);
 if(!owner){
  const refs=new Set<WeakRef<object>>(),callbacks=new WeakMap<object,Array<()=>void>>();
  owner={refs,callbacks,finalizer:new FinalizationRegistry(ref=>refs.delete(ref))};owners.set(host,owner);
  host.register(()=>{for(const ref of refs){const target=ref.deref();if(target)for(const cb of (callbacks.get(target)||[]).reverse())cb();}refs.clear();owners.delete(host);});
 }
 let callbacks=owner.callbacks.get(target);
 if(!callbacks){callbacks=[];owner.callbacks.set(target,callbacks);const ref=new WeakRef(target);owner.refs.add(ref);owner.finalizer.register(target,ref);}
 callbacks.push(cleanup);
}
