import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outlinerSnapshot} from '../vendor/outliner/src/snapshot.ts';

test('Outliner snapshot excludes cached website HTML without changing Canvas data',()=>{
 const node={id:'web',type:'link',x:1,y:2,width:300,height:200,url:'https://example.com',websiteContent:'cached HTML'.repeat(10000),canvasPortalRef:{id:'portal'}};
 const doc={nodes:[node],edges:[{id:'edge',fromNode:'web',toNode:'other'}],canvasPortal:{preserve:true}};
 const before=JSON.stringify(doc),result=outlinerSnapshot(doc);
 assert.equal(JSON.stringify(doc),before);
 assert.equal('websiteContent' in result.nodes[0],false);
 assert.equal(result.nodes[0].url,node.url);
 assert.deepEqual(result.nodes[0].canvasPortalRef,node.canvasPortalRef);
 assert.deepEqual(result.edges,doc.edges);
 assert.deepEqual((result as any).canvasPortal,doc.canvasPortal);
 assert.deepEqual(outlinerSnapshot(result),result);
 assert.ok(JSON.stringify(result).length<JSON.stringify(doc).length/100);
});
