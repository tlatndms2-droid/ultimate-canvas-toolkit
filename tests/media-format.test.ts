import {test} from 'node:test';
import assert from 'node:assert/strict';
import {albumArt,mediaKind} from '../src/media-format.ts';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
test('media formats resolve case and URL query without treating PDF as media',()=>{
 assert.equal(mediaKind('a.WEBM?v=2'),'video');assert.equal(mediaKind('a.FLAC'),'audio');assert.equal(mediaKind('a.svg#x'),'image');assert.equal(mediaKind('a.pdf'),null);
});

const arrayBuffer=(data:Buffer)=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength) as ArrayBuffer;
function coverAtom(){
 const data=Buffer.alloc(20);data.writeUInt32BE(20);data.write('data',4);data.writeUInt32BE(14,8);data.set([137,80,78,71],16);
 const covr=Buffer.alloc(8);covr.writeUInt32BE(28);covr.write('covr',4);
 return Buffer.concat([covr,data]);
}
test('M4A cover remains available while audio payloads are not treated as M4A metadata',()=>{
 const atom=coverAtom(),ftyp=Buffer.alloc(16);ftyp.writeUInt32BE(16);ftyp.write('ftypM4A ',4);
 const art=albumArt(arrayBuffer(Buffer.concat([ftyp,atom,Buffer.alloc(8)])));
 assert.equal(art?.mime,'image/png');assert.deepEqual(art?.data,new Uint8Array([137,80,78,71]));
 const id3=Buffer.alloc(10);id3.write('ID3');id3[3]=3;
 const flac=Buffer.from([102,76,97,67,128,0,0,0]);
 for(const header of [Buffer.from('RIFFxxxxWAVE'),Buffer.from('OggSxxxx'),id3,flac]){
  assert.equal(albumArt(arrayBuffer(Buffer.concat([header,Buffer.alloc(1024),atom,Buffer.alloc(8)]))),null);
 }
});
test('FLAC picture metadata still yields its cover',()=>{
 const mime=Buffer.from('image/png'),photo=Buffer.from([137,80,78,71]);
 const picture=Buffer.alloc(32+mime.length+photo.length);picture.writeUInt32BE(3,0);picture.writeUInt32BE(mime.length,4);mime.copy(picture,8);
 picture.writeUInt32BE(photo.length,28+mime.length);photo.copy(picture,32+mime.length);
 const header=Buffer.from([102,76,97,67,134,0,0,picture.length]);
 const art=albumArt(arrayBuffer(Buffer.concat([header,picture])));
 assert.equal(art?.mime,'image/png');assert.deepEqual(art?.data,new Uint8Array(photo));
});
test('ID3 embedded cover is extracted and truncated metadata safely rejected',()=>{
 const photo=Buffer.from([137,80,78,71,1,2,3]);
 const body=Buffer.concat([Buffer.from([0]),Buffer.from('image/png\0'),Buffer.from([3,0]),photo]);
 const frame=Buffer.alloc(10);frame.write('APIC');frame.writeUInt32BE(body.length,4);
 const head=Buffer.alloc(10);head.write('ID3');head[3]=3;head[9]=frame.length+body.length;
 const data=Buffer.concat([head,frame,body]);const input=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 const art=albumArt(input);assert.equal(art?.mime,'image/png');assert.deepEqual(art?.data,new Uint8Array(photo));assert.equal(albumArt(input.slice(0,23)),null);assert.equal(albumArt(new ArrayBuffer(0)),null);
});

test('Mini PDF preview does not render after closing while getPage is pending',async()=>{
 // Execute the actual preview method with a delayed PDF page, without opening Obsidian.
 class TFile{extension='pdf';}
 class Component{load(){}unload(){}}
 const exports={};const context={exports,module:{exports},require:()=>({TFile,Component}),console};
 vm.runInNewContext(transformSync(readFileSync(resolve('src/mini.ts'),'utf8'),{loader:'ts',format:'cjs'}).code,context);
 for(const close of [false,true]){
  let resolvePage!:(page:any)=>void,signalStarted!:()=>void;
  const pagePromise=new Promise(resolve=>resolvePage=resolve),started=new Promise<void>(resolve=>signalStarted=resolve);
  let renders=0,releases=0;
  const page={getViewport:()=>({width:1,height:1}),render:()=>{renders++;return {promise:Promise.resolve(),cancel(){}};}};
  const root={app:{vault:{getAbstractFileByPath:()=>new TFile()}},modules:{pdf:{pool:{acquire:()=>({release:()=>releases++,document:Promise.resolve({getPage:()=>{signalStarted();return pagePromise;}})})}}}};
  const mini=Object.create((context.module.exports as any).UctMini.prototype);Object.assign(mini,{root,generation:1,previewHosts:new Map()});
  const host={isConnected:true,querySelectorAll:()=>[],createEl:()=>({getContext:()=>({})}),setText:(message:string)=>assert.fail(message)};
  const pending=mini.preview(host,{id:'pdf',origin:{filePath:'sample.pdf'}},true,1);
  await started;
  if(close){host.isConnected=false;mini.generation++;mini.previewHosts.get(host)();}
  resolvePage(page);await pending;
  assert.equal(renders,close?0:1);assert.equal(releases,close?1:0);
 }
});
