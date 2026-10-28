import {
  App,
  MarkdownView,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSplit
} from "obsidian";
import type { EditableNodeTarget } from "../types";

interface EmbeddedWorkspaceSplit extends WorkspaceSplit {
  containerEl: HTMLElement;
}

interface MeasurableMarkdownView extends MarkdownView {
  editMode?: { reinit?(): void };
}

type WorkspaceSplitConstructor = new (workspace: Workspace, direction: "horizontal" | "vertical") => EmbeddedWorkspaceSplit;

/** Hosts Obsidian's real MarkdownView inside the floating panel. */
export class NativeMarkdownEditor {
  private split: EmbeddedWorkspaceSplit | null = null;
  private leaf: WorkspaceLeaf | null = null;
  private view: MarkdownView | null = null;
  private commandContext: any;
  private previousContext: any;
  private scopeActive = false;
  private abort = new AbortController();

  constructor(
    private readonly app: App,
    private readonly target: EditableNodeTarget
  ) {}

  async mount(containerEl: HTMLElement): Promise<void> {
    const Split = WorkspaceSplit as unknown as WorkspaceSplitConstructor;
    const split = new Split(this.app.workspace, "vertical");
    split.getRoot = () => this.app.workspace.rootSplit;
    split.getContainer = () => this.app.workspace.rootSplit.getContainer();
    containerEl.appendChild(split.containerEl);
    this.split = split;

    const leaf = this.app.workspace.createLeafInParent(split, 0);
    this.leaf = leaf;

    if (this.target.kind === "file" && this.target.file) {
      await leaf.openFile(this.target.file, {
        active: true,
        state: { mode: "source", source: false },
        eState: { focus: true }
      });
      await leaf.loadIfDeferred();
      if (!(leaf.view instanceof MarkdownView)) {
        throw new Error("마크다운 편집기를 열지 못했습니다.");
      }
      this.view = leaf.view;
    } else {
      const view = new MarkdownView(leaf);
      await leaf.open(view);
      view.setViewData(this.target.initialText, true);
      this.view = view;
    }

    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    const view=this.view;
    // Detached leaves are intentionally outside the tab tree. Obsidian rejects
    // setActiveLeaf for them; expose the documented MarkdownFileInfo instead.
    this.commandContext={app:this.app,get editor(){return view?.editor;},get file(){return view?.file??null;},getMode:()=>view?.getMode(),get editMode(){return view?.editMode;},get hoverPopover(){return view?.hoverPopover;},set hoverPopover(value){if(view)view.hoverPopover=value;}};
    const activate=()=>{if(this.app.workspace.activeEditor!==this.commandContext){this.previousContext=this.app.workspace.activeEditor;this.app.workspace.activeEditor=this.commandContext;}if(!this.scopeActive&&view?.scope){this.app.keymap.pushScope(view.scope);this.scopeActive=true;}};
    const release=()=>{if(this.scopeActive&&view?.scope){this.app.keymap.popScope(view.scope);this.scopeActive=false;}if(this.app.workspace.activeEditor===this.commandContext)this.app.workspace.activeEditor=this.previousContext??null;};
    containerEl.addEventListener('focusin',activate,{signal:this.abort.signal});
    containerEl.addEventListener('pointerdown',activate,{capture:true,signal:this.abort.signal});
    containerEl.addEventListener('focusout',()=>queueMicrotask(()=>{if(!containerEl.contains(containerEl.ownerDocument.activeElement))release();}),{signal:this.abort.signal});
    this.abort.signal.addEventListener('abort',release);
    this.remeasure();
    containerEl.win.requestAnimationFrame(() => {
      if (containerEl.isConnected) this.view?.editor?.focus();
    });
  }

  getText(): string {
    return this.view?.getViewData() ?? this.target.initialText;
  }

  getView(): MarkdownView | null { return this.view; }

  async saveFile(): Promise<void> {
    if (this.target.kind === "file") await this.view?.save();
  }

  remeasure(): void {
    (this.view as MeasurableMarkdownView | null)?.editMode?.reinit?.();
  }

  detach(): void {
    this.abort.abort();
    this.leaf?.detach();
    this.leaf = null;
    this.view = null;
    this.split?.containerEl.remove();
    this.split = null;
  }
}
