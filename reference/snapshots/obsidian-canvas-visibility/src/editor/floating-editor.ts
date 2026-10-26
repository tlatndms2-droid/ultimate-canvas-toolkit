import { App, Notice, setIcon } from "obsidian";
import type { CanvasVisibilitySettings, EditableNodeTarget } from "../types";
import { CanvasAdapter } from "../canvas/canvas-adapter";
import { NativeMarkdownEditor } from "./native-markdown-editor";

let editorLayerSequence = 0;

export class FloatingEditor {
  private overlayEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private editor: NativeMarkdownEditor | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private geometryTimer: number | null = null;
  private geometryReady = false;
  private documentListeners: AbortController | null = null;
  private saving = false;
  private closed = false;
  private statusEl: HTMLElement | null = null;
  private headerEl: HTMLElement | null = null;
  private foldButtonEl: HTMLElement | null = null;
  private collapsed = false;
  private expandedHeight: number | null = null;

  constructor(
    private readonly app: App,
    private readonly adapter: CanvasAdapter,
    private readonly target: EditableNodeTarget,
    private readonly settings: CanvasVisibilitySettings,
    private readonly cascadeOffset: number,
    private readonly onSettingsChanged: () => void,
    private readonly onClosed: () => void
  ) {}

  async open(): Promise<void> {
    const doc = this.target.node.nodeEl.ownerDocument;
    const win = doc.defaultView ?? window;
    const overlay = doc.body.createDiv({ cls: "cv-editor-overlay" });
    this.overlayEl = overlay;
    this.activate();

    const panel = overlay.createDiv({ cls: "cv-editor-panel" });
    this.panelEl = panel;
    this.applyInitialGeometry(panel, win);
    this.expandedHeight = panel.offsetHeight;

    const header = panel.createDiv({ cls: "cv-editor-header" });
    this.headerEl = header;
    header.createDiv({ cls: "cv-editor-title", text: this.target.title });
    const actions = header.createDiv({ cls: "cv-editor-actions" });
    this.foldButtonEl = this.createIconButton(actions, "minus", "편집기 접기", () => this.toggleCollapsed());
    this.foldButtonEl.setAttribute("aria-expanded", "true");
    this.createIconButton(actions, "save", "저장 (Ctrl+S)", () => void this.save());
    this.createIconButton(actions, "x", "저장하고 닫기 (Esc)", () => void this.close(true));
    this.registerDragging(header, panel, win);

    const body = panel.createDiv({ cls: "cv-editor-body" });
    const editorEl = body.createDiv({ cls: "cv-native-editor-host" });
    this.statusEl = panel.createDiv({
      cls: "cv-editor-status",
      text: this.target.kind === "file" ? this.target.file!.path : "Canvas 텍스트 카드"
    });

    this.editor = new NativeMarkdownEditor(this.app, this.target);
    try {
      await this.editor.mount(editorEl);
    } catch (error) {
      this.editor.detach();
      this.overlayEl?.remove();
      this.overlayEl = null;
      this.panelEl = null;
      throw error;
    }
    win.requestAnimationFrame(() => panel.addClass("cv-is-visible"));

    panel.addEventListener("pointerdown", () => this.activate(), true);

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        void this.close(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();
        void this.save();
      }
    }, true);

    this.documentListeners = new AbortController();
    doc.addEventListener("pointerdown", (event) => {
      const clickedEditor = (event.target as HTMLElement | null)?.closest?.(".cv-editor-panel");
      if (this.settings.closeEditorOnOutsideClick && !clickedEditor) void this.close(true);
    }, { capture: true, signal: this.documentListeners.signal });

    this.resizeObserver = new ResizeObserver(() => {
      this.editor?.remeasure();
      if (this.geometryReady) this.scheduleGeometrySave();
    });
    this.resizeObserver.observe(panel);
    win.setTimeout(() => { this.geometryReady = true; }, 0);
  }

  activate(): void {
    const overlay = this.overlayEl;
    if (!overlay) return;
    editorLayerSequence += 1;
    overlay.style.setProperty("--cv-editor-layer", String(editorLayerSequence));
  }

  async close(saveChanges: boolean): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (saveChanges) {
      try {
        await this.save();
      } catch {
        this.closed = false;
        return;
      }
    }
    this.saveGeometryNow();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.documentListeners?.abort();
    this.documentListeners = null;
    this.editor?.detach();
    this.editor = null;
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.panelEl = null;
    this.headerEl = null;
    this.foldButtonEl = null;
    this.onClosed();
  }

  private toggleCollapsed(): void {
    const panel = this.panelEl;
    const header = this.headerEl;
    const button = this.foldButtonEl;
    if (!panel || !header || !button) return;
    const win = panel.ownerDocument.defaultView ?? window;

    if (!this.collapsed) {
      this.expandedHeight = panel.offsetHeight;
      this.collapsed = true;
      panel.addClass("cv-is-collapsed");
      panel.style.height = `${header.offsetHeight + 2}px`;
      setIcon(button, "maximize-2");
      button.setAttribute("aria-label", "편집기 펼치기");
      button.setAttribute("aria-expanded", "false");
    } else {
      this.collapsed = false;
      panel.removeClass("cv-is-collapsed");
      const minimumHeight = Math.min(320, win.innerHeight);
      const targetHeight = this.clamp(this.expandedHeight ?? minimumHeight, minimumHeight, win.innerHeight);
      const targetTop = this.clamp(panel.offsetTop, 0, Math.max(0, win.innerHeight - targetHeight));
      panel.style.top = `${targetTop}px`;
      panel.style.height = `${targetHeight}px`;
      setIcon(button, "minus");
      button.setAttribute("aria-label", "편집기 접기");
      button.setAttribute("aria-expanded", "true");
      win.requestAnimationFrame(() => this.editor?.remeasure());
    }
    this.saveGeometryNow();
  }

  private async save(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.updateStatus("저장 중…");
    try {
      if (this.target.kind === "file" && this.target.file) {
        await this.editor?.saveFile();
      } else {
        this.adapter.updateTextNode(this.target.node, this.editor?.getText() ?? this.target.initialText);
      }
      this.updateStatus("저장됨");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Canvas Visibility에서 저장하지 못했습니다: ${message}`);
      this.updateStatus("저장 실패");
      throw error;
    } finally {
      this.saving = false;
    }
  }

  private applyInitialGeometry(panel: HTMLElement, win: Window): void {
    const margin = 12;
    const minWidth = Math.min(480, win.innerWidth - margin * 2);
    const minHeight = Math.min(320, win.innerHeight - margin * 2);
    const width = Math.max(minWidth, Math.min(
      this.settings.editorWidth ?? win.innerWidth * this.settings.editorWidthPercent / 100,
      win.innerWidth - margin * 2
    ));
    const height = Math.max(minHeight, Math.min(
      this.settings.editorHeight ?? win.innerHeight * this.settings.editorHeightPercent / 100,
      win.innerHeight - margin * 2
    ));
    const left = this.clamp(
      (this.settings.editorX ?? (win.innerWidth - width) / 2) + this.cascadeOffset,
      margin,
      Math.max(margin, win.innerWidth - width - margin)
    );
    const top = this.clamp(
      (this.settings.editorY ?? (win.innerHeight - height) / 2) + this.cascadeOffset,
      margin,
      Math.max(margin, win.innerHeight - height - margin)
    );
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  }

  private registerDragging(header: HTMLElement, panel: HTMLElement, win: Window): void {
    header.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = panel.offsetLeft;
      const startTop = panel.offsetTop;
      header.setPointerCapture(event.pointerId);
      header.addClass("is-dragging");

      const move = (moveEvent: PointerEvent): void => {
        const left = this.clamp(startLeft + moveEvent.clientX - startX, 0, Math.max(0, win.innerWidth - panel.offsetWidth));
        const top = this.clamp(startTop + moveEvent.clientY - startY, 0, Math.max(0, win.innerHeight - panel.offsetHeight));
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      };
      const finish = (): void => {
        header.removeClass("is-dragging");
        header.removeEventListener("pointermove", move);
        header.removeEventListener("pointerup", finish);
        header.removeEventListener("pointercancel", finish);
        this.saveGeometryNow();
      };
      header.addEventListener("pointermove", move);
      header.addEventListener("pointerup", finish);
      header.addEventListener("pointercancel", finish);
    });
  }

  private scheduleGeometrySave(): void {
    const win = this.panelEl?.ownerDocument.defaultView ?? window;
    if (this.geometryTimer !== null) win.clearTimeout(this.geometryTimer);
    this.geometryTimer = win.setTimeout(() => {
      this.geometryTimer = null;
      this.saveGeometryNow();
    }, 200);
  }

  private saveGeometryNow(): void {
    const panel = this.panelEl;
    if (!panel) return;
    const win = panel.ownerDocument.defaultView ?? window;
    if (this.geometryTimer !== null) {
      win.clearTimeout(this.geometryTimer);
      this.geometryTimer = null;
    }
    this.settings.editorX = panel.offsetLeft;
    this.settings.editorY = panel.offsetTop;
    this.settings.editorWidth = panel.offsetWidth;
    if (!this.collapsed) this.settings.editorHeight = panel.offsetHeight;
    this.onSettingsChanged();
  }

  private createIconButton(parent: HTMLElement, icon: string, label: string, onClick: () => void): HTMLElement {
    const button = parent.createEl("button", {
      cls: "clickable-icon",
      attr: { type: "button", "aria-label": label }
    });
    setIcon(button, icon);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
    return button;
  }

  private updateStatus(text: string): void {
    this.statusEl?.setText(text);
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
  }
}
