import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';
import {CanvasRuntime} from '../src/canvas-runtime.ts';
function plugin(){const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('src/main.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:(id:string)=>id==='obsidian'?{Plugin:class{},PluginSettingTab:class{}}:{},console});return Object.create(module.exports.default.prototype);}
test('session resolves the default Canvas once across multiple sessions and skips lookup for explicit views',()=>{
 const p=plugin(),view={getViewType:()=> 'canvas',canvas:{}};let lookups=0;p.canvasView=()=>{lookups++;return view;};const target={v:view};p.modules={portal:{sessions:new Map<any,any>([[{}, {v:{}}],[view,target]])}};
 p.canvasRuntime=new CanvasRuntime({activeLeaf:null,getLeavesOfType:()=>[]},()=>p.modules.portal.sessions,p.canvasView);
 assert.equal(p.session(),target);assert.equal(lookups,1);assert.equal(p.session(view),target);assert.equal(lookups,1);
});
test('background Canvas metadata uses its own portal space without consulting the foreground view',()=>{
 const p=plugin(),view={file:{path:'background.canvas'},canvas:{nodes:new Map()}},foreground={file:{path:'front.canvas'}};let lookups=0;
 p.canvasView=()=>{lookups++;return foreground;};const meta={caption:'background portal'};
 p.modules={portal:{sessions:new Map([[view,{v:view,current:'portal-b',root:{}}],[foreground,{v:foreground,current:'portal-a',root:{}}]])},palette:{store:{data:{canvasNodeMetadata:{'background.canvas#uct-portal:portal-b':{node:meta}}}}}};
 p.canvasRuntime=new CanvasRuntime({activeLeaf:null},()=>p.modules.portal.sessions,()=>null);
 assert.equal(p.metadata('background.canvas','node',view),meta);assert.equal(lookups,0);
 p.metadata('front.canvas','node');assert.equal(lookups,1);
});
test('embedded Canvas metadata remains visible without a separate Palette record',()=>{
 const p=plugin(),embedded={label:'portable',caption:'kept'},node={id:'card',uctMetadata:embedded};let reads=0;
 const view={file:{path:'test.canvas'},canvas:{nodes:new Map([['card',{getData:()=>{reads++;return node;}}]])}};
 p.canvasView=()=>view;p.session=()=>({v:view,current:null,root:{}});Object.defineProperty(p,'palette',{value:{store:{data:{canvasNodeMetadata:{}}}}});
 p.canvasRuntime=new CanvasRuntime({activeLeaf:null},()=>new Map([[view,{v:view,current:null,root:{}}]]),()=>null);
 assert.equal(p.metadata('test.canvas','card'),embedded);assert.equal(reads,1);assert.equal(p.metadata('other.canvas','card'),undefined);
 const override={label:'',caption:''};p.palette.store.data.canvasNodeMetadata['test.canvas']={card:override};assert.equal(p.metadata('test.canvas','card'),override);
 p.modules={outliner:{adapter:{view,file:view.file},renderAll(){},document:()=>({nodes:[node],edges:[]})}};p.enrichOutliner();
 assert.equal(p.modules.outliner.document().nodes[0].uctLabel,'');delete p.palette.store.data.canvasNodeMetadata['test.canvas'];
 const result=p.modules.outliner.document().nodes[0];assert.equal(result.uctLabel,'portable');assert.equal(result.uctCaption,'kept');assert.equal(node.uctMetadata,embedded);
});


test('Canvas body focus after native Escape still opens the small editor, but other views and editable fields do not',()=>{
 class Element{editable=false;closest(){return this.editable?this:null;}}
 const module={exports:{} as any},body=new Element();vm.runInNewContext(transformSync(readFileSync('src/main.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:(id:string)=>id==='obsidian'?{Plugin:class{},PluginSettingTab:class{}}:{},console,HTMLElement:Element,document:{body}});
 const p=Object.create(module.exports.default.prototype);let opened=0;const n={id:'n',isEditing:true,getData:()=>({type:'text'})};const view={canvas:{wrapperEl:{contains:()=>false},selection:new Set([n])}};let active:any=view;
 p.canvasView=()=>view;p.app={workspace:{get activeLeaf(){return {view:active}}}};p.modules={mindmap:{panels:{key:()=>false}},editor:{editorManager:{openNode(){opened++;}}}};
 const event=(target:any)=>({key:'Enter',code:'Enter',target,preventDefault(){},stopImmediatePropagation(){}});
 p.key(event(body));assert.equal(opened,1);active={};p.key(event(body));assert.equal(opened,1);active=view;body.editable=true;p.key(event(body));assert.equal(opened,1);
});
