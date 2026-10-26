# Canvas Palette — 기존 동작과 Mini 전환

> 조사일 2026-10-26 · manifest 0.4.7 · 기준 커밋 de8172f3fbdfe002abf0fcc9ac05eb375c226a24
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/canvas-palette/tree/de8172f3fbdfe002abf0fcc9ac05eb375c226a24/src) · [로컬 스냅샷](../../../reference/snapshots/canvas-palette/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 기존 수집은 이미 구현되어 있다

Canvas 선택 툴바의 inbox 아이콘 **Collect to Mini Palette**, 가위 아이콘 **잘라내어 Mini Palette에 수집**을 사용한다. 일반 수집 명령과 선택 텍스트 수집도 있다. 새 조작을 사용자에게 다시 정하라고 물을 부분이 아니다.

- src/canvas/canvas-node-toolbar-controller.ts:101–102: 두 버튼.
- src/main.ts:418–432: 수집/잘라내기 → store → Collect 표시.
- src/canvas/canvas-adapter.ts:171: 일반 수집은 선택 ID와 저장된 Canvas 문서를 읽는다.
- 같은 파일 :179: 잘라내기는 런타임 문서에서 선택 그룹의 포함 카드를 확장하고 하나의 “잘라낸 묶음”으로 저장한 뒤 원래 Canvas에서 카드와 연결선을 제거하고 저장한다.
- 같은 파일 :214: 일반 여러 카드 수집은 각각 자료가 될 수 있고 실제 그룹 선택은 그룹으로 저장된다. 일반 수집과 잘라내기의 묶음 단위는 같지 않다.

## 묶음 보존과 재배치

group-serializer.ts는 상대 좌표, 크기, 묶음 안의 양 끝점에 연결된 선을 보관한다. 복원 시 새 ID에 연결을 다시 매핑한다. 따라서 기존 묶음의 모양과 내부 연결 보존은 재사용할 기능이다. 따로 수집된 여러 카드 사이의 선도 반드시 보관된다고 확대하면 안 된다.

canvas-adapter.ts:448 restoreItemsFromDrop은 bundle 생성 후 copy/allow-overlap 정책으로 즉시 배치한다. :456 batchRestorePositions는 그룹의 세로 배치 또는 일반 항목 격자 위치를 계산한다. palette-drop-controller.ts는 성공한 복원 뒤 Collect 완료를 처리한다. 새 Shift 복사 계약은 이 기존 경로와 다르다.

별도 export-placement-controller.ts에는 이미 오버레이 배치·취소 경로가 있고 placement-collision.ts에는 충돌 계산이 있다. “오버레이가 없다”와 “모든 드래그가 이미 오버레이를 쓴다” 모두 잘못이다. 기존 계산을 새 드래그 흐름에 연결해야 한다.

## Mini UI와 삭제·저장 소유권

floating-mini-palette.ts에는 Collect/Storage, 카드·목록, 복수 선택, 검색, 상세 편집과 크기 조절이 있다. :150 Delete selected, :388 상세 Delete, :473 confirmPendingDelete가 있다. 기존 삭제 UI를 재사용한다.

core/store.ts:1145 removeMiniStorageItems는 Storage 참조만 지운다. :1154 부근 removePendingItems는 Workspace/Storage 소유 여부에 따라 실제 항목 제거를 결정한다. 기존 storageItemIds는 독립 폴더 보관소가 아닌 전역 항목의 참조 목록이다. **새 독립 보관소에서는 조작은 재사용하되, 삭제의 소유권 로직까지 무조건 복사해서는 안 된다.**

## 메타데이터·미디어

canvas-metadata-controller.ts:117 라벨 표시, :142 캡션 표시, :198 더블클릭 인라인 편집. canvas-caption-control.ts는 전체 Canvas 캡션 크기 8–32px 설정이다. 빈 카드 아래 hover + 생성과 각각의 생성 단축키는 기존 표시된 캡션 편집과 구분한다.

types.ts / store.ts / canvas-adapter.ts의 파일형 자료는 Vault 원본 경로에 의존한다. **재시작 유지가 이미 있어도 원본 파일 삭제 후 이미지·PDF 유지까지 보장하지 않는다.** 독립 asset 보관이 필요하다. 기존 updateItem/Canvas link 연동은 지속 동기화가 필요 없다는 사용자 결정에 맞춰 분리한다.

## 통합 판정

유지: 수집·잘라내기, 텍스트 수집, 그룹 직렬화, 미리보기 기반, 삭제 조작, 라벨·캡션.
제거: old Side Palette, Workspace, 태그 기능, 원본 지속 동기화.
보강: Mini 폴더 저장소, 전체 형식별 보기, 승인 UI, 기본 이동/Shift 복사, 드래그 오버레이, 독립 미디어, 수동 백업/별도 복구 폴더.

Side UI만 지워서는 Workspace/store/link 의존성이 사라지지 않는다. 기존 자료는 실제 데이터에 맞춰 보존 이관해야 한다. 앞/뒤면·하이라이트 등 부수 기능의 장기 범위를 사용자 결정 없이 삭제 확정으로 기록하지 않는다.

## 비용과 검증 한계

metadata refresh는 열린 Canvas 노드와 전역 항목의 링크를 훑는다. MutationObserver, ResizeObserver, 60ms 지연, signature 캐시가 있다. Canvas 메타데이터 갱신과 숨겨진 Mini 목록 렌더링을 분리할 여지가 있다. 실제 실행 시간/메모리 사용량은 측정하지 않았다.

