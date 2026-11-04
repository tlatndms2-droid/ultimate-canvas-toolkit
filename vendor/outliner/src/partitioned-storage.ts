import {promises as fs} from 'fs';
import {join} from 'path';
import {createHash,randomUUID} from 'crypto';
import {SettingsFile,validateStore,parseStore} from './storage';
import {SnapshotBytes} from './snapshot-bytes';
import type {Store} from './model';
type Part={file:string;hash:string};
type Index={version:2;rootOrder:string[];order:string[];parts:Record<string,Part>;header:Omit<Store,'canvases'>};
const INDEX='state-index.json',BACKUP='state-index.backup.json',DIR='canvas-state-v2';
const physical=(key:string)=>key.split('#uct-portal:')[0];
const digest=(raw:Buffer)=>createHash('sha256').update(raw).digest('hex');
const equal=(a:Buffer|null,b:Buffer|null)=>a===b||a!==null&&b!==null&&a.equals(b);
const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);

/** Immutable revisions are published together by one small atomic index. */
export class CanvasSettingsFile {
 private encoder=new SnapshotBytes();
 private loaded=false;private valid:Buffer|null=null;private index:Index|null=null;
 private raws=new Map<string,Buffer>();private legacy:Buffer|null=null;
 private tail:Promise<unknown>=Promise.resolve();
 constructor(private dir:string,private io=fs){}
 private async read(name:string):Promise<Buffer|null>{try{return await this.io.readFile(join(this.dir,name));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 private async replace(name:string,raw:Buffer,expected:Buffer|null){
  const target=join(this.dir,name),temp=target+'.'+randomUUID()+'.tmp';
  try{await this.io.writeFile(temp,raw);if(!raw.equals(await this.io.readFile(temp)))throw Error('Settings temporary write verification failed');if(!equal(await this.read(name),expected))throw Error('Settings changed externally during save');await this.io.rename(temp,target);}finally{await this.io.unlink(temp).catch(()=>{});}
 }
 private parse(raw:Buffer):Index{
  const value=JSON.parse(raw.toString('utf8'));
  if(value?.version!==2||!Array.isArray(value.order)||!value.order.every((k:any)=>typeof k==='string')||new Set(value.order).size!==value.order.length||!object(value.parts)||!object(value.header)||value.header.version!==1||!object(value.header.settings)||'canvases' in value.header)throw Error('Invalid partitioned Outliner index');
  if(!Array.isArray(value.rootOrder)||value.rootOrder.length!==Object.keys(value.header).length+1||new Set(value.rootOrder).size!==value.rootOrder.length||value.rootOrder.some((k:any)=>typeof k!=="string"||(k!=="canvases"&&!Object.hasOwn(value.header,k))))throw Error("Invalid root field order");
  const expected=new Set(value.order.map(physical));
  if(Object.keys(value.parts).length!==expected.size)throw Error('Outliner index partition mismatch');
  for(const [key,p]of Object.entries(value.parts) as [string,any][]){if(!expected.has(key)||!object(p)||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\.json$/.test(p.file)||!/^[a-f0-9]{64}$/.test(p.hash))throw Error('Invalid Outliner revision reference');}
  return value;
 }
 private async materialize(index:Index){
  const groups=new Map<string,Record<string,any>>(),raws=new Map<string,Buffer>();
  // Bound mounted-filesystem concurrency rather than launching every read at once.
  const entries=Object.entries(index.parts);let next=0;
  await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{while(next<entries.length){const [key,p]=entries[next++],raw=await this.read(DIR+'/'+p.file);if(!raw||digest(raw)!==p.hash)throw Error('Outliner revision is missing or damaged: '+key);const group=JSON.parse(raw.toString('utf8'));if(!object(group)||Object.keys(group).some(k=>physical(k)!==key))throw Error('Invalid Outliner partition');groups.set(key,group);raws.set(key,raw);}}));
  const all=Object.fromEntries(index.order.map(key=>{const group=groups.get(physical(key))!;if(!Object.hasOwn(group,key))throw Error('Outliner state missing: '+key);return [key,group[key]];}));
  if([...groups.values()].reduce((n,g)=>n+Object.keys(g).length,0)!==index.order.length)throw Error('Unexpected Outliner states in partition');
  const data=Object.fromEntries(index.rootOrder.map(k=>[k,k==="canvases"?all:(index.header as any)[k]])) as unknown as Store;validateStore(data);return {data,raws};
 }
 async load():Promise<{data:Store|null;recovered:boolean}>{
  this.loaded=false;const raw=await this.read(INDEX),backup=await this.read(BACKUP);
  if(raw!==null||backup!==null){
   let loaded:{data:Store;raws:Map<string,Buffer>}|undefined,index:Index|undefined,chosen:Buffer|undefined,recovered=false;
   if(raw)try{index=this.parse(raw);loaded=await this.materialize(index);chosen=raw;}catch{}
   if(!loaded){if(!backup)throw Error('Outliner index unavailable; original and revisions preserved');index=this.parse(backup);loaded=await this.materialize(index);chosen=backup;recovered=true;if(raw)await this.io.copyFile(join(this.dir,INDEX),join(this.dir,'state-index.corrupt-'+randomUUID()+'.json'));await this.replace(INDEX,backup,raw);}
   this.valid=chosen!;this.index=index!;this.raws=loaded.raws;this.legacy=null;this.loaded=true;return {data:loaded.data,recovered};
  }
  const loaded=await new SettingsFile(this.dir,this.io).load();this.legacy=await this.read('data.json');this.valid=null;this.index=null;this.raws.clear();this.loaded=true;return loaded;
 }
 save(data:Store):Promise<void>{
  if(!this.loaded)return Promise.reject(Error('Load Outliner settings before saving'));
  validateStore(data);
  // Capture all mutable JSON before the first await, including queued saves.
  const rootOrder=Object.keys(data),order=Object.keys(data.canvases),groups=new Map<string,Record<string,any>>();
  for(const key of order){const owner=physical(key);let group=groups.get(owner);if(!group)groups.set(owner,group=Object.create(null));group[key]=data.canvases[key];}
  const bytes=new Map([...groups].map(([key,group])=>[key,this.encoder.encode(group)]));
  const {canvases,...header}=data;const frozenHeader=JSON.parse(JSON.stringify(header));
  const operation=this.tail.catch(()=>{}).then(()=>this.commit(order,bytes,frozenHeader,rootOrder));this.tail=operation;return operation;
 }
 private async commit(order:string[],bytes:Map<string,Buffer>,header:Index['header'],rootOrder:string[]){
  if(!equal(await this.read(INDEX),this.valid))throw Error('Settings changed externally; reload before saving');
  if(!this.index&&!equal(await this.read('data.json'),this.legacy))throw Error('Legacy settings changed externally during migration');
  const parts:Record<string,Part>=Object.create(null),changed:string[]=[];
  for(const [key,raw]of bytes){const old=this.index?.parts[key];if(old&&this.raws.get(key)?.equals(raw)){parts[key]=old;continue;}changed.push(key);parts[key]={file:randomUUID()+'.json',hash:digest(raw)};}
  const index:Index={version:2,rootOrder,order,parts,header},raw=Buffer.from(JSON.stringify(index));if(equal(raw,this.valid))return;
  // Never overwrite a revision. Failed or interrupted writes remain unreferenced.
  if(changed.length)await this.io.mkdir(join(this.dir,DIR),{recursive:true});
  for(const [key,old] of Object.entries(this.index?.parts??{}))if(!bytes.has(key)){const disk=await this.read(DIR+'/'+old.file);if(!disk||!this.raws.get(key)?.equals(disk))throw Error('Outliner revision changed externally');}
  for(const key of changed){const old=this.index?.parts[key];if(old){const disk=await this.read(DIR+'/'+old.file);if(!disk||!this.raws.get(key)?.equals(disk))throw Error('Outliner revision changed externally');}const file=join(this.dir,DIR,parts[key].file),value=bytes.get(key)!;await this.io.writeFile(file,value,{flag:'wx'});if(!value.equals(await this.io.readFile(file)))throw Error('Outliner revision write verification failed');}
  if(!this.index&&!equal(await this.read('data.json'),this.legacy))throw Error('Legacy settings changed externally during migration');
  const oldBackup=await this.read(BACKUP),backup=this.valid??raw;
  // On first migration this fully verified backup can finish an interrupted publication.
  await this.replace(BACKUP,backup,oldBackup);await this.replace(INDEX,raw,this.valid);
  const obsolete=oldBackup?(()=>{try{return Object.values(this.parse(oldBackup).parts).map(p=>p.file);}catch{return [];}})():[];
  this.index=index;this.valid=raw;this.raws=bytes;
  const keep=new Set([...Object.values(index.parts),...Object.values(this.parse(backup).parts)].map(p=>p.file));
  // Only retire revisions from our known former backup, never unknown in-flight files.
  if(equal(await this.read(INDEX).catch(()=>null),raw))for(const file of obsolete)if(!keep.has(file))await this.io.unlink(join(this.dir,DIR,file)).catch(()=>{});
 }
 async exportLegacy(destination:string){
  if(destination==='data.json'||destination===INDEX)throw Error('Export must not overwrite the preserved original or index');
  if(!/^[a-zA-Z0-9_-]+\.json$/.test(destination))throw Error('Invalid export name');
  const operation=this.tail.catch(()=>{}).then(async()=>{if(!equal(await this.read(INDEX),this.valid))throw Error('Settings changed externally');const data=this.index?(await this.materialize(this.index)).data:(()=>{if(!this.legacy)throw Error('No Outliner settings to export');return parseStore(this.legacy.toString('utf8'));})();const raw=this.encoder.encode(data);if(await this.read(destination)!==null)throw Error('Export destination already exists');await this.replace(destination,raw,null);});this.tail=operation;return operation;
 }
}
