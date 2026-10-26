import type {StoredItem} from './library';
export function itemKind(item:StoredItem):{label:string;icon:string}{
  if(item.uctPortal){const t=item.uctPortal.transfer;const entry=t?.nodes?.find((n:any)=>n.canvasPortalRef?.role==='entry');const p=t?.canvasPortalTransfer?.portals?.[entry?.canvasPortalRef.id];return p?.type==='link'?{label:'링크 포탈',icon:'door-open'}:{label:'포탈',icon:'door-open'};}
  if(item.type==='group')return {label:'묶음',icon:'group'};
  const path=item.origin?.filePath??item.sourceReferencePath??'';const ext=path.split('.').at(-1)?.toLowerCase();
  if(ext==='pdf')return {label:'PDF',icon:'file-text'};
  if(ext==='md')return {label:'Markdown',icon:'file-code'};
  if(/^(png|jpg|jpeg|webp|svg|avif|gif|bmp)$/.test(ext??'')||item.type==='image')return {label:'이미지',icon:'image'};
  if(/^(mp4|webm|mov|mkv|ogv)$/.test(ext??'')||item.type==='video')return {label:'동영상',icon:'video'};
  if(/^(mp3|m4a|wav|ogg|flac)$/.test(ext??''))return {label:'오디오',icon:'music'};
  if(item.type==='card')return {label:'카드',icon:'sticky-note'};
  if(item.type==='markdown')return {label:'Markdown',icon:'file-code'};
  if(item.type==='link')return {label:'웹 링크',icon:'globe'};
  return {label:'파일',icon:'file'};
}
