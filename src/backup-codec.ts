import {Zip,zip,unzip,type ZipInputFile} from 'fflate/browser';
import {crc32,deflateRaw,inflateRaw} from 'node:zlib';
import {safeArchivePath} from './archive-path';

/** Standard ZIP framing, native CRC and bounded asynchronous compression. */
export function encodeBackup(files:Record<string,Uint8Array>):Promise<Uint8Array>{
 // Older Obsidian Node runtimes retain the compatible existing implementation.
 if(typeof crc32!=='function')return new Promise((resolve,reject)=>zip(files,{level:6},(e,bytes)=>e?reject(e):resolve(bytes)));
 return new Promise((resolve,reject)=>{
  const chunks:Uint8Array[]=[];let size=0,done=false,index=0;
  const archive=new Zip((error,chunk,final)=>{
   if(done)return;if(error){done=true;archive.terminate();reject(error);return;}
   chunks.push(chunk);size+=chunk.length;
   if(final){done=true;const result=new Uint8Array(size);let offset=0;for(const part of chunks){result.set(part,offset);offset+=part.length;}resolve(result);}
  });
  const jobs:{entry:ZipInputFile;bytes:Uint8Array}[]=[];
  try{for(const[filename,bytes]of Object.entries(files)){
   const entry:ZipInputFile={filename,compression:8,crc:crc32(bytes),size:bytes.byteLength};archive.add(entry);jobs.push({entry,bytes});
  }archive.end();}catch(error){done=true;archive.terminate();reject(error);return;}
  const next=()=>{if(done||index>=jobs.length)return;const{entry,bytes}=jobs[index++];
   deflateRaw(bytes,{level:6},(error,compressed)=>{if(done)return;entry.ondata!(error as any,compressed,true);next();});
  };
  // Share libuv's bounded pool instead of creating a Worker for every asset.
  for(let i=0;i<Math.min(4,jobs.length);i++)next();
 });
}
type Entry={name:string;data:Uint8Array;size:number;crc:number;compression:number};
// Standard ZIP32 entries can use their central-directory offsets directly.
// ZIP64, split/encrypted/other variants retain fflate's existing decoder.
function nativeEntries(bytes:Uint8Array,names:string[]):Entry[]|null{
 if(typeof crc32!=='function'||new Set(names).size!==names.length)return null;
 try{const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u16=(p:number)=>view.getUint16(p,true),u32=(p:number)=>view.getUint32(p,true);let end=bytes.length-22;
  for(;end>=Math.max(0,bytes.length-65558)&&u32(end)!==0x06054b50;end--);if(end<0||u32(end)!==0x06054b50)return null;
  const count=u16(end+10),offset=u32(end+16);if(count===65535||offset===0xffffffff||u16(end+4)||u16(end+6)||u16(end+8)!==count||count!==names.length)return null;
  let position=offset;const entries:Entry[]=[];
  for(let i=0;i<count;i++){if(u32(position)!==0x02014b50||u16(position+8)&1||u16(position+34))return null;
   const compression=u16(position+10),size=u32(position+24),compressed=u32(position+20),local=u32(position+42);if(![0,8].includes(compression)||[size,compressed,local].includes(0xffffffff)||u32(local)!==0x04034b50)return null;
   const start=local+30+u16(local+26)+u16(local+28);if(start+compressed>offset)return null;
   entries.push({name:names[i],data:bytes.subarray(start,start+compressed),size,crc:u32(position+16),compression});position+=46+u16(position+28)+u16(position+30)+u16(position+32);
  }if(position>end)return null;return entries;
 }catch{return null;}
}
export function decodeBackup(bytes:Uint8Array):Promise<Record<string,Uint8Array>>{
 return new Promise((resolve,reject)=>{
  // Let fflate validate the central directory, names and supported archive
  // structure without running its synchronous small-file decompression path.
  const names:string[]=[];
  unzip(bytes,{filter:file=>{if(!safeArchivePath(file.name))throw Error('안전하지 않은 ZIP 경로입니다.');names.push(file.name);return false;}},error=>{
   if(error){reject(error);return;}
   const entries=nativeEntries(bytes,names);if(!entries){unzip(bytes,{filter:file=>{if(!safeArchivePath(file.name))throw Error('안전하지 않은 ZIP 경로입니다.');return true;}},(error,files)=>error?reject(error):resolve(files));return;}
   const files:Record<string,Uint8Array>=Object.create(null);let index=0,remaining=entries.length,done=false;
   if(!remaining){resolve(files);return;}
   const next=()=>{if(done||index>=entries.length)return;const entry=entries[index++];
    const finish=(error:Error|null,data:Uint8Array)=>{if(done)return;if(error||data.length!==entry.size||crc32(data)!==entry.crc){done=true;reject(error??Error('백업 ZIP의 CRC 검증에 실패했습니다.'));return;}files[entry.name]=data;if(!--remaining){done=true;resolve(files);}else next();};
    if(entry.compression===0){queueMicrotask(()=>finish(null,entry.data.slice()));return;}
    inflateRaw(entry.data,{maxOutputLength:Math.max(1,entry.size)},finish);
   };for(let i=0;i<Math.min(4,entries.length);i++)next();
  });
 });
}
