import {Notice,TFile,setIcon,Scope} from 'obsidian';
import type UctPlugin from './main';

import {mediaKind,albumArt} from './media-format';

export class MediaPreview {
 private current?:{el:HTMLElement;close:()=>void};private positions=new Map<string,number>();
 constructor(private root:UctPlugin){}
 install(){
  this.root.registerDomEvent(window,'click',e=>{const target=e.target as HTMLElement;if(target.closest('.uct-media-preview,.uct-mini,.uct-large-preview'))return;const img=target.closest('img');if(img&&img.closest('.markdown-preview-view,.markdown-source-view,.canvas-node')){e.preventDefault();e.stopImmediatePropagation();}},true);
  // Claim the second press before Obsidian's click handler opens its own lightbox.
  this.root.registerDomEvent(window,'mousedown',e=>{if(e.detail===2)this.doubleClick(e);},true);
  this.root.registerDomEvent(window,'dblclick',e=>this.doubleClick(e),true);
 }
 private doubleClick(e:MouseEvent){
  const target=e.target as HTMLElement;if(target.closest('.uct-media-preview,.uct-mini,.uct-large-preview,.setting-item,.menu'))return;
  const media=(target.closest('img,video,audio')??target.closest('.canvas-node,.audio-embed')?.querySelector('img,video,audio')) as HTMLMediaElement|HTMLImageElement|null;if(!media)return;
  const canvas=media.closest('.canvas-node');const markdown=media.closest('.markdown-preview-view,.markdown-source-view');if(!canvas&&!markdown)return;
  const src=(media as HTMLMediaElement).currentSrc||media.getAttribute('src');if(!src)return;
  const embed=media.closest('[src],[data-src]');let file:TFile|null=null;
  const view=this.root.canvasView();if(canvas){const node=[...(view?.canvas?.nodes?.values()??[])].find((n:any)=>n.nodeEl===canvas) as any;const f=this.root.app.vault.getAbstractFileByPath(node?.getData().file??'');if(f instanceof TFile)file=f;}
  if(!file){const raw=(media.closest('.internal-embed') as HTMLElement)?.getAttribute('src');if(raw)file=this.root.app.metadataCache.getFirstLinkpathDest(raw.split('#')[0],this.root.app.workspace.getActiveFile()?.path??'');}
  const kind=media.tagName==='IMG'?'image':media.tagName==='VIDEO'?'video':'audio';
  e.preventDefault();e.stopImmediatePropagation();if('pause'in media)media.pause();this.open(src,kind,file?.name??media.getAttribute('alt')??'',file??undefined);
 }
 openFile(file:TFile){const kind=mediaKind(file.path);if(!kind)return false;this.open(this.root.app.vault.getResourcePath(file),kind,file.name,file);return true;}
 open(src:string,kind:'image'|'video'|'audio',name:string,file?:TFile){
  this.current?.close();const doc=document,win=window,previous=doc.activeElement as HTMLElement|null;
  const el=doc.body.createDiv({cls:'uct-media-preview',attr:{role:'dialog','aria-label':name||'미디어 미리보기',tabindex:'-1'}}),abort=new AbortController();
  let media:HTMLMediaElement|undefined,coverUrl:string|undefined,closed=false;
  const scope=new Scope(this.root.app.scope);
  abort.signal.addEventListener('abort',()=>this.root.app.keymap.popScope(scope));
  const key=file?.path??src;const close=()=>{if(closed)return;closed=true;if(media){if(Number.isFinite(media.currentTime))this.positions.set(key,media.currentTime);media.pause();media.removeAttribute('src');media.load();}if(coverUrl)URL.revokeObjectURL(coverUrl);abort.abort();el.remove();this.root.previewWindows.delete(handle);if(this.current?.el===el)this.current=undefined;if(previous?.isConnected)previous.focus();};
  const handle={close};this.current={el,close};this.root.previewWindows.add(handle);
  el.onpointerdown=e=>{if(e.target===el)close();};
  const handleKey=(e:KeyboardEvent)=>{if(e.isComposing)return;let handled=true;if(e.key==='Escape')close();else if(media&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){if(e.code==='Space'&&!e.altKey){if(!e.repeat){if(media.paused)void media.play().catch(()=>{});else media.pause();}}else if(e.key==='ArrowLeft'&&!e.altKey)media.currentTime=Math.max(0,media.currentTime-5);else if(e.key==='ArrowRight'&&!e.altKey&&Number.isFinite(media.duration))media.currentTime=Math.min(media.duration,media.currentTime+5);else if(e.key==='ArrowUp'&&!e.altKey)media.volume=Math.min(1,Math.round((media.volume+.05)*100)/100);else if(e.key==='ArrowDown'&&!e.altKey)media.volume=Math.max(0,Math.round((media.volume-.05)*100)/100);else if(e.altKey&&(e.code==='Period'||e.code==='Comma'))media.playbackRate=Math.max(.25,Math.min(4,media.playbackRate+(e.code==='Period'?.25:-.25)));else handled=false;}else handled=false;if(handled){e.preventDefault();e.stopImmediatePropagation();return false;}};
  // Obsidian scopes run before DOM listeners, including when Chromium media controls own focus.
  for(const key of ['Escape',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','.',','])scope.register(null,key,handleKey);
  this.root.app.keymap.pushScope(scope);
  win.addEventListener('keydown',handleKey,{capture:true,signal:abort.signal});
  if(kind==='image'){
   const img=el.createEl('img',{cls:'uct-lightbox-image',attr:{src,alt:name,draggable:'false'}});let scale=1,x=0,y=0;
   const fit=()=>{if(!img.naturalWidth)return;const factor=Math.min((win.innerWidth-48)/img.naturalWidth,(win.innerHeight-48)/img.naturalHeight);img.style.width=img.naturalWidth*factor+'px';img.style.height=img.naturalHeight*factor+'px';};img.onload=fit;win.addEventListener('resize',fit,{signal:abort.signal});
   const draw=()=>{img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;img.style.cursor=scale>1?'grab':'zoom-in';};
   img.onwheel=e=>{e.preventDefault();e.stopPropagation();const next=Math.max(1,Math.min(12,scale*Math.exp(-e.deltaY*.002)));const rect=img.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;x-=(e.clientX-cx)*(next/scale-1);y-=(e.clientY-cy)*(next/scale-1);scale=next;if(scale===1)x=y=0;draw();};
   img.ondblclick=e=>{e.preventDefault();e.stopPropagation();scale=1;x=y=0;draw();};
   img.onpointerdown=e=>{if(e.button!==0||scale===1)return;e.preventDefault();img.setPointerCapture(e.pointerId);const sx=e.clientX,sy=e.clientY,ox=x,oy=y;const move=(ev:PointerEvent)=>{x=ox+ev.clientX-sx;y=oy+ev.clientY-sy;draw();};const end=()=>{img.removeEventListener('pointermove',move);img.removeEventListener('pointerup',end);img.removeEventListener('pointercancel',end);};img.addEventListener('pointermove',move,{signal:abort.signal});img.addEventListener('pointerup',end,{signal:abort.signal});img.addEventListener('pointercancel',end,{signal:abort.signal});};
  }else{
   const host=kind==='audio'?el.createDiv({cls:'uct-audio-preview'}):el;
   if(kind==='audio'){
    const cover=host.createDiv({cls:'uct-album-cover'});setIcon(cover,'audio-lines');host.createEl('div',{cls:'uct-audio-title',text:name});
    if(file)void this.root.app.vault.readBinary(file).then(data=>{if(closed)return;const art=albumArt(data);if(art){coverUrl=URL.createObjectURL(new Blob([art.data as BlobPart],{type:art.mime}));cover.empty();cover.createEl('img',{attr:{src:coverUrl,alt:'앨범 이미지'}});}}).catch(()=>{});
   }
   media=host.createEl(kind,{cls:'uct-lightbox-'+kind,attr:{src,preload:'metadata'}}) as HTMLMediaElement;
   const controls=host.createDiv({cls:'uct-media-controls '+(kind==='video'?'is-video':''),attr:{role:'toolbar','aria-label':'미디어 재생 조절'}});
   const play=controls.createEl('button',{attr:{'aria-label':'재생'}});setIcon(play,'play');
   const toggle=()=>{if(media!.paused)void media!.play().catch(()=>{});else media!.pause();};play.onclick=toggle;
   const time=controls.createSpan({cls:'uct-media-time',text:'0:00 / 0:00'});
   const seek=controls.createEl('input',{cls:'uct-media-seek',attr:{type:'range',min:'0',max:'0',step:'0.1',value:'0','aria-label':'재생 위치'}});
   seek.oninput=()=>{if(Number.isFinite(media!.duration))media!.currentTime=Number(seek.value);};
   const mute=controls.createEl('button',{attr:{'aria-label':'음소거'}});setIcon(mute,'volume-2');mute.onclick=()=>{media!.muted=!media!.muted;};
   const volume=controls.createEl('input',{cls:'uct-media-volume',attr:{type:'range',min:'0',max:'1',step:'0.05',value:'1','aria-label':'음량'}});volume.oninput=()=>{media!.volume=Number(volume.value);media!.muted=false;};
   const rate=controls.createSpan({cls:'uct-media-rate',text:'1×',attr:{'aria-label':'재생 속도'}});
   const stamp=(v:number)=>{const sec=Math.max(0,Math.floor(Number.isFinite(v)?v:0));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};
   const update=()=>{if(closed)return;time.setText(stamp(media!.currentTime)+' / '+stamp(media!.duration));seek.max=String(Number.isFinite(media!.duration)?media!.duration:0);seek.value=String(media!.currentTime);seek.disabled=!Number.isFinite(media!.duration);setIcon(play,media!.paused?'play':'pause');play.setAttribute('aria-label',media!.paused?'재생':'일시정지');volume.value=String(media!.muted?0:media!.volume);setIcon(mute,media!.muted?'volume-x':'volume-2');mute.setAttribute('aria-label',media!.muted?'음소거 해제':'음소거');rate.setText(media!.playbackRate+'×');};
   for(const type of ['loadedmetadata','durationchange','timeupdate','play','pause','ended','volumechange','ratechange'])media.addEventListener(type,update,{signal:abort.signal});
   if(kind==='video'){const fit=()=>{const video=media as HTMLVideoElement;if(!video.videoWidth)return;const f=Math.min((win.innerWidth-48)/video.videoWidth,(win.innerHeight-112)/video.videoHeight);video.style.width=video.videoWidth*f+'px';video.style.height=video.videoHeight*f+'px';};media.addEventListener('loadedmetadata',fit,{signal:abort.signal});win.addEventListener('resize',fit,{signal:abort.signal});}
   media.autoplay=false;media.addEventListener('loadedmetadata',()=>{const time=this.positions.get(key)??0;if(time>0&&Number.isFinite(media!.duration))media!.currentTime=Math.min(time,media!.duration);},{once:true,signal:abort.signal});
   media.addEventListener('error',()=>new Notice('이 미디어를 재생할 수 없습니다. 파일 형식과 경로를 확인하세요.'),{once:true,signal:abort.signal});
  }
  const closeButton=el.createEl('button',{cls:'uct-media-close',attr:{'aria-label':'미리보기 닫기'}});setIcon(closeButton,'x');closeButton.onclick=close;
  el.focus();
 }
 destroy(){this.current?.close();this.positions.clear();}
}


