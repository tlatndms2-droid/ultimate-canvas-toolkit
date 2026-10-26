# UCT 0.1.1 handoff

2026-10-27. Approved 12 mockups implemented. Build, TypeScript check, 11 tests, isolated Obsidian 1.14.5 UI and same-Sandbox restart passed. Release/BRAT verification pending. Read PROJECT_MEMORY.md, latest DECISIONS section and latest IMPLEMENTATION_PLAN section before continuing. Do not reopen settled choices.

## Source and build

Public repository: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit . Node >=22; pnpm build/check/test. Generated main.js/styles.css are release assets, manifest version0.1.1, minAppVersion1.14.4. Source styles are tracked explicitly; preserve those exceptions in .gitignore. No new runtime dependencies.

## Current behavior

Alt+L inline name; label doubleclick anchored name/color. Alt+C or plain + caption, 16px logical gap. Enter/outside saves, Esc cancels. Waypoint UI/runtime/commands removed; historical Canvas fields untouched. Portal icons distinct. Presentation control strip removed; functions remain commands, new commands unbound. Mini derived format classification preserves saved types. Single click details, doubleclick big preview, rename by latest ID and customDisplayTitle; source filenames untouched. Native-coordinate group stage scales uniformly, including edges and PDF. Optional library.ui.collapsedFolders, 8 resize edges/corners. Preview lifetime closes PDF refs/media/observers/components. Initial detail rendering is delayed350ms to preserve actual doubleclick in a reflowing grid.

## Data and Sandbox

Use only existing work/UCT-Integration-Sandbox and work/UCT-Integration-Profile, CDP19762; rediscover after restart. Never touch another Obsidian process or working Vault. Keep Sandbox open for review. Test Canvas UCT-011-Check.canvas and folder 0.1.1 검증 자료 contain own fixtures. Existing user6 Mini items are JSON-identical to pre-update copies. Backups and private evidence in .validation/0.1.1; never publish. library version remains1, module data paths unchanged. Selected Mini view/item are not newly persisted; geometry/collapse/data are.

## Safety and limits

Original seven repositories must remain until the human explicitly says “완성됐다”. No working Vault change, no original filename change, no automatic backup or destructive old Waypoint cleanup. Runtime checks and limitations are in IMPLEMENTATION_PLAN; no claim of complete all-branch regression or measured speedup.
