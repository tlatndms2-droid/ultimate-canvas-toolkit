import {registerRuntimeCleanup} from './runtime-cleanup';
import {applyCreation} from './creation-transaction';
import {CardMedia} from './card-media';
import {mediaExtensions} from './media-previews';
import { FileInsertMenu } from './file-insert';
import { insertFile,canInsertFile } from './file-insert-data';
import { SettingsTransfer } from './settings-transfer';
import { settingsOnly } from './settings-backup';
import { arrangeSelection } from './arrange';
import { CanvasPanels } from './panels';
import { Menu, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createLayout, sources, type CanvasData, type Direction } from './layout';
import { EditorCamera } from './editor-camera';
import { SelectionHistory } from './selection-history';
import { SizeController } from './size';
import { NavigationController, nearestCard } from './navigation';
type Canvas = any;
interface Settings { arrangeRange:number; arrangeDepth:number; mode: 'create'|'connect'; width: number|null; height:number|null; gap:number; origins:Record<string,string>;resizeStep:number;swapTolerance:number;panDuration:number;panStep:number;zoomStepPercent:number;followCaret:boolean;editMinZoom:number;customColors:string[];managerSize:{width:number;height:number}|null }
const settingDefaults={arrangeRange:3,arrangeDepth:1,mode:'create' as const,width:null as number|null,height:null as number|null,gap:100,resizeStep:20,swapTolerance:40,panDuration:250,panStep:60,zoomStepPercent:(2**0.1-1)*100,followCaret:true,editMinZoom:100};
interface Hold { key:string; timer:number; canvas:Canvas; anchor:string; consumed:boolean }
interface MenuState { el:HTMLElement; values:string[]; index:number; kind:'mode'|'source'; canvas:Canvas; anchor:string }
export default class CanvasMindmap extends Plugin {
 readonly implementationStage = 4;
 settings:Settings={...settingDefaults,origins:{},customColors:[],managerSize:null};
 private panels!:CanvasPanels;
 private fileInsert!:FileInsertMenu;
 private sizes!:SizeController;
 private navigation!:NavigationController;
 private selections!:SelectionHistory;
 private editorCamera!:EditorCamera;
 private altTap:{clean:boolean;c:any}|null=null;
 private altRepeat:{c:any;ids:string[];after:string[];timer:number}|null=null;
 private clearAltRepeat(){if(this.altRepeat)window.clearTimeout(this.altRepeat.timer);this.altRepeat=null;}
 private multiAnchor:{c:any;id:string}|null=null;
 private connectHeld:Canvas|null=null;
 private cardMedia!:CardMedia;
 private handledConnectionEvents=new WeakSet<Event>();
 private shouldRunConnectionCommand(e:Event|undefined=window.event){if(e?.type!=='keydown')return true;const seen=this.handledConnectionEvents.has(e);this.handledConnectionEvents.add(e);return !seen&&!(e as KeyboardEvent).repeat;}
 private connectHint:HTMLElement|null=null;
 private linkTimer:number|null=null;
 private linkMenu:{el:HTMLElement;c:Canvas;anchor:string;ids:string[];index:number}|null=null;
 private hold:Hold|null=null;
 private menu:MenuState|null=null;
 private docs=new WeakSet<Document>();
 private canvasInputs=new WeakSet<object>();
 private inputScopes=new WeakMap<object,()=>void>();
 private colorCommands=new Set<string>();
 private saveChain=Promise.resolve();
 private drawingSuspended=false;
 async onload() {
  const saved=await this.loadData();if(saved)delete saved.autoResize;this.settings={...this.settings,...saved,origins:saved?.origins||{}};
  this.sizes=new SizeController(this);
  this.cardMedia=new CardMedia(this.app,()=>this.current());this.register(()=>this.cardMedia.dispose());
  this.navigation=new NavigationController(this);
  this.panels=new CanvasPanels(this,this.navigation);
  this.fileInsert=new FileInsertMenu(this.app,(c,id,file)=>this.convertFile(c,id,file.path),()=>this.current(),cb=>this.register(cb));
  this.addCommand({id:'insert-file-card',name:'카드에 파일 넣기 / 교체',hotkeys:[{modifiers:['Alt'],key:'i'}],checkCallback:checking=>{const c=this.current(),n=c&&this.selected(c);if(!n||c.readonly||!canInsertFile(n.getData())||[...c.nodes.values()].some((v:any)=>v.isEditing)||document.activeElement?.closest('input,textarea,[contenteditable="true"],.modal-container'))return false;if(!checking){this.reset();this.clearConnectHint();this.panels.close(false);this.fileInsert.toggle(c,n)}return true;}});
  for(const [id,name,key,kind] of [['color-palette','색상 팔레트 열기/닫기','c','palette']] as const)this.addCommand({id,name,hotkeys:[{modifiers:kind==='palette'?['Ctrl','Shift']:['Alt'],key}],checkCallback:checking=>{const c=this.current(),active=document.activeElement;if(active?.closest('input,textarea,[contenteditable="true"]')&&!active.closest('.canvas-node'))return false;if(!c||c.readonly)return false;if(!checking){this.reset();this.panels.togglePalette(c);}return true;}});
  for(let i=1;i<=6;i++)this.addCommand({id:`apply-color-${i}`,name:`기본 색상 ${i} 적용`,checkCallback:checking=>{const c=this.current();if(!c||c.readonly||!c.selection.size||[...c.nodes.values()].some((n:any)=>n.isEditing))return false;if(!checking)this.panels.applyColor(c,String(i));return true;}});
  this.addCommand({id:'disconnect-selected-cards',name:'선택한 카드의 연결 모두 해제',hotkeys:[{modifiers:['Ctrl','Shift'],key:'d'}],checkCallback:checking=>{
   const c=this.current(),active=document.activeElement;
   if(!c||c.readonly||active?.closest('input,textarea,[contenteditable="true"]')||[...c.nodes.values()].some((n:any)=>n.isEditing))return false;
   const ids=new Set([...c.selection].filter((n:any)=>c.nodes.has(n.id)).map((n:any)=>n.id));if(!ids.size)return false;
   if(!checking)this.disconnect(c,ids);return true;
  }});
  this.addCommand({id:'connect-direction',name:'방향키로 가까운 카드 연결 (누른 채 사용)',hotkeys:[{modifiers:['Ctrl','Shift'],key:'a'}],checkCallback:checking=>{
   const c=this.current();
   if(!c||c.readonly||!this.selected(c)||document.activeElement?.closest('input,textarea,[contenteditable="true"],.modal-container')||[...c.nodes.values()].some((n:any)=>n.isEditing))return false;
   if(!checking&&this.shouldRunConnectionCommand()){this.reset();this.sizes.finish();this.connectHeld=c;this.showConnectHint();}return true;
  }});
  this.addCommand({id:'reverse-connection',name:'선택 카드의 연결 방향 전환',hotkeys:[{modifiers:['Ctrl','Shift'],key:'s'}],checkCallback:checking=>{const c=this.current();if(!c||c.readonly||!this.selected(c)||[...c.nodes.values()].some((n:any)=>n.isEditing)||document.activeElement?.closest('input,textarea,[contenteditable="true"],.modal-container'))return false;if(!checking&&this.shouldRunConnectionCommand()){this.openReverse(c);}return true;}});
  this.addCommand({id:'arrange-connected',name:'연결된 카드 정렬 (시험)',hotkeys:[{modifiers:['Ctrl','Shift'],key:'l'}],checkCallback:checking=>{const c=this.current();if(!c||c.readonly||![...c.selection].some((n:any)=>c.nodes.has(n.id)&&n.getData().type!=='group')||[...c.nodes.values()].some((n:any)=>n.isEditing)||document.activeElement?.closest('input,textarea,[contenteditable="true"],.modal-container'))return false;if(!checking&&this.shouldRunConnectionCommand())this.arrange(c);return true;}});
  this.syncColorCommands();
  this.editorCamera=new EditorCamera(this);
  this.selections=new SelectionHistory(cb=>this.register(cb));
  this.addCommand({id:'toggle-auto-resize',name:'선택한 카드 내용에 맞추기',hotkeys:[{modifiers:['Alt'],key:'r'}],checkCallback:checking=>{const c=this.current();if(!this.canUseCardCommand(c,true)||![...c.selection].some((n:any)=>n.getData().type==='text'))return false;if(!checking){if(this.altTap)this.altTap.clean=false;this.reset();void this.sizes.fitSelection(c).catch(error=>{console.error(error);new Notice('카드 크기를 맞추지 못했습니다.');});}return true;}});
  this.addCommand({id:'card-context-menu',name:'선택한 카드 우클릭 메뉴',hotkeys:[{modifiers:['Alt'],key:'m'}],checkCallback:checking=>{const c=this.current();if(!this.canUseCardCommand(c,true)||!c.selection.size)return false;if(!checking)this.openCardContext(c);return true;}});
  this.addSettingTab(new CreationSettings(this));this.attach(document);
  const frames=new WeakSet<HTMLIFrameElement>();
  const watch=(frame:HTMLIFrameElement)=>{if(frames.has(frame))return;frames.add(frame);const attach=()=>{try{if(frame.contentDocument)this.attach(frame.contentDocument);}catch{}};frame.addEventListener('load',attach);registerRuntimeCleanup(this,frame,()=>frame.removeEventListener('load',attach));attach();};
  for(const frame of document.querySelectorAll('iframe'))watch(frame);
  const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement){if(node instanceof HTMLIFrameElement)watch(node);for(const frame of node.querySelectorAll('iframe'))watch(frame);}});
  observer.observe(document.body,{childList:true,subtree:true});this.register(()=>observer.disconnect());
  this.registerInterval(window.setInterval(()=>{
   const c=this.current();if(c){this.initializeDimensions(c);this.patchCanvasInput(c);this.sizes.observe(c);this.selections.observe(c);this.editorCamera.observe(c);}this.panels.observe(c);
   this.fileInsert.observe();this.updateCardKeys(c);
   if(this.menu)this.positionMenu();
   if(this.connectHint)this.positionConnectHint();
   if(this.linkMenu)this.positionLinkMenu();
  },100));
  this.registerEvent(this.app.workspace.on('active-leaf-change',()=>{this.contextEditor=null;this.clearConnectHint();this.panels.close(false);this.sizes.finish();this.reset();this.altTap=null;this.clearAltRepeat();this.editorCamera.stop();}));this.register(()=>{this.contextEditor=null;this.reset();this.clearConnectHint();this.clearAltRepeat();for(const el of document.querySelectorAll<HTMLElement>('[data-cm-key]'))delete el.dataset.cmKey;for(const el of document.querySelectorAll('.cm-multi-anchor'))el.classList.remove('cm-multi-anchor');});
 }
 private contextEditor:{node:any;cm:any;selection:any}|null=null;
 private toolbarSession:{c:Canvas;menu:Menu;selection:string}|null=null;
 private toolEvents=new WeakSet<Event>();
 private toolChoiceKey(e:KeyboardEvent,c:Canvas){
  if(this.toolEvents.has(e))return true;
  const panel=c.wrapperEl?.querySelector('.canvas-submenu') as HTMLElement|null;
  if(!panel||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape'].includes(e.key)||(e.target as HTMLElement)?.matches?.('input'))return false;
  this.toolEvents.add(e);this.stop(e);
  const items=[...panel.querySelectorAll<HTMLElement>('.canvas-color-picker-item,button,[role="option"],[role="menuitem"]')].filter(el=>el.getClientRects().length);
  if(e.key==='Escape'){panel.remove();this.toolbarSession=null;this.updateCardKeys(c);return true;}
  if(!items.length)return true;
  let index=items.findIndex(el=>el.classList.contains('cm-tool-selected'));if(index<0)index=Math.max(0,items.findIndex(el=>el.classList.contains('is-active')));
  if(e.key==='Enter'){if(!e.repeat){const item=items[index],input=item.querySelector<HTMLInputElement>('input');if(input)input.click();else item.click();}return true;}
  index=(index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+items.length)%items.length;
  items.forEach((el,i)=>el.classList.toggle('cm-tool-selected',i===index));items[index].scrollIntoView({block:'nearest'});return true;
 }
 private openCardContext(c:Canvas){
  if(this.altTap)this.altTap.clean=false;this.reset();const n=this.selected(c)||[...c.selection].find((v:any)=>c.nodes.has(v.id)) as any;if(!n)return;
  const cm=n.child?.editMode?.cm;this.contextEditor=n.isEditing&&cm?{node:n,cm,selection:cm.state.selection}:null;
  if(this.contextEditor){this.toolbarSession=null;const pos=cm.coordsAtPos(cm.state.selection.main.head),doc=cm.contentDOM.ownerDocument;cm.contentDOM.dispatchEvent(new doc.defaultView.MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:pos?.left??0,clientY:pos?.bottom??0}));return;}
  const r=n.nodeEl.getBoundingClientRect();let menu:Menu;
  if(c.selection.size>1){const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window,button:2,clientX:r.left,clientY:r.top});let captured:Menu|undefined;const ref=(this.app.workspace as any).on('canvas:selection-menu',(m:Menu,canvas:Canvas)=>{if(canvas===c)captured=m;});try{c.onSelectionContextMenu(event);}finally{this.app.workspace.offref(ref);}if(!captured)return;menu=captured;}else{menu=new Menu();n.showMenu(menu);}
  this.toolbarSession={c,menu,selection:[...c.selection].map((n:any)=>n.id).join(',')};
  for(const shift of [false,true])for(let i=0;i<10;i++)(menu as any).scope.register(shift?['Shift']:[],String(i),(e:KeyboardEvent)=>{this.toolbarKey(e,c);return false;});
  (menu as any).setUseNativeMenu(false);
  menu.showAtPosition({x:r.left+r.width/2,y:r.top+Math.min(30,r.height/2)});this.updateCardKeys(c);
 }
 private toolbarButtons(c:Canvas):HTMLElement[]{return c?[...c.wrapperEl.querySelectorAll('.canvas-menu button, .canvas-menu .canvas-menu-item')].filter((el:any)=>el.getClientRects().length) as HTMLElement[]:[];}
 private toolbarEvents=new WeakSet<Event>();
 private toolbarKey(e:KeyboardEvent,c:Canvas){
  if(this.toolbarEvents.has(e))return true;
  if(!/^Digit[0-9]$/.test(e.code))return false;
  if(this.toolbarSession?.c!==c||c.readonly||!c.selection.size||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||this.menu||this.linkMenu||document.querySelector('.cm-panel,.modal-container')||[...c.nodes.values()].some((n:any)=>n.isEditing)||(e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable="true"]'))return false;
  const button=this.toolbarButtons(c)[(Number(e.code.slice(5))+9)%10+(e.shiftKey?10:0)];if(!button)return false;
  this.toolbarEvents.add(e);this.stop(e);this.reset();if(!e.repeat){this.toolbarSession?.menu.hide();button.click();const panel=c.wrapperEl.querySelector('.canvas-submenu');panel?.querySelector('.canvas-color-picker-item.is-active,.canvas-color-picker-item,button')?.classList.add('cm-tool-selected');}return true;
 }
 private updateCardKeys(c:Canvas){
  if(this.toolbarSession&&(this.toolbarSession.c!==c||this.toolbarSession.selection!==[...c.selection].map((n:any)=>n.id).join(',')||(!document.querySelector('.menu')&&!c.wrapperEl.querySelector('.canvas-submenu'))))this.toolbarSession=null;
  const editor=this.contextEditor;if(editor&&!document.querySelector('.menu')){this.contextEditor=null;if(c?.nodes.get(editor.node.id)===editor.node&&!document.querySelector('.modal-container')){if(!editor.node.isEditing)editor.node.startEditing();const cm=editor.node.child?.editMode?.cm;if(cm){const end=cm.state.doc.length;cm.dispatch({selection:{anchor:Math.min(editor.selection.main.anchor,end),head:Math.min(editor.selection.main.head,end)}});cm.focus();}}}
  const anchor=this.multiAnchor;
  for(const el of document.querySelectorAll<HTMLElement>('.cm-multi-anchor'))if(!c||!anchor||anchor.c!==c||!c.selection.has(c.nodes.get(anchor.id))||c.selection.size<2||el!==c.nodes.get(anchor.id)?.nodeEl)el.classList.remove('cm-multi-anchor');
  if(c&&anchor&&anchor.c===c&&c.selection.size>1&&c.selection.has(c.nodes.get(anchor.id)))c.nodes.get(anchor.id).nodeEl.classList.add('cm-multi-anchor');
  const buttons=this.toolbarButtons(c);for(const el of document.querySelectorAll<HTMLElement>('[data-cm-key]'))if(!buttons.includes(el))delete el.dataset.cmKey;
  buttons.forEach((el,i)=>{if(this.toolbarSession?.c===c&&i<20&&c.selection.size&&![...c.nodes.values()].some((n:any)=>n.isEditing))el.dataset.cmKey=(i>=10?'⇧':'')+((i+1)%10);else delete el.dataset.cmKey;});
 }
 private holdMenuKey(e:KeyboardEvent){if(!this.menu)return false;this.stop(e);if(e.key==='Escape'){this.reset();return true;}if(e.key==='ArrowUp'||e.key==='ArrowDown'){const m=this.menu;m.index=(m.index+(e.key==='ArrowDown'?1:-1)+m.values.length)%m.values.length;this.paintMenu();}return true;}
 private convertFile(c:Canvas,id:string,path:string){
  if(this.current()!==c||c.readonly||c.nodes.get(id)?.isEditing||!this.app.vault.getFileByPath(path)){new Notice('파일 또는 대상 카드를 찾을 수 없습니다.');return;}
  const before:CanvasData=c.getData();let after:CanvasData;try{after=insertFile(before,id,path,mediaExtensions.video.has(path.split('.').pop()!.toLowerCase())?(this.settings.width??c.config.defaultTextNodeDimensions.width):undefined)}catch{new Notice('빈 카드 또는 파일 카드 하나를 선택하세요.');return;}
  this.sizes.finish();this.selections.observe(c);this.selections.capture(c);c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
  try{c.setData(after);c.selectOnly(c.nodes.get(id));this.selections.capture(c);c.requestSave(false);}catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('파일을 넣지 못했습니다. 기존 카드를 유지합니다.');console.error(error);}
 }
 private arrange(c:Canvas){this.reset();this.clearConnectHint();this.sizes.finish();const ids=[...c.selection].filter((n:any)=>c.nodes.has(n.id)&&n.getData().type!=='group').map((n:any)=>n.id);if(!ids.length)return;const before:CanvasData=c.getData(),after=arrangeSelection(before,ids,this.settings.gap,this.settings.arrangeDepth,this.settings.arrangeRange);if(JSON.stringify(before)===JSON.stringify(after))return;this.selections.observe(c);this.selections.capture(c);c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};try{for(const card of after.nodes){const node=c.nodes.get(card.id);if(node&&(node.x!==card.x||node.y!==card.y))node.moveTo({x:card.x,y:card.y});}c.requestPushHistory.cancel?.();c.data=after;c.pushHistory(c.getData());this.selections.capture(c);c.requestSave(false);}catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('정렬하지 못했습니다. 원래 배치를 복원했습니다.');console.error(error);}}
 private disconnect(c:Canvas,ids:Set<string>){
  this.reset();this.sizes.finish();this.selections.observe(c);this.selections.capture(c);
  const before:CanvasData=c.getData(),edges=before.edges.filter(e=>!ids.has(e.fromNode)&&!ids.has(e.toNode));if(edges.length===before.edges.length)return;
  c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
  try{c.setData({...before,edges});this.selections.capture(c);c.requestSave(false);}
  catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('연결을 해제하지 못했습니다. 기존 연결을 복원했습니다.');console.error('Canvas Mindmap disconnect failed',error);}
 }
 private clearLinkMenu(){this.linkMenu?.el.remove();this.linkMenu=null;}
 private showLinkMenu(c:Canvas,anchor:string,ids:string[]){
  this.clearLinkMenu();const el=document.body.createDiv({cls:'canvas-mindmap-menu canvas-mindmap-link-menu'});el.setAttribute('role','listbox');
  const data:CanvasData=c.getData();const labels=ids.length?ids.map(id=>{const edge=data.edges.find(e=>e.id===id)!;const other=data.nodes.find(n=>n.id===(edge.fromNode===anchor?edge.toNode:edge.fromNode));return (edge.fromNode===anchor?'→ ':'← ')+String(other?.text||other?.file||'Untitled').split('\n')[0]+(edge.label?' · '+edge.label:'');}):['A · Connect','D · Disconnect all','S · Reverse direction'];
  labels.forEach((text,i)=>{const row=el.createDiv({cls:'canvas-mindmap-option',text});row.title=text;row.classList.toggle('is-selected',ids.length>0&&i===0);});this.linkMenu={el,c,anchor,ids,index:0};this.positionLinkMenu();
 }
 private positionLinkMenu(){const m=this.linkMenu;if(!m)return;const n=this.selected(m.c);if(this.current()!==m.c||!n||n.id!==m.anchor||n.isEditing){this.clearLinkMenu();return;}const r=n.nodeEl.getBoundingClientRect();m.el.style.left=Math.max(8,Math.min(innerWidth-m.el.offsetWidth-8,r.right-m.el.offsetWidth))+'px';m.el.style.top=Math.max(8,r.top-m.el.offsetHeight-8)+'px';}
 private linkMenuKey(e:KeyboardEvent,c:Canvas){const m=this.linkMenu;if(!m||m.c!==c||!m.ids.length)return false;if(e.key==='Escape'){this.stop(e);this.clearLinkMenu();return true;}if(e.key==='ArrowUp'||e.key==='ArrowDown'){this.stop(e);m.index=(m.index+(e.key==='ArrowDown'?1:-1)+m.ids.length)%m.ids.length;[...m.el.children].forEach((el,i)=>el.classList.toggle('is-selected',i===m.index));return true;}if(e.key==='Enter'){this.stop(e);if(!e.repeat)this.reverseEdge(c,m.ids[m.index]);return true;}return false;}
 private openReverse(c:Canvas){this.reset();this.clearConnectHint();this.sizes.finish();const n=this.selected(c);if(!n)return;const ids=c.getData().edges.filter((e:any)=>e.fromNode===n.id||e.toNode===n.id).map((e:any)=>e.id);if(ids.length===1)this.reverseEdge(c,ids[0]);else if(ids.length)this.showLinkMenu(c,n.id,ids);}
 private reverseEdge(c:Canvas,id:string){this.clearLinkMenu();const before:CanvasData=c.getData();if(!before.edges.some(e=>e.id===id))return;const after={...before,edges:before.edges.map(e=>e.id===id?{...e,fromNode:e.toNode,toNode:e.fromNode,fromSide:e.toSide,toSide:e.fromSide}:e)};this.selections.observe(c);this.selections.capture(c);c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};try{c.setData(after);this.selections.capture(c);c.requestSave(false);}catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('연결 방향을 바꾸지 못했습니다. 기존 연결을 복원했습니다.');console.error(error);}}
 private clearConnectHint(){this.connectHeld=null;this.connectHint?.remove();this.connectHint=null;}
 private showConnectHint(){
  if(!this.connectHint){this.connectHint=document.body.createDiv({cls:'canvas-mindmap-menu canvas-mindmap-connect-hint'});this.connectHint.setAttribute('role','status');this.connectHint.createDiv({cls:'canvas-mindmap-option',text:'Press an arrow key'});}
  this.positionConnectHint();
 }
 private positionConnectHint(){
  const c=this.connectHeld,n=c&&this.selected(c),el=this.connectHint;
  if(!el)return;
  if(!c||this.current()!==c||!n||n.isEditing){this.clearConnectHint();return;}
  const r=n.nodeEl.getBoundingClientRect();
  el.style.left=Math.max(8,Math.min(innerWidth-el.offsetWidth-8,r.right-el.offsetWidth))+'px';
  el.style.top=Math.max(8,r.top-el.offsetHeight-8)+'px';
 }
 private connectionKey(e:KeyboardEvent,c:Canvas){
  if(this.connectHeld!==c||!e.ctrlKey||!e.shiftKey||e.altKey||e.metaKey||!e.key.startsWith('Arrow'))return false;
  this.stop(e);
  const n=this.selected(c);
  if(e.repeat||!n||c.readonly||[...c.nodes.values()].some((node:any)=>node.isEditing)||(e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable="true"],.modal-container'))return true;
  const direction=e.key.slice(5).toLowerCase() as Direction,before:CanvasData=c.getData(),target=nearestCard(before,n.id,direction);
  if(!target||before.edges.some(edge=>(edge.fromNode===n.id&&edge.toNode===target.id)||(edge.toNode===n.id&&edge.fromNode===target.id)))return true;
  this.selections.observe(c);this.selections.capture(c);
  const side={up:'top',down:'bottom',left:'left',right:'right'},opposite={up:'bottom',down:'top',left:'right',right:'left'};
  const after={...before,edges:[...before.edges,{id:crypto.randomUUID().replace(/-/g,'').slice(0,16),fromNode:n.id,toNode:target.id,fromSide:side[direction],toSide:opposite[direction]}]};
  c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
  try{c.setData(after);this.selections.capture(c);c.requestSave(false);}
  catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('카드를 연결하지 못했습니다. 기존 상태를 복원했습니다.');console.error('Canvas Mindmap connect failed',error);}
  return true;
 }
 syncColorCommands(){for(const id of this.colorCommands)this.removeCommand(id);this.colorCommands.clear();for(const color of this.settings.customColors){const id='apply-custom-'+color.slice(1);this.colorCommands.add(id);this.addCommand({id,name:`사용자 색상 ${color} 적용`,checkCallback:checking=>{const c=this.current();if(!c||c.readonly||!c.selection.size||[...c.nodes.values()].some((n:any)=>n.isEditing))return false;if(!checking)this.panels.applyColor(c,color);return true;}});}}
 async restoreSettings(values:any){await this.saveChain;const next={...this.settings,...settingsOnly(values)};await this.saveData(next);this.settings=next;this.reset();this.panels.close(false);}
 persist(){this.saveChain=this.saveChain.then(()=>this.saveData(this.settings)).catch(()=>{new Notice('Canvas Mindmap 설정을 저장하지 못했습니다.');});return this.saveChain;}
 private attach(doc:Document){
  if(this.docs.has(doc))return;this.docs.add(doc);
  const down=(e:KeyboardEvent)=>this.keydown(e),up=(e:KeyboardEvent)=>this.keyup(e),blur=()=>{this.clearConnectHint();this.altTap=null;this.clearAltRepeat();this.sizes.finish();this.reset();};
  const keyboardTarget=doc.defaultView||doc;
  const drawingChange=()=>{this.drawingBlocked();};
  doc.addEventListener('canvas-drawing-tool-bar:mode-change',drawingChange,true);
  registerRuntimeCleanup(this,doc,()=>doc.removeEventListener('canvas-drawing-tool-bar:mode-change',drawingChange,true));
  const pause=()=>this.editorCamera.pause(),resume=()=>this.editorCamera.resume();
  const pointer=(e:PointerEvent)=>{this.clearAltRepeat();this.panels.outside(e.target);if(e.button===1||e.button===2)this.editorCamera.pause();else this.editorCamera.resume();};
  doc.addEventListener('wheel',pause,{capture:true,passive:true});doc.addEventListener('input',resume,true);doc.addEventListener('pointerdown',pointer,true);
  registerRuntimeCleanup(this,doc,()=>{doc.removeEventListener('wheel',pause,true);doc.removeEventListener('input',resume,true);doc.removeEventListener('pointerdown',pointer,true);});
  keyboardTarget.addEventListener('keydown',down as EventListener,true);keyboardTarget.addEventListener('keyup',up as EventListener,true);doc.defaultView?.addEventListener('blur',blur);
  registerRuntimeCleanup(this,doc,()=>{keyboardTarget.removeEventListener('keydown',down as EventListener,true);keyboardTarget.removeEventListener('keyup',up as EventListener,true);doc.defaultView?.removeEventListener('blur',blur);});
 }
 private activeCanvas():Canvas|null {const view=this.app?.workspace.getActiveViewOfType(Object as any) as any;return view?.getViewType?.()==='canvas'?view.canvas:null;}
 private isDrawing(c:Canvas|null){return !!c?.wrapperEl?.classList.contains('cdt-drawing');}
 private drawingBlocked(c=this.activeCanvas()){
  if(!this.isDrawing(c)){this.drawingSuspended=false;return false;}
  if(!this.drawingSuspended){
   // Mark first: closing a picker can synchronously ask for the current Canvas.
   this.drawingSuspended=true;this.contextEditor=null;this.altTap=null;this.clearAltRepeat();
   this.reset();this.clearConnectHint();this.multiAnchor=null;
   this.toolbarSession?.menu.hide();this.toolbarSession=null;
   this.sizes.finish();this.sizes.cancelPendingFit();this.navigation.cancel();this.editorCamera.stop();
   this.panels.close(false);this.fileInsert.close();this.cardMedia.dispose();this.updateCardKeys(null);
  }
  return true;
 }
 private current():Canvas|null {const c=this.activeCanvas();return this.drawingBlocked(c)?null:c;}
 private selected(c:Canvas){const s=[...c.selection] as any[];return s.length===1&&c.nodes.has(s[0].id)&&s[0].getData().type!=='group'?s[0]:null;}
 private initializeDimensions(c:Canvas){const d=c.config?.defaultTextNodeDimensions;if(d&&Number.isFinite(d.width)&&Number.isFinite(d.height)&&(this.settings.width===null||this.settings.height===null)){this.settings.width??=d.width;this.settings.height??=d.height;void this.persist();}}
 private canUseCardCommand(c:Canvas,allowEditing=false){const active=document.activeElement;return c&&!c.readonly&&(allowEditing||![...c.nodes.values()].some((n:any)=>n.isEditing))&&!active?.closest('.modal-container')&&(!active?.closest('input,textarea,[contenteditable="true"]')||(allowEditing&&!!active.closest('.canvas-node')))&&!document.querySelector('.menu');}
 private stop(e:KeyboardEvent){e.preventDefault();e.stopImmediatePropagation();}
 private mediaKey(e:KeyboardEvent,c:Canvas){
  if(e.key!=='Enter'||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||e.isComposing||c.readonly||this.menu||this.linkMenu)return false;
  if((e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable="true"],.modal-container,button,a,video,audio'))return false;
  if([...c.nodes.values()].some((node:any)=>node.isEditing))return false;
  const node=this.selected(c);if(!node||!this.cardMedia.supports(node))return false;
  this.stop(e);if(!e.repeat)this.cardMedia.activate(c,node);return true;
 }
 private patchCanvasInput(c:Canvas){
  if(this.canvasInputs.has(c))return;this.canvasInputs.add(c);
  // Native import reuses a node by ID even when its type changes. Recreate only
  // text/file replacements so conversion and native Undo use the proper view.
  const originalImport=c.importData;
  const importWithTypes=function(this:any,data:CanvasData,...args:any[]){
   for(const item of data?.nodes||[]){const node=this.nodes.get(item.id),type=node?.getData().type;
    if(node&&type!==item.type&&['text','file'].includes(type)&&['text','file'].includes(item.type))this.removeNode(node);
   }
   return originalImport.call(this,data,...args);
  };
  c.importData=importWithTypes;registerRuntimeCleanup(this,c,()=>{if(c.importData===importWithTypes)c.importData=originalImport;});
  this.inputScopes.get(c.view.scope)?.();
  const cleanups:Array<()=>void>=[];
  const cleanup=()=>{for(const cb of cleanups.reverse())cb();cleanups.length=0;};
  this.inputScopes.set(c.view.scope,cleanup);registerRuntimeCleanup(this,c,cleanup);
  for(const binding of c.view.scope?.keys||[]){
   if(!binding.key?.startsWith('Arrow')&&binding.key!=='Enter'&&!/^[0-9]$/.test(binding.key))continue;
   const original=binding.func;
   const wrapper=(e:KeyboardEvent,...args:any[])=>{
     if(this.isDrawing(c))return original(e,...args);
    if(this.toolChoiceKey(e,c))return false;
    if(document.querySelector('.menu'))return original(e,...args);
    if(this.toolbarKey(e,c))return false;
    if(this.holdMenuKey(e))return false;
    if(this.fileInsert.key(e))return false;
    if(this.panels.capturesCanvasKeys(c)&&this.panels.key(e))return false;
    if(this.linkMenuKey(e,c)||this.connectionKey(e,c))return false;
    if(this.mediaKey(e,c))return false;
    if(binding.modifiers!=='Shift')return original(e,...args);
    const editing=[...c.nodes.values()].some((n:any)=>n.isEditing);
    const input=(e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable="true"],.modal-container');
    if(!editing&&!input&&!c.readonly)return;
    return original(e,...args);
   };
   binding.func=wrapper;cleanups.push(()=>{if(binding.func===wrapper)binding.func=original;});
  }
 }
 private keydown(e:KeyboardEvent){
  if(document.querySelector('.uct-composition'))return;
  if(this.drawingBlocked())return;
  if(e.key!=='Alt'){if(this.altTap)this.altTap.clean=false;this.clearAltRepeat();}
  const activeCanvas=this.current();if(activeCanvas&&this.toolChoiceKey(e,activeCanvas))return;
  if(this.contextEditor&&['Escape','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
   this.stop(e);return;
  }
  if(document.querySelector('.menu'))return;
  if(this.holdMenuKey(e))return;
  if(this.fileInsert.key(e))return;
  if(this.panels.key(e))return;
  const c=this.current();if(!c||c.readonly||e.isComposing)return;const n=this.selected(c);
  const target=e.target as HTMLElement;
  const editing=[...c.nodes.values()].some((node:any)=>node.isEditing);
  const input=target?.closest?.('input,textarea,[contenteditable="true"],.modal-container');
  const frame=target?.ownerDocument?.defaultView?.frameElement;
  const insideCard=[...c.nodes.values()].some((node:any)=>node.isEditing&&(node.nodeEl.contains(target)||(frame&&node.nodeEl.contains(frame))));
  if(input&&!insideCard)return;
  if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey&&(e.code==='KeyR'||e.code==='KeyM')&&this.canUseCardCommand(c,true)){
   this.stop(e);if(e.repeat)return;if(this.altTap)this.altTap.clean=false;this.reset();
   if(e.code==='KeyR')void this.sizes.fitSelection(c).catch(console.error);else if(c.selection.size)this.openCardContext(c);return;
  }
  if(this.toolbarKey(e,c))return;
  if(this.mediaKey(e,c))return;
  // Match physical keys before Obsidian's character-based hotkeys (ㅁ/ㄴ in Korean).
  if(!editing&&!input&&n&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&(e.code==='KeyA'||e.code==='KeyS')){
   this.stop(e);if(e.repeat||this.handledConnectionEvents.has(e))return;
   if(e.code==='KeyA'){this.reset();this.sizes.finish();this.connectHeld=c;this.showConnectHint();}
   else this.openReverse(c);
   return;
  }
  if(!editing&&!input&&!this.menu&&!this.linkMenu&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&(e.code==='KeyX'||e.key.toLowerCase()==='x')){
   const cards=[...c.selection].filter((item:any)=>c.nodes.has(item.id));if(!cards.length)return;
   this.stop(e);if(e.repeat)return;this.reset();this.clearConnectHint();this.sizes.finish();this.selections.observe(c);this.selections.capture(c);
   c.requestPushHistory.cancel?.();c.pushHistory(c.getData());for(const card of cards)c.removeNode(card);c.deselectAll();c.pushHistory(c.getData());c.requestSave(false);return;
  }
  if(e.code==='KeyL'&&!editing&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&c.selection.size){this.stop(e);if(this.shouldRunConnectionCommand(e))this.arrange(c);return;}
  this.sizes.observe(c);this.selections.observe(c);this.editorCamera.observe(c);
  if(this.linkMenuKey(e,c)||this.connectionKey(e,c))return;
  if(!editing&&n&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&(e.key==='Control'||e.key==='Shift')){if(!e.repeat){this.reset();this.linkTimer=window.setTimeout(()=>{this.linkTimer=null;if(this.current()===c&&this.selected(c)?.id===n.id&&!n.isEditing)this.showLinkMenu(c,n.id,[]);},500);}return;}
  if(e.key!=='Control'&&e.key!=='Shift'&&this.linkTimer!==null){window.clearTimeout(this.linkTimer);this.linkTimer=null;}
  if(editing&&!e.ctrlKey&&!e.altKey&&!e.metaKey)this.editorCamera.resume();
  if(!editing&&!e.ctrlKey&&!e.metaKey&&e.shiftKey&&e.key.startsWith('Arrow')&&(!e.altKey||e.key==='ArrowUp'||e.key==='ArrowDown')){this.stop(e);this.reset();this.navigation.cameraKey(c,e.altKey?(e.key==='ArrowUp'?'ZoomIn':'ZoomOut'):e.code);return;}
  if(!editing&&e.ctrlKey&&e.shiftKey&&e.altKey&&!e.metaKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();if(e.repeat)return;const cards=[...c.selection].filter((v:any)=>c.nodes.has(v.id)&&v.getData().type!=='group') as any[];if(!cards.length)return;const anchor=this.multiAnchor?.c===c&&cards.some(v=>v.id===this.multiAnchor!.id)?this.multiAnchor!.id:cards[cards.length-1].id;const next=nearestCard(c.getData(),anchor,e.key.slice(5).toLowerCase() as Direction);if(next){const node=c.nodes.get(next.id);c.select(node);this.multiAnchor={c,id:node.id};this.navigation.focus(c,node);}return;}
  if(!editing&&e.key==='Alt'&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey){this.stop(e);if(!e.repeat)this.altTap={clean:true,c};return;}
  if(!editing&&!(e.ctrlKey&&e.code==='KeyZ'))this.selections.capture(c);
  if(!n)return;
  if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&e.code==='Space'){
   this.stop(e);this.reset();if(e.repeat)return;this.sizes.observe(c);
   if(n.isEditing){n.child?.showPreview?.(true);n.setIsEditing(false);c.wrapperEl.focus();this.navigation.cancel();this.editorCamera.exit(c,n);}
   else {this.navigation.cancel();n.attach();n.render();n.startEditing();}return;
  }
  if(e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();this.sizes.resize(c,n,e.key);return;}
  if(n.isEditing||target?.closest?.('input,textarea,[contenteditable="true"],.modal-container'))return;
  if(this.menu){this.stop(e);if(e.key==='ArrowUp'||e.key==='ArrowDown'){const m=this.menu;m.index=(m.index+(e.key==='ArrowDown'?1:-1)+m.values.length)%m.values.length;this.paintMenu();}return;}
  if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();if(!e.repeat)this.navigation.navigate(c,n,e.key.slice(5).toLowerCase() as Direction);return;}
  if(e.ctrlKey&&e.shiftKey&&!e.altKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();this.sizes.resize(c,n,e.key);return;}
  if(e.ctrlKey&&e.altKey&&!e.shiftKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){this.stop(e);this.reset();if(!e.repeat)this.sizes.swap(c,n,e.key==='ArrowDown');return;}
  // Repeated Control keydowns must not fall through to chord cancellation.
  if(e.key==='Control'&&!e.altKey&&!e.shiftKey){if(!e.repeat)this.begin('Control',c,n.id);return;}
  if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&e.key.startsWith('Arrow')){
   this.stop(e);this.clearTimer();if(this.hold)this.hold.consumed=true;
   if(!e.repeat)this.create(c,n.id,e.key.slice(5).toLowerCase() as Direction,false);return;
  }
  if(e.key==='Tab'&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){this.stop(e);if(!e.repeat)this.begin('Tab',c,n.id);return;}
  if(this.hold?.key==='Control'){this.clearTimer();this.hold.consumed=true;}
 }
 private begin(key:string,canvas:Canvas,anchor:string){
  this.reset();const hold:Hold={key,canvas,anchor,consumed:false,timer:0};this.hold=hold;
  hold.timer=window.setTimeout(()=>{if(this.hold!==hold||this.current()!==canvas||this.selected(canvas)?.id!==anchor)return;hold.consumed=true;this.openMenu(key==='Control'?'mode':'source',canvas,anchor);},key==='Control'?500:200);
 }
 private keyup(e:KeyboardEvent){
  if(document.querySelector('.uct-composition'))return;
  if(this.drawingBlocked())return;
  if(e.code==='KeyA'||e.key==='Control'||e.key==='Shift')this.clearConnectHint();
  if(e.key==='Control'||e.key==='Shift'){if(this.linkTimer!==null)window.clearTimeout(this.linkTimer);this.linkTimer=null;if(this.linkMenu&&!this.linkMenu.ids.length)this.clearLinkMenu();}
  if(e.key==='Alt'&&this.altTap){const a=this.altTap;this.altTap=null;if(a.clean&&this.current()===a.c&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey&&this.canUseCardCommand(a.c)){this.stop(e);this.reset();this.multiAnchor=null;
   const c=a.c,ids=[...c.selection].filter((n:any)=>c.nodes.has(n.id)).map((n:any)=>n.id),prior=this.altRepeat;
   if(prior&&prior.c===c&&JSON.stringify(prior.after)===JSON.stringify(ids)){
    const targets=(prior.ids.length?prior.ids:ids).map(id=>c.nodes.get(id)).filter(Boolean);this.clearAltRepeat();
    if(targets.length){this.navigation.cancel();c.deselectAll();for(const node of targets)c.select(node);c.zoomToSelection();}
   }else{
    this.clearAltRepeat();if(c.selection.size)c.deselectAll();else this.navigation.selectNearest(c);
    const pending={c,ids,after:[...c.selection].filter((n:any)=>c.nodes.has(n.id)).map((n:any)=>n.id),timer:0};this.altRepeat=pending;
    pending.timer=window.setTimeout(()=>{if(this.altRepeat===pending)this.altRepeat=null;},300);
   }}}
  this.sizes.keyup(e.key);
  const hold=this.hold;if(!hold||e.key!==hold.key)return;if(e.key==='Tab')this.stop(e);this.clearTimer();
  if(this.menu){const m=this.menu,choice=m.values[m.index];if(m.kind==='mode')this.settings.mode=choice as Settings['mode'];else this.settings.origins[(this as any).uctSpaceKey?.(m.canvas.view.file.path,m.canvas.view)??m.canvas.view.file.path]=choice;void this.persist();}
  else if(hold.key==='Tab'&&!hold.consumed&&this.current()===hold.canvas&&this.selected(hold.canvas)?.id===hold.anchor)this.create(hold.canvas,hold.anchor,'down',true);
  this.reset();
 }
 private clearTimer(){if(this.hold)window.clearTimeout(this.hold.timer);}
 private reset(){if(this.linkTimer!==null)window.clearTimeout(this.linkTimer);this.linkTimer=null;this.clearLinkMenu();this.clearTimer();this.hold=null;this.menu?.el.remove();this.menu=null;}
 private openMenu(kind:'mode'|'source',c:Canvas,anchor:string){
  const candidates=sources(c.getData(),anchor);if(kind==='source'&&(this.settings.mode!=='connect'||!candidates.length))return;
  const values=kind==='mode'?['create','connect']:candidates.map(n=>n.id),current=kind==='mode'?this.settings.mode:this.settings.origins[(this as any).uctSpaceKey?.(c.view.file.path,c.view)??c.view.file.path];
  const el=document.body.createDiv({cls:'canvas-mindmap-menu'});el.setAttribute('role','listbox');el.setAttribute('aria-label',kind==='mode'?'Creation mode':'Connection source');
  values.forEach((value,index)=>{const label=kind==='mode'?(value==='create'?'Create':'Create & Connect'):(candidates[index].text||String(candidates[index].file||'Untitled')).split('\n')[0];const row=el.createDiv({cls:'canvas-mindmap-option',text:label});row.setAttribute('role','option');row.title=label;});
  this.menu={el,values,index:Math.max(0,values.indexOf(current)),kind,canvas:c,anchor};this.paintMenu();this.positionMenu();
 }
 private paintMenu(){if(!this.menu)return;[...this.menu.el.children].forEach((el,i)=>{el.classList.toggle('is-selected',i===this.menu!.index);el.setAttribute('aria-selected',String(i===this.menu!.index));});}
 private positionMenu(){const m=this.menu;if(!m)return;const n=m.canvas.nodes.get(m.anchor);if(!n){this.reset();return;}const r=n.nodeEl.getBoundingClientRect(),h=m.el.offsetHeight,w=m.el.offsetWidth;m.el.style.left=`${Math.max(8,Math.min(innerWidth-w-8,r.right-w))}px`;m.el.style.top=`${Math.max(8,r.top-h-8)}px`;}
 private create(c:Canvas,anchor:string,direction:Direction,tab:boolean){
  const before:CanvasData=c.getData(),selection=[...c.selection].map((n:any)=>n.id);
  try{
   const defaults=c.config.defaultTextNodeDimensions;if(!defaults||!Number.isFinite(defaults.width)||!Number.isFinite(defaults.height))throw Error('Native card dimensions unavailable.');
   if(this.settings.width===null||this.settings.height===null){this.settings.width??=defaults.width;this.settings.height??=defaults.height;void this.persist();}
   const path=(this as any).uctSpaceKey?.(c.view.file.path,c.view)??c.view.file.path;let source=this.settings.origins[path];const candidates=sources(before,anchor);if(!candidates.some(n=>n.id===source))source=candidates[0]?.id;
   const id=crypto.randomUUID().replace(/-/g,'').slice(0,16);
   const after=createLayout(before,{anchor,id,direction,tab,width:this.settings.width!,height:this.settings.height!,gap:this.settings.gap,connected:this.settings.mode==='connect',source});
   c.requestPushHistory.cancel?.();c.pushHistory(before);const history={data:[...c.history.data],current:c.history.current};
   try{applyCreation(c,before,after);c.selectOnly(c.nodes.get(id));this.selections.capture(c);this.navigation.focus(c,c.nodes.get(id));c.requestPushHistory.cancel?.();c.requestSave(false);}
   catch(error){c.setData(before);c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();if(selection[0]&&c.nodes.has(selection[0]))c.selectOnly(c.nodes.get(selection[0]));c.requestSave();throw error;}
  }catch(error){console.error('Canvas Mindmap creation failed',error);new Notice('카드를 생성하지 못했습니다. 기존 카드와 연결을 복원했습니다.');}
 }
}
class CreationSettings extends PluginSettingTab {
 constructor(private plugin:CanvasMindmap){super(plugin.app,plugin);}
 private resetButton(row:Setting,key:keyof typeof settingDefaults){
  row.settingEl.dataset.settingKey=key;
  row.addExtraButton(b=>b.setIcon('rotate-ccw').setTooltip('기본값으로 복원').onClick(async()=>{
   let value:any=settingDefaults[key];
   if(key==='width'||key==='height'){const c=(this.app.workspace.getActiveViewOfType(Object as any) as any)?.canvas;value=c?.config?.defaultTextNodeDimensions?.[key]??null;}
   (this.plugin.settings as any)[key]=value;await this.plugin.persist();
   // Keep the current settings window viewport and keyboard focus across rebuilding controls.
   const positions:{el:HTMLElement;top:number;left:number}[]=[];
   for(let el:HTMLElement|null=this.containerEl;el;el=el.parentElement)positions.push({el,top:el.scrollTop,left:el.scrollLeft});
   this.display();
   this.containerEl.querySelector<HTMLElement>(`[data-setting-key="${key}"] .extra-setting-button`)?.focus({preventScroll:true});
   for(const {el,top,left} of positions){el.scrollTop=top;el.scrollLeft=left;}
  }));
 }
 private cameraSlider(key:'panStep'|'zoomStepPercent'|'editMinZoom'|'panDuration'|'arrangeDepth'|'arrangeRange',label:string,desc:string,min:number,max:number,step:number,unit:string){
  const row=new Setting(this.containerEl).setName(label).setDesc(desc),current=this.plugin.settings[key];
  row.settingEl.addClass('cm-camera-setting');
  const value=row.controlEl.createSpan({cls:'cm-setting-value',text:`${Number(current.toFixed(2))}${unit}`});
  value.setAttribute('aria-live','polite');
  row.addSlider(slider=>{slider.setLimits(Math.min(min,current),Math.max(max,current),step).setValue(current).onChange(async n=>{this.plugin.settings[key]=n;value.textContent=`${Number(n.toFixed(2))}${unit}`;await this.plugin.persist();});slider.sliderEl.setAttribute('aria-label',label);});
  this.resetButton(row,key);
 }
 display(){this.containerEl.empty();this.containerEl.createEl('h2',{text:'Canvas Mindmap'});this.containerEl.createEl('h3',{text:'카드 생성'});
  this.resetButton(new Setting(this.containerEl).setName('생성 모드').setDesc('모든 캔버스에 적용하며 마지막 선택을 저장합니다.').addDropdown(d=>d.addOption('create','일반 생성').addOption('connect','연결 생성').setValue(this.plugin.settings.mode).onChange(async value=>{this.plugin.settings.mode=value as Settings['mode'];await this.plugin.persist();})),'mode');
  for(const [key,label] of [['width','새 카드 기본 너비'],['height','새 카드 기본 높이'],['gap','카드 사이 간격'],['resizeStep','크기 조절 단위'],['swapTolerance','위치 교환 시 가로 정렬 허용 오차']] as const){
   if(key==='resizeStep')this.containerEl.createEl('h3',{text:'카드 크기'});
   this.resetButton(new Setting(this.containerEl).setName(label).setDesc('캔버스 기준 픽셀(px)').addText(text=>text.setPlaceholder('Obsidian 기본값').setValue(String(this.plugin.settings[key]??'')).onChange(async value=>{const n=Number(value);if(!value.trim()||!Number.isFinite(n)||(['gap','swapTolerance'].includes(key)?n<0:n<=0))return;this.plugin.settings[key]=n;await this.plugin.persist();})),key);
  }
  new Setting(this.containerEl).setName('선택한 카드 내용에 맞추기').setDesc('선택 중 또는 편집 중 Alt+R을 누르면 선택한 텍스트 카드 각각의 크기를 맞춥니다. 자동 실행하지 않으며 단축키 설정에서 키를 바꿀 수 있습니다.');
  this.containerEl.createEl('h3',{text:'카드 정렬'});
  this.cameraSlider('arrangeDepth','정렬 연결 단계','Ctrl+Shift+L: 선택한 모든 카드에서 연결을 따라 포함할 범위입니다. 1단계는 바로 연결된 카드, 2단계는 그다음 카드까지 포함합니다. 기본 1단계.',1,10,1,'단계');
  this.cameraSlider('arrangeRange','정렬 거리 범위','낮을수록 가까운 카드끼리, 높을수록 멀리 떨어진 카드까지 같은 묶음으로 정렬합니다. 연결 단계 안의 카드에 적용하며, 기본 3단계는 기존 거리 기준입니다.',1,5,1,'단계');
  this.containerEl.createEl('h3',{text:'카메라'});
  this.cameraSlider('panStep','화면 이동량','Shift+방향키 한 번의 이동 거리. 기본 60px.',1,600,1,'px');
  this.cameraSlider('zoomStepPercent','확대·축소량','Shift+Alt+↑/↓ 한 번의 배율 변화. 기본 약 7.18%.',0.01,50,0.01,'%');
  this.cameraSlider('editMinZoom','편집 시 최소 확대율','기본 100%. 이미 더 확대되어 있으면 유지합니다.',6.25,200,0.25,'%');
  this.resetButton(new Setting(this.containerEl).setName('입력 줄 따라가기').setDesc('편집 중 줄바꿈 시 입력 줄을 화면 중앙으로 이동합니다. 가로 위치는 따라가지 않습니다.').addToggle(toggle=>toggle.setValue(this.plugin.settings.followCaret).onChange(async value=>{this.plugin.settings.followCaret=value;await this.plugin.persist();})),'followCaret');
  this.cameraSlider('panDuration','화면 이동 시간','값이 클수록 천천히 이동합니다. 기본 250ms.',0,2000,10,'ms');
  this.containerEl.createEl('h3',{text:'단축키'});
  new Setting(this.containerEl).setName('Obsidian 단축키 설정').setDesc('명령으로 등록된 단축키를 확인하거나 변경합니다.').addButton(b=>b.setButtonText('단축키 설정 열기').onClick(()=>{const settings=(this.app as any).setting;settings.openTabById('hotkeys');const tab=settings.activeTab;tab?.searchComponent?.setValue('Canvas Mindmap');tab?.updateHotkeyVisibility?.();}));
  this.containerEl.createEl('h3',{text:'설정 백업 및 복원'});
  const transfer=new SettingsTransfer(this.plugin,()=>this.display());
  new Setting(this.containerEl).setName('설정만 백업·복원').setDesc('이 설정창의 설정값만 포함합니다. 사용자 색상, 연결 출발점, 캔버스·노트·Undo 기록은 제외합니다.').addButton(b=>b.setButtonText('설정 백업').onClick(()=>void transfer.backup())).addButton(b=>b.setButtonText('설정 복원').onClick(()=>void transfer.restore()));


 }
}
