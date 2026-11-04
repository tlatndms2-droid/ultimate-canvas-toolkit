import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build,transformSync} from 'esbuild';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

type Listener={fn:(event:any)=>void;capture:boolean;once:boolean};
class Target {
 listeners=new Map<string,Listener[]>();parentNode:Target|null=null;
 addEventListener(type:string,fn:(event:any)=>void,options:any=false){const capture=typeof options==='boolean'?options:!!options.capture;this.listeners.set(type,[...(this.listeners.get(type)??[]),{fn,capture,once:!!options?.once}]);}
 removeEventListener(type:string,fn:(event:any)=>void,options:any=false){const capture=typeof options==='boolean'?options:!!options.capture;this.listeners.set(type,(this.listeners.get(type)??[]).filter(l=>l.fn!==fn||l.capture!==capture));}
}
class Document extends Target {
 body:Element;activeElement:Element;
 constructor(){super();this.body=new Element(this,'body');this.body.parentNode=this;this.activeElement=this.body;}
}
class Element extends Target {
 children:Element[]=[];attributes=new Map<string,string>();value='';className='';textContent='';
 style={setProperty(){}};
 ownerDocument:Document;tagName:string;
 constructor(ownerDocument:Document,tagName:string){super();this.ownerDocument=ownerDocument;this.tagName=tagName;}
 get parentElement():Element|null{return this.parentNode instanceof Element?this.parentNode:null;}
 get isConnected():boolean{return this===this.ownerDocument.body||!!this.parentNode&&(this.parentNode===this.ownerDocument||this.parentNode instanceof Element&&this.parentNode.isConnected);}
 contains(node:unknown):boolean{return this===node||this.children.some(child=>child.contains(node));}
 createEl(tag:string,options:any={}){const child=new Element(this.ownerDocument,tag);child.className=options.cls??'';child.value=options.value??'';child.textContent=options.text??'';for(const[k,v]of Object.entries(options.attr??{}))child.setAttribute(k,String(v));child.parentNode=this;this.children.push(child);return child;}
 createDiv(options:any={}){return this.createEl('div',options);}
 setAttribute(key:string,value:string){this.attributes.set(key,value);}
 getAttribute(key:string){return this.attributes.get(key)??null;}
 toggleClass(cls:string,on:boolean){const values=new Set(this.className.split(/\s+/).filter(Boolean));on?values.add(cls):values.delete(cls);this.className=[...values].join(' ');}
 remove(){if(this.contains(this.ownerDocument.activeElement))this.ownerDocument.activeElement=this.ownerDocument.body;if(this.parentNode instanceof Element)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);this.parentNode=null;}
 empty(){for(const child of [...this.children])child.remove();}
 focus(){if(this.isConnected)this.ownerDocument.activeElement=this;}
 select(){}
 matches(selector:string){const attr=/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/.exec(selector);if(attr&&(this.getAttribute(attr[1])===null||attr[2]!==undefined&&this.getAttribute(attr[1])!==attr[2]))return false;for(const cls of selector.matchAll(/\.([\w-]+)/g))if(!this.className.split(/\s+/).includes(cls[1]))return false;const tag=/^[a-z]+/i.exec(selector);return !tag||this.tagName.toLowerCase()===tag[0].toLowerCase();}
 closest(selector:string):Element|null{for(let element:Element|null=this;element;element=element.parentElement)if(selector.split(',').some(part=>element!.matches(part.trim())))return element;return null;}
 querySelector(selector:string):Element|null{for(const child of this.children){if(child.matches(selector))return child;const nested=child.querySelector(selector);if(nested)return nested;}return null;}
}
function emit(target:Target,type:string,extra:any={}){
 const event={type,target,currentTarget:null as Target|null,isComposing:false,repeat:false,altKey:false,ctrlKey:false,shiftKey:false,metaKey:false,code:'',prevented:false,stopped:false,immediate:false,...extra,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;this.immediate=true;}};
 const path:Target[]=[];for(let current:Target|null=target;current;current=current.parentNode)path.push(current);
 const invoke=(current:Target,capture:boolean)=>{event.currentTarget=current;for(const listener of [...(current.listeners.get(type)??[])]){if(listener.capture!==capture)continue;listener.fn(event);if(listener.once)current.removeEventListener(type,listener.fn,capture);if(event.immediate)break;}};
 for(const current of [...path].reverse()){invoke(current,true);if(event.stopped)return event;}
 for(const current of path){invoke(current,false);if(event.stopped)break;}
 return event;
}
async function fixture(showColors=false){
 const document=new Document(),window=new Target(),module={exports:{} as any};document.parentNode=window;
 const built=await build({entryPoints:['src/metadata-editor.ts'],bundle:true,platform:'node',format:'cjs',write:false});
 vm.runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,document,HTMLElement:Element,Node:Element,console,Date});
 const wrapper=document.body.createDiv(),nodeEl=wrapper.createDiv(),view={file:{path:'background.canvas'},canvas:{readonly:false,wrapperEl:wrapper,selection:new Set<any>()}},node={id:'node',nodeEl,getData:()=>({type:'text'})};view.canvas.selection.add(node);
 const original={label:'기존 라벨',labelColor:'#7c3aed',caption:'배경 포탈 캡션',modifiedAt:1},writes:any[]=[],metadataArgs:any[][]=[];
 let refreshes=0,canvasKeys=0,canvasEditors=0,canvasLookups=0,compositionToggles=0;
 const root={register(){},spaceKey:(path:string,target:any)=>{assert.equal(target,view);return path+'#uct-portal:background';},metadata:(...args:any[])=>{metadataArgs.push(args);assert.equal(args[2],view);return original;},
  palette:{store:{data:{canvasNodeMetadata:{},settings:{labelColorPresets:[]}},setMetadataRecord:(...args:any[])=>writes.push(args),changed(){},addLabelColorPreset(){}}},modules:{outliner:{refresh(){refreshes++;}},mindmap:{panels:{key(){canvasKeys++;return false;}}},editor:{editorManager:{openNode(){canvasEditors++;}}}},
  composition:{opened:false,toggle(){compositionToggles++;}},canvasView:()=>{canvasLookups++;return view;},app:{workspace:{getMostRecentLeaf:()=>({view})}}};
 const pluginModule={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('src/main.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module:pluginModule,exports:pluginModule.exports,document,HTMLElement:Element,console,require:(id:string)=>id==='obsidian'?{Plugin:class{},PluginSettingTab:class{}}:{}});
 Object.setPrototypeOf(root,pluginModule.exports.default.prototype);
 const editor=new module.exports.MetadataEditor(root);Object.assign(root,{metadataEditor:editor});
 window.addEventListener('keydown',event=>(root as any).key(event),true);
 editor.label(view,node,showColors);
 const host=nodeEl.children[0],input=host.querySelector('input')!;
 return {document,window,nodeEl,view,original,host,input,writes,metadataArgs,editor,refreshes:()=>refreshes,canvasCalls:()=>({canvasKeys,canvasEditors,canvasLookups,compositionToggles})};
}

test('label fallback keeps its owning Canvas view and preserves embedded caption when only the label changes',async()=>{
 const f=await fixture();assert.equal(f.metadataArgs.length,1);assert.equal(f.input.value,'기존 라벨');
 f.input.value='새 이름';emit(f.input,'keydown',{key:'Enter'});
 assert.equal(f.writes.length,1);assert.equal(f.writes[0][0],'background.canvas#uct-portal:background');assert.equal(f.writes[0][2].caption,f.original.caption);assert.equal(f.writes[0][2].label,'새 이름');assert.equal(f.host.isConnected,false);assert.equal(f.refreshes(),1);
});

test('label controls keep pointer and click events inside the editor instead of bubbling to Canvas',async()=>{
 const f=await fixture(true),leaked:string[]=[];
 for(const type of ['pointerdown','mousedown','click','dblclick'])f.nodeEl.addEventListener(type,()=>leaked.push(type));
 for(const type of ['pointerdown','mousedown','click','dblclick'])emit(f.input,type);
 assert.deepEqual(leaked,[]);assert.equal(f.writes.length,0);
 emit(f.input,'keydown',{key:'Escape'});
});

test('choosing a label swatch restores focus to its replacement so Enter commits instead of opening a Canvas editor',async()=>{
 const f=await fixture(true);let canvasEnters=0;
 f.document.body.addEventListener('keydown',event=>{if(event.key==='Enter')canvasEnters++;});
 const orange=f.host.querySelector('[aria-label="Label color #f97300"]')!;assert.ok(orange);orange.focus();emit(orange,'click');
 const focused=f.document.activeElement;assert.notEqual(focused,orange);assert.equal(focused.getAttribute('aria-label'),'Label color #f97300');assert.equal(f.host.contains(focused),true);
 emit(focused,'keydown',{key:'Enter'});
 assert.equal(canvasEnters,0);assert.equal(f.writes.length,1);assert.equal(f.writes[0][2].labelColor,'#f97300');assert.equal(f.writes[0][2].caption,f.original.caption);assert.equal(f.host.isConnected,false);
 assert.deepEqual(f.canvasCalls(),{canvasKeys:0,canvasEditors:0,canvasLookups:0,compositionToggles:0});
});

test('window capture delegates label typing and IME to the label editor before any Canvas shortcut handler',async()=>{
 const f=await fixture(true);
 const typing=emit(f.input,'keydown',{key:'가'});assert.equal(typing.prevented,false);assert.equal(typing.immediate,true);
 const compositionEnter=emit(f.input,'keydown',{key:'Enter',isComposing:true});assert.equal(compositionEnter.prevented,false);assert.equal(compositionEnter.immediate,true);
 assert.equal(f.host.isConnected,true);assert.equal(f.writes.length,0);
 assert.deepEqual(f.canvasCalls(),{canvasKeys:0,canvasEditors:0,canvasLookups:0,compositionToggles:0});
 emit(f.input,'keydown',{key:'Escape'});
});

test('window capture Escape cancels the current label without saving or invoking a Canvas editor',async()=>{
 const f=await fixture(true);f.input.value='취소할 이름';
 const escape=emit(f.input,'keydown',{key:'Escape'});
 assert.equal(escape.prevented,true);assert.equal(escape.immediate,true);assert.equal(f.host.isConnected,false);assert.equal(f.writes.length,0);assert.equal(f.refreshes(),0);
 assert.equal(f.document.activeElement,f.view.canvas.wrapperEl);
 assert.deepEqual(f.canvasCalls(),{canvasKeys:0,canvasEditors:0,canvasLookups:0,compositionToggles:0});
});

test('the root capture handler and label fallback cannot commit the same Enter event twice',async()=>{
 const f=await fixture(true),fallback=[...(f.host.listeners.get('keydown')??[])];
 const enter=emit(f.input,'keydown',{key:'Enter'});
 assert.equal(enter.prevented,true);assert.equal(f.writes.length,1);assert.equal(f.refreshes(),1);
 // Even a second delivery through the retained host fallback must be idempotent.
 for(const listener of fallback)listener.fn(enter);
 assert.equal(f.writes.length,1);assert.equal(f.refreshes(),1);assert.equal(f.editor.handleKey(enter),false);
 assert.deepEqual(f.canvasCalls(),{canvasKeys:0,canvasEditors:0,canvasLookups:0,compositionToggles:0});
});
