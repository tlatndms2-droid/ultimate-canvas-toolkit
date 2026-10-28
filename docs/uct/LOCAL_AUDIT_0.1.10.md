# UCT 0.1.10 — 사용자 검수 수정 8건

2026-10-28. 공개 배포·push·BRAT 없음. 실제 작업 Vault 변경 없음.
이번 결과는 최근 승인한 8개 수정 범위이며, 전체 UCT 기능을 새로 모두 통과했다고 뜻하지 않습니다.

| 수정 | 실제 확인 결과 |
|---|---|
| 폴더 전체 접기·펼치기 | 한 아이콘으로 통합. 폴더 제목 오른쪽 고정. 전후 버튼 좌표 x549/y307 동일. 하위 폴더 숨김/표시, 루트 폴더 유지 확인 |
| 형식별 보기 접기 | 11종 전체 목록과 설명을 함께 숨김. 폴더와 백업 버튼 유지. 다시 펼침 확인 |
| 색상 키보드 조작 | ArrowRight 두 번 → Enter. 카드 x0/y0, 400×220 유지, color3만 적용 |
| 접힌 작은 편집기 | 오른쪽 드래그 폭1440→1316.5, 왼쪽 드래그1440→1343.5. 높이46 유지 |
| 빈 Outliner 항목 | 빈 컬렉션/빈 그룹 화살표 hidden·비활성. 하위 카드 있는 항목은 visible. Sidebar/Remote 양쪽 화면 확인 |
| 컴포지션 외부 명령 격리 | Ctrl+P 차단, 테스트 외부 명령 실행0회. 종료 후 같은 명령1회 실행. Ctrl+B 서식 적용·우클릭 메뉴 유지 |
| 컴포지션 Undo/Redo | Canvas 카드와 일반 Markdown에서 입력→Ctrl+Z 원문 복귀→Ctrl+Y 입력 복원. 최종 재시작 후도 확인 |
| 잘라내기 묶음 아이콘 | 썸네일 왼쪽 위 주황 가위 배지·유형 가위 아이콘. 일반 그룹 기존 아이콘. 동일 그룹 복사/잘라내기의 저장 그래프 동일 |

추가 발견·수정: 네이티브 명령과 UCT 키 처리 순서 때문에 Ctrl+Shift+Enter 진입 직후 같은 키로 닫힐 수 있었습니다. 전환 중 중복 종료를 막았습니다. 실제 카드 클릭 후 진입과 일반 Markdown 진입, Ctrl+Shift+Enter/Esc 복귀를 확인했습니다.

## 최종 검증

- TypeScript 검사·빌드 성공, 관련 테스트21개 통과.
- 동일 Sandbox 전체 프로세스 재시작 후 로컬0.1.10 로드.
- 재시작 전후 Mini49항목 및 UI 설정 전체 일치.
- 최종 소스/설치 main.js·styles.css·manifest.json SHA256 일치.
- 최종 재시작 후 입력/Undo/Redo/외부 Ctrl+P 차단/전환 복귀 통과, 해당 검사 중 pageerror0건.
- 최종 Sandbox 화면 직접 캡처 확인. Sandbox를 열린 상태로 남김.
- 자동화에서 준비 직후 빠른 연속 클릭은 비동기 렌더 전 상태를 읽어 대기 실패한 적이 있음. 렌더 완료 후 재시도하여 확인. 카드 본문 편집 상태의 Enter를 별도 편집기 진입 성공으로 세지 않음.
- Windows IME의 실제 키 조합 입력 및 모든 타사 플러그인 단축키 조합은 이번에 새로 전수 검증하지 않음. 이번 성능 수치 측정·개선율 주장 없음.

## 사용자가 확인할 항목

- [ ] Mini의 폴더 제목 오른쪽 아이콘을 눌러 하위 폴더를 모두 접고 펼칩니다. 버튼 위치가 유지됩니다.
- [ ] 형식별 보기 오른쪽 화살표로 모든 형식 목록을 숨기고 다시 펼칩니다.
- [ ] 카드 선택 후 색상 팔레트에서 방향키로 색을 고르고 Enter를 누릅니다. 카드가 움직이지 않습니다.
- [ ] 작은 편집기를 접고 왼쪽·오른쪽 테두리를 끕니다. 제목줄 폭만 달라집니다.
- [ ] UCT-020-Input Canvas의 빈 컬렉션/그룹에는 화살표가 없고, 내용 있는 컬렉션에는 있습니다.
- [ ] 컴포지션에서 Ctrl+P는 열리지 않고, 본문 서식·우클릭·복사/붙여넣기를 사용합니다.
- [ ] 글을 입력하고 Ctrl+Z/Ctrl+Y로 되돌리고 복원합니다. Ctrl+Shift+Enter 또는 Esc로 돌아옵니다.
- [ ] Mini Collect의 일반 그룹과 잘라낸 묶음을 비교합니다. 잘라낸 묶음에 주황 가위 배지가 있습니다.

## 증거·대상

- 증거: .validation/revision-020/ (mini.png, mini-cards.png, mini-collapsed.png, editor-folded.png, outliner.png, final-sandbox.png, hashes.json, pre-restart.json, post-restart.json, final-runtime.json)
- 백업: 같은 폴더의 source-before 및 sandbox-before.
- Sandbox: work/UCT-Integration-Sandbox, Profile: work/UCT-Integration-Profile, CDP19767.
- 최종 프로세스23524, 재시작 target ADDBBC0D5ACCAEFE18F570A992179B0E (다음 실행 때 재조회).
- 이전 전체 통합 검증 기록은 .validation/final-integration-20261028/RESUME.md 참조. 이번 증거로 과거 미검증 항목을 덮어쓰지 않음.
