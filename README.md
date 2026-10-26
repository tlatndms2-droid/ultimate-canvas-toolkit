# Ultimate Canvas Toolkit

Obsidian Canvas의 Mindmap, Portal, Outliner, PDF 카드, 빠른 편집기, 이미지 내보내기와 Mini Palette를 하나로 통합한 데스크톱 플러그인입니다.

## 설치

Obsidian 1.14.4 이상에서 BRAT의 **Add beta plugin**에 `tlatndms2-droid/ultimate-canvas-toolkit`을 입력하세요. 기존 통합 대상 플러그인 7개는 중복 실행하지 않도록 끄고 UCT를 켭니다. 기존 플러그인의 저장 파일은 변경하지 않으며, 처음 실행할 때 읽어 UCT 저장소로 이관합니다.

## 주요 조작

| 동작 | 조작 / 결과 |
|---|---|
| 텍스트·Markdown 빠른 편집 | 카드 선택 후 Enter. Esc로 저장하고 닫기 |
| PDF 읽기 / 큰 보기 | Enter / Shift+Enter. Esc로 큰 보기 닫기 |
| Portal 진입·복귀 | Ctrl+Enter. Outliner가 현재 공간으로 전환 |
| 라벨 생성 | Alt+L → 카드 위에 이름 직접 입력. 라벨 더블클릭 → 이름·색상 |
| 캡션 생성 | Alt+C 또는 카드 아래에 나타나는 ＋ |
| Mini 열기 | 명령 팔레트의 **Mini Palette 열기/닫기** |
| Canvas → Mini | 기존 선택 툴바의 수집·잘라내기, 또는 해당 명령 |
| Mini → Canvas | 드래그하면 이동, Shift+드래그하면 복사. 오버레이에서 위치 확인, Esc 취소 |
| 분류 | Collect 자료를 Storage 폴더로 드래그. 형식별 보기는 모든 폴더에서 필터링 |
| 백업·복구 | Storage 아래 **백업**. 매번 ZIP 위치 선택 / 새 복구 폴더에 복구 |

라벨 있는 카드는 현재 공간 Outliner에 자동 표시됩니다. Outliner에서 라벨·캡션을 확인하고 Canvas Search에서 라벨로 검색할 수 있습니다. Mini는 독립 보관 도구이며 Outliner를 제어하거나 원본 내용과 지속 동기화하지 않습니다.

일반 이미지·PDF·Markdown 항목은 원본 파일에 연결됩니다. 이름·위치 변경을 따라가고 **원본 파일 삭제 시 해당 Mini 항목도 제거**됩니다. Canvas 카드만 삭제·잘라내는 것은 파일 삭제가 아닙니다. 링크 Portal은 예외로 수집 시점의 내부 Canvas와 필요한 로컬 파일을 별도 보관하여 원본 삭제 후에도 유지합니다. 웹 주소의 원격 콘텐츠 전체를 오프라인 보관하는 기능은 아닙니다.

폴더 삭제 시 직접 들어 있던 항목은 미분류로 이동하고, 하위 폴더는 미분류 아래에서 내부 구조를 유지합니다. ZIP 복구는 기존 자료를 덮어쓰지 않습니다. Mini 자동 백업·과거 시점 보관은 없습니다. Portal 자체의 저장 안전 기능은 유지합니다.

## 개발

Node.js 22 이상과 pnpm에서 `pnpm install`, `pnpm build`, `pnpm check`, `pnpm test`를 실행합니다. 배포 파일은 `main.js`, `manifest.json`, `styles.css`입니다. 원본 소스와 라이선스는 `vendor/`, 출처 커밋은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다.

- [현재 프로젝트 상태](PROJECT_MEMORY.md)
- [확정한 사용자 결정](docs/uct/DECISIONS.md)
- [전체 범위](docs/uct/MASTER_PLAN.md)
- [구현과 검증 기록](docs/uct/IMPLEMENTATION_PLAN.md)
- [사용자 확인 체크리스트](docs/uct/USER_CHECKLIST.md)

현재 버전은 0.1.1입니다. 기존 모든 기능의 모든 분기를 검증한 것은 아니며 검증 범위는 구현 기록에 구분했습니다. Image Copy의 파일 클립보드 기능은 Windows 전용입니다.

## 0.1.1 화면과 조작

Mini 항목은 한 번 클릭하면 상세, 더블클릭하면 형식별 큰 미리보기가 열립니다. PDF·이미지·Markdown·일반 카드·묶음·포탈의 형식과 아이콘을 구분합니다. 우클릭 **이름 변경**은 보관 항목의 표시 이름만 바꾸며 파일명을 바꾸지 않습니다. 묶음은 원래 크기·상대 위치·연결을 함께 축소합니다.

Storage 제목 옆 버튼으로 왼쪽 영역을 접고 중앙의 **Storage 펼치기**로 다시 엽니다. 폴더의 모두 접기/펼치기와 개별 화살표 상태는 저장됩니다. 창의 네 변·네 모서리에서 크기를 바꾸고 제목줄로 이동합니다.

Canvas 라벨·캡션은 Enter 또는 바깥 클릭으로 저장하고 Esc로 취소합니다. 캡션은 카드 아래 16px 간격으로 표시하며, 캡션이 없는 카드 아래에 마우스를 가까이 가져가면 단순 +가 나타납니다. Canvas Search의 **내용/라벨** 선택에서 라벨만 검색할 수 있습니다.

Waypoint 기능은 제거했습니다. 과거 Canvas의 Waypoint 기록은 삭제하지 않습니다. 발표 상단 버튼은 제거하고 동일 기능을 명령으로 제공합니다. [단축키와 명령](docs/uct/SHORTCUTS.md)을 참고하세요.
