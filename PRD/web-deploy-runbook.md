# PlayBid Web VPS Deploy Runbook

## 목적
- `playbid_web` 운영 반영 절차를 재현 가능하게 관리한다.
- 장애 시 즉시 복구 가능한 경로와, 장기 표준인 Git 배포 경로를 분리한다.

## 현재 정책 (2026-02-24)
1. **운영 반영 기본값**: `hot-sync` 사용
2. **Coolify Git 배포**: 배포 파이프라인 검증용(원격 Git 소스 동기화 완료 전 운영 반영 금지)

배경:
- `2026-02-24`에 Coolify Git 트리거 자체는 복구됨(큐 진입/finished 확인).
- 하지만 `red2red/playbid_vultr` 현재 `main` 소스가 운영 최신 상태와 달라 `/login`이 404로 배포된 사례가 있었음.
- 따라서 Git repo 소스 동기화 완료 전에는 `hot-sync`가 운영 안전 경로.

## 스크립트
- 운영 반영(hot-sync): `scripts/deploy_playbid_web_vps.sh`
- Git 배포 트리거(Coolify queue): `scripts/trigger_playbid_web_coolify_deploy.sh`

## A. 운영 반영 (권장)
```bash
cd /Users/a1/FlutterWorkspace/PlayBid
./scripts/deploy_playbid_web_vps.sh
```

특징:
- 실행 중인 컨테이너를 `coolify.applicationId=ok80g44cwg08s44c8csckogk` 기준으로 자동 탐색
- `/app` in-place sync 후 `npm ci` + `npm run build` + restart
- 헬스체크 재시도 포함(`/login`)

## B. Git 배포 트리거 (검증용)
사전조건:
- `red2red/playbid_vultr`의 대상 브랜치/커밋이 운영 최신 웹 소스와 일치

```bash
cd /Users/a1/FlutterWorkspace/PlayBid
./scripts/trigger_playbid_web_coolify_deploy.sh --commit HEAD
```

동작:
- `queue_application_deployment(...)` 호출
- 상태 폴링(`queued/in_progress/finished/failed`)
- 실패 시 deployment 로그 출력
- 후속 헬스체크 수행

## 장애 복구 (즉시 롤백)
증상 예시:
- `curl -I https://playbid.kr/login` 응답 `404/5xx`

복구 명령:
```bash
cd /Users/a1/FlutterWorkspace/PlayBid
./scripts/deploy_playbid_web_vps.sh
```

## 배포 후 점검
```bash
curl -I https://playbid.kr/login
curl -I "https://playbid.kr/auth-callback?provider=naver&error=access_denied&returnTo=%2Fdashboard"
```

기대값:
- `/login`: `200`
- `/auth-callback?...`: `307` + `location: https://playbid.kr/login?...`

## 환경 고정값 (Coolify)
- `servers.id=0.user = root` (localhost SSH functional 보장)
- `applications.id=1.limits_memory* = 0`, `limits_cpus = 0` (메모리 제한 파싱 이슈 회피)
