import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {queueJsonWrite} from '../src/json-write.ts';

async function fixture(run:(target:string)=>Promise<void>) {
  const dir=await fs.mkdtemp(join(tmpdir(),'uct-json-write-'));
  try { await run(join(dir,'library.json')); }
  finally { await fs.rm(dir,{recursive:true,force:true}); }
}

test('identical library contents do not write, rename, or change modification time',async()=>fixture(async target=>{
  await fs.writeFile(target,'A');
  await fs.utimes(target,new Date(1000000000000),new Date(1000000000000));
  const before=await fs.stat(target);let writes=0,renames=0;
  const io={...fs,writeFile:(async(...args:any[])=>{writes++;return (fs.writeFile as any)(...args);}) as typeof fs.writeFile,
    rename:(async(...args:any[])=>{renames++;return (fs.rename as any)(...args);}) as typeof fs.rename};
  const queues=new Map<string,Promise<void>>();
  await Promise.all([queueJsonWrite(queues,target,target,'A',true,io),queueJsonWrite(queues,target,target,'A',true,io)]);
  assert.equal(writes,0);assert.equal(renames,0);assert.equal((await fs.stat(target)).mtimeMs,before.mtimeMs);
}));

test('external changes are detected rather than trusting the previous saved value',async()=>fixture(async target=>{
  const queues=new Map<string,Promise<void>>();
  await queueJsonWrite(queues,target,target,'A',true);
  await fs.writeFile(target,'external');
  await queueJsonWrite(queues,target,target,'A',true);
  assert.equal(await fs.readFile(target,'utf8'),'A');
}));

test('successful verified rename consumes temp without a redundant mounted-drive delete',async()=>fixture(async target=>{
  let removes=0;
  const io={...fs,rm:(async(...args:any[])=>{removes++;return (fs.rm as any)(...args);}) as typeof fs.rm};
  await queueJsonWrite(new Map(),target,target,'saved',false,io);
  assert.equal(await fs.readFile(target,'utf8'),'saved');
  assert.deepEqual(await fs.readdir(join(target,'..')),['library.json']);
  assert.equal(removes,0);
}));

test('queued A B A writes preserve order even when final value matches the first',async()=>fixture(async target=>{
  const queues=new Map<string,Promise<void>>(),observed:string[]=[];
  const io={...fs,rename:(async(from:any,to:any)=>{
    await fs.rename(from,to);observed.push(await fs.readFile(to,'utf8'));
  }) as typeof fs.rename};
  await Promise.all(['A','B','A'].map(raw=>queueJsonWrite(queues,target,target,raw,true,io)));
  assert.deepEqual(observed,['A','B','A']);assert.equal(await fs.readFile(target,'utf8'),'A');
}));

test('failed atomic rename preserves original and a later retry is actually written',async()=>fixture(async target=>{
  const queues=new Map<string,Promise<void>>();await fs.writeFile(target,'original');
  const io={...fs,rename:(async()=>{throw Object.assign(new Error('injected rename failure'),{code:'EACCES'});}) as typeof fs.rename};
  await assert.rejects(queueJsonWrite(queues,target,target,'new',true,io),/injected rename failure/);
  assert.equal(await fs.readFile(target,'utf8'),'original');
  await queueJsonWrite(queues,target,target,'new',true);
  assert.equal(await fs.readFile(target,'utf8'),'new');
  assert.deepEqual(await fs.readdir(join(target,'..')),['library.json']);
}));

test('comparison read errors are propagated without attempting writes',async()=>fixture(async target=>{
  let writes=0;
  const io={...fs,readFile:(async()=>{throw Object.assign(new Error('read denied'),{code:'EACCES'});}) as typeof fs.readFile,
    writeFile:(async()=>{writes++;}) as typeof fs.writeFile};
  await assert.rejects(queueJsonWrite(new Map(),target,target,'new',true,io),/read denied/);
  assert.equal(writes,0);
}));

test('existing parent saves skip directory IO, and a deleted parent is recreated safely',async()=>fixture(async target=>{
  const nested=join(target,'..','nested','state.json'),queues=new Map<string,Promise<void>>();let creates=0;
  const io={...fs,mkdir:(async(...args:any[])=>{creates++;return (fs.mkdir as any)(...args);}) as typeof fs.mkdir};
  await queueJsonWrite(queues,nested,nested,'first',false,io);assert.equal(creates,1);
  await queueJsonWrite(queues,nested,nested,'second',false,io);assert.equal(creates,1);assert.equal(await fs.readFile(nested,'utf8'),'second');
  await fs.rm(join(nested,'..'),{recursive:true});await queueJsonWrite(queues,nested,nested,'third',false,io);assert.equal(creates,2);assert.equal(await fs.readFile(nested,'utf8'),'third');
}));

test('denied temporary write does not create directories or replace the original',async()=>fixture(async target=>{
  await fs.writeFile(target,'original');let creates=0;
  const io={...fs,writeFile:(async()=>{throw Object.assign(Error('write denied'),{code:'EACCES'});}) as typeof fs.writeFile,mkdir:(async()=>{creates++;}) as typeof fs.mkdir};
  await assert.rejects(queueJsonWrite(new Map(),target,target,'new',false,io),/write denied/);assert.equal(creates,0);assert.equal(await fs.readFile(target,'utf8'),'original');
}));
