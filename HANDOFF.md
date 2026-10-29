## 2026-10-29 — 0.1.13 공개 배포 완료

사용자 배포 승인. Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.13
- 소스 커밋 e647ca0. Outliner HTML 사본 제외, 불필요한 저장/초기 읽기 절감, 정렬과 전환 갱신 개선.
- 22검사 및 기존 동일 빌드의 타입 검사/빌드/Sandbox UI·재시작 검증 재사용.
- 공개3파일 바이트 일치. 기존 Sandbox BRAT 실제 재설치 성공, 활성0.1.13, 설치파일/manifest 일치 및 library.json 보존.
- Secondbrain에는 앞선 로컬 파일 설치가 있으나 이번 배포에서 재시작/버전 표시 재확인은 수행하지 않음. Sandbox 확인을 실제 Vault 버전 증거로 혼동하지 말 것.
- 알려진 제한: 로딩 중 이전 목록 잠깐 표시, 일부 포탈 이름 HTML 표시. 전체 통합 감사 완료 아님.
- 증거: .validation/release-0.1.13/ 및 .validation/outliner-real-20261028/.

## 2026-10-28 — 0.1.12 공개 배포 완료

사용자의 “배포해” 승인으로 기존 배포 금지를 이번 UCT 릴리즈에 한해 해제했습니다.
- Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.12
- 코드 커밋: f5724116e56ae49f732350a306aa404df48385b1
- main.js·styles.css·manifest.json 공개 다운로드와 검증 빌드 일치.
- 기존 Sandbox의 BRAT 실제 강제 재설치 성공, 활성 버전 0.1.12. main.js·styles.css 바이트 및 manifest 필드 일치.
- library.json 재설치 전후 바이트 동일, 항목 51개·폴더 82개 유지. Mini 실제 화면 확인, Sandbox 열린 상태.
- 증거: .validation/release-0.1.12/public-assets.json, brat-proof.json, brat-mini.png
- 종합 감사의 미검증 범위는 Release 본문에 공개했습니다. 전체 통합 감사 완료를 의미하지 않습니다. 원본 7개 저장소와 실제 작업 Vault는 변경하지 않았습니다.

## 2026-10-28 Mini 성능 개선 — 로컬 0.1.12 / 배포 금지

화면 밖 항목의 내부 레이아웃 계산을 미루는 CSS containment 적용. 같은 Sandbox 재시작 후 개선 전후 교차3회 중앙값: 500개 목록 생성95.4→36.6ms, 검색26.4→12.1ms, 카드 보기98.0→33.9ms. 기존 자료51개·폴더 보존, 실제500개 선택/스크롤/검색/더블클릭/썸네일 확인, 타입 검사·21검사·빌드 및 설치3파일 일치. 전체 감사 완료는 아님. docs/uct/LOCAL_AUDIT_0.1.12.md 참조. push/Release/BRAT 미실행.

## 2026-10-28 후속 통합 검증 — 로컬 0.1.11 / 배포 금지

호스트 창 축소 시 Mini 화면 이탈 수정. 실제 드래그 이동·Shift 복사·Esc 취소·그룹 연결 유지, 네이티브 수동 ZIP 저장/복구, 이미지 파일 클립보드, PDF 전체 화면·공통 배율 확인. 같은 Sandbox 재시작 후 51개 항목·폴더 구조 보존 및 설치 3파일 해시 일치. 목록 성능 실험은 결과 불일치로 되돌림. 전체 감사는 아직 완료 아님. 세부 통과/부분 검증/남은 항목: docs/uct/LOCAL_AUDIT_0.1.11.md. 증거 .validation/final-followup-20261028/. CDP19767. push/Release/BRAT 미실행.

## 2026-10-28 검수 수정 8건 — 로컬 0.1.10 / 배포 금지

폴더 단일 토글·전체 형식 접기·색상 키 입력 우선순위·접힌 편집기 폭 조절·빈 Outliner 화살표·컴포지션 명령 격리/Undo·잘라내기 가위 배지 반영. TypeScript/21검사/빌드, 실제 Sandbox UI와 같은 프로세스 재시작 검증. 세부 결과 및 사용자 확인표: docs/uct/LOCAL_AUDIT_0.1.10.md. 증거 .validation/revision-020/. 이전 전체 통합 감사의 미검증 항목은 별도로 유지. push/Release/BRAT 미실행.

## 2026-10-28 컴포지션 기본 표시·전환 — 로컬 0.1.8 (배포 금지)

UCT 설정 > 컴포지션에 읽기 쉬운 행 길이·줄 번호·인라인 제목 토글 추가. Obsidian 기본 설정과 연결되어 일반 Markdown에도 동일 적용. 컴포지션의 제목 숨김/행 너비 강제 CSS 제거. Ctrl+Shift+Enter 진입·복귀 전환, Esc 유지. 동일 키 이벤트의 명령/DOM 중복 호출 방지. TypeScript·빌드 통과, Sandbox 일반 Markdown 및 Canvas 카드 전환 확인, 설정 UI 세 옵션 켜기/끄기 화면 확인, 같은 Sandbox 재시작 후 설정 유지·0.1.8·전환 재확인. 설치3파일 바이트 일치. 증거 .validation/revision-018/. 배포/push/BRAT 미실행.

## 2026-10-27 입력·필터·전체 화면 수정 — 로컬 0.1.7 (배포 금지)

영상·음악 Enter 큰 미리보기, Space 재생/일시정지, 좌우5초·상하5%·Alt+./, 배속0.25. 버튼 클릭 후Esc 미작동 수정. 컴포지션 Markdown 명령 연결, 확장 가능한 템플릿 갤러리, PDF 전체 화면·공통 마지막 보기 설정, Outliner 형식/라벨 필터와 발표 간격 반영. 빌드/20검사 및 같은 Sandbox 실제 재시작 확인. 세부 검증 범위와 제한: docs/uct/LOCAL_AUDIT_0.1.7.md. PDF 주석·메모는 추가 기획 대기. 공개 배포/push/BRAT 미실행. CDP19764, Sandbox/Profile 동일.

## 2026-10-27 UI 시안 반영 — 로컬 0.1.6 (배포 금지)

Collect 고정 Storage 토글, SVG 카드/목록 아이콘, 내부 경계 드래그와 저장, 정렬창 높이/너비, 목록 선택 스타일과 Markdown 상세 미리보기 수정. 컴포지션은 승인된 실제 배경 썸네일 갤러리와 Windows 글꼴 검색/예문 선택, 네이티브 우클릭 메뉴의 겹침 순서 수정. Canvas 이미지·영상·음악 Shift+Enter를 전체 화면 미리보기에 연결하고 기존 이미지 Enter 경로도 통일. 미디어 닫기 버튼 추가, 원래 카드 재생 중지.

TypeScript·빌드·18개 관련 검사 통과. 실제 Sandbox에서 토글 좌표 일치(901,200), Storage 드래그, 카드/목록 전환, 760px 창 정렬 글자, Markdown 상세, 실제 템플릿/글꼴 선택, 텍스트·이미지 우클릭 메뉴, 세 미디어 Shift+Enter와 기존 이미지 Enter 경로 확인. 재시작 후 0.1.6·Storage 너비302·보기 상태·컴포지션 설정 보존. 소스/설치 3파일 SHA256 일치. 증거: .validation/ui-polish-20261027/.

Sandbox: work/UCT-Integration-Sandbox, Profile: work/UCT-Integration-Profile, CDP19764, PID10988, 재시작 target BCC0A7F3A72238555AC9F2769783EB21. 현재 Mini를 열어 검토 가능. 실제 Vault·원본 저장소·공개 릴리즈 변경 없음. push/Release/BRAT 미실행. 전체 UCT 기능 재검증이 아니라 이번 수정 범위 검증이다.

## 2026-10-27 컴포지션·편집기·전체 화면 미디어 — 로컬 0.1.5

사용자 승인한 4개 배경과 장식 유지/Obsidian 마크 반영. Ctrl+Shift+Enter Live Preview 집중 편집, Enter 작은 편집기 자동 저장·테두리 전체 리사이즈, 전체 화면 미디어 구현. TypeScript·빌드·18검사·실제 Sandbox UI/재시작 통과. 상세 범위/제약은 docs/uct/LOCAL_AUDIT_0.1.5.md. CDP19764, UCT-Integration-Sandbox/Profile. **배포 금지 유지. 공개0.1.1 그대로, push/Release/BRAT 미실행.**

## 2026-10-27 Mini 패널 확장 — 로컬 0.1.4, 배포 금지

Collect 폭과 기준 위치를 별도로 저장하여 Storage는 왼쪽, 상세는 오른쪽으로 창을 확장한다. 좁은 창의 상세 하단 배치 제거. TypeScript·빌드, 실제 클릭/리사이즈/반복 토글 8개 상태의 폭·위치 측정, 화면 경계, 실제 재시작 후 601px Collect 폭 보존 확인. 증거 .validation/mini-panels-20261027. Sandbox CDP19763, 프로필 UCT-Integration-Profile. 기존 자료 유지, 공개 배포 미실행.

## 2026-10-27 컬렉션 밖으로 드래그 — 로컬 0.1.3, 배포 금지

목록 상단에 고정 꺼내기 영역을 두고 최상위 항목 위 드롭도 허용. Sidebar/Remote 일반 항목·그룹·Vision Group·가상/링크 포탈 네이티브 마우스 드래그, 하위 컬렉션 꺼내기, 다시 넣기까지 12개 경로 통과. Canvas 그래프 불변·재시작 후 컬렉션 소속 보존·설치 파일 해시 일치. 증거 .validation/collection-extract-20261027. 검증 창 UCT-Collection-Drag-Check.canvas. push/Release/BRAT 미실행.

## 2026-10-27 현재 상태 — 로컬 0.1.2, 배포 금지

사용자 요청: 합의 기능 전체 검증·수정 후 Sandbox를 열고 배포하지 않기. 0.1.1 공개 이후 사용자 지적을 반영한 로컬 수정본이다. 단위 검사 14개·빌드·실제 Sandbox 동작·재시작 저장값 대조 완료. 공개 최신판 0.1.1 유지, push/Release/BRAT 미실행. 상세 검증과 한계는 [LOCAL_AUDIT_0.1.2.md](docs/uct/LOCAL_AUDIT_0.1.2.md). Sandbox/CDP19762, UCT-Integration-Profile, Obsidian1.14.5.

# UCT 0.1.1 handoff

2026-10-27. Approved 12 mockups implemented. Build, TypeScript check, 11 tests, isolated Obsidian 1.14.5 UI and same-Sandbox restart passed. Public Release0.1.1 (ID424428126, tag e311326) and BRAT2.2.0 Latest installation/activation passed. All public assets match final build. BRAT JS/CSS byte-identical, manifest fields identical with whitespace-only serialization difference. Post-BRAT actual doubleclick preview and Alt+L inline editor also passed; library/metadata/UI unchanged. Read PROJECT_MEMORY.md, latest DECISIONS section and latest IMPLEMENTATION_PLAN section before continuing. Do not reopen settled choices.

## Source and build

Public repository: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit . Node >=22; pnpm build/check/test. Generated main.js/styles.css are release assets, manifest version0.1.1, minAppVersion1.14.4. Source styles are tracked explicitly; preserve those exceptions in .gitignore. No new runtime dependencies.

## Current behavior

Alt+L inline name; label doubleclick anchored name/color. Alt+C or plain + caption, 16px logical gap. Enter/outside saves, Esc cancels. Waypoint UI/runtime/commands removed; historical Canvas fields untouched. Portal icons distinct. Presentation control strip removed; functions remain commands, new commands unbound. Mini derived format classification preserves saved types. Single click details, doubleclick big preview, rename by latest ID and customDisplayTitle; source filenames untouched. Native-coordinate group stage scales uniformly, including edges and PDF. Optional library.ui.collapsedFolders, 8 resize edges/corners. Preview lifetime closes PDF refs/media/observers/components. Initial detail rendering is delayed350ms to preserve actual doubleclick in a reflowing grid.

## Data and Sandbox

Use only existing work/UCT-Integration-Sandbox and work/UCT-Integration-Profile, CDP19762; rediscover after restart. Never touch another Obsidian process or working Vault. Keep Sandbox open for review. Test Canvas UCT-011-Check.canvas and folder 0.1.1 검증 자료 contain own fixtures. Existing user6 Mini items are JSON-identical to pre-update copies. Backups and private evidence in .validation/0.1.1; never publish. library version remains1, module data paths unchanged. Selected Mini view/item are not newly persisted; geometry/collapse/data are.

## Safety and limits

Original seven repositories must remain until the human explicitly says “완성됐다”. No working Vault change, no original filename change, no automatic backup or destructive old Waypoint cleanup. Runtime checks and limitations are in IMPLEMENTATION_PLAN; no claim of complete all-branch regression or measured speedup.
