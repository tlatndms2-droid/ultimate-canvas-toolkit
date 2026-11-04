import {test} from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import vm from 'node:vm';import {unzipSync,zipSync} from 'fflate';import * as zlib from 'node:zlib';

async function codec(zlibOverride:any=zlib){const result=await build({entryPoints:['src/backup-codec.ts'],bundle:true,platform:'node',format:'cjs',write:false}),module={exports:{} as any};
 vm.runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,console,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,setTimeout,clearTimeout,queueMicrotask,require:(id:string)=>id==='node:zlib'?zlibOverride:process.getBuiltinModule(id.replace(/^node:/,''))});return module.exports;
}
test('native ZIP keeps names, content, Unicode, compression, empty files and caller buffers compatible',async()=>{
 const c=await codec(),files={'notes/한글.md':new TextEncoder().encode('# 문서\n**내용**'),'image.bin':new Uint8Array(500000).fill(41),'empty':new Uint8Array()},before=structuredClone(files),packed=await c.encodeBackup(files),restored=unzipSync(packed);
 for(const[path,bytes]of Object.entries(before)){assert.deepEqual(Array.from(restored[path]),Array.from(bytes));assert.deepEqual(files[path as keyof typeof files],bytes);}
 assert(packed.length<5000);assert.deepEqual(Object.keys(unzipSync(await c.encodeBackup({}))),[]);
});
test('native compression bounds concurrent jobs and rejects a compression failure without continuing the queue',async()=>{
 let active=0,peak=0,calls=0;const c=await codec({...zlib,deflateRaw:(bytes:Uint8Array,options:any,callback:any)=>{calls++;active++;peak=Math.max(peak,active);setTimeout(()=>{active--;callback(Error('injected native compression failure'));},0);}});
 await assert.rejects(c.encodeBackup(Object.fromEntries(Array.from({length:12},(_,i)=>['file'+i,new Uint8Array([i])]))),/injected native/);await new Promise(r=>setTimeout(r,10));assert.equal(peak,4);assert.equal(calls,4);assert.equal(active,0);
});
test('existing safe-path decoding rejects traversal and accepts old archives; older runtimes retain small ZIP fallback',async()=>{
 const c=await codec({...zlib,crc32:undefined}),file=new Uint8Array([1,2,3]),packed=await c.encodeBackup({'old.bin':file});assert.deepEqual(Array.from(unzipSync(packed)['old.bin']),[1,2,3]);
 assert.deepEqual(Array.from((await c.decodeBackup(zipSync({'old.bin':file})))['old.bin']),[1,2,3]);await assert.rejects(c.decodeBackup(zipSync({'../escape.md':file})),/안전하지 않은/);
});
test('native decoding accepts both existing and streaming ZIPs, preserves the caller and rejects truncation',async()=>{
 const c=await codec(),files={'한글.md':new TextEncoder().encode('# 문서'),'large.bin':new Uint8Array(500000).fill(41),'empty':new Uint8Array()};
 for(const packed of [zipSync(files),await c.encodeBackup(files)]){const before=packed.slice(),restored=await c.decodeBackup(packed);assert.deepEqual(packed,before);for(const[path,bytes]of Object.entries(files))assert.deepEqual(Array.from(restored[path]),Array.from(bytes));}
 await assert.rejects(c.decodeBackup(zipSync(files).slice(0,30)));await assert.rejects(c.decodeBackup(new Uint8Array([1,2,3])));
});
test('native decoding verifies archive CRC before any restored files can be used',async()=>{
 const c=await codec(),packed=await c.encodeBackup({'file.md':new TextEncoder().encode('preserve integrity')}),view=new DataView(packed.buffer,packed.byteOffset,packed.byteLength);let central=-1;
 for(let i=0;i<packed.length-46;i++)if(view.getUint32(i,true)===0x02014b50){central=i;break;}assert(central>=0);packed[central+16]^=1;await assert.rejects(c.decodeBackup(packed),/CRC/);
});
