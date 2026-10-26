import { Notice, setIcon } from "obsidian";
import type CanvasVisibilityPlugin from "../main";
import { CanvasAdapter } from "../canvas/canvas-adapter";
import type { CanvasNodeLike, CanvasViewLike, FoldNodeState } from "../types";
import { MetadataStore } from "../storage/metadata-store";
import { getTextCardTitle, TitleResolver } from "./title-resolver";
import { FoldHeaderColors, FoldTextSizes, TitleSizeModal } from "./title-size-modal";
import { FoldCardDetails, TitlePromptModal } from "./title-prompt-modal";

export class CollapseManager {
  private readonly headerListeners = new WeakMap<HTMLElement, AbortController>();
  private readonly toolbarObservers = new WeakMap<HTMLElement, MutationObserver>();
  constructor(
    private readonly plugin: CanvasVisibilityPlugin,
    private readonly adapter: CanvasAdapter,
    private readonly store: MetadataStore,
    private readonly titles: TitleResolver
  ) {}

  isCollapsible(canvasPath: string, nodeId: string): boolean {
    return this.store.getNode(canvasPath, nodeId)?.collapsible === true;
  }

  async enable(
    view: CanvasViewLike,
    node: CanvasNodeLike,
    customTitle: string | null,
    subtitle = "",
    description = ""
  ): Promise<void> {
    const kind = this.adapter.getEditableKind(node);
    if (!kind) {
      new Notice("Canvas Visibility는 텍스트 카드와 마크다운 파일 카드만 지원합니다.");
      return;
    }
    if (!customTitle?.trim()) {
      new Notice("카드에는 제목이 필요합니다.");
      return;
    }

    const data = node.getData();
    const existing = this.store.getNode(view.file.path, node.id);
    const state: FoldNodeState = {
      collapsible: true,
      collapsed: existing?.collapsed ?? false,
      customTitle: customTitle.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      titleFontSize: existing?.titleFontSize,
      expandedWidth: existing?.expandedWidth ?? data.width,
      expandedHeight: existing?.expandedHeight ?? data.height,
      foldedWidth: existing?.foldedWidth ?? data.width
    };
    this.store.setNode(view.file.path, node.id, state);
    await this.store.save();
    await this.applyNode(view.file.path, node, state);
  }

  async disable(view: CanvasViewLike, node: CanvasNodeLike): Promise<void> {
    const state = this.store.getNode(view.file.path, node.id);
    if (!state) return;
    if (state.collapsed) this.adapter.resizeNode(node, state.foldedWidth ?? state.expandedWidth, state.expandedHeight);
    this.removeDecoration(node);
    this.store.deleteNode(view.file.path, node.id);
    await this.store.save();
  }

  async toggle(view: CanvasViewLike, node: CanvasNodeLike): Promise<void> {
    const state = this.store.getNode(view.file.path, node.id);
    if (!state?.collapsible) {
      new Notice("먼저 이 카드에 접기를 사용하세요.");
      return;
    }

    const data = node.getData();
    if (!state.collapsed) {
      state.expandedWidth = data.width;
      state.expandedHeight = data.height;
    }
    state.foldedWidth = data.width;
    state.collapsed = !state.collapsed;
    this.store.setNode(view.file.path, node.id, state);
    await this.store.save();
    await this.applyNode(view.file.path, node, state);
  }

  async setCardSettings(
    canvasPath: string,
    node: CanvasNodeLike,
    details: FoldCardDetails,
    sizes: FoldTextSizes | null,
    colors: FoldHeaderColors | null
  ): Promise<void> {
    const state = this.store.getNode(canvasPath, node.id);
    if (!state?.collapsible) return;
    if (!details.title.trim()) {
      new Notice("카드에는 제목이 필요합니다.");
      return;
    }
    state.customTitle = details.title.trim();
    state.subtitle = details.subtitle.trim();
    state.description = details.description.trim();
    if (sizes === null) {
      delete state.titleFontSize;
      delete state.subtitleFontSize;
      delete state.descriptionFontSize;
    } else {
      state.titleFontSize = Math.max(12, Math.min(200, Math.round(sizes.title)));
      state.subtitleFontSize = Math.max(8, Math.min(72, Math.round(sizes.subtitle)));
      state.descriptionFontSize = Math.max(8, Math.min(72, Math.round(sizes.description)));
    }
    if (colors === null) {
      delete state.titleColor;
      delete state.headerBackgroundColor;
    } else {
      if (colors.title === null) delete state.titleColor;
      else state.titleColor = colors.title;
      if (colors.background === null) delete state.headerBackgroundColor;
      else state.headerBackgroundColor = colors.background;
    }
    this.store.setNode(canvasPath, node.id, state);
    await this.store.save();
    await this.applyNode(canvasPath, node, state);
  }

  async setAll(view: CanvasViewLike, collapsed: boolean): Promise<void> {
    const canvasState = this.store.getCanvas(view.file.path);
    if (!canvasState) return;
    for (const [nodeId, state] of Object.entries(canvasState.nodes)) {
      if (!state.collapsible) continue;
      const node = view.canvas.nodes.get(nodeId);
      if (!node || !this.adapter.getEditableKind(node)) continue;
      if (collapsed && !state.collapsed) {
        const data = node.getData();
        state.expandedWidth = data.width;
        state.expandedHeight = data.height;
        state.foldedWidth = data.width;
      } else if (!collapsed && state.collapsed) {
        state.foldedWidth = node.getData().width;
      }
      state.collapsed = collapsed;
      await this.applyNode(view.file.path, node, state);
    }
    await this.store.save();
  }

  async toggleAll(view: CanvasViewLike): Promise<void> {
    const states = Object.values(this.store.getCanvas(view.file.path)?.nodes ?? {})
      .filter((state) => state.collapsible);
    if (states.length === 0) return;
    await this.setAll(view, states.some((state) => !state.collapsed));
  }

  async applyView(view: CanvasViewLike): Promise<void> {
    this.ensureSelectionToolbar(view);
    const canvasState = this.store.getCanvas(view.file.path);
    if (!canvasState) return;
    let changed = false;
    for (const [nodeId, state] of Object.entries(canvasState.nodes)) {
      const node = view.canvas.nodes.get(nodeId);
      if (!node || !state.collapsible || !this.adapter.getEditableKind(node)) continue;
      if (state.foldedHeight !== undefined) {
        delete state.foldedHeight;
        changed = true;
      }
      if (!this.plugin.settings.collapsibleCardsEnabled) {
        if (state.collapsed) this.adapter.resizeNode(node, state.expandedWidth, state.expandedHeight, false);
        this.removeDecoration(node);
        continue;
      }
      if (!state.collapsed) {
        const data = node.getData();
        state.expandedWidth = data.width;
        state.expandedHeight = data.height;
        state.foldedWidth = data.width;
      } else {
        const data = node.getData();
        if (state.foldedWidth !== data.width) {
          state.foldedWidth = data.width;
          changed = true;
        }
      }
      await this.applyNode(view.file.path, node, state);
    }
    if (changed) await this.store.save();
  }

  restoreOpenViewsForUnload(): void {
    for (const view of this.adapter.getOpenCanvasViews()) {
      const canvasState = this.store.getCanvas(view.file.path);
      if (!canvasState) continue;
      for (const [nodeId, state] of Object.entries(canvasState.nodes)) {
        const node = view.canvas.nodes.get(nodeId);
        if (!node) continue;
        if (state.collapsed) this.adapter.resizeNode(node, state.foldedWidth ?? state.expandedWidth, state.expandedHeight, false);
        this.removeDecoration(node);
      }
    }
  }

  private async applyNode(canvasPath: string, node: CanvasNodeLike, state: FoldNodeState): Promise<void> {
    if (!this.plugin.settings.collapsibleCardsEnabled) return;
    const title = await this.titles.resolve(node, state);
    const titleFontSize = state.titleFontSize ?? this.plugin.settings.defaultFoldTitleFontSize;
    const subtitleFontSize = state.subtitleFontSize ?? 14;
    const descriptionFontSize = state.descriptionFontSize ?? 13;
    const minimumCollapsedHeight = this.decorate(canvasPath, node, title, state, titleFontSize, async () => {
      const view = this.adapter.getOpenCanvasViews().find((item) => item.file.path === canvasPath);
      if (view) await this.toggle(view, node);
    }, () => {
      new TitleSizeModal(
        this.plugin.app,
        { title, subtitle: state.subtitle ?? "", description: state.description ?? "" },
        { title: titleFontSize, subtitle: subtitleFontSize, description: descriptionFontSize },
        { title: state.titleColor ?? null, background: state.headerBackgroundColor ?? null },
        this.plugin.settings.defaultFoldTitleFontSize,
        (details, sizes, colors) => void this.setCardSettings(canvasPath, node, details, sizes, colors),
        (details) => void this.setCardSettings(canvasPath, node, details, null, null)
      ).open();
    }, () => {
      const view = this.adapter.getOpenCanvasViews().find((item) => item.file.path === canvasPath);
      if (view) void this.plugin.editorManager.openNode(view, node);
    });
    const targetWidth = state.foldedWidth ?? state.expandedWidth;
    const targetHeight = state.collapsed
      ? Math.max(this.plugin.settings.collapseHeight, minimumCollapsedHeight)
      : state.expandedHeight;
    this.adapter.resizeNode(node, targetWidth, targetHeight);
  }

  private decorate(
    canvasPath: string,
    node: CanvasNodeLike,
    title: string,
    state: FoldNodeState,
    titleFontSize: number,
    onToggle: () => void,
    onOpenSettings: () => void,
    onOpenEditor: () => void
  ): number {
    node.nodeEl.addClass("cv-collapsible");
    node.nodeEl.toggleClass("cv-is-collapsed", state.collapsed);
    node.nodeEl.style.setProperty("--cv-fold-title-size", `${titleFontSize}px`);
    node.nodeEl.style.setProperty("--cv-fold-subtitle-size", `${state.subtitleFontSize ?? 14}px`);
    node.nodeEl.style.setProperty("--cv-fold-description-size", `${state.descriptionFontSize ?? 13}px`);
    if (state.titleColor) node.nodeEl.style.setProperty("--cv-fold-title-color", state.titleColor);
    else node.nodeEl.style.removeProperty("--cv-fold-title-color");
    if (state.headerBackgroundColor) node.nodeEl.style.setProperty("--cv-fold-header-background", state.headerBackgroundColor);
    else node.nodeEl.style.removeProperty("--cv-fold-header-background");
    let header = node.nodeEl.querySelector<HTMLElement>(":scope > .cv-fold-header");
    if (!header) {
      header = node.nodeEl.createDiv({ cls: "cv-fold-header" });
    }
    node.nodeEl.querySelector(":scope > .cv-fold-details")?.remove();
    node.nodeEl.querySelector(":scope > .cv-fold-resize-handle")?.remove();
    header.empty();
    const button = header.createEl("button", {
      cls: "cv-fold-toggle clickable-icon",
      attr: { "aria-label": state.collapsed ? "카드 펼치기" : "카드 접기", type: "button" }
    });
    button.setText(state.collapsed ? "▶" : "▼");
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void onToggle();
    });
    const titleEl = header.createDiv({ cls: "cv-fold-title", text: title });
    titleEl.addEventListener("pointerdown", (event) => event.stopPropagation());
    titleEl.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onOpenEditor();
    });
    const sizeButton = header.createEl("button", {
      cls: "cv-title-size-button clickable-icon",
      text: "A",
      attr: { "aria-label": "접힌 카드 설정", type: "button" }
    });
    sizeButton.addEventListener("pointerdown", (event) => event.stopPropagation());
    sizeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onOpenSettings();
    });
    const subtitle = state.subtitle?.trim() ?? "";
    const description = state.description?.trim() ?? "";
    const details = subtitle || description
      ? node.nodeEl.createDiv({ cls: "cv-fold-details" })
      : null;
    if (details) {
      if (subtitle) details.createDiv({ cls: "cv-fold-subtitle", text: subtitle });
      if (description) details.createDiv({ cls: "cv-fold-description", text: description });
    }
    const widthHandle = node.nodeEl.querySelector(":scope > .cv-fold-width-handle");
    if (!state.collapsed) {
      widthHandle?.remove();
    } else if (!widthHandle) {
      this.addFoldedWidthHandle(node, (width) => void this.saveFoldedWidth(canvasPath, node, width));
    }
    this.registerHeaderDragging(header, node);
    const detailsHeight = details
      ? Array.from(details.children).reduce((height, child) => {
        const element = child as HTMLElement;
        return Math.max(height, element.offsetTop + element.offsetHeight);
      }, 0) + 6
      : 0;
    return Math.ceil(header.offsetHeight + detailsHeight);
  }

  private addFoldedWidthHandle(node: CanvasNodeLike, onResize: (width: number) => void): void {
    const handle = node.nodeEl.createDiv({
      cls: "cv-fold-width-handle",
      attr: {
        "aria-label": "접힌 카드 가로 폭 조절",
        "aria-orientation": "vertical",
        role: "separator"
      }
    });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const data = node.getData();
      const rect = node.nodeEl.getBoundingClientRect();
      const scaleX = data.width > 0 ? rect.width / data.width : 1;
      const startX = event.clientX;
      let width = data.width;
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture(event.pointerId);

      const move = (moveEvent: PointerEvent): void => {
        width = Math.max(80, data.width + (moveEvent.clientX - startX) / Math.max(scaleX, 0.01));
        this.adapter.resizeNode(node, width, data.height, false, false);
      };
      const finish = (): void => {
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        handle.ownerDocument.removeEventListener("pointermove", move, true);
        handle.ownerDocument.removeEventListener("pointerup", finish, true);
        handle.ownerDocument.removeEventListener("pointercancel", finish, true);
        this.adapter.resizeNode(node, width, data.height, true, true);
        onResize(width);
      };
      handle.ownerDocument.addEventListener("pointermove", move, true);
      handle.ownerDocument.addEventListener("pointerup", finish, true);
      handle.ownerDocument.addEventListener("pointercancel", finish, true);
    });
  }

  private async saveFoldedWidth(canvasPath: string, node: CanvasNodeLike, width: number): Promise<void> {
    const state = this.store.getNode(canvasPath, node.id);
    if (!state?.collapsible) return;
    state.foldedWidth = width;
    this.store.setNode(canvasPath, node.id, state);
    await this.store.save();
  }

  private ensureSelectionToolbar(view: CanvasViewLike): void {
    const wrapper = view.canvas.wrapperEl;
    if (!wrapper) return;
    if (!this.toolbarObservers.has(wrapper)) {
      const observer = new MutationObserver(() => this.addSelectionToolbarButtons(view));
      observer.observe(wrapper, { childList: true, subtree: true });
      this.toolbarObservers.set(wrapper, observer);
      this.plugin.register(() => observer.disconnect());
    }
    this.addSelectionToolbarButtons(view);
  }

  private addSelectionToolbarButtons(view: CanvasViewLike): void {
    const wrapper = view.canvas.wrapperEl;
    if (!wrapper) return;
    const selected = this.adapter.getSelectedNodes(view);
    const node = selected.length === 1 && this.adapter.getEditableKind(selected[0]) ? selected[0] : null;
    const menus = Array.from(wrapper.querySelectorAll(".canvas-menu")) as HTMLElement[];
    for (const menu of menus) {
      let foldButton = menu.querySelector(":scope > .cv-canvas-fold-toggle") as HTMLButtonElement | null;
      if (!node || !this.plugin.settings.collapsibleCardsEnabled) {
        foldButton?.remove();
        foldButton = null;
      } else if (!foldButton) {
        foldButton = menu.createEl("button", {
          cls: "cv-canvas-fold-toggle clickable-icon",
          attr: { type: "button" }
        });
        setIcon(foldButton, "panel-top-close");
        foldButton.addEventListener("pointerdown", (event: PointerEvent) => event.stopPropagation());
        foldButton.addEventListener("click", (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          const current = this.adapter.getSelectedNodes(view);
          if (current.length === 1 && this.adapter.getEditableKind(current[0])) {
            this.handleSelectionToolbarClick(view, current[0]);
          }
        });
      }
      if (foldButton && node) {
        foldButton.setAttribute("aria-label", this.isCollapsible(view.file.path, node.id) ? "카드 접기/펼치기" : "카드 접기 설정");
      }

      let editorButton = menu.querySelector(":scope > .cv-canvas-quick-editor") as HTMLButtonElement | null;
      if (!node || !this.plugin.settings.quickEditorEnabled) {
        editorButton?.remove();
      } else {
        if (!editorButton) {
          editorButton = menu.createEl("button", {
            cls: "cv-canvas-quick-editor clickable-icon",
            attr: { type: "button", "aria-label": "빠른 편집기로 열기" }
          });
          setIcon(editorButton, "pencil");
          editorButton.addEventListener("pointerdown", (event: PointerEvent) => event.stopPropagation());
          editorButton.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const current = this.adapter.getSelectedNodes(view);
            if (current.length === 1 && this.adapter.getEditableKind(current[0])) {
              void this.plugin.editorManager.openNode(view, current[0]);
            }
          });
        }
        if (foldButton && foldButton.nextElementSibling !== editorButton) foldButton.after(editorButton);
      }
    }
  }

  private handleSelectionToolbarClick(view: CanvasViewLike, node: CanvasNodeLike): void {
    if (this.isCollapsible(view.file.path, node.id)) {
      void this.toggle(view, node);
      return;
    }
    const kind = this.adapter.getEditableKind(node);
    if (!kind) return;
    const title = kind === "text"
      ? getTextCardTitle(node.getData().text) ?? ""
      : this.adapter.resolveMarkdownFile(node)?.basename ?? "";
    new TitlePromptModal(this.plugin.app, title, (details) => void this.enable(
      view,
      node,
      details.title,
      details.subtitle,
      details.description
    )).open();
  }

  private registerHeaderDragging(header: HTMLElement, node: CanvasNodeLike): void {
    this.headerListeners.get(header)?.abort();
    const controller = new AbortController();
    this.headerListeners.set(header, controller);
    header.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
      const data = node.getData();
      const rect = node.nodeEl.getBoundingClientRect();
      const scaleX = data.width > 0 ? rect.width / data.width : 1;
      const scaleY = data.height > 0 ? rect.height / data.height : scaleX;
      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const startX = data.x;
      const startY = data.y;
      let lastX = startX;
      let lastY = startY;
      let moved = false;
      event.preventDefault();
      event.stopPropagation();
      header.addClass("is-dragging");

      const move = (moveEvent: PointerEvent): void => {
        lastX = startX + (moveEvent.clientX - startClientX) / Math.max(scaleX, 0.01);
        lastY = startY + (moveEvent.clientY - startClientY) / Math.max(scaleY, 0.01);
        moved ||= Math.abs(moveEvent.clientX - startClientX) > 2 || Math.abs(moveEvent.clientY - startClientY) > 2;
        if (moved) this.adapter.moveNode(node, lastX, lastY, false);
      };
      const finish = (): void => {
        header.removeClass("is-dragging");
        header.ownerDocument.removeEventListener("pointermove", move, true);
        header.ownerDocument.removeEventListener("pointerup", finish, true);
        header.ownerDocument.removeEventListener("pointercancel", finish, true);
        if (moved) this.adapter.moveNode(node, lastX, lastY, true);
      };
      header.ownerDocument.addEventListener("pointermove", move, true);
      header.ownerDocument.addEventListener("pointerup", finish, true);
      header.ownerDocument.addEventListener("pointercancel", finish, true);
    }, { signal: controller.signal });
  }

  private removeDecoration(node: CanvasNodeLike): void {
    node.nodeEl.removeClass("cv-collapsible", "cv-is-collapsed");
    node.nodeEl.querySelector(":scope > .cv-fold-header")?.remove();
    node.nodeEl.querySelector(":scope > .cv-fold-details")?.remove();
    node.nodeEl.querySelector(":scope > .cv-fold-width-handle")?.remove();
    node.nodeEl.style.removeProperty("--cv-fold-title-size");
    node.nodeEl.style.removeProperty("--cv-fold-subtitle-size");
    node.nodeEl.style.removeProperty("--cv-fold-description-size");
    node.nodeEl.style.removeProperty("--cv-fold-title-color");
    node.nodeEl.style.removeProperty("--cv-fold-header-background");
  }
}
