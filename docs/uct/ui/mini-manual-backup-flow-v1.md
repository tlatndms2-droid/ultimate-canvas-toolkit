# 미니팔레트 수동 백업·복구 흐름 시안

2026-10-26. UI UX 설명을 위한 내장 image_gen 시안. 백업 파일 저장 위치는 매번 선택으로 확정. 메뉴 위치는 미확정이며 실제 구현 화면이 아님.
이미지: mini-manual-backup-flow-v1.png
기존 확정 내용: 백업은 사용자가 수동 실행. 백업에는 미디어 포함. 복구는 기존 자료와 섞지 않고 별도 복구 폴더에 생성.
시안이 제안하는 내용: Storage의 하나의 더보기 메뉴에서 백업/복구 실행, 매번 OS 파일 선택창으로 백업 위치와 복구 파일 선택.

## 생성 프롬프트

Use case: ui-mockup, one-screen-flow UX explanation. White only, clean refined UCT Mini Palette, warm terracotta highlights, legible Korean text, landscape canvas. Show how one overflow menu provides manual backup and restore without cluttering sidebar with multiple buttons. Header title "미니팔레트 · 수동 백업과 복구". Small badge "다음 기획 항목". Large central Mini Palette app frame matching gallery style: left Storage folder tree Collect, 프로젝트, 레퍼런스, format views; center selected Collect grid with a few small cards; no tags, no automatic backup indicators. In top-left Storage title bar show a single ⋯ overflow button. To right of app frame or overlapping as a clear zoomed detail, open dropdown menu from ⋯ with exactly two options: "백업 파일 만들기" and "백업 파일에서 복구". Under first option use numbered flow with arrow: (1) click backup file 만들기 -> (2) operating-system Save As dialog showing filename "UCT-Mini-Backup.zip" and chosen folder -> (3) saved single zip file with folder tree + items + image/PDF assets. Label "수동으로 누를 때만 생성". Under second option: (1) click restore -> (2) Open File dialog choose zip -> (3) Mini Storage tree gains one new folder "복구 · 2026-10-26 14:30" containing the backed-up folders and items, existing folder tree stays as it was. Mark that restored data is separate, no overwriting. Keep it as one infographic, left-to-right flows, large crisp concise Korean callouts. Don’t show periodic or automatic backup, backup history list or multiple old backups, no server/cloud icons, no extra persistent buttons besides the single ⋯ menu. Not an implemented screenshot, label "UI 시안". Exact labels and sequence.
