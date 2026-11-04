import {promises as fs} from 'fs';
import {join,resolve} from 'path';
import {homedir} from 'os';
import {createHash} from 'crypto';
import {requestUrl} from 'obsidian';

async function bounded<T>(work:Promise<T>):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Thumbnail resource timeout')),4000);})]);}finally{if(timer)clearTimeout(timer);}}

export function thumbnailCacheDirectory(vault:string,pluginId:string){const resolved=resolve(vault),identity=JSON.stringify([process.platform==='win32'?resolved.toLowerCase():resolved,pluginId]);return join(process.env.LOCALAPPDATA??join(homedir(),'.cache'),'UltimateCanvasToolkit','thumbnails',createHash('sha256').update(identity).digest('hex').slice(0,32));}

/** Disposable derived images, never the source of truth for collected content. */
export class ThumbnailCache {
 private memory=new Map<string,string>();private bytes=0;private tail=Promise.resolve();private stopped=false;
 constructor(private directory:string,private busy:()=>boolean){}
 key(item:any,app:any,face:string,width:number,height:number,appearance=''){
  const paths=new Set<string>([item.origin?.filePath,item.sourceReferencePath,...(item.group?.nodes??[]).map((n:any)=>n.file),...(item.uctPreviewGroup?.nodes??[]).map((n:any)=>n.file)].filter(Boolean));
  for(const file of [...paths])for(const link of Object.keys(app.metadataCache.resolvedLinks[file]??{}))paths.add(link);
  const files=[...paths].sort().map(p=>{const f=app.vault.getAbstractFileByPath(p);return[p,f?.stat?.mtime,f?.stat?.size];});
  return createHash('sha256').update(JSON.stringify({v:1,item,files,face,width:Math.round(width),height:Math.round(height),appearance})).digest('hex');
 }
 private remember(key:string,data:string){
  const previous=this.memory.get(key);if(previous){this.memory.delete(key);this.bytes-=previous.length*2;}
  this.memory.set(key,data);this.bytes+=data.length*2;
  while(this.bytes>24*1024*1024&&this.memory.size){const [k,v]=this.memory.entries().next().value!;this.memory.delete(k);this.bytes-=v.length*2;}
 }
 async get(key:string){
  if(this.stopped)return null;
  const cached=this.memory.get(key);if(cached){this.remember(key,cached);return cached;}
  try{const file=join(this.directory,key+'.png');if((await fs.stat(file)).size>8*1024*1024)return null;const raw=await fs.readFile(file);if(this.stopped||raw.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||raw.subarray(-12).toString('hex')!=='0000000049454e44ae426082')return null;const data='data:image/png;base64,'+raw.toString('base64');this.remember(key,data);return data;}catch{return null;}
 }
 async invalidate(key:string){const data=this.memory.get(key);if(data){this.bytes-=data.length*2;this.memory.delete(key);}if(/^[a-f0-9]{64}$/.test(key))await fs.unlink(join(this.directory,key+'.png')).catch(()=>{});}
 capture(key:string,host:HTMLElement,valid:()=>boolean,display:(data:string)=>void){
  this.tail=this.tail.catch(()=>{}).then(async()=>{
   // Never compete with a placement, or render a view that has already closed.
   if(this.stopped||this.busy()||!valid()||!host.isConnected)return;
   try{
    const data=await rasterizeThumbnail(host,()=>!this.stopped&&!this.busy()&&valid());
    if(!data||this.stopped||this.busy()||!valid())return;
    const raw=Buffer.from(data.slice(data.indexOf(',')+1),'base64');if(raw.length>8*1024*1024)return;
    await fs.mkdir(this.directory,{recursive:true});await fs.writeFile(join(this.directory,key+'.png'),raw);this.remember(key,data);
    if(valid()&&!this.busy())display(data);
    // Bound only this disposable cache. Never inspect or delete library files.
    const entries=await fs.readdir(this.directory);if(entries.length>160){const files=await Promise.all(entries.filter(n=>/^[a-f0-9]{64}\.png$/.test(n)).map(async name=>({name,time:(await fs.stat(join(this.directory,name))).mtimeMs})));files.sort((a,b)=>b.time-a.time);for(const f of files.slice(128))await fs.unlink(join(this.directory,f.name)).catch(()=>{});}
   }catch{/* A missing/unsupported thumbnail retains the original preview. */}
  });
 }
 async dispose(){this.stopped=true;await this.tail;this.memory.clear();this.bytes=0;}
}

/** Freeze the actual styled preview into a high-density image once. */
export async function rasterizeThumbnail(host:HTMLElement,valid:()=>boolean):Promise<string|null>{
 if(!valid()||host.querySelector('iframe,video,audio'))return null;
 const box=host.getBoundingClientRect();if(box.width<1||box.height<1)return null;
 const clone=host.cloneNode(true) as HTMLElement,source=[host,...host.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
 if(source.length>1500)return null;
 for(let i=0;i<source.length;i++){
  if(i%12===0)await new Promise(resolve=>setTimeout(resolve,0));
  if(!valid())return null;
  const original=source[i],copy=copies[i] as HTMLElement,style=getComputedStyle(original);
  for(const property of style)if(!property.startsWith('--'))copy.style.setProperty(property,style.getPropertyValue(property));
  copy.style.animation='none';copy.style.transition='none';
  if(original instanceof HTMLCanvasElement){const image=document.createElement('img');image.src=original.toDataURL('image/png');image.style.cssText=copy.style.cssText;copy.replaceWith(image);}
  if(original instanceof HTMLImageElement){
   if(!original.complete)await bounded(original.decode());if(!original.naturalWidth)return null;const image=copy as HTMLImageElement,url=original.currentSrc||original.src;
   if(url.startsWith('data:'))image.src=url;else if(/^(app:|blob:)/.test(url)){const response=await bounded(fetch(url));const raw=await bounded(response.arrayBuffer());if(raw.byteLength>8*1024*1024)return null;image.src='data:'+(response.headers.get('content-type')??'image/png')+';base64,'+Buffer.from(raw).toString('base64');}else{const response=await bounded(requestUrl({url}));if(response.arrayBuffer.byteLength>8*1024*1024)return null;image.src='data:'+(response.headers['content-type']??'image/png')+';base64,'+Buffer.from(response.arrayBuffer).toString('base64');}
   image.removeAttribute('srcset');image.removeAttribute('loading');
  }
 }
 if(!valid())return null;
 Object.assign(clone.style,{position:'relative',left:'0',top:'0',margin:'0',width:box.width+'px',height:box.height+'px',visibility:'visible',transform:'none'});
 // Computed logical insets may still contain the live panel's screen position.
 // Override their physical aliases, otherwise the frozen image can be off-canvas.
 clone.style.setProperty('inset','auto','important');clone.style.setProperty('left','0','important');clone.style.setProperty('top','0','important');
 const markup=new XMLSerializer().serializeToString(clone),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
 const image=new Image();image.src='data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');await image.decode();if(!valid())return null;
 const scale=Math.min(6,Math.max(2,1200/box.width)),canvas=document.createElement('canvas');canvas.width=Math.ceil(box.width*scale);canvas.height=Math.ceil(box.height*scale);canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
}
