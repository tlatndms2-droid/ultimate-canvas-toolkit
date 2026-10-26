import {Modal,Component,TFile,Notice} from 'obsidian';
import type UctPlugin from './main';
import {itemKind} from './item-kind';
const {PreviewService}=require('../vendor/palette/src/preview/preview-service');
export function openItemPreview(root:UctPlugin,id:string){
  const item=root.library.items[id];if(!item)return;const source=item.origin?.filePath??item.sourceReferencePath;const file=source?root.app.vault.getAbstractFileByPath(source):null;
  if(itemKind(item).label==='PDF'){if(file instanceof TFile)root.modules.pdf.openPopup(file,1);else new Notice('원본 PDF가 없습니다.');return;}
  class Preview extends Modal {
    component=new Component();closed=false;
    onOpen(){this.component.load();this.modalEl.addClasses(['canvas-palette','uct-large-preview']);this.setTitle(item.displayTitle);const header=this.contentEl.createDiv({cls:'uct-preview-kind',text:itemKind(item).label});const body=this.contentEl.createDiv({cls:'uct-large-preview-body'});const render=new PreviewService(root.app,this.component,root.modules.pdf.pool);const stored:any=item.uctPreviewGroup?{...item,type:'group',group:item.uctPreviewGroup,cutFromCanvas:false}:{...item,cutFromCanvas:false};
      void (async()=>{try{if(file instanceof TFile&&file.extension.toLowerCase()==='md')stored.content=await root.app.vault.cachedRead(file);if(this.closed)return;
        if(itemKind(item).label==='오디오'&&file instanceof TFile)body.createEl('audio',{attr:{src:root.app.vault.getResourcePath(file),controls:'true'}});
        else if(item.type==='link'&&item.webLink&&render.renderYouTubePlayer(body,item.webLink.url)){}
        else await render.render(body,stored,false,360,root.palette.store.data.uiState.miniItemFaces?.[id]??'front');
      }catch(error){if(!this.closed)body.setText('미리보기를 열 수 없습니다.');}})();
      this.scope.register([],'Escape',()=>{this.close();return false;});
    }
    onClose(){root.previewWindows.delete(this);this.closed=true;this.contentEl.querySelectorAll<HTMLMediaElement>('video,audio').forEach(p=>{p.pause();p.removeAttribute('src');p.load();});this.component.unload();this.contentEl.empty();}
  }
  const preview=new Preview(root.app);root.previewWindows.add(preview);preview.open();
}
