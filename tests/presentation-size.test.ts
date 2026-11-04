import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {transformSync} from 'esbuild';import vm from 'node:vm';
test('unavailable Outliner state does not repeatedly serialize Canvas and removes stale overlay',()=>{
 const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('vendor/outliner/src/presentation.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:()=>({})});
 const pt=Object.create(module.exports.Presentation.prototype);let reads=0,removed=0,state:any=null;
 Object.assign(pt,{areaSelection:{sync(){}},syncMode(){},renderChrome(){},p:{state:()=>state,document:()=>{reads++;return null;},adapter:{canvas:{},element:()=>({})}},layer:{remove(){removed++;}}});
 for(let i=0;i<144;i++)pt.render();assert.equal(reads,0);assert.equal(removed,1);assert.equal(pt.layer,null);
 state={};pt.render();assert.equal(reads,1,'a ready state without snapshot may still request the current document');
});
test('presentation frames reuse measured size and update after resize or Canvas switch',()=>{
 let measured=0,disconnected=0,callback:any;const module={exports:{} as any};
 vm.runInNewContext(transformSync(readFileSync('vendor/outliner/src/presentation.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:()=>({}),ResizeObserver:class{constructor(fn:any){callback=fn;}observe(){}disconnect(){disconnected++;}},window:{getComputedStyle:()=>({paddingLeft:'5px',paddingRight:'5px',paddingTop:'2px',paddingBottom:'2px'})}});
 const p=Object.create(module.exports.Presentation.prototype);p.measuredSize={width:0,height:0};const wrapper={get clientWidth(){measured++;return 800;},get clientHeight(){measured++;return 600;}};
 for(let i=0;i<60;i++)assert.equal(p.viewportSize(wrapper).width,800);assert.equal(measured,2);
 p.lastKey='old';callback([{target:wrapper,contentRect:{width:890,height:696}}]);assert.equal(p.viewportSize(wrapper).width,900);assert.equal(p.viewportSize(wrapper).height,700);assert.equal(p.lastKey,'');assert.equal(measured,2);
 const other={clientWidth:400,clientHeight:300};assert.equal(p.viewportSize(other).width,400);assert.equal(disconnected,1);
 callback([{target:wrapper,contentRect:{width:10,height:10}}]);assert.equal(p.viewportSize(other).width,400);
});
