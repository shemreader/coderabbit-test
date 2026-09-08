# CodeRabbit Test

A small Express application with an employee API.

## Run

```bash
npm start
```

The server listens on port 3000 by default. Set `PORT` to use another port.

## Test

```bash
npm test
```

## Endpoints

- `GET /health`
- `GET /employees`
- `GET /employees/:id`

## CI/CD

```
GitHub  →  Harness CI  →  GHCR  →  k8s/values.yaml (git)  →  ArgoCD  →  shemer namespace
              │  Build          │
              │  Trivy scan     │
              │  Push image     │
              │  Bump image.tag │
```

Harness is CI-only; ArgoCD owns the actual deployment via GitOps. Demo flow:

1. Push a commit to `main` → the `push_main` trigger fires the pipeline automatically.
2. **Build And Push GHCR** builds the image and pushes it to `ghcr.io/shemreader/coderabbit-test`, tagged with the build number and `latest`.
3. **Security Scan** runs Trivy against the freshly pushed image (HIGH/CRITICAL reported in logs; doesn't fail the build).
4. **Update GitOps Manifest** bumps `image.tag` in `k8s/values.yaml` and pushes straight to `main` (commit message includes `[skip ci]` so it doesn't re-trigger the pipeline).
5. ArgoCD (polling every 30s, or instantly if you hit "Refresh" in the UI) sees the new commit, flips `emp-api` to **OutOfSync**, and — because of `syncPolicy.automated` — syncs it straight back to **Synced**, rolling the Deployment to the new image.
6. **Rollback**: `git revert` the manifest-bump commit and push. ArgoCD detects the reverted `image.tag`, goes OutOfSync, and auto-syncs back to the previous image — no cluster access needed, just git.

Harness never talks to the cluster directly; its job ends at the git push in step 4.

### One-time setup

- ArgoCD must be installed in the target cluster (e.g. the official manifests: `kubectl create ns argocd && kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`), and `argocd/application.yaml` applied once.
- Harness needs a secret named `github_pat` (a GitHub PAT with push access to this repo) — referenced as `<+secrets.getValue("github_pat")>` in the pipeline's "Update GitOps Manifest" step. This has to be created in the Harness UI; it can't be committed to git.
- The `push_main` trigger (`.harness/orgs/default/projects/shemer_test/pipelines/test_pipeline/triggers/push_main.yaml`) needs a GitHub webhook pointed at Harness. Harness can usually auto-register this via the `shemer_github` connector; if it doesn't show up under the repo's Settings → Webhooks after the trigger syncs, add it manually (Harness's Trigger UI shows the exact webhook URL).
- ArgoCD's UI/API is only reachable via `kubectl port-forward svc/argocd-server -n argocd 8080:443` in this setup (no public ingress) — that's also why sync relies on 30s polling rather than a GitHub webhook to ArgoCD itself.
