# UCT 로컬 0.1.5 검증 기록

공개 배포 없음. 기존 로컬 0.1.2~0.1.4 수정은 보존했다. 실제 작업 Vault와 원본 저장소는 변경하지 않았다.

## 구현과 검증

- 승인한 4개 템플릿을 로컬 자산으로 포함. 실제 화면에서 타자기 종이/모니터 안에 글이 들어가며 모니터 장식·Obsidian 마크를 확인했다.
- 실제 Obsidian MarkdownView를 이동하여 집중 모드를 구성했다. 일반 Markdown·Canvas text·MD 카드·기존 작은 편집기 경로, Ctrl+Shift+Enter/Esc, 실제 Live Preview 전환과 원래 소스 모드 복귀를 확인했다.
- 긴 문서 타자기 스크롤: scrollTop 2333, 커서 Y452.7, 입력 영역 중앙 Y467.1. 일반 스크롤 설정과 별도로 동작한다.
- Windows 글꼴 목록 166개 표시, 템플릿별 설정, 사용자 사진 복사·삭제(원본 유지), 설정 미리보기 영역 마우스 드래그를 확인했다.
- 작은 편집기: 입력 후 자동 저장, 즉시 Esc 저장, 여러 창/현재 창 종료, 네 변·네 모서리 실제 마우스 리사이즈, 외부 클릭 후 유지, 배경 opacity0.45/본문 opacity1을 확인했다.
- 포탈에서 Enter 편집→Esc 닫기→Ctrl+Enter 퇴장 재현 검사 통과. 종료 시 포커스가 body로 빠지는 문제를 수정했다.
- Canvas↔Markdown 전환 중 Outliner의 사라진 Canvas 접근, Portal 메타데이터의 null 파일 경로 접근을 수정하고 오류가 재발하지 않음을 확인했다.
- Mini의 이미지/영상/음악 실제 더블클릭 모두 1920×1032 오버레이. 단일 클릭 상세는 오른쪽(x1044), Collect 폭601 유지.
- Canvas 및 Markdown의 이미지/영상 미리보기, 음악 제목/안내 영역 더블클릭, 이미지 확대·복원, Esc/배경 클릭 닫기를 확인했다. 기존 Obsidian 이미지 lightbox가 뒤에 중복 생성되는 문제를 수정했다.
- 영상 재열기 paused=true/time0.42357, 음악 paused=true/time0.3 확인. 앨범 이미지가 있는 실제 MP3 파일(4초)에서 이미지1536px 로드, 없는 WAV는 아이콘 표시를 확인했다.
- TypeScript 통과, 빌드 통과, 테스트18개 통과. 글자 수·배경 영역 계산·형식 판별·ID3 커버/잘린 데이터·기존 폴더/원본/묶음 처리 검사 포함.
- 실제 Sandbox 재시작 후 version0.1.5, 컴포지션 설정 및 Mini library JSON 동일, 재생 위치 메모리0, 집중 모드 재진입/복귀 성공. 설치 main.js/styles.css/manifest.json 해시가 소스 빌드와 동일하다.

## 검증 범위와 유의점

음악의 브라우저 기본 재생/탐색 컨트롤 내부는 DOM 더블클릭을 전달하지 않는다. 기본 컨트롤을 가리지 않고 Canvas 파일 제목, Markdown '음악 · 더블클릭하여 크게 보기' 영역을 진입점으로 제공한다. Mini는 항목 전체 더블클릭이다.

MP3 APIC 커버는 실제 파일로 검증했다. FLAC/M4A 커버 파서는 구현했지만 실제 파일 조합별 검증은 하지 않았다. Windows 한글 IME의 모든 조합/서드파티 테마 조합은 전수 검증하지 않았다. 이번에 저장·미리보기와 직접 관련 없는 ZIP/드래그 전체 회귀는 이전 검증 기록을 재사용하며 이번에 다시 모두 수행했다고 주장하지 않는다.

## 검토용 Sandbox

- Vault: work/UCT-Integration-Sandbox
- Profile: work/UCT-Integration-Profile
- 재시작 CDP:19764 / PID20096 / target ABE2980630F92121132BEEEF6237BA35
- 검토 문서: UCT-Composition-Check.md / .canvas, UCT-Composition-Cover-Test.mp3
- 증거: .validation/composition-20261027 (사전 백업, 화면, 재시작 전후 JSON)
- 원래 미니 자료와 테스트 문서는 유지. 원본 템플릿 이미지 보존. Release/BRAT/push 미실행.

## 사용자가 확인할 동작

- [ ] 일반 MD에서 Ctrl+Shift+Enter: 앰버 집중 화면, Esc: 원래 문서.
- [ ] UCT 설정 → 컴포지션: 배경/설치 글꼴 선택, 입력 영역 이동·크기 변경.
- [ ] Canvas 카드에서 Enter: 자동 저장 편집기, 테두리 아무 위치에서 크기 조절.
- [ ] Mini 미디어 더블클릭: 전체 화면, Esc: 닫기. 음악은 재생 버튼을 직접 누르기.
