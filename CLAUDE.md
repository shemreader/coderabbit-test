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

The demo is a push-based GitOps split: **Harness = CI only** (build, push image, bump the manifest in git); **ArgoCD = CD** (watches git, applies to the cluster). Harness never talks to the cluster to deploy.

- `Dockerfile` builds a production image (`npm ci --omit=dev`) running `node src/server.js`, exposing port 3000.
- `k8s/` is a Helm chart (`Chart.yaml`, `values.yaml`, `templates/deployment.yaml`) for the `emp-api` Deployment/Service. `values.yaml` holds `image.repository`/`image.tag` — this is the file CI patches on every release. Service port and container port are both 3000, matching the app's default `PORT`.
- `argocd/application.yaml` is the ArgoCD `Application` CR (source: this repo's `k8s/` Helm chart; destination: the `shemer` namespace; `syncPolicy.automated` with prune+selfHeal). Applied once to the cluster's `argocd` namespace — not consumed by Harness.
- `.harness/` contains the Harness CI pipeline (Harness Git Experience — these are live entities synced from this repo):
  - `pipelines/test_pipeline/triggers/push_main.yaml` fires the pipeline on every push to `main`, filtering out the pipeline's own manifest-update commits via a `[skip ci]` payload condition (otherwise it would trigger itself in a loop).
  - The `build` stage is no longer inline — it references the org-level Harness Template `org.Golden_CI_Build_Template` (v1), an actual reusable Harness Stage Template (`Stage`/`CI` type, created at org `default` scope) implementing the golden-template CI flow, adapted for Node.js (no paid tools — Sonar/Snyk/Checkmarx are intentionally skipped): `Install Dependencies` (`npm ci`) → `Unit Tests` (`npm test`) → `Code Quality` (`npm run lint`, ESLint) → `SAST Scan` (Semgrep, `p/javascript` + `p/owasp-top-ten` rulesets) → `Dependency Scan` (`npm audit --audit-level=high`) → `SBOM Generation` (`cyclonedx-npm`, writes `sbom.json`) → `BuildAndPushDockerRegistry` → `Container Scan` (`trivy image`). Parameterized via template variables (`k8sConnectorRef`, `buildNamespace`, `buildServiceAccountName`, `dockerConnectorRef`, `imageRepository`) supplied as `templateInputs` in `test_pipeline.yaml` — any other project/service can reuse the same template with its own values. Any Run step on this Kubernetes CI infra needs an explicit `connectorRef` to pull its image (even public Docker Hub images); the template and the pipeline both use the account-level `Docker_Hub_Public` connector for that.
  - `SAST Scan`, `Dependency Scan`, and `Container Scan` all report findings without failing the build (matching the pre-existing Trivy `--exit-code 0` pattern) — this is a demo pipeline, not a gated one.
  - A second stage, `update gitops manifest`, runs after the templated `build` stage — it's repo-specific GitOps glue, deliberately kept out of the reusable CI template (Template Design Principle: don't embed deployment logic in the shared template). Its `Update GitOps Manifest` step `sed`s the new tag into `k8s/values.yaml` and `git push`es straight to `main` using a `github_pat` secret and a `[skip ci]` commit message — this commit is what ArgoCD reacts to.
  - `.harness/orgs/default/projects/shemer_test/services/emp_api.yaml`, `pre_prod.yaml` (environment), and `k8s_infra.yaml` (infra definition) are leftover from an earlier native-Kubernetes-deploy version of this pipeline and are no longer referenced by any stage — kept for reference only.
- **Manual, non-git prerequisites**: ArgoCD itself must be installed in the cluster (official manifests into an `argocd` namespace) and `argocd/application.yaml` applied once; Harness needs a `github_pat` secret (GitHub PAT with push access) for the manifest-update step; the `push_main` trigger needs a GitHub webhook registered against Harness (usually auto-registered via the connector, verify under the repo's Settings → Webhooks).
- ArgoCD's reconciliation interval is set to 30s (`argocd-cmd-params-cm` → `timeout.reconciliation`) instead of the 3-minute default, so a demo doesn't need to wait long to see `OutOfSync` appear after a push.
