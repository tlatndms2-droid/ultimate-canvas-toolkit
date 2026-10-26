# UCT 0.1.1 — 12장 수정 시안 실행 기록

2026-10-27. 코드 수정·TypeScript 검사·빌드·11개 테스트·격리 앱 UI·동일 Sandbox 재시작 통과. Release/BRAT 확인은 현재 진행 중이다. 아래 0.1.0 기록은 이전 버전의 역사적 확인이며 현재 동작은 본 절과 DECISIONS 최신 절을 우선한다.

## 이번 변경과 확인

- 라벨 직접 생성·취소·더블클릭 색상 편집, 캡션 입력·기존 캡션 더블클릭/Esc 취소, 16px 간격, Portal별 저장과 Outliner 자동 표시 확인. Canvas toolbar metadata 버튼 제거.
- 일반/가상/링크 포탈 아이콘 구분, Waypoint 명령/배지 부재와 과거 기록 보존 확인. 발표 상단 버튼 제거, 기존/신규 명령 등록, 현재 화면 영역 생성과 List/Map 실제 전환 확인.
- Mini 목록·카드·상세의 형식/아이콘, 선택되지 않은 항목의 실제 더블클릭, 카드/Markdown/PDF/이미지/오디오/영상/묶음/두 Portal 큰 미리보기 확인. 영상은 실제 디코딩 상태와 크기도 확인.
- 최신 ID 기반 이름 변경·정렬·즉시 표시와 파일명 비변경. 묶음 전체 좌표/연결의 동일 배율 축소, PDF 포함 묶음 렌더링, 안내 문구 비혼입 확인.
- Storage 전체 접기·폴더별/모두 접기·8방향 리사이즈 실행. 재시작 후 항목·폴더·metadata·UI 크기/위치/접힘 상태가 저장값과 동일. 선택 중인 목록/항목은 이번에 새로 영속 저장하지 않는다.
- 이동 후 Mini 제거, Shift 복사 후 보존, Esc 취소 후 보존, 수동 ZIP 왕복의 새 복구 폴더/기존 자료 보존 회귀 확인. ZIP 선택/저장 대화상자 반환 경로만 Sandbox에서 지정했다. 실제 작업 Vault는 변경하지 않았다.
- 업데이트 전부터 있던 사용자 Mini 항목 6개의 전체 JSON 내용은 시험 후에도 동일하다. 창 닫기 후 미디어 DOM/미리보기 창 추적 참조 해제 확인.

## 코드·호환성

src/item-kind.ts는 저장 타입을 바꾸지 않고 화면 분류를 계산한다. src/metadata-editor.ts는 공간별 기존 저장 경로를 사용한다. src/item-preview.ts는 기존 PDF 뷰어/PreviewService를 재사용한다. Mini 첫 클릭은 선택 표시만 즉시 바꾸고 상세·외부 재그리기를 350ms 유예해 그리드 재배치가 더블클릭을 끊지 않게 한다. 폴더 접힘 배열은 선택 필드이며 기존 library version1과 백업/배치 모델을 유지한다.

소스 스타일이 전역 styles.css ignore 규칙에 빠져 있었으므로 src/styles.css와 vendor/*/styles.css만 추적 예외로 추가했다. 배포 산출물 루트 styles.css는 계속 생성 파일이다. 원본 7개 저장소와 기존 시안은 보존했다.

## 근거와 한계

로컬 비공개 .validation/0.1.1/에 사전 백업, 화면, resize/doubleclick/restart/원본 보존 JSON, 시험 ZIP과 설치 해시를 보관했다. 11개 테스트는 저장/이관 및 화면용 형식 판별을 검증하며 전체 UI를 대신하지 않는다. 모든 기존 기능의 모든 분기, 모든 파일 확장자, 외부 스트리밍 서비스와 실제 대규모 Vault는 전수 검증하지 않았다. 성능 절감률·CPU/메모리 사용량은 측정하지 않았다. 40–67분은 승인 계획의 미측정 예상이며 실제 소요로 보고하지 않는다.

---

# Ultimate Canvas Toolkit — 결정 완료부터 통합·배포까지

2026-10-26. 사용자가 이 계획의 전체 구현과 공개 배포를 명시적으로 요청했다. 제품 버전 **0.1.0**, 최소 Obsidian **1.14.4**, 데스크톱 대상이다. Windows 전용 Image Copy의 플랫폼 검사는 유지한다.

## 단계와 통과 조건

| 단계 | 상태 / 확인 |
|---|---|
| ① 사용자 결정 완료 | 완료. DECISIONS.md에 최신 일반 파일 원본 연결 규칙·링크 포탈 독립 보관·공개 저장소·기존 조작 재사용·폴더 순서까지 반영. 뒤로 미룬 사용자 동작 없음 |
| ② 최종 기획 확정 | 완료. MASTER_PLAN.md와 본 문서를 최신 결정으로 교체 |
| ③ UCT 기반 구성 | 완료. 새 공개 저장소, 7개 고정 원본 소스·스타일·라이선스, 단일 설치 플러그인, 기능별 설정 저장 분리 |
| ④ 기능 통합 | 완료. Portal 공간별 Outliner·metadata·입력·PDF·편집기·Mindmap, 라벨 자동 표시·Canvas Search, Alt+L/Alt+C/hover ＋ |
| ⑤ Mini 통합 | 완료. Storage/Collect/폴더/미분류/형식별 보기/조건부 상세/검색·정렬·기존 선택·이관·드래그·수동 ZIP·독립 링크 Portal |
| ⑥ 실제 앱 검증 | 완료. 격리 Obsidian 1.14.5에서 실제 화면·동작·동일 빌드 재시작 확인. 아래 범위 참조 |
| ⑦ Release·BRAT | 완료. 공개 Release 0.1.0 자산 3개와 로컬 빌드 대조. BRAT 2.2.0 Latest version으로 설치·활성화 확인 |
| ⑧ 원본 저장소 삭제 | 미실행. 사용자가 직접 “완성됐다”고 말한 뒤에만 7개 대상 삭제. 배포 성공으로 대체하지 않음 |

## 실제 코드 연결

- `src/main.ts`: UCT 시작/종료, 단일 설치 플러그인, 가상 manifest를 가진 내부 기능 컴포넌트, 모듈별 `modules/<name>/data.json`, 직렬·원자적 파일 저장, 설정 탭, 공간 키·입력 연결.
- `vendor/portal`: 유일한 Canvas root 저장 담당. 기존 capture/show/history/안전 검사 유지. 포탈 graph에 Mindmap Waypoint namespace도 보존.
- `vendor/outliner`: 파일 경로 + 포탈 ID의 상태 키, 현재 graph만 표시. 기존 그룹/등록/Collection/발표/Vision 유지. 라벨 자동 자격, 확인 전용 라벨·캡션과 검색 corpus 추가.
- `vendor/mindmap`: 기존 생성·연결·탐색·미디어·편집 보호 유지. 연결 출발점은 공간별 키, Waypoint는 각 graph.
- `vendor/visibility`: EditorManager와 native Markdown editor만 시작. 접기 모듈·갱신 타이머 제외. Enter 후 편집기에 실제 포커스를 둠.
- `vendor/pdf`: Shift+Enter 큰 보기, Ctrl+Enter 무시. 포탈별 상태 키, 기존 문서 pool 공유.
- `vendor/image-copy`: 기존 파일 클립보드·충돌 없는 폴더 저장 유지.
- `src/library.ts`: 독립 폴더 모델, Workspace·Collect·item-owned 하위 구조 이관, 일반 파일 삭제/이름 변경. 링크 독립 스냅샷 예외.
- `src/snapshot.ts`: 현재 보이는 Canvas graph를 수집·잘라내기. 기존 일반 수집/그룹 serializer 재사용. 링크 포탈은 로컬 Canvas·Markdown·파일을 고유 첨부파일로 복사하고 내부 경로와 라벨·캡션을 포함.
- `src/mini.ts`: 승인된 화이트 UI, 기존 Ctrl/Shift 선택 계산, 기존 metadata/편집/삭제 창, 카드·목록과 앞뒷면. 화면 닫기/다시 그리기 시 observer·PDF 작업·Markdown component 해제.
- `src/placement.ts`: 오버레이·겹침 방지·Esc 취소, 기존 묶음 좌표/연결 유지, Portal transfer ID 재생성, Canvas 저장 실패 rollback. 일반 이동·Shift 복사. Chromium의 PDF Shift native drag 제한은 동일 오버레이의 pointer drag로 처리.
- `src/backup.ts`: fflate 비동기 수동 ZIP. 매번 위치 선택, SHA256·경로 검증, 재귀 로컬 파일 포함, 새 복구 폴더/항목 ID, 파일 고유 이름·경로 재연결. 기존 파일 덮어쓰기 없음.

원본 모듈의 전부를 각자 설치/시작하지 않는다. UCT 한 개만 설치하고 기능 클래스는 내부 child로 소유한다. 모듈 저장 위치는 분리하며 Palette 보관 자료는 `library.json`에 둔다. 구형 Side/Workspace UI·명령과 태그 입력·검색은 등록하지 않는다. 원본 저장 파일은 읽기 전용이다.

## 확인한 결과

- TypeScript 검사·배포 빌드 성공. 폴더 삭제·순환 검증·파일 삭제/이름 변경·독립 포탈 예외·일부 그룹 파일 제거·Workspace/Collect/소유 하위 폴더 이관·중복 이관 방지 관련 테스트 **8개 통과**.
- 실제 Alt+L 라벨 생성 → Outliner 자동 표시. Alt+C 캡션 → Outliner 표시. Canvas Search에서 라벨 검색 결과 확인.
- Enter 텍스트 편집기 포커스, Esc 저장/닫기. Visibility 접기 UI 없음.
- Portal 진입/복귀 시 목록 전환. 내부 PDF Shift+Enter 큰 보기와 Ctrl+Enter 복귀가 동시에 실행되지 않음. 내부 Waypoint는 나갔다 다시 들어와도 유지되며 root와 분리.
- Mindmap Ctrl+방향키 카드 생성·연결. 기존 잘라내기의 두 노드 좌표 차이·연결·metadata가 Mini→Canvas 재배치 후 유지.
- 일반 드래그 배치 성공 후 Mini 제거, Shift 드래그 후 유지. overlay/취소 확인. Canvas 저장 오류를 한 번 주입했을 때 원래 graph와 Mini 항목 보존.
- Collect→폴더 실제 드래그. 상위 폴더 삭제 시 하위 폴더가 미분류 안에서 유지. 카드/목록·좌측 접기·선택 시 상세·앞뒷면 편집과 전환 확인.
- 일반 원본 이미지 삭제 시 Mini 제거. 독립 링크 Portal은 원본 Canvas/이미지/Markdown 삭제 후에도 보관·재배치·진입과 내장 파일 표시 유지.
- 수동 ZIP 생성·새 복구 폴더 왕복. 원본 PDF가 없어도 포함 파일을 새 이름으로 복구. 기존 항목 유지. 손상 ZIP·상위 디렉터리 경로를 거절하고 library 비변경.
- Image Copy의 폴더 내보내기 결과가 원본 SHA256과 일치.
- 최종 설치 자산과 로컬 빌드 SHA256 일치. 같은 Sandbox를 실제 종료·재실행하고 새 CDP 대상에서 항목·폴더·metadata·Mini 상태가 일치함을 확인.

시험 fixtures·사전 백업·스크린샷·JSON 증거는 로컬 `.validation/`에 보관하고 공개하지 않는다. 실제 사용자 Vault는 변경하지 않았다. 원본 7개 작업 저장소도 변경하지 않았다.

## 측정과 한계

시험 자료 Mini 화면 생성 5회: 약 16–22ms. 1,002개 카드 생성 시험: 약 526ms. 닫은 뒤 Mini/배치 DOM 0개, 시험 중 PDF 참조 증가 없음. 이는 로컬 격리 환경의 동기 화면 생성 시간이며 전체 미디어 로딩 시간·CPU 사용률·기존 7개 대비 절감률이 아니다. 원본 대비 성능 개선율은 측정하지 않았다.

모든 기존 기능의 모든 분기·영상/오디오/YouTube 서비스 상태·Windows 클립보드 전달·실제 사용자의 대규모 Vault 이관을 전부 실행한 것은 아니다. Image Copy 폴더 저장을 실행했고 파일 클립보드 코드는 기존 구현을 유지했다. ZIP 파일 선택/저장 검증은 격리 Electron 대화상자의 반환 경로를 시험용으로 지정하여 제품 저장/복구 경로를 실행했다.

초기 구현 예상 57–96분은 측정 전 임시 추정이었다. 구현·조사·대화 전환의 경계를 연속 측정하지 않아 이를 실제 작업 시간으로 보고하지 않는다. Codex 사용량은 높음. 보관 링크 사본·사용자 ZIP만큼 디스크가 늘고 압축/복구 동안 메모리와 CPU가 일시적으로 증가한다. Mini 주기 백업·상시 네트워크 동기화는 추가하지 않았다.

합의된 사용자 동작 변경이 필요하면 해당 구현을 멈추고 먼저 결정한다. 검증 실패 시 배포하지 않는다. 원본 삭제는 별도 사용자 선언 전까지 실행하지 않는다.

## 최종 공개 배포 확인

- 공개 저장소: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit
- Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.0
- 동일 Release ID 424224306. 최초 게시 후 재로드에서 확인한 Mini 초기 스타일 적용 전 창 크기 저장 문제를 수정하고, 임시 draft 상태에서 같은 0.1.0 자산과 소스 태그를 갱신했다. 중복 Release를 만들지 않았다.
- 최종 소스 태그 커밋: `1800dcc`.
- main.js SHA256: `048e95380e6c176169aa02911865b62bb16dd7684286244d4376fb59095a4a73`.
- styles.css SHA256: `ac82fbb7f49125200e6b29be0546e70acb85aba00552a737dba6bfc329ecab05`.
- manifest.json 공개 SHA256: `804fd5a95c0b7a63c0fd198fd29bcb2288da95dad602e245eede30f2ccca9352`.
- 공개 자산 3개는 로컬 최종 빌드/실제 재시작 검증 설치본과 바이트 일치. 이후 BRAT 설치의 main.js/styles.css도 일치한다. BRAT은 manifest를 압축 JSON으로 재직렬화하므로 바이트 해시는 다르지만 파싱한 모든 필드·버전·최소 앱 버전이 같다.
- BRAT 2.2.0의 실제 Add plugin UI와 Latest version 다운로드·파일 쓰기·활성화를 확인했다. 최종 수정 후 BRAT 자체 재설치 경로로 다시 다운로드하고 활성화했다. 버전 0.1.0, 내부 기능 7개, Mini·보관 자료·1180×750 창 크기 유지. 실제 앱 1.14.5, 최종 자산의 재시작 확인 통과.
- 사용자 실제 Vault 변경과 원본 저장소 삭제는 실행하지 않았다. Sandbox는 최종 설치본과 시험 자료를 남겨 열어 두었다.
