import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
async function model(){
 const code=(await build({entryPoints:['vendor/outliner/src/model.ts'],bundle:true,format:'cjs',platform:'node',write:false})).outputFiles[0].text;
 const module={exports:{} as any};vm.runInNewContext(code,{module,exports:module.exports,crypto:globalThis.crypto});return module.exports;
}
const json=(value:unknown)=>JSON.parse(JSON.stringify(value));
const doc=()=>({nodes:[{id:'a',type:'text',x:1,y:2,width:100,height:100,text:'원래'}],edges:[],canvasPortal:{portals:{nested:{graph:{nodes:[{id:'inside',text:'숨은 내용'}],edges:[]}}}}});
test('Outliner history detaches mutable list state while retaining only the existing detached Canvas graph',async()=>{
 const m=await model(),s=m.emptyCanvas(),source=doc();m.sync(s,source,1);s.registered=['a'];s.collections=[{id:'c',name:'원래',parent:null,refs:[{kind:'node',id:'a'}]}];
 const history=m.copyOutlinerHistory(s);assert.equal(history.snapshot,s.snapshot);assert.deepEqual(json(history),json(s));
 s.collections[0].name='변경';s.registered.push('b');s.meta.a.name='이름';assert.equal(history.collections[0].name,'원래');assert.deepEqual(json(history.registered),['a']);assert.equal(history.meta.a.name,undefined);
 source.nodes[0].text='Canvas 변경';m.sync(s,source,2);assert.notEqual(history.snapshot,s.snapshot);assert.equal(history.snapshot.nodes[0].text,'원래');assert.equal(s.snapshot.nodes[0].text,'Canvas 변경');
 // Match the real Undo contract: restore list state and keep the latest graph.
 const current=s.snapshot;Object.assign(s,history);s.snapshot=current;assert.equal(s.snapshot.nodes[0].text,'Canvas 변경');assert.equal(s.collections[0].name,'원래');
});
test('unchanged Outliner sync reuses its snapshot; geometry, edges and hidden content still replace it',async()=>{
 const m=await model(),s=m.emptyCanvas(),source=doc();assert.equal(m.sync(s,source,1),true);const first=s.snapshot;assert.equal(m.sync(s,source,2),false);assert.equal(s.snapshot,first);
 source.nodes[0].x=20;assert.equal(m.sync(s,source,3),true);assert.equal(first.nodes[0].x,1);const second=s.snapshot;
 source.canvasPortal.portals.nested.graph.nodes[0].text='내부 수정';assert.equal(m.sync(s,source,4),true);assert.equal(second.canvasPortal.portals.nested.graph.nodes[0].text,'숨은 내용');
 source.edges.push({id:'e'} as never);assert.equal(m.sync(s,source,5),true);assert.deepEqual(json(s.snapshot.edges),[{id:'e'}]);source.nodes[0].text='외부 수정';assert.notEqual(s.snapshot.nodes[0].text,source.nodes[0].text);
});

test('refresh revision bytes and direct sync preserve identical content, metadata and change detection',async()=>{
 const m=await model(),a=m.emptyCanvas(),b=m.emptyCanvas(),input=doc();
 for(let i=0;i<3;i++){if(i===1)input.nodes[0].x=9;if(i===2)input.nodes[0].text='새 내용';const raw=JSON.stringify(input),before=JSON.stringify(input);assert.equal(m.sync(a,input,i),m.sync(b,input,i,raw));assert.deepEqual(json(a),json(b));assert.equal(JSON.stringify(input),before);}
 assert.equal(m.sync(a,input,9),false);assert.equal(m.sync(b,input,9,JSON.stringify(input)),false);assert.deepEqual(json(a),json(b));
});
