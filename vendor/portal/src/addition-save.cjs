// Keep the native Canvas save state machine and Vault.modify's queued write.
// Only the known redundant pre-queue barrier is removed for our additive save.
const guardedWrite=Symbol.for('ultimate-canvas-toolkit.verified-file-write');
function supportsQueueOnce(original){
  const source=Function.prototype.toString.call(original).replace(/\s+/g,'');
  const shape=source.match(/^asyncwriteData\((\w+),(\w+),(\w+)\)\{let\{vault:(\w+)\}=this\.app;try\{await(\w+)\(\4\.adapter\.promise\),await\4\.modify\(\1,\2\)\}catch\((\w+)\)\{throwthis\.lastSavedData=\3,console\.error\(\6\),new\w+\(/);
  return !!shape&&source.endsWith(`this.app.fileManager.storeTextFileBackup(${shape[1]}.path,${shape[2]}),${shape[6]}}}`);
}
async function writeAddition(view,original,args,active,onError){
  const vault=view.app?.vault;
  if(!active||!supportsQueueOnce(original)||!vault?.adapter?.write?.[guardedWrite]||typeof vault.getAbstractFileByPath!=='function')return original.apply(view,args);
  const [file,text,previous]=args;
  const expectedPath=file.path,canvas=view.canvas;
  const verify=()=>{if(file.deleted||file.path!==expectedPath||view.file!==file||view.canvas!==canvas||vault.getAbstractFileByPath(expectedPath)!==file)throw Error('배치 대상 Canvas가 변경되어 저장을 중단했습니다. Mini 원본은 유지합니다.');};
  try{return await vault.modify(file,text,{__uctVerifyCanvas:verify});}
  catch(error){
    view.lastSavedData=previous;
    try{view.app.fileManager.storeTextFileBackup(file.path,text);}catch(backupError){console.error('Canvas failed-save backup',backupError);}
    onError(error);throw error;
  }
}
module.exports={supportsQueueOnce,writeAddition,guardedWrite};
