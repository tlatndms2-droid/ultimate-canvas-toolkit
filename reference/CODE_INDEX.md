# 코드 위치 색인

2026-10-26 고정 커밋 기준. 자동 추출된 위치 색인으로, 모든 항목이 의미 분석 또는 실행 검증되었다는 뜻은 아니다. 플러그인별 해설은 ../docs/uct/plugins/ 참조.

## obsidian-advanced-mindmap

기준: f8a707bfc3dbe0f8e5d4f23b16198bc3efa827ef

### src/arrange.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/arrange.ts)

```text
4: export function arrangeSelection(input:CanvasData,selected:string[],gap:number,depth=1,range=3):CanvasData{
14: if(seen.has(nextKey)){const entries=[...seen.entries()],start=entries.findIndex(([k])=>k===nextKey);return entries.slice(start).sort(([a],[b])=>a.localeCompare(b))[0][1];}
25: for(const edge of input.edges)for(const id of new Set([edge.fromNode,edge.toNode])){if(!incident.has(id))incident.set(id,[]);incident.get(id)!.push(edge);}
26: for(const edge of input.edges){if(!valid.has(edge.fromNode)||!valid.has(edge.toNode)||edge.fromNode===edge.toNode)continue;for(const [a,b] of [[edge.fromNode,edge.toNode],[edge.toNode,edge.fromNode]]){if(!adjacency.has(a
30: for(const root of roots){if(visited.has(root))continue;visited.add(root);const parents=[root];
32: for(const next of adjacency.get(parent)||[]){if(!distance.has(next)||visited.has(next))continue;visited.add(next);children.add(next);parents.push(next);}
45: export function arrangeConnected(input:CanvasData,id:string,gap:number,allowed?:ReadonlySet<string>,range=3):CanvasData{
56: for(const e of input.edges){const other=e.fromNode===id?e.toNode:e.toNode===id?e.fromNode:null,side=e.fromNode===id?e.fromSide:e.toSide;if(other&&['left','right','top','bottom'].includes(String(side))){const set=faces.ge
60: for(const n of neighbours){
76: for(const n of moving)for(const o of obstacles){
81: for(const interval of intervals){const last=merged[merged.length-1];if(last&&interval[0]<last[1])last[1]=Math.max(last[1],interval[1]);else merged.push([...interval]);}
83: if(blocked){const delta=-blocked[0]<=blocked[1]?blocked[0]:blocked[1];for(const n of moving){if(horizontal)n.y+=delta;else n.x+=delta;}}
93: while(pending.size){
98: if(cards.length===1){const n=cards[0];if(distance(anchor,n)<=threshold){if(horizontal)n.y=anchor.y+(anchor.height-n.height)/2;else n.x=anchor.x+(anchor.width-n.width)/2;}resolve(cards,horizontal);continue;}
```

### src/card-media.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/card-media.ts)

```text
5: export function youtubeUrl(value:unknown){
11: if(u.hostname==='releases.obsidian.md'&&u.pathname==='/youtube'){
15: if(src.searchParams.get('enablejsapi')!=='1'){src.searchParams.set('enablejsapi','1');src.searchParams.set('autoplay','1');frame.src=src.href;}
24: export class CardMedia{
27: constructor(private app:App,private current:()=>any){}
28: supports(node:any){const d=node.getData();if(d.type==='link')return youtubeUrl(d.url);if(d.type!=='file')return false;const ext=String(d.file).split('.').pop()!.toLowerCase();return ['image','video','audio'].some(k=>medi
29: activate(canvas:any,node:any){
32: if(d.type==='file'&&!file){new Notice('미디어 파일을 찾을 수 없습니다.');return;}
33: if(file&&mediaExtensions.image.has(file.extension.toLowerCase())){
39: if(d.type==='link'){
41: if(!webview||!youtubeUrl(webview.getAttribute('src'))){new Notice('영상이 아직 준비되지 않았습니다. 잠시 후 Enter를 눌러 주세요.');return;}
46: if(!player){new Notice('미디어를 불러오는 중입니다. 잠시 후 Enter를 눌러 주세요.');return;}
50: dispose(){this.preview?.close();this.preview=null;}
```

### src/creation-transaction.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/creation-transaction.ts)

```text
3: export function applyCreation(canvas:any,before:CanvasData,after:CanvasData){
9: for(const edge of before.edges){const live=actual.edges.find(e=>e.id===edge.id);if(!live||Object.keys(edge).some(k=>edge[k]!==live[k]))throw Error('Existing connection changed during creation');}
```

### src/editor-camera.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/editor-camera.ts)

```text
7: export class EditorCamera {
10: constructor(private host:Host){host.register(()=>this.stop());}
11: stop(){if(this.active)cancelAnimationFrame(this.active.frame);this.active=null;}
12: pause(){if(this.active)this.active.paused=true;}
13: resume(){if(this.active)this.active.paused=false;}
14: observe(c:any){
15: for(const n of c.nodes.values()){
28: exit(c:any,n:any){
30: if(a&&a.c===c&&a.n===n){const zoom=a.zoom;this.stop();c.zoomCenter=null;c.tZoom=zoom;c.markViewportChanged();}
37: if(!n.isEditing||!n.nodeEl.isConnected){this.stop();return;}
39: if(cm?.dom?.isConnected&&++a.retry>2){
41: if(!a.ready||head!==a.head||doc!==a.doc){
43: if(pos){
46: if(initial){
52: if(this.host.settings.followCaret&&!a.paused&&(initial||line!==a.line)){
```

### src/file-insert-data.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/file-insert-data.ts)

```text
2: export function canInsertFile(card:Card|undefined):boolean{return !!card&&(card.type==='file'||card.type==='text'&&!String(card.text??'').trim());}
3: export function insertFile(data:CanvasData,id:string,path:string,videoDefaultWidth?:number):CanvasData{
7: if(videoDefaultWidth!==undefined){const bounds=videoInsertBounds(result.nodes[index],videoDefaultWidth);Object.assign(result.nodes[index],bounds);}
14: export function videoInsertBounds(card:Card,defaultWidth:number):{width:number;height:number}{
```

### src/file-insert.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/file-insert.ts)

```text
7: export class FileInsertMenu{
9: constructor(private app:App,private commit:(c:any,id:string,file:TFile)=>void,private current:()=>any,register:(fn:()=>void)=>void){register(()=>this.close());const outside=(e:PointerEvent)=>{if(this.menu&&!this.menu.con
11: close(){this.closeMenu();this.picker?.close();this.picker=null;}
12: toggle(c:any,n:any){if(this.menu){this.close();return;}this.close();this.canvas=c;this.anchor=n.id;this.index=0;this.menu=document.body.createDiv({cls:'canvas-mindmap-menu cm-file-menu',attr:{role:'menu','aria-label':'파일
13: observe(){if(!this.menu&&!this.picker)return;const n=this.canvas?.nodes.get(this.anchor);if(this.current()!==this.canvas||!n||n.isEditing||this.canvas.readonly||!canInsertFile(n.getData())){this.close();return;}if(this.m
14: key(e:KeyboardEvent){if(!this.menu)return false;if(e.isComposing)return false;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape')this.close();else if(e.key==='ArrowUp'||e.key==='ArrowDown'){this.index=(t
20: constructor(app:App,private kind:'md'|'canvas',private currentPath:string,private chosen:(file:TFile)=>void,private closed:()=>void){super(app);this.setPlaceholder(kind==='md'?'넣을 문서 검색…':'넣을 캔버스 검색…');this.emptyStateTex
21: getItems(){return this.app.vault.getFiles().filter(f=>f.path!==this.currentPath&&f.extension===this.kind).sort((a,b)=>a.path.localeCompare(b.path));}
22: getItemText(file:TFile){return file.path;}
23: onChooseItem(file:TFile){this.chosen(file);}
24: onClose(){super.onClose();this.closed();}
29: constructor(app:App,private kind:MediaKind,private chosen:(file:TFile)=>void,private closed:()=>void){super(app);for(const key of ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter'])this.scope.register([],key,e=>{if
30: onOpen(){this.setTitle(mediaTitles[this.kind]+' 선택');this.modalEl.addClass('cm-file-picker');this.enableResize();this.search=this.contentEl.createEl('input',{cls:'cm-file-search',attr:{type:'search',placeholder:'파일명 또는 폴
40: if(!this.matches.length){this.list.createDiv({text:'표시할 파일이 없습니다.'});return;}
57: if(key==='ArrowLeft'||key==='ArrowRight'){this.index=Math.max(0,Math.min(rows.length-1,this.index+(key==='ArrowRight'?1:-1)));return;}
62: for(const direction of ['n','s','e','w','ne','nw','se','sw']){
82: onClose(){this.resizeCleanup?.();this.preview?.close();this.preview=null;this.stopThumbnails();this.contentEl.empty();this.closed();}
84: export class MediaPreview extends Modal{
88: constructor(app:App,private kind:MediaKind,private file:TFile,private closed:()=>void,private autoPlay=false){super(app);this.scope.register(['Ctrl'],'Enter',e=>{if(e.isComposing)return;e.preventDefault();e.stopPropagati
89: onOpen(){
91: if(this.kind==='image'){const img=host.createEl('img',{attr:{src,alt:this.file.name}});img.onerror=()=>{host.setText('이미지를 불러올 수 없습니다.');};}
103: if(key===' '){if(e.repeat)return true;if(player.paused||player.ended){if(player.ended)player.currentTime=0;void player.play().catch(()=>{});}else player.pause();}
109: onClose(){if(this.focusFrame!==null){cancelAnimationFrame(this.focusFrame);this.focusFrame=null;}this.modalEl.removeEventListener('keydown',this.playbackListener,true);this.pdf?.dispose();if(this.player){this.player.paus
```

### src/image-date-groups.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/image-date-groups.ts)

```text
3: export function creationGroup(timestamp:number,now=new Date()):number{
```

### src/layout.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/layout.ts)

```text
1: export interface Card { id: string; type: string; x: number; y: number; width: number; height: number; text?: string; [key: string]: unknown }
2: export interface Edge { id: string; fromNode: string; toNode: string; fromSide?: string; toSide?: string; [key: string]: unknown }
3: export interface CanvasData { nodes: Card[]; edges: Edge[]; [key: string]: unknown }
4: export type Direction = 'left' | 'right' | 'up' | 'down';
5: export interface Creation { anchor: string; id: string; direction: Direction; tab: boolean; width: number; height: number; gap: number; connected: boolean; source?: string }
6: export function sources(data: CanvasData, id: string): Card[] {
12: export function createLayout(input: CanvasData, op: Creation): CanvasData {
28: if(op.connected&&source&&parent){
30: if(op.tab){
```

### src/main.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/main.ts)

```text
50: async onload() {
57: this.addCommand({id:'insert-file-card',name:'카드에 파일 넣기 / 교체',hotkeys:[{modifiers:['Alt'],key:'i'}],checkCallback:checking=>{const c=this.current(),n=c&&this.selected(c);if(!n||c.readonly||!canInsertFile(n.getData())||[..
58: for(const [id,name,key,kind] of [['waypoint-manager','Waypoint 관리창 열기/닫기','w','manager'],['color-palette','색상 팔레트 열기/닫기','c','palette']] as const)this.addCommand({id,name,hotkeys:[{modifiers:kind==='palette'?['Ctrl','Shi
59: for(let i=1;i<=6;i++)this.addCommand({id:`apply-color-${i}`,name:`기본 색상 ${i} 적용`,checkCallback:checking=>{const c=this.current();if(!c||c.readonly||!c.selection.size||[...c.nodes.values()].some((n:any)=>n.isEditing))retu
60: this.addCommand({id:'disconnect-selected-cards',name:'선택한 카드의 연결 모두 해제',hotkeys:[{modifiers:['Ctrl','Shift'],key:'d'}],checkCallback:checking=>{
66: this.addCommand({id:'connect-direction',name:'방향키로 가까운 카드 연결 (누른 채 사용)',hotkeys:[{modifiers:['Ctrl','Shift'],key:'a'}],checkCallback:checking=>{
69: if(!checking&&this.shouldRunConnectionCommand()){this.reset();this.sizes.finish();this.connectHeld=c;this.showConnectHint();}return true;
71: this.addCommand({id:'reverse-connection',name:'선택 카드의 연결 방향 전환',hotkeys:[{modifiers:['Ctrl','Shift'],key:'s'}],checkCallback:checking=>{const c=this.current();if(!c||c.readonly||!this.selected(c)||[...c.nodes.values()].s
72: this.addCommand({id:'arrange-connected',name:'연결된 카드 정렬 (시험)',hotkeys:[{modifiers:['Ctrl','Shift'],key:'l'}],checkCallback:checking=>{const c=this.current();if(!c||c.readonly||![...c.selection].some((n:any)=>c.nodes.has(
76: this.addCommand({id:'toggle-auto-resize',name:'선택한 카드 내용에 맞추기',hotkeys:[{modifiers:['Alt'],key:'r'}],checkCallback:checking=>{const c=this.current();if(!this.canUseCardCommand(c,true)||![...c.selection].some((n:any)=>n.g
77: this.addCommand({id:'card-context-menu',name:'선택한 카드 우클릭 메뉴',hotkeys:[{modifiers:['Alt'],key:'m'}],checkCallback:checking=>{const c=this.current();if(!this.canUseCardCommand(c,true)||!c.selection.size)return false;if(!ch
84: this.registerInterval(window.setInterval(()=>{
102: if(e.key==='Escape'){panel.remove();this.toolbarSession=null;this.updateCardKeys(c);return true;}
105: if(e.key==='Enter'){if(!e.repeat){const item=items[index],input=item.querySelector<HTMLInputElement>('input');if(input)input.click();else item.click();}return true;}
112: if(this.contextEditor){this.toolbarSession=null;const pos=cm.coordsAtPos(cm.state.selection.main.head),doc=cm.contentDOM.ownerDocument;cm.contentDOM.dispatchEvent(new doc.defaultView.MouseEvent('contextmenu',{bubbles:tru
114: if(c.selection.size>1){const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window,button:2,clientX:r.left,clientY:r.top});let captured:Menu|undefined;const ref=(this.app.workspace as any).on('canv
140: if(this.current()!==c||c.readonly||c.nodes.get(id)?.isEditing||!this.app.vault.getFileByPath(path)){new Notice('파일 또는 대상 카드를 찾을 수 없습니다.');return;}
151: catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('연결을 해제하지 못했습니다. 기존 연결을 복원했습니다.');console.error('Canv
165: if(!this.connectHint){this.connectHint=document.body.createDiv({cls:'canvas-mindmap-menu canvas-mindmap-connect-hint'});this.connectHint.setAttribute('role','status');this.connectHint.createDiv({cls:'canvas-mindmap-optio
171: if(!c||this.current()!==c||!n||n.isEditing){this.clearConnectHint();return;}
188: catch(error){c.importData(before,true);c.data=before;c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();c.requestSave(false);new Notice('카드를 연결하지 못했습니다. 기존 상태를 복원했습니다.');console.error('Canv
191: syncColorCommands(){for(const id of this.colorCommands)this.removeCommand(id);this.colorCommands.clear();for(const color of this.settings.customColors){const id='apply-custom-'+color.slice(1);this.colorCommands.add(id);t
192: async restoreSettings(values:any){await this.saveChain;const next={...this.settings,...settingsOnly(values)};await this.saveData(next);this.settings=next;this.reset();this.panels.close(false);}
193: persist(){this.saveChain=this.saveChain.then(()=>this.saveData(this.settings)).catch(()=>{new Notice('Canvas Mindmap 설정을 저장하지 못했습니다.');});return this.saveChain;}
211: if(!this.isDrawing(c)){this.drawingSuspended=false;return false;}
212: if(!this.drawingSuspended){
240: for(const item of data?.nodes||[]){const node=this.nodes.get(item.id),type=node?.getData().type;
250: for(const binding of c.view.scope?.keys||[]){
274: if(e.key!=='Alt'){if(this.altTap)this.altTap.clean=false;this.clearAltRepeat();}
276: if(this.contextEditor&&['Escape','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
290: if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey&&(e.code==='KeyR'||e.code==='KeyM')&&this.canUseCardCommand(c,true)){
297: if(!editing&&!input&&n&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&(e.code==='KeyA'||e.code==='KeyS')){
299: if(e.code==='KeyA'){this.reset();this.sizes.finish();this.connectHeld=c;this.showConnectHint();}
303: if(!editing&&!input&&!this.menu&&!this.linkMenu&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&(e.code==='KeyX'||e.key.toLowerCase()==='x')){
308: if(e.code==='KeyL'&&!editing&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&c.selection.size){this.stop(e);if(this.shouldRunConnectionCommand(e))this.arrange(c);return;}
311: if(!editing&&n&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&(e.key==='Control'||e.key==='Shift')){if(!e.repeat){this.reset();this.linkTimer=window.setTimeout(()=>{this.linkTimer=null;if(this.current()===c&&this.selecte
312: if(e.key!=='Control'&&e.key!=='Shift'&&this.linkTimer!==null){window.clearTimeout(this.linkTimer);this.linkTimer=null;}
314: if(!editing&&!e.ctrlKey&&!e.metaKey&&e.shiftKey&&e.key.startsWith('Arrow')&&(!e.altKey||e.key==='ArrowUp'||e.key==='ArrowDown')){this.stop(e);this.reset();this.navigation.cameraKey(c,e.altKey?(e.key==='ArrowUp'?'ZoomIn':
315: if(!editing&&e.ctrlKey&&e.shiftKey&&e.altKey&&!e.metaKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();if(e.repeat)return;const cards=[...c.selection].filter((v:any)=>c.nodes.has(v.id)&&v.getData().type!=='group'
316: if(!editing&&e.key==='Alt'&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey){this.stop(e);if(!e.repeat)this.altTap={clean:true,c};return;}
319: if(number&&!e.altKey&&!editing&&!target?.closest?.('input,textarea,[contenteditable="true"],.modal-container')){
321: if(e.ctrlKey){if(e.shiftKey)this.navigation.register(c,number);else if(n)this.navigation.register(c,number,n);}else this.navigation.call(c,number);return;
324: if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&e.code==='Space'){
326: if(n.isEditing){n.child?.showPreview?.(true);n.setIsEditing(false);c.wrapperEl.focus();this.navigation.cancel();this.editorCamera.exit(c,n);}
329: if(e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();this.sizes.resize(c,n,e.key);return;}
331: if(this.menu){this.stop(e);if(e.key==='ArrowUp'||e.key==='ArrowDown'){const m=this.menu;m.index=(m.index+(e.key==='ArrowDown'?1:-1)+m.values.length)%m.values.length;this.paintMenu();}return;}
332: if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();if(!e.repeat)this.navigation.navigate(c,n,e.key.slice(5).toLowerCase() as Direction);return;}
333: if(e.ctrlKey&&e.shiftKey&&!e.altKey&&e.key.startsWith('Arrow')){this.stop(e);this.reset();this.sizes.resize(c,n,e.key);return;}
334: if(e.ctrlKey&&e.altKey&&!e.shiftKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){this.stop(e);this.reset();if(!e.repeat)this.sizes.swap(c,n,e.key==='ArrowDown');return;}
336: if(e.key==='Control'&&!e.altKey&&!e.shiftKey){if(!e.repeat)this.begin('Control',c,n.id);return;}
337: if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&e.key.startsWith('Arrow')){
341: if(e.key==='Tab'&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){this.stop(e);if(!e.repeat)this.begin('Tab',c,n.id);return;}
342: if(this.hold?.key==='Control'){this.clearTimer();this.hold.consumed=true;}
351: if(e.key==='Control'||e.key==='Shift'){if(this.linkTimer!==null)window.clearTimeout(this.linkTimer);this.linkTimer=null;if(this.linkMenu&&!this.linkMenu.ids.length)this.clearLinkMenu();}
352: if(e.key==='Alt'&&this.altTap){const a=this.altTap;this.altTap=null;if(a.clean&&this.current()===a.c&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey&&this.canUseCardCommand(a.c)){this.stop(e);this.reset();this.multiAnchor=null;
354: if(prior&&prior.c===c&&JSON.stringify(prior.after)===JSON.stringify(ids)){
356: if(targets.length){this.navigation.cancel();c.deselectAll();for(const node of targets)c.select(node);c.zoomToSelection();}
364: if(this.menu){const m=this.menu,choice=m.values[m.index];if(m.kind==='mode')this.settings.mode=choice as Settings['mode'];else this.settings.origins[m.canvas.view.file.path]=choice;void this.persist();}
383: if(this.settings.width===null||this.settings.height===null){this.settings.width??=defaults.width;this.settings.height??=defaults.height;void this.persist();}
389: catch(error){c.setData(before);c.history.data=history.data;c.history.current=history.current;c.updateHistoryUI();if(selection[0]&&c.nodes.has(selection[0]))c.selectOnly(c.nodes.get(selection[0]));c.requestSave();throw er
394: constructor(private plugin:CanvasMindmap){super(plugin.app,plugin);}
399: if(key==='width'||key==='height'){const c=(this.app.workspace.getActiveViewOfType(Object as any) as any)?.canvas;value=c?.config?.defaultTextNodeDimensions?.[key]??null;}
406: for(const {el,top,left} of positions){el.scrollTop=top;el.scrollLeft=left;}
417: display(){this.containerEl.empty();this.containerEl.createEl('h2',{text:'Canvas Mindmap'});this.containerEl.createEl('h3',{text:'카드 생성'});
419: for(const [key,label] of [['width','새 카드 기본 너비'],['height','새 카드 기본 높이'],['gap','카드 사이 간격'],['resizeStep','크기 조절 단위'],['swapTolerance','위치 교환 시 가로 정렬 허용 오차']] as const){
```

### src/media-previews.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/media-previews.ts)

```text
2: export type MediaKind='image'|'pdf'|'video'|'audio';
11: export class PdfPreviews{
13: constructor(private app:App){}
14: render(file:TFile,host:HTMLElement,width:number){
28: if(!this.disposed&&host.isConnected){host.empty();host.appendChild(canvas);}
34: dispose(){this.disposed=true;this.queue=[];for(const task of this.tasks)void Promise.resolve(task.destroy()).catch(()=>{});this.tasks.clear();}
```

### src/navigation.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/navigation.ts)

```text
5: export function nearestCard(data:CanvasData,id:string,direction:Direction):Card|null {
17: export type Waypoint={kind:'card';node:string;name:string}|{kind:'camera';x:number;y:number;zoom:number;name:string};
20: export class NavigationController {
24: constructor(private host:Host){host.register(()=>{this.cancel();for(const overlay of this.overlays.values())overlay.remove();this.overlays.clear();});}
25: cancel(){if(this.motion){cancelAnimationFrame(this.motion.frame);this.motion=null;}}
29: for(const [number,entry] of Object.entries(raw) as [string,any][]){
35: observe(c:any){
45: if(namespace?.waypoints){const entries=controller.registry(data);for(const [number,entry] of Object.entries(entries))if(entry.kind==='card'&&!data.nodes.some(n=>n.id===entry.node))delete entries[number];return {...data,c
50: focus(c:any,n:any){this.move(c,n.x+n.width/2,n.y+n.height/2,c.zoom);}
51: selectNearest(c:any){
54: if(cards[0]){c.selectOnly(cards[0]);this.focus(c,cards[0]);}
56: cameraKey(c:any,code:string){
62: navigate(c:any,n:any,direction:Direction){const target=nearestCard(c.getData(),n.id,direction);if(!target)return;const node=c.nodes.get(target.id);c.selectOnly(node);this.move(c,target.x+target.width/2,target.y+target.he
63: move(c:any,x:number,y:number,zoom:number){
66: if(!duration){c.setViewport(x,y,zoom);return;}
71: call(c:any,number:string){const entry=this.registry(c.getData())[number];if(!entry)return;
72: if(entry.kind==='card'){const node=c.nodes.get(entry.node);if(!node)return;c.selectOnly(node);this.move(c,node.x+node.width/2,node.y+node.height/2,c.zoom);}
75: register(c:any,number:string,node?:any){
77: if(node){const card=node.getData();if(card.type==='group')return;
83: rename(c:any,number:string,name:string){const data=c.getData(),entries=this.registry(data);if(!entries[number])return;entries[number]={...entries[number],name};this.commit(c,data,entries);}
84: remove(c:any,number:string){const data=c.getData(),entries=this.registry(data);if(!entries[number])return;delete entries[number];this.commit(c,data,entries);}
93: for(const badge of [...overlay.children] as HTMLElement[]){const n=c.nodes.get(badge.dataset.node);if(!n)continue;const pos=c.domFromPos({x:n.x,y:n.y});badge.style.left=String(w/2+pos.x)+'px';badge.style.top=String(h/2+p
95: badges(active:any){
96: for(const [c,overlay] of this.overlays){if(c!==active||!c.wrapperEl.isConnected){overlay.remove();this.overlays.delete(c);}}
100: for(const [number,entry] of Object.entries(entries))if(entry.kind==='card'){const numbers=groups.get(entry.node)||[];numbers.push(number);groups.set(entry.node,numbers);}
103: for(const [id,numbers] of groups){const n=active.nodes.get(id);if(!n)continue;let badge=[...overlay.children].find(el=>(el as HTMLElement).dataset.node===id) as HTMLElement|undefined;
104: if(!badge){badge=overlay.createDiv({cls:'canvas-mindmap-badge'});badge.dataset.node=id;}
```

### src/panels.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/panels.ts)

```text
4: export class CanvasPanels {
10: observe(c:any){if(this.panel&&(this.canvas!==c||this.canvas.view.file?.path!==this.file))this.close(false);else if(this.kind==='manager'&&!this.editing){const key=JSON.stringify(this.nav.registry(c.getData()));if(key!==t
13: constructor(private host:Host,private nav:NavigationController){
19: outside(target:EventTarget|null){if(this.panel&&!this.panel.contains(target as Node))this.close(false);}
20: capturesCanvasKeys(c:any){return this.canvas===c&&(this.kind==='palette'||this.kind==='picker'||(this.kind==='manager'&&!this.editing));}
21: key(e:KeyboardEvent){
24: if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(this.editing){this.editing=false;this.managerRows();}else this.close();return true;}
25: if(this.kind==='manager'&&!this.editing&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key)){
28: if(e.key==='Enter'){this.nav.call(this.canvas,rows[i].dataset.number!);return true;}
32: if((this.kind==='palette'||this.kind==='picker')&&['ArrowLeft' ,'ArrowRight','ArrowUp','ArrowDown','Enter','Tab'].includes(e.key)){
35: if(e.key==='Enter'){items[i]?.click();return true;}
36: if(e.key==='ArrowUp'||e.key==='ArrowDown'){const r=items[i].getBoundingClientRect(),down=e.key==='ArrowDown';const candidates=items.map((el,index)=>({el,index,r:el.getBoundingClientRect()})).filter(v=>down?v.r.top>r.top+
40: if((this.kind==='palette'||this.kind==='picker')&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();e.stopImmediatePropagation();return true;}
43: close(focus=true){const c=this.canvas,editor=this.editor;for(const cb of this.cleanup)cb();this.cleanup=[];this.panel?.remove();this.panel=null;this.canvas=null;this.kind='';this.editing=false;this.editor=null;this.picke
50: toggleManager(c:any){if(this.kind==='manager'&&this.canvas===c){this.close();return;}const size=this.host.settings.managerSize;this.managerNumber='';this.open(c,'manager','Waypoints',size?.width||320,size?.height||218);t
54: for(const number of Object.keys(entries).sort((a,b)=>Number(a)-Number(b))){const item=entries[number];const row=list.createDiv({cls:'cm-waypoint-row',attr:{'data-number':number}});row.createSpan({cls:'cm-number',text:num
64: togglePalette(c:any){if((this.kind==='palette'||this.kind==='picker')&&this.canvas===c){this.close();return;}const node=[...c.nodes.values()].find((n:any)=>n.isEditing) as any;const cm=node?.child?.editMode?.cm;this.pale
67: applyColor(c:any,color:string){const selected=new Set([...c.selection].filter((n:any)=>typeof n.setColor==='function').map((n:any)=>n.id));if(!selected.size){new Notice('색상을 적용할 카드를 먼저 선택하세요.');return;}const before=c.get
74: export function hsvHex(h:number,s:number,v:number){const f=(n:number)=>{const k=(n+h/60)%6;return Math.round(255*(v-v*s*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0');};return '#'+f(5)+f(3)+f(1);}
```

### src/runtime-cleanup.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/runtime-cleanup.ts)

```text
4: export function registerRuntimeCleanup(host:Host,target:object,cleanup:()=>void){
6: if(!owner){
12: if(!callbacks){callbacks=[];owner.callbacks.set(target,callbacks);const ref=new WeakRef(target);owner.refs.add(ref);owner.finalizer.register(target,ref);}
```

### src/selection-history.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/selection-history.ts)

```text
3: export class SelectionHistory {
6: constructor(readonly register:(cb:()=>void)=>void){}
7: capture(c:any){
11: observe(c:any){
19: if(ids){this.deselectAll();for(const id of ids){const item=this.nodes.get(id)||this.edges.get(id);if(item)this.select(item);}}
```

### src/settings-backup.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/settings-backup.ts)

```text
2: export function settingsOnly(source:any){return Object.fromEntries(settingKeys.map(k=>[k,structuredClone(k==='arrangeDepth'?(source[k]??1):k==='arrangeRange'?(source[k]??3):source[k])]))}
3: export function parseBackup(text:string){
7: if(s&&typeof s==='object'&&!Array.isArray(s)&&!Object.prototype.hasOwnProperty.call(s,'panStep')&&!Object.prototype.hasOwnProperty.call(s,'zoomStepPercent')){s.panStep=60;s.zoomStepPercent=(2**0.1-1)*100;}
9: if(s&&Object.prototype.hasOwnProperty.call(s,'autoResize')){if(typeof s.autoResize!=='boolean')throw Error('설정값이 올바르지 않습니다.');delete s.autoResize;}
12: for(const k of ['width','height','gap','resizeStep','swapTolerance','panDuration','editMinZoom','panStep','zoomStepPercent']){const v=s[k];if((k==='width'||k==='height')&&v===null)continue;if(typeof v!=='number'||!Number
18: export function makeBackup(settings:any){const text=JSON.stringify({format:'canvas-mindmap-settings',version:1,settings:settingsOnly(settings)},null,2);parseBackup(text);return text;}
```

### src/settings-transfer.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/settings-transfer.ts)

```text
4: export class SettingsTransfer{
6: constructor(private host:Host,private refresh:()=>void){}
8: async backup(){if(this.busy)return;this.busy=true;try{const text=makeBackup(this.host.settings),remote=require('electron').remote;const result=await remote.dialog.showSaveDialog((remote.BrowserWindow.getFocusedWindow()||
9: async restore(){if(this.busy)return;this.busy=true;try{const remote=require('electron').remote,result=await remote.dialog.showOpenDialog((remote.BrowserWindow.getFocusedWindow()||remote.getCurrentWindow()),{title:'Canvas
```

### src/size.ts

[보관 원문](snapshots/obsidian-advanced-mindmap/src/size.ts)

```text
5: export function swapCards(input:CanvasData,id:string,down:boolean,tolerance:number):CanvasData|null {
15: export interface SizeSettings { resizeStep:number; swapTolerance:number; width:number|null; height:number|null }
18: export class SizeController {
23: constructor(private host:Host){host.register(()=>{this.finish();this.disposed=true;});}
24: observe(c:any){
25: if(!this.canvases.has(c)){
32: keyup(key:string){if(this.hold&&(key===this.hold.key||key==='Control'||key==='Shift'))this.finish();}
33: finish(){const h=this.hold;if(!h)return;this.hold=null;h.c.requestPushHistory.cancel?.();const after=h.c.getData();if(JSON.stringify(after)!==JSON.stringify(h.before)){h.c.pushHistory(after);this.committed.set(h.c,JSON.s
34: swap(c:any,n:any,down:boolean){this.finish();const before=c.getData(),after=swapCards(before,n.id,down,this.host.settings.swapTolerance);if(after)this.apply(c,before,after);}
35: resize(c:any,n:any,key:string){
37: if(!this.hold){const before=c.getData();c.requestPushHistory.cancel?.();c.pushHistory(before);this.hold={c,id:n.id,key,before};}
43: if(n.isEditing){n.resize({width:card.width,height:card.height});}else c.importData(data,true);c.requestPushHistory.cancel?.();c.requestSave();
51: cancelPendingFit(){this.fitEpoch++;}
52: async fitSelection(c:any){
58: for(const n of nodes){const size=await this.autoFit(c,n);if(size)Object.assign(after.nodes.find(v=>v.id===n.id)!,size);}
60: if(snapshotKey(before)!==snapshotKey(after)){
62: for(const n of nodes){const size=after.nodes.find(v=>v.id===n.id)!;n.resize({width:size.width,height:size.height});}
70: if(!String(initialText||'').trim()){const defaults=c.config.defaultTextNodeDimensions,w=this.host.settings.width??defaults.width,h=this.host.settings.height??defaults.height;if(n.width!==w||n.height!==h){return {width:w,
86: for(const child of [...sizer.children]){const block=owner.createElement('div');block.className=`el-${child.tagName.toLowerCase()}`;child.replaceWith(block);block.appendChild(child);}
94: for(const element of [measure,container,content,embed,preview,sizer]){
```

## obsidian-canvas-outliner

기준: df744083bc39addaafd4ea55ae0fa77e9f626ed4

### src/adapter.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/adapter.ts)

```text
4: export class CanvasAdapter {
5: constructor(readonly app:App){}
11: activate(leaf:WorkspaceLeaf|null){if(leaf?.view.getViewType()==='canvas'){this.leaf=leaf;this.recentLeaves=[leaf,...this.recentLeaves.filter(l=>l!==leaf)];}}
12: reconcileLeaves(leaves:WorkspaceLeaf[]){this.recentLeaves=this.recentLeaves.filter(l=>leaves.includes(l));if(!this.leaf||!leaves.includes(this.leaf)){this.leaf=this.recentLeaves[0]??leaves[0]??null;if(this.leaf)this.acti
21: async open(path:string){const f=this.app.vault.getAbstractFileByPath(path);if(f instanceof TFile){const leaf=this.app.workspace.getLeaf(false);await leaf.openFile(f);this.activate(leaf);}}
22: select(id:string,padding=40){const c=this.canvas,n=this.node(id);if(!c||!n)return; c.selectOnly?.(n);this.fit(n.getData?.()??n,padding,0);}
27: async texts(doc:CanvasDocument){const map=new Map<string,string>();for(const n of doc.nodes){if(n.type==='text')map.set(n.id,n.text??'');else if(n.type==='file'&&n.file?.toLowerCase().endsWith('.md')){const f=this.app.va
```

### src/area-selection.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/area-selection.ts)

```text
4: export type Rect={x:number;y:number;width:number;height:number};
5: export function resizeArea(origin:Rect,direction:string,dx:number,dy:number):Rect {
13: export function numberedAreaName(names:string[],requested='Presentation Group') {
20: export function marqueeSelection(areas:Area[],box:Rect,initial:Set<string>,mode:'replace'|'add'|'subtract') {
28: export class AreaSelection {
36: constructor(readonly pt:Presentation){
38: p.registerDomEvent(document,'pointerdown',e=>this.down(e),true);
39: p.registerDomEvent(document,'pointerdown',e=>{
42: if(!e.shiftKey&&!e.altKey){this.ids=new Set();this.paint();}
44: p.registerDomEvent(window,'keydown',e=>{
45: if(!this.enabled&&e.key==='Escape'&&p.adapter.element()?.contains(e.target as Node)&&!pt.inputFocused(e)){this.ids=new Set();this.paint();}
47: for(const type of ['click','dblclick','contextmenu','paste','cut','beforeinput','drop'] as const)p.registerDomEvent(document,type,e=>{
48: if(this.enabled&&p.adapter.element()?.contains(e.target as Node)&&!this.control(e.target)){
52: p.registerDomEvent(window,'keydown',e=>{
55: if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(this.cleanup)this.cleanup(true);else{this.ids=new Set();this.paint();}return;}
59: if(remove||undo||arrow){e.preventDefault();e.stopImmediatePropagation();
60: if(undo){p.undo(e.shiftKey);this.sync();return;}
62: if(remove){p.change(s=>{s.areas=s.areas.filter(a=>!ids.has(a.id));s.steps=s.steps.filter(x=>x.kind!=='area'||!ids.has(x.target));if(!s.steps.some(x=>x.id===s.current))s.current=s.steps[0]?.id??null;});this.ids=new Set();
70: syncNative(){
89: control(target:EventTarget|null){return (target as HTMLElement)?.closest?.('.canvas-controls,.canvas-card-menu,.co-area-selection-tools,.co-presentation-chrome,input,textarea,select,[contenteditable=true],.cm-editor');}
90: toggle(){this.set(!this.enabled);}
91: set(value:boolean){
94: if(value){for(const n of p.adapter.canvas.nodes.values())if(n.isEditing)n.blur?.();p.adapter.canvas.deselectAll?.();}
97: sync(){
100: if(path!==this.path||s?.presentation||!p.store.settings.vision){this.cleanup?.(true);this.enabled=false;this.ids.clear();this.path=path;}
101: if(s?.areas!==this.lastAreas){this.lastAreas=s?.areas??null;const valid=new Set(s?.areas.map(a=>a.id));this.ids=new Set([...this.ids].filter(id=>valid.has(id)));}
102: if(!wrapper||!s||s.presentation||!p.store.settings.vision){wrapper?.classList.remove('co-area-selection-mode');this.toolbar?.remove();this.toolbar=null;return;}
103: if(!this.toolbar?.isConnected||this.toolbar.parentElement!==wrapper){this.toolbar?.remove();this.toolbar=wrapper.createDiv({cls:'co-area-selection-tools'});const button=this.toolbar.createEl('button',{cls:'co-area-select
106: paint(){
116: down(e:PointerEvent){
135: if(path!==p.adapter.file?.path){finish(true);return;}
138: if(resizing){resized=resizeArea(hit!,handle!.dataset.direction!,dx,dy);const b=p.adapter.canvas.getViewportBBox(),z=2**p.adapter.canvas.zoom;const el=handle!.closest<HTMLElement>('[data-area]')!;Object.assign(el.style,{l
```

### src/copy.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/copy.ts)

```text
2: export function observeCopies<F extends {path:string;extension:string}, S>(
```

### src/identity.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/identity.ts)

```text
3: export interface IdentityTransfer {previous:string|null;identity:string;state:CanvasState}
4: export class CanvasIdentity {
14: async drain(){await this.tail;}
20: if(!transfer){
23: if(explicit){state=clone(explicit);id=uid();}
```

### src/main.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/main.ts)

```text
15: export class OutlinerView extends ItemView {
17: constructor(leaf:WorkspaceLeaf,readonly plugin:CanvasOutliner){super(leaf)}getViewType(){return VIEW}getDisplayText(){return 'Canvas Outliner'}getIcon(){return 'list-tree'}async onOpen(){this.render()}async onClose(){}
18: render(){this.plugin.renderOutliner(this.contentEl,this);}
22: constructor(readonly plugin:CanvasOutliner){super(plugin.app);}
24: place(x:number,y:number,w:number,h:number){Object.assign(this.modalEl.style,{width:w+'px',height:h+'px',left:Math.max(8,Math.min(x,innerWidth-w-8))+'px',top:Math.max(8,Math.min(y,innerHeight-h-8))+'px',right:'auto'});}
26: onOpen(){this.modalEl.addClass('co-remote');addPin(this.modalEl,()=>!!this.plugin.store.settings.remotePinned,value=>{this.plugin.store.settings.remotePinned=value;void this.plugin.save();});this.modalEl.addEventListener
27: for(const direction of ['n','s','e','w','ne','nw','se','sw']){const handle=this.modalEl.createDiv({cls:'co-resize co-resize-'+direction,attr:{'aria-label':'크기 조절 '+direction}});handle.onpointerdown=e=>{if(e.button!==0)re
31: render(){this.plugin.renderOutliner(this.contentEl,this)}
32: onClose(){this.cleanupDrag?.();this.modalEl.removeEventListener('pointerdown',this.startDrag);this.cleanupResize?.();window.removeEventListener('resize',this.position);document.removeEventListener('pointerdown',this.outs
35: toggleRemote(){if(this.remotes.size){for(const remote of [...this.remotes])remote.close();return;}new Remote(this).open();}
46: async fileChanged(file:TFile,initial=false){if(file.extension==='canvas')return;const related=Object.values(this.store.canvases).flatMap(s=>(s.snapshot?.nodes??[]).filter(n=>n.file===file.path).map(n=>s.meta[n.id])).filt
47: canvasPaths(){return new Set<string>(this.app.workspace.getLeavesOfType('canvas').map(l=>(l.view as any).file?.path??l.getViewState().state?.file).filter((p):p is string=>typeof p==='string'));}
48: handleLayout(){this.adapter.reconcileLeaves(this.app.workspace.getLeavesOfType('canvas'));this.vision?.render();const open=this.canvasPaths();for(const path of this.openCanvasPaths)if(!open.has(path))void this.reconcileC
56: prompt(title:string,value:string,done:(v:string)=>void){new Prompt(this.app,title,value,done).open();}
57: confirm(message:string,done:()=>void){new Confirm(this.app,message,done).open();}
59: async onload(){this.registerDomEvent(document,'pointermove',e=>{this.pointer={x:e.clientX,y:e.clientY};});try{this.settingsFile=new SettingsFile(join((this.app.vault.adapter as any).getBasePath(),this.manifest.dir!));con
60: if(!this.store.settings.customOnly){for(const state of Object.values(this.store.canvases)){state.collections.sort((a,b)=>a.name.localeCompare(b.name));if(state.snapshot){const groups=hierarchy(state.snapshot,state).paren
64: this.addCommand({id:'open-outliner',name:'Sidebar Outliner 열기',callback:()=>this.openSidebar()});this.addCommand({id:'open-remote',name:'Remote Outliner 열기/닫기',callback:()=>this.toggleRemote()});
65: this.addCommand({id:'register-selection',name:'Turn into an Outliner Item',checkCallback:checking=>{if(!this.adapter.canvas)return false;if(!checking)this.registerSelected();return true}});
66: this.addCommand({id:'unregister-selection',name:'Remove from Outliner',callback:()=>this.removeSelected()});
67: this.addCommand({id:'make-collection',name:'Make Collection',callback:()=>this.makeCollection(null)});
68: this.addCommand({id:'add-presentation',name:'Add to Presentation Space',callback:()=>this.presentation.add(this.adapter.selection())});
69: this.addCommand({id:'presentation-toggle',name:'Presentation ON/OFF',callback:()=>this.presentation.toggle()});
70: this.addCommand({id:'presentation-next',name:'Presentation 다음',callback:()=>this.presentation.move(1)});
71: this.addCommand({id:'presentation-prev',name:'Presentation 이전',callback:()=>this.presentation.move(-1)});
72: this.addCommand({id:'pt-vision-toggle',name:'PT Vision Toggle',callback:()=>this.presentation.toggleVision()});
73: this.addCommand({id:'canvas-search',name:'Canvas Search 열기',callback:()=>this.openCanvasSearch()});
75: this.addCommand({id:'undo',name:'Outliner Undo',hotkeys:[{modifiers:['Mod'],key:'z'}],checkCallback:checking=>{if(!this.outlinerFocused())return false;if(!checking)this.undo();return true}});
76: this.addCommand({id:'redo',name:'Outliner Redo',hotkeys:[{modifiers:['Mod','Shift'],key:'z'}],checkCallback:checking=>{if(!this.outlinerFocused())return false;if(!checking)this.undo(true);return true}});
90: this.registerInterval(window.setInterval(()=>{void this.refresh();if(this.identityReady&&this.identityErrors.size&&Date.now()>this.identityRetryAt){this.identityRetryAt=Date.now()+30000;for(const path of this.identityErr
93: onunload(){for(const search of [...this.searches])search.close();this.identityStopped=true;window.clearTimeout(this.saveTimer);for(const el of this.icons)el.remove();this.icons.clear();for(const r of this.remotes)r.close
94: openCanvasSearch(){const existing=[...this.searches][0];if(existing){existing.close();return;}new CanvasSearch(this).open();}
95: outlinerFocused(){return !!document.activeElement?.closest('.co-outliner')&&!document.activeElement?.matches('input,textarea,[contenteditable=true]');}
96: state(){const path=this.adapter.file?.path;if(!path||!this.identityReady||this.identity?.pending.has(path)||this.identityErrors.has(path))return null;return this.store.canvases[path]??(this.store.canvases[path]=emptyCanv
97: document(){return this.adapter.document();}
98: async inherit(file:TFile){if(this.identityStopped||this.corrupt||!this.identityReady||this.copyPending.has(normalizePath(file.path)))return;try{await this.identity.ensure(file.path);this.identityErrors.delete(file.path);
99: identityFailure(path:string,error:unknown){console.error('Canvas Outliner identity',path,error);const message=String(error);this.identityRetryAt=Date.now()+30000;if(this.identityErrors.get(path)!==message)new Notice('Can
100: async prepareIdentities(){if(this.corrupt)return;
103: for(const path of paths){if(this.identityStopped)return;const candidate=this.app.vault.getAbstractFileByPath(path);if(!(candidate instanceof TFile)||candidate.extension!=='canvas')continue;try{
114: for(const view of views){await view.save();for(let i=0;view.saving&&i<100;i++)await new Promise(r=>window.setTimeout(r,20));if(view.saving)throw Error('Canvas save still pending');}
119: async refresh(){if(this.busy||!this.identityReady||this.identityStopped||this.presentation?.animating)return;this.busy=true;try{const file=this.adapter.file,path=file?.path,canvas=this.adapter.canvas;if(!this.document()|
124: save():Promise<void>{if(this.corrupt){const rejected=Promise.reject<void>(Error('설정이 손상되어 저장하지 않습니다.'));void rejected.catch(()=>{});return rejected;}if(this.scheduledSave)return this.scheduledSave;
129: change(fn:(s:CanvasState)=>void){if(this.vision)this.vision.nativeActionPath='';const s=this.state(),path=this.adapter.file?.path;if(!s||!path)return;const history=this.history.get(path)??[];history.push(clone(s));if(his
130: undo(redo=false){if(this.vision?.undoNative(redo))return;const path=this.adapter.file?.path,s=this.state();if(!path||!s)return;const source=(redo?this.future:this.history).get(path)??[],dest=(redo?this.history:this.futur
131: async openSidebar(){let leaf=this.app.workspace.getLeavesOfType(VIEW)[0];if(!leaf){leaf=this.app.workspace.getRightLeaf(false)!;await leaf.setViewState({type:VIEW,active:false});}await leaf.loadIfDeferred();this.app.work
132: renderAll(){this.vision?.render();for(const leaf of this.app.workspace.getLeavesOfType(VIEW)){const view=leaf.view as OutlinerView;if(typeof view.render==='function')view.render();else void leaf.loadIfDeferred().then(()=
133: registerSelected(){const doc=this.document();if(!doc)return;const ids=this.adapter.selection().filter(id=>doc.nodes.find(x=>x.id===id)?.type!=='group');this.change(s=>register(s,ids));void this.refresh();}
134: removeSelected(){const ids=this.adapter.selection();new Confirm(this.app,'모든 Collection 참조와 Presentation 등록을 제거합니다. Canvas 원본은 유지됩니다.',()=>this.change(s=>ids.forEach(id=>unregister(s,id)))).open();}
136: editCollection(id:string,owner:object){const c=this.state()?.collections.find(c=>c.id===id),path=this.adapter.file?.path;if(!c||!path)return;this.collectionEdit={id,path,draft:c.name,owner};this.renderAll();}
137: finishCollectionEdit(cancel=false){const edit=this.collectionEdit;if(!edit)return;this.collectionEdit=null;const c=this.state()?.collections.find(c=>c.id===edit.id);if(!cancel&&edit.path===this.adapter.file?.path&&c&&edi
139: nodeMenu(menu:Menu,node:any){if(!this.adapter.canvas)return;const id=node.id;menu.addItem(i=>i.setTitle('Add to Presentation Space').onClick(()=>this.presentation.add([id])));menu.addItem(i=>i.setTitle('Turn into an Outl
140: selectionMenu(menu:Menu){menu.addItem(i=>i.setTitle('Turn into an Outliner Item').onClick(()=>this.registerSelected()));menu.addItem(i=>i.setTitle('Add to Presentation Space').onClick(()=>this.presentation.add(this.adapt
141: renderIcons(doc:CanvasDocument,s:CanvasState){const registered=new Set(s.registered),eligible=new Set(doc.nodes.filter(n=>registered.has(n.id)&&n.type!=='group').map(n=>n.id));const signature=JSON.stringify([this.adapter
146: bindNameEdit(row:HTMLElement,label:HTMLElement,kind:'node'|'area',id:string){
163: if(isGroup&&!groupRef&&view.expanded.has(n.id)){const child=target.createDiv({cls:'co-children co-group-children'});child.dataset.groupEnd=n.id;for(const x of sorted(eligible.filter(x=>parents.get(x.id)===n.id&&!(x.type=
167: if(view.expanded.has(c.id)){const child=target.createDiv({cls:'co-children'});for(const sub of s.collections.filter(x=>x.parent===c.id))makeCollection(sub,child);for(const n of sorted(doc.nodes.filter(x=>c.refs.some(r=>r
169: if(view.query.trim()){
172: for(const c of s.collections.filter(x=>matchesSearch(x.name,q))){matches++;const row=el.createDiv({cls:'co-row'});row.dataset.searchCollectionId=c.id;setIcon(row.createSpan({cls:'co-node-icon'}),'folder');row.createSpan(
173: for(const n of eligible.filter(x=>matchesSearch(nodeName(x,s)+' '+(x.text??x.file??x.url??''),q))){matches++;makeNode(n,el,'search',null,true);const groupNames:string[]=[],seen=new Set<string>();let root=n.id,parent=pare
180: async jumpToLine(id:string,line:number,query:string,fullText:string){
192: if(ranges.length){const scroller=renderer.previewEl as HTMLElement;const target=ranges[0].getBoundingClientRect(),box=scroller.getBoundingClientRect(),scale=box.height/(scroller.clientHeight||box.height);if(scale>0)scrol
```

### src/model.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/model.ts)

```text
1: export interface CanvasNode {id:string;type:string;x:number;y:number;width:number;height:number;text?:string;file?:string;url?:string;label?:string;subpath?:string;[key:string]:unknown}
2: export interface CanvasDocument {canvasOutliner?:{version:1;id:string};nodes:CanvasNode[];edges:unknown[]}
3: export interface Ref {kind:'node'|'collection';id:string}
4: export interface Collection {id:string;name:string;parent:string|null;refs:Ref[]}
5: export interface Metadata {created:number|null;updated:number|null;signature:string;order:number;name?:string;fileSignature?:string}
6: export interface Area {native?:boolean;id:string;name:string;x:number;y:number;width:number;height:number}
7: export interface Step {id:string;kind:'node'|'area';target:string}
8: export type SortMode='name'|'created'|'updated'|'size'|'custom';
9: export interface CanvasState {identity?:string;visionGroups?:Area[];registered:string[];collections:Collection[];meta:Record<string,Metadata>;custom:Record<string,string[]>;steps:Step[];areas:Area[];current:string|null;p
10: export interface Settings {vgVision?:boolean;remotePinned?:boolean;searchPinned?:boolean;sidebarEffectsOpen?:boolean;presentationHideSidebars:boolean;presentationSidebarRestore?:{left:boolean;right:boolean};sort:SortMode
11: export interface Store {identityTransfers?:Record<string,import('./identity').IdentityTransfer>;version:1;canvases:Record<string,CanvasState>;settings:Settings}
17: export function contains(a:Pick<CanvasNode,'x'|'y'|'width'|'height'>,b:Pick<CanvasNode,'x'|'y'|'width'|'height'>){return b.x>=a.x&&b.y>=a.y&&b.x+b.width<=a.x+a.width&&b.y+b.height<=a.y+a.height;}
19: export function signature(n:CanvasNode){return JSON.stringify([n.type,n.text,n.file,n.url,n.label,n.subpath]);}
20: export function sync(state:CanvasState,doc:CanvasDocument,now=Date.now()){
22: for(const n of doc.nodes){const sig=signature(n);const m=state.meta[n.id];if(!m){state.meta[n.id]={created:initial?null:now,updated:initial?null:now,signature:sig,order:next++};changed=true;}else if(m.signature!==sig){m.
26: export function purgeMissing(s:CanvasState){const ids=new Set(s.snapshot?.nodes.map(x=>x.id)||[]);s.registered=s.registered.filter(x=>ids.has(x));for(const c of s.collections)c.refs=c.refs.filter(x=>x.kind!=='node'||ids.
27: export function hierarchy(doc:CanvasDocument,s:CanvasState){
30: for(const n of doc.nodes){if(s.visionGroups?.some(a=>a.id===n.id)){parents.set(n.id,null);continue;}let candidates=groups.filter(g=>g.id!==n.id&&contains(g,n));if(n.type==='group')candidates=candidates.filter(g=>area(g)>
32: for(const id of s.registered){if(!doc.nodes.some(x=>x.id===id&&x.type!=='group'))continue;let p=parents.get(id);const seen=new Set<string>();while(p&&!seen.has(p)){seen.add(p);counts.set(p,(counts.get(p)||0)+1);p=parents
35: export function nodeName(n:CanvasNode,s:CanvasState){return s.meta[n.id]?.name||(n.type==='group'?n.label:(n.text||'').split(/\r?\n/).find(x=>x.trim())?.replace(/^#+\s*/,''))||n.file?.split('/').pop()||n.url||'Item';}
36: export function sorted(nodes:CanvasNode[],s:CanvasState,settings:Settings,parent='root'){
37: if(settings.sort==='custom'){const order=s.custom[parent]??[];return [...nodes].sort((a,b)=>(order.indexOf(a.id)<0?1e9:order.indexOf(a.id))-(order.indexOf(b.id)<0?1e9:order.indexOf(b.id)));}
41: export function register(s:CanvasState,ids:string[]){s.registered=[...new Set([...s.registered,...ids])];}
42: export function unregister(s:CanvasState,id:string){s.registered=s.registered.filter(x=>x!==id);for(const c of s.collections)c.refs=c.refs.filter(x=>x.kind!=='node'||x.id!==id);s.steps=s.steps.filter(x=>x.kind!=='node'||
44: export function normalizeCollectionRefs(s:CanvasState,doc:CanvasDocument){
46: for(const c of s.collections){const before=c.refs.length;c.refs=c.refs.filter(r=>{if(r.kind!=='node')return true;if(parents.get(r.id)||seen.has(r.id))return false;seen.add(r.id);return true;});if(c.refs.length!==before)c
48: export function addRef(s:CanvasState,cid:string,id:string,_from?:string,_copy=false){
54: export function moveCollection(s:CanvasState,id:string,parent:string|null){let p=parent;while(p){if(p===id)throw Error('Collection 안에 자신을 넣을 수 없습니다.');p=s.collections.find(x=>x.id===p)?.parent??null;}const c=s.collection
55: export function deleteCollection(s:CanvasState,id:string,subtree:boolean){const c=s.collections.find(x=>x.id===id);if(!c)return;const remove=new Set([id]);if(subtree){let more=true;while(more){more=false;for(const x of s
58: export function validSteps(s:CanvasState,doc:CanvasDocument){return s.steps.filter(x=>x.kind==='area'?s.areas.some(a=>a.id===x.target):doc.nodes.some(n=>n.id===x.target));}
59: export function navigate(s:CanvasState,doc:CanvasDocument,delta:number){const steps=validSteps(s,doc);if(!steps.length)return null;let i=steps.findIndex(x=>x.id===s.current);i=i<0?(delta>0?-1:0):i;const target=steps[(i+d
60: export interface SearchResult {mode?:'text'|'heading'|'line';node:CanvasNode;name:string;line?:number;text:string;heading?:number;start?:number;end?:number;collections?:string[]}
61: export function searchTerms(query:string){return [...new Set(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))];}
62: export function matchesSearch(text:string,query:string|string[]){const terms=typeof query==='string'?searchTerms(query):query;const lower=text.toLocaleLowerCase();return terms.every(term=>lower.includes(term));}
63: export function firstSearchTerm(text:string,query:string){const lower=text.toLocaleLowerCase();return searchTerms(query).filter(term=>lower.includes(term)).sort((a,b)=>lower.indexOf(a)-lower.indexOf(b)||b.length-a.length
64: export function search(doc:CanvasDocument,s:CanvasState,q:string,types:Set<string>,mode:'text'|'heading'|'line'|'all',level:number,texts:Map<string,string>,outliner=false):SearchResult[]{
67: for(const node of doc.nodes){if(outliner&&node.type!=='group'&&!s.registered.includes(node.id))continue;if(types.size&&!types.has(nodeType(node))&&!(node.type==='link'&&(types.has('Link')||types.has('Link Card'))))contin
69: if(mode==='text'){if(matchesSearch(name+'\n'+text,terms))result.push({node,name,text:text.slice(Math.max(0,text.toLocaleLowerCase().indexOf(firstSearchTerm(text,query))-70),Math.max(0,text.toLocaleLowerCase().indexOf(fir
73: export function nodeType(n:CanvasNode){if(n.type==='text')return 'Card';if(n.type==='group')return 'Group';if(n.type==='link')return /youtu\.?be/.test(n.url||'')?'YouTube':'Site URL';const ext=n.file?.split('.').pop()?.t
74: export function documentKey(doc:CanvasDocument){const canonical=(x:any):any=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;return JSON.st
76: export function placeCollection(s:CanvasState,id:string,target:string,position:'before'|'inside'|'after'){if(id===target)return;const dest=s.collections.find(c=>c.id===target),source=s.collections.find(c=>c.id===id);if(!
79: export function collectionCounts(doc:CanvasDocument,s:CanvasState,parents=hierarchy(doc,s).parents){
84: for(const collection of s.collections){const groups=new Set<string>(),items=new Set<string>(),seenNodes=new Set<string>(),seenCollections=new Set<string>();
```

### src/pin.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/pin.ts)

```text
3: export function addPin(modal:HTMLElement, read:()=>boolean, write:(value:boolean)=>void) {
```

### src/presentation.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/presentation.ts)

```text
6: export class Presentation {
9: undoDeletedArea(e:KeyboardEvent){if(!this.pendingAreaUndo||this.p.state()?.presentation||this.inputFocused(e)||!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z')return false;e.preventDefault();e.stopImmediatePropagation
15: constructor(readonly p:CanvasOutliner){
17: p.registerDomEvent(document,'click',e=>{
22: if(node){if(e.shiftKey&&c.updateSelection)c.updateSelection(()=>{c.selection.has(node)?c.selection.delete(node):c.selection.add(node);});else c.selectOnly?.(node);}
24: p.registerDomEvent(document,'pointerdown',e=>{if(!(e.target as HTMLElement).closest('.co-pt-area,.co-order-area,.co-pt-inline')&&this.selectedArea){this.selectedArea=null;this.lastKey='';}},true);
27: for(const name of ['dblclick','beforeinput','paste','cut','drop','contextmenu'] as const)p.registerDomEvent(document,name,block,true);
28: p.registerDomEvent(window,'keydown',e=>{if(p.adapter.element()?.contains(e.target as Node)&&this.undoDeletedArea(e))return;
29: if(e.key==='Escape'&&this.drawing){e.preventDefault();e.stopImmediatePropagation();this.editing=false;this.drawing=false;this.lastKey='';this.render();return;}
31: if(e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&(e.code==='KeyF'||e.key.toLowerCase()==='f')&&!e.isComposing&&((onCanvas&&!this.inputFocused(e))||!!(e.target as HTMLElement).closest('.co-canvas-search'))){e.preventDefa
33: if(e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.code==='KeyP'){if(!p.state()?.presentation&&!e.repeat&&!document.querySelector('.menu,.modal-container')){e.preventDefault();e.stopImmediatePropagation();const r=p.adap
35: if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&['p','v','o'].includes(key)){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;if(key==='p')this.toggle();else if(key==='v')this.toggleVision();else p.t
36: if(!p.state()?.presentation){if(this.selectedArea&&this.areaKey(e))return;return;}
37: if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&!document.querySelector('.menu,.modal-container')){
38: if(/^Digit[0-9]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.numberJump=(this.numberJump+e.code.slice(-1)).slice(0,9);return;}
39: if(e.key==='Backspace'&&this.numberJump){e.preventDefault();e.stopImmediatePropagation();this.numberJump=this.numberJump.slice(0,-1);return;}
40: if(e.code==='Enter'&&this.numberJump){e.preventDefault();e.stopImmediatePropagation();const number=Number(this.numberJump),s=p.state()!,step=s.steps[number-1];this.numberJump='';const doc=p.document();if(step&&doc&&this.
42: if(e.key.startsWith('Arrow')){e.preventDefault();e.stopImmediatePropagation();if(e.key==='ArrowLeft'||e.key==='ArrowRight')this.move(e.key==='ArrowRight'?1:-1);return;}
45: p.registerDomEvent(document,'pointerdown',e=>{if(p.adapter.element()?.contains(e.target as Node)){this.pendingAreaUndo=false;this.cancel();}});
46: p.registerDomEvent(document,'wheel',e=>{if(p.adapter.element()?.contains(e.target as Node))this.cancel();},{passive:true});
50: restoreCanvas(){if(this.lockedCanvas){this.lockedCanvas.setReadonly(this.wasReadonly);if(this.originalNudge)this.lockedCanvas.nudgeSelection=this.originalNudge;this.originalNudge=null;this.lockedCanvas=null;}}
51: preserveViewport(action:()=>void){const c=this.p.adapter.canvas;this.cancel();const pos=c?{x:c.x,y:c.y,z:c.zoom}:null;action();const restore=()=>{if(c&&pos&&this.p.adapter.canvas===c)c.setViewport(pos.x,pos.y,pos.z)};res
52: restoreSidebars(){const saved=this.p.store.settings.presentationSidebarRestore;const w=this.p.app.workspace;if(!saved||!w.leftSplit||!w.rightSplit)return;delete this.p.store.settings.presentationSidebarRestore;this.prese
53: restoreCreation(){if(this.creationCanvas&&this.originalCreation)this.creationCanvas.showCreationMenu=this.originalCreation;this.creationCanvas=null;this.originalCreation=null;}
54: syncMode(){if(!this.p.app.workspace.layoutReady||!this.p.identityReady||!this.p.app.workspace.leftSplit||!this.p.app.workspace.rightSplit)return;if(this.extendedZoomCanvas&&(this.extendedZoomCanvas!==this.p.adapter.canva
55: fitAll(){const c=this.p.adapter.canvas,s=this.p.state(),doc=this.p.document();if(!c||!s||!doc)return;const rects=[...doc.nodes,...s.areas];if(!rects.length)return;this.cancel();this.releaseExtendedZoom();c.zoomToBbox({mi
56: syncPresentationSelection(){const s=this.p.state(),c=this.p.adapter.canvas;if(!s?.presentation||!c)return;const step=this.current(s);const node=step?.kind==='node'?this.p.adapter.node(step.target):null;const selection=th
57: toggle(){this.numberJump='';const s=this.p.state();if(!s)return;this.cancel();this.drawing=false;s.presentation=!s.presentation;this.syncMode();this.syncPresentationSelection();this.lastKey='';void this.p.save();this.p.r
58: toggleVision(){this.drawing=false;this.p.store.settings.vision=!this.p.store.settings.vision;void this.p.save();this.lastKey='';this.p.renderAll();}
59: inputFocused(e:KeyboardEvent){return !!(e.target as HTMLElement)?.closest?.('input,textarea,select,[contenteditable=true],.cm-editor,.modal-container,.suggestion-container');}
60: add(ids:string[]){const doc=this.p.document();if(!doc)return;this.p.change(s=>{for(const id of ids){const n=doc.nodes.find(n=>n.id===id);if(!n)continue;if(n.type!=='group')register(s,[id]);const step={id:uid(),kind:'node
61: selectTarget(kind:'node'|'area',target:string){const s=this.p.state();if(!s)return;const matches=s.steps.filter(x=>x.kind===kind&&x.target===target);if(!matches.length)return;const step=matches.find(x=>x.id===s.current)?
62: current(s:CanvasState){return s.steps.find(x=>x.id===s.current);}
63: rect(step:Step|undefined,s:CanvasState,doc:CanvasDocument){if(!step)return null;return step.kind==='area'?s.areas.find(x=>x.id===step.target)??null:doc.nodes.find(x=>x.id===step.target)??null;}
64: name(step:Step,s:CanvasState,doc:CanvasDocument){return step.kind==='area'?s.areas.find(x=>x.id===step.target)?.name??'삭제된 Presentation Group':doc.nodes.find(x=>x.id===step.target)?nodeName(doc.nodes.find(x=>x.id===step.
65: move(delta:number){const s=this.p.state(),doc=this.p.document();if(!s||!doc||!s.presentation)return;const step=navigate(s,doc,delta);if(!step){new Notice('Presentation에 유효한 대상이 없습니다.');return;}this.go(step.id);}
66: go(id:string){this.numberJump='';const s=this.p.state(),doc=this.p.document();if(!s||!doc)return;const step=s.steps.find(x=>x.id===id);const r=this.rect(step,s,doc);if(!r)return;s.current=id;this.syncPresentationSelectio
67: releaseExtendedZoom(){if(this.extendedZoomCanvas){const c=this.extendedZoomCanvas;c.screenshotting=this.priorScreenshotting;if(c.virtualize===this.extendedVirtualize)c.virtualize=this.originalVirtualize;this.extendedZoom
68: enableExtendedZoom(c:any){if(this.extendedZoomCanvas===c)return;this.releaseExtendedZoom();this.extendedZoomCanvas=c;this.priorScreenshotting=!!c.screenshotting;this.originalVirtualize=c.virtualize;const pt=this,original
69: cancel(){if(this.animating){cancelAnimationFrame(this.animating);this.animating=0;}}
72: render(){this.areaSelection.sync();this.syncMode();this.renderChrome();if(this.editing||Date.now()<this.labelClickUntil)return;const p=this.p,c=p.adapter.canvas,s=p.state(),doc=s?.snapshot??p.document(),wrapper=p.adapter
76: if(settings.vision&&target&&(settings.dim||settings.blur)){const masks=Array.from({length:4},()=>{const mask=layer.createDiv({cls:'co-blind'});mask.style.background=settings.dim?`rgba(0,0,0,${settings.dimStrength})`:'tra
77: if(s.presentation&&target&&settings.glow&&(selected?.kind!=='area'||settings.vision)){const glow=layer.createDiv({cls:'co-glow'});place(glow,target);glow.style.boxShadow=`0 0 ${settings.glowStrength}px var(--interactive-
79: for(const area of s.areas){const el=layer.createDiv({cls:'co-pt-area'});el.dataset.area=area.id;el.classList.toggle('is-selected',this.selectedArea===area.id);place(el,area);el.createSpan({text:area.name,cls:'co-pt-label
80: if(settings.order){const targets=new Map<string,{step:Step;indices:number[]}>();s.steps.forEach((step,i)=>{if(!this.rect(step,s,doc))return;const key=step.kind+':'+step.target;const x=targets.get(key)??{step,indices:[]};
83: inlineAreaEdit(anchor:HTMLElement,value:string,label:string,commit:(value:string)=>void|false){if(anchor.querySelector('input'))return;this.editing=true;const input=document.createElement('input');input.className='co-pt-
84: editArea(el:HTMLElement,resize:HTMLElement,area:Area){let origin:Area|null=null,start:{x:number;y:number}|null=null,mode='move';let members:{id:string;x:number;y:number}[]=[];
88: areaKey(e:KeyboardEvent){const s=this.p.state(),a=s?.areas.find(a=>a.id===this.selectedArea);if(!s||!a)return false;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediateP
89: renderChrome(){const p=this.p,s=p.state(),doc=s?.snapshot,wrapper=p.adapter.element();if(!s?.presentation||!doc||!wrapper){this.chrome?.remove();this.chrome=null;this.chromeKey='';this.numberJump='';return;}if(this.chrom
90: renderUI(el:HTMLElement,view:Surface,sidebar=false){const p=this.p,s=p.state(),doc=p.document();if(!s||!doc)return;if(!sidebar){const controls=el.createDiv({cls:'co-controls'});const toggle=controls.createEl('button',{te
97: itemIcon(step:Step,doc:CanvasDocument){if(step.kind==='area')return {icon:'presentation',label:'PT 그룹'};const n=doc.nodes.find(n=>n.id===step.target);if(n?.type==='group')return {icon:'group',label:'Canvas 그룹'};if(n?.typ
98: map(el:HTMLElement,s:CanvasState,doc:CanvasDocument){const map=el.createDiv({cls:'co-map'});const all=[...doc.nodes,...s.areas].sort((a,b)=>b.width*b.height-a.width*a.height);if(!all.length)return;const minX=Math.min(...
```

### src/search.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/search.ts)

```text
5: export class CanvasSearch extends Modal {
8: place(x:number,y:number,w:number,h:number){Object.assign(this.modalEl.style,{width:w+'px',height:h+'px',left:Math.max(8,Math.min(x,innerWidth-w-8))+'px',top:Math.max(8,Math.min(y,innerHeight-h-8))+'px',right:'auto'});}
13: constructor(readonly plugin:CanvasOutliner){super(plugin.app);this.mode=plugin.store.settings.searchMode;this.heading=plugin.store.settings.heading;}
14: onOpen(){this.modalEl.addClass('co-canvas-search');addPin(this.modalEl,()=>!!this.plugin.store.settings.searchPinned,value=>{this.plugin.store.settings.searchPinned=value;void this.plugin.save();});this.plugin.searches.a
18: onClose(){this.resultObserver?.disconnect();this.resultObserver=null;this.cleanupDrag?.();this.cleanupResize?.();this.modalEl.removeEventListener('pointerdown',this.startDrag);window.removeEventListener('resize',this.pos
19: schedule(){this.generation++;window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>void this.update().catch(error=>{console.error(error);if(this.plugin.searches.has(this)){this.resultEl.empty();this.resultEl.c
20: async update(){const token=++this.generation,path=this.plugin.adapter.file?.path,query=this.query.trim(),doc=this.plugin.document(),s=this.plugin.state();if(!this.resultEl)return;if(!doc||!s){this.resultEl.empty();this.r
21: async jump(result:SearchResult,fullText?:string,query=this.query.trim()){const p=this.plugin;const before=p.document();p.adapter.select(result.node.id,p.store.settings.fitPadding);const source=fullText??result.node.text?
```

### src/storage.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/storage.ts)

```text
5: export function parseStore(raw:string):Store {
17: export class SettingsFile {
19: constructor(private dir:string,private io=fs){}
28: if(raw!==null){try{const data=parseStore(raw);this.validRaw=raw;return{data,recovered:false}}catch{}}
30: if(backup===null){if(raw===null){this.validRaw=null;return{data:null,recovered:false};}throw Error('Settings and recovery backup unavailable');}
37: async save(data:Store){
40: if(this.validRaw!==undefined&&previous!==this.validRaw){if(previous!==null)parseStore(previous);throw Error('Settings changed externally; reload before saving');}
41: if(previous!==null&&this.validRaw===undefined){parseStore(previous);this.validRaw=previous;}
```

### src/vision-group.ts

[보관 원문](snapshots/obsidian-canvas-outliner/src/vision-group.ts)

```text
7: export function creationBounds(selected:Omit<Area,'id'|'name'>[],viewport:Omit<Area,'id'|'name'>|null){
14: export function independentVisionDrag(canvas:any,visionIds:Set<string>,action:()=>any,node?:any){
27: export class VisionGroups {
36: constructor(private p:CanvasOutliner){
38: p.addCommand({id:'vision-group-create',name:'Vision Group 만들기',checkCallback:checking=>{if(!this.available())return false;if(!checking)this.createFromSelection();return true;}});
39: p.addCommand({id:'vg-vision-toggle',name:'VG Vision ON/OFF',checkCallback:checking=>{if(!this.p.adapter.canvas)return false;if(!checking)this.toggle();return true;}});
44: toggle(){this.p.store.settings.vgVision=!this.visible;this.p.adapter.canvas?.updateSelection(()=>{});void this.p.save();this.p.renderAll();}
45: undoNative(redo=false){const c=this.p.adapter.canvas;if(this.nativeActionPath!==this.p.adapter.file?.path||!c)return false;c[redo?'redo':'undo']();void this.p.refresh();this.p.renderAll();return true;}
46: createFromSelection(){const doc=this.p.document(),ids=new Set(this.p.adapter.selection());if(!doc)return;const rect=creationBounds(doc.nodes.filter(n=>ids.has(n.id)),this.p.adapter.bounds());if(rect)this.create(rect);}
47: create(rect:Omit<Area,'id'|'name'>){
65: for(const a of state.visionGroups??[]){
66: if(!a.native){a.native=true;this.insertNative(a);changed=true;}
69: if(a.x!==d.x||a.y!==d.y||a.width!==d.width||a.height!==d.height||a.name!==d.label){
77: renderRows(el:HTMLElement,groups:Area[],query:string){
79: for(const a of groups.filter(a=>this.p.adapter.node(a.id)&&(!query||matchesSearch(a.name,query)))){
90: render(){
92: if(wrapper!==this.wrapper||path!==this.path){this.detach();this.path=path;this.wrapper=wrapper;if(wrapper)this.attach(wrapper);}
94: if(this.toolbar){this.toolbar.setAttribute('aria-pressed',String(this.visible));this.toolbar.classList.toggle('is-active',this.visible);setIcon(this.toolbar,this.visible?'eye':'eye-off');}
111: if(canvas){const observer=new MutationObserver(()=>this.project());observer.observe(canvas,{childList:true});this.restore=()=>observer.disconnect();}
```

## obsidian-canvas-portal

기준: 199bd978a348c3b290035b410d5c84981af25fc4

### src/main.cjs

[보관 원문](snapshots/obsidian-canvas-portal/src/main.cjs)

```text
9: constructor(plugin,s,ids,ordinary){super(plugin.app);Object.assign(this,{plugin,s,ids,ordinary});}
10: onOpen(){
18: onClose(){this.s.deleteModal=null;this.contentEl.empty();}
22: constructor(app, done, initialName='새 포탈') { super(app); this.done = done; this.initialName=initialName; }
23: onOpen() {
33: onClose() { this.contentEl.empty(); }
37: constructor(plugin,payload){super(plugin.app);this.plugin=plugin;this.payload=payload;}
38: onOpen(){
43: for(const r of this.payload.records){
50: onClose(){this.contentEl.empty();}
53: display() {
70: async onload() {
80: this.addCommand({ id: 'create-select-portal', name: 'Create Portal · 선택 자료 묶기', checkCallback: checking => {
84: this.addCommand({ id: 'toggle-portal', name: '입장·퇴장', hotkeys: [{ modifiers: ['Ctrl'], key: 'Enter' }], checkCallback: checking => {
89: this.addCommand({id:'clone-portal',name:'포탈 복제',checkCallback:checking=>{const s=this.active(),r=s&&this.selectedPortal(s);if(r?.role!=='entry')return false;if(!checking)this.copyPortal(s,r.id);return true;}});
90: this.addCommand({id:'unportal',name:'포탈 해제 · 현재 자료 꺼내기',checkCallback:checking=>{const s=this.active(),r=s&&this.selectedPortal(s);if(r?.role!=='entry')return false;if(!checking)this.beginUnportal(s,[r.id]);return true;}
91: this.addCommand({id:'move-portals',name:'다른 포탈로 이동',checkCallback:checking=>{const s=this.active(),ids=s&&this.selectedEntries(s);if(!ids?.length)return false;if(!checking)this.beginMove(s,ids);return true;}});
103: if(s.preview){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.cancelPreview(s);}return;}
116: this.registerInterval(window.setInterval(() => this.discover(), 1000));
117: this.registerInterval(window.setInterval(()=>this.maybeAutoBackup(),10000));
120: installViewState(){
128: hookViewState(v){
145: positionState(s,seen=new Set()){
150: while(id&&!visited.has(id)){visited.add(id);const p=s.root.canvasPortal?.portals[id];if(!p)break;path.unshift(id);id=p.parentId;}
152: if(s.linkBack){const owner=s.linkBack.owner;result.link={ownerLeaf:owner.v.leaf.id,portal:s.linkBack.id,owner:this.positionState(owner,seen)};}
155: requestPositionSave(s){
160: async restorePosition(s,position,seen=new Set()){
164: if(position.link?.owner){
166: if(file?.extension==='canvas'&&!seen.has(saved.file)){
168: if(!owner){const leaf=this.app.workspace.getLeavesOfType('canvas').find(l=>l.id===position.link.ownerLeaf&&(l.view.file?.path||l.getViewState().state?.file)===saved.file);if(leaf){await leaf.loadIfDeferred();this.discove
169: if(!owner){const active=this.app.workspace.activeLeaf,leaf=this.app.workspace.getLeaf('tab');await leaf.openFile(file,{active:false});this.discover();owner=this.sessions.get(leaf.view);if(active)this.app.workspace.setAct
170: if(owner){
173: if(p?.type==='link'&&p.target===s.path){
181: for(const id of position.path||[]){const p=s.root.canvasPortal?.portals[id];if(!p||((p.parentId??null)!==current)||!M.space(s.root,current)?.nodes.some(n=>M.ref(n)?.role==='entry'&&M.ref(n).id===id)||p.type==='link')brea
185: if(viewport&&['x','y','zoom'].every(k=>Number.isFinite(viewport[k]))){s.c.zoomToFitQueued=false;s.c.setViewport(viewport.x,viewport.y,viewport.zoom);}
190: matchesKey(e, hotkey) {
194: backupStore(){if(!this.settings.backupFolder)throw Error('설정에서 백업 폴더를 먼저 지정하세요.');return new B.Store(this.app.vault.adapter.basePath,this.settings.backupFolder);}
195: canvasFiles(){const folder=this.settings.backupFolder;return this.app.vault.getFiles().filter(f=>f.extension==='canvas'&&(!folder||!f.path.startsWith(folder+'/')));}
196: async maybeAutoBackup(){const minutes=this.settings.autoMinutes;if(!minutes||!this.settings.backupFolder||this.backupBusy||this.recoveryBusy||[...this.sessions.values()].some(s=>s.preview)||Date.now()-(this.lastAutoAttem
197: async runBackup(automatic=false,prepare=false){
198: if(this.backupBusy||this.recoveryBusy||[...this.sessions.values()].some(s=>s.preview)){if(!automatic)new Notice('진행 중인 배치나 백업을 먼저 마쳐 주세요.');return false;}
202: for(const s of this.sessions.values()){this.flushEditors(s);this.capture(s);await s.v.save();}
212: async beginRecovery(record,target){
234: if(!draft.missing.length){await commit({x:0,y:0});return;}
241: notifyError(error) { this.errors.push(String(error)); console.error('[Canvas Portal]', error); new Notice(`Canvas Portal: ${error.message || error}`); }
242: active() { const leaf = this.app.workspace.getMostRecentLeaf(); return leaf && this.sessions.get(leaf.view); }
243: selectedPortal(s) {
248: selectedEntries(s){
253: navigationAction(s) {
261: navigate(s,action,event=s.c.wrapperEl?.ownerDocument?.defaultView?.event){
265: if(event?.type==='keydown'){
273: portal(s,id){return s.root.canvasPortal?.portals[id] || (s.linkBack?.id===id?s.linkBack.owner.root.canvasPortal.portals[id]:null);}
274: addPortalMenu(s,menu){
280: currentData(s){return M.space(s.root,s.current);}
281: async renameLinks(oldPath,newPath){
284: for(const s of this.sessions.values()){
290: if(changed){const viewport={x:s.c.x,y:s.c.y,z:s.c.zoom};this.rememberHistory(s);this.show(s,this.displayData(s));s.c.setViewport(viewport.x,viewport.y,viewport.z);this.decorate(s);await s.v.save();}
292: for(const file of this.canvasFiles().filter(f=>!open.has(f.path))){
298: if(this.settings.backupFolder){if(this.backupBusy)throw Error('백업 중 경로가 변경되었습니다. 백업을 다시 실행해 주세요.');this.backupBusy=true;try{await this.backupStore().retarget(oldPath,newPath);}finally{this.backupBusy=false;}}
300: flushEditors(s){for(const n of s.c.nodes.values()){const child=n.child;if(!child)continue;child.requestSave?.cancel?.();child.requestSaveFolds?.cancel?.();if(M.ref(n.getData())?.role!=='exit'&&child.editMode&&child.edito
301: applyColor() { for (const s of this.sessions.values()) s.c.wrapperEl.style.setProperty('--cp-glow', this.settings.glowColor); }
302: discover() {
310: attach(v) {
322: if(root.canvasPortal&&this.safety){s.migrationReady=this.safety.store.preserve(s.path,JSON.stringify(root));s.migrationReady.catch(e=>this.notifyError(e));}
344: if(Object.values(parsed.canvasPortal?.portals||{}).some(p=>p.type==='group')){s.migrationReady=this.safety.store.preserve(v.file.path,text);s.migrationReady.catch(e=>this.notifyError(e));M.normalizeGroups(parsed);text=JS
350: if(sameFile)for(const [id,history]of s.histories){
359: if(sameFile&&(s.current||s.linkBack)){this.show(s,this.displayData(s));c.setViewport(viewport.x,viewport.y,viewport.zoom);}
395: if(!data.canvasPortalTransfer&&data.nodes?.some(n=>M.ref(n))){new Notice('포탈을 복사하려면 Canvas Portal이 켜진 상태에서 다시 복사하세요.');return {nodes:[],edges:[]};}
398: catch(e){this.notifyError(e);return {nodes:[],edges:[]};}
402: if(s.lifecycleDedup){const last=c.history.data[c.history.current];if(last&&(last.cpLifecycle||0)===next.cpLifecycle&&canonical(M.graph(last))===canonical(M.graph(next)))return;s.lifecycleDedup=false;}
418: if(!s.current&&s.linkBack){data=M.clone(data);const p=this.portal(s,s.linkBack.id);if(!data.nodes.some(n=>n.id===p.exitId))data.nodes.push(M.clone(p.graph.nodes[0]));}
426: for(const data of args[0]?.nodes||[]){const old=c.nodes.get(data.id);if(old&&old.getData().type!==data.type)c.removeNode(old);}
453: batchViewportUnmount(s, original, args) {
486: capture(s) {
493: if(!s.current&&s.linkBack){
495: if(exit&&JSON.stringify(exit)!==JSON.stringify(p.graph.nodes[0])){p.graph.nodes[0]={...exit,text:M.cardText(p.name,p.displayId)};s.linkBack.owner.v.requestSave();}
519: revive(s,data){
523: syncRegistry(s){
527: for(const [id,p] of Object.entries(s.root.canvasPortal.portals))if(!seen.has(id)){s.archives.set(id,M.clone(p));delete s.root.canvasPortal.portals[id];}
529: queue(s) {
533: bindNodeMenu(s, n) {
541: decorate(s) {
543: for(const [n,restore] of s.menuUndos)if(s.c.nodes.get(n.id)!==n){restore();s.menuUndos.delete(n);}
566: if(styled&&!large){large=n.nodeEl.createDiv({cls:'cp-large-icon',attr:{'aria-hidden':'true'}});setIcon(large,'log-in');}
568: if(styled){const width=Math.max(1,n.width),height=Math.max(1,n.height),size=Math.max(8,Math.min(64,width*.20,height*.45)),gap=Math.max(4,Math.min(24,width*.07));n.nodeEl.style.setProperty('--cp-icon-size',size+'px');n.no
570: if(p.type==='link'){
615: askCreate(s) {
618: if(selected.length===1&&selected[0].type==='file'&&selected[0].file.toLowerCase().endsWith('.canvas')){this.create(s,M.fileTitle(selected[0].file));return;}
621: async create(s, name) {
630: async commitRoot(s,root,selected=[],save=true){
635: displayData(s){const data=M.clone(this.currentData(s));if(!s.current&&s.linkBack)data.nodes.push(M.clone(this.portal(s,s.linkBack.id).graph.nodes[0]));return data;}
636: rememberHistory(s) {
640: show(s, data) {
657: transition(s, r) {if(r.role==='entry')return this.enter(s,r.id);if(r.role==='exit'&&s.current===r.id)return this.leave(s);if(r.role==='exit'&&s.linkBack?.id===r.id)return this.leaveLink(s);}
658: selectLeftmostCard(s){
665: async enter(s, id) {
670: if(p.type==='link'){await this.enterLink(s,p);return;}
678: async leave(s) {
689: leaveActive(){const s=this.active();if(s?.preview)return;if(s?.current)this.leave(s);else if(s?.linkBack)this.leaveLink(s);}
690: async enterLink(owner,p){
696: if(!p.linkExitPlaced){const b=M.bounds(s.root.nodes);Object.assign(p.graph.nodes[0],{x:b.x-320,y:b.y-190});p.linkExitPlaced=true;}
703: async leaveLink(s){
716: async copyPortal(s,id){
719: catch(e){this.notifyError(e);}finally{s.busy=false;}
721: askDelete(s,ids,ordinary=[]){
725: async deleteContents(s,ids,ordinary){
728: catch(e){this.notifyError(e);}finally{s.busy=false;}
730: beginMove(s,ids){
738: if(!node){status.setText('목적지 포탈 카드를 클릭하세요 · Esc 취소');return;}
742: catch(error){status.setText(error.message+' · Esc 취소');new Notice(error.message);}
747: async changeFile(file,expected,next){
750: async moveSelection(s,ids,destinationId){
755: if(destination.type==='link'){
758: for(const id of ids)for(const child of M.descendants(s.root,id)){const p=s.root.canvasPortal.portals[child];if(p.type==='link'&&p.target===file.path)throw Error('목적지 Canvas를 가리키는 포탈은 그 Canvas 안으로 옮길 수 없습니다.');}
759: for(const other of this.sessions.values())if(other.path===file.path){if(other.busy||other.preview)throw Error('목적지 Canvas의 진행 중인 작업을 먼저 마쳐 주세요.');this.flushEditors(other);this.capture(other);await other.v.save();}
766: async commitMove(s,root,external){
780: async writeMoveFiles(s,beforeText,afterText,external){
783: for(const [other]of locks){other.c.setReadonly(true);other.v.requestSave?.cancel?.();other.lifecycleWriting=true;}
786: if(external){await this.changeFile(external.file,external.before,external.after);targetWritten=true;}
792: for(const [other]of locks)if(other!==s){const text=other.path===s.path?afterText:external.after;await other.v.setViewData(text,false);}
794: async restoreLifecycle(s,data,index){
798: if(!record||record.parent!==s.current){new Notice('다른 공간에서 변경된 이동 기록은 되돌릴 수 없습니다.');return;}
814: async beginUnportal(s,ids,deleteIds=[],deleting=false){
819: if(!virtual.length){
821: if(deleting){const parent=M.space(root,s.current),removed=new Set([...deleteIds,...links.map(id=>root.canvasPortal.portals[id].entryId)]);parent.nodes=parent.nodes.filter(n=>!removed.has(n.id));parent.edges=parent.edges.
835: for(const id of links){if(deleting){const p=root.canvasPortal.portals[id],parent=M.space(root,s.current);parent.nodes=parent.nodes.filter(n=>n.id!==p.entryId);parent.edges=parent.edges.filter(e=>e.fromNode!==p.entryId&&e
843: updatePreview(s,pos){
849: for(const n of nodes.length?nodes:[{x:pos.x,y:pos.y,width:160,height:80,text:'빈 포탈 해제'}]){const el=p.ghosts.createDiv({cls:'cp-placement-node',text:(n.label||(n.type==='file'?n.file:M.title(n.text))||'카드').slice(0,60)});
851: cancelPreview(s){if(!s.preview)return;s.preview.host.remove();s.preview=null;s.c.wrapperEl.focus();}
852: detach(s) {
873: onunload(){for(const s of this.sessions.values()){s.lastPosition=this.positionState(s);this.pendingPositions.set(s.v,s.lastPosition);try{this.flushEditors(s);this.capture(s);}catch(e){this.notifyError(e);}}this.app.works
```

### src/model.cjs

[보관 원문](snapshots/obsidian-canvas-portal/src/model.cjs)

```text
23: for(const p of Object.values(root.canvasPortal?.portals||{}))if(p.type==='group'){
76: for(const n of moved){const r=ref(n);if(r?.role==='entry')root.canvasPortal.portals[r.id].parentId=portalId;}
91: for(const old of ids){const p=records[old];for(const n of p.graph.nodes)nodeMap.set(n.id,uid());nodeMap.set(p.entryId,nodeMap.get(p.entryId)||uid());}
92: for(const old of ids){const p=clone(records[old]);p.id=portalMap.get(old);p.displayId=nextId(root);p.entryId=nodeMap.get(p.entryId);p.exitId=nodeMap.get(p.exitId);p.parentId=old===id?parentId:portalMap.get(p.parentId);
99: for(const old of ids){const p=root.canvasPortal.portals[portalMap.get(old)];for(const n of p.graph.nodes){const r=ref(n);if(r){const child=root.canvasPortal.portals[r.id];n.text=cardText(child.name,child.displayId);}}}
106: if(p.type==='link'){const entry=space(root,p.parentId).nodes.find(n=>n.id===p.entryId);return {nodes:[{...clone(p.originalEntry),x:entry.x,y:entry.y,width:entry.width,height:entry.height}],edges:[]};}
113: for(const id of ids){const p=root.canvasPortal.portals[id];remove.add(p.entryId);const content=restoreItems(root,id);nodes.push(...content.nodes.map(n=>({...n,x:n.x+offset.x,y:n.y+offset.y})));edges.push(...content.edges
121: for(const n of selection.nodes){const r=ref(n);if(r?.role==='exit')continue;
122: if(r?.role==='entry'){
151: if(oldPath)for(const g of [root,...Object.values(records).map(p=>p.graph)])for(const n of g.nodes||[]){
152: if(typeof n.file==='string'&&(n.file===oldPath||n.file.startsWith(oldPath+'/'))){n.file=newPath+n.file.slice(oldPath.length);changed=true;}
154: for(const p of Object.values(records))if(p.type==='link'){
155: if(oldPath&&(p.target===oldPath||p.target.startsWith(oldPath+'/'))){p.target=newPath+p.target.slice(oldPath.length);changed=true;}
156: if(p.originalEntry&&p.originalEntry.file!==p.target){p.originalEntry.file=p.target;changed=true;}
182: if(destinationData){
192: for(const n of nodes){n.x+=dx;n.y+=dy;}
```

### src/backup.cjs

[보관 원문](snapshots/obsidian-canvas-portal/src/backup.cjs)

```text
26: for(const r of records){validateRecord(r);const names={};for(const p of Object.values(r.portals))if(p.type!=='link')names[p.id]=`${safe(M.fileTitle(r.source))}_Portal_${p.displayId}_${digest(r.source).slice(0,8)}_${p.id.
27: for(const p of Object.values(r.portals))if(p.type!=='link'){
39: for(const name of Object.keys(payload.exports)){if(name!==path.basename(name)||!name.endsWith('.canvas'))throw Error('백업 파일 경로가 올바르지 않습니다.');}
43: constructor(base,folder,io=fs){this.base=path.resolve(base);this.folder=relative(folder);this.dir=path.resolve(base,...folder.split('/'));this.io=io;}
44: async prepare(){
47: async exists(p){try{await this.io.lstat(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
48: async inspectDir(dir){
52: for(const [name,hash]of Object.entries(payload.exports)){
57: if(digest(text)!==hash){
68: async recover(){
70: if(!await this.exists(latest)&&await this.exists(previous)){await this.inspectDir(previous);await this.io.rename(previous,latest);}
72: async read(){await this.prepare();await this.recover();return this.inspectDir(path.join(this.dir,'latest'));}
73: async owned(dir){
81: async removeOwned(dir){
86: async write(records,createdAt){
92: for(const [name,text]of bundle.files){const handle=await this.io.open(path.join(staging,name),'wx');try{await handle.writeFile(text,'utf8');await handle.sync();}finally{await handle.close();}}
96: catch(e){if(moved&&!await this.exists(latest))await this.io.rename(previous,latest);throw e;}
101: async retarget(oldPath,newPath){
104: for(const r of payload.records){const source=moved(r.source);if(source!==r.source){r.source=source;changed=true;}const root={nodes:r.entries,edges:[],canvasPortal:{version:1,canvasId:r.canvasId,portals:r.portals}};if(M.s
110: for(const e of r.entries){const id=M.ref(e).id;if(root.canvasPortal.portals[id])for(const child of M.descendants(root,id))affected.add(child);}
113: for(const e of r.entries){const id=M.ref(e).id,p=root.canvasPortal.portals[id],found=locations.get(id);if(found){
```

### src/safety.cjs

[보관 원문](snapshots/obsidian-canvas-portal/src/safety.cjs)

```text
8: constructor(base,io=fs){this.base=base;this.io=io;this.pending=new Map();this.tracked=new Set();}
9: preserve(file,text){
14: async preserveNow(file,text){
50: for(const method of ['write','process']){
```

## obsidian-canvas-visibility

기준: fe3a3bd6178a968f8ba544ab3b467e92254c1fe6

### src/canvas/canvas-adapter.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/canvas/canvas-adapter.ts)

```text
4: export class CanvasAdapter {
5: constructor(private readonly app: App) {}
```

### src/collapse/collapse-manager.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/collapse/collapse-manager.ts)

```text
10: export class CollapseManager {
```

### src/collapse/title-prompt-modal.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/collapse/title-prompt-modal.ts)

```text
3: export interface FoldCardDetails {
9: export class TitlePromptModal extends Modal {
```

### src/collapse/title-resolver.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/collapse/title-resolver.ts)

```text
4: export function getTextCardTitle(value: unknown): string | null {
17: export class TitleResolver {
18: constructor(private readonly adapter: CanvasAdapter) {}
```

### src/collapse/title-size-modal.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/collapse/title-size-modal.ts)

```text
4: export interface FoldTextSizes {
10: export interface FoldHeaderColors {
15: export class TitleSizeModal extends Modal {
```

### src/commands/commands.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/commands/commands.ts)

```text
6: export function registerCommands(plugin: CanvasVisibilityPlugin): void {
7: plugin.addCommand({
34: plugin.addCommand({
43: plugin.addCommand({
52: plugin.addCommand({
61: plugin.addCommand({
70: plugin.addCommand({
79: plugin.addCommand({
```

### src/editor/editor-manager.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/editor/editor-manager.ts)

```text
9: export class EditorManager {
```

### src/editor/floating-editor.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/editor/floating-editor.ts)

```text
8: export class FloatingEditor {
```

### src/editor/native-markdown-editor.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/editor/native-markdown-editor.ts)

```text
21: export class NativeMarkdownEditor {
```

### src/main.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/main.ts)

```text
37: this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
63: this.registerInterval(window.setInterval(() => void this.refreshOpenCanvases(), 1500));
```

### src/settings/settings.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/settings/settings.ts)

```text
19: export class CanvasVisibilitySettingTab extends PluginSettingTab {
20: constructor(app: App, private readonly plugin: CanvasVisibilityPlugin) {
```

### src/storage/metadata-store.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/storage/metadata-store.ts)

```text
10: export class MetadataStore {
13: constructor(private readonly plugin: Plugin) {}
```

### src/types.ts

[보관 원문](snapshots/obsidian-canvas-visibility/src/types.ts)

```text
3: export interface CanvasNodeDataLike {
15: export interface CanvasNodeLike {
26: export interface CanvasLike {
36: export interface CanvasViewLike {
42: export interface FoldNodeState {
59: export interface CanvasState {
63: export interface CanvasVisibilitySettings {
77: export interface PluginData {
82: export type EditableNodeKind = "file" | "text";
84: export interface EditableNodeTarget {
```

## canvas-image-copy

기준: 83bf3d6199a18645e82be82a64db3e0d09447a47

### src/files.ts

[보관 원문](snapshots/canvas-image-copy/src/files.ts)

```text
6: export function uniqueImages(names: string[]): string[] {
14: catch(error) { if((error as NodeJS.ErrnoException).code==='EEXIST') continue; throw error; }
```

### src/main.ts

[보관 원문](snapshots/canvas-image-copy/src/main.ts)

```text
14: onload() {
15: if(process.platform!=='win32') { new Notice('Canvas Image Copy는 Windows 전용입니다.'); return; }
16: for(const [id,name,mode] of [['copy-selected-images',COPY,'copy'],['save-selected-images',SAVE,'save']] as const) {
17: this.addCommand({id,name,checkCallback:checking=>{
35: for(const node of canvas.selection) {
37: if(data?.type!=='file' || !data.file || !isImage(data.file)) {excluded++;continue;}
57: if(this.busy) {new Notice('이미지 처리 중입니다. 잠시 기다려 주세요.');return;}
64: for(const file of selection.files) {
68: if(!files.length) {new Notice(`처리할 이미지가 없습니다. 제외 ${selection.excluded}개 · 실패 ${failed}개`);return;}
70: if(mode==='copy') {await this.clipboard(files);success=files.length;}
75: for(const file of files) {try {await copyWithoutOverwrite(file,result.filePaths[0]);success++;} catch {failed++;}}
```

## obsidian-canvas-pdf-viewcard

기준: f2982a6fef74246df3bf8476a1ec2ed83dcdbd07

### src/main.ts

[보관 원문](snapshots/obsidian-canvas-pdf-viewcard/src/main.ts)

```text
34: async onload() {
44: for(const [key,state] of Object.entries(this.settings.cards)){
47: if(canvas===oldPath||canvas.startsWith(oldPath+"/")){
55: this.registerInterval(window.setInterval(()=>this.scan(),1500));
65: for(const [view,observer] of this.observers)if(!views.has(view)){
70: for(const view of views) {
73: if(!this.observers.has(view)){
87: if(!event.repeat){
88: if(event.ctrlKey){mounted.viewer.exitReading();this.openPopup(mounted.file,mounted.viewer.state.page);}
98: for(const node of canvas.nodes.values()){
106: if(existing&&(existing.key!==key||existing.file.path!==file.path||existing.stamp!==file.stat.mtime||existing.subpath!==subpath||!existing.viewer.root.isConnected)){
111: if(m&&node.child&&node.child!==m.child){m.child=node.child;node.child.unload();}
139: if(!node.destroyed&&node.nodeEl.isConnected){
176: onunload() {
```

### src/model.ts

[보관 원문](snapshots/obsidian-canvas-pdf-viewcard/src/model.ts)

```text
1: export type Layout = "single" | "continuous" | "spread" | "spread-continuous";
2: export type Fit = "page" | "width";
3: export interface ViewState { page: number; layout: Layout; fit: Fit; zoom: number | null }
4: export interface CardState extends ViewState { file: string; subpath: string }
5: export interface Settings { cards: Record<string, CardState>; popup: Omit<ViewState, "page"> }
10: export function pageFromSubpath(value = ""): number {
14: export function clampPage(page: number, count: number): number {
17: export function normalizeState(raw: Partial<ViewState> = {}, page = 1): ViewState {
25: export function cardKey(canvasPath: string, id: string): string { return JSON.stringify([canvasPath, id]); }
26: export function cardInitial(saved: CardState | undefined, file: string, subpath: string): ViewState {
31: export function isSpread(layout: Layout): boolean { return layout.startsWith("spread"); }
32: export function isContinuous(layout: Layout): boolean { return layout.endsWith("continuous"); }
33: export function pageRows(count: number, state: ViewState): number[][] {
42: export function fitScale(width: number, height: number, pages: {width: number; height: number}[], fit: Fit): number {
```

### src/pdf-pool.ts

[보관 원문](snapshots/obsidian-canvas-pdf-viewcard/src/pdf-pool.ts)

```text
5: export class PdfPool {
7: constructor(private app: App) {}
```

### src/viewer.ts

[보관 원문](snapshots/obsidian-canvas-pdf-viewcard/src/viewer.ts)

```text
7: export interface ViewerOptions {
18: export class PdfViewer {
56: constructor(parent: HTMLElement, private options: ViewerOptions) {
83: if(!options.popup) {
147: if(this.reading) {e.stopPropagation();return;}
151: if(!options.popup) {e.preventDefault();e.stopPropagation();options.open?.();}
171: toggleReading() {
174: exitReading() {
179: if(this.root.contains(this.root.ownerDocument.activeElement)) {
254: go(page: number) {
264: for(const s of this.slots) {s.task?.cancel();if(s.canvas){s.canvas.width=0;s.canvas.height=0;}}
272: for(const row of rows) {
305: for(const s of this.slots) {
313: if(!this.navigating&&isContinuous(this.state.layout)&&current&&current.page!==this.state.page&&!sameSpread){
323: if(!this.sizes.has(slot.page)){
325: if(Math.abs(size.width-this.fallback.width)>1||Math.abs(size.height-this.fallback.height)>1){
340: if((e as Error)?.name!=="RenderingCancelledException"&&!this.disposed&&slot.el.isConnected){
346: destroy() {
```

## canvas-palette

기준: de8172f3fbdfe002abf0fcc9ac05eb375c226a24

### src/canvas/canvas-adapter.ts

[보관 원문](snapshots/canvas-palette/src/canvas/canvas-adapter.ts)

```text
23: export interface CanvasRuntimeNodeLike {
34: export interface CanvasContext { file: TFile; view: CanvasViewLike; runtime: CanvasRuntimeLike; }
35: export interface CanvasExportEntry { id: string; name: string; parentId: string | null; item?: PaletteItem; }
36: export interface CanvasOutlineSelection { canvasPath: string; title: string; items: PaletteItem[]; nodeIds: string[]; edges: Array<{ fromNode: string; toNode: string }>; positions: Record<string, { x: number; y: number }
37: export interface CanvasCutSelection { item: PaletteItem; canvasPath: string; remainingNodeIds: Set<string>; }
38: export interface ExportBundle {
47: export type BundleDuplicateMode = "replace" | "copy";
48: export type PlacementCollisionPolicy = "allow-overlap" | "avoid-content-overlap";
59: export class CanvasAdapter {
```

### src/canvas/canvas-caption-control.ts

[보관 원문](snapshots/canvas-palette/src/canvas/canvas-caption-control.ts)

```text
6: export class CanvasCaptionControl {
12: constructor(private readonly plugin: CanvasPalettePlugin, private readonly adapter: CanvasAdapter) {}
```

### src/canvas/canvas-metadata-controller.ts

[보관 원문](snapshots/canvas-palette/src/canvas/canvas-metadata-controller.ts)

```text
7: export class CanvasMetadataController {
23: constructor(private readonly plugin: CanvasPalettePlugin, private readonly adapter: CanvasAdapter) {}
```

### src/canvas/canvas-node-toolbar-controller.ts

[보관 원문](snapshots/canvas-palette/src/canvas/canvas-node-toolbar-controller.ts)

```text
23: export class CanvasNodeToolbarController {
29: constructor(private readonly adapter: CanvasAdapter, private readonly actions: CanvasNodeToolbarActions) {}
```

### src/canvas/export-placement-controller.ts

[보관 원문](snapshots/canvas-palette/src/canvas/export-placement-controller.ts)

```text
7: export class ExportPlacementController {
13: constructor(private readonly adapter: CanvasAdapter) {}
```

### src/canvas/group-serializer.ts

[보관 원문](snapshots/canvas-palette/src/canvas/group-serializer.ts)

```text
3: export interface RestoredGroupSnapshot extends GroupSnapshot {
8: export function serializeGroup(nodes: CanvasNodeSnapshot[], edges: CanvasEdgeSnapshot[]): GroupSnapshot {
22: export function restoreGroup(snapshot: GroupSnapshot, x: number, y: number, nodeIdFactory: () => string, edgeIdFactory: () => string): RestoredGroupSnapshot {
```

### src/canvas/palette-drop-controller.ts

[보관 원문](snapshots/canvas-palette/src/canvas/palette-drop-controller.ts)

```text
9: export class PaletteDropController {
10: constructor(private readonly store: PaletteStore, private readonly canvas: CanvasAdapter) {}
```

### src/canvas/placement-collision.ts

[보관 원문](snapshots/canvas-palette/src/canvas/placement-collision.ts)

```text
1: export interface PlacementBounds {
23: export function bundleContentCollides(
```

### src/canvas/text-scrap-highlights.ts

[보관 원문](snapshots/canvas-palette/src/canvas/text-scrap-highlights.ts)

```text
7: export class TextScrapHighlights {
8: constructor(private readonly plugin: CanvasPalettePlugin) {}
14: constructor(view: EditorView) { this.decorations = buildDecorations(view, plugin); }
```

### src/core/canvas-node-presence.ts

[보관 원문](snapshots/canvas-palette/src/core/canvas-node-presence.ts)

```text
1: export function mergeCanvasNodeIds(savedNodeIds: Set<string>, openNodeIds: Set<string>): Set<string> {
```

### src/core/canvas-node-replacement.ts

[보관 원문](snapshots/canvas-palette/src/core/canvas-node-replacement.ts)

```text
3: export interface MarkdownNodeReplacement {
8: export function findMarkdownNodeReplacement(previousNodes: Map<string, CanvasNodeSnapshot>, currentNodes: Map<string, CanvasNodeSnapshot>, linkedNodeIds: string[], maximumDistance = 48): MarkdownNodeReplacement | null {
```

### src/core/defaults.ts

[보관 원문](snapshots/canvas-palette/src/core/defaults.ts)

```text
30: export function migrateData(raw: Partial<PaletteData> | null | undefined): PaletteData {
```

### src/core/highlight-export.ts

[보관 원문](snapshots/canvas-palette/src/core/highlight-export.ts)

```text
1: export type HighlightExportDestination = "canvas" | "side" | "mini";
2: export type HighlightCanvasLayout = "bundle" | "mindmap";
6: export interface HighlightBlock {
12: export function extractHighlights(source: string): HighlightBlock[] {
```

### src/core/ids.ts

[보관 원문](snapshots/canvas-palette/src/core/ids.ts)

```text
1: export function createId(prefix: string): string {
```

### src/core/media.ts

[보관 원문](snapshots/canvas-palette/src/core/media.ts)

```text
4: export function fileExtension(path: string | undefined): string {
10: export function isVideoPath(path: string | undefined): boolean {
```

### src/core/serial-task-queue.ts

[보관 원문](snapshots/canvas-palette/src/core/serial-task-queue.ts)

```text
1: export class SerialTaskQueue {
```

### src/core/store.ts

[보관 원문](snapshots/canvas-palette/src/core/store.ts)

```text
7: export type StoreChange = { kind: "selection"; surface: "side" | "mini" } | { kind: "items"; itemIds: string[] } | { kind: "ui"; surface: "mini" } | { kind: "all" };
10: export class PaletteStore {
17: constructor(private readonly plugin: CanvasPalettePlugin) {}
```

### src/core/types.ts

[보관 원문](snapshots/canvas-palette/src/core/types.ts)

```text
1: export type PaletteItemType = "card" | "markdown" | "image" | "video" | "link" | "group";
2: export type PaletteTheme = "obsidian" | "light" | "dark";
3: export type AccentMode = "obsidian" | "custom";
4: export type AssetViewMode = "grid" | "list";
5: export type CardFace = "front" | "back";
6: export type WorkspaceKind = "general" | "canvas" | "archive";
7: export type WorkspaceExplorerViewMode = "list" | "details" | "icons";
8: export type WorkspaceExplorerSort = "modified-desc" | "modified-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc";
10: export interface TextSourceRange { from: { line: number; ch: number }; to: { line: number; ch: number }; }
11: export interface ItemOrigin { canvasPath?: string; canvasNodeId?: string; workspaceId?: string; filePath?: string; textRange?: TextSourceRange; }
12: export interface CanvasPlacement { canvasPath: string; nodeIds: string[]; placedAt: number; }
14: export interface NumberedCanvasLink { canvasPath: string; nodeId: string; number: number; total: number; }
15: export interface PaletteMetadata { tags: string[]; label: string; labelColor?: string; caption: string; /** Legacy stored value retained for compatibility; Canvas now uses PaletteSettings.canvasCaptionFontSize. */ captio
17: export interface CanvasNodeSnapshot {
34: export interface CanvasEdgeSnapshot {
45: export interface GroupSnapshot {
56: export interface GroupDecompositionInput {
63: export interface PaletteItem {
101: export interface Collection { id: string; workspaceId: string; parentId: string | null; /** Mutually exclusive with parentId. */ parentItemId?: string | null; name: string; childCollectionIds: string[]; itemIds: string[]
103: export interface OutlineSelectionTarget { kind: "collection" | "item"; id: string; }
105: export interface SideLayoutState {
118: export interface PaletteWorkspace {
136: export interface OutlineStructure { id: string; canvasPath: string; rule: "edge" | "position"; rootItemIds: string[]; childItemIds: Record<string, string[]>; itemIds: string[]; }
138: export interface PaletteSettings {
150: export interface MiniPaletteState {
174: export interface QuickEditorGeometry { x: number | null; y: number | null; width: number | null; height: number | null; }
175: export interface WorkspaceExplorerGeometry extends QuickEditorGeometry { collapsed: boolean; expandedCanvasPaths: string[]; }
177: export interface UIState {
190: export interface PaletteData {
```

### src/editor/editor-manager.ts

[보관 원문](snapshots/canvas-palette/src/editor/editor-manager.ts)

```text
6: export class PaletteEditorManager {
8: constructor(private readonly app: App, private readonly plugin: CanvasPalettePlugin) {}
```

### src/editor/floating-editor.ts

[보관 원문](snapshots/canvas-palette/src/editor/floating-editor.ts)

```text
5: export class FloatingEditor {
```

### src/editor/native-markdown-editor.ts

[보관 원문](snapshots/canvas-palette/src/editor/native-markdown-editor.ts)

```text
3: export interface PaletteEditorTarget {
16: export class NativeMarkdownEditor {
21: constructor(private readonly app: App, private readonly target: PaletteEditorTarget) {}
```

### src/main.ts

[보관 원문](snapshots/canvas-palette/src/main.ts)

```text
88: this.addCommand({ id: "open-side-palette", name: "Open Side Palette", callback: () => void this.activateSidePalette() });
89: this.addCommand({ id: "open-mini-palette", name: "Toggle Mini Palette on Canvas", callback: () => this.miniPalette.toggle() });
90: this.addCommand({ id: "collect-canvas-selection", name: "Collect selected Canvas items", callback: () => void this.collectCanvasSelection() });
91: this.addCommand({ id: "cut-canvas-selection", name: "Cut selected Canvas items to Mini Palette", callback: () => void this.cutCanvasSelection() });
92: this.addCommand({ id: "collect-selected-text", name: "Collect selected text as card", editorCheckCallback: (checking, editor, view) => {
98: this.addCommand({ id: "new-workspace", name: "Create workspace", callback: () => {
```

### src/mini-palette/floating-mini-palette.ts

[보관 원문](snapshots/canvas-palette/src/mini-palette/floating-mini-palette.ts)

```text
12: export class FloatingMiniPalette {
36: constructor(private readonly plugin: CanvasPalettePlugin) {}
```

### src/preview/preview-service.ts

[보관 원문](snapshots/canvas-palette/src/preview/preview-service.ts)

```text
5: export class PreviewService {
8: constructor(private readonly app: App, private readonly component: Component) {}
```

### src/search/search-service.ts

[보관 원문](snapshots/canvas-palette/src/search/search-service.ts)

```text
3: export interface SearchItemContext { groupNames?: string[]; unlinked?: boolean; }
5: export class SearchService {
```

### src/settings/settings-tab.ts

[보관 원문](snapshots/canvas-palette/src/settings/settings-tab.ts)

```text
4: export class CanvasPaletteSettingTab extends PluginSettingTab {
5: constructor(private readonly plugin: CanvasPalettePlugin) { super(plugin.app, plugin); }
```

### src/side-palette/side-palette-view.ts

[보관 원문](snapshots/canvas-palette/src/side-palette/side-palette-view.ts)

```text
14: export class SidePaletteView extends ItemView {
44: constructor(leaf: WorkspaceLeaf, private readonly plugin: CanvasPalettePlugin) { super(leaf); }
```

### src/ui/asset-density.ts

[보관 원문](snapshots/canvas-palette/src/ui/asset-density.ts)

```text
20: export function clampPreviewFontSize(value: number | undefined): number {
25: export function clampAssetDensity(value: number | undefined): number {
29: export function assetDensityLabel(value: number): string { return STEPS[clampAssetDensity(value)].label; }
30: export function assetViewMode(value: number): AssetViewMode { return clampAssetDensity(value) === 0 ? "list" : "grid"; }
31: export function nextAssetDensity(value: number, deltaY: number): number { return deltaY === 0 ? clampAssetDensity(value) : clampAssetDensity(value + (deltaY < 0 ? 1 : -1)); }
33: export function legacyDensity(viewMode: AssetViewMode | undefined, cardHeight: number | undefined): number {
43: export function applyAssetDensity(element: HTMLElement, value: number, prefix: "cp-grid" | "cp-asset-grid", preferredPreviewFontSize = PREVIEW_FONT_SIZE_DEFAULT): number {
```

### src/ui/find-link-modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/find-link-modal.ts)

```text
4: export class FindLinkModal extends Modal {
7: constructor(app: App, private readonly itemTitle: string, private readonly locations: NumberedCanvasLink[], private readonly onChoose: (location: NumberedCanvasLink) => void) { super(app); }
```

### src/ui/highlight-export-modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/highlight-export-modal.ts)

```text
5: export class HighlightExportModal extends Modal {
6: constructor(app: App, private readonly count: number, private readonly onChoose: (destination: HighlightExportDestination) => void) { super(app); }
34: export class HighlightCanvasLayoutModal extends Modal {
35: constructor(app: App, private readonly onChoose: (layout: HighlightCanvasLayout) => void) { super(app); }
```

### src/ui/item-preview-modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/item-preview-modal.ts)

```text
5: export class ItemPreviewModal extends Modal {
9: constructor(app: App, private readonly plugin: CanvasPalettePlugin, private readonly itemId: string) { super(app); }
```

### src/ui/label-color-picker.ts

[보관 원문](snapshots/canvas-palette/src/ui/label-color-picker.ts)

```text
3: export interface LabelColorPicker {
7: export function createLabelColorPicker(parent: HTMLElement, initialValue: string | undefined, savedCustomColors: string[], onAddCustomColor: (color: string) => void): LabelColorPicker {
```

### src/ui/linked-spaces-modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/linked-spaces-modal.ts)

```text
4: export class LinkedSpacesModal extends Modal {
5: constructor(app: App, private readonly items: PaletteItem[], private readonly activeQuery: string, private readonly hasToken: (token: string) => boolean, private readonly onFilter: (token: string | null) => void, private
42: constructor(app: App, private readonly path: string, private readonly count: number, private readonly onConfirm: () => void) { super(app); }
```

### src/ui/modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/modal.ts)

```text
6: export class MetadataEditorModal extends Modal {
33: export class TextPromptModal extends Modal {
35: constructor(app: App, private readonly title: string, initial: string, private readonly onSubmit: (value: string) => unknown | Promise<unknown>, private readonly placeholder = "") { super(app); this.value = initial; }
50: export class OutlineStructureRuleModal extends Modal {
51: constructor(app: App, private readonly onSubmit: (folderName: string) => void) { super(app); }
71: export class GroupDecompositionModal extends Modal {
72: constructor(app: App, private readonly groupName: string, private readonly folderCount: number, private readonly itemCount: number, private readonly onConfirm: () => void) { super(app); }
85: export class CanvasWorkspaceModal extends Modal {
87: constructor(app: App, private readonly canvasName: string, private readonly onSubmit: (value: string) => void) { super(app); }
110: export class TextScrapWorkspaceModal extends Modal {
111: constructor(app: App, private readonly workspaces: PaletteWorkspace[], private readonly currentWorkspaceId: string | null, private readonly onSave: (workspaceId: string) => void) { super(app); }
142: export class DeletedCanvasWorkspacesModal extends Modal {
145: constructor(app: App, private readonly canvasName: string, private readonly workspaces: PaletteWorkspace[], private readonly itemCount: (id: string) => number, private readonly onApply: (choices: Map<string, "general" | 
181: export class ConfirmDeleteModal extends Modal {
182: constructor(app: App, private readonly count: number, private readonly onConfirm: () => void) { super(app); }
194: export class ConfirmMiniStorageRemovalModal extends Modal {
195: constructor(app: App, private readonly count: number, private readonly onConfirm: () => void) { super(app); }
207: export class ConfirmForeignCanvasWorkspaceModal extends Modal {
208: constructor(app: App, private readonly workspaceName: string, private readonly onConfirm: () => void) { super(app); }
221: export class AlreadySavedToWorkspaceModal extends Modal {
222: constructor(app: App, private readonly workspaceName: string, private readonly savedCount: number, private readonly alreadySavedCount: number) { super(app); }
234: export class ConfirmDeleteCollectionModal extends Modal {
235: constructor(app: App, private readonly name: string, private readonly destination: string, private readonly itemCount: number, private readonly childCount: number, private readonly onRemoveCollectionOnly: () => void, pri
250: export class ConfirmDeleteItemCollectionModal extends Modal {
251: constructor(app: App, private readonly name: string, private readonly destination: string, private readonly itemCount: number, private readonly childCount: number, private readonly onRemoveItemOnly: () => void, private r
266: export class ConfirmCanvasReplacementModal extends Modal {
268: constructor(app: App, private readonly onResolve: (confirmed: boolean) => void) { super(app); }
289: export class CanvasTargetModal extends Modal {
292: constructor(app: App, private readonly files: TFile[], activePath: string | null, private readonly onResolve: (file: TFile | null) => void) { super(app); this.selectedPath = activePath && files.some((file) => file.path =
318: export class ConfirmExportDuplicateModal extends Modal {
320: constructor(app: App, private readonly count: number, private readonly onResolve: (choice: "replace" | "copy" | null) => void) { super(app); }
334: export class TagLabelModal extends Modal {
337: constructor(app: App, private readonly plugin: CanvasPalettePlugin, private readonly itemIds: string[]) { super(app); }
548: export class CardToMarkdownModal extends Modal {
549: constructor(app: App, private readonly initialName: string, private readonly initialFolder: string, private readonly onConvert: (fileName: string, folder: string) => Promise<boolean>) { super(app); }
573: export class MoveItemsModal extends Modal {
576: constructor(app: App, private readonly workspaceName: string, private readonly collections: Collection[], private readonly count: number, private readonly onMove: (collectionId: string | null) => void) { super(app); }
622: export class ItemEditorModal extends Modal {
623: constructor(app: App, private readonly plugin: CanvasPalettePlugin, private readonly itemId: string) { super(app); }
```

### src/ui/render.ts

[보관 원문](snapshots/canvas-palette/src/ui/render.ts)

```text
15: export function iconButton(parent: HTMLElement, icon: string, label: string, onClick: () => void): HTMLButtonElement {
22: export type MarkdownSourceStatus = "deleted";
23: export interface ItemRenderOptions { selected: boolean; showSelectionMarker?: boolean; compact?: boolean; draggable?: boolean; dragItemIds?: string[]; miniCollect?: boolean; currentFace?: CardFace; unlinked?: boolean; ma
25: export function supportsFrontBack(item: PaletteItem): boolean { return item.type !== "group" && item.type !== "link"; }
31: export function withItemReuse(root: HTMLElement | undefined, render: () => void): void {
38: export function wasItemReused(card: HTMLElement): boolean { return reusedItems.has(card); }
40: export function renderItem(parent: HTMLElement, item: PaletteItem, options: ItemRenderOptions & { previewKey?: string }): HTMLElement {
179: export function renderPreviewInCard(service: PreviewService, parent: HTMLElement, item: PaletteItem): void { void service.render(parent, item, true); }
181: export function workspaceSelect(plugin: CanvasPalettePlugin, parent: HTMLElement, value: string | null, onChange: (id: string) => void): HTMLSelectElement {
```

### src/ui/resizable.ts

[보관 원문](snapshots/canvas-palette/src/ui/resizable.ts)

```text
38: export function makeHorizontalDivider(divider: HTMLElement, onMove: (clientX: number) => void, onEnd?: () => void): void {
42: export function makeVerticalDivider(divider: HTMLElement, onMove: (clientY: number) => void, onEnd?: () => void): void {
```

### src/ui/responsive-layout.ts

[보관 원문](snapshots/canvas-palette/src/ui/responsive-layout.ts)

```text
1: export type MiniLayoutMode = "wide" | "medium" | "narrow" | "minimum";
2: export type SideLayoutMode = "wide" | "medium" | "very-narrow";
3: export type FlyoutSide = "left" | "right";
8: export function miniLayoutMode(width: number): MiniLayoutMode {
15: export function sideLayoutMode(width: number): SideLayoutMode {
21: export interface FlyoutPlacement {
28: export function attachedFlyoutPlacement(
```

### src/ui/workspace-explorer-modal.ts

[보관 원문](snapshots/canvas-palette/src/ui/workspace-explorer-modal.ts)

```text
9: export class WorkspaceExplorerModal {
13: constructor(private readonly app: App, private readonly plugin: CanvasPalettePlugin) {}
```

