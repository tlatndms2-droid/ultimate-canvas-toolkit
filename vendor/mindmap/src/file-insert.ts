import {canInsertFile} from './file-insert-data';
import {MediaKind,mediaExtensions,mediaTitles,PdfPreviews} from './media-previews';
import {creationGroup,creationGroups} from './image-date-groups';
import {App,Modal,Setting,TFile,FuzzySuggestModal} from 'obsidian';
type Kind='md'|'canvas'|MediaKind;
const kinds:Kind[]=['md','canvas','image','pdf','video','audio'],labels=['Markdown','Canvas','Image','PDF','Video','Audio'];
export class FileInsertMenu{
 private menu:HTMLElement|null=null;private canvas:any;private anchor='';private index=0;private picker:Modal|null=null;
 constructor(private app:App,private commit:(c:any,id:string,file:TFile)=>void,private current:()=>any,register:(fn:()=>void)=>void){register(()=>this.close());const outside=(e:PointerEvent)=>{if(this.menu&&!this.menu.contains(e.target as Node))this.closeMenu()};document.addEventListener('pointerdown',outside,true);register(()=>document.removeEventListener('pointerdown',outside,true));}
 private closeMenu(){this.menu?.remove();this.menu=null;}
 close(){this.closeMenu();this.picker?.close();this.picker=null;}
 toggle(c:any,n:any){if(this.menu){this.close();return;}this.close();this.canvas=c;this.anchor=n.id;this.index=0;this.menu=document.body.createDiv({cls:'canvas-mindmap-menu cm-file-menu',attr:{role:'menu','aria-label':'파일 넣기'}});labels.forEach((label,i)=>{const row=this.menu!.createDiv({cls:'canvas-mindmap-option',text:label,attr:{role:'menuitem'}});row.onclick=()=>{this.index=i;this.choose()}});this.paint();this.observe();}
 observe(){if(!this.menu&&!this.picker)return;const n=this.canvas?.nodes.get(this.anchor);if(this.current()!==this.canvas||!n||n.isEditing||this.canvas.readonly||!canInsertFile(n.getData())){this.close();return;}if(this.menu){if(this.canvas.selection.size!==1||!this.canvas.selection.has(n)){this.close();return;}const r=n.nodeEl.getBoundingClientRect();this.menu.style.left=Math.max(8,Math.min(innerWidth-this.menu.offsetWidth-8,r.right-this.menu.offsetWidth))+'px';this.menu.style.top=Math.max(8,r.top-this.menu.offsetHeight-8)+'px';}}
 key(e:KeyboardEvent){if(!this.menu)return false;if(e.isComposing)return false;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')this.close();else if(e.key==='ArrowUp'||e.key==='ArrowDown'){this.index=(this.index+(e.key==='ArrowDown'?1:kinds.length-1))%kinds.length;this.paint()}else if(e.key==='Enter'&&!e.repeat)this.choose();return true;}
 private paint(){[...this.menu!.children].forEach((el,i)=>el.classList.toggle('is-selected',i===this.index));}
 private choose(){const c=this.canvas,id=this.anchor,kind=kinds[this.index];this.closeMenu();const chosen=(file:TFile)=>this.commit(c,id,file),closed=()=>{this.picker=null;if(this.current()===c)c.wrapperEl.focus()};this.picker=kind==='md'||kind==='canvas'?new DocumentPicker(this.app,kind,c.view.file.path,chosen,closed):new MediaPicker(this.app,kind,chosen,closed);this.picker.open();}
}

class DocumentPicker extends FuzzySuggestModal<TFile>{
 constructor(app:App,private kind:'md'|'canvas',private currentPath:string,private chosen:(file:TFile)=>void,private closed:()=>void){super(app);this.setPlaceholder(kind==='md'?'넣을 문서 검색…':'넣을 캔버스 검색…');this.emptyStateText='표시할 파일이 없습니다.';this.setInstructions([{command:'↑ ↓',purpose:'파일 선택'},{command:'↵',purpose:'카드에 넣기'},{command:'esc',purpose:'닫기'}]);}
 getItems(){return this.app.vault.getFiles().filter(f=>f.path!==this.currentPath&&f.extension===this.kind).sort((a,b)=>a.path.localeCompare(b.path));}
 getItemText(file:TFile){return file.path;}
 onChooseItem(file:TFile){this.chosen(file);}
 onClose(){super.onClose();this.closed();}
}
class MediaPicker extends Modal{
 private files:TFile[]=[];private matches:TFile[]=[];private index=0;private list!:HTMLElement;private search!:HTMLInputElement;private sort='mtime-desc';private resizeCleanup:(()=>void)|null=null;
 private observer:IntersectionObserver|null=null;private pdf:PdfPreviews|null=null;private preview:MediaPreview|null=null;
 constructor(app:App,private kind:MediaKind,private chosen:(file:TFile)=>void,private closed:()=>void){super(app);for(const key of ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter'])this.scope.register([],key,e=>{if(e.isComposing)return;const target=e.target as HTMLElement;if(target?.closest('select,input[type="range"],button:not(.cm-file-result)'))return;e.preventDefault();if(key==='Enter'){if(!e.repeat){const file=this.matches[this.index];if(file){this.chosen(file);this.close();}}return false;}this.moveSelection(key);this.paint();return false;});this.scope.register(['Ctrl'],'Enter',e=>{if(e.isComposing)return;e.preventDefault();if(!e.repeat)this.openPreview(this.matches[this.index],true);return false;});}
 onOpen(){this.setTitle(mediaTitles[this.kind]+' 선택');this.modalEl.addClass('cm-file-picker');this.enableResize();this.search=this.contentEl.createEl('input',{cls:'cm-file-search',attr:{type:'search',placeholder:'파일명 또는 폴더 검색','aria-label':'파일 검색'}});
 const controls=this.contentEl.createDiv({cls:'cm-image-controls'});const sizeLabel=controls.createEl('label',{text:'썸네일 크기 '});const size=sizeLabel.createEl('input',{attr:{type:'range',min:'90',max:'240',step:'10',value:'140','aria-label':'썸네일 크기'}});if(this.kind==='audio')sizeLabel.hidden=true;
 const sortLabel=controls.createEl('label',{text:'정렬 '});const sort=sortLabel.createEl('select',{attr:{'aria-label':'파일 정렬'}});for(const [value,text] of [['mtime-desc','수정일 · 최신순'],['mtime-asc','수정일 · 오래된순'],['ctime-desc','생성일 · 최신순'],['ctime-asc','생성일 · 오래된순']])sort.createEl('option',{text,value});sort.value=this.sort;
 this.contentEl.createDiv({cls:'cm-media-help',text:'방향키로 선택 · Enter로 카드에 넣기 · Ctrl+Enter 또는 클릭으로 미리보기'});
 this.list=this.contentEl.createDiv({cls:'cm-file-results '+(this.kind==='audio'?'cm-audio-results':'cm-image-results'),attr:{role:'listbox','aria-label':mediaTitles[this.kind]+' 목록'}});
 size.oninput=()=>this.list.style.setProperty('--cm-thumbnail-size',size.value+'px');sort.onchange=()=>{this.sort=sort.value;this.render()};this.files=this.app.vault.getFiles().filter(f=>mediaExtensions[this.kind].has(f.extension.toLowerCase()));this.search.oninput=()=>this.render();new Setting(this.contentEl).addButton(b=>b.setButtonText('취소').onClick(()=>this.close()));this.render();this.search.focus();}
 private stopThumbnails(){this.observer?.disconnect();this.observer=null;this.pdf?.dispose();this.pdf=null;for(const video of this.list?.querySelectorAll('video')||[]){video.pause();video.removeAttribute('src');video.load();}}
 private render(){
  this.stopThumbnails();const selected=this.matches[this.index]?.path,query=this.search.value.trim().toLocaleLowerCase();const field=this.sort.startsWith('ctime')?'ctime':'mtime',sign=this.sort.endsWith('asc')?1:-1,now=new Date();
  this.matches=this.files.filter(f=>f.path.toLocaleLowerCase().includes(query)).sort((a,b)=>creationGroup(a.stat.ctime,now)-creationGroup(b.stat.ctime,now)||sign*(a.stat[field]-b.stat[field])||a.path.localeCompare(b.path));this.index=Math.max(0,this.matches.findIndex(f=>f.path===selected));this.list.empty();
  if(!this.matches.length){this.list.createDiv({text:'표시할 파일이 없습니다.'});return;}
  this.pdf=new PdfPreviews(this.app);const jobs=new Map<Element,()=>void>();
  this.observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){this.observer?.unobserve(entry.target);jobs.get(entry.target)?.();jobs.delete(entry.target);}},{root:this.list,rootMargin:'100px'});
  let lastGroup=-1;for(const [i,file] of this.matches.entries()){
   const group=creationGroup(file.stat.ctime,now);if(group!==lastGroup){this.list.createEl('h3',{cls:'cm-image-group',text:creationGroups[group]});lastGroup=group;}
   const row=this.list.createEl('button',{cls:'cm-file-result',attr:{type:'button',role:'option','aria-label':file.path}});
   if(this.kind==='image')row.createEl('img',{attr:{src:this.app.vault.getResourcePath(file),alt:file.name,loading:'lazy'}});
   else if(this.kind==='pdf'){const host=row.createDiv({cls:'cm-pdf-thumbnail',text:'PDF · 첫 페이지'});jobs.set(row,()=>this.pdf?.render(file,host,320));this.observer.observe(row);}
   else if(this.kind==='video'){const host=row.createDiv({cls:'cm-video-thumbnail'});host.createSpan({text:'▶ 미리 재생',cls:'cm-play-label'});jobs.set(row,()=>{const video=host.createEl('video',{attr:{preload:'metadata','aria-label':file.name}});video.muted=true;video.src=this.app.vault.getResourcePath(file);video.onerror=()=>{video.remove();};});this.observer.observe(row);}
   else row.createSpan({cls:'cm-audio-icon',text:'▶',attr:{'aria-hidden':'true'}});
   const text=row.createDiv();text.createDiv({text:file.name});text.createEl('small',{text:file.parent?.path==='/'?'보관함 최상위':file.parent?.path||''});text.createEl('small',{cls:'cm-image-date',text:(field==='ctime'?'생성: ':'수정: ')+new Date(file.stat[field]).toLocaleString('ko-KR')});
   row.onclick=()=>{this.index=i;this.paint();this.openPreview(file);};
  }this.paint();
 }
 private paint(){[...this.list.querySelectorAll('.cm-file-result')].forEach((row,i)=>{row.classList.toggle('is-selected',i===this.index);row.setAttribute('aria-selected',String(i===this.index))});this.list.querySelectorAll('.cm-file-result')[this.index]?.scrollIntoView({block:'nearest'});}
 private moveSelection(key:string){
  const rows=Array.from(this.list.querySelectorAll<HTMLElement>('.cm-file-result'));if(!rows.length)return;
  if(key==='ArrowLeft'||key==='ArrowRight'){this.index=Math.max(0,Math.min(rows.length-1,this.index+(key==='ArrowRight'?1:-1)));return;}
  const current=rows[this.index].getBoundingClientRect(),down=key==='ArrowDown';let best=this.index,bestY=Infinity,bestX=Infinity;
  rows.forEach((row,i)=>{const r=row.getBoundingClientRect(),dy=r.top-current.top;if(down?dy<=1:dy>=-1)return;const y=Math.abs(dy),x=Math.abs(r.left+r.width/2-current.left-current.width/2);if(y<bestY-1||Math.abs(y-bestY)<=1&&x<bestX){best=i;bestY=y;bestX=x;}});this.index=best;
 }
 private enableResize(){
  for(const direction of ['n','s','e','w','ne','nw','se','sw']){
   const handle=this.modalEl.createDiv({cls:'cm-resize cm-resize-'+direction});
   handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();this.resizeCleanup?.();
    const rect=this.modalEl.getBoundingClientRect(),x=e.clientX,y=e.clientY,win=this.modalEl.ownerDocument.defaultView!;
    const move=(event:PointerEvent)=>{const dx=event.clientX-x,dy=event.clientY-y;
     const minW=Math.min(360,win.innerWidth-16),minH=Math.min(300,win.innerHeight-16);
     let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
     if(direction.includes('e'))right=Math.max(left+minW,Math.min(win.innerWidth-8,rect.right+dx));
     if(direction.includes('w'))left=Math.min(right-minW,Math.max(8,rect.left+dx));
     if(direction.includes('s'))bottom=Math.max(top+minH,Math.min(win.innerHeight-8,rect.bottom+dy));
     if(direction.includes('n'))top=Math.min(bottom-minH,Math.max(8,rect.top+dy));
     Object.assign(this.modalEl.style,{position:'fixed',margin:'0',transform:'none',left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
    };
    const end=()=>{win.removeEventListener('pointermove',move,true);win.removeEventListener('pointerup',end,true);win.removeEventListener('pointercancel',end,true);win.removeEventListener('blur',end);this.resizeCleanup=null;};
    this.resizeCleanup=end;win.addEventListener('pointermove',move,true);win.addEventListener('pointerup',end,true);win.addEventListener('pointercancel',end,true);win.addEventListener('blur',end);
   };
  }
 }

 private openPreview(file?:TFile,play=false){if(!file||this.preview)return;this.preview=new MediaPreview(this.app,this.kind,file,()=>{this.preview=null;if(this.list.isConnected){this.list.querySelectorAll<HTMLElement>('.cm-file-result')[this.index]?.focus();}},play);this.preview.open();}
 onClose(){this.resizeCleanup?.();this.preview?.close();this.preview=null;this.stopThumbnails();this.contentEl.empty();this.closed();}
}
export class MediaPreview extends Modal{
 private pdf:PdfPreviews|null=null;private player:HTMLMediaElement|null=null;
 private focusFrame:number|null=null;
 private playbackListener=(e:KeyboardEvent)=>this.playbackKey(e);
 constructor(app:App,private kind:MediaKind,private file:TFile,private closed:()=>void,private autoPlay=false){super(app);this.scope.register(['Ctrl'],'Enter',e=>{if(e.isComposing)return;e.preventDefault();e.stopPropagation();if(!e.repeat)this.close();return false;});for(const key of [' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','m'])this.scope.register([],key,e=>{if(this.playbackKey(e))return false;});}
 onOpen(){
  this.setTitle(this.file.name);this.modalEl.addEventListener('keydown',this.playbackListener,true);this.modalEl.addClass('cm-media-preview');const host=this.contentEl.createDiv({cls:'cm-media-preview-body'}),src=this.app.vault.getResourcePath(this.file);
  if(this.kind==='image'){const img=host.createEl('img',{attr:{src,alt:this.file.name}});img.onerror=()=>{host.setText('이미지를 불러올 수 없습니다.');};}
  else if(this.kind==='pdf'){this.pdf=new PdfPreviews(this.app);this.pdf.render(this.file,host,1000);this.contentEl.createDiv({cls:'cm-media-help',text:'첫 페이지 미리보기'});}
  else{this.player=host.createEl(this.kind==='video'?'video':'audio',{attr:{src,controls:'',preload:'metadata'}});if(this.autoPlay)void this.player.play().catch(()=>{});this.player.onerror=()=>{if(!host.querySelector('.cm-media-error'))host.createDiv({cls:'cm-media-error',text:'이 파일은 미리 재생할 수 없습니다. 파일 형식이나 코덱을 확인해 주세요.'});};this.contentEl.createDiv({cls:'cm-media-help',text:'Space 재생/일시정지 · ←/→ 5초 이동 · ↑/↓ 음량 5% · M 음소거'});}
  this.contentEl.createDiv({cls:'cm-media-help',text:'Ctrl+Enter 또는 Esc로 미리보기 닫기'});
  this.modalEl.tabIndex=-1;this.modalEl.focus({preventScroll:true});
  this.focusFrame=requestAnimationFrame(()=>{this.focusFrame=null;if(this.modalEl.isConnected)this.modalEl.focus({preventScroll:true});});
 }
 private playbackKey(e:KeyboardEvent){
  const player=this.player;if(!player||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
  const key=e.code==='Space'?' ':e.code==='KeyM'?'m':e.key.toLowerCase();
  if(![' ','m','arrowleft','arrowright','arrowup','arrowdown'].includes(key))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(key===' '){if(e.repeat)return true;if(player.paused||player.ended){if(player.ended)player.currentTime=0;void player.play().catch(()=>{});}else player.pause();}
  else if(key==='m'){if(!e.repeat)player.muted=!player.muted;}
  else if(key==='arrowup'||key==='arrowdown'){player.volume=Math.max(0,Math.min(1,Math.round((player.volume+(key==='arrowup'?.05:-.05))*100)/100));}
  else if(Number.isFinite(player.duration)&&player.duration>0){player.currentTime=Math.max(0,Math.min(player.duration,player.currentTime+(key==='arrowright'?5:-5)));}
  return true;
 }
 onClose(){if(this.focusFrame!==null){cancelAnimationFrame(this.focusFrame);this.focusFrame=null;}this.modalEl.removeEventListener('keydown',this.playbackListener,true);this.pdf?.dispose();if(this.player){this.player.pause();this.player.removeAttribute('src');this.player.load();this.player=null;}this.contentEl.empty();this.closed();}
}
