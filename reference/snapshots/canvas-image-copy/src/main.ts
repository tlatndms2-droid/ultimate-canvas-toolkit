import { Plugin, Notice, Menu, FileSystemAdapter, TFile } from 'obsidian';
import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { isImage, copyWithoutOverwrite } from './files';

type CanvasNode = { getData(): {type?:string;file?:string}; canvas?:Canvas };
type Canvas = {selection:Set<CanvasNode>};
const COPY='선택한 이미지를 클립보드에 복사';
const SAVE='선택한 이미지를 폴더에 저장…';

export default class CanvasImageCopy extends Plugin {
  private busy=false;
  onload() {
    if(process.platform!=='win32') { new Notice('Canvas Image Copy는 Windows 전용입니다.'); return; }
    for(const [id,name,mode] of [['copy-selected-images',COPY,'copy'],['save-selected-images',SAVE,'save']] as const) {
      this.addCommand({id,name,checkCallback:checking=>{
        const c=this.currentCanvas(); const enabled=!!c && this.collect(c).files.length>0;
        if(!checking && enabled) void this.run(mode,c!);
        return enabled;
      }});
    }
    const workspace=this.app.workspace as any;
    this.registerEvent(workspace.on('canvas:selection-menu',(menu:Menu,canvas:Canvas)=>this.addMenu(menu,canvas)));
    this.registerEvent(workspace.on('canvas:node-menu',(menu:Menu,node:CanvasNode)=>{
      const c=node.canvas ?? this.currentCanvas(); if(c) this.addMenu(menu,c);
    }));
  }
  private currentCanvas():Canvas|undefined {
    const view=this.app.workspace.activeLeaf?.view as any;
    return view?.getViewType()==='canvas' ? view.canvas : undefined;
  }
  private collect(canvas:Canvas) {
    const files:string[]=[]; const seen=new Set<string>(); let excluded=0,missing=0;
    for(const node of canvas.selection) {
      const data=node.getData?.();
      if(data?.type!=='file' || !data.file || !isImage(data.file)) {excluded++;continue;}
      if(seen.has(data.file)) continue;
      seen.add(data.file);
      const file=this.app.vault.getAbstractFileByPath(data.file);
      if(file instanceof TFile) files.push(file.path); else missing++;
    }
    return {files,excluded,missing};
  }
  private addMenu(menu:Menu,canvas:Canvas) {
    if(!this.collect(canvas).files.length) return;
    menu.addItem(item=>item.setTitle(COPY).setIcon('copy').onClick(()=>void this.run('copy',canvas)));
    menu.addItem(item=>item.setTitle(SAVE).setIcon('folder-down').onClick(()=>void this.run('save',canvas)));
  }
  private async clipboard(files:string[]) {
    const encoded=Buffer.from(JSON.stringify(files),'utf8').toString('base64');
    const script=`$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Windows.Forms; $files=ConvertFrom-Json ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}'))); $list=New-Object System.Collections.Specialized.StringCollection; foreach($file in $files){[void]$list.Add($file)}; [Windows.Forms.Clipboard]::SetFileDropList($list)`;
    const exe=path.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
    await new Promise<void>((resolve,reject)=>execFile(exe,['-NoProfile','-NonInteractive','-STA','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:15000},error=>error?reject(error):resolve()));
  }
  private async run(mode:'copy'|'save',canvas:Canvas) {
    if(this.busy) {new Notice('이미지 처리 중입니다. 잠시 기다려 주세요.');return;}
    this.busy=true;
    try {
      const selection=this.collect(canvas);
      const adapter=this.app.vault.adapter;
      if(!(adapter instanceof FileSystemAdapter)) throw Error('로컬 Vault만 지원합니다.');
      const files:string[]=[]; let failed=selection.missing;
      for(const file of selection.files) {
        const absolute=adapter.getFullPath(file);
        try {await access(absolute);files.push(absolute);} catch {failed++;}
      }
      if(!files.length) {new Notice(`처리할 이미지가 없습니다. 제외 ${selection.excluded}개 · 실패 ${failed}개`);return;}
      let success=0;
      if(mode==='copy') {await this.clipboard(files);success=files.length;}
      else {
        const remote=require('@electron/remote');
        const result=await remote.dialog.showOpenDialog({title:'이미지를 저장할 폴더 선택',buttonLabel:'이 폴더에 저장',properties:['openDirectory']});
        if(result.canceled || !result.filePaths[0]) return;
        for(const file of files) {try {await copyWithoutOverwrite(file,result.filePaths[0]);success++;} catch {failed++;}}
      }
      const suffix=(selection.excluded || failed)?` (제외 ${selection.excluded}개 · 실패 ${failed}개)`:'';
      new Notice(`이미지 ${success}개를 ${mode==='copy'?'클립보드에 복사':'선택한 폴더에 저장'}했습니다${suffix}`);
    } catch(error) {console.error('Canvas Image Copy:',error);new Notice('이미지 처리에 실패했습니다. 폴더 권한 또는 클립보드 사용 상태를 확인해 주세요.');}
    finally {this.busy=false;}
  }
}
