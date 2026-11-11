import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const req=createRequire(path.resolve('tests/portal-position-state.test.ts')),{savedPositions}=req('../vendor/portal/src/position-state.cjs'),M=req('../vendor/portal/src/model.cjs');
const source=readFileSync('vendor/portal/src/main.cjs','utf8');
const hook=new Function('M','return function '+source.slice(source.indexOf('  hookViewState(v){'),source.indexOf('  positionState(s,')).trim())(M);
const position={version:1,file:'a.canvas',path:['parent','child'],viewport:{x:100,y:200,zoom:-1}};
const layout={main:{type:'tabs',children:[{id:'tab-a',type:'leaf',state:{type:'canvas',state:{file:'a.canvas',canvasPortalPosition:position}}}]}};
test('startup recovery keeps per-tab portal paths and rejects another file identity',()=>{
 const positions=savedPositions(layout);assert.deepEqual(positions.get('tab-a'),position);positions.get('tab-a').path.pop();assert.equal(position.path.length,2);
 const wrong=structuredClone(layout);wrong.main.children[0].state.state.file='other.canvas';assert.equal(savedPositions(wrong).size,0);
});
test('a Canvas already created during async startup retains its saved position until state applies',async()=>{
 let restores=0;const view:any={leaf:{id:'tab-a'},file:{path:'a.canvas'},getState(){return{file:this.file.path}},async setState(state:any){this.file={path:state.file}}};
 const p:any={initialPositions:savedPositions(layout),viewHooks:new Map(),pendingPositions:new WeakMap(),loadingViewState:new WeakSet(),sessions:new Map(),discover(){this.sessions.set(view,{v:view})},positionState(){return{...position,path:[]}},async restorePosition(_s:any,saved:any){assert.deepEqual(saved,position);restores++;this.pendingPositions.delete(view)}};
 hook.call(p,view);assert.deepEqual(view.getState().canvasPortalPosition.path,['parent','child']);
 await view.setState({file:'a.canvas'});assert.equal(restores,1);assert.equal(p.loadingViewState.has(view),false);assert.equal(p.pendingPositions.has(view),false);
});
test('switching a startup tab to a different file never restores its previous portal',async()=>{
 const view:any={leaf:{id:'tab-a'},file:{path:'a.canvas'},getState(){return{file:this.file.path}},async setState(s:any){this.file={path:s.file}}};let restores=0;
 const p:any={initialPositions:savedPositions(layout),viewHooks:new Map(),pendingPositions:new WeakMap(),loadingViewState:new WeakSet(),sessions:new Map(),discover(){this.sessions.set(view,{v:view})},positionState(){return null},async restorePosition(){restores++}};
 hook.call(p,view);await view.setState({file:'b.canvas'});assert.equal(restores,0);assert.equal(p.pendingPositions.has(view),false);
});
