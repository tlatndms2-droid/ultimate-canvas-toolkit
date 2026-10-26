# Canvas PDF Viewcard — 카드 읽기와 큰 미리보기

> 조사일 2026-10-26 · manifest 0.1.2 · 기준 커밋 f2982a6fef74246df3bf8476a1ec2ed83dcdbd07
> [고정 GitHub 소스](https://github.com/tlatndms2-droid/obsidian-canvas-pdf-viewcard/tree/f2982a6fef74246df3bf8476a1ec2ed83dcdbd07/src) · [로컬 스냅샷](../../../reference/snapshots/obsidian-canvas-pdf-viewcard/src) · [위치 색인](../../../reference/CODE_INDEX.md)
> 아래 경로는 해당 저장소 기준. 정적 분석이며 런타임 검증은 아님.


## 실제 동작

src/main.ts:79–96 Canvas scope 키를 앞에 등록한다. 단일 PDF 카드에서 Enter는 카드 읽기 전환, Ctrl+Enter는 읽기 종료 후 큰 popup을 연다. 입력창/contenteditable 등의 포커스를 제외한다. :145–163 popup은 하나만 열리고 Enter/Esc로 닫는다. popup은 현재 카드 페이지에서 시작하지만 popup에서 바꾼 페이지를 카드 페이지에 다시 저장하지 않는다.

model.ts는 한 페이지/연속/양면/양면 연속, 페이지 맞춤/너비 맞춤, 줌 0.1–4, 페이지 상태를 정의한다. 카드 상태 키는 Canvas 경로+노드 ID다. viewer.ts는 페이지 입력·이동·레이아웃·줌/읽기 키를 구현한다. 네이티브 PDF embed를 교체하고 해제 시 되돌리며 Canvas 노드 데이터를 다시 쓰는 플러그인은 아니다.

## 렌더링·저장 구조

pdf-pool.ts는 file.path+mtime+size를 키로 문서/worker를 참조 횟수로 공유하고 마지막 사용자가 해제하면 파괴한다. viewer.ts는 화면에 필요한 페이지를 requestAnimationFrame으로 렌더링하고 화면 밖 canvas를 정리한다. 동시 렌더 작업은 viewer당 2개, 페이지 렌더 픽셀은 8백만 상한 계산을 사용한다. ResizeObserver와 job 취소·destroy가 있다.

main.ts의 layout/file/PDF modify·rename 이벤트, 1500ms scan, 60ms 예약 scan으로 카드를 붙인다. 카드 설정 저장은 250ms 지연 및 직렬 저장이다. popup 페이지가 카드 설정에 섞이지 않도록 한다.

## 통합

Visibility Enter는 텍스트/Markdown, Mindmap Enter는 이미지·영상·오디오/YouTube, PDF Enter는 읽기다. Portal Ctrl+Enter와 PDF popup Ctrl+Enter는 포커스/카드 역할에 따라 충돌 가능하므로 입력 담당을 한 곳에서 정해야 한다. 현재 충돌을 실행 재현한 것은 아니다.

Mini PDF 썸네일/큰 미리보기에서 이 렌더링 기반을 재사용할 여지는 있지만 자료 수만큼 full viewer를 항상 생성해서는 안 된다. 공통 문서 pool과 가벼운 썸네일 수명주기를 구분한다. Portal 내부 카드 상태도 공간 ID와 일치시켜야 한다.

PDF 고해상도 page canvas가 메모리 비용의 주요 후보이며 이미 제한이 있다. 통합 후 이 제한과 해제를 보존해야 한다. 정량 실행 비용은 미측정.

