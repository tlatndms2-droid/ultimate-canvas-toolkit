import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';
function fixture(){
 const calls:string[]=[],targets=new Map<string,any>(),cleanup:Function[]=[];let callback:Function=()=>{},disconnected=0;
 const host:any={isConnected:true,querySelector:(s:string)=>targets.get(/data-cp-embed="([^"]+)/.exec(s)![1])};
 const render=async(_app:any,source:string)=>{calls.push(source);for(const m of source.matchAll(/data-cp-embed="([^"]+)"/g))targets.set(m[1],{style:{},isConnected:true,setText(){}});};
 const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('vendor/palette/src/preview/deferred-embeds.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,console,require:()=>({MarkdownRenderer:{render},Component:class{}}),IntersectionObserver:class{constructor(fn:Function){callback=fn;}observe(){}unobserve(){}disconnect(){disconnected++;}}});
 const component={register:(fn:Function)=>cleanup.push(fn),addChild(){}};
 return {calls,targets,start:(s:string,compact=true)=>module.exports.renderSnapshotMarkdown({},s,host,'test.md',component,compact),visible:(id:string)=>callback([{isIntersecting:true,target:targets.get(id)}]),close:()=>cleanup.forEach(fn=>fn()),disconnected:()=>disconnected};
}
test('clipped PDF/media embeds stay unloaded until visible; visible content retains the original renderer',async()=>{
 const f=fixture();await f.start('# Heading\n![[photo.png]]\n![[document.pdf#page=2]]\n![[sound.mp3]]\n![[video.webm]]');assert.equal(f.calls.length,1);assert(f.calls[0].includes('![[photo.png]]'));assert(!f.calls[0].includes('![[document.pdf'));
 f.visible('cp-lazy-0');await Promise.resolve();assert.equal(f.calls[1],'![[document.pdf#page=2]]');f.visible('cp-lazy-0');assert.equal(f.calls.length,2);f.close();f.visible('cp-lazy-1');assert.equal(f.calls.length,2);assert.equal(f.disconnected(),1);
});
test('full preview, fenced code and ordinary inline text keep their Markdown source',async()=>{
 const source='```md\n![[inside.pdf]]\n```\ninline ![[inline.pdf]]\n![[visible.pdf]]';const full=fixture();await full.start(source,false);assert.equal(full.calls[0],source);assert.equal(full.targets.size,0);
 const compact=fixture();await compact.start(source);assert(compact.calls[0].includes('![[inside.pdf]]'));assert(compact.calls[0].includes('inline ![[inline.pdf]]'));assert.equal(compact.targets.size,1);
});
