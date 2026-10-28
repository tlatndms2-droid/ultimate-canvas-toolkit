import {test} from 'node:test';
import assert from 'node:assert/strict';
import {characterCount,mapRegion} from '../src/composition-model.ts';
test('count excludes whitespace and counts complete Korean and emoji characters',()=>{assert.equal(characterCount('오늘은 글을 씁니다'),8);assert.equal(characterCount('가\n 나\t👩‍💻'),3);});
test('image paper region follows contain geometry and remains visible with cover',()=>{
 const r={x:.15,y:.15,width:.7,height:.7};
 assert.deepEqual(mapRegion(r,1536,1024,1536,1024,'contain'),{x:230.39999999999998,y:153.6,width:1075.1999999999998,height:716.8});
 for(const fit of ['contain','cover'] as const){const p=mapRegion(r,500,900,1536,1024,fit);assert.ok(p.x>=12&&p.y>=12);assert.ok(p.x+p.width<=488.001&&p.y+p.height<=888.001);assert.ok(p.width>0&&p.height>0);}
});
