import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waitForActiveCanvasSave} from '../src/placement-save-wait.ts';

test('waits for active and queued Canvas saves and immediately continues when idle',async()=>{
 const view={saving:true,saveAgain:true};let waits=0;
 assert.equal(await waitForActiveCanvasSave(view,async()=>{if(++waits===2)view.saving=false;if(waits===3)view.saveAgain=false;}),true);
 assert.equal(waits,3);assert.equal(await waitForActiveCanvasSave(view,async()=>{throw Error('idle must not wait');}),true);
});
test('does not wait forever for a stuck Canvas save',async()=>{
 let clock=0,waits=0;const result=await waitForActiveCanvasSave({saving:true},async()=>{clock+=1000;waits++;},()=>clock);assert.equal(result,false);assert.equal(waits,30);
});
test('a slow but successful save can take more than two seconds',async()=>{
 let clock=0,waits=0;const view={saving:true};const result=await waitForActiveCanvasSave(view,async()=>{clock+=1000;if(++waits===16)view.saving=false;},()=>clock);assert.equal(result,true);assert.equal(waits,16);
});
