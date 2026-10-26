export interface CanvasNode {id:string;type:string;x:number;y:number;width:number;height:number;text?:string;file?:string;url?:string;label?:string;subpath?:string;[key:string]:unknown}
export interface CanvasDocument {canvasOutliner?:{version:1;id:string};nodes:CanvasNode[];edges:unknown[]}
export interface Ref {kind:'node'|'collection';id:string}
export interface Collection {id:string;name:string;parent:string|null;refs:Ref[]}
export interface Metadata {created:number|null;updated:number|null;signature:string;order:number;name?:string;fileSignature?:string}
export interface Area {native?:boolean;id:string;name:string;x:number;y:number;width:number;height:number}
export interface Step {id:string;kind:'node'|'area';target:string}
export type SortMode='name'|'created'|'updated'|'size'|'custom';
export interface CanvasState {identity?:string;visionGroups?:Area[];registered:string[];collections:Collection[];meta:Record<string,Metadata>;custom:Record<string,string[]>;steps:Step[];areas:Area[];current:string|null;presentation:boolean;snapshot:CanvasDocument|null}
export interface Settings {vgVision?:boolean;remotePinned?:boolean;searchPinned?:boolean;sidebarEffectsOpen?:boolean;presentationHideSidebars:boolean;presentationSidebarRestore?:{left:boolean;right:boolean};sort:SortMode;descending:boolean;customOnly?:boolean;searchSize?:{width:number;height:number};remoteSize?:{width:number;height:number};icons:boolean;iconPosition:'left'|'right';order:boolean;orderMode:'icon'|'overlay'|'both';vision:boolean;groupFill:boolean;glow:boolean;dim:boolean;blur:boolean;dimStrength:number;blurStrength:number;glowStrength:number;fitPadding:number;animation:number;searchMode:'text'|'heading'|'line'|'all';heading:number;}
export interface Store {identityTransfers?:Record<string,import('./identity').IdentityTransfer>;version:1;canvases:Record<string,CanvasState>;settings:Settings}
export const defaultSettings:Settings={presentationHideSidebars:true,sort:'custom',descending:false,icons:true,iconPosition:'right',order:false,orderMode:'icon',vision:true,groupFill:true,glow:false,dim:false,blur:false,dimStrength:.5,blurStrength:3,glowStrength:12,fitPadding:40,animation:220,searchMode:'text',heading:2};
export const emptyCanvas=():CanvasState=>({visionGroups:[],registered:[],collections:[],meta:{},custom:{},steps:[],areas:[],current:null,presentation:false,snapshot:null});
export const emptyStore=():Store=>({version:1,canvases:{},settings:{...defaultSettings}});
export const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
export const uid=()=>crypto.randomUUID();
export function contains(a:Pick<CanvasNode,'x'|'y'|'width'|'height'>,b:Pick<CanvasNode,'x'|'y'|'width'|'height'>){return b.x>=a.x&&b.y>=a.y&&b.x+b.width<=a.x+a.width&&b.y+b.height<=a.y+a.height;}
export const area=(n:{width:number;height:number})=>n.width*n.height;
export function signature(n:CanvasNode){return JSON.stringify([n.type,n.text,n.file,n.url,n.label,n.subpath]);}
export function sync(state:CanvasState,doc:CanvasDocument,now=Date.now()){
  const initial=state.snapshot===null;let next=Math.max(-1,...Object.values(state.meta).map(x=>x.order))+1;let changed=false;
  for(const n of doc.nodes){const sig=signature(n);const m=state.meta[n.id];if(!m){state.meta[n.id]={created:initial?null:now,updated:initial?null:now,signature:sig,order:next++};changed=true;}else if(m.signature!==sig){m.signature=sig;m.updated=now;changed=true;}}
  // Deletion references survive only while this Canvas remains open, to support native Undo.
  const previous=state.snapshot;state.snapshot=clone(doc);const refsChanged=normalizeCollectionRefs(state,doc);return changed||refsChanged||JSON.stringify(previous)!==JSON.stringify(doc);
}
export function purgeMissing(s:CanvasState){const ids=new Set(s.snapshot?.nodes.map(x=>x.id)||[]);s.registered=s.registered.filter(x=>ids.has(x));for(const c of s.collections)c.refs=c.refs.filter(x=>x.kind!=='node'||ids.has(x.id));s.steps=s.steps.filter(x=>x.kind!=='node'||ids.has(x.target));for(const id of Object.keys(s.meta))if(!ids.has(id))delete s.meta[id];if(!s.steps.some(x=>x.id===s.current))s.current=s.steps[0]?.id??null;}
export function hierarchy(doc:CanvasDocument,s:CanvasState){
  const groups=doc.nodes.filter(n=>n.type==='group'&&!s.visionGroups?.some(a=>a.id===n.id));const parents=new Map<string,string|null>();
  const choose=(list:CanvasNode[])=>list.sort((a,b)=>area(a)-area(b)||(s.meta[b.id]?.order??0)-(s.meta[a.id]?.order??0))[0]?.id??null;
  for(const n of doc.nodes){if(s.visionGroups?.some(a=>a.id===n.id)){parents.set(n.id,null);continue;}let candidates=groups.filter(g=>g.id!==n.id&&contains(g,n));if(n.type==='group')candidates=candidates.filter(g=>area(g)>area(n));parents.set(n.id,choose(candidates));}
  const counts=new Map(groups.map(g=>[g.id,0]));
  for(const id of s.registered){if(!doc.nodes.some(x=>x.id===id&&x.type!=='group'))continue;let p=parents.get(id);const seen=new Set<string>();while(p&&!seen.has(p)){seen.add(p);counts.set(p,(counts.get(p)||0)+1);p=parents.get(p);}}
  return {parents,counts};
}
export function nodeName(n:CanvasNode,s:CanvasState){return s.meta[n.id]?.name||(n.type==='group'?n.label:(n.text||'').split(/\r?\n/).find(x=>x.trim())?.replace(/^#+\s*/,''))||n.file?.split('/').pop()||n.url||'Item';}
export function sorted(nodes:CanvasNode[],s:CanvasState,settings:Settings,parent='root'){
  if(settings.sort==='custom'){const order=s.custom[parent]??[];return [...nodes].sort((a,b)=>(order.indexOf(a.id)<0?1e9:order.indexOf(a.id))-(order.indexOf(b.id)<0?1e9:order.indexOf(b.id)));}
  const order=s.custom[parent]??[];const index=new Map(order.map((x,i)=>[x,i]));
  return [...nodes].sort((a,b)=>{let v=0;if(settings.sort==='name')v=nodeName(a,s).localeCompare(nodeName(b,s),'ko');else if(settings.sort==='size')v=area(a)-area(b);else{const x=s.meta[a.id]?.[settings.sort as 'created'|'updated']??null,y=s.meta[b.id]?.[settings.sort as 'created'|'updated']??null;if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;v=(x??0)-(y??0);}return (settings.descending?-v:v)||a.id.localeCompare(b.id);});
}
export function register(s:CanvasState,ids:string[]){s.registered=[...new Set([...s.registered,...ids])];}
export function unregister(s:CanvasState,id:string){s.registered=s.registered.filter(x=>x!==id);for(const c of s.collections)c.refs=c.refs.filter(x=>x.kind!=='node'||x.id!==id);s.steps=s.steps.filter(x=>x.kind!=='node'||x.target!==id);if(!s.steps.some(x=>x.id===s.current))s.current=s.steps[0]?.id??null;}
// A Canvas Group owns its children; ungrouped nodes have at most one Collection.
export function normalizeCollectionRefs(s:CanvasState,doc:CanvasDocument){
 const {parents}=hierarchy(doc,s),seen=new Set<string>();let changed=false;
 for(const c of s.collections){const before=c.refs.length;c.refs=c.refs.filter(r=>{if(r.kind!=='node')return true;if(parents.get(r.id)||seen.has(r.id))return false;seen.add(r.id);return true;});if(c.refs.length!==before)changed=true;}return changed;
}
export function addRef(s:CanvasState,cid:string,id:string,_from?:string,_copy=false){
 const c=s.collections.find(x=>x.id===cid);if(!c)throw Error('Collection 없음');
 if(s.snapshot&&hierarchy(s.snapshot,s).parents.get(id))throw Error('Group 안의 Item과 하위 Group은 해당 Group 아래에만 표시합니다.');
 for(const other of s.collections)if(other.id!==cid)other.refs=other.refs.filter(r=>r.kind!=='node'||r.id!==id);
 if(!c.refs.some(x=>x.kind==='node'&&x.id===id))c.refs.push({kind:'node',id});
}
export function moveCollection(s:CanvasState,id:string,parent:string|null){let p=parent;while(p){if(p===id)throw Error('Collection 안에 자신을 넣을 수 없습니다.');p=s.collections.find(x=>x.id===p)?.parent??null;}const c=s.collections.find(x=>x.id===id);if(c)c.parent=parent;}
export function deleteCollection(s:CanvasState,id:string,subtree:boolean){const c=s.collections.find(x=>x.id===id);if(!c)return;const remove=new Set([id]);if(subtree){let more=true;while(more){more=false;for(const x of s.collections)if(x.parent&&remove.has(x.parent)&&!remove.has(x.id)){remove.add(x.id);more=true;}}}else{for(const x of s.collections)if(x.parent===id)x.parent=c.parent;const parent=s.collections.find(x=>x.id===c.parent);if(parent)for(const ref of c.refs)if(!parent.refs.some(r=>r.kind===ref.kind&&r.id===ref.id))parent.refs.push(ref);}
  s.collections=s.collections.filter(x=>!remove.has(x.id));
}
export function validSteps(s:CanvasState,doc:CanvasDocument){return s.steps.filter(x=>x.kind==='area'?s.areas.some(a=>a.id===x.target):doc.nodes.some(n=>n.id===x.target));}
export function navigate(s:CanvasState,doc:CanvasDocument,delta:number){const steps=validSteps(s,doc);if(!steps.length)return null;let i=steps.findIndex(x=>x.id===s.current);i=i<0?(delta>0?-1:0):i;const target=steps[(i+delta+steps.length)%steps.length];s.current=target.id;return target;}
export interface SearchResult {mode?:'text'|'heading'|'line';node:CanvasNode;name:string;line?:number;text:string;heading?:number;start?:number;end?:number;collections?:string[]}
export function searchTerms(query:string){return [...new Set(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))];}
export function matchesSearch(text:string,query:string|string[]){const terms=typeof query==='string'?searchTerms(query):query;const lower=text.toLocaleLowerCase();return terms.every(term=>lower.includes(term));}
export function firstSearchTerm(text:string,query:string){const lower=text.toLocaleLowerCase();return searchTerms(query).filter(term=>lower.includes(term)).sort((a,b)=>lower.indexOf(a)-lower.indexOf(b)||b.length-a.length)[0]??'';}
export function search(doc:CanvasDocument,s:CanvasState,q:string,types:Set<string>,mode:'text'|'heading'|'line'|'all',level:number,texts:Map<string,string>,outliner=false):SearchResult[]{
  if(mode==='all')return (['text','heading','line'] as const).flatMap(kind=>search(doc,s,q,types,kind,level,texts,outliner).map(result=>({...result,mode:kind})));
  const query=q.trim().toLocaleLowerCase(),terms=searchTerms(query);if(!query)return [] as SearchResult[];const result:SearchResult[]=[];
  for(const node of doc.nodes){if(outliner&&node.type!=='group'&&!s.registered.includes(node.id))continue;if(types.size&&!types.has(nodeType(node))&&!(node.type==='link'&&(types.has('Link')||types.has('Link Card'))))continue;
    const name=nodeName(node,s),text=texts.get(node.id)??node.text??node.file??node.url??node.label??'';
    if(mode==='text'){if(matchesSearch(name+'\n'+text,terms))result.push({node,name,text:text.slice(Math.max(0,text.toLocaleLowerCase().indexOf(firstSearchTerm(text,query))-70),Math.max(0,text.toLocaleLowerCase().indexOf(firstSearchTerm(text,query))-70)+240),collections:s.collections.filter(c=>c.refs.some(r=>r.kind==='node'&&r.id===node.id)).map(c=>c.name)});}
    else if(node.type==='text'||(node.type==='file'&&node.file?.toLowerCase().endsWith('.md'))){let offset=0,fence='';for(const [i,line] of text.split('\n').entries()){const marker=/^\s*(`{3,}|~{3,})/.exec(line);const inFence=!!fence;if(marker){if(!fence)fence=marker[1][0];else if(marker[1][0]===fence)fence='';}const heading=(!inFence&&!marker)?/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line):null;if(matchesSearch(line,terms)&&(mode==='line'||heading?.[1].length===level))result.push({node,name,line:i+1,text:line,heading:heading?.[1].length,start:offset,end:offset+line.length});offset+=line.length+1;}}
  }return result;
}
export function nodeType(n:CanvasNode){if(n.type==='text')return 'Card';if(n.type==='group')return 'Group';if(n.type==='link')return /youtu\.?be/.test(n.url||'')?'YouTube':'Site URL';const ext=n.file?.split('.').pop()?.toLowerCase();return ext==='md'?'Markdown':ext==='pdf'?'PDF':/^(png|jpg|jpeg|gif|svg|webp)$/.test(ext||'')?'Image':'File';}
export function documentKey(doc:CanvasDocument){const canonical=(x:any):any=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;return JSON.stringify(canonical({...doc,nodes:[...doc.nodes].sort((a,b)=>a.id.localeCompare(b.id))}));}

export function placeCollection(s:CanvasState,id:string,target:string,position:'before'|'inside'|'after'){if(id===target)return;const dest=s.collections.find(c=>c.id===target),source=s.collections.find(c=>c.id===id);if(!dest||!source)return;moveCollection(s,id,position==='inside'?target:dest.parent);s.collections=s.collections.filter(c=>c.id!==id);const at=position==='inside'?s.collections.length:s.collections.findIndex(c=>c.id===target)+(position==='after'?1:0);s.collections.splice(at,0,source);}


export function collectionCounts(doc:CanvasDocument,s:CanvasState,parents=hierarchy(doc,s).parents){
 const nodes=new Map(doc.nodes.map(n=>[n.id,n])),registered=new Set(s.registered),children=new Map<string,string[]>(),sub=new Map<string,string[]>();
 for(const [id,parent] of parents)if(parent)children.set(parent,[...(children.get(parent)??[]),id]);
 for(const c of s.collections)if(c.parent)sub.set(c.parent,[...(sub.get(c.parent)??[]),c.id]);
 const byId=new Map(s.collections.map(c=>[c.id,c])),result=new Map<string,{groups:number;items:number}>();
 for(const collection of s.collections){const groups=new Set<string>(),items=new Set<string>(),seenNodes=new Set<string>(),seenCollections=new Set<string>();
 const visitNode=(id:string)=>{if(seenNodes.has(id))return;seenNodes.add(id);const n=nodes.get(id);if(!n)return;if(n.type==='group'){groups.add(id);for(const child of children.get(id)??[])visitNode(child);}else if(registered.has(id))items.add(id);};
 const visitCollection=(id:string)=>{if(seenCollections.has(id))return;seenCollections.add(id);for(const ref of byId.get(id)?.refs??[])if(ref.kind==='node')visitNode(ref.id);for(const child of sub.get(id)??[])visitCollection(child);};
 visitCollection(collection.id);result.set(collection.id,{groups:groups.size,items:items.size});}return result;
}
