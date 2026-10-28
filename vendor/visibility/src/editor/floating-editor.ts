import {App,Notice,setIcon,WorkspaceLeaf} from 'obsidian';
import type {CanvasVisibilitySettings,EditableNodeTarget} from '../types';
import {CanvasAdapter} from '../canvas/canvas-adapter';
import {NativeMarkdownEditor} from './native-markdown-editor';
import {resizable} from '../../../../src/resize';
let layer=0;
export class FloatingEditor {
 overlayEl!:HTMLElement;panelEl!:HTMLElement;host!:HTMLElement;editor:NativeMarkdownEditor|null=null;
 private abort=new AbortController();private observer?:ResizeObserver;private unresize?:()=>void;
 private timer=0;private queue:Promise<void>=Promise.resolve();private lastText='';private closed=false;private closing=false;private composing=false;
 private returnLeaf:WorkspaceLeaf|null=null;private status!:HTMLElement;private savedHeight=0;private folded=false;
 constructor(private app:App,private adapter:CanvasAdapter,readonly target:EditableNodeTarget,private settings:CanvasVisibilitySettings,_offset:number,_settingsChanged:()=>void,private onClosed:()=>void){}
 async open(){
  const doc=this.target.node.nodeEl.ownerDocument,win=doc.defaultView!;
  this.returnLeaf=this.app.workspace.getMostRecentLeaf();
  this.overlayEl=doc.body.createDiv({cls:'cv-editor-overlay'});this.panelEl=this.overlayEl.createDiv({cls:'cv-editor-panel'});
  const w=Math.min(win.innerWidth-24,Math.max(480,win.innerWidth*this.settings.editorWidthPercent/100));
  const h=Math.min(win.innerHeight-24,Math.max(320,win.innerHeight*this.settings.editorHeightPercent/100));
  Object.assign(this.panelEl.style,{width:w+'px',height:h+'px',left:(win.innerWidth-w)/2+'px',top:(win.innerHeight-h)/2+'px'});
  const header=this.panelEl.createDiv({cls:'cv-editor-header'});header.createDiv({cls:'cv-editor-title',text:this.target.title});
  const actions=header.createDiv({cls:'cv-editor-actions'});
  const fold=actions.createEl('button',{cls:'clickable-icon',attr:{'aria-label':'편집기 접기'}});setIcon(fold,'minus');
  fold.onclick=()=>{this.folded=!this.folded;if(this.folded){this.savedHeight=this.panelEl.offsetHeight;this.panelEl.addClass('cv-is-collapsed');this.panelEl.style.height=header.offsetHeight+'px';}else{this.panelEl.removeClass('cv-is-collapsed');this.panelEl.style.height=Math.min(this.savedHeight,win.innerHeight-this.panelEl.offsetTop)+'px';this.editor?.remeasure();}setIcon(fold,this.folded?'maximize-2':'minus');};
  const close=actions.createEl('button',{cls:'clickable-icon',attr:{'aria-label':'저장하고 닫기 (Esc)'}});setIcon(close,'x');close.onclick=()=>void this.close(true);
  this.host=this.panelEl.createDiv({cls:'cv-editor-body cv-native-editor-host'});
  this.status=this.panelEl.createDiv({cls:'cv-editor-status',text:this.target.kind==='file'?this.target.file!.path:'Canvas 카드 · 자동 저장'});
  this.editor=new NativeMarkdownEditor(this.app,this.target);
  try{await this.editor.mount(this.host);}catch(e){this.editor.detach();this.overlayEl.remove();throw e;}
  this.lastText=this.editor.getText();this.panelEl.addClass('cv-is-visible');this.activate();this.applyAppearance();
  this.panelEl.addEventListener('pointerdown',()=>this.activate(),{capture:true,signal:this.abort.signal});
  this.host.addEventListener('compositionstart',()=>{this.composing=true;win.clearTimeout(this.timer);},{signal:this.abort.signal});
  this.host.addEventListener('compositionend',()=>{this.composing=false;this.schedule();},{signal:this.abort.signal});
  const ref=this.app.workspace.on('editor-change',(_editor,info)=>{if(info===this.editor?.getView())this.schedule();});
  this.abort.signal.addEventListener('abort',()=>this.app.workspace.offref(ref));
  this.host.addEventListener('input',()=>this.schedule(),{signal:this.abort.signal});
  this.panelEl.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();void this.close(true);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopPropagation();void this.flush().catch(()=>{});}},{capture:true,signal:this.abort.signal});
  header.onpointerdown=e=>{if(e.button!==0||(e.target as HTMLElement).closest('button'))return;e.preventDefault();header.setPointerCapture(e.pointerId);const r=this.panelEl.getBoundingClientRect(),x=e.clientX,y=e.clientY;const move=(ev:PointerEvent)=>{this.panelEl.style.left=Math.max(0,Math.min(win.innerWidth-this.panelEl.offsetWidth,r.left+ev.clientX-x))+'px';this.panelEl.style.top=Math.max(0,Math.min(win.innerHeight-this.panelEl.offsetHeight,r.top+ev.clientY-y))+'px';};const end=()=>{header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);};header.addEventListener('pointermove',move,{signal:this.abort.signal});header.addEventListener('pointerup',end,{signal:this.abort.signal});header.addEventListener('pointercancel',end,{signal:this.abort.signal});};
  this.unresize=resizable(this.panelEl,360,320,()=>this.editor?.remeasure());this.observer=new ResizeObserver(()=>this.editor?.remeasure());this.observer.observe(this.host);
 }
 applyAppearance(){const s=this.settings as any;this.panelEl.style.setProperty('--uct-editor-background',s.editorBackground??'#ffffff');this.panelEl.style.setProperty('--uct-editor-opacity',String(s.editorOpacity??1));}
 activate(){this.overlayEl.style.setProperty('--cv-editor-layer',String(++layer));}
 private schedule(){if(this.closed||this.composing)return;const win=this.host.ownerDocument.defaultView!;win.clearTimeout(this.timer);this.timer=win.setTimeout(()=>void this.flush().catch(()=>{}),350);}
 async flush(){
  this.host.ownerDocument.defaultView!.clearTimeout(this.timer);
  const text=this.editor?.getText()??this.lastText;
  this.queue=this.queue.catch(()=>{}).then(async()=>{if(text===this.lastText)return;try{if(this.target.kind==='file')await this.editor?.saveFile();else this.adapter.updateTextNode(this.target.node,text);this.lastText=text;this.status.setText('자동 저장됨');}catch(e){this.status.setText('저장 실패 · 내용을 유지합니다');new Notice('UCT: 내용을 저장하지 못했습니다. 편집기를 유지합니다.');throw e;}});
  await this.queue;
 }
 async close(save=true){if(this.closed||this.closing)return;this.closing=true;try{if(save)await this.flush();}catch{this.closing=false;return;}
  this.closed=true;this.observer?.disconnect();this.unresize?.();this.abort.abort();
  const wasActive=this.panelEl.contains(this.panelEl.ownerDocument.activeElement)||this.app.workspace.getMostRecentLeaf()?.view===this.editor?.getView();this.editor?.detach();this.editor=null;this.overlayEl.remove();this.onClosed();
  if(wasActive&&this.returnLeaf?.containerEl.isConnected){this.app.workspace.setActiveLeaf(this.returnLeaf,{focus:true});this.target.node.canvas.wrapperEl?.focus();this.panelEl.ownerDocument.defaultView!.requestAnimationFrame(()=>{if(this.panelEl.ownerDocument.activeElement===this.panelEl.ownerDocument.body)this.target.node.canvas.wrapperEl?.focus();});}
 }
}

