import {isOwnedSnapshot} from './snapshot';
import type {Store} from './model';
type CachedBytes={bytes:Buffer;charge:number;object?:WeakRef<object>;text?:string};

/** Native JSON semantics with a bounded cache of explicitly owned frozen graphs. */
export class SnapshotBytes {
 private cache=new WeakMap<object,CachedBytes>();
 private strings=new Map<string,CachedBytes>();
 private recent=new Set<CachedBytes>();
 private charged=0;
 constructor(private readonly limit=32*1024*1024,private readonly token=()=>crypto.randomUUID()){}
 private touch(entry:CachedBytes):Buffer{this.recent.delete(entry);this.recent.add(entry);return entry.bytes;}
 private retain(entry:CachedBytes):boolean{
  if(entry.charge>this.limit)return false;
  while(this.charged+entry.charge>this.limit){
   const oldest=this.recent.values().next().value as CachedBytes|undefined;if(!oldest)break;
   this.recent.delete(oldest);this.charged-=oldest.charge;
   if(oldest.object){const object=oldest.object.deref();if(object)this.cache.delete(object);}
   if(oldest.text!==undefined)this.strings.delete(oldest.text);
  }
  this.recent.add(entry);this.charged+=entry.charge;return true;
 }
 private snapshot(value:object):Buffer {
  const cached=this.cache.get(value);if(cached)return this.touch(cached);
  const bytes=Buffer.from(JSON.stringify(value),'utf8');
  if(bytes.length>=4096){const entry={bytes,charge:bytes.length,object:new WeakRef(value)};if(this.retain(entry))this.cache.set(value,entry);}
  return bytes;
 }
 encode(data:unknown):Buffer {
  const prefix='\u0000uct-snapshot:'+this.token()+':',parts:Buffer[]=[],owner=this;
  const marker=(bytes:Buffer)=>prefix+(parts.push(bytes)-1);
  const raw=JSON.stringify(data,function(_key,value){
   if(isOwnedSnapshot(value))return marker(owner.snapshot(value));
   // JSON unboxes String objects after its replacer. Do it exactly once here so
   // even an original string equal to a generated marker remains literal data.
   if(value&&typeof value==='object'&&!Array.isArray(value)){
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null){let wrapped=false;try{String.prototype.valueOf.call(value);wrapped=true;}catch{}if(wrapped)value=String(value);}
   }
   if(typeof value==='string'&&value.length>=4096){
    const cached=owner.strings.get(value);let bytes=cached?owner.touch(cached):undefined;
    if(!bytes){bytes=Buffer.from(JSON.stringify(value),'utf8');const charge=bytes.length+value.length*2;
     // String keys are retained by the Map; include their UTF-16 storage in the
     // same lifetime budget. Primitive equality cannot reuse a stale revision.
     const entry={bytes,charge,text:value};if(owner.retain(entry))owner.strings.set(value,entry);
    }
    return marker(bytes);
   }
   if(typeof value==='string'&&value.includes(prefix))return marker(Buffer.from(JSON.stringify(value),'utf8'));
   return value;
  });
  const skeleton=Buffer.from(raw,'utf8');if(!parts.length)return skeleton;
  const needle=Buffer.from(JSON.stringify(prefix).slice(0,-1),'utf8'),chunks:Buffer[]=[];let scan=0,start=0;
  while(true){const at=skeleton.indexOf(needle,scan);if(at<0)break;scan=at+needle.length;
   let escapes=0;for(let i=at-1;i>=0&&skeleton[i]===92;i--)escapes++;if(escapes%2)continue;
   const end=skeleton.indexOf(34,scan);if(end<0)throw Error('Invalid snapshot serialization marker');
   // Property names are never replacements, even if they equal a marker.
   if(skeleton[end+1]===58)continue;
   const digits=skeleton.toString('ascii',scan,end);if(!/^\d+$/.test(digits))continue;
   const bytes=parts[Number(digits)];if(!bytes)throw Error('Missing snapshot serialization part');
   chunks.push(skeleton.subarray(start,at),bytes);start=end+1;scan=start;
  }
  chunks.push(skeleton.subarray(start));return Buffer.concat(chunks);
 }
 stats(){return {charged:this.charged,limit:this.limit};}
}
