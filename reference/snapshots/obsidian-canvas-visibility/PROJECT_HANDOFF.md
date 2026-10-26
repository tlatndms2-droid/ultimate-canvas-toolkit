# Canvas Visibility 인수인계

## 프로젝트 개요

Canvas Visibility는 Obsidian Canvas의 텍스트 카드와 마크다운 파일 카드를 제목만 보이도록 접고, 선택한 카드를 별도의 떠 있는 Live Preview 편집기에서 수정할 수 있게 하는 데스크톱·모바일 호환 플러그인입니다.

- 저장소: `tlatndms2-droid/obsidian-canvas-visibility`
- 현재 버전: `0.7.1`
- 기본 브랜치: `main`
- 배포 산출물: `main.js`, `manifest.json`, `styles.css`
- 최소 Obsidian 버전: `1.5.0`

## 핵심 사용자 기능

### 카드 접기

- 지원 대상은 Canvas 텍스트 카드와 `.md` 파일 카드입니다.
- 카드별로 접기 사용 여부, 접힘 상태, 제목, 제목 크기 및 원래 크기를 플러그인 데이터에 저장합니다.
- 텍스트 카드의 접기 제목 입력창은 카드의 첫 제목 또는 내용 줄을 미리 채우고, 사용자가 원하는 제목으로 바꿀 수 있습니다.
- 텍스트·마크다운 파일 카드 모두 접기 설정에서 제목·부제·설명을 입력할 수 있으며, 부제와 설명은 접힌 카드에서만 제목 아래에 표시됩니다.
- 파일 카드는 Markdown H1이 아닌 파일명을 제목으로 표시합니다.
- 제목 크기는 카드별로 12–200px 범위에서 설정할 수 있고, 설정 기본값은 18px입니다.
- 카드별 글자 크기 창에서 제목 글자색과 헤더 배경색도 지정하거나 테마 기본값으로 되돌릴 수 있습니다.
- 접힌 상태에서는 오른쪽 가로 전용 손잡이로 폭을 조절하고 카드별로 저장합니다. 부제와 설명의 크기도 카드별 글자 크기 창에서 조절합니다.
- 카드 폭은 접힘·펼침 상태가 공유하고, 펼친 카드의 세로 높이는 별도로 저장합니다. 접힌 카드는 제목·부제·설명의 실제 표시 높이에 맞춰 자동으로 낮아집니다.
- 접힌 카드의 제목 영역은 드래그로 이동할 수 있으며, 버튼은 접기/펼치기 동작만 처리합니다.
- 카드 전체 접기·펼치기·전환 명령을 제공합니다.
- 카드 하나를 선택하면 Canvas 상단 도구 모음의 접기 버튼으로 접기 설정 또는 접기·펼치기를 실행할 수 있습니다.

### 빠른 편집기

- 선택한 텍스트 카드 또는 마크다운 파일 카드를 이동·크기 조절 가능한 떠 있는 창으로 엽니다.
- 카드별 편집기를 동시에 여러 개 열 수 있으며, 이미 열린 같은 카드는 중복 창 대신 기존 창을 앞으로 가져옵니다.
- 각 편집기는 제목줄만 남기고 접을 수 있으며, 펼치면 접기 전 높이가 복원됩니다.
- 실제 Obsidian `WorkspaceLeaf`와 `MarkdownView`를 사용하므로 Live Preview와 Obsidian 생태계의 렌더링 확장을 따릅니다.
- 접힌 카드 제목을 더블클릭해도 빠른 편집기를 열 수 있습니다.
- 카드 하나를 선택하면 접기 버튼 바로 옆의 빠른 편집기 버튼이나 Enter로 열 수 있습니다.
- 빠른 편집기 열기 전환은 `opacity`와 `transform`만 170ms 동안 사용하며, `prefers-reduced-motion` 환경에서는 비활성화됩니다.
- 위치·크기는 `data.json`에 저장되어 다음 실행에서 복원됩니다.
- Ctrl/Cmd+S, Esc, 닫기 버튼 및 선택적 바깥 클릭 닫기를 지원합니다.

## 아키텍처와 책임

```text
main / commands / settings
        |
        +-- CanvasAdapter (Canvas 비공개 런타임 접근 단일 경계)
        |
        +-- CollapseManager -- TitleResolver -- TitleSizeModal -- MetadataStore
        |
        +-- EditorManager -- FloatingEditor -- Native MarkdownView
```

| 경로 | 역할 |
| --- | --- |
| `src/main.ts` | 플러그인 수명 주기, Canvas 메뉴 등록, 열린 Canvas 갱신 |
| `src/canvas/canvas-adapter.ts` | Canvas 런타임 노드의 조회·크기·위치·텍스트 갱신 |
| `src/collapse/` | 접기 UI, 제목 결정, 제목 입력/크기 모달 |
| `src/editor/` | 빠른 편집기 열기, 창 수명 주기와 Native MarkdownView 연결 |
| `src/commands/commands.ts` | 명령 팔레트 명령 등록 |
| `src/settings/settings.ts` | 기본값과 설정 UI |
| `src/storage/metadata-store.ts` | 플러그인 `data.json` 설정·카드 상태 저장 |
| `styles.css` | 접힌 카드와 떠 있는 편집기 UI 스타일 |

## 데이터와 안전 원칙

- 접기 상태, 접힌 제목, 제목 크기는 `.canvas` JSON에 기록하지 않고 플러그인의 `data.json`에 저장합니다.
- Canvas 런타임에는 필요한 `width`, `height`, `text`, 위치만 반영합니다.
- 플러그인을 언로드할 때 열려 있는 접힌 카드는 기록된 펼친 크기로 되돌립니다.
- Canvas 런타임 API는 공개 API가 아니므로 Obsidian 업데이트 후 실제 vault에서 반드시 회귀 검증해야 합니다.
- Canvas 파일 이름 변경은 저장된 카드 상태 키도 함께 이전합니다.

## 개발·검증·배포

```powershell
pnpm install
pnpm build
pnpm verify
```

- `pnpm build`는 TypeScript 검사 후 `main.js`를 생성합니다.
- `pnpm verify`는 배포 패키지를 검사합니다.
- Obsidian 설치 테스트 시 `main.js`, `manifest.json`, `styles.css`를 `<vault>/.obsidian/plugins/canvas-visibility/`에 복사합니다.
- BRAT 설치 식별자는 `tlatndms2-droid/obsidian-canvas-visibility`입니다.

## 변경 시 체크 포인트

1. Canvas 내부 접근은 `CanvasAdapter`에만 추가합니다. 다른 모듈에서 런타임 노드에 직접 의존하지 않습니다.
2. 접기 동작 변경 시 텍스트 카드와 파일 카드 모두, 제목/높이/드래그를 확인합니다.
3. 편집기 변경 시 텍스트 카드와 파일 카드의 저장, Live Preview, 창 위치·크기 복원을 확인합니다.
4. 설정·명령·메뉴·Notice 문구는 현재 한국어 UX를 유지합니다.
5. `docs/ACCEPTANCE.md`의 실제 Obsidian 검수 항목을 실행하고, 빌드와 패키지 검증을 통과한 뒤 배포합니다.

## 알려진 주의점

- Canvas 비공개 런타임의 구조가 바뀌면 `CanvasAdapter.toCanvasView`, 선택 노드 처리 또는 렌더 갱신 로직이 영향을 받을 수 있습니다.
- README의 기능 소개와 `manifest.json` 설명은 사용자 공개 정보이므로 기능 변경 시 함께 갱신합니다.
- `CHANGELOG.md`에는 현재 0.2.0까지의 항목만 정리되어 있으므로 이후 릴리스 시 0.3.0과 새 변경 사항을 추가해 버전 이력을 맞추는 것이 좋습니다.
