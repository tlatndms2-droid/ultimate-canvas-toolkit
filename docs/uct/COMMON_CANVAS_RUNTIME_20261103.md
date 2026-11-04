# 공통 Canvas 실행 엔진 적용 — 로컬 검수

사용자 승인: 기존 사용 방식 유지, 공통 엔진으로 중복 작업 축소. 대상은 바탕화면 `secondbrain - 복사본 2`. 공개 배포 없음. 일반 이동의 Mini 제거 시점, Shift 복사, 저장·복구 형식, Canvas Drawing Tool Bar는 변경하지 않았다.

## 적용한 구조

- `src/canvas-runtime.ts`: Canvas 목록을 활성 탭·파일 열기·레이아웃 변경 이벤트에서 갱신한다. 노드마다 `getMostRecentLeaf()`로 보이는 탭들을 탐색하지 않는다. 현재 공간은 실제 view/Canvas/file/portal ID로 구분한다. Portal session Map을 view로 직접 조회한다.
- Portal 발견, PDF scan, Mindmap 활성 Canvas, Mini 배치 대상, Root 메타데이터와 Outliner 포탈 종류 판별을 공통 문맥에 연결했다. Mindmap은 Markdown이 활성일 때 이전 Canvas에 명령을 실행하지 않도록 활성 Canvas와 마지막 Canvas를 구분한다.
- Outliner 사이드/Remote/발표를 한 번에 그리는 동안 문서 읽기를 공유한다. 캐시는 동기 render batch가 끝나면 즉시 폐기한다. 파일·Canvas·포탈이 바뀌거나 명시적 변경이 오면 다시 읽는다. 비동기 작업 사이에 오래된 그래프를 보관하는 캐시는 추가하지 않았다.
- 그래프·공간·메타데이터 알림은 view별로 합치고 바뀐 node ID도 전달한다. Outliner refresh, Palette 메타데이터, PDF scan, 해당 Canvas 캡션 갱신을 연결한다. Outliner의 모든 갱신을 증분 알고리즘으로 대체했다는 뜻은 아니다. 원래의 외부 변경 감지/저장 안전 확인은 유지한다.
- 일반 카드 선택 데이터를 요청할 때 Portal 전체 capture를 생략한다. 포탈 entry를 선택해 복사할 때는 capture와 독립 그래프 복사를 유지하고 exit 제외도 유지한다.

## 검사와 실제 실행

- 관련 51검사 통과. 추가 lifecycle guard 뒤 공통 엔진 3검사와 tsc 재통과. 빌드·설치 해시 대조. 보호 저장·자료 제거 규칙을 바꾸지 않았다.
- `common-runtime-probe.json`: 실제 작업공간10월에서 Outliner 화면 5곳 render에 document read 1회, getMostRecentLeaf 호출 0회. Root/session/공통엔진 view 일치, Outliner 정상 실행.
- `common-runtime-comparison.json`: 같은 49노드 Canvas에서 ABBA 비교. 예전의 unbatched render/노드별 visible-leaf 조회/일반 selection capture를 임시로 재현한 구간과 새 동작 비교. 총 앱 배치 시간이 아닌 **Outliner render + 일반 선택 메뉴 데이터 7회** 묶음의 동기 비용이다.

| 방식 | 시간 | 문서 읽기 | Portal capture |
|---|---:|---:|---:|
| 새 |42.3ms|1|0|
| 이전 중복 작업 재현 |1825.9ms|5|7|
| 이전 중복 작업 재현 |1865.7ms|5|7|
| 새 |54.8ms|1|0|

임시 래퍼를 finally에서 복원했으며 Canvas 및 Mini JSON 일치를 확인했다. 이전 빌드 전체를 설치해 비교한 결과로 표시하지 않는다.

- `common-runtime-placement.json`: 실제 Blender 513노드/97연결 자료의 전용 복제로 제품 배치 API 3회. Mini 제거 38794.3/1825.8/1402.4ms. 세 회 모두 한 번만 배치, 원래 노드와 소스 및 Mini 원본 보존. 첫 회의 큰 지연은 여전히 남았다. 물리 마우스 전체 드래그 측정이 아니다.
- 이전 같은 규모 자료에서 35232.2/2454.6/2665.7ms가 관찰됐지만 전체 source hash는 서로 달랐다. 정상화/identity 저장 및 환경 차이를 배제하지 못해 전체 배치의 엄밀한 전후 개선율을 계산하지 않는다. 재사용 회차의 감소와 첫 회 미해결을 분리한다.
- `common-runtime-flow-result.json`: 포탈 진입/복귀와 Outliner 공간 일치. Ctrl+오른쪽 카드/연결 생성(2노드/1연결)과 Ctrl+Z 복귀(1노드/0연결). Tab의 형제 카드 생성에는 부모 연결이 없는 것이 원래 동작이며, 이를 1연결로 기대한 helper 판정을 수정했다. 사용자 설정 mode는 원복했다.
- `common-runtime-screen.png`: CDP 실제 화면 캡처 확인. Computer Use로 확인했다고 표현하지 않는다.
- `common-runtime-proof.json`: Mini 전체 pre-open과 동일, pending0, 자체 검수 파일0, 남은 자체 Outliner 기록 백업 후 정리, 원래 작업공간10월 복귀. 복사본은 열어 둔다.

## 남은 한계

공통 엔진 도입으로 확인된 중복 비용은 줄었다. 그러나 전체 Mini 저장 대기가 없어지지는 않았다. 특히 첫 배치의 수십 초 지연과 재사용 배치의 1초 이상 대기는 해결 완료가 아니다. 외부 플러그인·Obsidian 화면 처리와 파일 callback 지연도 남을 수 있다. 이 수정만으로 전체 최적화 목표 완료를 선언하지 않는다.
