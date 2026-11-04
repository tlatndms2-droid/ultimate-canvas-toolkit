import {test} from 'node:test';import assert from 'node:assert/strict';
import {CanvasRuntime} from '../src/canvas-runtime.ts';
const view=(name:string)=>({getViewType:()=> 'canvas',file:{path:name},canvas:{},containerEl:{isConnected:true,contains:(t:any)=>t===name}});
test('context lookup does not walk visible leaves for every item and follows activation, reuse and detach',()=>{
 const a=view('a'),b=view('b');let leaves=[{view:a},{view:b}],walks=0;const workspace={activeLeaf:leaves[0],getLeavesOfType(){walks++;return leaves;}},sessions=new Map<any,any>([[a,{v:a,current:'p'}]]);const r=new CanvasRuntime(workspace,()=>sessions,()=>null);r.sync();
 for(let i=0;i<500;i++){assert.equal(r.current(),a);assert.equal(r.key(), 'a#uct-portal:p');assert.equal(r.target('b' as any),b);}assert.equal(walks,1);
 workspace.activeLeaf=leaves[1];r.activate(workspace.activeLeaf);assert.equal(r.current(),b);b.file.path='renamed';assert.equal(r.key(),'renamed');
 workspace.activeLeaf={view:{getViewType:()=> 'markdown'} as any};assert.equal(r.active(),null);assert.equal(r.current(),b);
 b.containerEl.isConnected=false;leaves=leaves.slice(0,1);r.sync();assert.equal(r.current(),a);sessions.get(a).current=null;assert.equal(r.key(),'a');r.dispose();r.sync();r.activate({view:a});assert.equal(r.current(),undefined);assert.equal(r.session(a),undefined);assert.deepEqual(r.all(),[]);
});
test('reads are shared only inside a synchronous render batch, invalidated for edits, spaces and reused Canvas',()=>{
 const v=view('a'),session={v,current:null as string|null},r=new CanvasRuntime({activeLeaf:{view:v},getLeavesOfType:()=>[{view:v}]},()=>new Map([[v,session]]),()=>null),owner={},other={};let n=0;const read=()=>r.read(owner,v,()=>++n);
 r.sync();r.batch(()=>{assert.equal(read(),1);r.batch(()=>assert.equal(read(),1));assert.equal(r.read(other,v,()=>99),99);r.changed(v,'metadata',['x']);assert.equal(read(),2);session.current='portal';assert.equal(read(),3);v.canvas={};assert.equal(read(),4);});assert.equal(read(),5);assert.equal(read(),6);
 assert.throws(()=>r.batch(()=>{read();throw Error('render failed');}));assert.equal(read(),8,'failed renders cannot retain an old document');r.dispose();
});
test('changes coalesce per view, retain node IDs and do not leak between spaces or after disposal',async()=>{
 const a=view('a'),b=view('b'),r=new CanvasRuntime({},()=>undefined,()=>null),seen:any[]=[];r.subscribe(c=>seen.push(c));
 r.changed(a,'metadata',['one']);r.changed(a,'graph',['two']);r.changed(a,'metadata',['one']);r.changed(b,'space');assert.equal(seen.length,0);await Promise.resolve();assert.equal(seen.length,2);assert.deepEqual([...seen[0].kinds],['metadata','graph']);assert.deepEqual([...seen[0].ids],['one','two']);assert.equal(seen[1].view,b);
 r.changed(a,'space');r.dispose();await Promise.resolve();assert.equal(seen.length,2);
});
