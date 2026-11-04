import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {join} from 'node:path';
import {PlacementPreparation} from '../src/placement-preparation.ts';

function load(file:string,imports:any={},globals:any={}){const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:(id:string)=>imports[id]??(id==='./placement-preparation'?{PlacementPreparation}:id==='obsidian'?{Plugin:class{},PluginSettingTab:class{}}:{}),console,document:{},...globals});return module.exports;}
function fixture(){let refreshes=0,fail=false;const writes:string[]=[];const Plugin=load('src/main.ts',{'node:path':{join},'./json-write':{queueJsonWrite:async(_q:any,_k:any,_t:any,raw:string)=>{writes.push(raw);if(fail)throw Error('disk failed');}}}).default,p=Object.create(Plugin.prototype);p.queues=new Map();p.app={vault:{adapter:{getBasePath:()=>'/vault'}}};p.manifest={dir:'plugin'};p.modules={};p.library={items:{a:{id:'a',content:'old'}},folders:[],ui:{open:true}};p.mini={refresh(){refreshes++;}};return {p,writes,refreshes:()=>refreshes,fail:(v:boolean)=>fail=v};}
test('unchanged library saves keep persistence checks but skip complete Mini re-render',async()=>{const f=fixture();await f.p.saveLibrary();await f.p.saveLibrary();assert.equal(f.writes.length,2);assert.equal(f.refreshes(),1);f.p.library.items.a.content='new';await f.p.saveLibrary();assert.equal(f.refreshes(),2);assert.equal(JSON.parse(f.writes[2]).items.a.content,'new');});
test('a library write from an already rendered UI does not trigger another unchanged refresh',async()=>{const f=fixture();await f.p.writeJSON('plugin/library.json',f.p.library);await f.p.saveLibrary();assert.equal(f.refreshes(),0);f.p.library.items.a.content='edit';await f.p.saveLibrary();assert.equal(f.refreshes(),1);});
test('failed persistence never marks changed Mini data as already refreshed',async()=>{const f=fixture();await f.p.saveLibrary();f.p.library.items.a.content='new';f.fail(true);await assert.rejects(f.p.saveLibrary(),/disk failed/);assert.equal(f.refreshes(),1);f.fail(false);await f.p.saveLibrary();assert.equal(f.refreshes(),2);});
test('palette settings use disk-verified identical-write elision without affecting journal writes',async()=>{
 const flags:any[]=[],Plugin=load('src/main.ts',{'node:path':{join},'./json-write':{queueJsonWrite:async(...args:any[])=>{flags.push([args[1],args[4]]);}}}).default,p=Object.create(Plugin.prototype);p.manifest={dir:'plugin'};p.app={vault:{adapter:{getBasePath:()=>'/vault'}}};p.queues=new Map();
 await p.writeJSON('plugin/modules/palette/data.json',{a:1});await p.writeJSON('plugin/placement-pending.json',{a:1});assert.deepEqual(flags,[['plugin/modules/palette/data.json',true],['plugin/placement-pending.json',false]]);
});
test('explicit Palette flush cancels its old debounce, preserving a new edit scheduled during I/O',async()=>{
 const timers:number[]=[],Plugin=load('src/main.ts',{'./performance':{paletteSettings:(d:any)=>structuredClone(d)}},{window:{clearTimeout:(id:number)=>timers.push(id)}}).default,p=Object.create(Plugin.prototype);let release!:()=>void;const gate=new Promise<void>(r=>release=r),store={saveTimer:41,data:{settings:{x:1}}};let captured:any,saves=0;p.modules={palette:{store,saveData:async(d:any)=>{captured=d;await gate;}}};p.saveLibrary=async()=>{saves++;};const saving=p.flushPalette();assert.deepEqual(timers,[41]);assert.equal(store.saveTimer,null);store.saveTimer=42;store.data.settings.x=2;release();await saving;assert.equal(store.saveTimer,42);assert.equal(captured.settings.x,1);assert.equal(saves,1);
});
test('refreshes requested during a placement are merged and flushed after it finishes',()=>{const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype);let renders=0;m.root={library:{ui:{open:true}},palette:{},placement:{active:true}};m.render=()=>renders++;m.refresh();m.refresh();assert.equal(renders,0);m.flushDeferredRefresh();assert.equal(renders,0);m.root.placement.active=false;m.flushDeferredRefresh();assert.equal(renders,1);m.flushDeferredRefresh();assert.equal(renders,1);m.root.placement.active=true;m.refresh();m.root.library.ui.open=false;m.root.placement.active=false;m.flushDeferredRefresh();assert.equal(renders,1);});
test('Esc, native dragend and cancellation flush a changed library exactly once',()=>{
 for(const end of ['cancel','escape','dragend']){const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype);const Placement=load('src/placement.ts',{'./placement-image-size':{preparePlacementImages:()=>({ready:true,count:0,sizes:new Map(),dispose(){}})}}).MiniPlacement;const handlers:any={};let renders=0;const root:any={library:{items:{a:{id:'a'}},ui:{open:true}},palette:{},mini:m,registerDomEvent(_el:any,k:string,fn:any){handlers[k]=fn;}};m.root=root;m.render=()=>renders++;const p=new Placement(root);root.placement=p;p.ready=true;p.journal={pendingItemIds:()=>new Set()};p.start(['a']);m.refresh();m.refresh();assert.equal(renders,0);if(end==='cancel')p.cancel();else if(end==='escape')handlers.keydown({key:'Escape'});else handlers.dragend();assert.equal(renders,1);p.cancel();assert.equal(renders,1);}
});
test('cancelling an unchanged drag does not create a Mini render',()=>{const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype),Placement=load('src/placement.ts',{'./placement-image-size':{preparePlacementImages:()=>({ready:true,count:0,sizes:new Map(),dispose(){}})}}).MiniPlacement;let renders=0;const root:any={library:{items:{a:{id:'a'}},ui:{open:true}},palette:{},mini:m,registerDomEvent(){}};m.root=root;m.render=()=>renders++;root.placement=new Placement(root);root.placement.ready=true;root.placement.journal={pendingItemIds:()=>new Set()};root.placement.start(['a']);root.placement.cancel();assert.equal(renders,0);});

test('saved-destination removal updates only missing rows and counts before one deferred reconciliation',()=>{
 const Mini=load('src/mini.ts',{'./library':{folderCounts:()=>new Map([['folder',0]])},'./item-kind':{itemKind:()=>({label:'카드'})}},{window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);let renders=0,released=0,unobserved=0,selectionUpdates=0;const removed:string[]=[],values:any={};const thumb={},cards=['a','b'].map(id=>({dataset:{id},querySelector:()=>thumb,contains:(host:any)=>id==='a'&&host===thumb,remove(){removed.push(id);}}));
 const nav=['collect','type:카드','folder'].map(view=>({dataset:{view},querySelector:()=>({setText:(text:string)=>values[view]=text})}));
 m.root={library:{items:{b:{id:'b',type:'card',folderId:null}},folders:[],ui:{open:true}},palette:{},placement:{active:true}};m.panel={querySelectorAll:(selector:string)=>selector==='.uct-item'?cards:nav,querySelector:(selector:string)=>selector==='.uct-item-total'?{setText:(text:string)=>values.total=text}:null};m.previewHosts=new Map([[thumb,()=>released++]]);m.observer={unobserve(){unobserved++;}};m.list=()=>[m.root.library.items.b];m.updateSelection=()=>selectionUpdates++;m.selected=['a'];m.focus='a';m.anchor='a';m.clickGuardUntil=Date.now()+100000;m.deferredRefresh=true;m.render=()=>renders++;
 m.refreshPlacementState();assert.deepEqual(removed,['a']);assert.equal(released,1);assert.equal(unobserved,1);assert.equal(selectionUpdates,1);assert.deepEqual(values,{total:'1개 자료',collect:'1','type:카드':'1',folder:'0'});assert.equal(renders,0);assert.equal(m.deferredRefresh,true);assert.equal(m.focus,null);assert.equal(m.anchor,null);m.root.placement.active=false;m.flushDeferredRefresh();assert.equal(renders,1);
});
test('durable removal does not reopen a Mini closed during saving',()=>{
 const Mini=load('src/mini.ts',{}, {window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);let renders=0;m.root={library:{ui:{open:false}},palette:{},placement:{active:true}};m.render=()=>renders++;m.deferredRefresh=true;m.refreshPlacementState();assert.equal(renders,0);assert.equal(m.deferredRefresh,false);
});
test('placement journal wires movement and rollback notifications separately from persistence',async()=>{
 let io:any,release!:()=>void,fail=false;const states:boolean[]=[],gate=new Promise<void>(resolve=>release=resolve),Placement=load('src/placement.ts',{'./placement-journal':{PlacementJournal:class{constructor(value:any){io=value;}async load(){}listRecords(){return [];}async startupRecover(){}}}}).MiniPlacement;
 const root:any={registerDomEvent(){},app:{workspace:{getLeavesOfType:()=>[]}},library:{items:{}},saveLibrary:async()=>{await gate;if(fail)throw Error('Mini disk failure');},mini:{refreshPlacementState(restored:boolean){states.push(restored);}}};const placement=new Placement(root);await placement.initialize();io.libraryChanged(false);const saving=io.saveLibrary();assert.deepEqual(states,[false]);release();await saving;assert.deepEqual(states,[false]);fail=true;await assert.rejects(io.saveLibrary(),/disk failure/);io.libraryChanged(true);assert.deepEqual(states,[false,true]);
});
test('a failed Mini save restores visible items while the movement lock remains active',()=>{
 const Mini=load('src/mini.ts',{}, {window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);let renders=0;m.root={library:{ui:{open:true}},palette:{},placement:{active:true}};m.panel={};m.render=()=>renders++;m.refreshPlacementState(true);assert.equal(renders,1);assert.equal(m.clickGuardUntil,0);
});
test('a failed earlier save defers rendering until a newer drag is finished',()=>{
 const Mini=load('src/mini.ts',{}, {window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);let renders=0;
 m.root={library:{ui:{open:true}},palette:{},placement:{active:true,interacting:true}};m.panel={};m.render=()=>renders++;
 m.refreshPlacementState(true);assert.equal(renders,0);assert.equal(m.deferredRefresh,true);
 m.root.placement.interacting=false;m.root.placement.active=false;m.flushDeferredRefresh();assert.equal(renders,1);
});
test('a reconciled move retains surviving thumbnail DOM, but subsequent unrelated changes rerender',()=>{
 for(const unrelated of [false,true]){const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype);let renders=0;m.root={library:{items:{b:{id:'b',content:'kept'}},folders:[],ui:{open:true}},palette:{},placement:{active:false}};m.deferredRefresh=true;m.mirroredPlacement=true;m.renderedShell=m.renderShell();m.renderedItems=new Map([['b',JSON.stringify(m.root.library.items.b)]]);m.render=()=>renders++;if(unrelated)m.root.library.items.b.content='new edit';m.flushDeferredRefresh();assert.equal(renders,unrelated?1:0);assert.equal(m.deferredRefresh,false);}
});


test('verified row removal does not serialize surviving content before removing the row',()=>{
 const Mini=load('src/mini.ts',{'./library':{folderCounts:()=>new Map()},'./item-kind':{itemKind:()=>({label:'카드'})}},{window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);let removed=false,serialized=0,renders=0;
 const b={id:'b',type:'card',folderId:null,toJSON(){assert(removed,'surviving content must wait until removal is visible');serialized++;return{id:'b',type:'card',folderId:null};}};
 const card={dataset:{id:'a'},querySelector:()=>null,contains:()=>false,remove(){removed=true;}};
 m.root={library:{items:{b},folders:[],ui:{open:true}},palette:{},placement:{active:true}};m.panel={querySelectorAll:(s:string)=>s==='.uct-item'?[card]:[],querySelector:()=>null};m.previewHosts=new Map();m.list=()=>[b];m.selected=[];m.focus=null;m.anchor=null;m.renderedShell=m.renderShell();m.renderedItems=new Map([['a','{}'],['b',JSON.stringify({id:'b',type:'card',folderId:null})]]);m.render=()=>{renders++;};
 m.refreshPlacementState();assert(removed);assert.equal(serialized,0);assert.equal(renders,0);
 m.root.placement.active=false;m.flushDeferredRefresh();assert.equal(serialized,1);assert.equal(renders,0);assert.equal(m.deferredRefresh,false);
});

test('placement preserves a scrolled list without forcing a redundant top-of-list layout',()=>{
 for(const offset of [0,42]){const Mini=load('src/mini.ts',{'./library':{folderCounts:()=>new Map()},'./item-kind':{itemKind:()=>({label:'카드'})}},{window:{clearTimeout(){}}}).UctMini,m=Object.create(Mini.prototype);const writes:number[]=[];const area={get scrollTop(){return offset;},set scrollTop(v:number){writes.push(v);}};
 m.root={library:{items:{},folders:[],ui:{open:true}},palette:{},placement:{active:true}};const card={dataset:{id:'removed'},querySelector:()=>null,contains:()=>false,remove(){}};m.panel={querySelectorAll:(s:string)=>s==='.uct-item'?[card]:[],querySelector:(s:string)=>s==='.uct-item-area'?{...area,createDiv(){}}:s==='.uct-empty'?{}:null};
 // Preserve the real descriptor rather than copying its current value.
 const host={createDiv(){}};Object.defineProperty(host,'scrollTop',{get:()=>offset,set:(v:number)=>writes.push(v)});m.panel.querySelector=(s:string)=>s==='.uct-item-area'?host:s==='.uct-empty'?{}:null;
 m.previewHosts=new Map();m.list=()=>[];m.selected=[];m.focus=null;m.anchor=null;m.refreshPlacementState();assert.deepEqual(writes,offset===0?[]:[42]);}
});
