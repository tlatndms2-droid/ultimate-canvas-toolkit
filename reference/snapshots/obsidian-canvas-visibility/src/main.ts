import { EventRef, Menu, Notice, Plugin, TFile } from "obsidian";
import { CanvasAdapter } from "./canvas/canvas-adapter";
import { CollapseManager } from "./collapse/collapse-manager";
import { TitlePromptModal } from "./collapse/title-prompt-modal";
import { getTextCardTitle, TitleResolver } from "./collapse/title-resolver";
import { registerCommands } from "./commands/commands";
import { EditorManager } from "./editor/editor-manager";
import { CanvasVisibilitySettingTab, DEFAULT_SETTINGS } from "./settings/settings";
import { MetadataStore } from "./storage/metadata-store";
import type { CanvasNodeLike, CanvasViewLike, CanvasVisibilitySettings } from "./types";

interface CanvasEventWorkspace {
  on(name: "canvas:node-menu", callback: (menu: Menu, node: CanvasNodeLike) => void): EventRef;
}

export default class CanvasVisibilityPlugin extends Plugin {
  settings: CanvasVisibilitySettings = { ...DEFAULT_SETTINGS };
  canvasAdapter!: CanvasAdapter;
  collapseManager!: CollapseManager;
  editorManager!: EditorManager;
  private store!: MetadataStore;
  private refreshTimer: number | null = null;

  async onload(): Promise<void> {
    this.store = new MetadataStore(this);
    await this.store.load();
    this.settings = this.store.settings;

    this.canvasAdapter = new CanvasAdapter(this.app);
    const titles = new TitleResolver(this.canvasAdapter);
    this.collapseManager = new CollapseManager(this, this.canvasAdapter, this.store, titles);
    this.editorManager = new EditorManager(this.app, this, this.canvasAdapter, this.store, titles);

    this.addSettingTab(new CanvasVisibilitySettingTab(this.app, this));
    registerCommands(this);
    this.registerCanvasMenus();
    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest("input, textarea, button, [contenteditable], .modal, .menu")) return;
      const view = this.canvasAdapter.getActiveCanvasView();
      if (!view?.canvas.wrapperEl?.contains(target) || !this.settings.quickEditorEnabled) return;
      const selected = this.canvasAdapter.getSelectedNodes(view);
      if (selected.length !== 1 || !this.canvasAdapter.getEditableKind(selected[0])) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void this.editorManager.openNode(view, selected[0]);
    }, true);

    this.registerEvent(this.app.workspace.on("layout-change", () => this.scheduleRefresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof TFile && (file.extension === "md" || file.extension === "canvas")) this.scheduleRefresh();
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof TFile && file.extension === "canvas" && this.store.renameCanvas(oldPath, file.path)) {
        void this.store.save();
      }
      this.scheduleRefresh();
    }));

    this.app.workspace.onLayoutReady(() => void this.refreshOpenCanvases());
    this.registerInterval(window.setInterval(() => void this.refreshOpenCanvases(), 1500));
  }

  async onunload(): Promise<void> {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    await this.editorManager?.close();
    this.collapseManager?.restoreOpenViewsForUnload();
  }

  async savePluginData(): Promise<void> {
    await this.store.save();
  }

  async refreshOpenCanvases(): Promise<void> {
    for (const view of this.canvasAdapter.getOpenCanvasViews()) {
      await this.collapseManager.applyView(view);
    }
  }

  closeQuickEditor(): void {
    void this.editorManager.close();
  }

  getSingleSelectedTarget(): { view: CanvasViewLike; node: CanvasNodeLike } | null {
    const view = this.canvasAdapter.getActiveCanvasView();
    if (!view) {
      new Notice("먼저 Canvas를 여세요.");
      return null;
    }
    const nodes = this.canvasAdapter.getSelectedNodes(view);
    if (nodes.length !== 1) {
      new Notice("Canvas 카드 하나만 선택하세요.");
      return null;
    }
    return { view, node: nodes[0] };
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshOpenCanvases();
    }, 150);
  }

  private registerCanvasMenus(): void {
    const workspace = this.app.workspace as unknown as CanvasEventWorkspace;
    this.registerEvent(workspace.on("canvas:node-menu", (menu, node) => {
      const view = this.canvasAdapter.getOpenCanvasViews().find((item) => item.canvas === node.canvas);
      if (!view || !this.canvasAdapter.getEditableKind(node)) return;

      menu.addSeparator();
      if (this.settings.collapsibleCardsEnabled) {
        const enabled = this.collapseManager.isCollapsible(view.file.path, node.id);
        if (!enabled) {
          menu.addItem((item) => item
            .setTitle("카드 접기 사용")
            .setIcon("panel-top-close")
            .onClick(() => {
              const kind = this.canvasAdapter.getEditableKind(node);
              if (kind === "text" || kind === "file") {
                new TitlePromptModal(
                  this.app,
                  kind === "text"
                    ? getTextCardTitle(node.getData().text) ?? ""
                    : this.canvasAdapter.resolveMarkdownFile(node)?.basename ?? "",
                  (details) => void this.collapseManager.enable(
                    view,
                    node,
                    details.title,
                    details.subtitle,
                    details.description
                  )
                ).open();
              }
            }));
        } else {
          menu.addItem((item) => item
            .setTitle("카드 접기/펼치기")
            .setIcon("chevrons-up-down")
            .onClick(() => void this.collapseManager.toggle(view, node)));
          menu.addItem((item) => item
            .setTitle("카드 접기 해제")
            .setIcon("panel-top-open")
            .onClick(() => void this.collapseManager.disable(view, node)));
        }
      }
      if (this.settings.quickEditorEnabled) {
        menu.addItem((item) => item
          .setTitle("빠른 편집기로 열기")
          .setIcon("panel-top")
          .onClick(() => void this.editorManager.openNode(view, node)));
      }
    }));
  }
}
