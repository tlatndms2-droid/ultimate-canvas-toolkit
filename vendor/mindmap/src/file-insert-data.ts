import type {CanvasData,Card} from './layout';
export function canInsertFile(card:Card|undefined):boolean{return !!card&&(card.type==='file'||card.type==='text'&&!String(card.text??'').trim());}
export function insertFile(data:CanvasData,id:string,path:string,videoDefaultWidth?:number):CanvasData{
 const card=data.nodes.find(n=>n.id===id);if(!canInsertFile(card))throw Error('빈 카드 또는 파일 카드 하나를 선택하세요.');
 const result=structuredClone(data),index=result.nodes.findIndex(n=>n.id===id);
 const {text,subpath,...rest}=result.nodes[index];result.nodes[index]={...rest,type:'file',file:path};
 if(videoDefaultWidth!==undefined){const bounds=videoInsertBounds(result.nodes[index],videoDefaultWidth);Object.assign(result.nodes[index],bounds);}
 return result;
}

/** Initial video space only: do not carry over a collapsed audio player's height.
 * Native Canvas then fits the video's actual aspect ratio inside this box.
 * This is not a minimum enforced on subsequent manual resizing. */
export function videoInsertBounds(card:Card,defaultWidth:number):{width:number;height:number}{
 const width=Math.max(card.width,Number.isFinite(defaultWidth)&&defaultWidth>0?defaultWidth:card.width);
 return {width,height:Math.max(card.height,Math.ceil(width*9/16))};
}
