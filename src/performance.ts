/** Project out Mini-owned data before cloning; never mutate the live store. */
export function paletteSettings<T extends {uiState:any}>(source:T):T {
 const data=structuredClone({...source,items:{},pendingItemIds:[],workspaces:{},collections:{}});
 data.uiState.activeWorkspaceId=null;
 data.uiState.pendingCanvasWorkspaceCleanup=[];
 return data;
}
