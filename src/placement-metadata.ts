/** Only imported metadata belongs to a placement; unrelated spaces retain their timestamps. */
export function placementMetadata(before:any,after:any,space:string|null,path:string,added:string[],explicit:any[],now:number){
  const writes=new Map<string,{key:string;nodeId:string;metadata:any;modifiedAt:number}>();
  const keyFor=(id:string|null)=>id?path+'#uct-portal:'+id:path;
  const add=(key:string,node:any)=>{if(node.uctMetadata)writes.set(key+'\0'+node.id,{key,nodeId:node.id,metadata:node.uctMetadata,modifiedAt:node.uctMetadata.modifiedAt??now});};
  const addedIds=new Set(added);
  const graph=space?after.canvasPortal?.portals?.[space]?.graph:after;
  for(const node of graph?.nodes??[])if(addedIds.has(node.id))add(keyFor(space),node);
  for(const [id,portal] of Object.entries(after.canvasPortal?.portals??{}) as [string,any][]){
    if(Object.prototype.hasOwnProperty.call(before.canvasPortal?.portals??{},id))continue;
    for(const node of portal.graph?.nodes??[])add(keyFor(id),node);
  }
  for(const entry of explicit)writes.set(keyFor(space)+'\0'+entry.nodeId,{key:keyFor(space),nodeId:entry.nodeId,metadata:{...entry.metadata,tags:[]},modifiedAt:now});
  return [...writes.values()];
}
