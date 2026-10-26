import {setIcon} from 'obsidian';

export function addPin(modal:HTMLElement, read:()=>boolean, write:(value:boolean)=>void) {
 const button=modal.createEl('button',{cls:'co-window-pin',attr:{'aria-label':'창 고정'}});
 const render=()=>{const pinned=read();button.setAttribute('aria-pressed',String(pinned));button.setAttribute('aria-label',pinned?'창 고정 해제':'창 고정');button.title=pinned?'고정 해제 · 바깥 클릭 시 닫기':'창 고정 · 바깥 클릭해도 유지';setIcon(button,pinned?'pin-off':'pin');};
 button.onpointerdown=e=>e.stopPropagation();
 button.onclick=e=>{e.stopPropagation();write(!read());render();};
 render();
}
