import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';

function fixture(urls:string[],compact=false){
 const cleanups:(()=>void)[]=[],elements:any[]=[];
 const make=(tag='div',options:any={}):any=>{const events=new Map(),classes=new Set<string>();const el:any={tag,children:[],parent:null,isConnected:true,attrs:{...options.attr},text:options.text??'',style:{setProperty(){}},classList:{add:(c:string)=>classes.add(c)},classes,
 addClass:(...names:string[])=>names.forEach(n=>classes.add(n)),removeClass:(name:string)=>classes.delete(name),setAttribute:(k:string,v:string)=>el.attrs[k]=v,removeAttribute:(k:string)=>delete el.attrs[k],setText:(s:string)=>el.text=s,
 contains:(child:any)=>el.children.includes(child)||el.children.some((c:any)=>c.contains(child)),empty:()=>el.children=[],appendChild:(child:any)=>{el.children.push(child);child.parent=el;},remove:()=>{if(el.parent)el.parent.children=el.parent.children.filter((c:any)=>c!==el);},
 createDiv:(opts:any)=>el.createEl('div',opts),createSpan:(opts:any)=>el.createEl('span',opts),createEl:(name:string,opts:any)=>{const child=make(name,opts);el.appendChild(child);return child;},addEventListener:(name:string,fn:any)=>events.set(name,fn),removeEventListener:(name:string,fn:any)=>{if(events.get(name)===fn)events.delete(name);},dispatch:(name:string)=>events.get(name)?.()};elements.push(el);return el;};
 const module={exports:{} as any};vm.runInNewContext(transformSync(readFileSync('vendor/palette/src/preview/preview-service.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:(id:string)=>id==='obsidian'?{TFile:class{},MarkdownRenderer:{render:async()=>{}}}:{IMAGE_EXTENSIONS:new Set()},ResizeObserver:class{observe(){}disconnect(){}},document:{createElementNS:(_ns:string,tag:string)=>make(tag)},URL,console});
 const parent=make(),service=new module.exports.PreviewService({vault:{getAbstractFileByPath:()=>null}},{register:(fn:()=>void)=>cleanups.push(fn)}),nodes=urls.map((url,i)=>({id:'node'+i,type:'link',url,x:i*400,y:30,width:360,height:200}));
 return {parent,elements,nodes,start:()=>service.render(parent,{type:'group',origin:{},group:{nodes,edges:[],bounds:{width:Math.max(400,urls.length*400),height:260}}},compact),close:()=>{parent.isConnected=false;cleanups.forEach(fn=>fn());}};
}

test('group YouTube thumbnails render in compact and large previews without players or geometry changes',async()=>{
 const urls=['https://www.youtube.com/watch?v=iLDF7RTA5-E','https://youtu.be/dAU8Hezfp7g?t=20','https://m.youtube.com/shorts/xLGRS9Nyd3E','https://www.youtube-nocookie.com/embed/D7xmiCI3sJU'];
 for(const compact of [true,false]){const f=fixture(urls,compact);await f.start();const images=f.elements.filter(e=>e.tag==='img');assert.equal(images.length,4);assert.equal(f.elements.filter(e=>e.tag==='iframe').length,0);assert.equal(images[0].attrs.src,'https://i.ytimg.com/vi/iLDF7RTA5-E/hqdefault.jpg');assert(images.every(e=>e.attrs.loading==='lazy'&&e.attrs.decoding==='async'&&e.attrs.draggable==='false'));
 const cards=f.elements.filter(e=>e.classes.has('cp-canvas-snapshot__node--youtube'));assert.equal(cards.length,4);for(const [i,card]of cards.entries()){assert.equal(card.style.left,i*400+'px');assert.equal(card.style.top,'30px');assert.equal(card.style.width,'360px');assert.equal(card.style.height,'200px');}f.close();assert(images.every(e=>!e.attrs.src));}
});

test('unavailable YouTube thumbnail falls back to its link label and disposed previews stop handling errors',async()=>{
 const f=fixture(['https://youtu.be/iLDF7RTA5-E']);await f.start();const img=f.elements.find(e=>e.tag==='img'),content=img.parent,card=content.parent;img.dispatch('error');assert.equal(content.text,'youtu.be');assert(!card.classes.has('cp-canvas-snapshot__node--youtube'));f.close();
 const closed=fixture(['https://youtube.com/watch?v=iLDF7RTA5-E']);await closed.start();const late=closed.elements.find(e=>e.tag==='img');closed.close();late.dispatch('error');assert.equal(late.parent.text,'');
});

test('ordinary links, malformed IDs, unrelated hosts and non-HTTP URLs do not become YouTube thumbnails',async()=>{
 const f=fixture(['https://example.com','https://notyoutube.com/watch?v=iLDF7RTA5-E','https://youtube.com/watch?v=bad','file://youtube.com/watch?v=iLDF7RTA5-E']);await f.start();assert.equal(f.elements.filter(e=>e.tag==='img').length,0);assert(f.elements.some(e=>e.text==='example.com'));f.close();
});
