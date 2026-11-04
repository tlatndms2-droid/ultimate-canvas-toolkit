import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

function deferred(){let resolve!:(value?:any)=>void;const promise=new Promise<any>(r=>resolve=r);return {promise,resolve};}
function fixture(kind:'text'|'md'|'pdf',connected=true){
 const gate=deferred(),started=deferred(),cleanups:(()=>void)[]=[];
 let creations=0,markdown=0,renders=0,releases=0,styles=0,resize:((entries:any[])=>void)|undefined;
 class TFile{extension=kind==='text'?'png':kind;path='test.'+this.extension;basename='test';}
 const file=new TFile();
 const make=():any=>{creations++;const children:any[]=[];return {isConnected:connected,children,clientWidth:100,clientHeight:100,
  style:{setProperty(){}},classList:{add(){}},addClass(){},addClasses(){},setAttribute(){},setText(){},getContext(){return {};},
  contains(child:any){return children.includes(child)||children.some(c=>c.contains(child));},empty(){children.length=0;},
  appendChild(child:any){children.push(child);},createDiv(){const child=make();children.push(child);return child;},createEl(){return this.createDiv();},createSpan(){return this.createDiv();}};};
 const module={exports:{} as any};
 const page={getViewport:()=>({width:100,height:100}),render(){renders++;return {promise:Promise.resolve(),cancel(){}};}};
 const app={vault:{getAbstractFileByPath:()=>file,getResourcePath:()=>'',cachedRead(){started.resolve();return gate.promise;}}};
 const pool={acquire:()=>({release:()=>releases++,document:Promise.resolve({getPage(){started.resolve();return gate.promise;}})})};
 vm.runInNewContext(transformSync(readFileSync('vendor/palette/src/preview/preview-service.ts','utf8'),{loader:'ts',format:'cjs'}).code,{
  module,exports:module.exports,require:(id:string)=>id==='obsidian'?{TFile,MarkdownRenderer:{render(){markdown++;if(kind==='text'){started.resolve();return gate.promise;}return Promise.resolve();}}}:id==='./deferred-embeds'?{renderSnapshotMarkdown(){markdown++;if(kind==='text'){started.resolve();return gate.promise;}return Promise.resolve();}}:{IMAGE_EXTENSIONS:new Set(['png'])},
  ResizeObserver:class{constructor(callback:any){resize=callback;}observe(){}disconnect(){}},window:{requestAnimationFrame(){},getComputedStyle:()=>{styles++;return {paddingLeft:'5px',paddingRight:'5px',paddingTop:'2px',paddingBottom:'2px'};}},document:{createElementNS:make},URL,console});
 const parent=make(),service=new module.exports.PreviewService(app,{register:(fn:()=>void)=>cleanups.push(fn)},pool);
 const first=kind==='text'?{type:'text',text:'first'}:{type:'file',file:file.path};
 const item={type:'group',cutFromCanvas:true,origin:{},group:{bounds:{width:100,height:100},edges:[],nodes:[first,{type:'link',url:'https://example.com'}]}};
 return {parent,start:()=>service.render(parent,item),started,resize:(w:number,h:number,borderBox?:{inlineSize:number;blockSize:number})=>resize?.([{target:parent.children[0],contentRect:{width:w,height:h},borderBoxSize:borderBox?[borderBox]:undefined}]),finish:()=>gate.resolve(kind==='pdf'?page:'markdown'),close(){parent.isConnected=false;for(const fn of cleanups)fn();},stats:()=>({creations,markdown,renders,releases,styles})};
}

for(const kind of ['text','md','pdf'] as const)test(`group ${kind} work stops after closing during await`,async()=>{
 const f=fixture(kind),pending=f.start();await f.started.promise;f.close();const before=f.stats();f.finish();await pending;
 assert.equal(f.stats().creations,before.creations);assert.equal(f.stats().renders,0);
 if(kind==='md')assert.equal(f.stats().markdown,0);
 if(kind==='pdf')assert.equal(f.stats().releases,1);
});

test('normal and initially detached group previews finish',async()=>{
 for(const connected of [true,false]){const f=fixture('pdf',connected),pending=f.start();await f.started.promise;f.finish();await pending;assert.equal(f.stats().renders,1);assert.equal(f.stats().releases,0);f.close();assert.equal(f.stats().releases,1);}
});

test('replacing a group host cancels its pending work without unloading the shared component',async()=>{
 const f=fixture('text'),pending=f.start();await f.started.promise;f.parent.empty();const before=f.stats();f.finish();await pending;assert.equal(f.stats().creations,before.creations);
});

test('group preview scales from observer dimensions with padding, without synchronous layout reads',async()=>{
 const f=fixture('text'),pending=f.start();await f.started.promise;const viewport=f.parent.children[0],stage=viewport.children[0];
 Object.defineProperty(viewport,'clientWidth',{get(){throw Error('forced layout width read');}});
 Object.defineProperty(viewport,'clientHeight',{get(){throw Error('forced layout height read');}});
 f.resize(190.3,146);assert.equal(stage.style.transform,'scale(1.41)');assert.equal(stage.style.left,'29.5px');assert.equal(stage.style.top,'4.5px');
 f.resize(90,96);assert.equal(stage.style.transform,'scale(0.94)');
 const last=stage.style.transform;f.close();f.resize(50,50);assert.equal(stage.style.transform,last);f.finish();await pending;
});

test('observed border box preserves padded fit without any computed-style query',async()=>{
 const f=fixture('text'),job=f.start();await f.started.promise;const viewport=f.parent.children[0],stage=viewport.children[0];
 Object.defineProperty(viewport,'clientWidth',{get(){throw Error('forced layout');}});
 f.resize(190.3,146,{inlineSize:200.3,blockSize:150});
 assert.equal(stage.style.transform,'scale(1.41)');assert.equal(stage.style.left,'29.5px');assert.equal(stage.style.top,'4.5px');assert.equal(f.stats().styles,0);
 f.resize(90,96,{inlineSize:100,blockSize:100});assert.equal(stage.style.transform,'scale(0.94)');assert.equal(f.stats().styles,0);
 f.finish();await job;f.close();
});
