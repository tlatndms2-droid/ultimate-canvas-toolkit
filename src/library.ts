export type StoredItem = Record<string, any> & {id:string;displayTitle:string;folderId:string|null;origin:Record<string,any>;createdAt:number;modifiedAt:number};
export interface LibraryFolder {id:string;name:string;parentId:string|null;}
export interface LibraryData {version:1;migrated:boolean;items:Record<string,StoredItem>;folders:LibraryFolder[];ui:{collapsedFolders?:string[];open:boolean;left:boolean;mode:'grid'|'list';sort:string;width:number;height:number;x:number|null;y:number|null};}
export const uid=()=>crypto.randomUUID().replaceAll('-','');
export const emptyLibrary=():LibraryData=>({version:1,migrated:false,items:{},folders:[{id:'unclassified',name:'미분류',parentId:null}],ui:{open:false,left:true,mode:'grid',sort:'modified-desc',width:1060,height:660,x:null,y:null}});
export function validateLibrary(value:any):asserts value is LibraryData {
  if(value?.version!==1||!value.items||typeof value.items!=='object'||Array.isArray(value.items)||!Array.isArray(value.folders))throw Error('지원하지 않는 Mini 보관함 형식입니다.');
  const folderIds=new Set(value.folders.map((f:any)=>f.id));
  if(folderIds.size!==value.folders.length)throw Error('중복된 폴더 ID입니다.');
  for(const f of value.folders){if(typeof f.id!=='string'||typeof f.name!=='string'||(f.parentId!==null&&!folderIds.has(f.parentId)))throw Error('폴더 경로가 올바르지 않습니다.');const seen=new Set([f.id]);let p=f.parentId;while(p){if(seen.has(p))throw Error('폴더 순환 참조입니다.');seen.add(p);p=value.folders.find((x:any)=>x.id===p)?.parentId;}}
  for(const [id,item] of Object.entries(value.items) as [string,StoredItem][]){if(id!==item.id||typeof item.displayTitle!=='string'||(item.folderId!==null&&!folderIds.has(item.folderId)))throw Error('보관 항목이 올바르지 않습니다.');}
}
export function deleteFolder(data:LibraryData,id:string){if(id==='unclassified')throw Error('미분류 폴더는 삭제할 수 없습니다.');if(!data.folders.some(f=>f.id===id))return;for(const f of data.folders)if(f.parentId===id)f.parentId='unclassified';for(const item of Object.values(data.items))if(item.folderId===id)item.folderId='unclassified';data.folders=data.folders.filter(f=>f.id!==id);}
export function removeSource(data:LibraryData,path:string,folder=false):string[]{
  const matches=(p:unknown)=>typeof p==='string'&&(p===path||folder&&p.startsWith(path+'/'));const removed:string[]=[];
  for(const item of Object.values(data.items)){
    if(item.uctPortal?.independent)continue;
    if(matches(item.origin?.filePath)||matches(item.sourceReferencePath)){delete data.items[item.id];removed.push(item.id);continue;}
    for(const graph of itemGraphs(item)){const bad=new Set((graph.nodes??[]).filter((n:any)=>matches(n.file)).map((n:any)=>n.id));if(bad.size){graph.nodes=graph.nodes.filter((n:any)=>!bad.has(n.id));graph.edges=(graph.edges??[]).filter((e:any)=>!bad.has(e.fromNode)&&!bad.has(e.toNode));}}
    if(item.group&&!item.group.nodes.length&&!item.uctPortal){delete data.items[item.id];removed.push(item.id);}
  }return removed;
}
function itemGraphs(item:StoredItem):any[]{return [item.group,item.uctPreviewGroup,item.uctPortal?.transfer,...Object.values(item.uctPortal?.transfer?.canvasPortalTransfer?.portals??{}).map((p:any)=>p.graph)].filter(Boolean);}
export function renameSource(data:LibraryData,oldPath:string,newPath:string){const map=(p:any)=>typeof p==='string'&&(p===oldPath||p.startsWith(oldPath+'/'))?newPath+p.slice(oldPath.length):p;for(const item of Object.values(data.items)){if(item.uctPortal?.independent)continue;item.origin.filePath=map(item.origin.filePath);if(item.sourceReferencePath)item.sourceReferencePath=map(item.sourceReferencePath);for(const g of itemGraphs(item))for(const n of g.nodes??[])if(n.file)n.file=map(n.file);}}
export function migratePalette(data:LibraryData,old:any){
  if(data.migrated)return;const originals=old?.items??{};const pending=new Set(old?.pendingItemIds??[]);const mappedFolders=new Map<string,string>();const assigned=new Set<string>();
  const addItem=(id:string,parent:string|null)=>{if(!originals[id])return;if(assigned.has(id)){const clone=structuredClone(originals[id]);clone.id=uid();clone.folderId=parent;clone.tags=[];clone.canvasPlacements=[];data.items[clone.id]=clone;return;}const item=structuredClone(originals[id]);item.id=id;item.folderId=parent;item.tags=[];item.canvasPlacements=[];item.origin??={};data.items[id]=item;assigned.add(id);};
  const visited=new Set<string>();const addCollection=(id:string,parent:string)=>{if(visited.has(id))return;visited.add(id);const c=old.collections?.[id];if(!c)return;const folderId=uid();mappedFolders.set(id,folderId);data.folders.push({id:folderId,name:c.name,parentId:parent});for(const itemId of c.itemIds??[])addItem(itemId,folderId);for(const child of c.childCollectionIds??[])addCollection(child,folderId);};
  for(const id of pending)addItem(id as string,null);
  for(const w of Object.values(old?.workspaces??{}) as any[]){if(w.kind==='archive'&&!(w.looseItemIds?.length||w.rootCollectionIds?.length))continue;const wid=uid();data.folders.push({id:wid,name:w.name,parentId:null});for(const c of w.rootCollectionIds??[])addCollection(c,wid);for(const id of w.looseItemIds??[])addItem(id,wid);}
  for(const id of old?.uiState?.miniPalette?.storageItemIds??[])if(!assigned.has(id))addItem(id,'unclassified');
  // Preserve item-owned subtrees as named folders instead of flattening them.
  const expanded=new Set<string>();
  const descendants=(id:string)=>{if(expanded.has(id))return;expanded.add(id);const item=originals[id],target=data.items[id];if(!item||!target)return;const children=(item.childItemIds??[]).filter((child:string)=>!!originals[child]),collections=item.childCollectionIds??[];if(!children.length&&!collections.length)return;const folder=uid();data.folders.push({id:folder,name:item.displayTitle||'자료',parentId:target.folderId??'unclassified'});for(const c of collections)addCollection(c,folder);for(const child of children){if(!assigned.has(child))addItem(child,folder);else if(data.items[child]?.folderId==='unclassified')data.items[child].folderId=folder;descendants(child);}};
  for(const id of [...assigned])descendants(id);
  for(const id of Object.keys(originals))if(!assigned.has(id)){addItem(id,'unclassified');descendants(id);}
  data.migrated=true;validateLibrary(data);
}
