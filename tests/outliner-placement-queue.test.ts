import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import vm from 'node:vm';
import path from 'node:path';
async function implementation(){const code=(await build({entryPoints:['vendor/outliner/src/main.ts'],bundle:true,platform:'node',format:'cjs',external:['obsidian'],write:false})).outputFiles[0].text;const module={exports:{} as any},native=createRequire(path.resolve('tests/outliner-placement-queue.test.ts')),shim=new Proxy({normalizePath:(v:string)=>v} as any,{get:(o,k)=>o[k]??class{}});vm.runInNewContext(code,{module,exports:module.exports,require:(id:string)=>id==='obsidian'?shim:native(id),console:{error(){}},crypto:globalThis.crypto,Buffer});return module.exports.default;}
test('Outliner waits for placement durability and coalesces changes without acknowledging an unwritten save',async()=>{
 const Outliner=await implementation(),o=Object.create(Outliner.prototype),writes:any[]=[];let release!:()=>void;const gate=new Promise<void>(r=>release=r);Object.assign(o,{corrupt:false,saveQueue:Promise.resolve(),scheduledSave:null,store:{value:'before'},uctBeforeSave:()=>gate,settingsFile:{save:async(data:any)=>writes.push(data.value)}});
 let settled=false;const first=o.save();first.then(()=>settled=true);assert.equal(o.save(),first);await new Promise(r=>setImmediate(r));assert.equal(settled,false);assert.deepEqual(writes,[]);o.store.value='latest';release();await first;assert.deepEqual(writes,['latest']);assert.equal(settled,true);assert.equal(o.scheduledSave,null);
});
test('a rejected scheduling gate rejects the real save and later saves still recover',async()=>{
 const Outliner=await implementation(),o=Object.create(Outliner.prototype);let writes=0;Object.assign(o,{corrupt:false,saveQueue:Promise.resolve(),scheduledSave:null,store:{},uctBeforeSave:async()=>{throw Error('gate failed');},settingsFile:{save:async()=>writes++}});await assert.rejects(o.save(),/gate failed/);assert.equal(writes,0);assert.equal(o.scheduledSave,null);o.uctBeforeSave=async()=>{};await o.save();assert.equal(writes,1);
});
