# Canvas Mindmap — 생성·연결·탐색·미디어

> 조사일 2026-10-26 · manifest 0.5.24 · 기준 커밋 f8a707bfc3dbe0f8e5d4f23b16198bc3efa827ef
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/obsidian-advanced-mindmap/tree/f8a707bfc3dbe0f8e5d4f23b16198bc3efa827ef/src) · [로컬 스냅샷](../../../reference/snapshots/obsidian-advanced-mindmap/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 기존 조작과 구성

src/main.ts에 명령과 키 처리가 집중되어 있다. 선택 카드의 방향으로 Ctrl+화살표 생성, Tab 짧게 아래 생성/길게 소스 선택, 생성/연결 모드, 연결 해제·방향 반전·방향 연결, 정렬 기능이 있다. Alt+화살표는 가까운 카드 탐색, Shift+화살표는 화면 이동, Ctrl+Shift+화살표는 크기 조절, Ctrl+Alt+위/아래는 카드 자리 교환, Ctrl+Alt+Shift+방향은 방향 복수 선택이다.

Alt+I 파일 삽입/교체, Alt+W Waypoint, Ctrl+Shift+C 색상 팔레트, Alt+R 선택 텍스트 크기에 맞추기, Alt+M 메뉴. 숫자패드 1–9는 Waypoint 호출, Ctrl+숫자패드는 카드 등록, Ctrl+Shift+숫자패드는 화면 위치 등록이다. Ctrl+Space 편집 전환, X 선택 카드 삭제도 있으므로 입력 포커스 보호가 중요하다. 실제 사용자 키맵 재설정은 별개다.

## 생성 원리

layout.ts의 sources는 연결 관계에서 소스를 구한다. createLayout은 기준 카드의 위치·크기·gap·방향으로 새 카드 좌표를 계산하고 연결 여부를 반영한다. main.ts:379 부근 create는 history를 확보한 뒤 creation-transaction의 적용·실패 복원을 거쳐 선택·포커스·저장을 요청한다. 임의로 새 생성기를 만드는 대신 이 경로를 재사용한다.

navigation.ts, size.ts, arrange.ts, selection-history.ts는 각각 탐색, 크기, 정렬, 선택 복원 역할이다. editor-camera.ts는 편집 시 화면/줌, file-insert.ts와 media-previews.ts는 파일 선택·미리보기 담당이다. panels.ts는 색상·Waypoint 등 패널, runtime-cleanup.ts는 런타임 자원 정리다. 이 보조 모듈은 보관 및 접점 검토 대상이며 모든 UI 분기를 실행 검증한 것은 아니다.

## Enter는 이미 미디어 기능도 맡는다

card-media.ts:28 supports는 이미지·영상·오디오 파일 및 식별된 YouTube 링크를 받는다. 이미지 Enter는 큰 미리보기, 오디오/영상 Enter는 재생, YouTube는 허용한 webview 주소에 재생 명령을 보낸다. PDF/일반 텍스트는 이 클래스 대상이 아니다. Visibility 편집과 PDF 읽기에 덮어쓰지 않도록 타입·포커스별 라우팅이 필요하다.

main.ts는 편집 입력, drawing 상태, 반복 키 등을 검사한다. drawingBlocked 시 키/타이머/미디어 동작을 중단하는 기존 보호를 보존한다.

## 통합 영향

사용자 요구의 라벨 생성/캡션 생성 단축키는 기존 생성·편집 체계에 각각 추가할 대상이다. 실제 키 조합은 아직 확정되지 않았다. Palette의 metadata를 공통으로 읽고 쓰게 하되 Mini 항목과 Canvas 원본을 지속 동기화하는 기능으로 확대하지 않는다.

Waypoint와 여러 상태가 파일 경로에 걸려 있으므로 Portal 내부 문맥을 함께 구분할 필요가 있다. 무조건 전부 현재 포탈별로 바꾸는 것이 아니라 위치 의미에 따라 검토한다.

## 성능

main.ts:84–90 부근 100ms 주기에서 현재 Canvas 탐색/크기/선택/편집 카메라/파일 삽입/배지 등을 갱신한다. MutationObserver 및 iframe 관련 이벤트도 있다. 통합 시 “플러그인 수 감소”만으로 이 스캔이 사라지지 않는다. 공통 Canvas 변경 이벤트로 필요한 모듈만 갱신하도록 바꿀 여지가 있다. 정량 성능은 미측정.

