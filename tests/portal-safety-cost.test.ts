import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {promises as fs} from 'node:fs';import path from 'node:path';import {tmpdir} from 'node:os';
const{SafetyStore,protectedWrite,hash,install}=createRequire(path.resolve('tests/portal-safety-cost.test.ts'))('../vendor/portal/src/safety.cjs');
const graph=(text:string)=>JSON.stringify({nodes:[{id:'a',type:'text',text,x:0,y:0,width:200,height:100}],edges:[],canvasPortal:{version:1,portals:{}}});
async function fixture(run:(f:any)=>Promise<void>){const dir=await fs.mkdtemp(path.join(tmpdir(),'uct-portal-safety-')),full=path.join(dir,'fixture.canvas'),before=graph('original'),store=new SafetyStore(path.join(dir,'recovery'));await fs.writeFile(full,before);await store.preserve('fixture.canvas',before);
 try{await run({dir,full,before,store});}finally{if(path.dirname(dir)!==path.resolve(tmpdir())||!path.basename(dir).startsWith('uct-portal-safety-'))throw Error('Unsafe test cleanup');await fs.rm(dir,{recursive:true,force:true});}}
test('an unchanged protected Canvas keeps its mtime and bytes while retaining a verified recovery copy',()=>fixture(async({full,before,store,dir})=>{
 const mtime=(await fs.stat(full)).mtimeMs;assert.equal(await protectedWrite(full,'fixture.canvas',before,before,store),true);assert.equal(await fs.readFile(full,'utf8'),before);assert.equal((await fs.stat(full)).mtimeMs,mtime);assert.equal(await fs.readFile(path.join(dir,'recovery',hash('fixture.canvas'),hash(before)+'.canvas'),'utf8'),before);
}));
test('unchanged-write optimization still refuses a concurrent external edit without overwriting it',()=>fixture(async({full,before,store})=>{
 const external=graph('external'),preserve=store.preserve.bind(store);store.preserve=async(...args:any[])=>{await preserve(...args);await fs.writeFile(full,external);};await assert.rejects(protectedWrite(full,'fixture.canvas',before,before,store),/동시에 변경/);assert.equal(await fs.readFile(full,'utf8'),external);
}));
test('a damaged recovery copy blocks an unchanged protected write and leaves the Canvas intact',()=>fixture(async({full,before,store,dir})=>{
 await fs.writeFile(path.join(dir,'recovery',hash('fixture.canvas'),hash(before)+'.canvas'),'damaged');await assert.rejects(protectedWrite(full,'fixture.canvas',before,before,store),/복구 사본 검증 실패/);assert.equal(await fs.readFile(full,'utf8'),before);
}));
test('changed protected writes remain atomic and reject removal of the portal registry',()=>fixture(async({full,before,store})=>{
 const next=graph('changed');assert.equal(await protectedWrite(full,'fixture.canvas',before,next,store),true);assert.equal(await fs.readFile(full,'utf8'),next);await assert.rejects(protectedWrite(full,'fixture.canvas',next,JSON.stringify({nodes:[],edges:[]}),store),/포탈 데이터가 사라진/);assert.equal(await fs.readFile(full,'utf8'),next);
}));
test('adapter verifies each distinct recovery revision once within a write, never reuses receipts across writes',()=>fixture(async({dir,full,before})=>{
 const errors:any[]=[],adapter:any={fsPromises:fs,getFullPath:()=>full,queue:(action:any)=>action(),write:async()=>{throw Error('unprotected fallback');},process:async()=>{throw Error('unprotected fallback');},applyWriteOptions:async()=>{},reconcileInternalFile:async()=>{}};
 const safety=install(adapter,path.join(dir,'adapter-recovery'),(e:any)=>errors.push(e)),original=safety.store.preserve.bind(safety.store),calls:string[]=[];safety.store.preserve=async(file:string,text:string)=>{calls.push(text);return original(file,text);};
 try{await adapter.write('fixture.canvas',before);assert.deepEqual(calls,[before]);calls.length=0;await adapter.write('fixture.canvas',before);assert.deepEqual(calls,[before]);calls.length=0;
 const next=graph('new revision');await adapter.write('fixture.canvas',next);assert.deepEqual(calls,[next,before]);assert.equal(await fs.readFile(full,'utf8'),next);calls.length=0;
 const third=graph('process revision');assert.equal(await adapter.process('fixture.canvas',()=>third),third);assert.deepEqual(calls,[next,third]);assert.equal(await fs.readFile(full,'utf8'),third);assert.deepEqual(errors,[]);
 }finally{safety.dispose();}
}));
test('adapter never skips verification of a recovery copy damaged between separate writes',()=>fixture(async({dir,full,before})=>{
 const adapter:any={fsPromises:fs,getFullPath:()=>full,queue:(action:any)=>action(),write:async()=>{},process:async()=>{},applyWriteOptions:async()=>{},reconcileInternalFile:async()=>{}},base=path.join(dir,'adapter-recovery'),safety=install(adapter,base,()=>{});
 try{await adapter.write('fixture.canvas',before);await fs.writeFile(path.join(base,hash('fixture.canvas'),hash(before)+'.canvas'),'damaged');await assert.rejects(adapter.write('fixture.canvas',before),/복구 사본 검증 실패/);assert.equal(await fs.readFile(full,'utf8'),before);}finally{safety.dispose();}
}));
test('recovery and sibling preparation overlap but replacement waits for verified recovery',()=>fixture(async({full,before,store})=>{
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),opened=new Promise<void>(r=>entered=r);let renamed=false;
 const io={...fs,open:async(...args:any[])=>{entered();return (fs.open as any)(...args)},rename:async(...args:any[])=>{renamed=true;return (fs.rename as any)(...args)}};
 const guarded={preserve:async(file:string,text:string)=>{await gate;await store.preserve(file,text)}};
 const task=protectedWrite(full,'fixture.canvas',before,graph('overlapped'),guarded,io);
 await opened;assert.equal(renamed,false);assert.equal(await fs.readFile(full,'utf8'),before);release();await task;assert.equal(renamed,true);
}));
test('failed recovery waits for sibling closure then removes it without replacing the original',()=>fixture(async({dir,full,before})=>{
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(r=>release=r),opened=new Promise<void>(r=>entered=r);let closed=false;
 const io={...fs,open:async(...args:any[])=>{const h=await (fs.open as any)(...args);entered();return {writeFile:async(...a:any[])=>{await gate;return h.writeFile(...a)},sync:()=>h.sync(),close:async()=>{await h.close();closed=true}}}};
 const task=protectedWrite(full,'fixture.canvas',before,graph('failure'),{preserve:async()=>{throw Error('recovery failed')}},io);
 let finished=false;const checked=assert.rejects(task,/recovery failed/).then(()=>finished=true);await opened;await new Promise(r=>setTimeout(r,10));assert.equal(finished,false);release();await checked;assert.equal(closed,true);assert.equal(await fs.readFile(full,'utf8'),before);assert.equal((await fs.readdir(dir)).some(n=>n.includes('.cp-save-')),false);
}));
test('adapter keeps a verified incoming revision when destination reading fails',()=>fixture(async({dir,full,before})=>{
 const base=path.join(dir,'read-failure-recovery'),next=graph('recoverable incoming');
 const adapter:any={fsPromises:{...fs,readFile:async()=>{throw Object.assign(Error('read denied'),{code:'EACCES'})}},getFullPath:()=>full,queue:(fn:any)=>fn(),write:async()=>{},process:async()=>{},applyWriteOptions:async()=>{},reconcileInternalFile:async()=>{}};
 const safety=install(adapter,base,()=>{});try{await assert.rejects(adapter.write('fixture.canvas',next),/read denied/);assert.equal(await fs.readFile(path.join(base,hash('fixture.canvas'),hash(next)+'.canvas'),'utf8'),next);assert.equal(await fs.readFile(full,'utf8'),before);assert.equal(safety.store.pending.size,0);}finally{safety.dispose();}
}));
test('adapter propagates incoming recovery failure before destination replacement',()=>fixture(async({dir,full,before})=>{
 const next=graph('broken incoming'),base=path.join(dir,'incoming-failure-recovery'),adapter:any={fsPromises:fs,getFullPath:()=>full,queue:(fn:any)=>fn(),write:async()=>{},process:async()=>{},applyWriteOptions:async()=>{},reconcileInternalFile:async()=>{}};
 const safety=install(adapter,base,()=>{});await safety.store.preserve('fixture.canvas',next);await fs.writeFile(path.join(base,hash('fixture.canvas'),hash(next)+'.canvas'),'damaged');try{await assert.rejects(adapter.write('fixture.canvas',next),/복구 사본 검증 실패/);assert.equal(await fs.readFile(full,'utf8'),before);assert.equal((await fs.readdir(dir)).some(n=>n.includes('.cp-save-')),false);}finally{safety.dispose();}
}));
