# 통합 접점과 성능 분석

정적 코드 분석에 따른 설계 제안이며 구현/측정 결과가 아니다. 각 사실의 근거는 [플러그인별 문서](README.md)에 있다.

## 기능을 모으는 것과 중복 처리를 줄이는 것은 다르다

7개 플러그인을 한 manifest 아래 붙여도 각 타이머, 이벤트, 렌더러, 저장 wrapper가 그대로 있으면 비용은 거의 그대로이거나 충돌로 더 커질 수 있다. 공통 입력·공간·저장 처리를 정리할 때 이득이 생긴다. 현재 코드에서 확인한 주기는 다음과 같다.

| 모듈 | 현재 반복/지연 처리 | 통합 시 판단 |
|---|---|---|
| Mindmap | 100ms 현재 Canvas 갱신 | 변경/선택 이벤트와 활성 모듈에 좁힐 후보 |
| Outliner | 350ms refresh | 공간 전환·등록·문서 변경에 맞춘 갱신 후보 |
| Portal | discover 1초, backup 조건 검사 10초 | 가상 공간 계약과 안전성을 보존; 무조건 삭제 금지 |
| Visibility | 접기 refresh 1500ms, 예약150ms | 접기 제거와 함께 불필요 갱신 제거 |
| PDF | scan1500ms, 예약60ms, 저장250ms | attach 탐색을 공유하되 렌더 캐시/제한 유지 |
| Palette | metadata 예약60ms, DOM/resize 관찰 | 열린 Canvas metadata와 Mini 화면 갱신 분리 |
| Image Copy | 상시 폴링 없음 | 사용자 실행 시에만 프로세스/파일 비용 |

실제 초당 CPU, 메모리 절감률, 빨라지는 배수는 측정하지 않았다.

## 함께 설계해야 하는 묶음

**Portal + Outliner + 공통 Canvas 문맥**이 첫 접점이다. 실제 Canvas 경로만으로 가상 공간을 구별할 수 없다. 현재 graph, 가상 portalId, 선택 노드, 저장될 root를 분리한 어댑터가 필요하다. 라벨 표시 자격과 검색도 이 현재 공간을 기준으로 한다.

**Mindmap + Visibility Enter 편집기 + PDF Viewcard**는 키 입력 담당을 공유한다. 텍스트/Markdown→편집, 이미지/영상/오디오/YouTube→미디어, PDF→읽기로 분기한다. 편집 중 키, IME, 반복 키, 팝업, drawing, Presentation 등 모드별 보호도 보존한다. Portal Ctrl+Enter와 PDF Ctrl+Enter는 별도 우선순위 점검 대상이다.

**Palette metadata + Outliner + Mindmap 생성 UI**는 라벨·캡션의 공통 읽기/쓰기 모델을 공유한다. 네이티브 group label과 Palette label은 구분한다. Mini는 수집 당시 스냅샷을 보관하므로 “공통 모델”이 “원본과 지속 동기화”를 의미하지 않는다.

**Palette + Visibility의 내장 편집기**는 공통 호스트 재사용 후보다. 대상/저장 callback이 다르므로 두 소스를 이름만 보고 하나 삭제하지 않는다.

**PDF의 문서 pool + Mini preview**는 파일 로딩/문서 공유 후보다. 썸네일마다 전체 뷰어를 켜지 않고 보이는 미리보기에만 작업한다. Image Copy는 별도 파일 export 기능이므로 Palette 수집으로 대체하지 않는다.

## 자료를 잃지 않기 위한 설계 기준

- Mini 이동: 목적 Canvas 반영 성공을 확인한 뒤 원본 Mini 항목 제거. 실패·취소 시 보관 유지.
- 수집한 미디어: path 참조만이 아니라 별도 관리 파일과 메타데이터 연결. 원본 삭제 후 복원 시험 필요.
- 묶음: 상대 좌표·내부 연결·metadata·새 ID 매핑 유지. Portal 묶음은 자손 registry까지 필요.
- Portal: 화면 graph만 저장해 root를 잃지 않도록 기존 capture/직렬화 계약 유지.
- 수동 복구: 별도 복구 폴더 아래 구조 복원, 기존 항목 덮어쓰기 금지.
- old Side/Workspace 제거: UI와 데이터 소유 모델을 분리하여 기존 자료 보존 이관 경로 필요.
- 백업은 수동 실행할 때 읽기/압축/쓰기 비용이 발생한다. 자동 주기 작업을 새로 두지 않는다.

## 구현 단계에서 필요한 관련 검증 후보

아직 실행하지 않았다. 실제 변경 범위에 맞춰 적용할 목록이다.
1. 일반/중첩/링크 Portal 진입·복귀와 현재 공간 Outliner.
2. 라벨 자동 표시와 Canvas Search, 캡션 생성/표시.
3. 텍스트/Markdown/이미지/영상/PDF 각각 Enter, PDF/Portal Ctrl+Enter, 편집 입력 보호.
4. 일반 수집/잘라내기의 기존 차이, 그룹 연결, 기본 이동/Shift 복사, 취소/실패 시 보존.
5. 원본 미디어 삭제 후 미리보기·재배치, 재시작, 수동 백업/별도 복구.
6. 큰 Canvas와 여러 PDF에서 보이는 영역 렌더링, 편집창/포탈 종료 후 자원 해제.

이 목록은 현재 조사 요청을 빌드·설치·릴리즈로 확대하는 승인이 아니다.

