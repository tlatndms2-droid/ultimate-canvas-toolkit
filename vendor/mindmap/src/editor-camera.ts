import {registerRuntimeCleanup} from './runtime-cleanup';
interface Host {
 settings:{followCaret:boolean;editMinZoom:number};
 register(cb:()=>void):void;
}
/** Uses a configurable minimum edit zoom and Canvas' native animation after editor readiness. */
export class EditorCamera {
 private patched=new WeakSet<object>();
 private active:{c:any;n:any;zoom:number;frame:number;ready:boolean;head:number;doc:any;line:number;paused:boolean;retry:number}|null=null;
 constructor(private host:Host){host.register(()=>this.stop());}
 stop(){if(this.active)cancelAnimationFrame(this.active.frame);this.active=null;}
 pause(){if(this.active)this.active.paused=true;}
 resume(){if(this.active)this.active.paused=false;}
 observe(c:any){
  for(const n of c.nodes.values()){
   if(this.patched.has(n))continue;this.patched.add(n);
   const original=n.startEditing,controller=this;
   const wrapper=function(this:any,...args:any[]){
    const entering=!this.isEditing,zoom=c.zoom;
    const result=original.apply(this,args);
    if(entering&&this.isEditing)controller.begin(c,this,zoom);
    return result;
   };
   n.startEditing=wrapper;
   registerRuntimeCleanup(this.host,n,()=>{if(n.startEditing===wrapper)n.startEditing=original;});
  }
 }
 exit(c:any,n:any){
  const a=this.active;
  if(a&&a.c===c&&a.n===n){const zoom=a.zoom;this.stop();c.zoomCenter=null;c.tZoom=zoom;c.markViewportChanged();}
 }
 private begin(c:any,n:any,zoom:number){
  this.stop();
  const a={c,n,zoom,frame:0,ready:false,head:-1,doc:null as any,line:NaN,paused:false,retry:0};this.active=a;
  const tick=()=>{
   if(this.active!==a)return;
   if(!n.isEditing||!n.nodeEl.isConnected){this.stop();return;}
   const cm=n.child?.editMode?.cm;
   if(cm?.dom?.isConnected&&++a.retry>2){
    const head=cm.state.selection.main.head,doc=cm.state.doc;
    if(!a.ready||head!==a.head||doc!==a.doc){
     const pos=cm.coordsAtPos(head);
     if(pos){
      const line=Math.round(pos.top-cm.documentTop);
      const initial=!a.ready;
      if(initial){
       c.tx=n.x+n.width/2;c.ty=n.y+n.height/2;
       const percent=this.host.settings.editMinZoom;
       const minimum=Number.isFinite(percent)&&percent>=6.25&&percent<=200?percent:100;
       c.tZoom=Math.max(Math.log2(minimum/100),a.zoom);c.zoomCenter=null;c.markViewportChanged();
      }
      if(this.host.settings.followCaret&&!a.paused&&(initial||line!==a.line)){
       const frame=cm.dom.ownerDocument.defaultView?.frameElement as HTMLElement|null;
       const rect=frame?.getBoundingClientRect();
       const scale=rect&&frame?.clientHeight?rect.height/frame.clientHeight:1;
       const screenY=rect?rect.top+(pos.top+pos.bottom)/2*scale:(pos.top+pos.bottom)/2;
       const viewport=c.wrapperEl.getBoundingClientRect();
       // Preserve horizontal position and zoom while following visual line changes.
       c.ty=c.y+(screenY-viewport.top-viewport.height/2)/c.scale;
       c.zoomCenter=null;c.markViewportChanged();
      }
      a.ready=true;a.head=head;a.doc=doc;a.line=line;
     }
    }
   }
   a.frame=requestAnimationFrame(tick);
  };
  a.frame=requestAnimationFrame(tick);
 }
}

