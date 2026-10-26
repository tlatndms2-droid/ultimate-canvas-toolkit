/** Keeps native copy provenance without modifying Canvas files. */
export function observeCopies<F extends {path:string;extension:string}, S>(
 host:{copy:(file:F,target:string)=>Promise<F>},
 options:{normalize:(path:string)=>string; capture:(file:F)=>S;
 complete:(file:F,state:S)=>Promise<void>; error:(error:unknown)=>void}
){
 const previous=host.copy,pending=new Set<string>();let enabled=true;
 const wrapped=async function(this:typeof host,file:F,target:string):Promise<F>{
  if(!enabled||file.extension!=='canvas')return previous.call(this,file,target);
  const key=options.normalize(target);
  // Native copy owns collision handling; never replace another operation's state.
  if(pending.has(key))throw Error('Canvas copy already in progress: '+key);
  const snapshot=options.capture(file);pending.add(key);
  try{
   const copied=await previous.call(this,file,target);
   try{await options.complete(copied,snapshot);}catch(error){options.error(error);}
   return copied;
  }finally{pending.delete(key);}
 };
 host.copy=wrapped;
 return {pending,dispose(){enabled=false;if(host.copy===wrapped)host.copy=previous;}};
}
