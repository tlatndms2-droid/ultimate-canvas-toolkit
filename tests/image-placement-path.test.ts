import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';

test('image placement resolves legacy source path and keeps missing files unplaced',()=>{
 class TFile {path:string;constructor(path:string){this.path=path;}}
 const files=new Map([['material/image.png',new TFile('material/image.png')],['material/original.png',new TFile('material/original.png')]]);
 const module={exports:{} as any};
 const code=transformSync(readFileSync('vendor/palette/src/canvas/canvas-adapter.ts','utf8'),{loader:'ts',format:'cjs'}).code;
 vm.runInNewContext(code,{module,exports:module.exports,require:(id:string)=>id==='obsidian'?{TFile}:{SerialTaskQueue:class{}} ,console,URL});
 const adapter=new module.exports.CanvasAdapter({vault:{getAbstractFileByPath:(path:string)=>files.get(path)}},()=>{},()=>{},()=>{});
 adapter.itemNodeSize=()=>({width:360,height:240});
 const restore=(origin:any,sourceReferencePath:string)=>adapter.restoreNodeForItem({type:'image',displayTitle:'image',origin,sourceReferencePath},0,0,()=> 'id');
 assert.equal(restore({},'material/image.png').node.file,'material/image.png');
 assert.equal(restore({filePath:'material/original.png'},'material/image.png').node.file,'material/original.png');
 assert.equal(restore({},'material/missing.png').node,null);
});
