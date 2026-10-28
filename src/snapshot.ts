import {TFile,Notice} from 'obsidian';
import type UctPlugin from './main';
import {uid,type StoredItem} from './library';
import {repairPortalPresentation} from './item-kind';
const M=require('../vendor/portal/src/model.cjs');
const {serializeGroup}=require('../vendor/palette/src/canvas/group-serializer');

export async function collectSelection(root:UctPlugin,cut:boolean){
  const view=root.canvasView(),c=view?.canvas;if(!c||!view.file)throw Error('Canvas에서 자료를 먼저 선택하세요.');
  if(c.readonly)throw Error('읽기 전용 Canvas에서는 수집할 수 없습니다.');
  const selected=[...c.selection].filter((n:any)=>n.getData().canvasPortalRef?.role!=='exit').map((n:any)=>n.id);if(!selected.length)throw Error('수집할 카드를 선택하세요.');
  const source=c.getData(),path=view.file.path,pal=root.palette;const ids=new Set<string>(selected);
  for(const node of source.nodes)if(node.type==='group'&&ids.has(node.id))for(const child of pal.canvas.expandGroupNodes(source.nodes,[node.id]))ids.add(child.id);
  const selectedNodes=source.nodes.filter((n:any)=>ids.has(n.id));const portalNodes=selectedNodes.filter((n:any)=>n.canvasPortalRef?.role==='entry');
  let captures:any[]=[];const created:string[]=[];
  try{
    if(portalNodes.length){
      root.portal.discover();const session=root.session(view);if(!session)throw Error('포탈 공간이 아직 준비되지 않았습니다.');root.portal.capture(session);
      const records:Record<string,any>={};for(const node of portalNodes)for(const id of M.descendants(session.root,node.canvasPortalRef.id))records[id]=structuredClone(session.root.canvasPortal.portals[id]);
      for(const record of Object.values(records) as any[])for(const node of record.graph.nodes){const meta=root.palette.store.data.canvasNodeMetadata[path+'#uct-portal:'+record.id]?.[node.id]??session.root.uctNodeMetadata?.[record.id]?.[node.id];if(meta)node.uctMetadata=structuredClone(meta);}
      const independent=Object.values(records).some((record:any)=>record.type==='link');
      if(independent){const map=new Map<string,string>();for(const record of Object.values(records) as any[]){if(record.type==='link')record.target=await copyAsset(root,record.target,map,created);for(const node of record.graph.nodes)if(node.file)node.file=await copyAsset(root,node.file,map,created);}}
      const transfer={nodes:structuredClone(selectedNodes),edges:source.edges.filter((e:any)=>ids.has(e.fromNode)&&ids.has(e.toNode)),canvasPortalTransfer:{version:1,portals:records}};
      for(const node of transfer.nodes){const meta=root.metadata(path,node.id);if(meta)node.uctMetadata=structuredClone(meta);}
      const group=serializeGroup(transfer.nodes,transfer.edges);const first=portalNodes[0],meta=root.metadata(path,first.id)??{};
      let previewGroup=group;const firstPortal=records[first.canvasPortalRef.id];const singlePortal=selectedNodes.length===1;if(singlePortal&&firstPortal?.type==='select'){const nodes=firstPortal.graph.nodes.filter((n:any)=>n.canvasPortalRef?.role!=='exit');if(nodes.length)previewGroup=serializeGroup(nodes,firstPortal.graph.edges);}else if(singlePortal&&firstPortal?.target){const file=root.app.vault.getAbstractFileByPath(firstPortal.target);if(file instanceof TFile){const doc=JSON.parse(await root.app.vault.read(file));if(doc.nodes.length)previewGroup=serializeGroup(doc.nodes,doc.edges);}}
      captures=[{id:uid(),type:'group',displayTitle:firstPortal?.name??'포탈 묶음',origin:{canvasPath:path},canvasPlacements:[],tags:[],label:meta.label??'',labelColor:meta.labelColor??'',caption:meta.caption??'',backContent:'',facesEnabled:false,createdAt:Date.now(),modifiedAt:Date.now(),group,uctPortal:{transfer,independent,assets:created},uctPreviewGroup:previewGroup}];
    }else if(cut){const item=pal.canvas.groupItem(selectedNodes,source.edges,path,selectedNodes[0].id,true);if(item)captures=[item];}
    else captures=await pal.canvas.collectIds(source,path,selected);
    if(!captures.length)throw Error('보관할 수 있는 자료가 없습니다.');
    const snapshotMeta=(item:any)=>{item.id=uid();if(cut&&item.type==='group')item.cutFromCanvas=true;item.folderId=null;item.tags=[];item.canvasPlacements=[];item.origin??={};item.origin.canvasPath??=path;if(item.group)for(const meta of Object.values(item.group.nodeMetadata??{}) as any[])meta.tags=[];return item as StoredItem;};
    captures=captures.map(snapshotMeta);for(const item of captures)repairPortalPresentation(item);
    const before=structuredClone(source);
    for(const item of captures)root.library.items[item.id]=item;
    try{
      await root.saveLibrary();
      if(cut){const next={...source,nodes:source.nodes.filter((n:any)=>!ids.has(n.id)),edges:source.edges.filter((e:any)=>!ids.has(e.fromNode)&&!ids.has(e.toNode))};
        try{await c.setData(next);c.requestSave?.();await view.save();}
        catch(error){await c.setData(before);c.requestSave?.();await view.save();throw error;}
      }
    }catch(error){for(const item of captures)delete root.library.items[item.id];await root.saveLibrary();throw error;}
    new Notice(cut?'선택 자료를 Mini Collect로 잘라냈습니다.':`${captures.length}개 자료를 Mini Collect에 수집했습니다.`);
  }catch(error){for(const path of created){const file=root.app.vault.getAbstractFileByPath(path);if(file)await root.app.vault.delete(file).catch(()=>{});}throw error;}
}

/** Allocates the destination before walking dependencies, so cyclic Canvas or
 * Markdown links resolve to one captured file rather than recursive copies. */
export async function copyAsset(root:UctPlugin,path:string,map:Map<string,string>,created:string[]):Promise<string>{
  if(map.has(path))return map.get(path)!;const source=root.app.vault.getAbstractFileByPath(path);if(!(source instanceof TFile))throw Error('링크 포탈의 원본 파일을 찾지 못해 수집을 취소했습니다: '+path+' · 선택한 카드는 삭제하지 않았습니다.');
  const target=await root.app.fileManager.getAvailablePathForAttachment('uct-'+uid().slice(0,10)+'-'+source.name,root.canvasView()?.file?.path);map.set(path,target);
  if(source.extension==='canvas'){
    const doc=JSON.parse(await root.app.vault.read(source));
    const graphs=[doc,...Object.values(doc.canvasPortal?.portals??{}).map((p:any)=>p.graph)];
    for(const graph of graphs)for(const node of graph.nodes??[])if(node.file)node.file=await copyAsset(root,node.file,map,created);
    for(const portal of Object.values(doc.canvasPortal?.portals??{}) as any[])if(portal.type==='link'){portal.target=await copyAsset(root,portal.target,map,created);if(portal.originalEntry)portal.originalEntry.file=portal.target;}
    doc.uctNodeMetadata??={};for(const [key,meta]of Object.entries(root.palette.store.data.canvasNodeMetadata) as [string,any][]){if(key===path)doc.uctNodeMetadata.root=structuredClone(meta);else if(key.startsWith(path+'#uct-portal:'))doc.uctNodeMetadata[key.slice((path+'#uct-portal:').length)]=structuredClone(meta);}
    await root.app.vault.create(target,JSON.stringify(doc,null,2));created.push(target);
  }else if(source.extension==='md'){
    let text=await root.app.vault.read(source);
    const cache=root.app.metadataCache.getFileCache(source);const replacements=new Map<string,string>();for(const link of [...(cache?.links??[]),...(cache?.embeds??[])]){const linked=root.app.metadataCache.getFirstLinkpathDest(link.link,path);if(linked)replacements.set(link.link,await copyAsset(root,linked.path,map,created));}
    for(const [original,mapped] of replacements){text=text.split('[['+original+']]').join('[['+mapped+']]').split('[['+original+'|').join('[['+mapped+'|').split(']('+original+')').join(']('+mapped+')');}
    await root.app.vault.create(target,text);created.push(target);
  }else{await root.app.vault.createBinary(target,await root.app.vault.readBinary(source));created.push(target);}
  return target;
}

