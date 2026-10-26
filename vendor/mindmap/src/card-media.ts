import {App,Notice} from 'obsidian';
import {MediaPreview} from './file-insert';
import {mediaExtensions} from './media-previews';

export function youtubeUrl(value:unknown){
 try{const u=new URL(String(value));return u.protocol==='https:'&&(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)||(u.hostname==='releases.obsidian.md'&&u.pathname==='/youtube'));}catch{return false;}
}
// Run only in an identified YouTube webview, never in arbitrary linked pages.
export const youtubePlayScript=`(()=>{
 const u=new URL(location.href);
 if(u.hostname==='releases.obsidian.md'&&u.pathname==='/youtube'){
  const cover=document.getElementById('img');if(cover)cover.click();
  const frame=document.querySelector('iframe#main');if(!frame)return false;
  const src=new URL(frame.src);if(!['www.youtube.com','www.youtube-nocookie.com'].includes(src.hostname))return false;
  if(src.searchParams.get('enablejsapi')!=='1'){src.searchParams.set('enablejsapi','1');src.searchParams.set('autoplay','1');frame.src=src.href;}
  else frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}),src.origin);
  return true;
 }
 if(!['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname))return false;
 const video=document.querySelector('video');if(!video)return false;
 if(video.ended)video.currentTime=0;return video.play().then(()=>true);
})()`;

export class CardMedia{
 private preview:MediaPreview|null=null;
 private busy=new WeakSet<object>();
 constructor(private app:App,private current:()=>any){}
 supports(node:any){const d=node.getData();if(d.type==='link')return youtubeUrl(d.url);if(d.type!=='file')return false;const ext=String(d.file).split('.').pop()!.toLowerCase();return ['image','video','audio'].some(k=>mediaExtensions[k as 'image'|'video'|'audio'].has(ext));}
 activate(canvas:any,node:any){
  if(this.busy.has(node))return;
  const d=node.getData(),file=d.type==='file'?this.app.vault.getFileByPath(d.file):null;
  if(d.type==='file'&&!file){new Notice('미디어 파일을 찾을 수 없습니다.');return;}
  if(file&&mediaExtensions.image.has(file.extension.toLowerCase())){
   if(this.preview)return;
   this.preview=new MediaPreview(this.app,'image',file,()=>{this.preview=null;if(this.current()===canvas&&canvas.nodes.has(node.id))canvas.wrapperEl.focus({preventScroll:true});});
   this.preview.open();return;
  }
  node.attach();
  if(d.type==='link'){
   const webview=node.nodeEl.querySelector('webview');
   if(!webview||!youtubeUrl(webview.getAttribute('src'))){new Notice('영상이 아직 준비되지 않았습니다. 잠시 후 Enter를 눌러 주세요.');return;}
   this.busy.add(node);
   void webview.executeJavaScript(youtubePlayScript,true).then((ok:boolean)=>{if(!ok)new Notice('영상 재생 버튼을 사용할 수 없습니다. 카드 안에서 확인해 주세요.');}).catch(()=>new Notice('영상을 재생하지 못했습니다. 카드 안의 재생 버튼을 확인해 주세요.')).finally(()=>this.busy.delete(node));return;
  }
  const player=node.nodeEl.querySelector('video,audio') as HTMLMediaElement|null;
  if(!player){new Notice('미디어를 불러오는 중입니다. 잠시 후 Enter를 눌러 주세요.');return;}
  if(player.ended)player.currentTime=0;
  this.busy.add(node);void player.play().catch(()=>new Notice('미디어를 재생하지 못했습니다. 파일 형식과 재생 상태를 확인해 주세요.')).finally(()=>this.busy.delete(node));
 }
 dispose(){this.preview?.close();this.preview=null;}
}
