# PlayBid Web VPS Deploy Runbook

## 목적
- `playbid_web` 운영 반영 절차를 재현 가능하게 관리한다.
- 장애 시 즉시 복구 가능한 경로와, 장기 표준인 Git 배포 경로를 분리한다.

## 현재 정책 (2026-02-24)
1. **운영 반영 기본값**: Coolify Git 배포 트리거 사용
2. **hot-sync**: 비상 복구/긴급 패치용

배경:
- `2026-02-24`에 Coolify Git 트리거 복구 + `red2red/playbid_vultr` `main` 소스 동기화 완료.
- Git 재배포 리허설에서 `deployment finished` + `/login 200` + `/auth-callback(error) 307` 확인.
- 운영 재현성을 위해 기본 경로를 Git 배포로 고정.

## 스크립트
- 운영 반영(hot-sync): `scripts/deploy_playbid_web_vps.sh`
- Git 배포 트리거(Coolify queue): `scripts/trigger_playbid_web_coolify_deploy.sh`

## A. 운영 반영 (권장: Git 배포)
```bash
cd /Users/a1/FlutterWorkspace/PlayBid
./scripts/trigger_playbid_web_coolify_deploy.sh --commit HEAD
```

특징:
- `queue_application_deployment(...)` 기반으로 Coolify 표준 경로 사용
- 상태 폴링(`queued/in_progress/finished/failed`) + 실패 로그 출력
- 배포 후 `/login` 헬스체크 재시도 포함

## B. 비상 복구 (hot-sync)
증상 예시:
- Git 배포 직후 `/login`이 `404/5xx`
- 긴급 소스 패치 즉시 반영 필요

```bash
cd /Users/a1/FlutterWorkspace/PlayBid
./scripts/deploy_playbid_web_vps.sh
```

동작:
- 실행 중 컨테이너 자동 탐색
- `/app` in-place sync + 재빌드 + 재시작
- 배포 완료 후 `/login` 헬스체크

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
