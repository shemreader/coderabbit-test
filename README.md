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

This repo demos a full CI/CD split: **Harness** is CI-only (build, push, update manifest); **ArgoCD** owns the actual deployment via GitOps.

Flow: `push to main` → Harness CI builds & pushes the image to GHCR → Harness commits a bump of `image.tag` in `k8s/values.yaml` directly to `main` → ArgoCD (watching this repo) detects the change and auto-syncs the `k8s/` Helm chart to the `shemer` namespace.

Harness never talks to the cluster to deploy; its job ends at the git push. `argocd/application.yaml` is the ArgoCD `Application` resource that does the watching, applied once to the `argocd` namespace (`kubectl apply -f argocd/application.yaml`) with `syncPolicy.automated` (prune + selfHeal), so no manual `argocd app sync` is needed afterwards.

### One-time setup

- ArgoCD must be installed in the target cluster (e.g. the official manifests: `kubectl create ns argocd && kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`), and `argocd/application.yaml` applied once.
- Harness needs a secret named `github_pat` (a GitHub PAT with push access to this repo) — referenced as `<+secrets.getValue("github_pat")>` in the pipeline's "Update GitOps Manifest" step. This has to be created in the Harness UI; it can't be committed to git.
