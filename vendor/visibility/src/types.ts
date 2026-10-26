import type { TFile } from "obsidian";

export interface CanvasNodeDataLike {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  file?: string;
  [key: string]: unknown;
}

export interface CanvasNodeLike {
  id: string;
  canvas: CanvasLike;
  nodeEl: HTMLElement;
  contentEl?: HTMLElement;
  file?: TFile;
  getData(): CanvasNodeDataLike;
  setData(data: CanvasNodeDataLike, addHistory?: boolean): void;
  render?(): void;
}

export interface CanvasLike {
  nodes: Map<string, CanvasNodeLike>;
  selection: Set<unknown>;
  wrapperEl?: HTMLElement;
  markDirty?(node: CanvasNodeLike): void;
  markMoved?(node: CanvasNodeLike): void;
  requestSave?(): void;
  requestFrame?(): void;
}

export interface CanvasViewLike {
  file: TFile;
  canvas: CanvasLike;
  getViewType(): string;
}

export interface FoldNodeState {
  collapsible: boolean;
  collapsed: boolean;
  customTitle: string | null;
  subtitle?: string;
  description?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  descriptionFontSize?: number;
  titleColor?: string;
  headerBackgroundColor?: string;
  expandedWidth: number;
  expandedHeight: number;
  foldedWidth?: number;
  foldedHeight?: number;
}

export interface CanvasState {
  nodes: Record<string, FoldNodeState>;
}

export interface CanvasVisibilitySettings {
  collapsibleCardsEnabled: boolean;
  quickEditorEnabled: boolean;
  collapseHeight: number;
  defaultFoldTitleFontSize: number;
  editorWidthPercent: number;
  editorHeightPercent: number;
  editorX: number | null;
  editorY: number | null;
  editorWidth: number | null;
  editorHeight: number | null;
  closeEditorOnOutsideClick: boolean;
}

export interface PluginData {
  settings: CanvasVisibilitySettings;
  canvases: Record<string, CanvasState>;
}

export type EditableNodeKind = "file" | "text";

export interface EditableNodeTarget {
  canvasPath: string;
  node: CanvasNodeLike;
  kind: EditableNodeKind;
  file: TFile | null;
  title: string;
  initialText: string;
}
