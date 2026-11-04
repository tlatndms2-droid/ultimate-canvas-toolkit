// Keep recovery copies outside the mounted/synced Vault. Never truncate a
// protected destination: fully write and verify a sibling before replacing it.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {guardedWrite}=require('./addition-save.cjs');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function parse(text){try{const d=JSON.parse(text);return Array.isArray(d.nodes)&&Array.isArray(d.edges)?d:null}catch{return null}}
function portal(d){return !!d?.canvasPortal}
class SafetyStore {
  constructor(base,io=fs){this.base=base;this.io=io;this.pending=new Map();this.tracked=new Set();}
  preserve(file,text){
    const parsed=parse(text);if(portal(parsed))this.tracked.add(file);
    const task=(this.pending.get(file)||Promise.resolve()).catch(()=>{}).then(()=>this.preserveNow(file,text,parsed));
    this.pending.set(file,task);task.finally(()=>{if(this.pending.get(file)===task)this.pending.delete(file)}).catch(()=>{});return task;
  }
  async preserveNow(file,text,d=parse(text)){
    if(!d||(!d.nodes.length&&!Object.values(d.canvasPortal?.portals||{}).some(p=>p.graph?.nodes?.length)))return;
    const dir=path.join(this.base,hash(file)),name=hash(text)+'.canvas',dest=path.join(dir,name);
    let existing;
    try{existing=await this.io.readFile(dest,'utf8')}catch(e){
      if(e.code!=='ENOENT')throw e;
      const tmp=dest+'.'+crypto.randomUUID()+'.tmp';let moved=false;
      try{let h;try{h=await this.io.open(tmp,'wx')}catch(error){if(error.code!=='ENOENT')throw error;await this.io.mkdir(dir,{recursive:true});h=await this.io.open(tmp,'wx')}try{await h.writeFile(text,'utf8');await h.sync()}finally{await h.close()}
        if(await this.io.readFile(tmp,'utf8')!==text)throw Error('복구 사본 검증 실패');await this.io.rename(tmp,dest);moved=true;
      }finally{if(!moved)await this.io.unlink(tmp).catch(()=>{})}
      existing=await this.io.readFile(dest,'utf8');
    }
    if(existing!==text)throw Error('복구 사본 검증 실패');
    // Refresh a reused revision so it remains among the most recent 20.
    const now=new Date(),maintenance=await Promise.allSettled([
      this.io.writeFile(path.join(dir,'source.json'),JSON.stringify({file}), 'utf8'),
      this.io.utimes(dest,now,now),this.io.readdir(dir)
    ]);
    for(const result of maintenance)if(result.status==='rejected')throw result.reason;
    const files=await Promise.all(maintenance[2].value.filter(n=>n.endsWith('.canvas')).map(async n=>({n,mtime:(await this.io.stat(path.join(dir,n))).mtimeMs})));
    files.sort((a,b)=>b.mtime-a.mtime);for(const f of files.slice(20))if(f.n!==name)await this.io.unlink(path.join(dir,f.n));
  }
}
async function protectedWrite(full,file,before,text,store,io=fs){
  const old=parse(before),next=parse(text);
  if(!portal(old)&&!portal(next))return false;
  if(!next||!portal(next)){await store.preserve(file,before);throw Error('포탈 데이터가 사라진 저장을 차단했습니다. 로컬 복구 사본을 확인하세요.');}
  if(before===text){
    await store.preserve(file,before);
    // The verified recovery copy already holds these exact bytes. Avoid a
    // redundant replacement/mtime change, but retain the concurrency check.
    if(await io.readFile(full,'utf8')!==before)throw Error('Canvas가 동시에 변경되어 저장을 중단했습니다. 로컬 복구 사본은 보존했습니다.');
    return true;
  }
  const tmp=full+'.cp-save-'+crypto.randomUUID()+'.tmp';let moved=false;
  try{
    // Prepare the separate local recovery copies and the Vault sibling together.
    // Neither task touches the destination. Wait for BOTH even on failure so
    // cleanup never races a still-open temporary file.
    const results=await Promise.allSettled([
      (async()=>{await store.preserve(file,before);await store.preserve(file,text)})(),
      (async()=>{const h=await io.open(tmp,'wx');try{await h.writeFile(text,'utf8');await h.sync()}finally{await h.close()}
        if(await io.readFile(tmp,'utf8')!==text)throw Error('Canvas 임시 저장 검증 실패');})()
    ]);
    for(const result of results)if(result.status==='rejected')throw result.reason;
    let current;try{current=await io.readFile(full,'utf8')}catch(e){if(e.code!=='ENOENT'||before!==null)throw e;current=null}
    if(current!==before)throw Error('Canvas가 동시에 변경되어 저장을 중단했습니다. 로컬 복구 사본은 보존했습니다.');
    await io.rename(tmp,full);moved=true;return true;
  }finally{if(!moved)await io.unlink(tmp).catch(()=>{})}
}
function install(adapter,base,onError){
  const store=new SafetyStore(base),undos=[];
  for(const method of ['write','process']){
    const original=adapter[method],had=Object.hasOwn(adapter,method);
    const wrapped=function(file,value,options){
      if(!file.toLowerCase().endsWith('.canvas'))return original.call(this,file,value,options);
      return this.queue(async()=>{
        options?.__uctVerifyCanvas?.();
        const full=this.getFullPath(file);let before,preservedText,preservedTask;
        if(method==='write'&&portal(parse(value))){preservedTask=store.preserve(file,value);preservedTask.catch(()=>{});preservedText=value;}
        try{before=await this.fsPromises.readFile(full,'utf8')}catch(e){if(e.code!=='ENOENT'||method==='process'){await preservedTask;throw e;}before=null}
        const text=method==='process'?value(before):value;
        if(method==='process'&&text===before)return before;
        try{
          if(store.tracked.has(file)&&!portal(parse(text)))throw Error('포탈 데이터가 사라진 저장을 차단했습니다. 로컬 복구 사본을 확인하세요.');
          // Reuse only the in-flight verification for this exact immutable
          // string. It must resolve before replacement; no receipt crosses writes.
          const protection={preserve:(candidate,bytes)=>candidate===file&&bytes===preservedText?preservedTask:store.preserve(candidate,bytes)};
          if(!await protectedWrite(full,file,before,text,protection,this.fsPromises))await this.fsPromises.writeFile(full,text,'utf8');
          await this.applyWriteOptions(full,options);
          if(method==='process')return text;
        }catch(e){onError(e);throw e}
        finally{await this.reconcileInternalFile(file)}
      });
    };
    if(method==='write')Object.defineProperty(wrapped,guardedWrite,{value:true});
    adapter[method]=wrapped;
    undos.push(()=>{if(adapter[method]===wrapped){if(had)adapter[method]=original;else delete adapter[method]}});
  }
  return {store,dispose(){undos.reverse().forEach(fn=>fn())}};
}
module.exports={SafetyStore,protectedWrite,install,hash};
