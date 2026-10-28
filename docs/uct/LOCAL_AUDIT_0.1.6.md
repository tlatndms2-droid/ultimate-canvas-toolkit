# UCT 0.1.6 로컬 UI 수정 확인

## 2026-10-27 UI 시안 반영 — 로컬 0.1.6 (배포 금지)

Collect 고정 Storage 토글, SVG 카드/목록 아이콘, 내부 경계 드래그와 저장, 정렬창 높이/너비, 목록 선택 스타일과 Markdown 상세 미리보기 수정. 컴포지션은 승인된 실제 배경 썸네일 갤러리와 Windows 글꼴 검색/예문 선택, 네이티브 우클릭 메뉴의 겹침 순서 수정. Canvas 이미지·영상·음악 Shift+Enter를 전체 화면 미리보기에 연결하고 기존 이미지 Enter 경로도 통일. 미디어 닫기 버튼 추가, 원래 카드 재생 중지.

TypeScript·빌드·18개 관련 검사 통과. 실제 Sandbox에서 토글 좌표 일치(901,200), Storage 드래그, 카드/목록 전환, 760px 창 정렬 글자, Markdown 상세, 실제 템플릿/글꼴 선택, 텍스트·이미지 우클릭 메뉴, 세 미디어 Shift+Enter와 기존 이미지 Enter 경로 확인. 재시작 후 0.1.6·Storage 너비302·보기 상태·컴포지션 설정 보존. 소스/설치 3파일 SHA256 일치. 증거: .validation/ui-polish-20261027/.

Sandbox: work/UCT-Integration-Sandbox, Profile: work/UCT-Integration-Profile, CDP19764, PID10988, 재시작 target BCC0A7F3A72238555AC9F2769783EB21. 현재 Mini를 열어 검토 가능. 실제 Vault·원본 저장소·공개 릴리즈 변경 없음. push/Release/BRAT 미실행. 전체 UCT 기능 재검증이 아니라 이번 수정 범위 검증이다.

## 검토 위치

- Mini: Collect 왼쪽 토글, Storage와 목록 사이 경계, 카드/목록 아이콘, 정렬 선택창.
- UCT 설정 → 컴포지션: 템플릿 사진 선택, Windows 설치 글꼴 클릭 후 검색·예문.
- Canvas 이미지/영상/음악 선택 → Shift+Enter. Esc·닫기 버튼으로 복귀.
- 컴포지션 글 본문 우클릭: 기본 편집 메뉴가 위에 표시됨.

시안의 예시 콘텐츠와 실제 사용자 자료는 다르며, 템플릿은 기존 승인 파일을 사용한다. 이름/표시 UI만 변경하고 자료 재이관은 하지 않았다.
