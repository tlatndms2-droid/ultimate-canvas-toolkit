# Canvas Portal — 공간 모델과 통합 접점

> 조사일 2026-10-26 · manifest 0.4.10 · 기준 커밋 199bd978a348c3b290035b410d5c84981af25fc4
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/obsidian-canvas-portal/tree/199bd978a348c3b290035b410d5c84981af25fc4/src) · [로컬 스냅샷](../../../reference/snapshots/obsidian-canvas-portal/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 포탈 두 종류

일반 포탈은 같은 Canvas 파일의 canvasPortal.portals 안에 graph를 저장한다. parentId, entryId, exitId, graph와 입출구 카드의 canvasPortalRef로 관계를 표현한다. 선택 카드와 내부 연결은 자식 graph에 들어가며 경계 연결은 입구 쪽으로 재연결된다. 별도 Canvas 파일을 무조건 만드는 기능이 아니다. 근거: src/model.cjs.

src/main.cjs:640 show는 현재 graph를 런타임 Canvas에 표시한다. :665 enter는 session.current를 바꾼다. :678 leave는 부모 공간으로 돌아가 입구를 선택한다. 화면의 부분 graph와 파일에 저장하는 전체 root를 구분하고 공간별 history를 보관한다. getViewData/setViewData wrapper가 이 저장 계약을 담당한다.

반면 :690 enterLink는 실제 target Canvas를 새 탭으로 열고 복귀 관계를 둔다. 임시 출구는 표시용이며 저장 때 정리한다. **일반 가상 포탈과 실제 파일 링크 포탈을 구분해야 한다.**

## 기존 기능

생성, Ctrl+Enter 진입/복귀, 중첩, 복제, 해제, 이동, 진입 위치 복원, 백업·저장 안전 검사.
model.cjs clone/transfer는 자손 포탈 레지스트리와 ID 매핑도 처리한다. 입구 카드만 복사하는 것과 다르다.
backup.cjs, safety.cjs는 저장/백업 안전성 담당이다.

## Outliner 연결

Outliner 상태는 파일 경로 키이고 Portal 내부 공간 ID를 받지 않는다. 가상 포탈 진입은 같은 파일에서 표시 graph만 바뀐다. 파일 전환 이벤트만으로는 이 경계를 처리할 수 없다. 이것은 **소스 구조상 원인 후보**이며 사용자 증상의 실행 재현 결과는 아니다.

공통 문맥을 실제 파일 경로 + 현재 가상 포탈 ID + 노드 ID로 구분하고, 현재 공간 graph와 전환 이벤트를 Outliner에 제공하는 설계를 권한다. 링크 포탈에서는 실제 대상 파일로 문맥이 바뀐다. 사용자 요구는 현재 공간에 맞는 Outliner다. 무한 재귀로 모든 내부 내용을 바깥 목록에 섞는 것으로 해석하지 않는다.

getViewData/setViewData, copy/transfer, history wrapper를 여러 통합 모듈이 중복 덮어쓰면 저장 충돌 위험이 있다. 공통 어댑터에서 소유권을 정해야 한다. Mini에 포탈 자체를 보관할 때는 레지스트리도 보존해야 하며 일반 그룹 serializer만으로 완료라고 판단하지 않는다.

## 성능

main.cjs:116 discover 1초, :117 maybeAutoBackup 조건 확인 10초. 10초마다 반드시 파일을 쓰는 것은 아니다. graph import, capture, 전체 root 직렬화가 주요 비용 후보이다.
Mini의 “수동 백업만”을 Portal 안전 백업 삭제 승인으로 확대하지 않는다. 정량 비용은 미측정.

