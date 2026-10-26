import { Notice } from "obsidian";
import type CanvasVisibilityPlugin from "../main";
import { TitlePromptModal } from "../collapse/title-prompt-modal";
import { getTextCardTitle } from "../collapse/title-resolver";

export function registerCommands(plugin: CanvasVisibilityPlugin): void {
  plugin.addCommand({
    id: "enable-folding-selected-card",
    name: "선택한 카드에 접기 사용",
    callback: () => {
      const target = plugin.getSingleSelectedTarget();
      if (!target) return;
      const kind = plugin.canvasAdapter.getEditableKind(target.node);
      if (kind === "text" || kind === "file") {
        new TitlePromptModal(
          plugin.app,
          kind === "text"
            ? getTextCardTitle(target.node.getData().text) ?? ""
            : plugin.canvasAdapter.resolveMarkdownFile(target.node)?.basename ?? "",
          (details) => void plugin.collapseManager.enable(
            target.view,
            target.node,
            details.title,
            details.subtitle,
            details.description
          )
        ).open();
      } else {
        new Notice("텍스트 카드 또는 마크다운 파일 카드를 선택하세요.");
      }
    }
  });

  plugin.addCommand({
    id: "disable-folding-selected-card",
    name: "선택한 카드의 접기 해제",
    callback: () => {
      const target = plugin.getSingleSelectedTarget();
      if (target) void plugin.collapseManager.disable(target.view, target.node);
    }
  });

  plugin.addCommand({
    id: "toggle-selected-card-fold",
    name: "선택한 카드 접기/펼치기",
    callback: () => {
      const target = plugin.getSingleSelectedTarget();
      if (target) void plugin.collapseManager.toggle(target.view, target.node);
    }
  });

  plugin.addCommand({
    id: "collapse-all-enabled-cards",
    name: "접기 사용 카드 모두 접기",
    callback: () => {
      const view = plugin.canvasAdapter.getActiveCanvasView();
      if (view) void plugin.collapseManager.setAll(view, true);
    }
  });

  plugin.addCommand({
    id: "expand-all-enabled-cards",
    name: "접기 사용 카드 모두 펼치기",
    callback: () => {
      const view = plugin.canvasAdapter.getActiveCanvasView();
      if (view) void plugin.collapseManager.setAll(view, false);
    }
  });

  plugin.addCommand({
    id: "toggle-all-enabled-cards",
    name: "접기 사용 카드 모두 전환",
    callback: () => {
      const view = plugin.canvasAdapter.getActiveCanvasView();
      if (view) void plugin.collapseManager.toggleAll(view);
    }
  });

  plugin.addCommand({
    id: "open-selected-card-quick-editor",
    name: "선택한 카드를 빠른 편집기로 열기",
    callback: () => void plugin.editorManager.openSelected()
  });
}
