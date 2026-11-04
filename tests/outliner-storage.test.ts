import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs,readFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {buildSync} from 'esbuild';

const module={exports:{} as any};
vm.runInNewContext(buildSync({entryPoints:['vendor/outliner/src/storage.ts'],bundle:true,format:'cjs',platform:'node',write:false}).outputFiles[0].text,{module,exports:module.exports,Buffer,crypto:{randomUUID},require:(id:string)=>{if(id==='fs')return {promises:fs};if(id==='path')return path;throw Error(id);}});
const SettingsFile=module.exports.SettingsFile;
const store=(text='원래 내용')=>({version:1,canvases:{'검수.canvas':{snapshot:{nodes:[{id:'한글',text}],edges:[]}}},settings:{sort:'custom'}});
async function fixture(fn:(dir:string)=>Promise<void>){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'uct-storage-'));assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));try{await fn(dir);}finally{await fs.rm(dir,{recursive:true,force:true});}}

test('Outliner binary checks preserve exact Unicode JSON and skip unchanged writes',()=>fixture(async dir=>{
 const initial=store('한글 😀 é'),target=path.join(dir,'data.json');await fs.writeFile(target,JSON.stringify(initial));let writes=0;const encodings:unknown[]=[];
 const io={...fs,readFile:async(...args:any[])=>{encodings.push(args[1]);return (fs.readFile as any)(...args);},writeFile:async(...args:any[])=>{writes++;return (fs.writeFile as any)(...args);}};
 const file=new SettingsFile(dir,io);assert.equal((await file.load()).data.settings.sort,'custom');await file.save(initial);assert.equal(writes,0);
 const changed=store('수정한 내용 😀');await file.save(changed);assert.equal(await fs.readFile(target,'utf8'),JSON.stringify(changed));const n=writes;await file.save(changed);assert.equal(writes,n);assert.ok(encodings.every(v=>v===undefined));
}));
test('Outliner refuses external byte changes even when the JSON value is identical',()=>fixture(async dir=>{
 const data=store(),target=path.join(dir,'data.json');await fs.writeFile(target,JSON.stringify(data));const file=new SettingsFile(dir);await file.load();const external=JSON.stringify(data,null,2);await fs.writeFile(target,external);await assert.rejects(file.save(store('새 내용')),/changed externally/);assert.equal(await fs.readFile(target,'utf8'),external);
}));
test('Outliner verifies temporary bytes before replacing the current file',()=>fixture(async dir=>{
 const target=path.join(dir,'data.json'),raw=JSON.stringify(store());await fs.writeFile(target,raw);
 const io={...fs,readFile:async(file:any,...args:any[])=>String(file).endsWith('.tmp')?Buffer.from('broken'):(fs.readFile as any)(file,...args)};
 const file=new SettingsFile(dir,io);await file.load();await assert.rejects(file.save(store('새 내용')),/temporary write verification/);assert.equal(await fs.readFile(target,'utf8'),raw);assert.deepEqual(await fs.readdir(dir),['data.json']);
}));
test('Outliner detects a concurrent writer immediately before replacement',()=>fixture(async dir=>{
 const target=path.join(dir,'data.json'),external=JSON.stringify(store('외부 수정'));await fs.writeFile(target,JSON.stringify(store()));let injected=false;
 const io={...fs,readFile:async(file:any,...args:any[])=>{const value=await (fs.readFile as any)(file,...args);if(String(file).endsWith('.tmp')&&!injected){injected=true;await fs.writeFile(target,external);}return value;}};
 const file=new SettingsFile(dir,io);await file.load();await assert.rejects(file.save(store('내 수정')),/changed externally during save/);assert.equal(await fs.readFile(target,'utf8'),external);assert.deepEqual(await fs.readdir(dir),['data.json']);
}));
test('Outliner recovery preserves malformed original bytes and restores a valid backup',()=>fixture(async dir=>{
 const malformed=Buffer.from([0xff,0x00,0x7b]),valid=store('복구 😀');await fs.writeFile(path.join(dir,'data.json'),malformed);await fs.writeFile(path.join(dir,'data.backup.json'),JSON.stringify(valid));
 const file=new SettingsFile(dir),loaded=await file.load();assert.equal(loaded.recovered,true);assert.equal(JSON.stringify(loaded.data),JSON.stringify(valid));const corrupt=(await fs.readdir(dir)).find(f=>f.startsWith('data.corrupt-'));assert.ok(corrupt);assert.ok((await fs.readFile(path.join(dir,corrupt))).equals(malformed));assert.equal(await fs.readFile(path.join(dir,'data.json'),'utf8'),JSON.stringify(valid));await file.save(store('복구 후 수정'));
}));
test('Outliner creates its first file and still protects an externally deleted file',()=>fixture(async dir=>{
 const file=new SettingsFile(dir);assert.equal((await file.load()).data,null);await file.save(store());const target=path.join(dir,'data.json');await fs.unlink(target);await assert.rejects(file.save(store('수정')),/changed externally/);await assert.rejects(fs.access(target));
}));
test('Outliner freezes requested contents before asynchronous file access',()=>fixture(async dir=>{
 const target=path.join(dir,'data.json');await fs.writeFile(target,JSON.stringify(store()));let release!:()=>void,gate=false;const waiting=new Promise<void>(r=>release=r);
 const io={...fs,readFile:async(...args:any[])=>{if(gate){gate=false;await waiting;}return (fs.readFile as any)(...args);}};
 const file=new SettingsFile(dir,io);await file.load();const data=store('요청 시점');gate=true;const saving=file.save(data);data.settings.sort='later';release();await saving;assert.equal(JSON.parse(await fs.readFile(target,'utf8')).settings.sort,'custom');
}));
test('Outliner does not advance its verified state after a failed rename',()=>fixture(async dir=>{
 const target=path.join(dir,'data.json'),raw=JSON.stringify(store());await fs.writeFile(target,raw);let fail=true;
 const io={...fs,rename:async(...args:any[])=>{if(fail)throw Error('disk failure');return (fs.rename as any)(...args);}};
 const file=new SettingsFile(dir,io);await file.load();await assert.rejects(file.save(store('새 내용')),/disk failure/);assert.equal(await fs.readFile(target,'utf8'),raw);fail=false;await file.save(store('새 내용'));assert.equal(await fs.readFile(target,'utf8'),JSON.stringify(store('새 내용')));assert.deepEqual(await fs.readdir(dir),['data.json']);
}));
