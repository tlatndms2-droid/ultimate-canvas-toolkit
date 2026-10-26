import { App, Modal, Setting } from "obsidian";
import type { FoldCardDetails } from "./title-prompt-modal";

export interface FoldTextSizes {
  title: number;
  subtitle: number;
  description: number;
}

export interface FoldHeaderColors {
  title: string | null;
  background: string | null;
}

export class TitleSizeModal extends Modal {
  private readonly details: FoldCardDetails;
  private readonly sizes: FoldTextSizes;
  private readonly colors: FoldHeaderColors;

  constructor(
    app: App,
    currentDetails: FoldCardDetails,
    currentSizes: FoldTextSizes,
    currentColors: FoldHeaderColors,
    private readonly defaultTitleSize: number,
    private readonly onSubmit: (
      details: FoldCardDetails,
      sizes: FoldTextSizes,
      colors: FoldHeaderColors
    ) => void,
    private readonly onReset: (details: FoldCardDetails) => void
  ) {
    super(app);
    this.details = { ...currentDetails };
    this.sizes = { ...currentSizes };
    this.colors = { ...currentColors };
  }

  onOpen(): void {
    this.modalEl.addClass("cv-fold-card-settings-modal");
    this.titleEl.setText("접힌 카드 설정");
    this.contentEl.createEl("p", { text: "선택한 카드의 제목, 부제, 설명과 표시 스타일을 수정합니다." });

    this.addTextInput("제목", "카드 제목", "title");
    this.addTextInput("부제", "선택 사항", "subtitle");

    const descriptionSetting = new Setting(this.contentEl).setName("설명");
    const descriptionInput = descriptionSetting.controlEl.createEl("textarea", {
      cls: "cv-fold-description-input",
      attr: { placeholder: "접힌 카드에 표시할 설명 (선택 사항)", rows: "3" }
    });
    descriptionInput.value = this.details.description;
    descriptionInput.addEventListener("input", () => { this.details.description = descriptionInput.value; });

    this.addSizeSlider("제목 크기", this.sizes.title, 12, 200, "title");
    this.addSizeSlider("부제 크기", this.sizes.subtitle, 8, 72, "subtitle");
    this.addSizeSlider("설명 크기", this.sizes.description, 8, 72, "description");
    this.addColorPicker("제목 글자색", this.colors.title, "title");
    this.addColorPicker("헤더 배경색", this.colors.background, "background");

    new Setting(this.contentEl)
      .addButton((button) => button
        .setButtonText(`기본값으로 되돌리기 (제목 ${this.defaultTitleSize}px)`)
        .onClick(() => {
          this.onReset(this.getTrimmedDetails());
          this.close();
        }))
      .addButton((button) => button
        .setButtonText("취소")
        .onClick(() => this.close()))
      .addButton((button) => button
        .setButtonText("완료")
        .setCta()
        .onClick(() => this.submit()));
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private addTextInput(name: string, placeholder: string, key: "title" | "subtitle"): void {
    new Setting(this.contentEl)
      .setName(name)
      .addText((text) => {
        text.setPlaceholder(placeholder);
        text.setValue(this.details[key]);
        text.inputEl.addClass("cv-fold-text-input");
        text.onChange((value) => { this.details[key] = value; });
      });
  }

  private addSizeSlider(name: string, value: number, min: number, max: number, key: keyof FoldTextSizes): void {
    new Setting(this.contentEl)
      .setName(name)
      .addSlider((slider) => slider
        .setLimits(min, max, 1)
        .setDynamicTooltip()
        .setValue(value)
        .onChange((next) => { this.sizes[key] = next; }));
  }

  private addColorPicker(name: string, value: string | null, key: keyof FoldHeaderColors): void {
    const setting = new Setting(this.contentEl).setName(name);
    const input = setting.controlEl.createEl("input", {
      attr: { type: "color", value: value ?? "#808080", "aria-label": name }
    });
    input.addEventListener("input", () => { this.colors[key] = input.value; });
    setting.addExtraButton((button) => button
      .setIcon("reset")
      .setTooltip("기본 색상으로 되돌리기")
      .onClick(() => {
        this.colors[key] = null;
        input.value = "#808080";
      }));
  }

  private submit(): void {
    const details = this.getTrimmedDetails();
    if (!details.title) {
      const titleInput = this.contentEl.querySelector<HTMLInputElement>(".cv-fold-text-input");
      titleInput?.focus();
      titleInput?.addClass("is-invalid");
      return;
    }
    this.onSubmit(details, { ...this.sizes }, { ...this.colors });
    this.close();
  }

  private getTrimmedDetails(): FoldCardDetails {
    return {
      title: this.details.title.trim(),
      subtitle: this.details.subtitle.trim(),
      description: this.details.description.trim()
    };
  }
}
