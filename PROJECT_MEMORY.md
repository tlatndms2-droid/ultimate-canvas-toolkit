## 2026-11-10 — 0.1.19 자동 포커스 스위치·명령 배포

- 사용자 검수 후 배포 승인. 카드 입력 시 자동 화면 이동·확대/입력 줄 추적을 끄는 autoFocusOnEdit 설정 추가. 기본 ON, OFF는 카메라 RAF 시작 안 함/진행 중 추적 즉시 해제. Ctrl+P ‘카드 입력 시 자동 포커스 켜기/끄기’가 같은 설정 전환·저장·알림. 이전 설정 백업은 ON으로 호환.
- Sandbox 실제 ON/OFF·입력·위치/배율·명령 팔레트·설정 저장/재로드 확인. 타입/빌드 통과. 소스 dc8f8d5, Release https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.19 . 공개3파일/ZIP 해시 일치. 배포에 Sandbox/BRAT 검증 추가하지 않음. 원본 Vault 변경 없음.

## 2026-11-04 — 사용자 승인으로 0.1.18 공개 배포 완료

- Release https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.18 . 소스033bb8e, 공개3파일과ZIP 해시 일치. BRAT2.2.0 실제 재설치 후 별도 Sandbox 재시작1.15.0/UCT0.1.18/Outliner ready·자료보존·pending0 확인. BRAT manifest 공백 차이는 JSON 필드 일치로 확인.
- work/UCT-Release-0.1.18-Sandbox/CDP19852 열린 상태. 근거 .validation/release-0.1.18/final-proof.json 및 public-assets.json. 원본 Secondbrain 자동 업데이트/설치 없음. 아래 성능 목표 미완료 판정은 그대로 유지한다.

## 2026-11-04 — 0.1.18 최종 로컬 검수 결과, 전체 목표 미완료

- 최신 결과: docs/uct/PERFORMANCE_0.1.18_20261104.md. 사용자 지정 performance-speedup/obsidian-plugin-audit만 적용. 원본 Vault/Canvas Drawing/공개 배포 변경 없음.
- Mini DOM 재사용·즉시 보기/정렬 반영, 보호 저장 부가 작업 축소, 추가 저장의 중복 큐 대기 제거와 실행 시점 파일 동일성 검사, Portal 내용 불변 시 중복 저장 생략, 편집기 레이아웃 병합, Outliner 중복 sidebar 생성 방지 구현. 효과 없는 라벨 외부 입력창 실험은 원복.
- 245검사/TypeScript 통과. 복사본2 재시작 후 실제0.1.18/47플러그인/Outliner ready·corrupt=false, 설치3파일 소스 해시 일치. main.js d2f712773b2ef1e8ed6b2260bb3db375e95eeb02fca5ef0c62844eaa0eac1878.
- 실제513카드/97연결 전용복제 Canvas와 표시된 Mini 행: 이동3회0.726/0.664/0.770초, 중앙값0.726초. 이동·복사·취소/기존카드 보존 통과하나0.50초 목표 실패. 과거4초/85초와 조건이 같지 않아 직접 개선율 계산 금지. 물리 마우스 측정 아님.
- 세 실제 Canvas Outliner 경로·루트포탈 진입복귀, 편집기 Undo/저장·컴포지션 명령격리/복귀·편집기10회 해제 확인. 작은 미디어/PDF 목표 통과. Portal/Mindmap/편집기/발표 등 목표 초과는 보고서 표에 실패로 기록.
- 검수자료/설정 원복, Mini31자료 전체 일치, 원본3Canvas 바이트 복구 후 재시작 해시 일치, pending0, 임시계측/미디어/편집창0. 기존 sidebar3개 그대로. 근거 .validation/copy2-20261103/final-restart-proof.json. 재시작 백그라운드 초기 준비 대기가 길었으며 시작속도 개선으로 주장하지 않는다.

## 2026-11-03 — 공통 Canvas 엔진 적용

- 최신 구현/검수: docs/uct/COMMON_CANVAS_RUNTIME_20261103.md. src/canvas-runtime.ts에 view/session/portal 공간 공유, 동기 render batch 읽기 공유, view별 변경 알림 병합을 구현하고 Portal/PDF/Mindmap/Mini/Outliner/메타데이터 연결. 일반 selection 메뉴의 불필요한 Portal capture 제거, 포탈 전달은 유지.
- 관련51검사/tsc/build 통과 및 복사본2 설치. 동일 실제49노드 Canvas에서 Outliner render+메뉴7조회 ABBA: 이전 중복 작업 재현1825.9/1865.7ms, 새42.3/54.8ms. 전체 앱/배치 개선율 아님. 문서 읽기5→1/capture7→0, 그래프·Mini 동일.
- 새 Mini API배치3회:38794.3/1825.8/1402.4ms, 자료보존 통과. 이전과 source hash가 달라 엄밀한 전체 개선율 계산 금지. 첫회 지연과1초이상 대기는 미해결. 포탈/Outliner 공간, Ctrl+방향키 생성/연결·Undo 실제CDP 확인. 자체자료 정리/라이브러리 보존. 공개배포/Canvas Drawing 변경 없음. 전체 목표 미완료.

## 2026-11-03 — 복사본 2 Outliner 실행 상태 정정·복구

- 최신 기준: docs/uct/COPY2_RUNTIME_20261103.md. 기존 복사본 2 측정 때 Outliner는 누락된 revision 때문에 corrupt=true/identityReady=false였다. Mini ready와 설치 해시로 전체 모듈 정상 실행을 입증하지 못했다. 해당 측정값을 정상 전체 기능 환경 성능으로 사용하지 않는다.
- 사용자 승인 후 작업공간10월의 누락된22공간 기록만 원본에서 읽어 복사본에 복구. 다른 index 항목 보존, 원본 쓰기 없음. UCT 재로드 후 identityReady=true/corrupt=false 확인.
- Presentation의 state 미준비 시 불필요한 매프레임 document 변환 차단, 관련2테스트/tsc/build 통과 및 복사본 설치. 최신 정상 환경 배치 재측정 진행 중. 전체 목표 미완료, 배포 없음.

## 2026-11-03 — 복사본 2 저장 큐 확인

- queue-placement-result.json: 동일 열린 검수 Canvas 제품 API 이동 3회 Mini 제거2325/1260.4/1705.2ms. 자료 보존 모두 통과. 첫 회는 선행 adapter 큐 작업이 남았으나 2·3회 Canvas 쓰기는 큐 대기0ms, 실행1009/1392ms. 큐 대기만으로 지속 지연을 설명할 수 없다. 실행 시간에는 renderer callback 대기도 포함되므로 순수 디스크 시간으로 단정하지 않는다.
- 이번 제품 코드 변경 없음. 임시 계측 해제, 검수 폴더 정리 완료. cleanup-latest: 복사본2 UCT0.1.17 ready, 설치/소스3파일 해시 일치, Mini 전체 보존, pending0, testFoldersRemaining0, backgroundThrottling 원복true.
- 원본 G Vault와 Canvas Drawing 변경 없음. 공개 배포 없음. 대상 전환 완료, 전체 성능 개선 목표는 미완료. 다음 조사 대상은 보호 저장 중 renderer 정체와 실제 파일 비용 분리.
## 2026-11-03 — 복사본 2: CDP 프로파일 추가 확인

- 사용자 승인대로 검수 대상은 Desktop/secondbrain - 복사본 2. 기존 코드/0.1.17 빌드를 유지. 원본 G Vault와 Canvas Drawing 수정 없음, 공개 배포 없음.
- CDP 직접 Profiler 연결은 성공했다. 앞선 Electron remote debugger의 No target available 실패를 대체한 경로이며, CPU-only 1회 항목 제거 879.7ms. 단발 값으로 개선율을 계산하지 않는다.
- drop-trace.json: Canvas Loom의 배율 읽기(getComputedStyle) 안에서 UpdateLayoutTree 1092ms/8026 elements 발생. 파일 await와 겹쳐 fs wall time을 디스크 시간으로 단정할 수 없다. 스타일 무효화 원인이 Loom이라는 증거는 아니다. Profiler 시작 1307ms는 drop 전, 종료는 total에 포함되므로 비계측 total과 비교 금지.
- drop-invalidation.json: 다른 hidden 실행, 항목 제거4701.2ms. GC 및 환경 조건이 달라 전후 비교 불가. 임시 계측은 모두 해제.
- controlled-placement-result.json: background throttling을 검사 동안만 false로 두고 finally 원래 true로 복원. hidden 상태 제품 API 이동3회 항목 제거1515.3/1570.5/1212.8ms, 중앙값1515.3ms. 파일/원래 노드/기존 Mini 보존 통과. 물리 마우스 입력 전체 측정 아님. 속도 제한만으로 지연을 설명할 수 없다.
- cleanup-latest.js 결과: library 전체 pre-open과 동일, pending0, 검수 Canvas 폴더0, active 작업공간10월 복귀, 소스/설치3파일 해시 동일. 현재 새 코드 변경 없음. 이전 정상 재시작 증거 restart-proof.json 유지.
- 다음은 배치 중 렌더러 정체와 Canvas writeData의 adapter.promise 대기를 구분하고, 확인된 UCT 원인에 한해 수정. 여전히 전체 성능 목표 미완료. 기존 전체9영역 통과를 이유 없이 다시 반복하지 않는다.

## 2026-11-03 — 검수 대상 변경: Desktop secondbrain - 복사본 2

- 사용자 승인으로 이후 작업 대상은 `C:\Users\tlatn\Desktop\secondbrain - 복사본 2`. G 드라이브 원본에 새 검수/설치/재시작을 수행하지 않는다. 코드 작업 위치는 기존 저장소 그대로. 공개 배포 없음, Canvas Drawing 변경 없음.
- 별도 프로필 `C:\Users\tlatn\AppData\Local\UCT-Copy2-Validation-Profile`, CDP19843. 대상은 매번 app://obsidian.md/index.html 및 실제 Vault basePath로 확인한다. 설정 팝업도 같은 Vault 제목을 가지므로 제목만으로 선택하면 안 된다.
- 복사본 .obsidian을 `.validation/copy2-20261103/pre-open-obsidian`에 백업. 처음 새 프로필의 Obsidian1.12.7 및 신뢰 대화상자를 처리하고1.15.0으로 실행. UCT0.1.17 최신main.js 3e2bedbcc07672f1917929abcd49fd700cde776862077dfd818cde703bfe37e3 설치3파일/로드 확인.
- 최신 소스는 Portal 안전쓰기의 복구 사본 준비와 목적 임시파일 준비를 병렬화한 변경 포함. 원본에서 관련10테스트 및 앞선81관련테스트/tsc/build 근거 존재. G에서 같은 열린fixture ABBA old610.8/new512.2ms 중앙값(전체 무지연 아님). 복사본 성능과 직접 비교 금지.
- 복사본 실제513노드/97연결 자료의 전용복제Canvas에서 제품 배치API 이동4회 모두 저장/1회배치/원본자료보존 통과. Mini행 제거1649.3/1430/1557.8/1405.9ms로 느림. `.validation/copy2-20261103/placement-result.json`. 별도IO측정1275.6ms, 초기동시mkdir753.9/read792.3ms wall대기. 순수디스크시간 또는 특정플러그인 원인으로 단정하지 않는다.
- CPU세부측정은 remote debugger `No target available`로 실패. 준비한 전용자료는 finally 정리됐고 pending0. 후속은 현재 CDP WebSocket의 Profiler 도구를 사용해야 한다. 실패를 통과로 기록하지 않는다.
- 검수3개전용폴더 제거확인, Mini library 전체가 pre-open과 동일, 설치3해시 일치. `install-proof.json`. 최신빌드로 복사본 정상창닫기/재시작 완료. restart-proof.json에서1.15.0/UCT0.1.17 ready, 설치3해시, Mini전체보존, pending0 확인. 기존 전체9영역 유효 근거 재사용, 목표 미완료.
## 2026-11-03 — 현재 재개 기준: 0.1.17 설치·호환 확인, 저장 지연 미완료

- 현재 상태는 아래 11월2일 미설치/대기 기록보다 이 절과 `docs/uct/SECONDbrain_FILTER_20261103.md`가 우선한다. Secondbrain Obsidian1.15.0, UCT0.1.17 실제 실행/설치 해시 일치, ready=true/pending0/libraryPreserved=true를 확인했다.
- 사용자 최신 범위: Canvas Drawing Tool Bar는 그대로 둔다. 공개 배포 없음. 실제 Secondbrain에서 CDP 중심 검수, 생성한 검수 자료는 원복한다.
- Remote 필터 재열기 유지 및 형식필터의 그룹 계층/펼침 유지 수정 적용. Portal·Mindmap 1.15.0 실행 근거 `compat-current-result.json`; 작은 편집기·컴포지션·미디어·PDF 교차 사용 1.15.0 근거 `compat115-cross/cross-flow.json` 통과. API/CDP 검증을 물리 입력 검증으로 보고하지 않는다.
- 기존 전체9영역 결과는 `FINAL_VALIDATION_0.1.15.md`의 근거를 재사용하되, 최신 수정/버전 호환 결과는 위 11월3일 문서로 보완한다. 220검사 통과 이후 src/vendor/tests 수정 파일이 없음을 11월3일 확인. 무관한 전체 테스트 반복 불필요.
- 이전 최종3Canvas 재실행은 renderer 재로드로 응답이 끊겼다. 성공 근거로 사용하지 않으며, 자체 CLI 종료 후 전용Canvas/복제Mini항목/Outliner 기록을 백업·선택 정리했다. 새 교차검수 자료 및 최근파일 참조도 정리했다. 앱 강제 종료/재시작 없음.
- 잔여: Mini의 목적 Canvas 저장 지연. 이미 측정한 3실제Canvas 자료의 배치 결과와 I/O 분리를 재사용한다. 저장 확인을 생략하거나 자료를 먼저 제거해 성능 수치만 낮추지 않는다. 전체 렉 해결/모든 동작80ms 미만은 입증되지 않았다.
- 현재 저장위치 비교 재확인: 같은100KB 안전쓰기 4회씩 G 중앙값106.35ms/PC임시폴더36.5ms. 전체배치 시간 아님, 제품코드 변경 효과 아님. `.validation/storage-location-current-result.json`. 두 위치 임시파일/폴더 finally 정리.
- 앞서 사용자는 Drive 복사·동기화 중이라고 답했다. 현재 완료 여부를 한 번 재질문한 상태이며, 답변 전 종료됐다고 가정하지 않는다. Vault 위치나 외부플러그인을 변경할 권한으로 해석하지 않는다.
## 2026-11-02 — Mini 이미지 배치 및 Canvas 저장 충돌 수정 진행

- Collect 이미지 4개는 `origin.filePath` 없이 `sourceReferencePath`만 가지고 있었으며 해당 원본 파일은 존재했다. 이미지 복원에 이 경로를 사용하도록 수정. 로컬 0.1.16 적용본에서 네 이미지 모두 배치 자료 생성, 전용 복제 항목의 이동·복사와 원본 유지 확인. CDP 제품 API 결과이며 물리 드래그 검증이 아니다.
- Obsidian `view.save()`는 이전 저장이 진행 중이면 다음 저장을 예약하고 즉시 반환할 수 있다. 전용 Canvas에서 저장이 겹칠 때 기록 중인 JSON을 읽어 이동 처리가 중단되는 현상을 재현했다. 소스에는 저장 진행 중 대기, 저장 완료 확인 재시도, 재시작 복구 시 저장 중 기록 보존을 추가했다. 비교 검수는 `.validation/image-path-fix-20261102/save-wait-progress.json`이며 모의 충돌 조건이고 세 전체 시간 개선을 입증하지 않는다.
- 로컬 0.1.17은 전체 204검사·TypeScript·빌드 통과. Secondbrain에 빌드 `3ea4a15e43a94c082bda754362a2c9fcd0932e863ac1c99bf5d4958ab5f88179` 적용 및 정상 재시작 후 실제 로드 확인. 전용 이미지 복제의 제품 API 이동·복사 각1회와 실제 네 항목의 배치 자료 생성 확인. 물리 드래그 검증은 아님. 공개 배포 없음.
- 최종 빌드의 저장 충돌을 강제한 전용 Canvas 3회에서 데이터 보존 및 처리 완료. 항목 제거는 각각 8,906/26,950/23,960ms로 느렸다. `save-wait-installed.json`은 collision을 끈 인위적 경합·제품 API 시험이고 실제 마우스 지연이 아니다. 같은 조건의 정상적인 전후 비교가 없으므로 성능 개선율을 주장하지 않는다. 당시 G 드라이브 Outliner 색인 읽기 2,729ms와 네 자료 파일 읽기 각 772–834ms를 별도로 관찰했으나 전체 지연의 원인으로 단정하지 않는다. **전체 성능 목표 미완료.**
- 동일한 19,414바이트 색인 파일을 같은 Node 프로세스에서 G/local/local/G/G/local로 읽었을 때 G 중앙값 87.7ms, 로컬 중앙값 0.32ms였다. 내용 해시는 같았으며 실제 배치 시간이나 전체 앱 개선율은 아니다. Outliner 분할 12개를 4/8/8/4 읽기로 시험했을 때 4회차 3,846/370/259/157ms로 캐시·환경 변동이 커 8병렬 개선을 입증하지 못해 채택하지 않았다.
- 포탈 메타데이터 보조 순회만 실제 세 Canvas 자료·설정에서 읽기 전용으로 20회 측정: 736/90/554노드의 중앙값 0.2/0/0.2ms. 전체 Portal 동작 시간이 아니며 이 비용만을 병목으로 추정하지 않는다. `src/placement-save-wait.ts`에는 진행·예약된 Canvas 저장이 30초 넘게 끝나지 않으면 중간 파일을 읽지 않고 복구 기록을 유지하는 추가 수정을 작성하고 전체 206검사·TypeScript·빌드를 통과했다. 이 빌드의 G 드라이브 복사·해시 확인 세션 11286이 장시간 대기 중이며 사용자도 G 드라이브 복사 작업을 하고 있다고 알렸다. 쓰기 카운터가 멈추고 읽기가 진행되는 정황에 따라 Obsidian을 우선 다시 열었다. **최종 빌드의 설치 해시와 앱 실행 동작은 아직 검증되지 않았다.**
- 검수 전용 Mini 항목·Canvas 파일과 Outliner의 전용 기록 19개를 제거했다. 사용자 기존 자료를 이전 백업으로 덮어쓰지 않았다. 사용자가 재시작을 승인했다. 추후 명령 응답과 실제 동작을 확인하며, 원본 사용자 작업·설정 상태를 보존한다.
- 사용자 복사 작업이 끝난 뒤 설치 파일 해시 `9847d144fb182c9921305a33f274aabbd6dac8c5eaf84f38bdbcd6ad7ed79f8d`가 로컬과 일치하고 0.1.17 실행이 확인됐다. 새 전용 이미지 일반 이동은 성공했지만 Shift 복사 시험은 Canvas 화면 노드가 생긴 뒤에도 1.5초 시점 파일에는 노드가 없었다. 검수 도구는 전용 파일만 정리했으며 원본 Mini 이미지가 남은 것을 확인했다. 소스에 복사도 저장 완료를 확인하고 실패 시 Mini 원본을 유지한다는 보완을 작성했으나 **아직 설치·실제 검증 전**이다.

## 2026-10-30 — 최신190검사: Canvas별 Outliner 저장 적용·정상 재시작 완료

- 사용자 승인에 따라 실제 Canvas별 저장을 구현하고 Secondbrain 로컬0.1.15에 적용. main.js SHA256 `2fca1186c601eb1c06365cd2f9688ddd839393f580504496f069c00b2f786116`.190검사/실패0,tsc/build/diff통과. 공개배포/push/BRAT 없음.
- `vendor/outliner/src/partitioned-storage.ts`: 실제파일 root+포탈 공간은 같은 revision, 변경된 Canvas만 새 파일로 쓰고 검증 후 작은 index 원자교체. 기존 data.json SHA256 `15b61afc149c4186b416f06da4d93d29e92e29d369a893e57e89e8997ea0679c` 그대로 보존.현재/이전 정상 index와 revision 유지. 실패·손상 복구/동시 편집 포착/외부 변경 차단/v1 검증 export확인. 구버전 자동다운그레이드호환 아님.
- 실제21.8MB자료 component ABBAAB각3회:변경쓰기21,813,632→1,960,434바이트(약91%감소),중앙값3062.3→1231.4ms. new4311.8ms spike도 보존. 전체Mini성과로확대금지.
- 설치190 동일 drop A/B각3회:Outliner최종저장완료 중앙값2802.6→2065.3ms(약26%감소). Mini행제거486.9→498.4ms로 **이번 저장분할만으로 행제거 개선 입증 안됨**. 기존180수치879ms와 다른조건이라 직결금지. warm설정로더704.2→990.9ms로느려짐;전체앱시작시간측정아님. 첫마이그레이션10,965.2ms,매번실행비용아님.
- 설치190 Mini이동/Shift복사/취소/저장실패행복원/재시도중복없음,Portal진입복귀·공간별Outliner저장,collection-save/Undo/Redo 및 세실제Canvas전환 수행. 마지막 source-byte검사에서 네이티브Canvas의nodes/edges순서변경 발견:내용/좌표/연결동일검증후 동시간 safety의검증된이전바이트로정확복원.통합runner종료1을통과로고치지않고별도복원근거보존.
- 전용자료/탭/검수키/최근기록/전용Safety/비교control/v2백업전용참조 정리. 정상창닫기재시작후48항목/23폴더/library전체/layout동일·89공간/71Canvas보존·4모듈설정·원본3Canvas바이트·legacy원본해시·설치3해시일치. pending0/identityErrors0/임시변수0/throttling원래true. CDP/API+DOM증거이며ComputerUse/물리드래그시험아님.
- 최신증거 `.validation/secondbrain-performance-20261029/partitioned/runtime/final-restart-proof.json`, `baseline-state-comparison.json`, `comparison.json`, `load-comparison.json`, `source-order-restored.json`.상세 `docs/uct/PERFORMANCE_175_ADDENDUM.md` 맨위190절. **전체체감무지연/80ms미만/전체성능목표완료로보고금지**.이전9영역검수재사용,새변경없는전체반복금지.

## 2026-10-30 — 최신180검사 적용 / 저장 경합 개선·최종 재시작 대조

- 최신로컬0.1.15 main.js SHA256 `d566b19d59ce98c9a4ed63ae274fbc1661e8b2c5f56bc0bcac25c27f5151519a`.180검사/실패0,tsc/build/diff통과. Secondbrain 적용. 공개배포/push/BRAT 없음. 아래175는이전상태.
- 추가수정: Portal 한 write호출에서 이미검증한 동일복구사본의중복I/O생략(다음write에서는반드시재검증), Outliner 설정저장만 Mini배치내구성작업완료후실행. 화면갱신은막지않고 savePromise는실제저장완료까지미완료상태유지. Mini.whenIdle은gesture취소가아닌transaction종료때해제. 저장형식변경없음.
- 실제180 동일실행본 idle gate off/on ABBAAB각3회: 행제거중앙값1291.4→879ms,두프레임1483.8→1056.9ms,drop/두프레임반환2020.5→1530.6ms. 3회모두Outliner파일쓰기 active=false 이후시작/화면snapshot1노드일치. `safety-follow/runtime/gate-comparison.json`. 다른환경의790/473/347/356ms와직접비교금지. 파일대기·렌더러경합은남아전체체감무지연판정금지.
- FS대기분리프로파일:21.8MBOutliner read514/write745ms,library read449ms등을확인(실제fs콜백wall time이며순수디스크시간아님). 늦은refresh프로토타입은최종ready시간개선안돼제품미적용. safety중복제거단독은실제drop전체개선미입증;같은내용1.57MB 복사본detached adapter검증은915.2→280.2ms,changed쓰기개선미입증. 성과범위구분.
- 설치180 실제이동/Shift복사/취소/저장실패행복원/재시도중복없음,Portal진입복귀·공간별Outliner·저장확인. `regressions-180.json`, `portal-final.json`. 원래48항목/23폴더/library/layout일치까지live정리완료;전용파일/모듈참조/최근기록/전용Safety사본선택정리후정상창닫기재시작. 최종증거 `safety-follow/runtime/final-restart-proof.json`.
- 전체9영역기존유효검수재사용. 새후보확장없이현재수정본의범위·제한을확정. **전체목표완료로자동표시하지말것:** 최신행제거879ms가즉시반응이라는뜻아님. 남은제약은안전저장/재읽기·다른렌더러작업이겹친전체지연. 사용자에게재차일반드래그성공확인을요구하지말것. ComputerUse없음/CDP중심. 추가상세 `docs/uct/PERFORMANCE_175_ADDENDUM.md` 맨위180절.

## 2026-10-30 — 최신175검사 적용 / 전체 Mini 체감 지연 완료 판정은 보류

- 최신 로컬0.1.15 main.js SHA256 `3152b6eb1f865dc69572c40fb71725c9879cf26e36e053aa81491729b3a96e45`. Secondbrain 설치3파일 일치·175검사/tsc/build/diff 통과. 공개배포/push/BRAT 없음. 아래164 등은 과거 상태.
- 이번 추가 수정: Mini 행 제거 전 자료비교 지연/scrollTop0 강제레이아웃 제거(refresh122.5→1.6ms), JSON write의 매번 mkdir 생략(ENOENT만재시도), Outliner 동일call revision 재사용, 소유snapshot/긴불변문자열 JSON+UTF8 재사용(총32MiB한도·문자열키보관비용포함), 시작시 접힌Outliner패널을 강제로 열지 않음.
- 최종 설치본21.8MB 동일자료 ABBAAB native98.4→cached38.4ms, 바이트와 실제안전저장 일치. 이는 전체Mini 또는 전체저장시간이 아니다. 실제175 제품API+DOM 드롭의 Canvascommit261.3→170ms이나 행제거는old324.1/new356.3ms로 전체개선 미입증. readback26–220ms변동. `io-final/final-encoding.json`, `io-final/end-to-end/comparison.json`. 이미끝난전체9영역검수/Portal/Mindmap을이유없이반복하지말것.
- 설치174 실제컬렉션save/Undo/Redo·Portal진입복귀·Mini복사/취소/저장실패/재시도중복방지 통과, 추가175문자열캐시는갱신·한도·JSON특수값/마커충돌검사 및 실제저장바이트 확인. 다른영역기존유효근거는 `docs/uct/FINAL_VALIDATION_0.1.15.md` 재사용.
- 정상창닫기→프로세스종료→동일Vault 재시작175 확인. 원래48항목/23폴더 및library전체일치,모듈4개일치,Outliner의미보존,pending0/identityErrors0/임시변수0,패널접힘/탭/포탈경로보존. `io-final/runtime/final-restart-proof.json`. 이전app.quit경로0바이트workspace는백업복구했고,최종정상창닫기는workspace16819바이트유지. 이를UCT원인으로확정하지않음.
- `UCT-IO-Final-20261030` 검수자료/모듈참조/전용사본 정리완료. 후속175전체드롭 검수용 `UCT-IO-End-20261030`도live정리후48/23/library/layout일치. 마지막최근기록·전용Safety정리/재시작 증거는 `io-final/end-to-end/`에 기록. 현재유저원본내용변경없음. CDP중심/ComputerUse없음.
- **목표 active:** 내부 계산 개선을 전체Mini 체감해결로 바꾸어 보고하지말것. 남은 실제지연은 저장·readback대기/다른플러그인레이아웃과분리해야함. 보관안전성저하/자료먼저제거로수치만줄이지말것. 자세한추가기록 `docs/uct/PERFORMANCE_175_ADDENDUM.md`.

## 2026-10-30 — 최신164검사 적용·정상 재시작·전용자료 정리 / 전체 무병목 판정 아님

- 로컬0.1.15 main.js SHA256 ee27521adc31bebec6fafcd3917606b0a31d54abb28bf925ffcb4f73d2944402. Portal/Mindmap의 아래162개 변경과 Outliner 기록복사·동일snapshot 재사용을 모두 Secondbrain에 설치.164개 검사/tsc/build/diff 통과. 공개배포 없음.
- 실제 안전쓰기 ABBAAB216→62.3ms; 실제Blender502카드 정렬5.5→3.1ms; 실제작업공간 Outliner 기록복사14.9→0.1ms/동일갱신32.7→21.8ms. 모두 내부 구간의 비교이며 전체앱·전체Mini 개선율 아님. whole-resume의 원시결과 보존.
- 키보드 생성/정렬/Undo, 가상/중첩/링크6경로, 실제Outliner change/Undo/Redo, 최종수정후포탈진입복귀 확인. 같은최종빌드 정상앱재시작 후 library48/23 및 layout 완전일치,모듈4설정일치,Outliner 의미보존,pending0/identityErrors0/임시변수0. 설치3파일일치.
- UCT-Perf-Resume-20261030의3Canvas/새탭/모듈참조/최근기록/전용Safety사본 선택정리 완료. 원래Blender 탭으로복귀. 아래 '전용자료 남음/162미설치'는 과거상태.
- **전체목표 완료 처리 금지:** Mini 가시CDP 행제거 중앙값347ms/안전I/O편차,Outliner 전체직렬화62–72ms 남음. 직렬화캐시 후보는 제품미적용. '실사용 병목 없음' 조건 달성은 입증되지 않음. 사용자입력 대기아님. 추가개선에는 남은 실제critical path를 다시 좁혀야 하며, 이미끝난 전체검수준비/재시작을 수정없이 반복하지말것.
- background 앱의 예약콜백대기는 임시throttling 해제로준비완료후true복원. 숨김대기를제품지연/코드개선으로계산하지않음. Computer Use 없음/CDP중심 유지. 최종상세 docs/uct/FINAL_VALIDATION_0.1.15.md 맨위 최신절.

## 2026-10-30 — 전체 성능 개선 재개: 이전 완료 판정 철회

- 사용자 정정: 동작 검수만으로 전체 최적화 완료가 아님. 전체 9개 영역의 성능 개선 목표를 다시 진행 중이며, 포탈·마인드맵부터 비용 측정/코드 개선/실제 재측정을 수행한다. 공개 배포 금지·CDP 중심·사용자 자료 원복 유지.
- 현재 Secondbrain 설치는 아래155검사 빌드. 추가 소스 변경은 아직 미설치: Portal SafetyStore의 중복 JSON 파싱 제거/같은 내용의 파일 교체 생략(복구사본·동시변경 검증 유지), Mindmap 정렬의 깊은복사1회화·생성 연결검증 인덱스·한 방향 탐색의 전체정렬 제거. `.validation/secondbrain-performance-20261029/whole-resume/`에 현재 기준과 ledger 보존.
- **전용 검수 자료가 현재 남아 있음:** Vault `UCT-Perf-Resume-20261030/`의 workspace.canvas/linked.canvas/same-write.canvas, 새 검수 탭 및 `window.__uctWhole`. 원래 Mini48/23 불변. ledger/before.json을 기준으로 이후 선택 정리. 이전155/FINAL_VALIDATION의 완료 문구는 이 재개 상태보다 우선하지 않음.
- 실제 Portal baseline: 실제workspace복사34노드/26포탈, 내부81노드에서 warmup 뒤3진입/복귀 측정. 첫쌍 저장2.5–3.2초, 이후진입26–28ms/복귀67–101ms로 초기상태와 분리. capture총합0.3–1.5ms, 주지연은save대기/다른플러그인의layout. 별도현재adapter동일내용1.37MB쓰기460.9/241.6/237.1ms 및mtime변경 확인. Mindmap 실제3파일 깊이3 정렬4.3–11.2ms 등baseline 보존.

## 2026-10-30 — 최신155검사·백업 응답성 개선·최종 재시작

- 현재 Secondbrain 로컬0.1.15 main.js SHA256 `bf91d825acef26a4c80c36591580fc1321ddc9fc0d05733ee4199ecfa717b50d`.155검사/실패0·tsc·빌드·diff통과. 새 빌드 정상 전체앱 재시작,설치3파일일치,元48항목/23폴더·설정·작업화면layout완전일치,pending0/identityErrors0/임시변수0. 공개배포/push/BRAT 없음. 아래150/d07 및 이전 상태는 역사기록。
- 마지막 확인한 병목: async ZIP API도 CRC·작은파일 inflate는 화면스레드에서 실행. `src/backup-codec.ts`에서 네이티브CRC/4개한도 비동기deflate와 표준ZIP32 중앙목록 기반 네이티브inflate 적용. 이름/목록은fflate로검증,CRC·크기 재검증,ZIP64/기타/구형Node는기존경로유지. ZIP형식version1·압축level6·원본바이트 유지。느려진 전체Worker·스트리밍파서 후보는 제거하고 제품에 남기지 않음。
- 실제 동일자료ABBAAB: 압축구간 중앙값427.9→185.1ms; 전체save 933.9→716.1ms(구형비교객체Notice생략·I/O편차 명시). 네이티브행에서긴작업0. decode중앙값114.8→119.8ms로전체시간개선미입증·범위겹침이나 기존102–184ms긴작업이네이티브회차에서0. 최종실제복구3531.6ms/긴작업0,48새항목/25복구폴더 생성·원본보존후전용트리정리. Python zipfile 독립검증35entry/34assetCRC·SHA256통과。`.validation/secondbrain-performance-20261029/backup-cost/`。
- 최종restart-proof는Mini를설치전원래값과비교해완전일치. Outliner는원래빈필드와Portal소스의0/부재동등한履歴marker cpLifecycle만비교용정규화(실제자료삭제아님)。`layout-after-restart.json` differences[]。最終실제화면은`backup-cost/final-secondbrain.png`。
- 범위별결과·재사용근거·성능한계·사용자확인표: `docs/uct/FINAL_VALIDATION_0.1.15.md`。전체앱몇배개선·모든환경무병목을주장하지않으며Mini현재CDP드래그347ms를즉시반응으로판정하지않음。창가림은사용자의다른앱사용가능성,CDP원인미확정。

## 2026-10-30 — 최신150검사 빌드·CDP 검수·정상 재시작 및 원복

- 최신 소스/Secondbrain 로컬0.1.15 main.js SHA256 `d07c7060f830f981d3d107ed69f761d9645bc66ce1f0894b8b3de8d860b02e14`. 150검사/실패0·tsc·빌드 통과. 설치3파일 일치, 정상 앱 재시작 후 확인. 공개배포/push/BRAT 없음. 아래137 및 이전 상태는 역사기록.
- 사용자 최신 작업 이후 기준 **48항목/23폴더/Collect4** 보존. 과거49/51/52항목을 임의복원하지 않음. 전용자료·복구자료·계측 해제, pending0/identityErrors0/testFilesAbsenttrue/temporaryGlobals[]. 정상 재시작 후 원래Mini 및 모듈 설정 대조. 검수 종료 과정에서 빈 workspace.json을 발견하여 확보한 원래 작업화면 백업으로 복구했으며 원인은 확정하지 않음. `cdp-final/final-restart-proof.json`, `offline-cleanup-result.json`, `final-secondbrain.png`.
- 추가 수정: Mindmap 비활성 툴바의 반복 DOM 조사 생략, Mini 이동 후 남은 썸네일 재사용, Palette 동일 설정 저장 생략·명시적 flush의 예약저장 취소 복원, 축소Markdown에서 보이지 않는 PDF/영상/오디오 임베드 지연·해제, Outliner 변경 없는 파일의 신원확인 재읽기 생략. YouTube 묶음 썸네일/상세/큰미리보기12이미지 표시 확인. 관련150검사와 실제 경로 증거는 `cdp-final/`.
- 현재 가시상태 CDP HTML 드래그 일반이동3회: 놓기처리→행제거344.2/347/372.6ms, 두프레임352.4/369.6/377.7ms, 전체저장·정리632.3–1054ms. Shift복사/취소/75노드묶음 확인. 물리적Windows 마우스·하드웨어 검증이라고 부르지 않으며, 다른조건의790/473ms와 직결한 개선율을 주장하지 않음. 347ms를 충분히 빠르다고 확정하지 않음.
- **창 숨김의 원인 미확정:** 사용자가 다른 앱을 사용해서 뒤로 갔을 가능성이 있음. CDP 때문에 숨겨졌다고 단정하지 않음. 숨김/가림 상태에서 약1초 프레임 간격이 관찰된 회차는 성능 비교에서 제외. 가시상태 수치와 분리.
- 세실제Canvas9회 전환·가상/중첩/링크포탈6전환 및 Outliner 공간 일치, Mindmap 생성/연결/색상 저장, 편집기/컴포지션/미디어/PDF 교차 사용, Mini100/500 추가자료·10회열기닫기,23MB ZIP별도복구·비덮어쓰기 확인. 자세한 범위·재사용/제한은 `docs/uct/FINAL_VALIDATION_0.1.15.md`. 전체환경 무병목 또는 모든 조합 통과로 확대하지 않음.

## 2026-10-30 — 최신137 빌드 남은 배치22경로·선택 정리·재시작 확인

- docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위 최신절 우선. main.js c6c664b55a262aaae8a6b4e67e96c607ab77c1c18406815abaf45d0c5876393b 유지. 코드 추가 수정 없음. 앞선137검사/tsc/build 재사용, diff 통과.
- Secondbrain 전용 자료9형식 copy/move18+일반6종 multi copy/move2+포탈 내부 카드/이미지/묶음/링크포탈 mixed copy/move2=22제품 경로 통과. geometry/연결/저장/소스 유지·제거/pending0. 포탈 진입·복귀는 실제 Windows Ctrl+Enter. API 배치와 물리적 drag증거 구분. matrix-final/format-results.json,portal-results.json.
- 전용9Mini/8파일/독립2사본/새탭과 경로참조를 선택 정리하고 정상 앱 재시작. 원래49항목/23폴더·설정 유지,3빌드파일해시일치,전용10파일부재·pending0·임시hook0. before/expected/cleanup-before와cleanup-result/after-restart-proof 보존. 실제Blender/Outliner/Mini5Collect확인 final-mini-native.png. helper핸들갱신·node세션초기화후확인,앱문제로단정하지않음.
- 앞선동일조건배치row제거532.3→290.4ms근거유효. 이번형식정확성시험전체drop시간과섞지말것. 전체무병목/모든조합통과주장금지. 사용자는이미드래그된다고했으므로직접입력요구로다시차단금지. 공개배포/push/BRAT금지.

## 2026-10-30 — 최신137검사 사전 준비+썸네일 측정 재사용·재시작/원복 완료

- 최신 source/Secondbrain main.js SHA256 c6c664b55a262aaae8a6b4e67e96c607ab77c1c18406815abaf45d0c5876393b, 로컬0.1.15.137검사/tsc/build/diff통과,같은최종빌드앱정상재시작및설치3파일해시일치. 아래136후보/재시작대기/fixture존재는과거기록.
- 사전준비만으로는효과불분명해추가profile. RO updateScale가computedStyle을계속읽는것확인. PreviewService의border없는소유viewport에borderWidth0/writingMode horizontal-tb명시,ResizeObserver.borderBoxSize재사용;구형entry는기존padding fallback. 원래실제6preview모두border/padding0이며수정전후크기/내부stage transform·위치완전일치(fit-before/after.json). 새1검사로computedStyle0호출/패딩포함기존핏일치보장. 퀄리티/저장안전성낮추지않음.
- 최종같은빌드prep off/on ABBAAB각3회(동일hover250ms) 놓기→행제거 old481.8/532.3/643.8 vs new238/290.4/385ms,중앙값532.3→290.4. drop반환817.6→687.7ms. **실제Secondbrain 제품API+DOM·파일측정**;물리적Windowsdrag입력부터의측정아님,250ms는동일시험조건이지사용자에게멈춰기다리라는조작추가아님. warm-preparation/fit-comparison.json. 이전473ms와는다른비교조건이므로473→290의직접전후로보고금지. 이전후보부진결과도보존. 프로그램전체개선율로확대금지.
- 실제제품경로Shift뒤늦게누르기→warm move기록삭제뒤copy/원본유지,일반묶음dx300/dy60/폭180·200/edge1보존,hover중자체자료수정시0배치·수정유지. behavior-proof.json. 실제Windows Esc로warm record1→0/Canvas0/Mini유지 확인(native-esc-proof.json). temporaryhooks/profiler해제.
- 검수전용1Mini/1Canvas/새탭1개·경로참조제거후최신재시작,원래49항목/23폴더·컴포지션·모듈4개불변. Outliner는初期snapshot의빈uctLabel/uctCaption/빈uctMetadata추가·배열순서/파생캐시와차이:정렬후빈필드만정규화하여geometry/비어있지않은내용·등록·collection·설정·메타일치통과. 원본설정을억지덮지않음. expected/outliner.json은선택정리후재시작전비교기준. after-restart-proof.json의emptyFields3170/emptyMetadata10/rebuiltMeta0은比較正規化횟수(데이터수정아님). 현재live/disk/cache모두522노드. 사용자이전51/52기준복원금지. final-mini-native.png.
- 전체목표active유지. user가실제드래그된다고했으므로네이티브입력한계를차단요건으로삼지않음. 공개배포/push/BRAT금지. 다음은137빌드의다른형식/복수/포탈등연결회귀와전체기획남은조합의범위별최종판정. 추가속도개선은위scoped측정만확인,모든환경렉해결주장금지.

## 2026-10-30 — 작업 중136검사 사전 준비 후보(최종 판정 전)

- **현재 작업 소스와 설치본은136검사 후보**이며 아래125최종해시는이전안정기준. src/placement-preparation.ts 신규 및 placement.ts 연계. 일반 묶음/카드/파일을Canvas로끌때같은저장형식의journal을미리준비,release에서같은record재사용. 가상/링크포탈은기존경로. Shift복사로전환하면warm move기록이전부지워진뒤복사commit(잘못된재시작원본삭제방지). Esc/대상변경/재시작/준비실패/정리실패/종료/연속gesture대기순서보호. preparedItems를이미지외선택에도적용해드래그중자료수정취소. 관련42개/전체136개·tsc/build통과. 새빌드Secondbrain설치,최신전체앱재시작은아직안함. 후보효과없으면기능추가를최종유지하지말고되돌릴것.
- **추가 전용자료 아직 있음:** UCT-Warm-Check-20261030/target.canvas, Mini1항목 '배치 사전 준비 검수',새탭1개. baseline49+own1=50,23폴더. .validation/secondbrain-performance-20261029/warm-preparation/ledger.json,before/가정리기준. __uctMoveTiming이이fixture, __uctMoveAfter=true. 원본49보존. 기존125원복스크립트동일패턴으로추후전용정리/재시작필요.
- warm-probe.js 동일실행본off/on ABBAAB,같은hover250ms후release→행제거측정. 첫comparison.json은앱가려짐/프레임대기약131초가첫회에섞여대표성없음; 살아있는CLIhandle59261을poll하고native로앱활성화해정상완료,임의재시작안함. 이어foreground-comparison.json: old529.5/646.9/284.9ms,new547.7/521/192.9ms. **중앙값529.5→521로전체개선확정불가.** new3회journal은release전에준비됨. post-commit/readback/UI비용편차남음. warm code를성과로보고금지,추가분리/재측정후유지여부결정필요. both product/API증거이며물리적드래그증거아님. 사용자드래그는이미된다고한것을다시차단요건으로삼지말것.
- 계측runner의메서드래퍼/비교off토글은finally복원, trial플래그제거,마지막target0/source검수항목복귀/pending0 확인흐름. 세션27413/59261둘다exit0. 현재목표active·공개배포금지. native window는현재id11012884였으나매번inventory로확인(앱가려지면get_state가다른앱프레임을줄수있어먼저activate). 다음은후보측정결론/필요수정→실제UI→최신재시작/선택정리/보고.

## 2026-10-30 — 지연 개선 재개·저장 위치 비용 분리

- 사용자 정정: 드래그는 실제로 되며 문제는 렉/반응시간. **일반/Shift 드래그 성공을 다시 확인받는 일을 전체 목표의 차단 조건으로 삼지 말것.** 목표는473ms보다 배치 반응시간을 더 줄이는 것. 모델 변경 후 재개 승인. 현재 소스/설치125검사 빌드 유지, 추가 제품 수정은 아직 없음.
- 같은 queueJsonWrite/4263바이트/안전검사/준비1회/ABBAAB각3회 측정: 별도Node Vault55.4/56.1/336.4ms vs 로컬2.87/2.97/3.72ms. 실제Obsidian 프로세스에서도 Vault43.9/67/83ms vs 로컬3.4/7.2/8.6ms. 원자쓰기+읽기검증+rename 동일. io-location/isolated.json,app.json. 이는 경로별파일작업 비교이며 실제배치시간/개선율로확대금지. 두경로 전용probe폴더 모두제거,사용자49항목보존,임시런타임래퍼없음.
- 다음 초점은 배치전journal저장(기존한회308ms)의 critical path를 줄이는 것. 로컬기록 후보는 파일작업비용 근거가 있지만 기존복구/이동/재시작/구형기록호환/다른기기이동 안전성을 보존해야하며 아직채택안함. 다른 후보로 drag중 사전준비가 있으나 취소/세대/동시변경/정상dragend/종료/중복기록 안전성을 먼저설계해야함. 저장검증 생략이나 낙관적 Mini원본제거로 수치만줄이지말것. 공개배포금지 유지.

## 2026-10-30 — 최신125검사 저장 대기 중 취소 보완·재시작

- 최신 기준 docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위125절. 로컬0.1.15 main.js SHA2564d4430f7739df26c96d1a5ebfb22e5ac0f1512907290b80d9a539dfed0e5480e.125검사/tsc/build통과·설치3파일일치·최종전체앱재시작확인. 아래122/115해시는역사기록.
- Outliner저장을배치뒤로미루는후보 ABBAAB3회:행제거361.6→360.5ms로개선미입증,전체반환798.5→1726.5ms로악화해제품적용안함. snapshot-save/candidate.json. 메타데이터캡처복제도현재Blender519노드/포탈0,clone0회라주병목아님. 추가속도개선주장금지.
- src/placement.ts: journal저장대기중Esc/종료취소후에도commit되던버그를실패테스트2개로재현·수정. await뒤generation확인,정상native dragend는busy작업을취소하지않게구분. 신규3회귀검사.
- Secondbrain전용제품drop대기+실제Windows Esc→노드0/Mini보존/pending0; 제품drop+합성dragend→1회배치/Mini제거/pending0. 합성event를실제마우스성공으로보고금지. snapshot-save/native-esc-proof.json,dragend-proof.json.
- 새전용1Mini/1Canvas/새탭·참조정리및재시작완료. 기존49항목/23폴더·모듈5개·컴포지션불변,임시변수/기록0. snapshot-save/after-restart-proof.json,cleanup-result.json,final-mini-native.png. 최신사용자자료49기준보존(51/52복원금지). 공개배포/push/BRAT금지. 전체완료아님; 실제Windows 일반/Shift성공·끝까지지연미검증,473ms충분히빠르다고판정금지.

## 2026-10-30 — 최신122검사 Mini 제거 지연 수정·Secondbrain 재시작

- 이후 읽기전용 확인에서 현재 Mini49항목. 앞선51기준에서 blender pie menu(Markdown)와 요약 카드가 없어졌고 pending0. 사용자 작업/현재 변경일 수 있으므로 임의복원 금지. 이번 추가조사는 전용 IO probe 경로만 사용했고 사용자 Mini 항목을 제거하지 않았음. json-cleanup/probe.json: 성공rename후rm2–9ms로 주원인아님; 원자저장 필수write/read/rename의대기변동이더큼. 제품소스추가수정없음,fs래퍼/전용폴더/queue정리확인. 473ms를 완료/충분히빠름으로판정금지. 실제Windows드래그완료/끝까지체감미검증유지.
- 최신 기준은 docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위122검사절. 로컬0.1.15 main.js SHA256 a6d3fb0d6283f4544ecf1996953a1037d4843d86f887283ba4102b76e01b2a52.122검사/tsc/build 통과, 설치3파일 일치 및 최종 빌드 정상 전체앱 재시작 확인.
- 사용자 일반드래그→Mini에서 늦게 사라짐 보고에 대응. 목적 Canvas 디스크 검증 후 메모리 제거를 바로 행/개수/선택/상세에 반영하고 Mini 저장 실패 시 복구. 기록정리 완료까지 전체 렌더를 기다리는 지연 제거. 저장 안전성/중복 방지/형식 불변. placement-journal/placement/mini와 관련7검사 추가.
- 동일 Secondbrain 실행본 알림OFF/ON ABBAAB 각3회 제품함수·실제파일·DOM 비교: 놓기→행제거 중앙값790.3→473.4ms,Canvas저장확인→행제거556.6→56.5ms. 전체drop 반환791.6→753.9ms이나 범위겹침. 실제마우스/전체렉 해결로 확대금지. move-removal/paired-summary.json. 실제 Mini저장 실패주입에서 행/자료복구·재시도1노드/pending0 확인. failure-proof.json.
- 최신 네이티브 drag는 dragstart/dragenter/dragend만 전달(drop없음); activefalse/항목유지/노드0/pending0. 도구입력 한계이고 제품결함/성공 판정아님. 실제Windows 일반/Shift성공·끝까지 체감은 미검증. 사용자에게 이미정리한 옛3자료 시험 다시요구금지.
- 재시작/선택정리 완료. 이번 사용자 작업 이후 기준은 원래51항목/23폴더/Collect7. **옛52기준으로 덮지 말것.** 전용1Mini/1Canvas/새탭1개·경로참조 제거, 사용자 원래내용/폴더·모듈5개·컴포지션 불변. move-removal/cleanup-result.json,after-restart-proof.json,final-mini-native.png. 최종 실제Blender/Outliner/Mini7썸네일 확인,창1208×1032유지,임시변수/디버깅포트없음. 공개배포/push/BRAT금지. 전체완료아님.

## 2026-10-30 — 최신115검사 저장 최적화·Secondbrain 적용

- 최우선은 docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위115검사절. main.js SHA2566c7f70672ad40714c4995d98dc9fed7780042ec2716b25871a44ff35733dd63e, 로컬0.1.15,115검사/tsc/build통과 및 설치·정상실행 확인. 아래107/옛해시 문구는 역사기록.
- Outliner21.8MB 설정의 읽기3회 UTF8문자열 변환을 Buffer동등성검증으로 변경. 원자저장·temp검증·교체전외부변경확인·복구 불변. 격리실제자료 AB/BA/AB 저장중앙값376.7→165.8ms,CPU344→156ms. 신규8안전성검사. 전체Canvas속도 개선율로 확대금지.
- Obsidian.com CLI eval/dev:cdp는 현재실행본 내부계측에 사용가능. 실제 Windows 화면증거와 분리. 추가0/100/500카드 제품API 배치9회, 후보적용9회 결과는 perf-scaling/ 아래. 배치전체시간은 후보에서 개선안됨; 저장분리측정 효과와 구분.
- 검수용Canvas 정리 중 renderer프로세스소멸/백화면 발생(원인불명,115최종설치전). CLIcleanup/query세션52427/85547은 main종료후exit0/무출력으로 끝났고 정리성공으로 간주하지않음. 파일백업/정상닫기실패/renderer없음확인 후main26512종료. offline선택정리로 원래52항목/23폴더불변,전용1Canvas/1Mini와참조제거. 이후새빌드설치·정상실행·실행중Buffer검증 적용 및 동일저장mtime/bytes불변 확인. perf-scaling/installed-proof.json,cleanup-result.json. renderer현재존재/정상UI. 성능 검수를 다시 전체처음부터 하지말고현재증거재사용.
- 사용자 지금직접확인불가 답변. 남은실제마우스이동/Shift복사/취소와체감배치확인은 미검증. 이전3이미지검수자료는이미정리했으므로 옛질문을재실행시키지말것. 목표active,임의paused금지. 공개배포/push/BRAT금지. 원래사용자자료/별도output/드로잉폴더보존.

## 2026-10-30 — 최신107검사 빌드 재시작·검수 자료 정리 확인

- 최신 기준은 docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위 ‘최우선 상태’. 로컬0.1.15 main.js SHA256 ac488cfb42b833d681dce8be1e870712746fda295121d65105cda1210bc70b75, 설치3파일 일치.107검사/tsc/build통과 이후 제품소스변경 없음.
- 최신 빌드 정상 앱 재시작 후55항목/23폴더·모듈5개·컴포지션·전용Canvas2개 불변 및 pending0 확인. 이후 geometry 전용3Mini/5파일/모듈경로와 최근기록14개 정리, 기존webviewer leaf1개만 원래상태복구. 모든 정리전자료는 geometry-followup/cleanup-before에 보존. 최종52원래항목/23폴더·설정 불변, 검수경로없음. geometry-followup/latest-restart-proof.json,cleanup-result.json,final-cleanup-proof.json.
- 임시CDP 없이 정상재실행, 모든 Obsidian DebugEnabled=false 확인. Computer Use로 최대화복원, 기존Blender탭→Outliner 목록, 명령창→Mini 열기 및 원래8Collect썸네일 확인. 캡처geometry-followup/final-mini-originals.png. 개선빌드유지·공개배포/push/BRAT금지.
- 전체 완료 아님: 최신 실제Windows 일반/Shift 드래그 성공 및 체감 배치지연은 아직미검증. 제품API시험/자동검사는 통과했지만 대체증거로 확대하지말것. 도구2인터페이스의 Shift유지드래그미지원과 HTMLdrop미전달은 기록됨. 사용자가 직접확인하도록 요청했던geometry3자료는 정리했으므로 그옛질문으로 재입력요구하지말것. 현재목표active, 임의paused금지. 재시작/정리가 남았다고 다시보고하지말것.

## 2026-10-30 — 추가 보완107검사·Secondbrain 적용 / 앞선 직접 드래그 확인 요청

- 현재 최우선은 docs/uct/LOCAL_AUDIT_0.1.15.md의 ‘이미지 크기·Mini 재생성 보완’ 절입니다. 아래89개/전용자료 모두정리/최신재시작 완료는 앞선 빌드 시점입니다.
- src/placement-image-size.ts 및 placement.ts: 제스처별 이미지 자연치수 준비와 공유fit으로 3비율의 오버레이/실제 노드 치수 일치. 이미지 대기 중 선택 자료 수정·원본변경·Esc·대상변경 안전성 추가. 일반 묶음 내부 크기를 단일 이미지 기본 크기로 덮지 않음.
- src/main.ts/mini.ts/placement.ts: library불변 저장 후 전체Mini render 생략, 실제 변경은 배치 중 보류해 완료/취소 때1회 갱신. 55항목 이미지복사3회 render2/2/1→0/0/0, 전체drop시간 개선은 입증 안됨. 실제 이동 행 제거와 네이티브Esc 보류갱신 해제 확인. 최신107개검사/tsc/build통과, Secondbrain설치. 최신 변경 후 전체앱재시작·추가자료원복은 남음.
- 추가 fixture UCT-Geometry-Check-20261030/ 파일5개와 Mini3항목, 현재55항목(원래52보존). ledger/before 설정/workspace-before.json과 증거는 .validation/secondbrain-performance-20261029/geometry-followup/. 준비 중 기존 webviewer leaf가 target Canvas로 교체되어 정리 때 그 leaf만 기준에서 복구 필요. 전체workspace덮지 말것.
- 사용자에게 현재 UI의 wide 일반드래그/portrait Shift드래그/landscape Esc 취소 직접확인 요청. 도구두인터페이스 모두 Shift 유지 입력 미지원, 네이티브일반drag도drop미전달/Esc취소. 답변 도착 전 앱입력 충돌 피하고 코드/문서 작업만 진행. 목표active; 임의paused설정 안함. 공개배포금지.

## 2026-10-30 — 로컬 0.1.15 재시작·검수 자료 원복 / 앞선 검수 기록

- 최우선 최신 기록은 **docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위 ‘재시작·검수 자료 원복 확인’ 절**. 아래 과거 미설치/재시작 대기/자료정리 미완료 문구는 최신 절로 대체합니다.
- 최신89개 검사/tsc/build 통과. 라벨 색상 선택→Enter의 키 capture 오류, 배경 Canvas 메타데이터 소유 view, 다중 이미지 내보내기 remote 경로 보관 추가 수정. Secondbrain 설치3파일 해시 일치.
- 정상 앱 재시작 후128항목/50폴더·복구 파일·컴포지션 사용자 설정 유지 확인. 실제 Mini/작은 편집기/컴포지션 전환 확인. 이후 검수용76항목/27폴더/독립9파일/fixture폴더와 관련 기록만 제거하고 재실행. 사용자 원래52항목/23폴더 내용 및 모듈·컴포지션 설정 검수 전과 동일. 임시CDP 없음, 창 최대화 복원.
- 전체 통과 아님: 최신 빌드 Windows 실제 Shift 드래그 성공은 Computer Use 도구 입력 한계로 미검증. 이미지 배치 오버레이/실제 카드 높이4px 차이도 미해결. 내부 제품 경로 시험과 구분. 사용자가 재개한 목표는 active이며 과거 중지 요청을 다시 적용하지 않습니다.
- 공개 배포/push/BRAT·원본 저장소 삭제 금지. 사용자 output/ 및 secondbrain-drawing-validation-1793258459295/ 보존. 검수 fixture는 정리했으므로 후속 시험이 필요하면 전용 자료를 다시 준비하되 기존 전체 조사를 반복하지 않습니다.

## 2026-10-29 — 로컬 0.1.15 전체 검수 앞선 기록 / 공개 배포 금지

- 현재 전체 목표·수정·측정·미검증 범위의 최신 기록: **docs/uct/LOCAL_AUDIT_0.1.15.md 맨 위 최신 상태 절**. 아래 과거 기록의 미해결/승인 대기 문구는 그 절로 대체합니다.
- 10월30일 추가 설치 수정: Shift 포인터 드래그 취소 후 Mini 갱신 정지/선택 불가, 열린 Canvas별 메타데이터 소유 view 전달, session 반복 조회 제거, 묶음 썸네일 ResizeObserver 치수 재사용, 발표 wrapper 크기 감시. 최신81개 검사/tsc/build 통과. 작은편집기/컴포지션10회 및 미디어/PDF각10회 제품API 해제 확인, 실제 발표/Remote/PDF Computer Use 추가 확인. 상세 수치·범위는 위 보고서. 전체 감사/최종 재시작/자료선택원복은 아직 미완료입니다.
- 2026-10-30 사용자가 전체 목표를 재개했습니다. **Secondbrain 실제 화면 검수 진행 중**입니다. 이전 대기·일시정지 기록을 다시 적용하지 않습니다. Computer Use는 Windows 실제 입력/화면, CDP는 준비·내부 계측 증거로 구분합니다.
- 배치 실패 복구 기록은 사용자의 내부 구현 위임 후 추가했습니다. 원본 Mini/Canvas 형식 유지. 중복 배치 방지의 실제 전용 fixture 오류 주입·플러그인 재로딩 확인. 전체 앱 재시작과 전체 사용자 흐름은 미완료.
- 현재 로컬 자동검사72개/tsc/build 통과. 실제 ZIP·모형 Vault 복구 시험도 포함하며 실제 저장 창/Secondbrain 검증과는 구분합니다. 후속 CSS·수집 보호 수정은 실제 앱 종료/재실행으로 설치했고, 이후 확인한 수집 이중 렌더 제거까지 같은 로컬0.1.15에서 빌드/검사/재설치했습니다. 최종 변경 후 전체 앱 재시작 검증은 남아 있습니다.
- 검수 fixture와 임시 CDP 정리, 사용자 변경을 보존하는 선택 원복, 최종 연결4흐름·재시작·결과표까지 마쳐야 전체 완료입니다. 사용자 output/·secondbrain-drawing-validation-1793258459295/ 보존. 공개 배포·push·BRAT 및 원본 저장소 삭제 금지.

## 2026-10-29 — 0.1.14 성능 개선·공개 배포 완료

- Release: https://github.com/tlatndms2-droid/ultimate-canvas-toolkit/releases/tag/0.1.14
- 코드 커밋38a1ada. 저장 전 Mini 그래프 복제 제외, Canvas 캡션 감시 필터, 발표 snapshot 식별, Storage DOM 유지/형식 집계, 컴포지션 갱신 병합.
- 24테스트/타입 검사/빌드 통과. CDP 기반 실제 Sandbox 화면·조작·같은 Sandbox 재시작 확인. 활성0.1.14.
- 공개3파일 일치, BRAT 재설치 성공, 설치 파일 일치, library.json 바이트 보존.
- 측정 조건·수치·미검증 영역: docs/uct/PERFORMANCE_0.1.14.md. 전체 플러그인 개선율이나 종합 감사 완료로 해석하지 말 것.
- 실제 Secondbrain Vault와 원본7개 저장소 변경 없음. Sandbox열림: work/UCT-Integration-Sandbox, profile work/UCT-Integration-Profile, CDP19768 (재사용 시 재확인).
- 증거: .validation/performance-0.1.14/. 사용자 기존 output/ 미추적 자료 보존.

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

## 2026-11-03 — Remote 필터와 트리 유지 수정 / Secondbrain 확인
- 형식 필터가 활성화되면 검색용 평면 목록으로 넘어가던 분기를 검색어 입력에만 적용. 형식/라벨 필터는 기존 부모 관계를 유지하고 일치 항목의 조상을 문맥으로 남긴다. Remote 필터는 모달 인스턴스 대신 플러그인 수명 동안 유지되는 소유자로 보존한다(앱 재시작까지 필터 저장하는 변경은 아님).
- 실제 Secondbrain 0.1.17 설치 전 detached DOM 재현: groupChildren=false/toggleEnabled=false. 설치 후 true/true, portalHidden=true. 실제 Remote 체크박스 변경→닫기→재열기 선택 유지 확인, 실제 캡처 `.validation/filter-current.png`에서도 그룹 아래 항목과 펼침 표시 확인. 테스트 선택은 복구.
- 보류 중이던 Mini gesture unlock 후보도 설치. controlled Mini-save delay에서 acceptedNextGesture=true, 첫 항목 제거 및 pending1 유지, 저장 전 whenIdle 미완료, 저장 후 pending0 및 두 번째 항목 유지. 물리 마우스 시험 아님, 첫 행제거 지연의 새 개선 수치 아님.
- 실제 이미지 복제 항목 이동/복사 모두 Canvas 파일에 1개 저장, 이동 sourceKept=false/복사 true, 사용자 원본 유지. 214 자동검사, tsc/build 통과. 기존 카드형 fixture의 저장 시작 대기는 실패했고 이미지 복제 fixture로 검사했다. 테스트 실패를 제품 성공으로 바꾸지 않는다.
- 검수 전용 자료 삭제 후 늦은 Canvas 저장의 ENOENT 알림 관찰. 사용자 파일 대상 아님. 이후 검수 도구는 detach 이후 저장까지 종료한 다음 삭제하도록 보완 필요. 검수 Outliner 기록5키 정리, pending0.
- 정상 창닫기 후 Secondbrain 재실행: Obsidian 1.15.0(이전1.14.5), UCT0.1.17, main.js 로컬/설치 해시일치, library 전체 동일, ready=true/pending0. 기존 다른 Vault 창은 종료하지 않음. 공개배포 없음. 앱 버전이 바뀌어 재시작 전후 속도 개선율 주장 금지.

### 2026-11-03 후속 저장 구간 측정·최종 설치
- 상세 결과: docs/uct/SECONDbrain_FILTER_20261103.md. 첫 항목 제거는 준비 완료 조건 제품API3회 중앙값202.2ms(157.6–555.6), 기존 환경과 개선율 비교 불가. 상세1회 adapter.write86.1ms/readCanvas34.5ms로 저장 경로 비용 확인.
- JSON atomic rename 성공 후 불필요한 temp rm1회 제거. 실패 정리 유지, 215검사/tsc/build 통과. G드라이브100KB ABBAAB 시험은 변동이 커 개선율 미확정.
- 최종 로컬0.1.17 설치 후 정상 재시작, 로컬/설치 hash 일치, Mini library 전체 보존, ready/pending0 확인. 이번 UUID 검수 폴더와 Outliner 기록 정리. 공개배포 없음.

### 2026-11-03 현재 검수 기준
- 최신 상세 근거는 docs/uct/SECONDbrain_FILTER_20261103.md 마지막 절. Outliner 필터2건 및32MB LRU캐시 개선은 실제Secondbrain0.1.17에 설치/재시작 확인. 자동검사220개 통과.
- 실제3Canvas 복제자료 배치검수에서 자료보존은 통과했으나 Blender 저장대기216초 회차가 있음. 후속 동일원본 회차580ms. native Vault I/O 선행대기와 여러 파일읽기/쓰기 지연 확인. 전체성능 목표 미완료이며 외부플러그인/저장위치 임의변경 안함.
- 공개배포 없음. 검수파일/복제항목/Outliner잔류기록 정리, pending0. 원본 파일을 복구백업으로 덮어쓰지 않음.
