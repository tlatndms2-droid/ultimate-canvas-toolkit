import type {StoredItem} from './library';
export const kindIcons:Record<string,string>={'이미지':'image','카드':'sticky-note','Markdown':'file-code','PDF':'file-text','묶음':'group','동영상':'video','오디오':'music','포탈':'door-open','링크 포탈':'door-open','웹 링크':'globe','파일':'file'};
export function isSinglePortal(item:StoredItem):boolean {
  const nodes=item.uctPortal?.transfer?.nodes;
  return !!nodes&&nodes.length===1&&nodes[0].canvasPortalRef?.role==='entry';
}
/** Repair only the old automatic presentation of a mixed Portal collection.
 * Its actual transfer graph, IDs, assets and user-assigned name stay intact. */
export function repairPortalPresentation(item:StoredItem){
  if(!item.uctPortal||isSinglePortal(item))return;
  const nodes=item.uctPortal.transfer?.nodes??[];
  const entry=nodes.find((n:any)=>n.canvasPortalRef?.role==='entry');
  const record=item.uctPortal.transfer?.canvasPortalTransfer?.portals?.[entry?.canvasPortalRef.id];
  if(!item.customDisplayTitle&&item.displayTitle===record?.name){
    const group=nodes.find((n:any)=>n.type==='group'&&n.label);
    item.displayTitle=group?.label||'선택한 자료 묶음';
  }
  if(item.group)item.uctPreviewGroup=item.group;
}
export function isCutBundle(item:StoredItem):boolean{return item.type==='group'&&item.cutFromCanvas===true&&!isSinglePortal(item);}
export function itemKind(item:StoredItem):{label:string;icon:string}{
  if(item.uctPortal){if(!isSinglePortal(item))return {label:'묶음',icon:isCutBundle(item)?'scissors':'group'};const t=item.uctPortal.transfer;const entry=t.nodes[0];const p=t.canvasPortalTransfer?.portals?.[entry.canvasPortalRef.id];return p?.type==='link'?{label:'링크 포탈',icon:'door-open'}:{label:'포탈',icon:'door-open'};}
  if(item.type==='group')return {label:'묶음',icon:isCutBundle(item)?'scissors':'group'};
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
