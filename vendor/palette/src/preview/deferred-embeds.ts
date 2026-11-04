import {MarkdownRenderer,Component} from 'obsidian';

/** Native PDF/media viewers outside a clipped thumbnail must not start loading. */
export async function renderSnapshotMarkdown(app:any,source:string,host:HTMLElement,path:string,component:Component,compact:boolean):Promise<void>{
 if(!compact){await MarkdownRenderer.render(app,source,host,path,component);return;}
 const embeds:{id:string;source:string;height:number}[]=[];let fence='';
 const prepared=source.split('\n').map(line=>{
  const marker=/^\s*(`{3,}|~{3,})/.exec(line);if(marker){if(!fence)fence=marker[1][0];else if(marker[1][0]===fence)fence='';return line;}if(fence)return line;
  const match=/^\s*!\[\[([^\]\r\n]+)\]\]\s*$/.exec(line);if(!match)return line;
  const ext=/\.([a-z0-9]+)(?:[#|].*)?$/i.exec(match[1])?.[1].toLowerCase();if(!ext||!['pdf','mp4','webm','mov','mkv','mp3','wav','m4a','ogg','flac'].includes(ext))return line;
  const id='cp-lazy-'+embeds.length;embeds.push({id,source:line,height:ext==='pdf'?400:/^(mp3|wav|m4a|ogg|flac)$/.test(ext)?54:225});return `<div class="cp-deferred-snapshot-embed" data-cp-embed="${id}"></div>`;
 }).join('\n');
 await MarkdownRenderer.render(app,prepared,host,path,component);if(!embeds.length||!host.isConnected)return;
 let disposed=false;const sources=new Map<HTMLElement,string>();
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||disposed)continue;const target=entry.target as HTMLElement,original=sources.get(target);if(!original)continue;sources.delete(target);observer.unobserve(target);target.style.minHeight='';const child=new Component();component.addChild(child);void MarkdownRenderer.render(app,original,target,path,child).catch(error=>{if(!disposed&&target.isConnected)target.setText('미리보기를 열 수 없습니다.');console.error(error);});}},{root:host});
 component.register(()=>{disposed=true;sources.clear();observer.disconnect();});
 for(const embed of embeds){const target=host.querySelector<HTMLElement>(`[data-cp-embed="${embed.id}"]`);if(target){target.style.minHeight=embed.height+'px';sources.set(target,embed.source);observer.observe(target);}}
}
