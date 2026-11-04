import {TFile} from 'obsidian';

type Size={width:number;height:number};
/** Gesture-local preparation: no persistent cache, file reads or decoding per move. */
export function preparePlacementImages(app:any,items:any[],changed:()=>void){
 const sizes=new Map<string,Size>(),checks:(()=>boolean)[]=[],releases:(()=>void)[]=[];
 let disposed=false,pending=0,failure:Error|undefined,loadedImages:Map<string,Size>|undefined;
 const tasks:Promise<void>[]=[];
 for(const item of items){
  if(item?.type!=='image'||item.uctPortal||item.group)continue;
  const path=item.origin?.filePath??item.sourceReferencePath,file=path&&app?.vault.getAbstractFileByPath(path);
  if(!(file instanceof TFile))continue;
  const mtime=file.stat.mtime,bytes=file.stat.size,url=app.vault.getResourcePath(file);
  checks.push(()=>app.vault.getAbstractFileByPath(path)===file&&file.stat.mtime===mtime&&file.stat.size===bytes);
  loadedImages??=new Map([...(document.querySelectorAll?.('img')??[])].filter((img:any)=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0).map((img:any)=>[img.currentSrc||img.src,{width:img.naturalWidth,height:img.naturalHeight}]));
  const loaded=loadedImages.get(url);if(loaded){sizes.set(item.id,loaded);continue;}
  pending++;
  tasks.push(new Promise<void>((resolve,reject)=>{
   const img=new Image();let done=false;
   const finish=(error?:Error)=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;pending--;if(error){failure=error;reject(error);}else resolve();if(!disposed)changed();};
   const timer=setTimeout(()=>finish(Error('이미지 크기를 준비하지 못해 배치를 취소했습니다. Mini 자료는 유지됩니다.')),15000);
   img.onload=()=>{if(!disposed&&img.naturalWidth>0&&img.naturalHeight>0)sizes.set(item.id,{width:img.naturalWidth,height:img.naturalHeight});finish();};
   // An unreadable image is not resized by Canvas either; keep its stored box.
   img.onerror=()=>finish();
   releases.push(()=>{finish();img.removeAttribute('src');});img.src=url;
  }));
 }
 const done=Promise.all(tasks).then(()=>{});void done.catch(()=>{});
 return {sizes,done,count:checks.length,get ready(){return pending===0;},get failure(){return failure;},valid:()=>checks.every(check=>check()),dispose(){disposed=true;for(const release of releases)release();}};
}

/** Match Canvas image fitting, anchored at the existing top-left coordinate. */
export function fittedImageSize(width:number,height:number,natural:Size):Size {
 const ratio=natural.width/natural.height;
 return {width:Math.round(Math.min(width,height*ratio)),height:Math.round(Math.min(height,width/ratio))};
}
