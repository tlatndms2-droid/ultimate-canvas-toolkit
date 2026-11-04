import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

class Element {
  field=false;isConnected=true;style={};paused=true;plays=0;pauses=0;currentTime=10;duration=100;volume=.5;playbackRate=1;
  children:Element[]=[];listeners=new Map<string,Function[]>();
  closest(){return this.field?this:null;}
  createDiv(){return this.createEl('div');}
  createSpan(){return this.createEl('span');}
  createEl(_tag:string,_options?:any){const e=new Element();this.children.push(e);return e;}
  addEventListener(type:string,fn:Function){this.listeners.set(type,[...(this.listeners.get(type)??[]),fn]);}
  setAttribute(){}removeAttribute(){}setText(){}focus(){}load(){}remove(){this.isConnected=false;}
  play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.pauses++;this.paused=true;}
}
function load(path:string,extra:any={}){
  const exports={};const context={exports,module:{exports},console,AbortController,HTMLElement:Element,...extra,
    require:(name:string)=>name==='obsidian'?{Plugin:class{},PluginSettingTab:class{},TFile:class{},Scope:extra.Scope,setIcon(){}}:{}};
  vm.runInNewContext(transformSync(readFileSync(resolve(path),'utf8'),{loader:'ts',format:'cjs'}).code,context);
  return context.module.exports as any;
}
function event(key:string,extra:any={}){return {key,code:'',altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,repeat:false,isComposing:false,prevented:0,stopped:0,preventDefault(){this.prevented++;},stopImmediatePropagation(){this.stopped++;},...extra};}
function canvasFixture(){
  const body=new Element(),target=new Element(),media=new Element();
  const Plugin=load('src/main.ts',{document:{body}}).default;
  const p=Object.create(Plugin.prototype),node={getData:()=>({type:'text'}),nodeEl:{querySelector:()=>media}},view={canvas:{selection:new Set([node]),wrapperEl:{contains:(e:any)=>e===target}}};
  let labels=0,captions=0;
  Object.assign(p,{modules:{},composition:{opened:false},app:{workspace:{getMostRecentLeaf:()=>({view})}},canvasView:()=>view,editLabel:()=>labels++,editCaption:()=>captions++});
  return {p,target,body,media,counts:()=>[labels,captions]};
}
test('Canvas key-only Alt+L/C and Space invoke once, including matching code',()=>{
  const f=canvasFixture();
  for(const code of ['', 'KeyL']){const e=event('l',{code,altKey:true,target:f.target});f.p.key(e);assert.equal(e.stopped,1);}
  f.p.key(event('C',{altKey:true,target:f.target}));assert.deepEqual(f.counts(),[2,1]);
  for(const code of ['', 'Space']){const e=event(' ',{code,target:f.target});f.p.key(e);assert.equal(e.prevented,1);}
  assert.equal(f.media.plays,1);assert.equal(f.media.pauses,1);
});
test('Canvas fallback does not claim editing fields, unrelated surfaces, IME, repeats or modified Space',()=>{
  const f=canvasFixture(),input=new Element();input.field=true;
  for(const options of [{target:input},{target:new Element()},{target:f.target,isComposing:true},{target:f.target,repeat:true}]){
    for(const [key,altKey] of [['l',true],[' ',false]] as const){const e=event(key,{altKey,...options});f.p.key(e);assert.equal(e.prevented,0);}
  }
  for(const modifier of ['altKey','ctrlKey','shiftKey','metaKey']){const e=event(' ',{target:f.target,[modifier]:true});f.p.key(e);assert.equal(e.prevented,0);}
  assert.deepEqual(f.counts(),[0,0]);assert.equal(f.media.plays,0);
});
test('Actual media handler supports key-only play/rate, guards modifiers/repeats, and closes from controls',()=>{
  let scope:any,domKey:Function=()=>{};class Scope {keys=new Map<string,Function>();constructor(){scope=this;}register(_mods:any,key:string,fn:Function){this.keys.set(key,fn);}}
  const body=new Element(),previous=new Element(),win={addEventListener:(type:string,fn:Function)=>{if(type==='keydown')domKey=fn;}};
  const Media=load('src/media.ts',{Scope,window:win,document:{body,activeElement:previous}}).MediaPreview;
  let pops=0;const root={previewWindows:new Set(),app:{scope:{},keymap:{pushScope(){},popScope(){pops++;}}}};
  const preview=new Media(root);preview.open('sample','video','sample');
  const overlay=body.children[0],media=overlay.children[0],control=overlay.children[1].children[0];
  const space=event(' ',{target:control});assert.equal(scope.keys.get(' ')(space),false);assert.equal(media.plays,1);assert.equal(space.stopped,1);
  // Obsidian consumes the returned false; a handled Scope event must not be dispatched again.
  domKey(event(' ',{target:control,repeat:true}));assert.equal(media.pauses,0);
  domKey(event('.', {altKey:true,target:control}));assert.equal(media.playbackRate,1.25);
  domKey(event(',', {altKey:true,target:control}));assert.equal(media.playbackRate,1);
  domKey(event('.', {target:control}));domKey(event(' ', {ctrlKey:true,target:control}));domKey(event(' ', {isComposing:true,target:control}));assert.equal(media.playbackRate,1);assert.equal(media.plays,1);
  domKey(event(' ',{code:'Space',target:control}));assert.equal(media.pauses,1);
  domKey(event('Escape',{target:control}));assert.equal(overlay.isConnected,false);assert.equal(root.previewWindows.size,0);assert.equal(pops,1);
});
