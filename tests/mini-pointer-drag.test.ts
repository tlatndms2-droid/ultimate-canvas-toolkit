import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginMiniPointerDrag} from '../src/mini-pointer-drag.ts';
function fixture(){
 const doc=new EventTarget(),card=Object.assign(new EventTarget(),{ownerDocument:doc,draggable:true});
 const calls:string[]=[];const placement={start(ids:string[]){calls.push('start:'+ids.join(','));},trackPointer(_event:any,finish=false){calls.push(finish?'drop':'move');},cancel(){calls.push('cancel');}};
 const event=(type:string,props:any={})=>Object.assign(new Event(type,{cancelable:true}),{pointerId:1,button:0,shiftKey:true,clientX:10,clientY:10,...props});
 const begin=()=>beginMiniPointerDrag(card as any,event('pointerdown') as any,placement,['a']);
 return {doc,card,calls,event,begin};
}
test('Shift drag cancellation removes listeners and restores card interactions',()=>{
 const f=fixture(),cancel=f.begin();assert.equal(f.card.draggable,false);
 f.doc.dispatchEvent(f.event('pointermove',{clientX:30}));f.doc.dispatchEvent(f.event('pointercancel'));
 assert.deepEqual(f.calls,['start:a','move','cancel']);assert.equal(f.card.draggable,true);
 f.doc.dispatchEvent(f.event('pointermove',{clientX:80}));f.doc.dispatchEvent(f.event('pointerup'));
 assert.deepEqual(f.calls,['start:a','move','cancel']);
});
test('Esc and Mini teardown cancel an active Shift gesture, ignoring other pointers',()=>{
 for(const way of ['esc','teardown']){const f=fixture(),cancel=f.begin();f.doc.dispatchEvent(f.event('pointermove',{clientX:30,pointerId:2}));assert.deepEqual(f.calls,[]);
 f.doc.dispatchEvent(f.event('pointermove',{clientX:30}));if(way==='esc')f.doc.dispatchEvent(f.event('keydown',{key:'Escape'}));else cancel?.();
 f.doc.dispatchEvent(f.event('pointerup'));assert.deepEqual(f.calls,['start:a','move','cancel']);assert.equal(f.card.draggable,true);}
});
test('successful Shift release drops once without replacing later click selection',async()=>{
 const f=fixture();let clicks=0;f.card.addEventListener('click',()=>clicks++);f.begin();
 f.doc.dispatchEvent(f.event('pointermove',{clientX:30}));f.doc.dispatchEvent(f.event('pointerup'));
 assert.deepEqual(f.calls,['start:a','move','drop']);assert.equal(f.card.draggable,true);
 await new Promise(r=>setTimeout(r,5));f.card.dispatchEvent(new Event('click'));assert.equal(clicks,1);
 f.doc.dispatchEvent(f.event('pointerup'));assert.equal(f.calls.filter(c=>c==='drop').length,1);
});
