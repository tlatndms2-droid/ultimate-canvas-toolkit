import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PlacementJournal, type PlacementRecord, type PlacementJournalIO} from '../src/placement-journal.ts';

const copy = <T>(v:T):T => JSON.parse(JSON.stringify(v));
function fixture() {
  let journal:any=null, diskItems:any={one:{id:'one',title:'original'}}, canvas:any={nodes:[]};
  let failMini=false, failJournal=false, canvasError:any=null, saves=0;
  let library={items:copy(diskItems)};
  const io:PlacementJournalIO={
    readJournal:async()=>copy(journal),
    writeJournal:async data=>{if(failJournal)throw Error('journal failure');journal=copy(data);},
    readCanvas:async()=>{if(canvasError)throw canvasError;return copy(canvas);},
    waitForCanvas:async()=>{},
    saveLibrary:async()=>{saves++;if(failMini)throw Error('Mini failure');diskItems=copy(library.items);}
  };
  const record:PlacementRecord={id:'tx',path:'a.canvas',space:null,nodeIds:['new-1','new-2'],itemSnapshots:copy(diskItems),copy:false};
  return {io,record,get library(){return library;},get diskItems(){return diskItems;},get journal(){return journal;},get saves(){return saves;},
    setJournal:(v:any)=>{journal=v;},setCanvas:(v:any)=>{canvas=v;},setCanvasError:(v:any)=>{canvasError=v;},
    failMini:(v:boolean)=>{failMini=v;},failJournal:(v:boolean)=>{failJournal=v;},restart:()=>{library={items:copy(diskItems)};return new PlacementJournal(io,library);}};
}

test('delayed Canvas persistence is verified before removing Mini data',async()=>{
 const f=fixture(),j=await prepared(f);let waits=0;
 f.io.waitForCanvas=async()=>{waits++;assert.ok(f.library.items.one);if(waits===3)f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});};
 await j.settle('tx');assert.equal(waits,3);assert.equal(f.library.items.one,undefined);assert.equal(j.listRecords().length,0);
});
test('restart recovery waits for an in-flight Canvas save before discarding a zero-match record',async()=>{
 const f=fixture();await prepared(f);const restarted=f.restart();await restarted.load();let waits=0;
 f.io.waitForCanvas=async()=>{if(++waits===2)f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});};
 await restarted.startupRecover();assert.equal(waits,2);assert.equal(f.library.items.one,undefined);assert.equal(restarted.listRecords().length,0);
});
test('restart keeps a zero-match journal when the Canvas is still saving after the wait',async()=>{
 const f=fixture();await prepared(f);const restarted=f.restart();await restarted.load();f.io.canvasIsSaving=()=>true;
 await assert.rejects(restarted.startupRecover(),AggregateError);assert.ok(f.library.items.one);assert.equal(restarted.listRecords().length,1);
});
async function prepared(f:ReturnType<typeof fixture>) {const j=new PlacementJournal(f.io,f.library);await j.load();await j.prepare(f.record);return j;}

test('Canvas success / Mini failure survives restart and settles without allowing duplicate placement',async()=>{
  const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});f.failMini(true);
  await assert.rejects(j.settle('tx'),/Mini failure/);
  assert.ok(f.library.items.one);assert.ok(f.diskItems.one);assert.equal(f.journal.records.length,1);
  await assert.rejects(j.prepare({...f.record,id:'second'}),/이전 배치/);
  f.failMini(false);const restarted=f.restart();await restarted.load();
  assert.ok(restarted.pendingItemIds().has('one'));await restarted.startupRecover();
  assert.deepEqual(f.diskItems,{});assert.deepEqual(f.library.items,{});assert.deepEqual(f.journal.records,[]);
});

test('runtime zero matches retain journal, while startup zero matches discard only journal',async()=>{
  const f=fixture(),j=await prepared(f);
  await assert.rejects(j.settle('tx'),/전체 저장/);assert.equal(j.listRecords().length,1);
  await j.startupRecover();assert.equal(j.listRecords().length,0);assert.ok(f.library.items.one);assert.equal(f.saves,0);
});

test('partial Canvas commit stays pending and cannot remove any Mini item',async()=>{
  const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'}]});
  await assert.rejects(j.startupRecover(),AggregateError);assert.equal(j.listRecords().length,1);assert.ok(f.library.items.one);assert.equal(f.saves,0);
});

test('missing or malformed Canvas preserves journal and Mini',async()=>{
  const f=fixture(),j=await prepared(f);f.setCanvasError(Object.assign(Error('missing Canvas'),{code:'ENOENT'}));
  await assert.rejects(j.startupRecover(),AggregateError);assert.ok(f.library.items.one);assert.equal(j.listRecords().length,1);
  f.setCanvasError(null);f.setCanvas('{invalid');await assert.rejects(j.startupRecover(),AggregateError);
  assert.ok(f.library.items.one);assert.equal(j.listRecords().length,1);assert.equal(f.saves,0);
});

test('modified Mini item blocks whole move finalization',async()=>{
  const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});f.library.items.one.title='user edit';
  await assert.rejects(j.settle('tx'),/修正|수정/);assert.equal(f.library.items.one.title,'user edit');assert.equal(j.listRecords().length,1);assert.equal(f.saves,0);
});

test('copy finalization leaves Mini untouched and matches only the recorded space',async()=>{
  const f=fixture();f.record.copy=true;f.record.space='portal';const j=await prepared(f);
  f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}],canvasPortal:{portals:{portal:{graph:{nodes:[]}}}}});
  await assert.rejects(j.settle('tx'),/전체 저장/);
  f.setCanvas({nodes:[],canvasPortal:{portals:{portal:{graph:{nodes:[{id:'new-1'},{id:'new-2'}]}}}}});
  await j.settle('tx');assert.ok(f.library.items.one);assert.equal(f.saves,0);assert.equal(j.listRecords().length,0);
});
test('copy reports success only after its Canvas nodes are persisted without writing a move journal',async()=>{
 const f=fixture(),j=new PlacementJournal(f.io,f.library);await j.load();let waits=0;
 f.io.waitForCanvas=async()=>{if(++waits===2)f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});};
 await j.verifyCopy({path:'a.canvas',space:null,nodeIds:['new-1','new-2']});
 assert.equal(waits,2);assert.ok(f.library.items.one);assert.equal(f.saves,0);assert.equal(j.listRecords().length,0);
});
test('copy verification failure retains the Mini source',async()=>{
 const f=fixture(),j=new PlacementJournal(f.io,f.library);await j.load();
 await assert.rejects(j.verifyCopy({path:'a.canvas',space:null,nodeIds:['missing']}),/저장/);
 assert.ok(f.library.items.one);assert.equal(j.listRecords().length,0);
});

test('cleanup failure retains record and restart handles already persisted removal',async()=>{
  const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});f.failJournal(true);
  await assert.rejects(j.settle('tx'),/journal failure/);assert.deepEqual(f.diskItems,{});assert.equal(j.listRecords().length,1);
  f.failJournal(false);const restarted=f.restart();await restarted.load();await restarted.startupRecover();assert.equal(restarted.listRecords().length,0);
});

test('prepare is durable before pending state and discard failure preserves record',async()=>{
  const f=fixture(),j=new PlacementJournal(f.io,f.library);await j.load();f.failJournal(true);
  await assert.rejects(j.prepare(f.record),/journal failure/);assert.equal(j.listRecords().length,0);assert.ok(f.library.items.one);
  f.failJournal(false);await j.prepare(f.record);f.failJournal(true);await assert.rejects(j.discard('tx'),/journal failure/);
  assert.ok(j.pendingItemIds().has('one'));f.failJournal(false);await j.discard('tx');assert.ok(f.library.items.one);assert.equal(j.listRecords().length,0);
});

test('corrupt or unsupported journal cannot be overwritten by prepare',async()=>{
  for(const input of ['{bad',{version:2,records:[]},{version:1,records:[{id:'bad'}]}]){
    const f=fixture();f.setJournal(input);const j=new PlacementJournal(f.io,f.library);
    await assert.rejects(j.load());await assert.rejects(j.prepare(f.record),/먼저/);assert.deepEqual(f.journal,input);assert.ok(f.library.items.one);
  }
});

test('concurrent prepare requests for same Mini item are serialized and only one survives',async()=>{
  const f=fixture(),j=new PlacementJournal(f.io,f.library);await j.load();
  const results=await Promise.allSettled([j.prepare(f.record),j.prepare({...f.record,id:'second'})]);
  assert.deepEqual(results.map(r=>r.status),['fulfilled','rejected']);assert.equal(j.listRecords().length,1);
});

test('returned records cannot mutate internal recovery snapshots',async()=>{
  const f=fixture(),j=await prepared(f);j.listRecords()[0].itemSnapshots.one.title='tampered';
  assert.equal(j.listRecords()[0].itemSnapshots.one.title,'original');
});

test('visible removal follows durable Canvas verification and precedes Mini file I/O',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});const states:any[]=[];let start!:()=>void,release!:()=>void;const started=new Promise<void>(r=>start=r),gate=new Promise<void>(r=>release=r),save=f.io.saveLibrary;
 f.io.libraryChanged=restored=>states.push({restored,present:!!f.library.items.one,pending:j.pendingItemIds().has('one')});f.io.saveLibrary=async()=>{start();await gate;await save();};
 const settling=j.settle('tx');await started;assert.deepEqual(states,[{restored:false,present:false,pending:true}]);assert.ok(f.diskItems.one);assert.equal(f.journal.records.length,1);release();await settling;assert.deepEqual(f.diskItems,{});assert.equal(j.listRecords().length,0);
});
test('failed Mini persistence restores the model and notifies the UI before reporting failure',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});const states:any[]=[];f.io.libraryChanged=restored=>states.push({restored,present:!!f.library.items.one});f.failMini(true);await assert.rejects(j.settle('tx'),/Mini failure/);assert.deepEqual(states,[{restored:false,present:false},{restored:true,present:true}]);assert.ok(f.diskItems.one);assert.equal(j.listRecords().length,1);
});

test('an incomplete destination never notifies the UI to remove source items',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'}]});const states:boolean[]=[];f.io.libraryChanged=restored=>states.push(restored);await assert.rejects(j.settle('tx'),/전체 저장/);assert.deepEqual(states,[]);assert.ok(f.library.items.one);assert.equal(f.saves,0);
});

test('next preparation is durable while prior Mini save waits, without losing either record',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});
 let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r),save=f.io.saveLibrary;
 f.io.saveLibrary=async()=>{entered();await gate;await save();};
 const first=j.settle('tx');await started;assert.strictEqual(j.settle('tx'),first);
 (f.library.items as any).two={id:'two',title:'next'};
 const next={...f.record,id:'next',nodeIds:['third'],itemSnapshots:{two:{id:'two',title:'next'}}};
 await j.prepare(next);assert.deepEqual(f.journal.records.map((r:any)=>r.id),['tx','next']);
 await assert.rejects(j.discard('tx'),/진행 중/);await assert.rejects(j.load(),/저장 중/);
 release();await first;assert.deepEqual(f.journal.records.map((r:any)=>r.id),['next']);assert.ok((f.library.items as any).two);
 await j.discard('next');assert.equal(j.listRecords().length,0);
});

test('earlier save failure preserves later preparation and protects restored source from duplicate placement',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'}]});
 let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 f.io.saveLibrary=async()=>{entered();await gate;throw Error('gated failure');};
 const first=j.settle('tx');const rejected=assert.rejects(first,/gated failure/);await started;
 (f.library.items as any).two={id:'two'};await j.prepare({...f.record,id:'next',nodeIds:['third'],itemSnapshots:{two:{id:'two'}}});
 release();await rejected;assert.ok(f.library.items.one);assert.ok((f.library.items as any).two);assert.equal(j.listRecords().length,2);
 await assert.rejects(j.prepare({...f.record,id:'duplicate'}),/이전 배치/);
 f.io.saveLibrary=async()=>{};await j.settle('tx');assert.deepEqual(j.listRecords().map(r=>r.id),['next']);
});

test('two overlapping settlements retain the unfinished record when persistence completes out of order',async()=>{
 const f=fixture(),j=await prepared(f);f.setCanvas({nodes:[{id:'new-1'},{id:'new-2'},{id:'third'}]});
 const releases:Array<()=>void>=[];f.io.saveLibrary=()=>new Promise<void>(r=>releases.push(r));
 const first=j.settle('tx');while(releases.length<1)await new Promise(r=>setImmediate(r));
 (f.library.items as any).two={id:'two'};await j.prepare({...f.record,id:'next',nodeIds:['third'],itemSnapshots:{two:{id:'two'}}});
 const next=j.settle('next');while(releases.length<2)await new Promise(r=>setImmediate(r));
 releases[1]();await next;assert.deepEqual(j.listRecords().map(r=>r.id),['tx']);
 releases[0]();await first;assert.equal(j.listRecords().length,0);assert.deepEqual(f.library.items,{});
});
