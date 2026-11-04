import type UctPlugin from './main';
const {createLabelColorPicker}=require('../vendor/palette/src/ui/label-color-picker');
export class MetadataEditor {
  private closeActive?:()=>void;
  private keyTarget?:{host:HTMLElement;finish:(save:boolean)=>void};
  constructor(private root:UctPlugin){root.register(()=>this.closeActive?.());}
  handleKey(event:KeyboardEvent){
    const target=this.keyTarget;if(!target||!target.host.contains(event.target as Node))return false;
    event.stopImmediatePropagation();
    if(event.isComposing)return true;
    if(event.key==='Enter'||event.key==='Escape'){event.preventDefault();target.finish(event.key==='Enter');}
    return true;
  }
  label(view:any,node:any,showColors=false){
    if(!node||view.canvas.readonly)return;this.closeActive?.();
    const path=this.root.spaceKey(view.file.path,view),id=node.id;
    const old=this.root.palette.store.data.canvasNodeMetadata[path]?.[id]??this.root.metadata(view.file.path,id,view)??{};
    const host:HTMLElement=node.nodeEl.createDiv({cls:'uct-label-editor '+(showColors?'is-colors':'is-compact'),attr:{role:'dialog','aria-label':'라벨 편집'}});
    const input=host.createEl('input',{value:old.label||'라벨',attr:{'aria-label':'라벨 이름'}});
    const picker=showColors?createLabelColorPicker(host,old.labelColor,this.root.palette.store.data.settings.labelColorPresets??[],(c:string)=>this.root.palette.store.addLabelColorPreset(c)):undefined;
    let done=false;
    const finish=(save:boolean)=>{if(done)return;done=true;document.removeEventListener('pointerdown',outside,true);host.remove();this.closeActive=undefined;this.keyTarget=undefined;if(save){this.root.palette.store.setMetadataRecord(path,id,{...old,tags:[],label:input.value.trim(),labelColor:picker?.value??old.labelColor??'#7c3aed',caption:old.caption??''},Date.now());this.root.palette.store.changed();if(this.root.canvasRuntime)this.root.canvasRuntime.changed(view,'metadata',[id]);else void this.root.modules.outliner.refresh();}view.canvas.wrapperEl.focus();};
    const outside=(e:PointerEvent)=>{if(!host.contains(e.target as Node))finish(true);};
    for(const event of ['pointerdown','mousedown','click','dblclick'])host.addEventListener(event,e=>e.stopPropagation());
    host.addEventListener('keydown',e=>{e.stopPropagation();if(e.isComposing)return;if(e.key==='Enter'){e.preventDefault();finish(true);}if(e.key==='Escape'){e.preventDefault();finish(false);}},true);
    document.addEventListener('pointerdown',outside,true);this.closeActive=()=>finish(false);this.keyTarget={host,finish};input.focus();input.select();
  }
}
