# Self-Hosted Runner Migration (Vultr)

## Goal

Move CI test workloads from GitHub-hosted runners to a Vultr self-hosted runner while keeping a safe fallback for fork-based pull requests.

## Implemented

1. Updated `.github/workflows/ci-tests.yml` to hybrid routing.
2. Added `workflow_dispatch` trigger for manual verification runs.
3. Added trusted-path job:
   - `runs-on: [self-hosted, linux, x64, playbid-ci]`
   - runs for `push` and same-repo PRs.
4. Added fork fallback job:
   - `runs-on: ubuntu-latest`
   - runs only for PRs where head repo is a fork.
5. Added minimum job permission:
   - `permissions: contents: read`

## Runner Provisioning Result

- Host alias: `playbid`
- Hostname: `playbid`
- Runner name: `playbid-ci-playbid`
- Labels: `playbid-ci`, `public-safe`
- Install directory: `/opt/actions-runner/playbid-ci`
- Service:
  - `actions.runner.red2red-playbid_vultr.playbid-ci-playbid.service`
  - enabled and active (`running`)

## Security Notes

- Repository visibility is public, so fork PRs should not execute on the self-hosted runner.
- The workflow condition enforces fork PR fallback to GitHub-hosted infrastructure.
- Do not place production application secrets on the runner host unless strictly needed.

## Operations

On VPS (`ssh playbid`):

```bash
sudo systemctl status actions.runner.red2red-playbid_vultr.playbid-ci-playbid.service
sudo systemctl restart actions.runner.red2red-playbid_vultr.playbid-ci-playbid.service
sudo journalctl -u actions.runner.red2red-playbid_vultr.playbid-ci-playbid.service -n 200 --no-pager
```

## Verification Checklist

1. Push workflow changes to `main` (or open PR from same repo branch).
2. Confirm job `test` is scheduled on runner label `playbid-ci`.
3. Open a PR from a fork repository and confirm fallback job uses `ubuntu-latest`.

## Rollback

1. Revert `.github/workflows/ci-tests.yml` to `ubuntu-latest` single-job mode.
2. Stop and disable runner service on VPS.
3. Optionally remove runner from repository settings and delete `/opt/actions-runner/playbid-ci`.
