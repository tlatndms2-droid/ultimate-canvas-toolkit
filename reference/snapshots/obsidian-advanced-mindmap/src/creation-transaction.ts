import type {CanvasData} from './layout';
/** Creation is additive. Never re-import existing embeds or connections. */
export function applyCreation(canvas:any,before:CanvasData,after:CanvasData){
 const nodes=new Set(before.nodes.map(n=>n.id)),edges=new Set(before.edges.map(e=>e.id));
 const added={nodes:after.nodes.filter(n=>!nodes.has(n.id)),edges:after.edges.filter(e=>!edges.has(e.id))};
 canvas.importData(added,false);
 const actual:CanvasData=canvas.getData();
 // Abort instead of committing a creation that loses an existing connection.
 for(const edge of before.edges){const live=actual.edges.find(e=>e.id===edge.id);if(!live||Object.keys(edge).some(k=>edge[k]!==live[k]))throw Error('Existing connection changed during creation');}
 for(const node of added.nodes)if(!actual.nodes.some(n=>n.id===node.id))throw Error('Created card missing');
 for(const edge of added.edges)if(!actual.edges.some(e=>e.id===edge.id))throw Error('Created connection missing');
 canvas.data={...after,nodes:actual.nodes,edges:actual.edges};canvas.pushHistory(canvas.getData());
}
