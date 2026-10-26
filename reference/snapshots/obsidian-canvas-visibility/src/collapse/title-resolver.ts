import type { CanvasNodeLike, FoldNodeState } from "../types";
import { CanvasAdapter } from "../canvas/canvas-adapter";

export function getTextCardTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const line = value.split(/\r?\n/).find((item) => item.trim().length > 0)?.trim();
  if (!line) return null;
  const cleaned = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/\*\*|__|`/g, "")
    .trim();
  return cleaned ? cleaned.slice(0, 80) : null;
}

export class TitleResolver {
  constructor(private readonly adapter: CanvasAdapter) {}

  async resolve(node: CanvasNodeLike, state?: FoldNodeState): Promise<string> {
    const kind = this.adapter.getEditableKind(node);
    if (kind === "text") {
      return state?.customTitle?.trim()
        || getTextCardTitle(node.getData().text)
        || "텍스트 카드";
    }

    const file = this.adapter.resolveMarkdownFile(node);
    if (!file) return "지원하지 않는 카드";
    return state?.customTitle?.trim() || file.basename;
  }

}
