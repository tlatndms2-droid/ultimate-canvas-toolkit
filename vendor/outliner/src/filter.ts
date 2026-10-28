export const nodeFormats = [
 ['card','카드','sticky-note'],['markdown','Markdown','file-code'],['image','이미지','image'],
 ['pdf','PDF','file-text'],['group','묶음','group'],['vision','Vision Group','scan-eye'],
 ['portal','포탈','door-open'],['linked-portal','링크 포탈','link'],['video','영상','video'],
 ['audio','오디오','music'],['web','웹 링크','globe'],['file','파일','file']
] as const;
export interface OutlinerFilter {types:Set<string>;labels:Set<string>}
export function nodeFormat(node:{type:string;file?:string;canvasPortalRef?:unknown},linked=false,vision=false):string {
 if(node.canvasPortalRef)return linked?'linked-portal':'portal';
 if(vision)return 'vision';
 if(node.type==='group')return 'group';
 if(node.type==='text')return 'card';
 if(node.type==='link')return 'web';
 const ext=node.file?.split('.').pop()?.toLowerCase();
 if(ext==='md')return 'markdown';if(ext==='pdf')return 'pdf';
 if(ext&&['png','jpg','jpeg','gif','webp','svg','bmp','avif'].includes(ext))return 'image';
 if(ext&&['mp4','webm','mov','mkv','ogv','m4v'].includes(ext))return 'video';
 if(ext&&['mp3','wav','ogg','m4a','flac','aac','opus'].includes(ext))return 'audio';
 return 'file';
}
export function matchesFilter(format:string,label:string,filter:OutlinerFilter){
 return filter.types.has(format)&&(!filter.labels.size||filter.labels.has(label.trim()));
}
