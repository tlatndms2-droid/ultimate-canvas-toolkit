# Canvas Outliner — 표시 자격·검색·발표·공간

> 조사일 2026-10-26 · manifest 0.1.56 · 기준 커밋 df744083bc39addaafd4ea55ae0fa77e9f626ed4
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/obsidian-canvas-outliner/tree/df744083bc39addaafd4ea55ae0fa77e9f626ed4/src) · [로컬 스냅샷](../../../reference/snapshots/obsidian-canvas-outliner/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 기존 표시 자격과 계층

src/main.ts:156 renderRows의 eligible은 Canvas group 또는 state.registered에 있는 노드다. 일반 카드가 전부 자동 표시되는 구조가 아니다. :96 state는 Canvas 파일 경로를 키로 사용한다. adapter.ts는 활성 Canvas 런타임 getData를 읽으며 Portal 전용 공간 API는 없다.

model.ts hierarchy는 카드가 들어 있는 가장 작은 그룹의 **좌표 영역**으로 부모를 정한다. Mindmap 연결선 방향으로 계층을 구성하는 것과 다르다. Collection은 별도 참조 묶음이고 중복 참조 정규화가 있다. Collection만 삭제하는 기존 동작은 하위 Collection을 위로 올리고 원본 Canvas 카드를 삭제하지 않는다.

main.ts에는 등록/해제, Sidebar/Remote Outliner, Collection, 사용자 순서, 이름 변경, 선택·이동, 자체 undo/redo가 있다. model.ts의 meta는 이름/순서/수정 시점 등의 상태를 보관한다.

## Canvas Search와 Outliner 검색을 혼동하지 않기

src/search.ts는 Canvas Search UI, 검색 후 카드 선택·화면 맞춤·Markdown 줄 이동을 맡는다. model.ts의 검색은 제목/텍스트/경로/URL/native label 등을 조합하며 Canvas 전체 검색과 Outliner 범위를 구분한다. native Canvas group label이 검색되는 것과 Palette metadata.label이 검색되는 것은 같은 일이 아니다.

검색은 120ms 지연, 작업 토큰 검사, 80개 단위 결과 렌더링과 IntersectionObserver를 사용한다. Markdown 내용 읽기도 포함된다. 새 공통 라벨을 검색 입력에 명시적으로 추가해야 한다.

사용자 결정: **현재 공간의 라벨 있는 항목은 별도 수동 등록 없이 표시 자격을 얻고, 라벨과 캡션을 Outliner에서 확인하며, Canvas Search에 라벨도 넣는다.** 기존 수동 등록 항목/그룹 자격을 제거하라는 뜻은 아니다.

## 발표 기능은 별도 기존 기능

presentation.ts에는 P 발표 전환, V Vision, O Remote, 발표 중 좌우 이동, 번호 이동, 영역과 읽기 전용 보호, 사이드바 복원 등이 있다. vision-group.ts와 area-selection.ts가 가시 영역·선택을 맡는다. 이 기능들은 삭제 승인 대상이 아니므로 단순 목록으로 축소하지 않는다.

adapter.ts는 Canvas 접근/선택/확대, identity.ts는 Canvas 식별과 복제 시 상태 상속, storage.ts는 저장 안전성, copy.ts는 복사 관련 처리, pin.ts는 Remote 고정이다. 기존 보호·상속 정책은 파일 ID와 포탈 공간 ID를 분리해서 유지해야 한다.

## Portal 통합 시 우선 변경점

파일 경로만으로 저장 상태·history·snapshot을 구분하면 같은 파일 안 Portal 전환이 분리되지 않는다. Portal의 현재 graph와 현재 공간 식별자를 받아 eligibility/검색/선택 대상을 제한해야 한다. 링크 Portal에서는 대상 Canvas를 따른다. 정확한 증상은 실행 재현 전이므로 “원인 확정/해결 완료”로 표현하지 않는다.

## 성능

main.ts:90 refresh 350ms, busy/identity readiness 보호 및 실패 재시도 간격이 있다. fileChanged는 관련 파일 서명을 계산하고 meta를 갱신한다. Portal 전환을 명시적 이벤트로 받으면 잦은 전체 비교를 줄일 여지가 있다. 기존 JSON snapshot 비교 및 검색 파일 읽기 비용은 데이터 규모에 따라 달라진다. 정량 성능은 미측정.

