import {MarkdownView,Notice,Setting,TFile} from 'obsidian';
import {execFile} from 'node:child_process';
import type UctPlugin from './main';
import {characterCount,mapRegion,type CompositionSettings,type WritingTemplate} from './composition-model';
import cream from '../assets/composition/cream.png';
import amber from '../assets/composition/amber.png';
import travel from '../assets/composition/travel.png';
import mono from '../assets/composition/mono.png';

const assets:Record<string,string>={cream,amber,travel,mono};
const defaultTemplates:WritingTemplate[]=[
 {id:'cream',name:'크림 모니터',asset:'cream',region:{x:.15,y:.17,width:.70,height:.59},font:'Consolas',fontSize:20,lineHeight:1.8,color:'#5e3518',fit:'contain'},
 {id:'amber',name:'앰버 모니터',asset:'amber',region:{x:.155,y:.18,width:.70,height:.53},font:'Consolas',fontSize:20,lineHeight:1.8,color:'#ffb52b',fit:'contain'},
 {id:'travel',name:'여행 타자기',asset:'travel',region:{x:.20,y:.13,width:.60,height:.57},font:'바탕',fontSize:20,lineHeight:1.8,color:'#342719',fit:'contain'},
 {id:'mono',name:'흑백 타자기',asset:'mono',region:{x:.20,y:.13,width:.60,height:.54},font:'바탕',fontSize:20,lineHeight:1.8,color:'#202020',fit:'contain'}
];
let fontsPromise:Promise<string[]>|undefined;
function installedFonts():Promise<string[]> {
 return fontsPromise??=new Promise(resolve=>{
   execFile('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-Command',"[Console]::OutputEncoding=[Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Drawing; $uctFonts=[System.Drawing.Text.InstalledFontCollection]::new(); ConvertTo-Json -Compress -InputObject @($uctFonts.Families | ForEach-Object { $_.Name }); $uctFonts.Dispose()"],{windowsHide:true,timeout:15000},(error,stdout)=>{
     try{const list=JSON.parse(stdout.replace(/^\uFEFF/,''));resolve(Array.isArray(list)?list.sort((a,b)=>a.localeCompare(b)):[]);}catch{resolve([]);}if(error)fontsPromise=undefined;
   });
 });
}
export class CompositionMode {
 settings:CompositionSettings={selected:'cream',scroll:'normal',count:true,templates:structuredClone(defaultTemplates)};
 private session?:{overlay:HTMLElement;host:HTMLElement;placeholder:Comment;view:any;floating:any;created:boolean;previousLeaf:any;abort:AbortController;observer:ResizeObserver;ref:any;previousState:any;scroll:{top:number;left:number}};
 private restoreCommands?:()=>void;
 handleKey(e:KeyboardEvent){
  if(!this.session||e.isComposing)return;const s=this.session;
  if(e.key==='Escape'||(e.key==='Enter'&&e.ctrlKey&&e.shiftKey&&!e.altKey)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!this.toggling&&!this.opening&&!this.closing)void this.close();return;}
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();if(e.key.toLowerCase()==='y'||e.shiftKey)s.view.editor.redo();else s.view.editor.undo();return;}
  // Isolate native editor events from UCT Canvas capture handlers.
 }
 private opening=false;private closing=false;private toggling=false;
 private templateQuery='';private templateFilter='all';
 constructor(private root:UctPlugin){}
 async load(){const saved=await this.root.readJSON(this.root.rootDir+'/composition.json');if(saved){this.settings={...this.settings,...saved};this.settings.templates=[...defaultTemplates.map(t=>({...structuredClone(t),...saved.templates?.find((s:any)=>s.id===t.id)})),...(saved.templates??[]).filter((t:any)=>t.custom&&typeof t.asset==='string')];}if(!this.settings.templates.some(t=>t.id===this.settings.selected))this.settings.selected='cream';}
 save(){return this.root.writeJSON(this.root.rootDir+'/composition.json',this.settings);}
 asset(template:WritingTemplate){return template.custom?this.root.app.vault.adapter.getResourcePath(template.asset):assets[template.asset];}
 get opened(){return !!this.session;}
 async toggle(){if(this.opening||this.closing||this.toggling)return;this.toggling=true;try{if(this.session)await this.close();else await this.open();}finally{window.setTimeout(()=>this.toggling=false,0);}}
 async open(){
  if(this.session||this.opening)return;this.opening=true;
  const app=this.root.app,manager=this.root.modules.editor.editorManager,previousLeaf=app.workspace.getMostRecentLeaf();
  let floating=manager.fromElement(document.activeElement),created=false;
  try {
   let view=floating?.editor?.getView()??previousLeaf?.view;
   if(!(view instanceof MarkdownView)){
    const canvas=this.root.canvasView(),node=canvas?.canvas?.selection.size===1?[...canvas.canvas.selection][0] as any:null;
    if(!node||canvas.canvas.readonly||!(node.getData().type==='text'||/\.md$/i.test(node.getData().file??''))){new Notice('텍스트·Markdown 카드 하나 또는 Markdown 문서를 선택하세요.');return;}
    const key=manager.getEditorKey(await manager.buildTarget(canvas,node));const existed=manager.editors.has(key);
    floating=await manager.openNode(canvas,node);if(!floating)return;created=!existed;view=floating.editor?.getView();
   }
   if(!view?.editor){new Notice('편집기를 준비하지 못했습니다.');return;}
   const previousState=view.getState();if(previousState.mode!=='source'||previousState.source!==false)await view.setState({...previousState,mode:'source',source:false},{history:false});
   const host:HTMLElement=floating?.host??view.contentEl,doc=host.ownerDocument;
   const placeholder=doc.createComment('UCT composition return point');host.before(placeholder);
   const overlay=doc.body.createDiv({cls:'uct-composition',attr:{role:'dialog','aria-label':'컴포지션 모드'}});
   const background=overlay.createDiv({cls:'uct-composition-background'});const paper=overlay.createDiv({cls:'uct-composition-paper'});
   const count=paper.createDiv({cls:'uct-composition-count'});paper.prepend(host);host.addClass('uct-composition-host');
   const template=this.settings.templates.find(t=>t.id===this.settings.selected)!;
   background.style.backgroundImage=`url("${this.asset(template)}")`;background.style.backgroundSize=template.fit;
   paper.style.setProperty('--uct-writing-font',JSON.stringify(template.font));paper.style.setProperty('--uct-writing-size',template.fontSize+'px');paper.style.setProperty('--uct-writing-line',String(template.lineHeight));paper.style.setProperty('--uct-writing-color',template.color);
   const abort=new AbortController(),win=doc.defaultView!,img=new Image();
   let iw=1536,ih=1024;
   const place=()=>{const r=mapRegion(template.region,win.innerWidth,win.innerHeight,iw,ih,template.fit);Object.assign(paper.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});floating?.editor?.remeasure();view.editMode?.reinit?.();};
   img.onload=()=>{iw=img.naturalWidth;ih=img.naturalHeight;if(overlay.isConnected)place();};img.src=this.asset(template);
   const update=()=>{count.hidden=!this.settings.count;if(this.settings.count)count.setText('공백 제외 '+characterCount(view.editor.getValue()).toLocaleString()+'자');};
   const center=()=>{if(this.settings.scroll!=='typewriter')return;const cm=view.editor.cm;if(cm?.dispatch)cm.dispatch({effects:(require('@codemirror/view').EditorView).scrollIntoView(cm.state.selection.main.head,{y:'center'})});};
   const scroll=view.editor.getScrollInfo();const selections=view.editor.listSelections();
   let updateFrame=0;const scheduleUpdate=()=>{if(updateFrame||this.closing)return;updateFrame=win.requestAnimationFrame(()=>{updateFrame=0;if(abort.signal.aborted)return;update();center();});};abort.signal.addEventListener('abort',()=>win.cancelAnimationFrame(updateFrame),{once:true});
   const ref=app.workspace.on('editor-change',(_editor,info)=>{if(info===view)scheduleUpdate();});
   const observer=new ResizeObserver(place);observer.observe(overlay);
   this.session={overlay,host,placeholder,view,floating,created,previousLeaf,abort,observer,ref,previousState,scroll};
   const commands=(app as any).commands,original=commands.executeCommand;const isolated=(command:any,...args:any[])=>{if(command.id===this.root.manifest.id+':composition-open'||command.editorCallback||command.editorCheckCallback||command.id.startsWith('editor:'))return original.call(commands,command,...args);return false;};commands.executeCommand=isolated;this.restoreCommands=()=>{if(commands.executeCommand===isolated)commands.executeCommand=original;};
   for(const type of ['keydown','keyup'])host.addEventListener(type,e=>e.stopPropagation(),{signal:abort.signal});
   overlay.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();void this.close();}},{capture:true,signal:abort.signal});
   host.addEventListener('input',scheduleUpdate,{signal:abort.signal});place();update();view.editor.focus();view.editor.setSelections(selections);win.requestAnimationFrame(()=>{view.editor.scrollTo(scroll.left,scroll.top);if(this.settings.scroll==='typewriter')center();});
  } catch(error){console.error('UCT composition',error);new Notice('컴포지션 화면을 열지 못했습니다. 원래 편집기를 유지합니다.');if(this.session)await this.close();}
  finally{this.opening=false;}
 }
 async close(){
  const s=this.session;if(!s||this.closing)return;this.closing=true;
  try{if(s.floating)await s.floating.flush();else await s.view.save();}catch{new Notice('저장하지 못해 컴포지션을 유지합니다.');this.closing=false;return;}
  const scroll=s.view.editor.getScrollInfo(),selections=s.view.editor.listSelections();
  this.restoreCommands?.();this.restoreCommands=undefined;s.abort.abort();s.observer.disconnect();this.root.app.workspace.offref(s.ref);
  s.placeholder.replaceWith(s.host);s.host.removeClass('uct-composition-host');s.overlay.remove();this.session=undefined;
  s.floating?.editor?.remeasure();s.view.editMode?.reinit?.();
  if(s.created)await s.floating.close(true);
  else {if(s.previousLeaf?.containerEl.isConnected)this.root.app.workspace.setActiveLeaf(s.previousLeaf,{focus:true});s.view.editor.setSelections(selections);s.view.editor.scrollTo(scroll.left,scroll.top);s.view.editor.focus();if(s.previousState.mode==='preview'||s.previousState.source===true)await s.view.setState({...s.view.getState(),mode:s.previousState.mode,source:s.previousState.source},{history:false});}
  this.closing=false;
 }
 async renderSettings(host:HTMLElement){
  host.createEl('h3',{text:'컴포지션 모드'});host.createEl('p',{text:'Ctrl+Shift+Enter로 열거나 원래 화면으로 돌아옵니다. Esc로도 돌아갑니다. 설정은 이 화면에서만 변경합니다.'});
  const render=()=>{host.empty();void this.renderSettings(host);};
  const t=this.settings.templates.find(t=>t.id===this.settings.selected)!;
  const library=host.createDiv({cls:'uct-template-library'}),tools=library.createDiv({cls:'uct-template-tools'});
  const templateSearch=tools.createEl('input',{attr:{type:'search',placeholder:'템플릿 검색','aria-label':'템플릿 검색'}});templateSearch.value=this.templateQuery;
  const filters=tools.createDiv({cls:'uct-template-filters'});
  const gallery=library.createDiv({cls:'uct-template-gallery',attr:{role:'group','aria-label':'배경 템플릿'}});
  const drawTemplates=()=>{gallery.empty();const items=this.settings.templates.filter(item=>item.name.toLocaleLowerCase().includes(this.templateQuery.toLocaleLowerCase())&&(this.templateFilter==='all'||(this.templateFilter==='custom'?item.custom:!item.custom)));for(const item of items){const button=gallery.createEl('button',{cls:'uct-template-choice'+(item.id===t.id?' is-selected':''),attr:{'aria-label':item.name,'aria-pressed':String(item.id===t.id)}});button.createEl('img',{attr:{src:this.asset(item),alt:item.name,loading:'lazy'}});button.createSpan({text:item.name});if(item.id===t.id)button.createSpan({cls:'uct-template-check',text:'✓'});button.onclick=async()=>{this.settings.selected=item.id;await this.save();render();};}if(!items.length)gallery.createEl('p',{text:'일치하는 템플릿이 없습니다.',attr:{role:'status'}});};
  for(const [key,label] of [['all','전체'],['default','기본'],['custom','사용자']]){const button=filters.createEl('button',{text:label,cls:this.templateFilter===key?'is-active':'',attr:{'aria-pressed':String(this.templateFilter===key)}});button.onclick=()=>{this.templateFilter=key;for(const b of Array.from(filters.querySelectorAll('button'))){b.toggleClass('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));}drawTemplates();};}
  const addTemplate=tools.createEl('button',{text:'＋ 배경 추가'});addTemplate.onclick=()=>host.querySelector<HTMLButtonElement>('.uct-add-background button')?.click();
  templateSearch.oninput=()=>{this.templateQuery=templateSearch.value;drawTemplates();};drawTemplates();
  const preview=host.createDiv({cls:'uct-template-selected'});preview.createEl('img',{attr:{src:this.asset(t),alt:t.name+' 선택 미리보기'}});const previewText=preview.createDiv();previewText.createEl('h3',{text:t.name});const fontPreview=previewText.createDiv({cls:'uct-template-font-preview',text:'오늘의 문장을 씁니다. 가나다 Aa 123'});const updateFontPreview=()=>{Object.assign(fontPreview.style,{fontFamily:JSON.stringify(t.font),fontSize:t.fontSize+'px',lineHeight:String(t.lineHeight),color:t.color});fontPreview.style.background=t.asset==='amber'?'#281907':'var(--background-secondary)';};updateFontPreview();previewText.createEl('p',{text:'아래 설정은 선택한 템플릿에 자동 저장됩니다.'});
  new Setting(host).setName('배경 맞춤').addDropdown(d=>d.addOptions({contain:'전체 이미지 표시',cover:'창 전체 채우기'}).setValue(t.fit).onChange(async v=>{t.fit=v as any;await this.save();}));
  new Setting(host).setName('스크롤').addDropdown(d=>d.addOptions({normal:'일반 스크롤',typewriter:'타자기 스크롤'}).setValue(this.settings.scroll).onChange(async v=>{this.settings.scroll=v as any;await this.save();}));
  new Setting(host).setName('공백 제외 글자 수 표시').addToggle(c=>c.setValue(this.settings.count).onChange(async v=>{this.settings.count=v;await this.save();}));
  host.createEl('h4',{text:'Obsidian 기본 편집기 표시'});
  for(const [key,name] of [['readableLineLength','읽기 쉬운 행 길이'],['showLineNumber','줄 번호'],['showInlineTitle','인라인 제목']])new Setting(host).setName(name).setDesc('Obsidian 기본 설정과 연결됩니다. 일반 Markdown 편집기에도 함께 적용됩니다.').addToggle(t=>t.setValue(Boolean((this.root.app.vault as any).getConfig(key))).onChange(value=>{(this.root.app.vault as any).setConfig(key,value);this.session?.view.updateOptions();}));
  const fontSetting=new Setting(host).setName('Windows 설치 글꼴').setDesc('선택한 템플릿에만 저장됩니다.');
  const picker=fontSetting.controlEl.createDiv({cls:'uct-font-picker'});const trigger=picker.createEl('button',{text:t.font,attr:{'aria-label':'설치 글꼴 선택','aria-expanded':'false'}});const pop=picker.createDiv({cls:'uct-font-popover'});pop.hidden=true;const search=pop.createEl('input',{attr:{type:'search',placeholder:'글꼴 검색','aria-label':'글꼴 검색'}});const list=pop.createDiv({cls:'uct-font-options',attr:{role:'listbox','aria-label':'Windows 설치 글꼴'}});let fonts=[t.font];
  const drawFonts=()=>{list.empty();for(const font of fonts.filter(f=>f.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))){const option=list.createEl('button',{cls:'uct-font-option'+(font===t.font?' is-selected':''),attr:{role:'option','aria-selected':String(font===t.font)}});option.createSpan({text:font});const sample=option.createSpan({text:'오늘의 문장을 씁니다',cls:'uct-font-sample'});sample.style.fontFamily=JSON.stringify(font);option.onclick=async()=>{t.font=font;updateFontPreview();trigger.setText(font);trigger.style.fontFamily=JSON.stringify(font);pop.hidden=true;trigger.setAttribute('aria-expanded','false');await this.save();};}};
  trigger.onclick=()=>{pop.hidden=!pop.hidden;trigger.setAttribute('aria-expanded',String(!pop.hidden));if(!pop.hidden){drawFonts();search.focus();}};search.oninput=drawFonts;picker.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();pop.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}};picker.addEventListener('focusout',()=>{setTimeout(()=>{if(!picker.contains(picker.ownerDocument.activeElement)){pop.hidden=true;trigger.setAttribute('aria-expanded','false');}},0);});void installedFonts().then(items=>{if(host.isConnected){fonts=[...new Set([t.font,...items])];if(!pop.hidden)drawFonts();}});
  new Setting(host).setName('글자 크기').addSlider(s=>s.setLimits(12,48,1).setValue(t.fontSize).setDynamicTooltip().onChange(async v=>{t.fontSize=v;updateFontPreview();await this.save();}));
  new Setting(host).setName('줄 간격').addSlider(s=>s.setLimits(1,3,.1).setValue(t.lineHeight).setDynamicTooltip().onChange(async v=>{t.lineHeight=v;updateFontPreview();await this.save();}));
  new Setting(host).setName('글자색').addColorPicker(c=>c.setValue(t.color).onChange(async v=>{t.color=v;updateFontPreview();await this.save();}));
  host.createEl('p',{text:'입력 영역: 사각형을 끌어 이동하고 테두리·모서리에서 크기를 조절하세요. 변경은 자동 저장됩니다.'});
  const stage=host.createDiv({cls:'uct-template-stage'});const img=stage.createEl('img',{attr:{src:this.asset(t),alt:t.name,draggable:'false'}});const region=stage.createDiv({cls:'uct-template-region',text:'글쓰기 영역'});
  const draw=()=>Object.assign(region.style,{left:t.region.x*100+'%',top:t.region.y*100+'%',width:t.region.width*100+'%',height:t.region.height*100+'%'});draw();
  for(const edge of ['n','s','e','w','ne','nw','se','sw'])region.createDiv({cls:'uct-resize-edge uct-resize-'+edge,attr:{'data-edge':edge}});
  region.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();region.setPointerCapture(e.pointerId);const edge=(e.target as HTMLElement).dataset.edge??'',r={...t.region},rect=stage.getBoundingClientRect(),x=e.clientX,y=e.clientY;
   const move=(ev:PointerEvent)=>{const dx=(ev.clientX-x)/rect.width,dy=(ev.clientY-y)/rect.height;let l=r.x,top=r.y,right=r.x+r.width,bottom=r.y+r.height;if(!edge){l=Math.max(0,Math.min(1-r.width,r.x+dx));top=Math.max(0,Math.min(1-r.height,r.y+dy));right=l+r.width;bottom=top+r.height;}else{if(edge.includes('w'))l=Math.max(0,Math.min(right-.1,r.x+dx));if(edge.includes('e'))right=Math.min(1,Math.max(l+.1,r.x+r.width+dx));if(edge.includes('n'))top=Math.max(0,Math.min(bottom-.1,r.y+dy));if(edge.includes('s'))bottom=Math.min(1,Math.max(top+.1,r.y+r.height+dy));}t.region={x:l,y:top,width:right-l,height:bottom-top};draw();};
   const end=()=>{region.removeEventListener('pointermove',move);region.removeEventListener('pointerup',end);region.removeEventListener('pointercancel',end);void this.save();};region.addEventListener('pointermove',move);region.addEventListener('pointerup',end);region.addEventListener('pointercancel',end);
  };
  new Setting(host).setClass('uct-add-background').setName('사용자 배경 추가').setDesc('사진을 Vault의 UCT 전용 폴더로 복사합니다. 원본 사진은 유지합니다.').addButton(b=>b.setButtonText('이미지 선택').onClick(()=>{const input=host.createEl('input',{attr:{type:'file',accept:'image/png,image/jpeg,image/webp'}});input.hidden=true;input.onchange=async()=>{try{const f=input.files?.[0];if(!f)return;const dir='.uct/composition-backgrounds';await this.root.app.vault.adapter.mkdir(dir).catch(()=>{});const id=crypto.randomUUID(),ext=f.name.split('.').pop()?.toLowerCase()??'png',asset=dir+'/'+id+'.'+ext;await this.root.app.vault.adapter.writeBinary(asset,await f.arrayBuffer());this.settings.templates.push({...structuredClone(defaultTemplates[0]),id,name:f.name,asset,custom:true,region:{x:.15,y:.15,width:.7,height:.7}});this.settings.selected=id;await this.save();render();}catch{new Notice('배경 이미지를 추가하지 못했습니다.');}finally{input.remove();}};input.click();}));
  if(t.custom)new Setting(host).setName('이 사용자 템플릿 삭제').setDesc('UCT 이미지 사본과 이 템플릿 설정만 삭제합니다. 원본 사진·문서는 유지합니다.').addButton(b=>b.setWarning().setButtonText('템플릿 삭제').onClick(async()=>{if(t.asset.startsWith('.uct/composition-backgrounds/')&&!t.asset.includes('..'))await this.root.app.vault.adapter.remove(t.asset);this.settings.templates=this.settings.templates.filter(x=>x.id!==t.id);this.settings.selected='cream';await this.save();render();}));
 }
}

