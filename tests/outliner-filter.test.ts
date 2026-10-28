import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeFormat,nodeFormats,matchesFilter} from '../vendor/outliner/src/filter.ts';
test('portal and vision identities take precedence over backing file or group',()=>{
 assert.equal(nodeFormat({type:'file',file:'nested.canvas',canvasPortalRef:{id:'p'}},true),'linked-portal');
 assert.equal(nodeFormat({type:'text',canvasPortalRef:{id:'p'}}),'portal');
 assert.equal(nodeFormat({type:'group'},false,true),'vision');
 assert.equal(nodeFormat({type:'file',file:'Note.MD'}),'markdown');
 assert.equal(nodeFormat({type:'text'}),'card');
 assert.equal(nodeFormat({type:'file',file:'recording.opus'}),'audio');
 assert.equal(nodeFormat({type:'file',file:'archive.zip'}),'file');
});
test('type and exact label filters intersect without confusing partial labels',()=>{
 const f={types:new Set(['card']),labels:new Set(['검증'])};
 assert.equal(matchesFilter('card',' 검증 ',f),true);
 assert.equal(matchesFilter('card','검증 완료',f),false);
 assert.equal(matchesFilter('image','검증',f),false);
 f.labels.clear();assert.equal(matchesFilter('card','',f),true);
 f.types.clear();assert.equal(matchesFilter('card','검증',f),false);
 assert.equal(new Set(nodeFormats.map(x=>x[0])).size,nodeFormats.length);
});
