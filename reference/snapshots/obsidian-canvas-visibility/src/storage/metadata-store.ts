import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "../settings/settings";
import type { CanvasState, CanvasVisibilitySettings, FoldNodeState, PluginData } from "../types";

const EMPTY_DATA: PluginData = {
  settings: { ...DEFAULT_SETTINGS },
  canvases: {}
};

export class MetadataStore {
  private data: PluginData = structuredClone(EMPTY_DATA);

  constructor(private readonly plugin: Plugin) {}

  async load(): Promise<void> {
    const loaded = await this.plugin.loadData() as Partial<PluginData> | null;
    this.data = {
      settings: { ...DEFAULT_SETTINGS, ...(loaded?.settings ?? {}) },
      canvases: loaded?.canvases ?? {}
    };
  }

  get settings(): CanvasVisibilitySettings {
    return this.data.settings;
  }

  getCanvas(canvasPath: string): CanvasState | undefined {
    return this.data.canvases[canvasPath];
  }

  getNode(canvasPath: string, nodeId: string): FoldNodeState | undefined {
    return this.data.canvases[canvasPath]?.nodes[nodeId];
  }

  setNode(canvasPath: string, nodeId: string, state: FoldNodeState): void {
    const canvas = this.data.canvases[canvasPath] ?? { nodes: {} };
    canvas.nodes[nodeId] = state;
    this.data.canvases[canvasPath] = canvas;
  }

  deleteNode(canvasPath: string, nodeId: string): void {
    const canvas = this.data.canvases[canvasPath];
    if (!canvas) return;
    delete canvas.nodes[nodeId];
    if (Object.keys(canvas.nodes).length === 0) delete this.data.canvases[canvasPath];
  }

  renameCanvas(oldPath: string, newPath: string): boolean {
    const state = this.data.canvases[oldPath];
    if (!state || oldPath === newPath) return false;
    this.data.canvases[newPath] = state;
    delete this.data.canvases[oldPath];
    return true;
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.data);
  }
}
