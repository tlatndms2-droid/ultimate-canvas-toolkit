export interface WritingRegion {x:number;y:number;width:number;height:number;}
export interface WritingTemplate {
 id:string;name:string;asset:string;custom?:boolean;
 region:WritingRegion;font:string;fontSize:number;lineHeight:number;color:string;
 fit:'contain'|'cover';
}
export interface CompositionSettings {selected:string;scroll:'normal'|'typewriter';count:boolean;templates:WritingTemplate[];}
export function characterCount(text:string):number {
 const segmenter=new Intl.Segmenter('ko',{granularity:'grapheme'});
 return [...segmenter.segment(text.replace(/\s/gu,''))].length;
}
/** Map normalized image region into the viewport without changing image aspect. */
export function mapRegion(r:WritingRegion,vw:number,vh:number,iw:number,ih:number,fit:'contain'|'cover') {
 const scale=(fit==='cover'?Math.max:Math.min)(vw/iw,vh/ih),w=iw*scale,h=ih*scale;
 const left=(vw-w)/2+r.x*w,top=(vh-h)/2+r.y*h;
 // Cover can crop the paper; constrain its writing area to the visible viewport.
 const x=Math.max(12,left),y=Math.max(12,top);
 return {x,y,width:Math.max(1,Math.min(vw-12,left+r.width*w)-x),height:Math.max(1,Math.min(vh-12,top+r.height*h)-y)};
}
