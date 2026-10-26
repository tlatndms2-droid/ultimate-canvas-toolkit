# UCT 0.1.0 handoff

2026-10-26. Code integration, build, 8 tests, isolated Obsidian 1.14.5 UI and same-Sandbox restart checks passed. Public Release 0.1.0 and BRAT 2.2.0 Latest version installation/activation passed. All three public assets matched the final build. BRAT main.js/styles.css are byte-identical; manifest JSON fields are identical, with BRAT whitespace serialization differences only. Source tag 0.1.0 points at 1800dcc.

Read PROJECT_MEMORY.md, docs/uct/DECISIONS.md, docs/uct/IMPLEMENTATION_PLAN.md. Do not reopen settled choices. Final user authorization includes implementation and public release. Never delete original repositories until the human explicitly says “완성됐다”.

## Build

Node >=22; pnpm install; pnpm build; pnpm check; pnpm test. Build entry src/main.ts and module sources vendor/. Root main.js/styles.css are generated and gitignored; attach main.js, manifest.json, styles.css to Release tag 0.1.0. No dependency on the original working repositories.

## Runtime and data

Root plugin id ultimate-canvas-toolkit. Internal child module ids are namespaced; each uses modules/<name>/data.json, Outliner its dedicated settings file, Mini library.json. Existing plugin data are copied read-only on first run. Do not enable the seven originals alongside UCT.

Use only the already confirmed **work/UCT-Integration-Sandbox** and **work/UCT-Integration-Profile**, CDP port 19762 (rediscover on restart). App 1.14.5. Do not touch another Obsidian process or working Vault. Sandbox test files intentionally include deleted source fixtures, replacement files and recovery folders. Pre-test copies and evidence live in .validation/; do not delete them or publish them. Leave this Sandbox open for user review.

Product fixes during validation: Mini below native modal z-layer; native Shift+PDF drag fallback; editor focus after Enter; item editor openItem method; per-space Mindmap origins/Waypoints; failed placement rollback; rename metadata; recursive backup dependencies and link remapping; per-render Mini Markdown/observer/PDF cleanup. Final asset hashes and restart records are retained locally.

See IMPLEMENTATION_PLAN.md for executed checks and explicit untested branches. No claim of complete regression testing or measured speedup against the seven originals.

Final Mini geometry fix: ResizeObserver records dimensions only during a real user resize gesture. Initial pre-stylesheet layout must not overwrite the persisted size. Actual resize to 1180x750, BRAT reload and same-Sandbox restart preserve the dimensions. Release repaired in place before final BRAT verification. Local final evidence: .validation/final-restart.json, public-release.json, brat-assets.json. User-facing checklist: docs/uct/USER_CHECKLIST.md.
