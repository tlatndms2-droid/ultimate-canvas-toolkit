# UCT 0.1.7 로컬 수정 검증 — 2026-10-27

배포 금지. 공개 Release/BRAT/push 및 실제 작업 Vault 변경 없음.

## 반영
- Canvas 영상·음악 Enter: 전체 화면 큰 미리보기. Canvas Space: 선택한 미디어 재생/일시정지.
- 큰 미리보기 Space 재생/일시정지, 좌우 5초, 상하 음량 5%, Alt+. / Alt+, 배속 0.25(0.25–4배), Esc 종료·재생 중지.
- Chromium 기본 미디어 컨트롤에 포커스가 있을 때 키 이벤트가 앱에 도달하지 않는 문제를 재현하고 UCT 재생 컨트롤로 교체.
- 컴포지션의 실제 Markdown 편집기를 Obsidian 활성 편집 명령과 연결. 포커스 진입/이탈 시 명령 대상·키 scope 복구.
- 템플릿 갤러리 높이 제한, 검색, 기본/사용자 필터, 배경 추가, 선택 템플릿·글꼴 예문.
- PDF 창 전체 보기. 마지막 보기 설정을 다른 PDF에 공유하고 닫을 때 저장 완료.
- Sidebar/Remote Outliner 형식·라벨 필터, 검색 교차 적용. 필터는 표시만 변경. Presentation 검색/목록/표시 설정 간격.

## 수행한 확인
- TypeScript 검사, 빌드 및 단위 검사20개 통과. TypeScript 기본 검사 범위 밖 vendor 동작은 아래 Sandbox에서 별도 확인.
- 20초 무음 WAV: 우우좌 입력 결과5초, 아래 입력0.95음량, Alt+. 결과1.25배. 버튼 클릭 후 Space로 일시정지, Esc로 종료.
- 실제 Canvas 영상 Enter로 큰 화면, 화면에 표시된 영상 Space로 재생/일시정지.
- Canvas 카드 컴포지션에서 임시 지정한 실제 하이라이트/불릿 단축키 적용 확인, 임시 단축키 제거. 일반 Markdown 컴포지션에서도 활성 편집기 일치·하이라이트 명령·Esc 복귀 확인.
- 라벨 아이디어 선택 시 해당 두 항목만 표시. 없는 검색어와 교차 시 결과 없음. 형식 체크 변경 동작 확인.
- PDF 화면1920×1032 전체 차지. test.pdf에서 한 페이지 선택 → 다른 PDF에도 한 페이지 유지 → Sandbox 재시작 후 유지.
- 템플릿 실제 썸네일4개 한 줄, 검색/사용자 빈 목록 확인. 선택된 앰버 템플릿과 글꼴 예문 확인.
- 같은 Sandbox 실제 재시작 후0.1.7 활성, 미디어 재생버튼 클릭 후Esc 동작. 설치main.js/manifest.json/styles.css 원본과 바이트 일치.

## 범위와 남은 작업
- PDF 주석·메모는 사용자 추가 요구사항을 받은 후 구현하며 이번 범위에서 제외.
- Presentation 간격은 Remote 빈 목록에서 확인. 모든 Presentation 데이터 조합과 전체 UCT 기능을 재검증했다는 의미는 아님.
- 미디어 컨트롤의 Windows/Electron 환경 실제 검증이며 다른 운영체제는 미검증.
- Outliner 필터는 각 화면 세션 내 상태이며 Canvas 자료와 컬렉션 소속을 변경하지 않음.
- 검증 자료 UCT-017-Editing.canvas, UCT-017-Markdown.md, UCT-017-Seek.wav는 Sandbox에만 존재.

증거: .validation/revision-017/ (화면 및 변경 전 백업).
Sandbox: work/UCT-Integration-Sandbox, profile work/UCT-Integration-Profile, CDP19764. 재시작 target0CD4ADC0B49A1220E34097CEA345092D, PID6720.
