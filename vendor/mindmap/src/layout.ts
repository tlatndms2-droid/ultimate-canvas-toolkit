export interface Card { id: string; type: string; x: number; y: number; width: number; height: number; text?: string; [key: string]: unknown }
export interface Edge { id: string; fromNode: string; toNode: string; fromSide?: string; toSide?: string; [key: string]: unknown }
export interface CanvasData { nodes: Card[]; edges: Edge[]; [key: string]: unknown }
export type Direction = 'left' | 'right' | 'up' | 'down';
export interface Creation { anchor: string; id: string; direction: Direction; tab: boolean; width: number; height: number; gap: number; connected: boolean; source?: string }
export function sources(data: CanvasData, id: string): Card[] {
  const ids = new Set(data.edges.filter(e => e.toNode === id || e.fromNode === id).map(e => e.toNode === id ? e.fromNode : e.toNode));
  ids.delete(id);
  return data.nodes.filter(n => ids.has(n.id) && n.type !== 'group').sort((a,b) => a.x-b.x || a.y-b.y || a.id.localeCompare(b.id));
}
/** Compute the entire change before touching the live Canvas. */
export function createLayout(input: CanvasData, op: Creation): CanvasData {
  const data: CanvasData = JSON.parse(JSON.stringify(input));
  const anchor = data.nodes.find(n => n.id === op.anchor);
  if (!anchor || anchor.type === 'group') throw Error('Select one card.');
  if (data.nodes.some(n => n.id === op.id)) throw Error('Duplicate card id');
  const {width,height,gap} = op;
  if (![width,height].every(n=>Number.isFinite(n)&&n>0) || !Number.isFinite(gap)||gap<0) throw Error('Invalid card size or spacing.');
  const dir = op.tab ? 'down' : op.direction;
  const node: Card = {id:op.id,type:'text',text:'',x:anchor.x,y:anchor.y,width,height};
  if (dir==='right') {node.x=anchor.x+anchor.width+gap;node.y=anchor.y+(anchor.height-height)/2;}
  if (dir==='left') node.x=anchor.x-width-gap;
  if (dir==='up') node.y=anchor.y-height-gap;
  if (dir==='down') node.y=anchor.y+anchor.height+gap;
  data.nodes.push(node);
  const source = op.tab ? op.source : anchor.id;
  const parent=data.nodes.find(n=>n.id===source);
  if(op.connected&&source&&parent){
    let facing:Direction=dir;
    if(op.tab){
      const dy=node.y+node.height/2-parent.y-parent.height/2;
      facing=parent.x+parent.width<=node.x ? 'right' : node.x+node.width<=parent.x ? 'left' : (dy>=0?'down':'up');
    }
    const side={up:'top',down:'bottom',left:'left',right:'right'},opposite={up:'bottom',down:'top',left:'right',right:'left'};
    data.edges.push({id:`e${op.id}`,fromNode:source,toNode:node.id,fromSide:side[facing],toSide:opposite[facing]});
  }
  return data;
}
