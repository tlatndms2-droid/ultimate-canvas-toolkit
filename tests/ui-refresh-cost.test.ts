import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {transformSync} from 'esbuild';import vm from 'node:vm';
function load(file:string,globals:any={}){const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:()=>({}),console,...globals});return module.exports;}
test('Mini changes layout immediately without replacing thumbnails or waiting for persistence',async()=>{
 const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype);let release!:()=>void,renders=0;const saving=new Promise<void>(r=>release=r),classes=new Set(['is-grid']);const area={toggleClass:(key:string,on:boolean)=>on?classes.add(key):classes.delete(key)};
 const buttons=['카드 보기','목록 보기'].map(label=>({label,active:false,pressed:'',getAttribute:()=>label,toggleClass(_key:string,on:boolean){this.active=on},setAttribute(_key:string,value:string){this.pressed=value}}));
 m.root={library:{ui:{mode:'grid',open:true},items:{a:{id:'a'}},folders:[]},palette:{},placement:{active:false},saveLibrary:()=>saving};m.panel={isConnected:true,querySelector:()=>area,querySelectorAll:()=>buttons};m.renderedItems=new Map([['a',JSON.stringify({id:'a'})]]);m.render=()=>renders++;m.renderedShell=m.renderShell();
 m.setViewMode('list');assert(classes.has('is-list'));assert(!classes.has('is-grid'));assert.equal(buttons[1].pressed,'true');assert.equal(buttons[0].active,false);assert.equal(renders,0);release();await saving;m.refresh();assert.equal(renders,0,'save completion preserves existing thumbnail DOM');delete m.root.library.items.a;m.refresh();assert.equal(renders,1,'an unrelated removal still refreshes');
});
test('native editor coalesces resize work and cancels it when detached',()=>{
 const Editor=load('vendor/visibility/src/editor/native-markdown-editor.ts').NativeMarkdownEditor,e=Object.create(Editor.prototype);let callback:any,reinit=0,cancelled=0;const win={requestAnimationFrame(fn:any){callback=fn;return 1},cancelAnimationFrame(){cancelled++}};
 e.view={editMode:{reinit(){reinit++}}};e.split={containerEl:{ownerDocument:{defaultView:win},remove(){}}};e.abort=new AbortController();e.measureFrame=0;
 e.remeasure();e.remeasure();assert.equal(reinit,0);callback();assert.equal(reinit,1);e.remeasure();e.detach();assert.equal(cancelled,1);callback();assert.equal(reinit,1,'detached editor must not reinitialize');
});

test('Mini mode change does not acknowledge a folder rename waiting for persistence',()=>{
 const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype);let renders=0;
 m.root={library:{ui:{mode:'grid',open:true},items:{},folders:[{id:'folder',name:'old'}]},saveLibrary:async()=>{}};m.panel={isConnected:true,querySelector:()=>({toggleClass(){}})};m.renderedItems=new Map();m.renderedShell=m.renderShell();m.render=()=>renders++;
 m.root.library.folders[0].name='new';m.setViewMode('list');assert.equal(renders,1,'pending non-mode changes must be rendered');
});
test('search narrowing and clearing reuse cards while an unseen result falls back to rendering',()=>{
 const Mini=load('src/mini.ts').UctMini,m=Object.create(Mini.prototype),a={id:'a'},b={id:'b'},c={id:'c'};let renders=0,total='';const cards=[a,b].map(item=>({dataset:{id:item.id},style:{display:''},querySelector:()=>null}));const area={querySelectorAll:()=>cards,querySelector:()=>null,createDiv(){}};
 m.root={library:{ui:{open:true},items:{a,b,c},folders:[]}};m.panel={isConnected:true,querySelector:(q:string)=>q==='.uct-item-area'?area:q==='.uct-item-total'?{setText(t:string){total=t}}:null};m.query='';m.global=false;m.list=()=>m.query==='a'?[a]:m.query==='c'?[c]:[a,b];m.render=()=>renders++;m.renderedItems=new Map(Object.entries(m.root.library.items).map(([id,item])=>[id,JSON.stringify(item)]));m.renderedShell=m.renderShell();
 m.setSearchQuery('a');assert.equal(cards[1].style.display,'none');assert.equal(total,'1개 자료');m.setSearchQuery('');assert.equal(cards[1].style.display,'');assert.equal(total,'2개 자료');assert.equal(renders,0);m.setSearchQuery('c');assert.equal(renders,1);
});