import {Plugin,PluginSettingTab,Setting,TFile,TFolder,Notice,normalizePath} from 'obsidian';
import {promises as fs} from 'node:fs';
import {join} from 'node:path';
import {emptyLibrary,migratePalette,removeSource,renameSource,validateLibrary,type LibraryData} from './library';
import {MetadataEditor} from './metadata-editor';
import {UctMini} from './mini';
import {collectSelection} from './snapshot';
import {MiniPlacement} from './placement';
const Portal=require('../vendor/portal/src/main.cjs');
const Outliner=require('../vendor/outliner/src/main').default;
const Mindmap=require('../vendor/mindmap/src/main').default;
const Pdf=require('../vendor/pdf/src/main').default;
const Palette=require('../vendor/palette/src/main').default;
const Editor=require('../vendor/visibility/src/main').default;
const ImageCopy=require('../vendor/image-copy/src/main').default;
const {MetadataEditorModal}=require('../vendor/palette/src/ui/modal');

export default class UctPlugin extends Plugin {
  previewWindows=new Set<{close:()=>void}>();modules:Record<string,any>={};tabs:{name:string;tab:any}[]=[];library:LibraryData=emptyLibrary();metadataEditor!:MetadataEditor;mini!:UctMini;placement!:MiniPlacement;private queues=new Map<string,Promise<void>>();private stopped=false;private lastSpace='';private legacyPalette:any;
  get palette():any{return this.modules.palette;}
  get portal():any{return this.modules.portal;}
  get basePath():string{return (this.app.vault.adapter as any).getBasePath();}
  get rootDir():string{return this.manifest.dir??normalizePath(this.app.vault.configDir+'/plugins/'+this.manifest.id);}
  async readJSON(relative:string,fallback:any=null):Promise<any>{try{return JSON.parse(await fs.readFile(join(this.basePath,relative),'utf8'));}catch(e:any){if(e.code==='ENOENT')return fallback;throw e;}}
  writeJSON(relative:string,data:any):Promise<void>{const raw=JSON.stringify(data,null,2);const previous=this.queues.get(relative)??Promise.resolve();const write=previous.catch(()=>{}).then(async()=>{const target=join(this.basePath,relative);await fs.mkdir(join(target,'..'),{recursive:true});const temp=target+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temp,raw,'utf8');if(await fs.readFile(temp,'utf8')!==raw)throw Error('저장 검증 실패');await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}});this.queues.set(relative,write);return write;}
  async saveLibrary(){this.bindLibrary();await this.writeJSON(this.rootDir+'/library.json',this.library);if(!this.stopped)this.mini?.refresh();}
  private bindLibrary(){if(this.palette){this.palette.store.data.items=this.library.items;this.palette.store.data.pendingItemIds=Object.values(this.library.items).filter(i=>i.folderId===null).map(i=>i.id);}}
  session(view?:any):any{return [...(this.portal?.sessions?.values()??[])].find((s:any)=>s.v===(view??this.canvasView()));}
  canvasView():any {const active=this.app.workspace.getMostRecentLeaf()?.view as any;if(active?.getViewType?.()==='canvas')return active;return this.modules.outliner?.adapter?.view??this.app.workspace.getLeavesOfType('canvas')[0]?.view;}
  spaceKey(path?:string,view?:any):string {const v=view??this.canvasView();const file=path??v?.file?.path??'';const session=this.session(v);return session?.current&&session.v.file?.path===file?file+'#uct-portal:'+session.current:file;}
  metadata(path:string,id:string):any {const session=this.session();return this.palette?.store?.data.canvasNodeMetadata[this.spaceKey(path)]?.[id]??(session?.v.file?.path===path?session.root.uctNodeMetadata?.[session.current??'root']?.[id]:undefined);}
  async onload(){
    const persisted=await this.readJSON(this.rootDir+'/library.json');if(persisted){validateLibrary(persisted);this.library={...emptyLibrary(),...persisted,ui:{...emptyLibrary().ui,...persisted.ui}};}
    this.metadataEditor=new MetadataEditor(this);this.mini=new UctMini(this);this.placement=new MiniPlacement(this);
    // Root capture handlers claim only their node types. Original Portal,
    // Mindmap media and PDF handlers retain their own protected scopes.
    this.registerDomEvent(window,'keydown',(e:KeyboardEvent)=>this.key(e),true);
    await this.loadFeature('portal',Portal,'canvas-portal');
    const show=this.portal.show.bind(this.portal);this.portal.show=(...args:any[])=>{const result=show(...args);queueMicrotask(()=>this.spaceChanged());return result;};
    await this.loadFeature('outliner',Outliner,'canvas-outliner',(module:any)=>{module.uctSpaceKey=(p:string)=>this.spaceKey(p);});
    await this.loadFeature('mindmap',Mindmap,'canvas-mindmap',(module:any)=>{module.uctSpaceKey=(p:string,v:any)=>this.spaceKey(p,v);});
    await this.loadFeature('pdf',Pdf,'canvas-pdf-viewcard');
    this.modules.pdf.uctSpaceKey=(path:string,view:any)=>this.spaceKey(path,view);
    await this.loadFeature('editor',Editor,'canvas-visibility');
    this.modules.editor.editorManager.getEditorKey=(target:any)=>this.spaceKey(target.canvasPath)+'\0'+target.node.id;
    await this.loadFeature('image-copy',ImageCopy,'canvas-image-copy');
    await this.loadFeature('palette',Palette,'canvas-palette',(module:any)=>{
      module.miniPalette=this.mini;
      module.collectCanvasSelection=()=>this.collect(false);module.cutCanvasSelection=()=>this.collect(true);
      module.scheduleCanvasSync=()=>{};module.refreshMarkdownSource=async()=>{};module.reconcileLoadedMarkdownSources=()=>{};module.handleDeletedCanvas=()=>{};
      module.syncPaletteItemToCanvas=async()=>{};
      module.handleVaultRename=async(file:any,oldPath:string)=>{renameSource(this.library,oldPath,file.path);const records=module.store.data.canvasNodeMetadata;for(const key of Object.keys(records)){if(key===oldPath||key.startsWith(oldPath+'#uct-portal:')||key.startsWith(oldPath+'/')){records[file.path+key.slice(oldPath.length)]=records[key];delete records[key];}}module.store.changed();await this.saveLibrary();};
      module.store.reconcileDeletedFile=(path:string,folder:boolean)=>{removeSource(this.library,path,folder);void this.saveLibrary();};
    });
    migratePalette(this.library,this.legacyPalette??this.palette.store.data);this.bindLibrary();
    const palette=this.palette;
    palette.store.flush=async()=>{const data=structuredClone(palette.store.data);data.items={};data.pendingItemIds=[];data.workspaces={};data.collections={};data.uiState.activeWorkspaceId=null;data.uiState.pendingCanvasWorkspaceCleanup=[];await palette.saveData(data);await this.saveLibrary();};
    palette.store.getCanvasNodeMetadata=(path:string,id:string)=>{const meta=palette.store.data.canvasNodeMetadata[this.spaceKey(path)]?.[id];return meta?{...meta,tags:[]}:undefined;};
    palette.store.setCanvasNodeMetadata=(path:string,id:string,meta:any)=>{palette.store.setMetadataRecord(this.spaceKey(path),id,{...meta,tags:[]},Date.now());palette.store.changed();void this.modules.outliner?.refresh();};
    // Mini snapshots never participate in the old source-to-Palette sync graph.
    palette.store.linkedCanvasNodes=()=>[];
    palette.store.addPending=(item:any)=>{item.folderId=null;item.tags=[];this.library.items[item.id]=item;void this.saveLibrary();};
    this.modules.outliner.uctPortalKind=(id:string)=>this.session()?.root?.canvasPortal?.portals?.[id]?.type;
    palette.uctEditLabel=(path:string,id:string)=>{const view=this.app.workspace.getLeavesOfType('canvas').map(l=>l.view as any).find(v=>v.file?.path===path&&v.canvas.nodes.has(id));if(view)this.metadataEditor.label(view,view.canvas.nodes.get(id),true);};
    palette.uctEditCaption=(path:string,id:string)=>{const view=this.app.workspace.getLeavesOfType('canvas').map(l=>l.view as any).find(v=>v.file?.path===path&&v.canvas.nodes.has(id));if(view)this.editCaption(id,view);};
    palette.editCanvasNodesMetadata=(nodes:any[])=>{const view=this.canvasView();if(nodes[0])this.metadataEditor.label(view,nodes[0]);};
    this.enrichOutliner();
    this.addSettingTab(new UctSettings(this.app,this));
    this.addCommand({id:'mini-toggle',name:'Mini Palette 열기/닫기',callback:()=>this.mini.toggle()});
    this.addCommand({id:'create-label',name:'선택 카드 라벨 생성',hotkeys:[{modifiers:['Alt'],key:'l'}],checkCallback:(checking)=>{if(!this.canMetadata())return false;if(!checking)this.editLabel();return true;}});
    this.addCommand({id:'create-caption',name:'선택 카드 아래 캡션 생성',hotkeys:[{modifiers:['Alt'],key:'c'}],checkCallback:(checking)=>{if(!this.canMetadata())return false;if(!checking)this.editCaption();return true;}});
    this.registerEvent(this.app.workspace.on('active-leaf-change',()=>this.spaceChanged()));
    this.registerEvent(this.app.workspace.on('layout-change',()=>{this.addCaptionButtons();this.spaceChanged();}));
    const observer=new MutationObserver(()=>this.scheduleCaptionButtons());observer.observe(this.app.workspace.containerEl,{childList:true,subtree:true});this.register(()=>observer.disconnect());
    this.app.workspace.onLayoutReady(()=>{this.spaceChanged();this.addCaptionButtons();this.reconcileSources();});
    await this.saveLibrary();
  }
  private async loadFeature(name:string,Constructor:any,oldId:string,configure?:(module:any)=>void){
    const dir=this.rootDir+'/modules/'+name;await fs.mkdir(join(this.basePath,dir),{recursive:true});
    const file=dir+'/data.json';if(!(await this.readJSON(file))){const old=await this.readJSON(this.app.vault.configDir+'/plugins/'+oldId+'/data.json');if(old)await this.writeJSON(file,old);}
    const module=new Constructor(this.app,{...this.manifest,id:this.manifest.id+'-'+name,name:'UCT · '+name,dir});this.modules[name]=module;
    module.loadData=async()=>{const value=await this.readJSON(file);if(name==='palette')this.legacyPalette=value;return value;};module.saveData=(data:any)=>this.writeJSON(file,data);
    module.addSettingTab=(tab:any)=>{if(name!=='palette'&&name!=='editor')this.tabs.push({name,tab});};
    configure?.(module);
    const original=module.onload.bind(module);let resolve!:()=>void,reject!:(error:any)=>void;const ready=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});module.onload=()=>{Promise.resolve().then(original).then(resolve,reject);};this.addChild(module);await ready;
  }
  private enrichOutliner(){const out=this.modules.outliner;const original=out.document.bind(out);out.document=()=>{const doc=original();if(!doc)return doc;const path=out.adapter.file?.path;return {...doc,nodes:doc.nodes.filter((n:any)=>n.canvasPortalRef?.role!=='exit').map((n:any)=>{const meta=this.metadata(path,n.id);return {...n,uctLabel:meta?.label??'',uctCaption:meta?.caption??''};})};};const texts=out.adapter.texts.bind(out.adapter);out.adapter.texts=async(doc:any)=>{const map=await texts(doc);for(const node of doc.nodes)if(node.uctLabel)map.set(node.id,(map.get(node.id)??node.file??node.url??'')+'\n'+node.uctLabel);return map;};}
  spaceChanged(){if(this.stopped)return;const key=this.spaceKey();if(key!==this.lastSpace){this.lastSpace=key;this.placement?.cancel();const out=this.modules.outliner;if(out){out.lastDoc='';out.lastSelection='';void out.refresh();}}this.palette?.canvasMetadata.refreshSoon();this.addCaptionButtons();}
  async collect(cut:boolean){try{await collectSelection(this,cut);this.mini.open();}catch(error){console.error('UCT collect',error);new Notice(error instanceof Error?error.message:String(error));}}
  canMetadata(){const view=this.canvasView(),node=view?.canvas?.selection?.size===1?[...view.canvas.selection][0] as any:null;return !!node&&!view.canvas.readonly&&!node.isEditing&&node.getData().canvasPortalRef?.role!=='exit'&&!document.activeElement?.closest('input,textarea,[contenteditable=true],.modal');}
  editLabel(){if(!this.canMetadata())return;const view=this.canvasView(),nodes=[...view.canvas.selection];this.metadataEditor.label(view,nodes[0]);}
  editCaption(id?:string,targetView?:any){const view=targetView??this.canvasView(),space=this.spaceKey(view?.file?.path,view),node=id?view?.canvas?.nodes.get(id):[...(view?.canvas?.selection??[])][0] as any;if(!node||view.canvas.readonly)return;const old=this.metadata(view.file.path,node.id)??{label:'',caption:'',tags:[]};const existing=node.nodeEl.querySelector('.uct-caption-input');if(existing){existing.focus();return;}const input=node.nodeEl.createEl('input',{cls:'uct-caption-input',value:old.caption??'',attr:{'aria-label':'캡션 입력',placeholder:'카드 아래 캡션'}});let done=false;const finish=(save:boolean)=>{if(done)return;done=true;if(save){this.palette.store.setMetadataRecord(space,node.id,{...old,tags:[],caption:input.value.trim()},Date.now());this.palette.store.changed();void this.modules.outliner?.refresh();}input.remove();view.canvas.wrapperEl.focus();};input.addEventListener('keydown',(e:KeyboardEvent)=>{e.stopPropagation();if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();finish(true);}if(e.key==='Escape'){e.preventDefault();finish(false);}});input.addEventListener('pointerdown',(e:Event)=>e.stopPropagation());input.addEventListener('blur',()=>finish(true));input.focus();}
  private captionQueued=false;
  scheduleCaptionButtons(){if(this.captionQueued)return;this.captionQueued=true;requestAnimationFrame(()=>{this.captionQueued=false;this.addCaptionButtons();});}
  addCaptionButtons(){if(this.stopped)return;for(const leaf of this.app.workspace.getLeavesOfType('canvas')){const view=leaf.view as any;for(const node of view.canvas?.nodes?.values()??[]){const existing=node.nodeEl.querySelector(':scope > .uct-caption-add');if(existing)(existing as HTMLElement).hidden=!!this.metadata(view.file.path,node.id)?.caption;
if(existing||node.getData().canvasPortalRef?.role==='exit')continue;const button=node.nodeEl.createEl('button',{cls:'uct-caption-add',text:'+',attr:{'aria-label':'카드 아래 캡션 추가'}});button.hidden=!!this.metadata(view.file.path,node.id)?.caption;button.addEventListener('pointerdown',(e:PointerEvent)=>{e.preventDefault();e.stopPropagation();});button.addEventListener('click',(e:MouseEvent)=>{e.stopPropagation();this.editCaption(node.id,view);});}}}
  private key(event:KeyboardEvent){if(event.isComposing||event.repeat||event.target instanceof HTMLElement&&event.target.closest('input,textarea,[contenteditable=true],.modal,.menu'))return;const view=this.canvasView();if(!view?.canvas?.wrapperEl.contains(event.target))return;const n=view.canvas.selection.size===1?[...view.canvas.selection][0] as any:null;if(!n||n.isEditing)return;
    if(event.altKey&&!event.ctrlKey&&!event.shiftKey&&!event.metaKey&&(event.code==='KeyL'||event.code==='KeyC')){event.preventDefault();event.stopImmediatePropagation();if(event.code==='KeyL')this.editLabel();else this.editCaption();return;}
    if(event.key==='Enter'&&!event.altKey&&!event.ctrlKey&&!event.shiftKey&&!event.metaKey){const data=n.getData();if(data.canvasPortalRef?.role==='exit')return;if(data.type==='text'||data.type==='file'&&/\.md$/i.test(data.file)){event.preventDefault();event.stopImmediatePropagation();void this.modules.editor?.editorManager.openNode(view,n);}}
  }
  private reconcileSources(){let changed=false;for(const item of Object.values(this.library.items)){if(item.uctPortal)continue;const path=item.origin?.filePath??item.sourceReferencePath;if(path&&!this.app.vault.getAbstractFileByPath(path)){removeSource(this.library,path);changed=true;}}if(changed)void this.saveLibrary();}
  async onunload(){this.stopped=true;for(const window of this.previewWindows)window.close();this.previewWindows.clear();this.placement?.cancel();this.mini?.destroy();for(const el of document.querySelectorAll('.uct-caption-add,.uct-caption-input'))el.remove();await this.modules.editor?.editorManager?.close();await Promise.allSettled([...this.queues.values()]);}
}

class UctSettings extends PluginSettingTab {
  private current='mindmap';constructor(app:any,private root:UctPlugin){super(app,root);}
  display(){this.containerEl.empty();this.containerEl.createEl('h2',{text:'Ultimate Canvas Toolkit'});const nav=this.containerEl.createDiv({cls:'uct-settings-nav'});for(const entry of this.root.tabs)nav.createEl('button',{text:entry.name}).onclick=()=>{this.current=entry.name;this.display();};nav.createEl('button',{text:'편집기 · 캡션'}).onclick=()=>{this.current='editor';this.display();};const host=this.containerEl.createDiv();if(this.current==='editor'){const editor=this.root.modules.editor;new Setting(host).setName('빠른 편집기').addToggle(t=>t.setValue(editor.settings.quickEditorEnabled).onChange(async value=>{editor.settings.quickEditorEnabled=value;await editor.savePluginData();}));new Setting(host).setName('바깥 클릭으로 편집기 닫기').addToggle(t=>t.setValue(editor.settings.closeEditorOnOutsideClick).onChange(async value=>{editor.settings.closeEditorOnOutsideClick=value;await editor.savePluginData();}));new Setting(host).setName('캡션 글자 크기').addSlider(s=>s.setLimits(8,32,1).setValue(this.root.palette.store.data.settings.canvasCaptionFontSize).onChange(value=>this.root.palette.store.setCanvasCaptionFontSize(value)));return;}const found=this.root.tabs.find(t=>t.name===this.current)??this.root.tabs[0];if(found){found.tab.containerEl=host;found.tab.display();}}
}
