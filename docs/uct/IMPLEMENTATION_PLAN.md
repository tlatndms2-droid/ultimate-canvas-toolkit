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
| ⑦ Release·BRAT | 진행 중. 게시 자산 해시 및 실제 BRAT 설치 완료 후 상태 갱신 |
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
