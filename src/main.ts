import {paletteSettings} from './performance';
import {queueJsonWrite} from './json-write';
import {Plugin,PluginSettingTab,Setting,TFile,TFolder,Notice,normalizePath} from 'obsidian';
import {promises as fs} from 'node:fs';
import {join} from 'node:path';
import {emptyLibrary,migratePalette,removeSource,renameSource,validateLibrary,type LibraryData} from './library';
import {MetadataEditor} from './metadata-editor';
import {repairPortalPresentation} from './item-kind';
import {UctMini} from './mini';
import {collectSelection} from './snapshot';
import {MiniPlacement} from './placement';
import {CompositionMode} from './composition';
import {MediaPreview} from './media';
import {CanvasRuntime} from './canvas-runtime';

const Portal=require('../vendor/portal/src/main.cjs');
const Outliner=require('../vendor/outliner/src/main').default;
const Mindmap=require('../vendor/mindmap/src/main').default;
const Pdf=require('../vendor/pdf/src/main').default;
const Palette=require('../vendor/palette/src/main').default;
const Editor=require('../vendor/visibility/src/main').default;
const ImageCopy=require('../vendor/image-copy/src/main').default;
const {MetadataEditorModal}=require('../vendor/palette/src/ui/modal');

export default class UctPlugin extends Plugin {
  canvasRuntime!:CanvasRuntime;
  composition!:CompositionMode;media!:MediaPreview;
  previewWindows=new Set<{close:()=>void}>();modules:Record<string,any>={};tabs:{name:string;tab:any}[]=[];library:LibraryData=emptyLibrary();metadataEditor!:MetadataEditor;mini!:UctMini;placement!:MiniPlacement;private queues=new Map<string,Promise<void>>();private savedLibraryJSON?:string;private stopped=false;private lastSpace='';private legacyPalette:any;
  get palette():any{return this.modules.palette;}
  get portal():any{return this.modules.portal;}
  get basePath():string{return (this.app.vault.adapter as any).getBasePath();}
  get rootDir():string{return this.manifest.dir??normalizePath(this.app.vault.configDir+'/plugins/'+this.manifest.id);}
  async readJSON(relative:string,fallback:any=null):Promise<any>{try{return JSON.parse(await fs.readFile(join(this.basePath,relative),'utf8'));}catch(e:any){if(e.code==='ENOENT')return fallback;throw e;}}
  writeJSON(relative:string,data:any):Promise<void>{const raw=JSON.stringify(data,null,2),library=relative===this.rootDir+'/library.json',palette=relative===this.rootDir+'/modules/palette/data.json';const write=queueJsonWrite(this.queues,relative,join(this.basePath,relative),raw,library||palette);return library?write.then(()=>{this.savedLibraryJSON=raw;}):write;}
  async saveLibrary(){this.bindLibrary();const before=this.savedLibraryJSON;await this.writeJSON(this.rootDir+'/library.json',this.library);if(before!==this.savedLibraryJSON&&!this.stopped)this.mini?.refresh();}
  async flushPalette(){const palette=this.palette;if(palette.store.saveTimer!==null)window.clearTimeout(palette.store.saveTimer);palette.store.saveTimer=null;const data=paletteSettings(palette.store.data);await palette.saveData(data);await this.saveLibrary();}
  bindLibrary(){if(this.palette){this.palette.store.data.items=this.library.items;this.palette.store.data.pendingItemIds=Object.values(this.library.items).filter(i=>i.folderId===null).map(i=>i.id);}}
  session(view?:any):any{return this.canvasRuntime.session(view);}
  canvasView():any {return this.canvasRuntime.current();}
  spaceKey(path?:string,view?:any):string {return this.canvasRuntime.key(path,view);}
  metadata(path:string,id:string,targetView?:any):any {const view=targetView??this.canvasView(),session=this.session(view);return this.palette?.store?.data.canvasNodeMetadata[this.spaceKey(path,view)]?.[id]??(session?.v.file?.path===path?session.root.uctNodeMetadata?.[session.current??'root']?.[id]??session.v.canvas?.nodes?.get(id)?.getData?.().uctMetadata:undefined);}
  async onload(){
    // Canvas tabs can finish restoring while the integrated modules load.
    const startupLayout=this.app.workspace.layoutReady?Promise.resolve(null):this.readJSON(this.app.vault.configDir+'/workspace.json').catch(()=>null);
    this.canvasRuntime=new CanvasRuntime(this.app.workspace,()=>this.portal?.sessions,()=>this.modules.outliner?.adapter?.view);
    this.canvasRuntime.sync();this.register(()=>this.canvasRuntime.dispose());
    this.register(this.canvasRuntime.subscribe(change=>{
      if(this.stopped)return;const out=this.modules.outliner;
      if(out?.adapter?.view===change.view){if(change.kinds.has('space')){out.lastDoc='';out.lastSelection='';}void out.refresh();}
      this.palette?.canvasMetadata.refreshSoon();
      if(change.kinds.has('space')||change.kinds.has('graph'))this.modules.pdf?.scan();
      this.addCaptionButtons(change.view,change.kinds.has('space')||change.kinds.has('graph')?undefined:change.ids);
    }));
    const persisted=await this.readJSON(this.rootDir+'/library.json');if(persisted){validateLibrary(persisted);this.library={...emptyLibrary(),...persisted,ui:{...emptyLibrary().ui,...persisted.ui}};}
    this.savedLibraryJSON=JSON.stringify(this.library,null,2);
    this.metadataEditor=new MetadataEditor(this);this.mini=new UctMini(this);this.placement=new MiniPlacement(this);
    // Root capture handlers claim only their node types. Original Portal,
    // Mindmap media and PDF handlers retain their own protected scopes.
    this.registerDomEvent(window,'keydown',(e:KeyboardEvent)=>this.key(e),true);
    const initialLayout=await startupLayout;
    await this.loadFeature('portal',Portal,'canvas-portal',(module:any)=>{module.uctInitialLayout=initialLayout;});
    this.portal.uctCanvasViews=()=>this.canvasRuntime.all();
    const capture=this.portal.capture.bind(this.portal);this.portal.capture=(session:any)=>{const result=capture(session);const capturedPath=session.v.file?.path??session.path;if(this.palette&&capturedPath)for(const [space,graph] of [['root',session.root],...Object.entries(session.root.canvasPortal?.portals??{}).map(([id,p]:[string,any])=>[id,p.graph])] as [string,any][]){const key=space==='root'?capturedPath:capturedPath+'#uct-portal:'+space;for(const node of graph.nodes??[]){const meta=this.palette.store.data.canvasNodeMetadata[key]?.[node.id];if(meta)node.uctMetadata=structuredClone(meta);}}return result;};
    const show=this.portal.show.bind(this.portal);this.portal.show=(session:any,data:any,...rest:any[])=>{if(this.palette){const key=session.current?session.v.file.path+'#uct-portal:'+session.current:session.v.file.path;let changed=false;for(const node of data.nodes??[]){const meta=node.uctMetadata,existing=this.palette.store.data.canvasNodeMetadata[key]?.[node.id];if(meta&&(!existing||meta.modifiedAt>existing.modifiedAt)){this.palette.store.setMetadataRecord(key,node.id,meta,meta.modifiedAt??Date.now());changed=true;}}if(changed)this.palette.store.changed();}const result=show(session,data,...rest);queueMicrotask(()=>this.spaceChanged());return result;};
    await this.loadFeature('outliner',Outliner,'canvas-outliner',(module:any)=>{module.uctSpaceKey=(p:string)=>this.spaceKey(p,module.adapter?.view);module.uctBeforeSave=()=>this.placement.whenIdle();});
    await this.loadFeature('mindmap',Mindmap,'canvas-mindmap',(module:any)=>{module.uctSpaceKey=(p:string,v:any)=>this.spaceKey(p,v);module.uctActiveCanvas=()=>this.canvasRuntime.active()?.canvas??null;});
    await this.loadFeature('pdf',Pdf,'canvas-pdf-viewcard');
    this.modules.pdf.uctSpaceKey=(path:string,view:any)=>this.spaceKey(path,view);
    this.modules.pdf.uctCanvasViews=()=>this.canvasRuntime.all();
    await this.loadFeature('editor',Editor,'canvas-visibility');
    this.modules.editor.settings.closeEditorOnOutsideClick=false;
    this.composition=new CompositionMode(this);await this.composition.load();this.media=new MediaPreview(this);this.media.install();
    this.addCommand({id:'composition-open',name:'컴포지션 모드 전환',hotkeys:[{modifiers:['Ctrl','Shift'],key:'Enter'}],callback:()=>void this.composition.toggle()});
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
    migratePalette(this.library,this.legacyPalette??this.palette.store.data);for(const item of Object.values(this.library.items))repairPortalPresentation(item);this.bindLibrary();
    const palette=this.palette;
    palette.canvas.openContexts=()=>this.canvasRuntime.all().map(view=>({file:view.file,view,runtime:view.canvas}));
    palette.canvas.contextForTarget=(target:EventTarget|null)=>{if(!(target instanceof Node))return null;const view=this.canvasRuntime.target(target);return view?{file:view.file,view,runtime:view.canvas}:null;};
    palette.store.flush=()=>this.flushPalette();
    palette.store.getCanvasNodeMetadata=(path:string,id:string,view?:any)=>{const meta=this.metadata(path,id,view);return meta?{...meta,tags:[]}:undefined;};
    palette.store.setCanvasNodeMetadata=(path:string,id:string,meta:any)=>{const view=this.canvasView();palette.store.setMetadataRecord(this.spaceKey(path,view),id,{...meta,tags:[]},Date.now());palette.store.changed();this.canvasRuntime.changed(view,'metadata',[id]);};
    // Mini snapshots never participate in the old source-to-Palette sync graph.
    palette.store.linkedCanvasNodes=()=>[];
    palette.store.addPending=(item:any)=>{item.folderId=null;item.tags=[];this.library.items[item.id]=item;void this.saveLibrary();};
    this.modules.outliner.uctPortalKind=(id:string)=>this.session(this.modules.outliner.adapter.view)?.root?.canvasPortal?.portals?.[id]?.type;
    palette.uctEditLabel=(path:string,id:string)=>{const view=this.app.workspace.getLeavesOfType('canvas').map(l=>l.view as any).find(v=>v.file?.path===path&&v.canvas.nodes.has(id));if(view)this.metadataEditor.label(view,view.canvas.nodes.get(id),true);};
    palette.uctEditCaption=(path:string,id:string)=>{const view=this.app.workspace.getLeavesOfType('canvas').map(l=>l.view as any).find(v=>v.file?.path===path&&v.canvas.nodes.has(id));if(view)this.editCaption(id,view);};
    palette.editCanvasNodesMetadata=(nodes:any[])=>{const view=this.canvasView();if(nodes[0])this.metadataEditor.label(view,nodes[0]);};
    await this.placement.initialize();
    this.enrichOutliner();
    this.addSettingTab(new UctSettings(this.app,this));
    this.addCommand({id:'mini-toggle',name:'Mini Palette 열기/닫기',callback:()=>this.mini.toggle()});
    this.addCommand({id:'create-label',name:'선택 카드 라벨 생성',hotkeys:[{modifiers:['Alt'],key:'l'}],checkCallback:(checking)=>{if(!this.canMetadata())return false;if(!checking)this.editLabel();return true;}});
    this.addCommand({id:'create-caption',name:'선택 카드 아래 캡션 생성',hotkeys:[{modifiers:['Alt'],key:'c'}],checkCallback:(checking)=>{if(!this.canMetadata())return false;if(!checking)this.editCaption();return true;}});
    this.registerEvent(this.app.workspace.on('active-leaf-change',leaf=>{this.canvasRuntime.activate(leaf);this.spaceChanged();}));
    this.registerEvent(this.app.workspace.on('file-open',()=>{this.canvasRuntime.sync();this.spaceChanged();this.scheduleCaptionButtons();}));
    this.registerEvent(this.app.workspace.on('layout-change',()=>{this.canvasRuntime.sync();this.scheduleCaptionButtons();this.spaceChanged();}));
    const observer=new MutationObserver(records=>{if(records.some(record=>{
      const target=record.target as Element;
      if(target.closest?.('.uct-mini,.modal-container'))return false;
      // Palette, settings and Outliner mutations cannot change Canvas captions.
      if(target.closest?.('.canvas-node'))return [...record.addedNodes,...record.removedNodes].some(n=>!(n instanceof Element&&n.matches('.uct-caption-add')));
      return [...record.addedNodes].some(n=>n instanceof Element&&!n.matches('.uct-mini,.modal-container')&&(n.matches('.canvas-node')||!!n.querySelector('.canvas-node')));
    }))this.scheduleCaptionButtons();});observer.observe(this.app.workspace.containerEl,{childList:true,subtree:true});this.register(()=>observer.disconnect());
    this.app.workspace.onLayoutReady(()=>{this.canvasRuntime.sync();this.spaceChanged();this.addCaptionButtons();this.reconcileSources();});
    await this.saveLibrary();
  }
  private async loadFeature(name:string,Constructor:any,oldId:string,configure?:(module:any)=>void){
    const dir=this.rootDir+'/modules/'+name;await fs.mkdir(join(this.basePath,dir),{recursive:true});
    const file=dir+'/data.json';if(!(await fs.stat(join(this.basePath,file)).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;}))){const old=await this.readJSON(this.app.vault.configDir+'/plugins/'+oldId+'/data.json');if(old)await this.writeJSON(file,old);}
    const module=new Constructor(this.app,{...this.manifest,id:this.manifest.id+'-'+name,name:'UCT · '+name,dir});this.modules[name]=module;
    module.loadData=async()=>{const value=await this.readJSON(file);if(name==='palette')this.legacyPalette=value;return value;};module.saveData=(data:any)=>this.writeJSON(file,data);
    module.addSettingTab=(tab:any)=>{if(name!=='palette'&&name!=='editor')this.tabs.push({name,tab});};
    configure?.(module);
    const original=module.onload.bind(module);let resolve!:()=>void,reject!:(error:any)=>void;const ready=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});module.onload=()=>{Promise.resolve().then(original).then(resolve,reject);};this.addChild(module);await ready;
  }
  private enrichOutliner(){const out=this.modules.outliner;const original=out.document.bind(out);out.document=()=>this.canvasRuntime.read(out,out.adapter.view,()=>{const doc=original();if(!doc)return doc;
    // Resolve the Canvas space once per document, not once per node.
    // Each workspace lookup can traverse leaves and trigger native view work.
    const view=out.adapter.view,path=out.adapter.file?.path,session=this.session(view);
    const inSpace=session?.v.file?.path===path;
    const key=inSpace&&session.current?path+'#uct-portal:'+session.current:path;
    const records=this.palette?.store?.data.canvasNodeMetadata[key];
    const fallback=inSpace?session.root.uctNodeMetadata?.[session.current??'root']:undefined;
    return {...doc,nodes:doc.nodes.filter((n:any)=>n.canvasPortalRef?.role!=='exit').map((n:any)=>{const meta=records?.[n.id]??fallback?.[n.id]??n.uctMetadata;return {...n,uctLabel:meta?.label??'',uctCaption:meta?.caption??''};})};});
    const render=out.renderAll.bind(out);out.renderAll=()=>this.canvasRuntime.batch(render);
  }
  private lastSpaceView:any;
  spaceChanged(){if(this.stopped)return;const view=this.canvasView(),key=this.spaceKey(undefined,view);if(key!==this.lastSpace||view!==this.lastSpaceView){this.lastSpace=key;this.lastSpaceView=view;this.placement?.cancel();this.canvasRuntime.changed(view,'space');}}
  async collect(cut:boolean){try{await collectSelection(this,cut);if(!this.library.ui.open)this.mini.open();}catch(error){console.error('UCT collect',error);new Notice(error instanceof Error?error.message:String(error));}}
  canMetadata(){const view=this.canvasView(),node=view?.canvas?.selection?.size===1?[...view.canvas.selection][0] as any:null;return !!node&&!view.canvas.readonly&&!node.isEditing&&node.getData().canvasPortalRef?.role!=='exit'&&!document.activeElement?.closest('input,textarea,[contenteditable=true],.modal');}
  editLabel(){if(!this.canMetadata())return;const view=this.canvasView(),nodes=[...view.canvas.selection];this.metadataEditor.label(view,nodes[0]);}
  editCaption(id?:string,targetView?:any){const view=targetView??this.canvasView(),space=this.spaceKey(view?.file?.path,view),node=id?view?.canvas?.nodes.get(id):[...(view?.canvas?.selection??[])][0] as any;if(!node||view.canvas.readonly)return;const old=this.metadata(view.file.path,node.id,view)??{label:'',caption:'',tags:[]};const existing=node.nodeEl.querySelector('.uct-caption-input');if(existing){existing.focus();return;}const input=node.nodeEl.createEl('input',{cls:'uct-caption-input',value:old.caption??'',attr:{'aria-label':'캡션 입력',placeholder:'카드 아래 캡션'}});let done=false;const finish=(save:boolean)=>{if(done)return;done=true;if(save){this.palette.store.setMetadataRecord(space,node.id,{...old,tags:[],caption:input.value.trim()},Date.now());this.palette.store.changed();this.canvasRuntime.changed(view,'metadata',[node.id]);}input.remove();view.canvas.wrapperEl.focus();};input.addEventListener('keydown',(e:KeyboardEvent)=>{e.stopPropagation();if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();finish(true);}if(e.key==='Escape'){e.preventDefault();finish(false);}});input.addEventListener('pointerdown',(e:Event)=>e.stopPropagation());input.addEventListener('blur',()=>finish(true));input.focus();}
  private captionQueued=false;
  scheduleCaptionButtons(){if(this.captionQueued)return;this.captionQueued=true;requestAnimationFrame(()=>{this.captionQueued=false;this.addCaptionButtons();});}
  addCaptionButtons(targetView?:any,ids?:Set<string>){if(this.stopped)return;for(const view of targetView?[targetView]:this.canvasRuntime.all()){for(const node of view.canvas?.nodes?.values()??[]){if(ids&&!ids.has(node.id))continue;const existing=node.nodeEl.querySelector(':scope > .uct-caption-add');if(existing)(existing as HTMLElement).hidden=!!this.metadata(view.file.path,node.id,view)?.caption;
if(existing||node.getData().canvasPortalRef?.role==='exit')continue;const button=node.nodeEl.createEl('button',{cls:'uct-caption-add',text:'+',attr:{'aria-label':'카드 아래 캡션 추가'}});button.hidden=!!this.metadata(view.file.path,node.id,view)?.caption;button.addEventListener('pointerdown',(e:PointerEvent)=>{e.preventDefault();e.stopPropagation();});button.addEventListener('click',(e:MouseEvent)=>{e.stopPropagation();this.editCaption(node.id,view);});}}}
  private key(event:KeyboardEvent){if(this.composition?.opened){this.composition.handleKey(event);return;}if(this.metadataEditor?.handleKey(event))return;if(this.modules.mindmap?.panels?.key(event))return;if(event.isComposing||event.repeat)return;if(event.key==='Enter'&&event.ctrlKey&&event.shiftKey&&!event.altKey&&!event.metaKey&&!((event.target as HTMLElement)?.closest('.modal,.menu,.vertical-tab-header'))){event.preventDefault();event.stopImmediatePropagation();void this.composition?.toggle();return;}if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,[contenteditable=true],.modal,.menu'))return;const view=this.canvasView();if(!view?.canvas)return;const canvasBodyFocus=event.target===document.body&&this.app.workspace.activeLeaf?.view===view;if(!canvasBodyFocus&&!view.canvas.wrapperEl.contains(event.target))return;const n=view.canvas.selection.size===1?[...view.canvas.selection][0] as any:null;if(!n)return;
    if(!event.altKey&&!event.ctrlKey&&!event.shiftKey&&!event.metaKey){const data=n.getData();if(event.key==='Enter'&&data.type==='file'){const file=this.app.vault.getAbstractFileByPath(data.file);if(file instanceof TFile&&this.media.openFile(file)){n.nodeEl?.querySelectorAll('video,audio').forEach((m:HTMLMediaElement)=>m.pause());event.preventDefault();event.stopImmediatePropagation();return;}}if(event.code==='Space'||event.key===' '){const media=n.nodeEl?.querySelector('video,audio') as HTMLMediaElement|null;if(media){event.preventDefault();event.stopImmediatePropagation();if(media.paused)void media.play().catch(()=>{});else media.pause();return;}}}
    if(event.altKey&&!event.ctrlKey&&!event.shiftKey&&!event.metaKey&&(event.code==='KeyL'||event.code==='KeyC'||['l','c'].includes(event.key.toLowerCase()))){event.preventDefault();event.stopImmediatePropagation();if(event.code==='KeyL'||event.key.toLowerCase()==='l')this.editLabel();else this.editCaption();return;}
    if(event.key==='Enter'&&event.shiftKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey){const data=n.getData(),pdf=this.modules.pdf;if(data.type==='file'&&/\.pdf$/i.test(data.file)){const file=this.app.vault.getAbstractFileByPath(data.file);if(file instanceof TFile){event.preventDefault();event.stopImmediatePropagation();const mounted=pdf.mounted.get(n);mounted?.viewer.exitReading();pdf.openPopup(file,mounted?.viewer.state.page??1);return;}}}
    if(event.key==='Enter'&&!event.altKey&&!event.ctrlKey&&!event.shiftKey&&!event.metaKey){const data=n.getData();if(data.canvasPortalRef?.role==='exit')return;if(data.type==='text'||data.type==='file'&&/\.md$/i.test(data.file)){event.preventDefault();event.stopImmediatePropagation();void this.modules.editor?.editorManager.openNode(view,n);}}
  }
  private reconcileSources(){let changed=false;for(const item of Object.values(this.library.items)){if(item.uctPortal)continue;const path=item.origin?.filePath??item.sourceReferencePath;if(path&&!this.app.vault.getAbstractFileByPath(path)){removeSource(this.library,path);changed=true;}}if(changed)void this.saveLibrary();}
  async onunload(){this.stopped=true;await this.composition?.close();this.media?.destroy();for(const window of this.previewWindows)window.close();this.previewWindows.clear();await this.placement?.shutdown();this.mini?.destroy();for(const el of document.querySelectorAll('.uct-caption-add,.uct-caption-input'))el.remove();await this.modules.editor?.editorManager?.close();await Promise.allSettled([...this.queues.values()]);}
}

class UctSettings extends PluginSettingTab {
  private current='mindmap';constructor(app:any,private root:UctPlugin){super(app,root);}
  display(){this.containerEl.empty();this.containerEl.createEl('h2',{text:'Ultimate Canvas Toolkit'});const nav=this.containerEl.createDiv({cls:'uct-settings-nav'});for(const entry of this.root.tabs)nav.createEl('button',{text:entry.name}).onclick=()=>{this.current=entry.name;this.display();};nav.createEl('button',{text:'편집기 · 캡션'}).onclick=()=>{this.current='editor';this.display();};nav.createEl('button',{text:'컴포지션'}).onclick=()=>{this.current='composition';this.display();};const host=this.containerEl.createDiv();if(this.current==='composition'){void this.root.composition.renderSettings(host);return;}if(this.current==='editor'){const editor=this.root.modules.editor;new Setting(host).setName('빠른 편집기').addToggle(t=>t.setValue(editor.settings.quickEditorEnabled).onChange(async value=>{editor.settings.quickEditorEnabled=value;await editor.savePluginData();}));new Setting(host).setName('작은 편집기 배경 색상').addColorPicker(c=>c.setValue(editor.settings.editorBackground??'#ffffff').onChange(async v=>{editor.settings.editorBackground=v;editor.editorManager.refreshAppearance();await editor.savePluginData();}));new Setting(host).setName('작은 편집기 배경 불투명도').setDesc('글과 이미지는 선명하게 유지됩니다.').addSlider(s=>s.setLimits(0.1,1,0.05).setValue(editor.settings.editorOpacity??1).setDynamicTooltip().onChange(async v=>{editor.settings.editorOpacity=v;editor.editorManager.refreshAppearance();await editor.savePluginData();}));new Setting(host).setName('캡션 글자 크기').addSlider(s=>s.setLimits(8,32,1).setValue(this.root.palette.store.data.settings.canvasCaptionFontSize).onChange(value=>this.root.palette.store.setCanvasCaptionFontSize(value)));return;}const found=this.root.tabs.find(t=>t.name===this.current)??this.root.tabs[0];if(found){found.tab.containerEl=host;found.tab.display();}}
}

