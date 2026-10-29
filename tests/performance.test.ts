import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paletteSettings} from '../src/performance.ts';

test('Palette settings projection preserves the old persisted result and live store',()=>{
 const source={items:{a:{nodes:[{id:'n',text:'content'}]}},pendingItemIds:['a'],workspaces:{w:{}},collections:{c:{}},uiState:{activeWorkspaceId:'w',pendingCanvasWorkspaceCleanup:['x'],width:400},canvasNodeMetadata:{canvas:{n:{caption:'caption'}}}};
 const before=structuredClone(source),expected=structuredClone(source);
 expected.items={} as any;expected.pendingItemIds=[];expected.workspaces={} as any;expected.collections={} as any;expected.uiState.activeWorkspaceId=null as any;expected.uiState.pendingCanvasWorkspaceCleanup=[];
 const actual=paletteSettings(source);
 assert.deepEqual(actual,expected);assert.deepEqual(source,before);
 actual.canvasNodeMetadata.canvas.n.caption='changed';assert.equal(source.canvasNodeMetadata.canvas.n.caption,'caption');
});

test('Excluded Mini graphs are not traversed or copied during settings persistence',()=>{
 const graph={get nodes(){throw new Error('Mini graph must not be cloned');}};
 const result=paletteSettings({items:{large:graph},uiState:{activeWorkspaceId:'w'}});
 assert.deepEqual(result.items,{});assert.equal(result.uiState.activeWorkspaceId,null);
});
