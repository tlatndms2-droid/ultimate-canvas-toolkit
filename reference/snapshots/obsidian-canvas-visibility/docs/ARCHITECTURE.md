# Architecture

## Boundaries

```text
main / commands / settings
        |
        +-- CanvasAdapter (all private Canvas runtime access)
        |
        +-- CollapseManager -- TitleResolver -- TitleSizeModal -- MetadataStore
        |
        +-- EditorManager -- FloatingEditor -- livePreview
```

- `CanvasAdapter` is the only module that reads selection/runtime nodes and mutates Canvas node data.
- `CollapseManager` owns fold behavior and UI decoration but stores state outside `.canvas` JSON.
- `EditorManager` translates a selected card into an editable target.
- `FloatingEditor` owns CodeMirror, window geometry, focus, save, and close behavior.
- `livePreview` decorates editable Markdown for headings, emphasis, code, links, lists, and quotes while revealing markup on the active line.
- `MetadataStore` persists settings and fold metadata in the plugin's `data.json`.

## Safety model

Only `width`, `height`, or `text` are changed through the active Canvas runtime node. Fold titles and fold state are not written into `.canvas` JSON. Open collapsed nodes are restored to their recorded expanded dimensions when the plugin unloads.

Because the Canvas runtime API is private, real-vault compatibility must be tested after each supported Obsidian upgrade.
