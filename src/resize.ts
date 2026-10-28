/** Continuous invisible resize strips; the whole border is draggable. */
export function resizable(panel:HTMLElement,minWidth=360,minHeight=320,onResize=()=>{}) {
  const doc=panel.ownerDocument, win=doc.defaultView!;
  const abort=new AbortController();
  for(const edge of ['n','s','e','w','ne','nw','se','sw']) {
    const grip=panel.createDiv({cls:'uct-resize-edge uct-resize-'+edge});
    grip.onpointerdown=e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();grip.setPointerCapture(e.pointerId);
      const r=panel.getBoundingClientRect(), x=e.clientX,y=e.clientY;
      const move=(ev:PointerEvent)=>{
        let l=r.left,t=r.top,rr=r.right,b=r.bottom;
        if(edge.includes('w'))l=Math.max(0,Math.min(rr-Math.min(minWidth,win.innerWidth),r.left+ev.clientX-x));
        if(edge.includes('e'))rr=Math.min(win.innerWidth,Math.max(l+Math.min(minWidth,win.innerWidth),r.right+ev.clientX-x));
        if(edge.includes('n'))t=Math.max(0,Math.min(b-Math.min(minHeight,win.innerHeight),r.top+ev.clientY-y));
        if(edge.includes('s'))b=Math.min(win.innerHeight,Math.max(t+Math.min(minHeight,win.innerHeight),r.bottom+ev.clientY-y));
        Object.assign(panel.style,{left:l+'px',top:t+'px',width:(rr-l)+'px',height:(b-t)+'px'});onResize();
      };
      const end=()=>{grip.removeEventListener('pointermove',move);grip.removeEventListener('pointerup',end);grip.removeEventListener('pointercancel',end);};
      grip.addEventListener('pointermove',move,{signal:abort.signal});grip.addEventListener('pointerup',end,{signal:abort.signal});grip.addEventListener('pointercancel',end,{signal:abort.signal});
    };
  }
  return ()=>{abort.abort();panel.querySelectorAll('.uct-resize-edge').forEach(el=>el.remove());};
}
