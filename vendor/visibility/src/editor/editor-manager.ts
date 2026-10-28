import { App, Notice } from "obsidian";
import type CanvasVisibilityPlugin from "../main";
import { CanvasAdapter } from "../canvas/canvas-adapter";
import type { CanvasNodeLike, CanvasViewLike, EditableNodeTarget } from "../types";
import { TitleResolver } from "../collapse/title-resolver";
import { MetadataStore } from "../storage/metadata-store";
import { FloatingEditor } from "./floating-editor";

export class EditorManager {
  private readonly editors = new Map<string, FloatingEditor>();

  constructor(
    private readonly app: App,
    private readonly plugin: CanvasVisibilityPlugin,
    private readonly adapter: CanvasAdapter,
    private readonly store: MetadataStore,
    private readonly titles: TitleResolver
  ) {}

  async openSelected(): Promise<void> {
    const view = this.adapter.getActiveCanvasView();
    if (!view) {
      new Notice("Canvas를 열고 텍스트 카드 또는 마크다운 카드 하나를 선택하세요.");
      return;
    }
    const nodes = this.adapter.getSelectedNodes(view);
    if (nodes.length !== 1) {
      new Notice("Canvas 카드 하나만 선택하세요.");
      return;
    }
    await this.openNode(view, nodes[0]);
  }

  async openNode(view: CanvasViewLike, node: CanvasNodeLike): Promise<FloatingEditor | undefined> {
    if (!this.plugin.settings.quickEditorEnabled) {
      new Notice("Canvas Visibility 설정에서 빠른 카드 편집기가 꺼져 있습니다.");
      return;
    }
    const target = await this.buildTarget(view, node);
    if (!target) {
      new Notice("빠른 편집기는 Canvas 텍스트 카드와 마크다운 파일 카드만 지원합니다.");
      return;
    }
    const key = this.getEditorKey(target);
    const existing = this.editors.get(key);
    if (existing) {
      existing.activate();
      existing.editor?.getView()?.editor?.focus();
      return existing;
    }
    const cascadeOffset = (this.editors.size % 8) * 28;
    const editor = new FloatingEditor(
      this.app,
      this.adapter,
      target,
      this.plugin.settings,
      cascadeOffset,
      () => void this.plugin.savePluginData(),
      () => {
        if (this.editors.get(key) === editor) this.editors.delete(key);
        void this.plugin.refreshOpenCanvases();
      }
    );
    this.editors.set(key, editor);
    try {
      await editor.open();
      return editor;
    } catch (error) {
      if (this.editors.get(key) === editor) this.editors.delete(key);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Obsidian 편집기를 열지 못했습니다: ${message}`);
    }
  }

  async close(): Promise<void> {
    await Promise.all([...this.editors.values()].map((editor) => editor.close(true)));
  }

  fromElement(el:Element|null):FloatingEditor|undefined {return [...this.editors.values()].find(e=>!!el&&e.panelEl.contains(el));}
  refreshAppearance(){for(const editor of this.editors.values())editor.applyAppearance();}

  private getEditorKey(target: EditableNodeTarget): string {
    return `${target.canvasPath}\u0000${target.node.id}`;
  }

  private async buildTarget(view: CanvasViewLike, node: CanvasNodeLike): Promise<EditableNodeTarget | null> {
    const kind = this.adapter.getEditableKind(node);
    if (!kind) return null;
    const state = this.store.getNode(view.file.path, node.id);
    const title = await this.titles.resolve(node, state);
    if (kind === "file") {
      const file = this.adapter.resolveMarkdownFile(node);
      if (!file) return null;
      return {
        canvasPath: view.file.path,
        node,
        kind,
        file,
        title,
        initialText: await this.app.vault.cachedRead(file)
      };
    }
    const text = node.getData().text;
    return {
      canvasPath: view.file.path,
      node,
      kind,
      file: null,
      title,
      initialText: typeof text === "string" ? text : ""
    };
  }
}
