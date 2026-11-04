/** Wait for an active Obsidian Canvas save before disk verification.
 * The journal verifies the file; an unresolved save must keep recovery data.
 */
export async function waitForActiveCanvasSave(view:{saving?:boolean;saveAgain?:boolean}, wait:(ms:number)=>Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)), now:()=>number = ()=>globalThis.performance?.now?.()??Date.now()):Promise<boolean> {
  const deadline=now()+30000;
  while ((view.saving === true || view.saveAgain === true) && now() < deadline) await wait(40);
  return view.saving !== true && view.saveAgain !== true;
}
