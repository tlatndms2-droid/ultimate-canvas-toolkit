import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';

function fixture(){
 const exports={},badges:any[]=[],document={querySelector:(s:string)=>s==='.menu'?{}:null,querySelectorAll:(s:string)=>s==='[data-cm-key]'?badges:[]};
 const context={exports,module:{exports},document,require:(s:string)=>s==='obsidian'?{Plugin:class{},PluginSettingTab:class{}}:{}};
 vm.runInNewContext(transformSync(readFileSync('vendor/mindmap/src/main.ts','utf8'),{loader:'ts',format:'cjs'}).code,context);
 const module=Object.create((context.module.exports as any).default.prototype),node={id:'a',isEditing:false},c={selection:new Set([node]),nodes:new Map([['a',node]]),wrapperEl:{querySelector(){return null;}}};
 let reads=0;const button={dataset:{} as Record<string,string>};module.toolbarButtons=()=>{reads++;return [button];};
 return {module,c,badges,button,reads:()=>reads};
}
test('Mindmap idle maintenance does not force toolbar layout; stale badges are cleared',()=>{
 const f=fixture(),old={dataset:{cmKey:'1'}};f.badges.push(old);
 for(let i=0;i<100;i++)f.module.updateCardKeys(f.c);
 assert.equal(f.reads(),0);assert.equal(old.dataset.cmKey,undefined);
});
test('Mindmap keyboard toolbar still displays badges and clears them when selection changes',()=>{
 const f=fixture();f.module.toolbarSession={c:f.c,selection:'a'};f.module.updateCardKeys(f.c);
 assert.equal(f.reads(),1);assert.equal(f.button.dataset.cmKey,'1');
 f.badges.push(f.button);f.c.selection.clear();f.module.updateCardKeys(f.c);
 assert.equal(f.reads(),1);assert.equal(f.button.dataset.cmKey,undefined);assert.equal(f.module.toolbarSession,null);
});
