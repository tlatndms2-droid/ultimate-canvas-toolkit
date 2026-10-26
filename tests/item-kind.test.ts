import test from 'node:test';
import assert from 'node:assert/strict';
import {itemKind} from '../src/item-kind.ts';
const base:any={id:'i',displayTitle:'title',folderId:null,origin:{},createdAt:1,modifiedAt:1};
test('legacy markdown storage type distinguishes PDF and actual Markdown',()=>{assert.equal(itemKind({...base,type:'markdown',origin:{filePath:'test.pdf'}}).label,'PDF');assert.equal(itemKind({...base,type:'markdown',origin:{filePath:'note.md'}}).label,'Markdown');assert.equal(itemKind({...base,type:'card'}).label,'카드');});
test('virtual portal containing a link portal is still a virtual portal',()=>{const transfer:any={nodes:[{canvasPortalRef:{role:'entry',id:'outer'}}],canvasPortalTransfer:{portals:{outer:{type:'select'},inner:{type:'link'}}}};assert.equal(itemKind({...base,uctPortal:{transfer,independent:true}}).label,'포탈');transfer.canvasPortalTransfer.portals.outer.type='link';assert.equal(itemKind({...base,uctPortal:{transfer,independent:true}}).label,'링크 포탈');});
test('display classification does not change stored data or call a bundle a mindmap',()=>{const item={...base,type:'group',origin:{filePath:'note.md'}};const before=JSON.stringify(item);assert.equal(itemKind(item).label,'묶음');assert.equal(JSON.stringify(item),before);});
