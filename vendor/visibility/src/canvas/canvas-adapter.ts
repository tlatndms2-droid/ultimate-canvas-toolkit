import { App, TFile, View } from "obsidian";
import type { CanvasNodeDataLike, CanvasNodeLike, CanvasViewLike, EditableNodeKind } from "../types";

export class CanvasAdapter {
  constructor(private readonly app: App) {}

  getActiveCanvasView(): CanvasViewLike | null {
    const view = this.app.workspace.getActiveViewOfType(View) as unknown;
    return this.toCanvasView(view);
  }

  getOpenCanvasViews(): CanvasViewLike[] {
    const views: CanvasViewLike[] = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = this.toCanvasView(leaf.view as unknown);
      if (view) views.push(view);
    });
    return views;
  }

  toCanvasView(value: unknown): CanvasViewLike | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<CanvasViewLike>;
    if (candidate.getViewType?.() !== "canvas") return null;
    if (!(candidate.file instanceof TFile) || !candidate.canvas) return null;
    if (!(candidate.canvas.nodes instanceof Map) || !(candidate.canvas.selection instanceof Set)) return null;
    return candidate as CanvasViewLike;
  }

  getSelectedNodes(view: CanvasViewLike): CanvasNodeLike[] {
    return [...view.canvas.selection].filter((value): value is CanvasNodeLike => this.isRuntimeNode(value));
  }

  isRuntimeNode(value: unknown): value is CanvasNodeLike {
    if (!value || typeof value !== "object") return false;
    const node = value as Partial<CanvasNodeLike>;
    return typeof node.id === "string"
      && node.nodeEl instanceof HTMLElement
      && typeof node.getData === "function"
      && typeof node.setData === "function";
  }

  getEditableKind(node: CanvasNodeLike): EditableNodeKind | null {
    const data = node.getData();
    if (data.type === "text") return "text";
    if (data.type !== "file") return null;
    const file = this.resolveMarkdownFile(node);
    return file ? "file" : null;
  }

  resolveMarkdownFile(node: CanvasNodeLike): TFile | null {
    if (node.file instanceof TFile && node.file.extension.toLowerCase() === "md") return node.file;
    const path = node.getData().file;
    if (typeof path !== "string") return null;
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile && file.extension.toLowerCase() === "md" ? file : null;
  }

  updateNode(
    node: CanvasNodeLike,
    patch: Partial<CanvasNodeDataLike>,
    addHistory = true,
    render = true
  ): void {
    const next = { ...node.getData(), ...patch };
    node.setData(next, addHistory);
    node.canvas.markDirty?.(node);
    node.canvas.markMoved?.(node);
    node.canvas.requestFrame?.();
    node.canvas.requestSave?.();
    if (render) node.render?.();
  }

  resizeNode(
    node: CanvasNodeLike,
    width: number,
    height: number,
    addHistory = true,
    render = true
  ): void {
    const data = node.getData();
    if (data.width === width && data.height === height) return;
    this.updateNode(node, { width, height }, addHistory, render);
  }

  moveNode(node: CanvasNodeLike, x: number, y: number, addHistory: boolean): void {
    node.setData({ ...node.getData(), x, y }, addHistory);
    node.canvas.markDirty?.(node);
    node.canvas.markMoved?.(node);
    node.canvas.requestFrame?.();
    if (addHistory) node.canvas.requestSave?.();
  }

  updateTextNode(node: CanvasNodeLike, text: string): void {
    if (node.getData().type !== "text") throw new Error("선택한 Canvas 노드는 텍스트 카드가 아닙니다.");
    this.updateNode(node, { text });
  }
}
