# Canvas Mindmap

Windows용 Obsidian Canvas 플러그인. 버전 **0.5.18**.
키보드로 카드 생성·탐색·연결·정렬, Waypoint, 색상 선택, 파일 교체와 미디어 미리보기를 사용할 수 있습니다. 설정과 안내는 한국어입니다.

## 설치
- [GitHub Release](https://github.com/tlatndms2-droid/obsidian-advanced-mindmap/releases/latest)에서 `main.js`, `manifest.json`, `styles.css`를 받습니다.
- 보관함의 `.obsidian/plugins/canvas-mindmap/`에 세 파일을 넣고 Obsidian의 커뮤니티 플러그인에서 Canvas Mindmap을 켭니다.
- BRAT을 사용한다면 저장소 주소 `https://github.com/tlatndms2-droid/obsidian-advanced-mindmap`을 등록합니다. 이번 배포에서는 사용자 요청에 따라 BRAT 설치·업데이트 검사를 생략했습니다.

## 주요 조작
| 키 | 동작 |
|---|---|
| Ctrl 0.5초 | 생성 모드 선택 |
| Ctrl+방향키 / Tab | 방향 생성 / 아래 형제 카드 생성 |
| Ctrl 0.5초 / Tab 0.2초 | 생성 모드 / 연결 출발점 선택. Tab 후보는 화살표 방향과 무관한 직접 연결 카드 |
| Ctrl+Space | 카드 편집 진입·종료 |
| Alt+방향키 | 카드 탐색 |
| Alt 단독을 놓기 | 선택 없으면 중앙 카드 선택·포커스 / 선택 있으면 모두 해제. 두 번 누르기 전용 동작 없음 |
| Ctrl+Shift+Alt+방향키 | 마지막으로 추가한 카드 기준으로 선택 확장 |
| Alt+M | 선택 중: 카드 메뉴와 툴바 숫자 표시. 편집 중: 링크·서식 등의 입력 편집기 우클릭 메뉴. 방향키·Enter·Esc로 조작, 닫으면 숫자 숨김·입력 위치 복원 |
| Shift+Alt+↑ / ↓ | 확대 / 축소 (편집 중 제외). 기존 [ ] 제거 |
| Alt+R | 선택한 텍스트 카드 각각 내용에 맞추기 (편집 중에도 사용) |
| 상단 1–9, 0 / Shift+1–9, Shift+0 | Alt+M으로 숫자가 표시된 동안 카드 툴바 1–10 / 11–20번째 실행. 도구 선택지는 방향키·Enter, Esc로 닫기. 편집·입력 중 제외, 넘버패드 유지 |
| Ctrl+Shift+방향키 | 카드 크기 조절 |
| Ctrl+Shift+L | 하나 또는 여러 카드에서 설정한 연결 단계까지 정렬. 설정 → 카드 정렬: 연결 단계(1~10, 기본 1), 거리 범위(1~5, 기본 3). 거리 범위가 높을수록 멀리 떨어진 카드까지 같은 묶음으로 정돈 |
| Alt+W | Waypoint 관리창 |
| Ctrl+Shift+C | 색상 선택 |
| Alt+I | 빈 카드에 파일 삽입 / 파일 카드 교체 |
| Enter (Canvas에서 미디어 카드 선택) | 영상·YouTube·음악 재생 / 이미지 크게 보기 |
| Enter / Ctrl+Enter (파일 선택창) | 파일 선택 확정 / 미리보기 열기·닫기 |
| X | 선택 카드 삭제 |
| Ctrl+Z | 실행 취소 |

파일 선택은 문서·Canvas·이미지·PDF·영상·음악을 지원합니다. 영상·음악 미리보기에서는 Space로 재생/정지, 좌우 방향키로 탐색, 상하 방향키로 음량 조절, M으로 음소거합니다.
설정의 **카메라** 구역에서 이동량(기본60px), 확대·축소량(기본 약7.18%), 이동 시간, 편집 최소 확대율을 조절합니다. 카메라 숫자는 슬라이더로 조절하고 현재 값을 표시합니다. 각 설정값의 회전 화살표로 해당 항목만 기본값으로 복원합니다. 기존 설정값을 유지합니다. **입력 줄 따라가기**로 편집 중 세로 추적을 켜고 끕니다. 편집 종료 시 자동 크기 조절은 제거했습니다. 수동 내용 맞춤은 짧은 글 너비 축소, 긴 글 현재 너비 유지, 빈 카드 기본 크기를 적용하며 다중 카드도 한 번의 Undo로 복원합니다.
설정 백업·복원은 설정창의 설정값만 대상으로 합니다. 이전 백업의 자동 크기 조절 값은 무시하고 나머지 설정은 복원합니다. 플러그인을 삭제하고 재설치할 때 설정·사용자 색상의 자동 보존은 보장하지 않습니다.

## 현재 기준과 확인
- [5단계 최신 동작](planning/revised/STAGE5_CURRENT.md): 설정만 백업·복원, Alt+I 파일 삽입/교체, 미디어 미리보기·재생 키.
- [6단계 코드 결과](verification/stage6-code-report.md): 실행한 테스트와 한계.
- [사용자 확인 목록](verification/stage6-user-check.md): 기능 결합·Undo·저장·재시작·화면 확인.
- [인계](HANDOFF.md): 최신 요약 및 버전별 이력.
- [단계별 계획](DEVELOPMENT_PLAN.md): 개발 순서. 초기 시간 추정은 현재 실측과 다름.

원본 ZIP과 planning/current는 보존한다. 원본의 128개 요구사항과 개정본 43개 테스트·215개 SVG는 역사적 기준이다. 사용자 정정으로 제외/변경된 내용은 최신 기준이 우선하며, 원본 개수 검사 통과는 현재 제품 전체 검증을 뜻하지 않는다.

## 코드 검사
```text
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-all.mjs
node build.mjs
node scripts/check-planning.mjs
```
테스트는 로컬 계산/가짜 UI 대상이며 실제 Obsidian 화면을 조작하지 않는다. 사용자는 2026-10-20 현재 기능 전체 확인을 완료했다고 보고했다. 이를 자동 UI 검증 결과와 구분한다. 제거·재설치 보존 확인과 BRAT 검사는 사용자 요청으로 생략했다.
