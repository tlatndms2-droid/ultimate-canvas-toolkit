# Ultimate Canvas Toolkit — 현재 프로젝트 상태

2026-10-27. 사용자가 12장 수정 시안의 구현·실제 앱 검증·공개 배포를 명시적으로 승인했다. **UCT 0.1.1 코드·격리 앱/재시작·공개 Release·BRAT 확인 완료**이다. 과거 조사 전용/미구현 기록은 현재 상태가 아니다.

공개 저장소: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit

## 먼저 읽을 자료

1. [확정 사용자 결정](docs/uct/DECISIONS.md)
2. [전체 기능 범위](docs/uct/MASTER_PLAN.md)
3. [구현·검증·배포 상태](docs/uct/IMPLEMENTATION_PLAN.md)
4. [HANDOFF](HANDOFF.md)
5. 필요한 기존 기능만 [플러그인별 조사](docs/uct/README.md), [통합 접점](docs/uct/INTEGRATION_MAP.md), [소스 색인](reference/CODE_INDEX.md)에서 확인.

## 다시 묻지 않을 결정

- Mini 독립 도구. 구형 Side/Workspace/태그 제거. 화이트 갤러리·카드/목록·접는 Storage·조건부 상세.
- 일반 드래그 이동/Shift 복사. Canvas 저장 성공 후에만 Mini 제거. overlay/Esc/묶음 내부 배치·연결 유지.
- 일반 파일은 원본 연결·이름 변경 추적·실제 파일 삭제 시 해당 항목 제거. Canvas 카드 삭제·잘라내기는 별개.
- 링크 Portal만 내부 Canvas·필요 파일 독립 보관. 원본 삭제 후 유지.
- 현재 목록 검색 + 전체 검색 전환. Workspace 이름/하위 구조 이관, Collect 유지. 폴더 삭제 시 직접 자료와 하위 폴더를 미분류로 이동하여 구조 유지.
- 수동 ZIP만, 매번 저장 위치 선택. 복구는 새 복구 폴더에 추가. 기존 자료·파일 비덮어쓰기.
- Portal은 각기 현재 공간. 안쪽 항목은 진입한 후 Outliner에서 표시. 라벨 자동 표시·캡션 확인·Canvas Search 라벨 포함.
- Alt+L 카드 라벨 직접 입력·더블클릭 이름/색상 편집, Alt+C/hover ＋ 캡션. Enter 편집기, PDF Shift+Enter, Portal Ctrl+Enter.
- 새 저장소는 처음부터 공개. 원본 7개 저장소는 사용자가 직접 **“완성됐다”**라고 말한 뒤에만 삭제. 아직 그 선언이나 삭제는 없다.

원본 고정 소스는 vendor/와 reference/에 보존했다. 원본 AGENTS/HANDOFF는 역사적 참고 문서이며 UCT 지침이 아니다. 현재 소스와 HANDOFF가 우선한다. 사용자 실제 Vault는 변경하지 않았다.

이전 0.1.0 Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.0 . 공개 자산 3개를 로컬 빌드와 바이트 대조했다. BRAT Latest version 설치 후 main.js/styles.css SHA256 일치, manifest는 BRAT JSON 압축 재직렬화에 따른 공백 차이만 있고 모든 필드가 같다. Sandbox를 열어 두었다. 원본 저장소 삭제 미실행.

0.1.1의 최신 기준은 DECISIONS 맨 위 절과 IMPLEMENTATION_PLAN 맨 위 실행 기록이다. Waypoint는 제거했고 과거 저장 기록만 보존한다. 발표 상단 버튼은 명령으로 제공한다. Mini의 클릭 상세/더블클릭 미리보기·형식·이름 변경·원래 배치 묶음·8방향 리사이즈·폴더 접힘을 확인했다.

최신 Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.1 . 태그 e311326. 공개3자산 일치, BRAT0.1.1 활성화와 자료 보존 확인 완료. manifest는 BRAT 공백 재직렬화 차이만 있다.
