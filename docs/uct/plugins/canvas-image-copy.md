# Canvas Image Copy — 이미지 파일 복사/저장

> 조사일 2026-10-26 · manifest 0.1.0 · 기준 커밋 83bf3d6199a18645e82be82a64db3e0d09447a47
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/canvas-image-copy/tree/83bf3d6199a18645e82be82a64db3e0d09447a47/src) · [로컬 스냅샷](../../../reference/snapshots/canvas-image-copy/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 정확히 무엇을 복사하는가

src/main.ts:33–43은 Canvas 선택 중 type=file이며 지원 이미지 확장자인 실제 Vault 파일을 모으고 동일 경로를 중복 제거한다. **Canvas 전체나 선택 영역을 그림으로 캡처하는 기능이 아니다.** 이미지 카드가 가리키는 파일을 내보내는 기능이다. 웹페이지 내 임의 이미지나 선택 그룹의 모든 하위 이미지까지 자동 수집한다고 단정하지 않는다.

main.ts:50–54는 Windows PowerShell을 숨겨 실행하여 System.Windows.Forms.Clipboard.SetFileDropList로 파일 목록을 클립보드에 넣는다. 픽셀 bitmap 클립보드가 아니라 파일 복사 목록이다. :72 부근 저장은 Electron 폴더 선택창 후 copyWithoutOverwrite를 사용한다. files.ts가 충돌 없는 저장 이름과 이미지 판별을 담당한다.

## 사용자 조작과 제한

선택 이미지 클립보드 복사/폴더 저장 명령 및 Canvas 선택·노드 메뉴가 있다. 코드 기본 단축키는 지정하지 않는다. Windows와 로컬 FileSystemAdapter를 검사하고 busy 보호 및 성공/제외/실패 알림을 제공한다.

## 통합

Canvas Palette의 Collect/잘라내기와 목적이 다르다. Image Copy는 외부 클립보드/폴더로 파일을 내보내고, Palette는 Canvas 자료 구조를 보관·재배치한다. 이름이 copy라는 이유로 하나를 없애면 기능 손실이다. 이미지 파일 판별·경로 확인 같은 공통 유틸리티만 공유할 수 있다.

상시 폴링이 없고 사용자 실행 때 파일 접근·프로세스·복사가 일어난다. 통합에서 큰 상시 성능 비용을 줄이는 주요 대상은 아니다. 실행 검증과 실제 파일 크기별 성능은 미측정.

