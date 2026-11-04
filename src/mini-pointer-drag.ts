/** Own the temporary Shift-drag listeners until release, cancellation or Mini teardown. */
export function beginMiniPointerDrag(card:HTMLElement,event:PointerEvent,placement:{start(ids:string[]):void;trackPointer(event:PointerEvent,finish?:boolean):unknown;cancel():void},ids:string[]):(()=>void)|undefined {
 if(!event.shiftKey||event.button!==0)return;
 event.preventDefault();event.stopPropagation();card.draggable=false;
 const doc=card.ownerDocument,x=event.clientX,y=event.clientY,pointer=event.pointerId;
 let started=false,finished=false;
 const capture={capture:true};
 const cleanup=()=>{if(finished)return;finished=true;doc.removeEventListener('pointermove',move,capture);doc.removeEventListener('pointerup',up,capture);doc.removeEventListener('pointercancel',cancelPointer,capture);doc.removeEventListener('keydown',key,capture);card.draggable=true;if(card.hasPointerCapture?.(pointer))card.releasePointerCapture(pointer);};
 const cancel=()=>{cleanup();if(started)placement.cancel();};
 const move=(ev:PointerEvent)=>{if(ev.pointerId!==pointer)return;if(!started&&Math.hypot(ev.clientX-x,ev.clientY-y)>6){started=true;placement.start(ids);}if(started)placement.trackPointer(ev);};
 const up=(ev:PointerEvent)=>{if(ev.pointerId!==pointer)return;cleanup();if(!started)return;
  // Suppress only the compatibility click from this gesture, never later selections.
  const suppress=(click:MouseEvent)=>{click.preventDefault();click.stopImmediatePropagation();};
  card.addEventListener('click',suppress,{capture:true,once:true});
  setTimeout(()=>card.removeEventListener('click',suppress,capture),0);
  void placement.trackPointer(ev,true);
 };
 const cancelPointer=(ev:PointerEvent)=>{if(ev.pointerId===pointer)cancel();};
 const key=(ev:KeyboardEvent)=>{if(ev.key==='Escape')cancel();};
 doc.addEventListener('pointermove',move,capture);doc.addEventListener('pointerup',up,capture);doc.addEventListener('pointercancel',cancelPointer,capture);doc.addEventListener('keydown',key,capture);
 try{card.setPointerCapture?.(pointer);}catch{/* A detached pointer is still cancelled by teardown. */}
 return cancel;
}
