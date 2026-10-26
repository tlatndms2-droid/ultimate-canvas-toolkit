# Codex 기술 검증 및 구현 인계

## 개발 경계
기획의 핵심 의도와 관찰 가능한 UX는 `01_Final_Planning.md`, `02_Decision_Register.md`가 기준이다. Codex는 API·알고리즘·패키지·클래스·파일 구조를 선택하되 사용자 확정 결과를 임의로 바꾸지 않는다.

## 개발 착수 전 검증 게이트
- [ ] **공식 API/Obsidian 버전**: Windows Desktop의 Canvas 공개 인터페이스, Workspace/파일 이벤트, Node 선택·카메라 Fit, Canvas 수정 이벤트, Cmd/키 입력 지원 범위 확인. 미공개 API 의존 발생 시 명시.
- [ ] **Group 포함 관계**: JSON Canvas가 명시적 부모 ID를 보유하지 않는 경우 중첩·부분 겹침·경계·이동 중 판별 정확성, 재저장 후 일관성 실제 테스트.
- [ ] **기본 키 조합 확인**: 사용자 환경 Ctrl+Drag 복제, Shift+2 Selection Fit; Obsidian 버전·키맵 확인. 단축키 추측 금지.
- [ ] **Node ID 수명**: 삭제/Undo/복제/외부 편집 후 식별자·연결 복구 시나리오 검증; 동일 텍스트 새 Node에 참조를 잘못 연결하지 않음.
- [ ] **Plugin Data 원본 분리**: 저장/읽기, crash-safe 갱신, Vault sync/이동/이름변경/복제, 플러그인 비활성화·재설치. 실제 파일관리자에서 복제한 Canvas의 Plugin Data 독립 승계가 자동 가능한지 입증하고, 불가능한 외부 동작은 사용자와 재검토.
- [ ] **자동 Camera 전환**: 내장 Zoom-to-selection과 Presentation Group의 지정 사각형 Fit, 부드러운 Pan/Zoom 구현 및 중간 사용자 입력/타 플러그인 탐색 충돌 테스트.
- [ ] **Presentation Group Overlay**: 원본 `.canvas` 변경 없이 위치/크기 저장, Canvas 줌·이동과 좌표 정합, 사용자 Drag/Resize/숨김 처리, 다른 카드 및 확장 플러그인 이벤트 간섭 방지.
- [ ] **등록 아이콘 공존**: Overlay DOM/Canvas UI 등 현재 설치 플러그인과 자동 겹침 감지 가능한 범위 조사, 불가능하면 수동 위치 설정을 안전한 대체 경로로 보장.
- [ ] **Heading/Line 내부 이동**: Canvas Text/Markdown File 노드 내부의 줄·Heading 위치로 이동 및 임시 Highlight 가능한지 형식별 검증. 불가능 시 요구를 임의 축소하지 말고 증거/대안 보고.
- [ ] **메타데이터**: Canvas Node 개별 생성/수정시각 추적; 원본 `.canvas` 형식에 없는 경우 초기/기존 항목의 정렬 의미 및 유지 방식 검증.
- [ ] **검색 데이터**: 기본 Node 타입과 실제 Card/MD/Image/Link/PDF/YouTube/Site URL/Link Card의 매핑 및 제목/URL 접근 가능성 검증.
- [ ] **Undo 분리/일관성**: Canvas Ctrl+Z 및 Collection·등록 상태의 Undo 처리 대상 충돌, 반복 Undo/Redo, 저장/불러오기 경계 시험.
- [ ] **성능**: 실제 대형 Canvas에서 Node 수에 따른 입력 지연, Pan/Zoom FPS, 파일 쓰기 빈도·검색 지연·Remote Map 표시 비용 측정. 임의 목표 수치를 사용자 확정인 것처럼 작성 금지.

## 구현 중 위험 및 우선순위
1. Critical: 원본 `.canvas` 손상·덮어쓰기·복제본/원본 연결 혼동 금지.
2. High: Group 계층 오판, 삭제 복구 연결 실패, Presentation 중 입력 충돌.
3. High: 외부 도구와 공존, 검색 내부 위치/Highlight 가용성.
4. Medium: 아이콘 배치, 노드별 타임스탬프, 대량 항목 성능.

## 실패/대체 정책
- 검증 불가한 기능을 성공이라고 보고하지 않는다.
- 공식 기능과 비공개 기능을 구분하고, 동작이 불안정할 경우 개발을 중단하거나 위험 경로를 비활성화하고 사용자에게 선택 가능한 대안을 보고한다.
- 사용자 결정과 충돌하는 기술적 편법(예: 원본 `.canvas`에 전용 Presentation Group 저장, 모든 일반 Item 자동 등록, 설명 없이 검색 범위를 축소)은 도입하지 않는다.
- 각 단계 구현과 테스트 증거를 남기며 3단계의 이전 단계 회귀를 필수로 한다.

## 전달 산출물 권장
- 실제 구현 코드/테스트(개발 단계)
- 기능별 검증 매트릭스 및 근거
- 데이터 호환성/마이그레이션 설계
- 사용자 안내와 알려진 한계
- 빌드/릴리즈 검증 로그
