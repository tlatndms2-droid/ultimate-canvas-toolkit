import { App, Modal, Setting } from "obsidian";

export interface FoldCardDetails {
  title: string;
  subtitle: string;
  description: string;
}

export class TitlePromptModal extends Modal {
  private value: string;
  private subtitle = "";
  private description = "";

  constructor(
    app: App,
    initialTitle: string,
    private readonly onSubmit: (details: FoldCardDetails) => void
  ) {
    super(app);
    this.value = initialTitle;
  }

  onOpen(): void {
    this.titleEl.setText("접힌 카드 제목");
    this.contentEl.createEl("p", { text: "카드의 첫 번째 제목 또는 내용 줄을 가져왔습니다. 필요하면 원하는 제목으로 바꾸세요. 부제와 설명은 접힌 상태에서만 표시됩니다." });

    new Setting(this.contentEl)
      .setName("제목")
      .addText((text) => {
        text.setPlaceholder("카드 제목");
        text.setValue(this.value);
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && this.value.trim()) this.submit();
        });
        text.onChange((value) => { this.value = value; });
        window.setTimeout(() => text.inputEl.focus(), 0);
      });

    new Setting(this.contentEl)
      .setName("부제")
      .addText((text) => text
        .setPlaceholder("선택 사항")
        .onChange((value) => { this.subtitle = value; }));

    const descriptionSetting = new Setting(this.contentEl).setName("설명");
    const descriptionInput = descriptionSetting.controlEl.createEl("textarea", {
      cls: "cv-fold-description-input",
      attr: { placeholder: "접힌 카드에 표시할 설명 (선택 사항)", rows: "3" }
    });
    descriptionInput.addEventListener("input", () => { this.description = descriptionInput.value; });

    new Setting(this.contentEl)
      .addButton((button) => button
        .setButtonText("접기 사용")
        .setCta()
        .onClick(() => this.submit()));
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private submit(): void {
    const title = this.value.trim();
    if (!title) return;
    this.close();
    this.onSubmit({
      title,
      subtitle: this.subtitle.trim(),
      description: this.description.trim()
    });
  }
}
