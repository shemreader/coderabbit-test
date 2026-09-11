# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start   # run the server (src/server.js), PORT env var defaults to 3000
npm run dev # run with nodemon for auto-reload
npm test    # run the Jest test suite (tests/*.test.js)
npm run lint # run ESLint (flat config in eslint.config.js)
```

Run a single test file: `npx jest tests/employees.test.js`
Run a single test by name: `npx jest -t "Get employee by id"`

## Architecture

This is a minimal Express (v5) API demo used for Harness CI/CD pipeline testing.

- `src/app.js` builds and exports the Express `app` (no `.listen()` call) — this is what tests import via `supertest` so they can exercise the app without binding a port.
- `src/server.js` is the actual entrypoint: imports `app` and calls `.listen()`.
- `src/routes/employees.js` is a router mounted at `/employees`, reading static data from `src/data/employees.json` (in-memory, no database).
- Tests live in `tests/` and always import `../src/app` directly, not the server.

## Deployment

Harness does everything end-to-end natively — **there is no GitOps/ArgoCD in the loop**. `argocd/application.yaml` still exists in this repo but is no longer wired to anything; it was the old push-based GitOps model (Harness bumps `k8s/values.yaml`, ArgoCD syncs it) and has been superseded by native Harness CD deploying straight to the cluster.

- `Dockerfile` builds a production image (`npm ci --omit=dev`) running `node src/server.js`, exposing port 3000.
- `k8s/` is a Helm chart (`Chart.yaml`, `values.yaml`, `templates/deployment.yaml`) for the `emp-api` Deployment/Service, referenced directly by the Harness `emp_api` service definition (via a `HelmChart` manifest sourced from this repo's `k8s/` folder) — not by ArgoCD anymore.
- `.harness/` (Harness Git Experience — these are live entities synced from this repo) is organized around four reusable, project-scoped Harness Templates plus one pipeline that composes them:
  - **`Golden_CI_Build_Template`** (Stage/CI): `Install Dependencies` (`npm ci`) → `Unit Tests` (`npm test`) → `Code Quality` (`npm run lint`, ESLint) → `Dependency Scan` (`npm audit --audit-level=high`) → `SBOM Generation` (`cyclonedx-npm`) → `BuildAndPushDockerRegistry` (pushes to `ghcr.io/shemreader/coderabbit-test`). Parameterized via template variables (`k8sConnectorRef`, `buildNamespace`, `buildServiceAccountName`, `dockerConnectorRef`, `imageRepository`).
  - **`Golden_Security_Scan_Template`** (Stage/SecurityTests): native Harness STO scanners — `Gitleaks` (secret detection) → `Semgrep` (SAST) → `AquaTrivy` (container scan). No paid tools (Sonar/Snyk/Checkmarx are intentionally skipped throughout).
  - **`Golden_K8s_Deploy_Template`** (Stage/Deployment, Kubernetes): pre-deployment validation (dry run) → `K8sRollingDeploy` → HTTP health check → automatic `K8sRollingRollback` on failure. Reusable across environments by supplying different `serviceRef`/`environmentRef`/`infrastructureDefinitions`/health-check URL as template inputs — nothing environment-specific is hardcoded into the template itself.
  - **`Golden_Approval_Template`** (Stage/Approval): a `HarnessApproval` gate, parameterized by approver user group and message.
  - Any `Run` step on this project's Kubernetes CI infra needs an explicit `connectorRef` to pull its image, even public Docker Hub ones — both templates use the account-level `Docker_Hub_Public` connector for that.
  - **`test_pipeline`** composes all four templates into the full golden flow: `build` → `security scan` → `deploy to dev` (auto) → `deploy to pre-prod` (auto) → `production approval` (human gate, `_project_all_users`) → `deploy to production` (auto). Dev and pre-prod run fully unattended on every trigger; the only manual step in the whole pipeline is the approval before production.
  - Environments/infra used: `dev` (`k8s_dev`, namespace `shemer-dev`), `pre_prod` (`k8s_pre_prod`, namespace `shemer-preprod` — there's also a legacy `k8s_infra` infra def under `pre_prod`, namespace `shemer`, left over from the original ArgoCD-targeted setup and not used by this pipeline), `prod` (`k8s_prod`, namespace `shemer-prod`). Service `emp_api`'s artifact source identifier is `coderabbittest`.
  - `nodejs_cicd_pipeline` was an exploratory pipeline (tagged `ai_generated`) built to learn native Harness CD — it proved out the Gitleaks/Semgrep/AquaTrivy + multi-env rolling-deploy pattern that the golden templates above are based on. It and the original GitOps-based `test_pipeline` are being phased out in favor of the template-based pipeline described here.
- **Manual, non-git prerequisites**: Harness needs delegate/connector access to the Kubernetes cluster (`k8s_cluster` connector) for both CI build infra and CD deploys; the `push_main`-style trigger needs a GitHub webhook registered against Harness (usually auto-registered via the connector, verify under the repo's Settings → Webhooks).
