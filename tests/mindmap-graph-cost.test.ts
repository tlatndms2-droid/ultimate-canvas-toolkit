import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import vm from 'node:vm';
async function implementation(name:string){const code=(await build({entryPoints:['vendor/mindmap/src/'+name+'.ts'],bundle:true,format:'cjs',platform:'node',write:false,external:['obsidian']})).outputFiles[0].text,module={exports:{} as any};vm.runInNewContext(code,{module,exports:module.exports,structuredClone,console,require:()=>({})});return module.exports;}
const card=(id:string,x=0,y=0)=>({id,type:'text',x,y,width:100,height:100,text:id,style:{color:'red'}});
test('multi-pass Mindmap arrangement detaches nested metadata, preserves edges and unrelated cards',async()=>{
 const{arrangeSelection}=await implementation('arrange'),data={nodes:[card('a'),card('b',250,20),card('c',230,180),card('unrelated',3000,3000)],edges:[{id:'ab',fromNode:'a',toNode:'b',fromSide:'right',toSide:'left'},{id:'ac',fromNode:'a',toNode:'c',fromSide:'right',toSide:'left'}],canvasPortal:{portals:{hidden:{graph:{nodes:[card('hidden')]}}}}},before=structuredClone(data),after=arrangeSelection(data,['a'],40,3,3);
 assert.deepEqual(data,before);assert.deepEqual(JSON.parse(JSON.stringify(after.edges)),data.edges);assert.deepEqual(JSON.parse(JSON.stringify(after.nodes.find((n:any)=>n.id==='unrelated'))),data.nodes[3]);after.nodes[1].style.color='blue';after.canvasPortal.portals.hidden.graph.nodes[0].text='changed';assert.deepEqual(data,before);assert.equal(after.nodes[1].y+after.nodes[1].height+40,after.nodes[2].y);
});
test('nearest-card navigation keeps direct alignment priority and deterministic ties',async()=>{
 const{nearestCard}=await implementation('navigation'),data={nodes:[card('a'),card('direct',400,0),card('diagonal',120,110),card('up',0,-200)],edges:[]};assert.equal(nearestCard(data,'a','right')?.id,'direct');assert.equal(nearestCard(data,'a','up')?.id,'up');assert.equal(nearestCard(data,'a','left'),null);
 data.nodes=[card('a'),card('z',200,0),card('b',200,0)];assert.equal(nearestCard(data,'a','right')?.id,'b');
});
test('additive creation still refuses altered or missing existing edges and preserves first-match guards',async()=>{
 const{applyCreation}=await implementation('creation-transaction'),before={nodes:[card('a'),card('b',200)],edges:[{id:'ab',fromNode:'a',toNode:'b'}]},after={nodes:[...before.nodes,card('c',400)],edges:[...before.edges,{id:'bc',fromNode:'b',toNode:'c'}]};let pushed=0,actual:any;
 const canvas={importData:(added:any)=>{actual={nodes:[...before.nodes,...added.nodes],edges:[...before.edges,...added.edges]};},getData:()=>actual,pushHistory:()=>{pushed++;}};applyCreation(canvas,before,after);assert.equal(pushed,1);assert.equal(actual.nodes.length,3);assert.equal(actual.nodes[0],before.nodes[0]);
 canvas.importData=()=>{actual={nodes:after.nodes,edges:[{id:'ab',fromNode:'a',toNode:'wrong'},...after.edges]};};assert.throws(()=>applyCreation(canvas,before,after),/Existing connection changed/);assert.equal(pushed,1);
});
