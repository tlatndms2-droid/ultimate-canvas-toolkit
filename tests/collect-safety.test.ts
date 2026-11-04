import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the current product function, not a reimplementation of its sequence.
function loadCollect() {
  let sequence=0;
  const code=ts.transpileModule(readFileSync(resolve('src/snapshot.ts'),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const context:any={exports:{},structuredClone,Date,Map,Set,console,require:(id:string)=>{
    if(id==='obsidian')return {TFile:class{},Notice:class{}};
    if(id==='./library')return {uid:()=>`snapshot-${++sequence}`};
    if(id==='./item-kind')return {repairPortalPresentation:()=>{}};
    if(id.includes('model.cjs'))return {};
    if(id.includes('group-serializer'))return {};
    throw Error(`Unexpected fixture import: ${id}`);
  }};
  vm.runInNewContext(code,context,{filename:'snapshot-product-under-test.js'});
  return context.exports.collectSelection as (root:any,cut:boolean)=>Promise<void>;
}

function fixture() {
  const node=(id:string,text:string)=>({id,type:'text',text,x:0,y:0,width:100,height:100});
  let graph:any={nodes:[node('selected','captured'),node('remaining','original')],edges:[]};
  let librarySaves=0,canvasSaves=0;
  const f:{onLibrarySave?:()=>Promise<void>|void;onCanvasSave?:(count:number)=>Promise<void>|void;onSetData?:()=>Promise<void>|void}={};
  const c:any={readonly:false,selection:new Set([{id:'selected',getData:()=>node('selected','captured')}]),
    getData:()=>structuredClone(graph),setData:async(value:any)=>{graph=structuredClone(value);await f.onSetData?.();},requestSave:()=>{}};
  const view:any={canvas:c,file:{path:'original.canvas'},save:async()=>{canvasSaves++;await f.onCanvasSave?.(canvasSaves);}};
  const session:any={current:null,path:'original.canvas',v:view,c,root:structuredClone(graph),busy:false};
  const root:any={canvasView:()=>view,session:()=>session,spaceKey:()=>session.current?`${view.file.path}#uct-portal:${session.current}`:view.file.path,
    portal:{discover(){},capture(){session.root=structuredClone(graph);}},
    palette:{canvas:{expandGroupNodes:()=>[],groupItem:(nodes:any[],edges:any[])=>({id:'temporary',type:'group',displayTitle:'cut',group:{nodes:structuredClone(nodes),edges:structuredClone(edges)}})}},
    library:{items:{}},saveLibrary:async()=>{librarySaves++;if(librarySaves===1)await f.onLibrarySave?.();},
    app:{vault:{getAbstractFileByPath:()=>null}}};
  return {f,root,view,session,node,get graph(){return graph;},get canvasSaves(){return canvasSaves;},get librarySaves(){return librarySaves;},setGraph:(value:any)=>{graph=structuredClone(value);}};
}

test('ordinary cut keeps unselected content and saves one Mini capture',async()=>{
  const f=fixture();await loadCollect()(f.root,true);
  assert.equal(f.graph.nodes.some((n:any)=>n.id==='selected'),false);
  assert.equal(f.graph.nodes.find((n:any)=>n.id==='remaining').text,'original');
  assert.equal(Object.keys(f.root.library.items).length,1);
});

test('cut must preserve edits made while the Mini snapshot is being saved',async()=>{
  const f=fixture();f.f.onLibrarySave=async()=>{
    await Promise.resolve();const current=structuredClone(f.graph);
    current.nodes.find((n:any)=>n.id==='remaining').text='user edited while waiting';
    current.nodes.push(f.node('new-user-card','new user content'));f.setGraph(current);
  };
  // Aborting a stale cut is acceptable; replacing new user content is not.
  await loadCollect()(f.root,true).catch(()=>{});
  assert.equal(f.graph.nodes.find((n:any)=>n.id==='remaining')?.text,'user edited while waiting');
  assert.ok(f.graph.nodes.some((n:any)=>n.id==='new-user-card'));
});

test('cut must not apply the old Canvas snapshot after the view changes file',async()=>{
  const f=fixture();f.f.onLibrarySave=async()=>{
    await Promise.resolve();f.view.file={path:'other.canvas'};f.session.path='other.canvas';
    f.setGraph({nodes:[f.node('other-file-card','other file content')],edges:[]});
  };
  await loadCollect()(f.root,true).catch(()=>{});
  assert.deepEqual(f.graph.nodes.map((n:any)=>n.id),['other-file-card']);
  assert.equal(f.graph.nodes[0].text,'other file content');
});

test('cut must not replace a portal entered during the Mini save',async()=>{
  const f=fixture();f.f.onLibrarySave=async()=>{
    await Promise.resolve();f.session.current='other-portal';
    f.setGraph({nodes:[f.node('portal-content','inside other portal')],edges:[]});
  };
  await loadCollect()(f.root,true).catch(()=>{});
  assert.deepEqual(f.graph.nodes.map((n:any)=>n.id),['portal-content']);
});

test('failed Canvas save rollback must not erase edits made during that save',async()=>{
  const f=fixture();f.f.onCanvasSave=async count=>{
    if(count!==1)return;await Promise.resolve();const current=structuredClone(f.graph);
    current.nodes.find((n:any)=>n.id==='remaining').text='edited during Canvas save';
    current.nodes.push(f.node('late-user-card','keep this'));f.setGraph(current);throw Error('injected Canvas save failure');
  };
  await assert.rejects(loadCollect()(f.root,true),/injected Canvas save failure/);
  assert.equal(f.graph.nodes.find((n:any)=>n.id==='remaining')?.text,'edited during Canvas save');
  assert.ok(f.graph.nodes.some((n:any)=>n.id==='late-user-card'));
  assert.equal(Object.keys(f.root.library.items).length,1,'saved Mini snapshot remains available if safe rollback is impossible');
});

test('ordinary copy preserves Canvas and stores the selected snapshot without Canvas save',async()=>{
  const f=fixture(),before=structuredClone(f.graph);
  f.root.palette.canvas.collectIds=async(source:any,_path:string,ids:string[])=>source.nodes.filter((n:any)=>ids.includes(n.id)).map((n:any)=>({id:'temp-copy',type:'text',text:n.text}));
  await loadCollect()(f.root,false);
  assert.deepEqual(f.graph,before);
  assert.equal(f.canvasSaves,0);
  assert.equal(Object.keys(f.root.library.items).length,1);
  assert.equal((Object.values(f.root.library.items)[0] as any).text,'captured');
});

test('failed Canvas save restores an unchanged source and removes the temporary Mini snapshot',async()=>{
  const f=fixture(),before=structuredClone(f.graph);
  f.f.onCanvasSave=async count=>{if(count===1)throw Error('injected save failure');};
  await assert.rejects(loadCollect()(f.root,true),/injected save failure/);
  assert.deepEqual(f.graph,before);
  assert.equal(f.canvasSaves,2,'original save attempt plus safe restoration save');
  assert.equal(f.librarySaves,2,'capture save plus removal after safe rollback');
  assert.equal(Object.keys(f.root.library.items).length,0);
});

test('file switch during setData await never saves the new target and preserves Mini snapshot',async()=>{
  const f=fixture();
  f.f.onSetData=async()=>{
    await Promise.resolve();f.view.file={path:'other.canvas'};f.session.path='other.canvas';
    f.setGraph({nodes:[f.node('other-file-card','other file content')],edges:[]});
  };
  await assert.rejects(loadCollect()(f.root,true),/Mini/);
  assert.deepEqual(f.graph.nodes.map((n:any)=>n.id),['other-file-card']);
  assert.equal(f.canvasSaves,0,'must not call view.save after its target changed');
  assert.equal(Object.keys(f.root.library.items).length,1);
});
