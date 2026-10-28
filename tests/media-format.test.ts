import {test} from 'node:test';
import assert from 'node:assert/strict';
import {albumArt,mediaKind} from '../src/media-format.ts';
test('media formats resolve case and URL query without treating PDF as media',()=>{
 assert.equal(mediaKind('a.WEBM?v=2'),'video');assert.equal(mediaKind('a.FLAC'),'audio');assert.equal(mediaKind('a.svg#x'),'image');assert.equal(mediaKind('a.pdf'),null);
});
test('ID3 embedded cover is extracted and truncated metadata safely rejected',()=>{
 const photo=Buffer.from([137,80,78,71,1,2,3]);
 const body=Buffer.concat([Buffer.from([0]),Buffer.from('image/png\0'),Buffer.from([3,0]),photo]);
 const frame=Buffer.alloc(10);frame.write('APIC');frame.writeUInt32BE(body.length,4);
 const head=Buffer.alloc(10);head.write('ID3');head[3]=3;head[9]=frame.length+body.length;
 const data=Buffer.concat([head,frame,body]);const input=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 const art=albumArt(input);assert.equal(art?.mime,'image/png');assert.deepEqual(art?.data,new Uint8Array(photo));assert.equal(albumArt(input.slice(0,23)),null);assert.equal(albumArt(new ArrayBuffer(0)),null);
});
