import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';

async function load(entry:string, globals:any={}) {
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,external:['obsidian']});
 const module={exports:{} as any};
 vm.runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require:(id:string)=>{if(id==='obsidian')return {Notice:class{},TFile:class{}};throw Error(id);},console,structuredClone,crypto:globalThis.crypto,...globals});
 return module.exports;
}

test('collision reads current geometry without serializing unrelated portal content',async()=>{
 const {CanvasAdapter}=await load('vendor/palette/src/canvas/canvas-adapter.ts');
 const adapter=Object.create(CanvasAdapter.prototype);
 const node={id:'a',type:'text',x:0,y:0,width:100,height:100};
 const data={nodes:[node],edges:[],get canvasPortal(){throw Error('must not traverse portal contents');}};
 const ctx={runtime:{getData:()=>data}},bundle={nodes:[{type:'text',x:0,y:0,width:20,height:20}]};
 assert.equal(adapter.bundleCollides(ctx,bundle,{x:10,y:10},new Set(),'avoid-content-overlap'),true);
 node.x=500;
 assert.equal(adapter.bundleCollides(ctx,bundle,{x:10,y:10},new Set(),'avoid-content-overlap'),false);
 assert.equal(node.x,500);
});

async function fixture(globals:any={}){
 const elements:any[]=[];const make=()=>{const e:any={style:{},children:[],hidden:false,removed:false,createDiv(){const c=make();this.children.push(c);return c;},remove(){this.removed=true;},toggleClass(){}};elements.push(e);return e;};
 const doc:any={body:{createDiv:()=>make()},elementFromPoint:()=>null};const {MiniPlacement}=await load('src/placement.ts',{document:doc,...globals});
 const calls:any[]=[];const listeners:any={};
 const runtime={posFromClient:({x,y}:any)=>({x,y})};const ctx={runtime,file:{path:'test.canvas'},view:{} as any};
 const root:any={registerDomEvent(_doc:any,k:string,fn:any){listeners[k]=fn;},library:{items:{a:{id:'a'}}},spaceKey:()=> 'test.canvas',mini:{refresh(){}},palette:{canvas:{contextForTarget:(target:any)=>target?{...ctx}:null,createItemBundle:()=>({nodes:[{id:'n',type:'text',x:0,y:0,width:20,height:20}],edges:[],bounds:{width:20,height:20}}),bundleCollides(_ctx:any,_bundle:any,point:any){calls.push({...point});return point.x===200;}}}};
 const p=new MiniPlacement(root);p.ready=true;p.journal={pendingItemIds:()=>new Set()};const event=(x:number,target:any=true)=>({clientX:x,clientY:50,target,preventDefault(){},stopImmediatePropagation(){},shiftKey:false,dataTransfer:{}});
 return {p,event,calls,elements,ctx,listeners,doc};
}

test('drop checks release coordinates and current collision instead of last dragover',async()=>{
 const {p,event,calls}=await fixture();p.start(['a']);p.over(event(100));await p.drop(event(200));
 assert.deepEqual(calls,[{x:100,y:50},{x:200,y:50}]);assert.equal(p.active,false);
});

test('dragenter prepares fast drags; switching runtime removes previous overlay',async()=>{
 const {p,event,elements,ctx,listeners}=await fixture();p.start(['a']);listeners.dragenter(event(100));
 const first=elements[0];assert.equal(first.removed,false);
 ctx.runtime={posFromClient:({x,y}:any)=>({x,y})};p.over(event(110));assert.equal(first.removed,true);
 p.over(event(120,null));assert.equal(p.point,null);assert.equal(p.overlay.hidden,true);p.cancel();
 assert.equal(p.active,false);
});
import {placementMetadata} from '../src/placement-metadata.ts';

test('placement metadata leaves old spaces untouched and batches only imported nodes',()=>{
 const oldPortal={get graph(){throw Error('old portal graph must not be visited');}};
 const before={canvasPortal:{portals:{old:oldPortal}}};
 const after={nodes:[{id:'old',uctMetadata:{label:'old',modifiedAt:1}},{id:'new',uctMetadata:{label:'new',modifiedAt:2}}],canvasPortal:{portals:{old:oldPortal,imported:{graph:{nodes:[{id:'child',uctMetadata:{caption:'c',modifiedAt:3}}]}}}}};
 const writes=placementMetadata(before,after,null,'a.canvas',['new'],[{nodeId:'new',metadata:{label:'override',tags:['old']}}],100);
 assert.deepEqual(writes.map(w=>[w.key,w.nodeId,w.modifiedAt]),[['a.canvas','new',100],['a.canvas#uct-portal:imported','child',3]]);
 assert.deepEqual(writes[0].metadata,{label:'override',tags:[]});
});

test('cancelled and unrelated drags do not rebuild the unchanged Mini view',async()=>{
 const {p,event,listeners}=await fixture();let refreshes=0;p.root.mini.refresh=()=>refreshes++;
 listeners.dragend();p.start(['a']);p.over(event(100));listeners.dragend();
 assert.equal(p.active,false);assert.equal(refreshes,0);
});
test('placement idle barrier is released by transaction completion, not by cancelling its gesture',async()=>{
 const {p}=await fixture();p.lock();let idle=false;const waiting=p.whenIdle().then(()=>idle=true);p.cancel();await new Promise(r=>setImmediate(r));assert.equal(idle,false);p.unlock();await waiting;assert.equal(idle,true);await p.whenIdle();
});

test('pointer release outside Canvas ends placement without a native dragend',async()=>{
 const {p,event}=await fixture();p.start(['a']);p.over(event(100));
 await p.trackPointer({...event(5),pointerId:1},true);
 assert.equal(p.active,false);assert.equal(p.overlay,null);assert.ok(p.root.library.items.a);
});

test('Mini card placement preserves the collected first heading and body verbatim',async()=>{
 const {p,event}=await fixture();
 const text='# 원래 제목\n\n본문과 **강조**\n';
 p.root.library.items.a={id:'a',type:'card',content:text,displayTitle:'# 원래 제목'};
 p.root.palette.canvas.createItemBundle=()=>({nodes:[{id:'n',type:'text',text:'본문과 **강조**',x:0,y:0,width:280,height:180}],edges:[],bounds:{width:280,height:180}});
 p.start(['a']);p.over(event(100));
 assert.equal(p.parts[0].nodes[0].text,text);
 assert.equal(p.root.library.items.a.content,text);
 p.cancel();
});

async function transactionFixture(globals:any={}){
 const f=await fixture(globals),root=f.p.root;
 Object.assign(f.ctx.view,{file:f.ctx.file,canvas:f.ctx.runtime,data:'{}',lastSavedData:'{}'});
 const session:any={v:f.ctx.view,current:null,busy:false,root:{nodes:[],edges:[],canvasPortal:{portals:{}}}};
 let disk:any=structuredClone(session.root),journalData:any=null,commits=0,failMini=false;
 root.modules={};root.session=()=>session;root.portal={sessions:new Map([['s',session]]),discover(){},capture(){},async commitRoot(_s:any,after:any){commits++;session.root=after;disk=structuredClone(after);}};
 f.ctx.view.save=async()=>{disk=structuredClone(session.root);};
 root.palette.store={setMetadataRecord(){},changed(){}};
 const {PlacementJournal}=await load('src/placement-journal.ts');
 const io={readJournal:async()=>journalData,writeJournal:async(data:any)=>{journalData=structuredClone(data);},readCanvas:async()=>disk,saveLibrary:async()=>{if(failMini)throw Error('injected Mini write failure');}};
 f.p.journal=new PlacementJournal(io,root.library);await f.p.journal.load();
 return {...f,root,session,io,commits:()=>commits,failMini:(v:boolean)=>failMini=v};
}

test('a Canvas save still running after the deadline preserves the Mini source and recovery record',async()=>{
 let clock=0;const f=await transactionFixture({performance:{now:()=>clock+=31000}});f.ctx.view.saving=true;
 f.p.start(['a']);await f.p.drop(f.event(100));assert.equal(f.commits(),1);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,1);
 f.ctx.view.saving=false;f.p.start(['a']);await f.p.shutdown();assert.equal(f.commits(),1);assert.equal(f.root.library.items.a,undefined);assert.equal(f.p.journal.listRecords().length,0);
});

test('actual placement retry after Mini failure finalizes once without adding another Canvas node',async()=>{
 const f=await transactionFixture();f.failMini(true);f.p.start(['a']);await f.p.drop(f.event(100));
 assert.equal(f.commits(),1);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.pendingItemIds().has('a'),true);
 f.failMini(false);f.p.start(['a']);await f.p.shutdown();
 assert.equal(f.commits(),1);assert.equal(f.session.root.nodes.length,1);assert.equal(f.root.library.items.a,undefined);assert.equal(f.p.journal.listRecords().length,0);
});

test('another gesture can start after a durable move while the first Mini save is pending',async()=>{
 const f=await transactionFixture();f.root.library.items.b={id:'b',type:'card',content:'second'};
 f.root.palette.canvas.createItemBundle=([item]:any[])=>({nodes:[{id:'node-'+item.id,type:'text',x:0,y:0,width:20,height:20}],edges:[],bounds:{width:20,height:20}});
 let entered!:()=>void,release!:()=>void,calls=0;const begun=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{if(++calls===1){entered();await gate;}};
 f.p.start(['a']);const first=f.p.drop(f.event(100));await begun;
 assert.equal(f.p.busy,false);assert.equal(f.session.busy,false);assert.equal(f.p.active,true);assert.equal(f.root.library.items.a,undefined);
 let idle=false;const barrier=f.p.whenIdle().then(()=>idle=true);await Promise.resolve();assert.equal(idle,false);
 f.p.start(['b']);assert.deepEqual([...f.p.ids],['b']);const second=f.p.drop(f.event(300));await Promise.resolve();release();
 await Promise.all([first,second,barrier]);assert.equal(f.commits(),2);assert.equal(f.root.library.items.b,undefined);assert.equal(f.p.journal.listRecords().length,0);assert.equal(idle,true);
});

test('finishing an earlier save does not cancel a later gesture still being dragged',async()=>{
 const f=await transactionFixture();f.root.library.items.b={id:'b',type:'card',content:'second'};
 let entered!:()=>void,release!:()=>void;const begun=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{entered();await gate;};f.p.start(['a']);const first=f.p.drop(f.event(100));await begun;
 f.p.start(['b']);f.p.over(f.event(300));const overlay=f.p.overlay;assert.ok(overlay);release();await first;
 assert.deepEqual([...f.p.ids],['b']);assert.equal(f.p.overlay,overlay);assert.equal(overlay.removed,false);f.p.cancel();await f.p.whenIdle();
});

test('a completed pointer placement cannot cancel a newer drag while its save finishes',async()=>{
 const f=await transactionFixture();f.root.library.items.b={id:'b',type:'card',content:'second'};f.doc.elementFromPoint=()=>true;
 let entered!:()=>void,release!:()=>void;const begun=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{entered();await gate;};f.p.start(['a']);f.p.over(f.event(100));const first=f.p.trackPointer(f.event(100),true);await begun;
 f.p.start(['b']);f.p.over(f.event(300));const overlay=f.p.overlay;release();await first;
 assert.deepEqual([...f.p.ids],['b']);assert.equal(f.p.overlay,overlay);assert.equal(overlay.removed,false);f.p.cancel();await f.p.whenIdle();
});

test('a failed earlier Mini save restores its source without cancelling a later placement',async()=>{
 const f=await transactionFixture();f.root.library.items.b={id:'b',type:'card',content:'second'};
 f.root.palette.canvas.createItemBundle=([item]:any[])=>({nodes:[{id:'node-'+item.id,type:'text',x:0,y:0,width:20,height:20}],edges:[],bounds:{width:20,height:20}});
 let entered!:()=>void,release!:()=>void,calls=0;const begun=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{if(++calls===1){entered();await gate;throw Error('injected first save failure');}};
 f.p.start(['a']);const first=f.p.drop(f.event(100));await begun;f.p.start(['b']);const second=f.p.drop(f.event(300));await Promise.resolve();release();
 await Promise.all([first,second]);assert.ok(f.root.library.items.a);assert.equal(f.root.library.items.b,undefined);assert.equal(f.commits(),2);assert.deepEqual([...f.p.journal.pendingItemIds()],['a']);
});

test('shutdown waits for a released gesture to finish its pending Mini persistence',async()=>{
 const f=await transactionFixture();let entered!:()=>void,release!:()=>void;const begun=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{entered();await gate;};f.p.start(['a']);const first=f.p.drop(f.event(100));await begun;
 let closed=false;const closing=f.p.shutdown().then(()=>closed=true);await Promise.resolve();assert.equal(closed,false);release();await Promise.all([first,closing]);
 assert.equal(closed,true);assert.equal(f.root.library.items.a,undefined);assert.equal(f.p.journal.listRecords().length,0);
});

test('changing target during journal preparation cannot overwrite another Canvas',async()=>{
 const f=await transactionFixture();const write=f.io.writeJournal;f.io.writeJournal=async data=>{await write(data);f.ctx.view.file={path:'other.canvas'};};
 f.p.start(['a']);await f.p.drop(f.event(100));assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.session.busy,false);assert.equal(f.p.journal.listRecords().length,0);
});

test('editing Canvas while preparing journal aborts without replacing the new edit',async()=>{
 const f=await transactionFixture();const write=f.io.writeJournal;f.io.writeJournal=async data=>{await write(data);f.session.root.nodes.push({id:'user-edit'});};
 f.p.start(['a']);await f.p.drop(f.event(100));assert.equal(f.commits(),0);assert.equal(f.session.root.nodes[0].id,'user-edit');assert.ok(f.root.library.items.a);
});

test('Esc during move-journal persistence cancels before Canvas commit',async()=>{
 const f=await transactionFixture(),write=f.io.writeJournal;let cancelled=false;
 f.io.writeJournal=async data=>{await write(data);if(!cancelled){cancelled=true;f.listeners.keydown({key:'Escape'});}};
 f.p.start(['a']);await f.p.drop(f.event(100));
 assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);assert.equal(f.p.active,false);
});

test('native dragend after an accepted drop does not cancel its journal wait',async()=>{
 const f=await transactionFixture(),write=f.io.writeJournal;let ended=false;
 f.io.writeJournal=async data=>{await write(data);if(!ended){ended=true;f.listeners.dragend();}};
 f.p.start(['a']);await f.p.drop(f.event(100));
 assert.equal(f.commits(),1);assert.equal(f.root.library.items.a,undefined);assert.equal(f.p.journal.listRecords().length,0);assert.equal(f.p.active,false);
});

test('shutdown during a pending move journal waits for safe cancellation',async()=>{
 const f=await transactionFixture(),write=f.io.writeJournal;let release!:()=>void,started!:()=>void;
 const gate=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>started=r);let held=false;
 f.io.writeJournal=async data=>{if(!held){held=true;started();await gate;}await write(data);};
 f.p.start(['a']);const job=f.p.drop(f.event(100));await entered;const closing=f.p.shutdown();release();await Promise.all([job,closing]);
 assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);assert.equal(f.p.active,false);
});


test('Shift copy keeps Mini and does not add move journal writes',async()=>{
 const f=await transactionFixture();let writes=0;f.io.writeJournal=async()=>{writes++;};f.p.start(['a']);const event=f.event(100);event.shiftKey=true;await f.p.drop(event);
 assert.equal(f.commits(),1);assert.ok(f.root.library.items.a);assert.equal(writes,0);assert.equal(f.p.journal.listRecords().length,0);
});

test('ordinary release consumes the hover journal without preparing it again',async()=>{
 const f=await transactionFixture(),{PlacementPreparation}=await load('src/placement-preparation.ts');f.p.preparation=new PlacementPreparation(f.p.journal);let prepares=0;const write=f.io.writeJournal;f.io.writeJournal=async data=>{if(data.records.length)prepares++;await write(data);};
 f.p.start(['a']);f.p.over(f.event(100));await f.p.drop(f.event(100));
 assert.equal(prepares,1);assert.equal(f.commits(),1);assert.equal(f.root.library.items.a,undefined);assert.equal(f.p.journal.listRecords().length,0);
});

test('Shift pressed after hover clears the move journal before committing a copy',async()=>{
 const f=await transactionFixture(),{PlacementPreparation}=await load('src/placement-preparation.ts');f.p.preparation=new PlacementPreparation(f.p.journal);const commit=f.root.portal.commitRoot;f.root.portal.commitRoot=async(...args:any[])=>{assert.equal(f.p.journal.listRecords().length,0);await commit(...args);};
 f.p.start(['a']);f.p.over(f.event(100));const event=f.event(100);event.shiftKey=true;await f.p.drop(event);await f.p.preparation.finish();
 assert.equal(f.commits(),1);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);
});

test('editing a non-image Mini card during hover cancels instead of using its stale graph',async()=>{
 const f=await transactionFixture(),{PlacementPreparation}=await load('src/placement-preparation.ts');f.p.preparation=new PlacementPreparation(f.p.journal);f.p.start(['a']);f.p.over(f.event(100));f.root.library.items.a.content='changed during drag';await f.p.drop(f.event(100));await f.p.preparation.finish();
 assert.equal(f.commits(),0);assert.equal(f.root.library.items.a.content,'changed during drag');assert.equal(f.p.journal.listRecords().length,0);
});

async function imageTransaction(){
 const f=await transactionFixture();f.root.library.items.a={id:'a',type:'image'};
 f.root.palette.canvas.createItemBundle=()=>({nodes:[{id:'n',type:'file',file:'photo.svg',x:0,y:0,width:360,height:240}],edges:[],bounds:{width:360,height:240}});
 f.p.start(['a']);let resolve!:()=>void;const batch:any={sizes:new Map(),count:1,ready:false,valid:()=>true,done:new Promise<void>(r=>resolve=r),dispose(){resolve();}};f.p.images=batch;
 const finish=()=>{batch.sizes.set('a',{width:640,height:420});batch.ready=true;resolve();};return {...f,batch,finish};
}
test('cold image drop survives native dragend and commits fitted geometry exactly once',async()=>{
 const f=await imageTransaction(),event=f.event(100);event.shiftKey=true;const job=f.p.drop(event);assert.equal(f.commits(),0);f.listeners.dragend();assert.equal(f.p.waitingImages,true);f.finish();await job;assert.equal(f.commits(),1);assert.equal(f.session.root.nodes[0].width,360);assert.equal(f.session.root.nodes[0].height,236);assert.ok(f.root.library.items.a);assert.equal(f.p.active,false);
});
test('Esc or Mini close during image preparation leaves Canvas and Mini intact',async()=>{
 for(const method of ['cancel','cancelPreparation']){const f=await imageTransaction(),job=f.p.drop(f.event(100));f.p[method]();await job;assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.session.root.nodes.length,0);assert.equal(f.p.active,false);}
});
test('target switch or image file change while preparing cannot commit to the new target',async()=>{
 for(const way of ['target','file']){const f=await imageTransaction(),job=f.p.drop(f.event(100));if(way==='target')f.ctx.view.file={path:'other.canvas'};else f.batch.valid=()=>false;f.finish();await job;assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);}
});
test('current collisions are rechecked after a cold image resolves',async()=>{
 const f=await imageTransaction();let reject=false;f.root.palette.canvas.bundleCollides=()=>reject;const job=f.p.drop(f.event(100));reject=true;f.finish();await job;assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);
});
test('editing selected Mini data during image preparation cannot move away the new edit',async()=>{
 const f=await imageTransaction(),job=f.p.drop(f.event(100));f.root.library.items.a.caption='new edit';f.finish();await job;assert.equal(f.commits(),0);assert.equal(f.root.library.items.a.caption,'new edit');assert.equal(f.p.journal.listRecords().length,0);
});
test('image source modification during move-journal persistence aborts before Canvas commit',async()=>{
 const f=await imageTransaction();f.finish();f.io.writeJournal=async()=>{f.batch.valid=()=>false;};await f.p.drop(f.event(100));assert.equal(f.commits(),0);assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);
});
test('image wait preserves newly edited text in a second selected Mini card',async()=>{
 const f=await imageTransaction();f.root.library.items.b={id:'b',type:'card',content:'old text'};f.p.ids.push('b');
 const original=f.root.palette.canvas.createItemBundle;f.root.palette.canvas.createItemBundle=([item]:any[])=>item.id==='b'?{nodes:[{id:'b-node',type:'text',text:item.content,x:0,y:0,width:280,height:180}],edges:[],bounds:{width:280,height:180}}:original();
 const job=f.p.drop(f.event(100));f.root.library.items.b.content='new edit during image load';f.finish();await job;assert.equal(f.commits(),0);assert.equal(f.root.library.items.b.content,'new edit during image load');assert.ok(f.root.library.items.a);assert.equal(f.p.journal.listRecords().length,0);
});
