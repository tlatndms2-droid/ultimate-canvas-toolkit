# 플러그인별 코드 분석

[프로젝트 메모리](../../PROJECT_MEMORY.md) · [결정 기록](DECISIONS.md) · [통합 분석](INTEGRATION_MAP.md)

전체 통합 범위·확정 사항·기능 접점·미결 사항·진행 순서는 [Ultimate Canvas Toolkit 전체 통합 기획](MASTER_PLAN.md)을 먼저 참조한다.
원본 코드 재사용 범위, 공통 인터페이스, 설정/자료 이전, 실행 순서와 완료 기준은 [기존 코드 통합 실행 계획](IMPLEMENTATION_PLAN.md)에 정리했다.

| 플러그인 | 조사 manifest | 분석 |
|---|---|---|
| Canvas Mindmap | 0.5.24 | [생성·연결·탐색·미디어](plugins/obsidian-advanced-mindmap.md) |
| Canvas Outliner | 0.1.56 | [자격·검색·발표·공간](plugins/obsidian-canvas-outliner.md) |
| Canvas Portal | 0.4.10 | [가상 공간·링크·저장](plugins/obsidian-canvas-portal.md) |
| Canvas Visibility | 0.7.1 | [Enter 편집기 추출](plugins/obsidian-canvas-visibility.md) |
| Canvas Image Copy | 0.1.0 | [파일 복사·저장](plugins/canvas-image-copy.md) |
| Canvas PDF Viewcard | 0.1.2 | [읽기·미리보기·캐시](plugins/obsidian-canvas-pdf-viewcard.md) |
| Canvas Palette | 0.4.7 | [수집·묶음·Mini·저장소](plugins/canvas-palette.md) |

각 분석의 기준 커밋과 코드 위치가 보관되어 있다. manifest 버전은 설치/Release 최신판 확인을 대신하지 않는다.

