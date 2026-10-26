# Canvas Visibility — Enter 편집기만 추출

> 조사일 2026-10-26 · manifest 0.7.1 · 기준 커밋 fe3a3bd6178a968f8ba544ab3b467e92254c1fe6
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/obsidian-canvas-visibility/tree/fe3a3bd6178a968f8ba544ab3b467e92254c1fe6/src) · [로컬 스냅샷](../../../reference/snapshots/obsidian-canvas-visibility/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 유지할 실제 기능

src/main.ts:37–48의 document capture keydown은 수정키 없는 Enter, 조합 입력 아님, 반복 아님, Canvas 포커스, 입력/메뉴/모달 아님, 단일 편집 가능 텍스트 또는 Markdown 노드를 확인한 뒤 편집기를 연다. 모든 종류의 카드를 편집기로 여는 것이 아니다.

editor/editor-manager.ts는 Canvas 경로+노드 ID를 키로 열린 창을 관리한다. 이미 열린 대상은 활성화하고 여러 편집창은 위치를 조금씩 옮겨 연다. floating-editor.ts는 이동·크기 조절, 저장, 닫기, 설정된 바깥 클릭 정책과 위치 저장을 담당한다. Ctrl+S 저장, Esc 닫기 경로가 있다.

native-markdown-editor.ts:31 mount는 Obsidian WorkspaceSplit/WorkspaceLeaf/MarkdownView를 실제로 내장한다. 파일이면 해당 Markdown 파일을 열고 저장하며, 텍스트 카드는 메모리 MarkdownView의 내용으로 노드 텍스트를 갱신한다. 임시 Markdown 파일을 반드시 생성하는 방식이 아니다. detach는 내장 leaf와 split을 해제한다.

## 제거할 부분과 숨은 의존성

사용자가 제거하라는 것은 Visibility 접기 기능 전체다. collapse-manager와 관련 명령/설정/갱신을 제거할 대상이다. 단, editor-manager는 collapse/title-resolver와 MetadataStore를 사용하고 닫기 callback이 refreshOpenCanvases로 이어진다. 폴더 이름이 collapse라는 이유만으로 먼저 삭제하면 편집기까지 깨진다. 제목 해석과 필요한 metadata를 독립 모듈로 추출해야 한다.

Canvas Palette에도 editor-manager/floating-editor/native-markdown-editor가 있다. 두 편집기를 그대로 함께 켜지 않고, 편집 대상 모델·저장 callback·창 geometry 수명주기를 비교한 뒤 공통 호스트를 재사용할 수 있다. 모든 UI와 저장 의미가 이미 같다는 뜻은 아니다.

## 입력/공간 충돌과 비용

Enter를 Mindmap 미디어, PDF 읽기와 타입별로 분배한다. Portal 내부는 파일+노드 키만으로 충분한지 점검하고 필요하면 공간 ID를 포함한다. 편집 중 Portal 전환 전에 flush/저장 관계를 보존해야 한다.

main.ts는 collapse 관련 1500ms refresh와 150ms 예약 갱신을 가진다. 접기를 제거하면 이 갱신의 상당 부분도 제거 대상이다. 편집창을 열 때만 내장 MarkdownView 비용이 발생하도록 수명주기를 정리한다. 실행 성능·누수는 미측정.

