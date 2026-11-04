import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {promises as fs} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {unzipSync,strFromU8} from 'fflate';
import {emptyLibrary,validateLibrary} from '../src/library.ts';

class File {path:string;name:string;extension:string;constructor(path:string){this.path=path;this.name=path.split('/').at(-1)!;this.extension=this.name.split('.').at(-1)!;}}
const bytes=(text:string)=>new TextEncoder().encode(text);
async function implementation(archive:string){
 const built=await build({entryPoints:['src/backup.ts'],bundle:true,platform:'node',format:'cjs',write:false,external:['obsidian','electron','@electron/remote']});
 const module={exports:{} as any};const dialog={showSaveDialog:async()=>({canceled:false,filePath:archive}),showOpenDialog:async()=>({canceled:false,filePaths:[archive]})};
 vm.runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,console,structuredClone,crypto:globalThis.crypto,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Date,setTimeout,clearTimeout,queueMicrotask,
  require:(id:string)=>id==='obsidian'?{TFile:File,Notice:class{},Modal:class{},Setting:class{}}:id==='electron'?{remote:{dialog}}:process.getBuiltinModule(id.replace(/^node:/,''))});
 return module.exports.MiniBackup;
}
function vault(initial:Record<string,string>={}){
 const entries=new Map(Object.entries(initial).map(([p,text])=>[p,{file:new File(p),data:bytes(text)}]));let next=0,saves=0;
 const root:any={library:emptyLibrary(),canvasView:()=>({file:{path:'fixture.canvas'}}),bindLibrary(){},saveLibrary:async()=>{saves++;if(root.failSave)throw Error('injected library save failure');},app:{
  fileManager:{getAvailablePathForAttachment:async(name:string)=>'restored/'+(++next)+'-'+name},
  metadataCache:{getFileCache:(f:File)=>f.path==='notes/note.md'?{embeds:[{link:'../assets/image.svg'}]}:{},getFirstLinkpathDest:()=>entries.get('assets/image.svg')?.file},
  vault:{getAbstractFileByPath:(p:string)=>entries.get(p)?.file??null,read:async(f:File)=>new TextDecoder().decode(entries.get(f.path)!.data),readBinary:async(f:File)=>entries.get(f.path)!.data.slice().buffer,
   createBinary:async(p:string,data:ArrayBuffer)=>{assert.equal(entries.has(p),false);const file=new File(p);entries.set(p,{file,data:new Uint8Array(data).slice()});return file;},
   modify:async(f:File,text:string)=>{entries.get(f.path)!.data=bytes(text);},delete:async(f:File)=>{entries.delete(f.path);}}
 }};
 return {root,entries,get saves(){return saves;}};
}
const originals={'assets/image.svg':'<svg>fixture</svg>','notes/note.md':'# Note\n![[../assets/image.svg]]','boards/linked.canvas':JSON.stringify({nodes:[{id:'md',type:'file',file:'notes/note.md'}],edges:[]})};
const item=(id:string,folderId:string|null,file:string)=>({id,folderId,displayTitle:id,type:'markdown',origin:{filePath:file},createdAt:1,modifiedAt:1});
async function archiveFixture(run:(Backup:any,archive:string,manifest:any)=>Promise<void>){
 const dir=await fs.mkdtemp(join(tmpdir(),'uct-backup-roundtrip-'));
 try{const archive=join(dir,'manual.zip'),Backup=await implementation(archive),source=vault(originals);source.root.library.folders.push({id:'parent',name:'Parent',parentId:null},{id:'child',name:'Child',parentId:'parent'});
  source.root.library.items.md=item('md',null,'notes/note.md');source.root.library.items.portal={...item('portal','child','boards/linked.canvas'),type:'group',uctPortal:{independent:true,transfer:{nodes:[{id:'entry',canvasPortalRef:{role:'entry',id:'p'}}],canvasPortalTransfer:{portals:{p:{type:'link',target:'boards/linked.canvas',graph:{nodes:[],edges:[]}}}}}}};
  const before=JSON.stringify(source.root.library);await new Backup(source.root).save();assert.equal(JSON.stringify(source.root.library),before);
  const packed=unzipSync(await fs.readFile(archive));assert.ok(packed['manifest.json']);const manifest=JSON.parse(strFromU8(packed['manifest.json']));assert.equal(manifest.assets.length,3);await run(Backup,archive,manifest);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
test('actual manual ZIP restores nested folders, required files and internal links without overwriting user files',()=>archiveFixture(async(Backup,archive)=>{
 const target=vault({'assets/image.svg':'user image','notes/note.md':'user note','boards/linked.canvas':'user canvas'});target.root.library.items.existing=item('existing',null,'notes/note.md');
 const originalsBefore=new Map([...target.entries].map(([p,e])=>[p,new TextDecoder().decode(e.data)]));const created:string[]=[];
 const recovery=await new Backup(target.root).restoreBytes(await fs.readFile(archive),created);assert.equal(created.length,3);validateLibrary(target.root.library);
 for(const[p,text]of originalsBefore)assert.equal(new TextDecoder().decode(target.entries.get(p)!.data),text);
 assert.ok(target.root.library.items.existing);const added:any[]=Object.values(target.root.library.items).filter((i:any)=>i.id!=='existing');assert.equal(added.length,2);
 const parent=target.root.library.folders.find((f:any)=>f.name==='Parent'),child=target.root.library.folders.find((f:any)=>f.name==='Child');assert.equal(parent.parentId,recovery);assert.equal(child.parentId,parent.id);
 const md=added.find(i=>i.type==='markdown'),portal=added.find(i=>i.uctPortal);assert.equal(portal.folderId,child.id);assert.equal(target.root.library.folders.find((f:any)=>f.id===md.folderId).name,'Collect');
 const canvasPath=portal.uctPortal.transfer.canvasPortalTransfer.portals.p.target;const canvas=JSON.parse(new TextDecoder().decode(target.entries.get(canvasPath)!.data));assert.equal(canvas.nodes[0].file,md.origin.filePath);
 const restoredMd=new TextDecoder().decode(target.entries.get(md.origin.filePath)!.data);assert.ok(!restoredMd.includes('../assets/image.svg'));assert.ok(created.some(p=>restoredMd.includes(p)&&p.endsWith('image.svg')));
}));
test('matching files are reused and restore failure cleans only newly created files while retaining the original library',()=>archiveFixture(async(Backup,archive)=>{
 const matching=vault(originals),created:string[]=[];await new Backup(matching.root).restoreBytes(await fs.readFile(archive),created);assert.equal(created.length,0);assert.equal(matching.entries.size,3);
 const failed=vault({'user.txt':'preserve'}),before=JSON.stringify(failed.root.library);failed.root.failSave=true;await new Backup(failed.root).restore();
 assert.equal(JSON.stringify(failed.root.library),before);assert.deepEqual([...failed.entries.keys()],['user.txt']);assert.equal(new TextDecoder().decode(failed.entries.get('user.txt')!.data),'preserve');
}));
test('unchanged parent files are copied when a restored child needs a new path',()=>archiveFixture(async(Backup,archive)=>{
 const target=vault({...originals,'assets/image.svg':'new user image'}),created:string[]=[];
 await new Backup(target.root).restoreBytes(await fs.readFile(archive),created);
 const added:any[]=Object.values(target.root.library.items),md=added.find(i=>i.type==='markdown'),portal=added.find(i=>i.uctPortal),canvasPath=portal.uctPortal.transfer.canvasPortalTransfer.portals.p.target;
 assert.notEqual(md.origin.filePath,'notes/note.md');assert.notEqual(canvasPath,'boards/linked.canvas');assert.equal(created.length,3);
 const canvas=JSON.parse(new TextDecoder().decode(target.entries.get(canvasPath)!.data));assert.equal(canvas.nodes[0].file,md.origin.filePath);
 const text=new TextDecoder().decode(target.entries.get(md.origin.filePath)!.data);assert.ok(created.some(p=>p.endsWith('image.svg')&&text.includes(p)));
 for(const [path,source]of Object.entries({...originals,'assets/image.svg':'new user image'}))assert.equal(new TextDecoder().decode(target.entries.get(path)!.data),source);
}));
