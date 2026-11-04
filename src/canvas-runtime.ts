export type CanvasChange='space'|'graph'|'metadata';
export type CanvasNotice={view:any;kinds:Set<CanvasChange>;ids:Set<string>};

/** Shared live context and short-lived reads. No graph survives a render batch. */
export class CanvasRuntime {
 private views:any[]=[];private recent:any=null;private depth=0;private reads=new Map<object,{view:any;canvas:any;path:string;space:string;value:any}>();
 private pending=new Map<any,CanvasNotice>();private listeners=new Set<(change:CanvasNotice)=>void>();private queued=false;private stopped=false;
 private workspace:any;private sessions:()=>Map<any,any>|undefined;private fallback:()=>any;
 constructor(workspace:any,sessions:()=>Map<any,any>|undefined,fallback:()=>any){this.workspace=workspace;this.sessions=sessions;this.fallback=fallback;}
 sync(leaf=this.workspace.activeLeaf){
  if(this.stopped)return;
  this.views=this.workspace.getLeavesOfType('canvas').map((l:any)=>l.view).filter((v:any)=>v?.getViewType?.()==='canvas');
  const v=leaf?.view;if(this.views.includes(v))this.recent=v;else if(!this.views.includes(this.recent))this.recent=null;
 }
 activate(leaf:any){if(this.stopped)return;const v=leaf?.view;if(v?.getViewType?.()==='canvas'){this.recent=v;if(!this.views.includes(v))this.views.push(v);}}
 all(){return this.stopped?[]:this.views.filter(v=>v?.canvas&&v.file&&v.containerEl?.isConnected!==false);}
 active(){if(this.stopped)return null;const view=this.workspace.activeLeaf?.view;return view?.getViewType?.()==='canvas'&&view.canvas?view:null;}
 current(){if(this.stopped)return undefined;const active=this.active();if(active)return active;const fallback=this.fallback();if(fallback?.getViewType?.()==='canvas'&&fallback.canvas&&fallback.containerEl?.isConnected!==false)return fallback;return this.all().includes(this.recent)?this.recent:this.all()[0];}
 session(view=this.current()){return !this.stopped&&view?this.sessions()?.get(view):undefined;}
 key(path?:string,view=this.current()){const file=path??view?.file?.path??'',s=this.session(view);return s?.current&&s.v.file?.path===file?file+'#uct-portal:'+s.current:file;}
 target(target:EventTarget|null){return this.all().find(v=>v.containerEl?.contains(target));}
 batch<T>(action:()=>T):T{this.depth++;try{return action();}finally{if(--this.depth===0)this.reads.clear();}}
 read<T>(owner:object,view:any,reader:()=>T):T{
  if(!this.depth)return reader();const path=view?.file?.path??'',space=this.key(path,view),cached=this.reads.get(owner);
  if(cached&&cached.view===view&&cached.canvas===view?.canvas&&cached.path===path&&cached.space===space)return cached.value;
  const value=reader();this.reads.set(owner,{view,canvas:view?.canvas,path,space,value});return value;
 }
 changed(view:any,kind:CanvasChange,ids:Iterable<string>=[]){
  this.reads.clear();if(this.stopped||!view)return;let change=this.pending.get(view);if(!change)this.pending.set(view,change={view,kinds:new Set(),ids:new Set()});change.kinds.add(kind);for(const id of ids)change.ids.add(id);
  if(this.queued)return;this.queued=true;queueMicrotask(()=>{this.queued=false;if(this.stopped)return;const changes=[...this.pending.values()];this.pending.clear();for(const change of changes)for(const listener of this.listeners)listener(change);});
 }
 subscribe(listener:(change:CanvasNotice)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 dispose(){this.stopped=true;this.pending.clear();this.reads.clear();this.listeners.clear();this.views=[];this.recent=null;}
}
