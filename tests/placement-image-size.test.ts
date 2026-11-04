import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

function fixture(loaded:any[]=[]){
 class TFile {path='photo.svg';stat={mtime:1,size:99};}
 const file=new TFile(),images:any[]=[],timers=new Map<number,()=>void>();let next=0,queries=0,changes=0;
 class Image {onload:any;onerror:any;src='';naturalWidth=0;naturalHeight=0;constructor(){images.push(this);}removeAttribute(){this.src='';}}
 const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('src/placement-image-size.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:()=>({TFile}),Image,document:{querySelectorAll(){queries++;return loaded;}},setTimeout(fn:()=>void){const id=++next;timers.set(id,fn);return id;},clearTimeout(id:number){timers.delete(id);},console});
 const app={vault:{getAbstractFileByPath:()=>file,getResourcePath:()=> 'app://local/photo.svg?mtime=1'}};
 const item=(id='a')=>({id,type:'image',origin:{filePath:file.path}});
 return {file,images,timers,item,fit:module.exports.fittedImageSize,begin:(items:any[]=[item()])=>module.exports.preparePlacementImages(app,items,()=>changes++),stats:()=>({queries,changes})};
}
test('loaded thumbnail dimensions are reused without decoding or one DOM scan per item',async()=>{
 const f=fixture([{complete:true,naturalWidth:640,naturalHeight:420,currentSrc:'app://local/photo.svg?mtime=1'}]);const p=f.begin([f.item('a'),f.item('b')]);assert.equal(p.ready,true);await p.done;assert.equal(f.images.length,0);assert.equal(f.stats().queries,1);assert.deepEqual({...f.fit(360,240,p.sizes.get('a'))},{width:360,height:236});assert.deepEqual({...f.fit(360,240,{width:200,height:800})},{width:60,height:240});assert.equal(p.valid(),true);f.file.stat.mtime++;assert.equal(p.valid(),false);p.dispose();
});
test('cold image resolves its real dimensions and releases temporary handlers',async()=>{
 const f=fixture(),p=f.begin(),img=f.images[0];assert.equal(p.ready,false);img.naturalWidth=640;img.naturalHeight=420;img.onload();await p.done;assert.equal(p.ready,true);assert.equal(p.sizes.get('a').height,420);assert.equal(img.onload,null);assert.equal(img.onerror,null);assert.equal(f.timers.size,0);p.dispose();assert.equal(img.src,'');
});
test('cancel releases a cold image and settles the pending operation without callback or stale size',async()=>{
 const f=fixture(),p=f.begin(),img=f.images[0];p.dispose();await p.done;assert.equal(p.ready,true);assert.equal(p.sizes.size,0);assert.equal(f.stats().changes,0);assert.equal(img.onload,null);assert.equal(img.src,'');assert.equal(f.timers.size,0);
});
test('timeout remains a failure even when drop starts after preparation settled',async()=>{
 const f=fixture(),p=f.begin();[...f.timers.values()][0]();await assert.rejects(p.done,/이미지 크기/);assert.equal(p.ready,true);assert.match(p.failure.message,/취소/);p.dispose();
});
test('group and portal snapshots are not refitted as single image defaults',()=>{
 const f=fixture(),p=f.begin([{...f.item(),group:{nodes:[]}},{...f.item('b'),uctPortal:{}}]);assert.equal(p.ready,true);assert.equal(f.images.length,0);assert.equal(f.stats().queries,0);p.dispose();
});
