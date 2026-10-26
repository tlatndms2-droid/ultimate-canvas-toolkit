import {App,loadPdfJs,TFile} from 'obsidian';
export type MediaKind='image'|'pdf'|'video'|'audio';
export const mediaExtensions:Record<MediaKind,ReadonlySet<string>>={
 image:new Set(['png','jpg','jpeg','gif','webp','svg','bmp','avif']),
 pdf:new Set(['pdf']),video:new Set(['mp4','webm','ogv','mov','mkv','m4v']),
 audio:new Set(['mp3','wav','ogg','m4a','flac','aac','webm'])
};
export const mediaTitles:Record<MediaKind,string>={image:'이미지',pdf:'PDF',video:'영상',audio:'음악'};

/** Visible PDF pages only, with at most two decoders alive. */
export class PdfPreviews{
 private queue:Array<()=>Promise<void>>=[];private active=0;private disposed=false;private tasks=new Set<any>();
 constructor(private app:App){}
 render(file:TFile,host:HTMLElement,width:number){
  host.setText('첫 페이지 불러오는 중…');
  this.queue.push(async()=>{
   if(this.disposed||!host.isConnected)return;
   let task:any;
   try{
    const pdfjs=await loadPdfJs();if(this.disposed||!host.isConnected)return;
    const bytes=await this.app.vault.readBinary(file);if(this.disposed||!host.isConnected)return;
    task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false});this.tasks.add(task);
    task.onPassword=()=>{if(!this.disposed&&host.isConnected)host.setText('암호가 있는 PDF는 미리 볼 수 없습니다.');void Promise.resolve(task.destroy()).catch(()=>{});};
    const doc=await task.promise,page=await doc.getPage(1);if(this.disposed||!host.isConnected)return;
    const original=page.getViewport({scale:1}),scale=Math.min(width/original.width,1600/original.height,2);
    const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.setAttribute('aria-label',file.name+' 첫 페이지');
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    if(!this.disposed&&host.isConnected){host.empty();host.appendChild(canvas);}
   }catch{if(!this.disposed&&host.isConnected&&!host.textContent?.includes('암호'))host.setText('PDF 미리보기를 불러올 수 없습니다.');}
   finally{if(task){this.tasks.delete(task);try{await task.destroy();}catch{}}}
  });this.pump();
 }
 private pump(){while(!this.disposed&&this.active<2&&this.queue.length){const job=this.queue.shift()!;this.active++;void job().finally(()=>{this.active--;this.pump();});}}
 dispose(){this.disposed=true;this.queue=[];for(const task of this.tasks)void Promise.resolve(task.destroy()).catch(()=>{});this.tasks.clear();}
}
