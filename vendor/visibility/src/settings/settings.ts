import { App, PluginSettingTab, Setting } from "obsidian";
import type CanvasVisibilityPlugin from "../main";
import type { CanvasVisibilitySettings } from "../types";

export const DEFAULT_SETTINGS: CanvasVisibilitySettings = {
  collapsibleCardsEnabled: true,
  quickEditorEnabled: true,
  collapseHeight: 45,
  defaultFoldTitleFontSize: 18,
  editorWidthPercent: 75,
  editorHeightPercent: 80,
  editorX: null,
  editorY: null,
  editorWidth: null,
  editorHeight: null,
  closeEditorOnOutsideClick: false
};

export class CanvasVisibilitySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: CanvasVisibilityPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas Visibility 설정" });

    new Setting(containerEl)
      .setName("카드 접기")
      .setDesc("Canvas 텍스트 카드와 마크다운 파일 카드를 접을 수 있게 합니다.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.collapsibleCardsEnabled)
        .onChange(async (value) => {
          this.plugin.settings.collapsibleCardsEnabled = value;
          await this.plugin.savePluginData();
          await this.plugin.refreshOpenCanvases();
        }));

    new Setting(containerEl)
      .setName("빠른 카드 편집기")
      .setDesc("선택한 텍스트 또는 마크다운 카드를 떠 있는 Live Preview 편집기로 엽니다.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.quickEditorEnabled)
        .onChange(async (value) => {
          this.plugin.settings.quickEditorEnabled = value;
          await this.plugin.savePluginData();
          if (!value) this.plugin.closeQuickEditor();
          await this.plugin.refreshOpenCanvases();
        }));

    new Setting(containerEl)
      .setName("접힌 카드 기본 높이")
      .setDesc("접힌 카드에 사용할 기본 높이입니다. 큰 제목은 필요한 최소 높이를 자동으로 확보합니다.")
      .addSlider((slider) => slider
        .setLimits(32, 100, 1)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.collapseHeight)
        .onChange(async (value) => {
          this.plugin.settings.collapseHeight = value;
          await this.plugin.savePluginData();
          await this.plugin.refreshOpenCanvases();
        }));

    new Setting(containerEl)
      .setName("접힌 카드 기본 제목 크기")
      .setDesc("카드별 크기를 지정하지 않았을 때 사용하는 제목 크기입니다. 카드를 선택하면 카드별로 12–200px 범위에서 변경할 수 있습니다.")
      .addSlider((slider) => slider
        .setLimits(12, 200, 1)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.defaultFoldTitleFontSize)
        .onChange(async (value) => {
          this.plugin.settings.defaultFoldTitleFontSize = value;
          await this.plugin.savePluginData();
          await this.plugin.refreshOpenCanvases();
        }));

    new Setting(containerEl)
      .setName("빠른 편집기 기본 너비")
      .setDesc("저장된 창 크기가 없을 때 사용할 Obsidian 창 너비 비율입니다.")
      .addSlider((slider) => slider
        .setLimits(40, 95, 1)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.editorWidthPercent)
        .onChange(async (value) => {
          this.plugin.settings.editorWidthPercent = value;
          await this.plugin.savePluginData();
        }));

    new Setting(containerEl)
      .setName("빠른 편집기 기본 높이")
      .setDesc("저장된 창 크기가 없을 때 사용할 Obsidian 창 높이 비율입니다.")
      .addSlider((slider) => slider
        .setLimits(40, 95, 1)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.editorHeightPercent)
        .onChange(async (value) => {
          this.plugin.settings.editorHeightPercent = value;
          await this.plugin.savePluginData();
        }));

    new Setting(containerEl)
      .setName("바깥쪽 클릭 시 편집기 닫기")
      .setDesc("편집기 바깥쪽의 어두운 영역을 클릭하면 편집기를 저장하고 닫습니다.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.closeEditorOnOutsideClick)
        .onChange(async (value) => {
          this.plugin.settings.closeEditorOnOutsideClick = value;
          await this.plugin.savePluginData();
        }));
  }
}
