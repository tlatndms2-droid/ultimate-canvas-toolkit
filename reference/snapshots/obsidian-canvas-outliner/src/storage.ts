import {promises as fs} from 'fs';
import {join} from 'path';
import {Store} from './model';

export function parseStore(raw:string):Store {
 const value=JSON.parse(raw);
 validateStore(value);
 return value;
}
function validateStore(value:Store){
 if(value?.version!==1||!value.canvases||typeof value.canvases!=='object'||Array.isArray(value.canvases)||!value.settings||typeof value.settings!=='object')throw Error('Invalid Canvas Outliner settings');
 // Store roots are plain data; a custom serializer must not replace a checked root.
 if([value,value.canvases,value.settings].some(root=>typeof (root as any).toJSON==='function'))throw Error('Custom settings serializers are unsupported');
}

// Never truncate the only current copy. A failed write/read/rename leaves it intact.
export class SettingsFile {
 private validRaw:string|null|undefined;
 constructor(private dir:string,private io=fs){}
 private async read(name:string){try{return await this.io.readFile(join(this.dir,name),'utf8')}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 private async replace(name:string,raw:string,expected?:string|null){
  const target=join(this.dir,name),temp=target+'.'+crypto.randomUUID()+'.tmp';
  try{await this.io.writeFile(temp,raw,'utf8');if(await this.io.readFile(temp,'utf8')!==raw)throw Error('Settings temporary write verification failed');if(expected!==undefined&&await this.read(name)!==expected)throw Error('Settings changed externally during save');await this.io.rename(temp,target);}
  finally{await this.io.unlink(temp).catch(()=>{});}
 }
 async load():Promise<{data:Store|null;recovered:boolean}>{
  const raw=await this.read('data.json');
  if(raw!==null){try{const data=parseStore(raw);this.validRaw=raw;return{data,recovered:false}}catch{}}
  const backup=await this.read('data.backup.json');
  if(backup===null){if(raw===null){this.validRaw=null;return{data:null,recovered:false};}throw Error('Settings and recovery backup unavailable');}
  const data=parseStore(backup);
  if(raw!==null)await this.io.copyFile(join(this.dir,'data.json'),join(this.dir,'data.corrupt-'+Date.now()+'-'+crypto.randomUUID()+'.json'));
  await this.replace('data.json',backup,raw);
  this.validRaw=backup;
  return{data,recovered:true};
 }
 async save(data:Store){
  // Freeze before the first await. No cloned object or repeated parsing is needed.
  validateStore(data);const raw=JSON.stringify(data),previous=await this.read('data.json');
  if(this.validRaw!==undefined&&previous!==this.validRaw){if(previous!==null)parseStore(previous);throw Error('Settings changed externally; reload before saving');}
  if(previous!==null&&this.validRaw===undefined){parseStore(previous);this.validRaw=previous;}
  if(previous===raw)return;
  await this.replace('data.json',raw,previous);
  this.validRaw=raw;
 }
}
