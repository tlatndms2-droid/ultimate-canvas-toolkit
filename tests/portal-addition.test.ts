import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(path.resolve('tests/portal-addition.test.ts')),M=require('../vendor/portal/src/model.cjs'),{addition}=require('../vendor/portal/src/addition.cjs');
const source=readFileSync('vendor/portal/src/main.cjs','utf8');
const method=source.slice(source.indexOf('  async commitAddition('),source.indexOf('  async commitRoot(')).trim();
const portalRequire=createRequire(path.resolve('vendor/portal/src/main.cjs'));
const commit=new Function('M','require','return async function '+method.slice('async '.length))(M,portalRequire);
const card=(id:string)=>({id,type:'text',text:id,x:0,y:0,width:200,height:100});
function fixture(){
 const before={nodes:[card('old')],edges:[],canvasPortal:{version:1,portals:{}}},after=structuredClone(before);after.nodes.push(card('new'));
 const nodes=new Map(before.nodes.map(n=>[n.id,{id:n.id,data:n,getData(){return this.data;}}])),edges=new Map();let imports:any[]=[],saves=0;
 const c:any={nodes,edges,selection:new Set(),history:{data:[],current:0},requestPushHistory:{cancel(){}},getData(){return {...this.data,nodes:[...nodes.values()].map(n=>n.data),edges:[...edges.values()]};},importData(data:any,clear:boolean){imports.push({data,clear});if(clear){nodes.clear();edges.clear();}for(const n of data.nodes)nodes.set(n.id,{id:n.id,data:n,getData(){return this.data;}});for(const e of data.edges)edges.set(e.id,e);},pushHistory(d:any){this.history.data.push(d);},deselectAll(){this.selection.clear();},select(n:any){this.selection.add(n);},updateHistoryUI(){}};
 c.data=structuredClone(before);const s:any={root:before,current:null,c,v:{async save(){saves++;}},switching:false};
 const p:any={currentData:(s:any)=>M.space(s.root,s.current),rememberHistory(){},decorate(){},queue(){},displayData:(s:any)=>M.space(s.root,s.current),show(s:any,data:any){c.importData(data,true);}};
 return {p,s,c,before,after,imports,saves:()=>saves};
}
test('additive plan refuses changes, removals and duplicate IDs before import',()=>{
 const f=fixture();assert.deepEqual(addition(f.before,f.after).nodes,[card('new')]);
 for(const change of [(x:any)=>x.nodes[0].text='changed',(x:any)=>x.nodes.shift(),(x:any)=>x.nodes.push(card('new'))]){const x=structuredClone(f.after);change(x);assert.throws(()=>addition(f.before,x));}
});
test('actual Portal additive method imports only new nodes and retains existing runtime instance',async()=>{
 const f=fixture(),existing=f.c.nodes.get('old');let applied=false;await commit.call(f.p,f.s,f.after,['new'],true,()=>{applied=true;assert.equal(f.saves(),0);});
 assert.equal(f.c.nodes.get('old'),existing);assert.equal(f.imports.length,1);assert.equal(f.imports[0].clear,false);assert.deepEqual(f.imports[0].data.nodes.map((n:any)=>n.id),['new']);assert.equal(f.saves(),1);assert(applied);assert.equal(f.s.switching,false);
});
test('partial native addition rolls back graph and history without saving',async()=>{
 const f=fixture(),original=f.c.importData;f.c.importData=(data:any,clear:boolean)=>{if(!clear)return;original(data,clear);};
 await assert.rejects(commit.call(f.p,f.s,f.after,['new'],true),/incomplete/);assert.equal(f.s.root,f.before);assert.deepEqual([...f.c.nodes.keys()],['old']);assert.equal(f.c.history.data.length,0);assert.equal(f.saves(),0);
});
test('save failure retains added graph for journal recovery rather than claiming no placement',async()=>{
 const f=fixture();f.s.v.save=async()=>{throw Error('write failed');};await assert.rejects(commit.call(f.p,f.s,f.after,['new'],true),/write failed/);assert(f.c.nodes.has('new'));assert.equal(f.s.root,f.after);assert.equal(f.s.switching,false);
});
