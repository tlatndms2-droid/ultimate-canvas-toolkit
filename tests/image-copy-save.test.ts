import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

test('image export snapshots the selected folder before asynchronous copies outlive the remote dialog result',async()=>{
 let expired=false,folderReads=0;
 const folder='C:\\chosen destination';
 const copies:Array<{source:string;folder:string}>=[],notices:string[]=[];
 class Adapter {getFullPath(file:string){return path.join('C:\\fixture-vault',file);}}
 class File {path:string;constructor(filePath:string){this.path=filePath;}}
 const files=new Map(['first.png','second.png'].map(name=>[name,new File(name)]));
 const result={canceled:false,get filePaths(){folderReads++;if(expired)throw Error('Object has been destroyed');return [folder];}};
 const module={exports:{} as any};
 vm.runInNewContext(transformSync(readFileSync('vendor/image-copy/src/main.ts','utf8'),{loader:'ts',format:'cjs'}).code,{
  module,exports:module.exports,console,process:{platform:'win32'},
  require:(id:string)=>{
   if(id==='obsidian')return {Plugin:class{},TFile:File,FileSystemAdapter:Adapter,Notice:class{constructor(text:string){notices.push(text);}}};
   if(id==='node:path')return path;
   if(id==='node:fs/promises')return {access:async()=>{}};
   if(id==='node:child_process')return {};
   if(id==='@electron/remote')return {dialog:{showOpenDialog:async()=>result}};
   if(id==='./files')return {isImage:(name:string)=>name.endsWith('.png'),copyWithoutOverwrite:async(source:string,target:string)=>{
    assert.equal(typeof target,'string');
    copies.push({source,folder:target});
    await Promise.resolve();
    // The next copy must use an owned string, not revisit the remote result.
    expired=true;
   }};
   throw Error('Unexpected dependency: '+id);
  },
 });
 const plugin=Object.create(module.exports.default.prototype);
 plugin.app={vault:{adapter:new Adapter(),getAbstractFileByPath:(name:string)=>files.get(name)}};
 const canvas={selection:new Set([...files.keys()].map(file=>({getData:()=>({type:'file',file})})))};
 await plugin.run('save',canvas);
 assert.deepEqual(copies,[{source:path.join('C:\\fixture-vault','first.png'),folder},{source:path.join('C:\\fixture-vault','second.png'),folder}]);
 assert.equal(folderReads,1);
 assert.equal(plugin.busy,false);
 assert.deepEqual(notices,['이미지 2개를 선택한 폴더에 저장했습니다']);
});
