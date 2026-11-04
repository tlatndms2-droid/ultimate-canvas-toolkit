import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
async function implementation(){
 const code=(await build({stdin:{contents:"export {SnapshotBytes} from './snapshot-bytes';export {ownSnapshot} from './snapshot';export {emptyStore,emptyCanvas,sync} from './model';",resolveDir:process.cwd()+'/vendor/outliner/src',loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false})).outputFiles[0].text;
 const module={exports:{} as any};vm.runInNewContext(code,{module,exports:module.exports,Buffer,crypto:globalThis.crypto});return module.exports;
}
const doc=(text='한글 😀 " \\ \n'.repeat(1000))=>({nodes:[{id:'n',type:'text',x:1,y:2,width:100,height:100,text}],edges:[],canvasPortal:{hidden:{keep:true}}});
test('cached frozen snapshots retain exact JSON bytes while mutable list metadata and new graphs change',async()=>{
 const m=await implementation(),store=m.emptyStore(),state=m.emptyCanvas(),encoder=new m.SnapshotBytes();store.canvases['한글.canvas']=state;m.sync(state,doc(),1);
 const raw=()=>Buffer.from(JSON.stringify(store),'utf8');assert(encoder.encode(store).equals(raw()));assert(encoder.encode(store).equals(raw()));assert(encoder.stats().charged>0);
 assert(Object.isFrozen(state.snapshot.nodes[0]));const old=state.snapshot;assert.throws(()=>{old.nodes[0].text='stale mutation';},TypeError);
 state.meta.n.name='새 이름';store.settings.sort='name';assert(encoder.encode(store).equals(raw()));m.sync(state,doc('변경'),2);assert.notEqual(state.snapshot,old);assert(encoder.encode(store).equals(raw()));
});
test('unowned mutable snapshots are re-encoded instead of trusted by reference',async()=>{
 const m=await implementation(),store=m.emptyStore(),state=m.emptyCanvas(),encoder=new m.SnapshotBytes();store.canvases.a=state;state.snapshot=doc();const before=encoder.encode(store);state.snapshot.nodes[0].text='changed';const after=encoder.encode(store);assert(!after.equals(before));assert(after.equals(Buffer.from(JSON.stringify(store))));assert(encoder.stats().charged<=32*1024*1024);
});
test('custom JSON methods and accessors use original semantics exactly once',async()=>{
 const m=await implementation(),store=m.emptyStore(),state=m.emptyCanvas(),encoder=new m.SnapshotBytes();store.canvases.a=state;let calls=0;state.snapshot={toJSON(key:string){calls++;return {key};}};const actual=encoder.encode(store);assert.equal(calls,1);assert(actual.equals(Buffer.from(JSON.stringify(store))));
 calls=0;delete state.snapshot.toJSON;Object.defineProperty(state.snapshot,'nodes',{enumerable:true,get(){calls++;return [];}});encoder.encode(store);assert.equal(calls,1);
});
test('snapshot cache is bounded and preserves bytes after its budget is exhausted',async()=>{
 const m=await implementation(),store=m.emptyStore(),state=m.emptyCanvas(),encoder=new m.SnapshotBytes(8000);store.canvases.a=state;
 for(let i=0;i<4;i++){m.sync(state,doc(String(i).repeat(6000)),i);assert(encoder.encode(store).equals(Buffer.from(JSON.stringify(store))));assert(encoder.stats().charged<=8000);}assert(encoder.stats().charged>0);
});
test('literal marker collisions, property names and escaped strings remain literal JSON',async()=>{
 const m=await implementation(),prefix='\u0000uct-snapshot:fixed:',encoder=new m.SnapshotBytes(8000,()=> 'fixed');
 const data:any={version:1,settings:{},canvases:{}};
 data[prefix+'0']=prefix+'0';data['quote"\\'+prefix+'1']=['x"'+prefix+'0',new String(prefix+'1'),undefined,NaN,Infinity,-0];
 data.canvases.a={snapshot:m.ownSnapshot(doc('x'.repeat(6000))),other:prefix+'2'};
 assert(encoder.encode(data).equals(Buffer.from(JSON.stringify(data))));
 assert(encoder.encode(data).equals(Buffer.from(JSON.stringify(data))));
 const cycle:any={};cycle.self=cycle;assert.throws(()=>encoder.encode(cycle),/circular/i);
});
test('large immutable strings reuse exact bytes and changed strings never reuse stale content',async()=>{
 const m=await implementation(),encoder=new m.SnapshotBytes(64000,()=> 'fixed'),store:any={version:1,settings:{},canvases:{},text:'한글😀\\"'.repeat(1600)};
 assert(encoder.encode(store).equals(Buffer.from(JSON.stringify(store))));const charged=encoder.stats().charged;assert(charged>0&&charged<=64000);
 assert(encoder.encode(store).equals(Buffer.from(JSON.stringify(store))));assert.equal(encoder.stats().charged,charged);
 store.text='\u0000uct-snapshot:fixed:0'+'z'.repeat(5000);assert(encoder.encode(store).equals(Buffer.from(JSON.stringify(store))));assert(encoder.stats().charged<=64000);
});

test('a full cache admits current revisions by evicting cold entries without changing JSON',async()=>{
 const m=await implementation(),encoder=new m.SnapshotBytes(18000),a=m.ownSnapshot(doc('a'.repeat(6000))),b=m.ownSnapshot(doc('b'.repeat(6000))),c=m.ownSnapshot(doc('c'.repeat(6000)));
 for(const value of [a,b,a,c])assert(encoder.encode({snapshot:value}).equals(Buffer.from(JSON.stringify({snapshot:value}))));
 assert(encoder.cache.has(a));assert(!encoder.cache.has(b));assert(encoder.cache.has(c));assert(encoder.stats().charged<=18000);
 assert(encoder.encode({snapshot:b}).equals(Buffer.from(JSON.stringify({snapshot:b}))));assert(encoder.cache.has(b));
});
test('string and graph eviction share one budget and oversized entries do not flush useful cache',async()=>{
 const m=await implementation(),encoder=new m.SnapshotBytes(18000),text='한'.repeat(4200),small=m.ownSnapshot(doc('x'.repeat(6000)));
 encoder.encode({snapshot:small});const before=encoder.stats().charged;
 assert(encoder.encode({text}).equals(Buffer.from(JSON.stringify({text}))));assert.equal(encoder.stats().charged,before);assert(encoder.cache.has(small));
 const ascii='a'.repeat(4200);encoder.encode({text:ascii});assert(!encoder.cache.has(small));assert(encoder.strings.has(ascii));assert(encoder.stats().charged<=18000);
 encoder.encode({snapshot:small});assert(!encoder.strings.has(ascii));assert(encoder.cache.has(small));
});
