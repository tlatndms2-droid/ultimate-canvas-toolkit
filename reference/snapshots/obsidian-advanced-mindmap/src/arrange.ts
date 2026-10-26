import type {CanvasData,Card} from './layout';

/** Multi-source distance determines scope; a stable forest moves each node at most once. */
export function arrangeSelection(input:CanvasData,selected:string[],gap:number,depth=1,range=3):CanvasData{
 let result=input;
 // A moved parent can change whether a later sibling block is near it. Settle that
 // classification before applying any positions to Canvas (one Undo transaction).
 const seen=new Map<string,CanvasData>();
 for(let pass=0;pass<6;pass++){
  const key=JSON.stringify(result.nodes.map(n=>[n.x,n.y]));seen.set(key,result);
  const next=arrangePass(result,selected,gap,depth,range);
  const nextKey=JSON.stringify(next.nodes.map(n=>[n.x,n.y]));
  if(nextKey===key)return next;
  if(seen.has(nextKey)){const entries=[...seen.entries()],start=entries.findIndex(([k])=>k===nextKey);return entries.slice(start).sort(([a],[b])=>a.localeCompare(b))[0][1];}
  result=next;
 }
 return result;
}

function arrangePass(input:CanvasData,selected:string[],gap:number,depth:number,range:number):CanvasData{
 const valid=new Set(input.nodes.filter(n=>n.type!=='group').map(n=>n.id));
 const roots=[...new Set(selected)].filter(id=>valid.has(id));
 const steps=Math.max(1,Math.min(10,Math.floor(depth)||1));
 const adjacency=new Map<string,Set<string>>(),incident=new Map<string,CanvasData['edges']>();
 for(const edge of input.edges)for(const id of new Set([edge.fromNode,edge.toNode])){if(!incident.has(id))incident.set(id,[]);incident.get(id)!.push(edge);}
 for(const edge of input.edges){if(!valid.has(edge.fromNode)||!valid.has(edge.toNode)||edge.fromNode===edge.toNode)continue;for(const [a,b] of [[edge.fromNode,edge.toNode],[edge.toNode,edge.fromNode]]){if(!adjacency.has(a))adjacency.set(a,new Set());adjacency.get(a)!.add(b);}}
 const distance=new Map(roots.map(id=>[id,0]));const queue=[...roots];
 for(let i=0;i<queue.length;i++){const id=queue[i],d=distance.get(id)!;if(d>=steps)continue;for(const next of adjacency.get(id)||[]){if(distance.has(next))continue;distance.set(next,d+1);queue.push(next);}}
 let result=structuredClone(input);const visited=new Set<string>();
 for(const root of roots){if(visited.has(root))continue;visited.add(root);const parents=[root];
  for(let i=0;i<parents.length;i++){const parent=parents[i],children=new Set<string>();
   for(const next of adjacency.get(parent)||[]){if(!distance.has(next)||visited.has(next))continue;visited.add(next);children.add(next);parents.push(next);}
   if(!children.size)continue;
   // Already placed neighbours still occupy a slot in their sibling row/column.
   // Omitting them made a sibling land on the selected root, then get pushed sideways.
   const edges=(incident.get(parent)||[]).filter(e=>distance.has(e.fromNode)&&distance.has(e.toNode));
   const pending=new Set([...distance.keys()].filter(id=>!visited.has(id)));
   arrangeInPlace({...result,edges},parent,gap,children,range,pending);
  }
 }
 return result;
}

/** Align near the existing cluster, then resolve collisions per card. */
export function arrangeConnected(input:CanvasData,id:string,gap:number,allowed?:ReadonlySet<string>,range=3):CanvasData{
 return arrangeInPlace(structuredClone(input),id,gap,allowed,range);
}

/** The caller owns this working copy; future nodes are placed against committed nodes later. */
function arrangeInPlace(data:CanvasData,id:string,gap:number,allowed?:ReadonlySet<string>,range=3,pending:ReadonlySet<string>=new Set()):CanvasData{
 const input=data,anchor=data.nodes.find(n=>n.id===id);
 if(!anchor||!Number.isFinite(gap)||gap<0)return data;
 const ids=new Set(input.edges.flatMap(e=>e.fromNode===id?[e.toNode]:e.toNode===id?[e.fromNode]:[]));ids.delete(id);
 const overlap=(a:Card,b:Card)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const faces=new Map<string,Set<string>>();
 for(const e of input.edges){const other=e.fromNode===id?e.toNode:e.toNode===id?e.fromNode:null,side=e.fromNode===id?e.fromSide:e.toSide;if(other&&['left','right','top','bottom'].includes(String(side))){const set=faces.get(other)||new Set<string>();set.add(String(side));faces.set(other,set);}}
 const neighbours=data.nodes.filter(n=>ids.has(n.id)&&n.type!=='group');
 const groups:Card[][]=[[],[],[],[]];
 const movable=new Set<string>(),directions=new Map<string,number>();
 for(const n of neighbours){
  const sides=faces.get(n.id)||new Set<string>();
  // Conflicting attachment faces cannot be assigned to one row without changing the user's layout.
  if(sides.size>1)continue;
  const dx=n.x+n.width/2-anchor.x-anchor.width/2,dy=n.y+n.height/2-anchor.y-anchor.height/2;
  const side=[...sides][0],index=side?['left','right','top','bottom'].indexOf(String(side)):Math.abs(dx)>=Math.abs(dy)?dx<0?0:1:dy<0?2:3;
  groups[index].push(n);directions.set(n.id,index);if(!allowed||allowed.has(n.id))movable.add(n.id);
 }
 const unplaced=new Set(movable);
 const resolve=(cards:Card[],horizontal:boolean)=>{
  const moving=cards.filter(n=>movable.has(n.id));for(const n of moving)unplaced.delete(n.id);
  const movingIds=new Set(moving.map(n=>n.id));
  const obstacles=data.nodes.filter(o=>o.type!=='group'&&!movingIds.has(o.id)&&!pending.has(o.id)&&!unplaced.has(o.id));
  if(!moving.some(n=>obstacles.some(o=>overlap(n,o))))return;
  // Shift a sibling block together: individual escape positions change sibling order on the next run.
  const intervals:number[][]=[];
  for(const n of moving)for(const o of obstacles){
   if(horizontal?n.x<o.x+o.width&&n.x+n.width>o.x:n.y<o.y+o.height&&n.y+n.height>o.y)
    intervals.push(horizontal?[o.y-n.y-n.height-gap,o.y+o.height-n.y+gap]:[o.x-n.x-n.width-gap,o.x+o.width-n.x+gap]);
  }
  intervals.sort((a,b)=>a[0]-b[0]);const merged:number[][]=[];
  for(const interval of intervals){const last=merged[merged.length-1];if(last&&interval[0]<last[1])last[1]=Math.max(last[1],interval[1]);else merged.push([...interval]);}
  const blocked=merged.find(([start,end])=>start<0&&end>0);
  if(blocked){const delta=-blocked[0]<=blocked[1]?blocked[0]:blocked[1];for(const n of moving){if(horizontal)n.y+=delta;else n.x+=delta;}}
 };
 const distance=(a:Card,b:Card)=>Math.hypot(Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width),Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height));
 groups.forEach((directionCards,index)=>{
  if(!directionCards.length)return;
  // Determine locality from ordinary card sizes, not from a far outlier's position.
  const sizes=directionCards.map(n=>Math.max(n.width,n.height)).sort((a,b)=>a-b);
  const level=Number.isFinite(range)?Math.max(1,Math.min(5,Math.round(range))):3;
  const threshold=2*[0.5,0.75,1,1.5,2][level-1]*Math.max(gap,sizes[Math.floor((sizes.length-1)/2)]);
  const pending=new Set(directionCards);
  while(pending.size){
   const first=pending.values().next().value!;pending.delete(first);const cards=[first];
   for(let i=0;i<cards.length;i++)for(const n of [...pending])if(distance(cards[i],n)<=threshold){pending.delete(n);cards.push(n);}
   if(!cards.some(n=>movable.has(n.id)))continue;
   const horizontal=index<2;
   if(cards.length===1){const n=cards[0];if(distance(anchor,n)<=threshold){if(horizontal)n.y=anchor.y+(anchor.height-n.height)/2;else n.x=anchor.x+(anchor.width-n.width)/2;}resolve(cards,horizontal);continue;}
   cards.sort((a,b)=>(horizontal?a.y+a.height/2-b.y-b.height/2:a.x+a.width/2-b.x-b.width/2)||a.id.localeCompare(b.id));
   const axis=cards.reduce((sum,n)=>sum+(horizontal?n.x+(index===0?n.width:0):n.y+(index===2?n.height:0)),0)/cards.length;
   let offset=0;const offsets=cards.map(n=>{const value=offset;offset+=(horizontal?n.height:n.width)+gap;return value;});
   const nearAnchor=cards.some(n=>distance(anchor,n)<=threshold);
   const start=nearAnchor
    ? (horizontal?anchor.y+anchor.height/2:anchor.x+anchor.width/2)-(offset-gap)/2
    : cards.reduce((sum,n,i)=>sum+(horizontal?n.y:n.x)-offsets[i],0)/cards.length;
   const fixedIndex=cards.findIndex(n=>!movable.has(n.id)),fixed=cards[fixedIndex];
   const alignedAxis=fixed?(horizontal?fixed.x+(index===0?fixed.width:0):fixed.y+(index===2?fixed.height:0)):axis;
   const alignedStart=fixed?(horizontal?fixed.y:fixed.x)-offsets[fixedIndex]:start;
   cards.forEach((n,i)=>{if(!movable.has(n.id))return;if(horizontal){n.x=alignedAxis-(index===0?n.width:0);n.y=alignedStart+offsets[i];}else{n.y=alignedAxis-(index===2?n.height:0);n.x=alignedStart+offsets[i];}});
   resolve(cards,horizontal);
  }
 });
 // Preserve every edge exactly, including its attachment faces.
 return data;
}
