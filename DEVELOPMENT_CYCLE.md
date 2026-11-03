# Full Development Cycle

This guide covers a change from local development through review, CI, and deployment. It reflects the repository's current Express, Harness, GitHub, GitLab, and ArgoCD configuration.

## 1. Set up the project

Requirements: Node.js 22 and npm.

```bash
git clone https://github.com/shemreader/coderabbit-test.git
cd coderabbit-test
npm ci
```

If you work from the GitLab repository instead, use its clone URL and check `git remote -v`. This checkout may have both a GitLab `origin` and a GitHub `github` remote.

## 2. Run the application locally

```bash
npm start
```

The API listens on port 3000 by default. To use a different port:

```bash
PORT=3001 npm start
```

Try the health check and employee endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/employees
curl http://localhost:3000/employees/1
curl -X POST http://localhost:3000/employees \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Kim","department":"Design"}'
```

Employee data is held in memory; changes made through the API are not persisted across server restarts.

For automatic reload during development, use `npm run dev`.

## 3. Create a feature branch

Start from the latest target branch, then create a descriptive branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/short-description
```

If your source of truth is the GitHub remote instead of `origin`, fetch and update from that remote explicitly:

```bash
git fetch github
git switch -c feature/short-description github/main
```

Do not develop directly on `main`.

## 4. Implement and validate the change

Follow the existing Express route and Jest/Supertest test patterns. Add or update tests for expected behavior and invalid inputs.

Run the full local checks before committing:

```bash
npm test
npm run lint
git diff --check
```

Review the change and confirm only intended files are included:

```bash
git status --short
git diff
```

## 5. Commit and push the branch

This checkout may have both hosting remotes configured. Check their URLs and choose the intended destination explicitly:

```bash
git remote -v
git push -u origin feature/short-description   # GitLab in this checkout
git push -u github feature/short-description  # GitHub
```

Here, `origin` points to GitLab and `github` points to GitHub. A plain `git push` uses the branch's configured upstream, so use the remote name when you need to choose the destination. Before pushing to a remote's `main`, fetch and inspect its history; do not overwrite or force-push if the remote has commits you do not have:

```bash
git fetch github
git log --oneline --left-right main...github/main
```

Git credentials are managed per host: GitLab and GitHub may require separate authentication. Do not put access tokens in remote URLs, source files, command history, or commit messages.

```bash
git add <files>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Use the remote that hosts the merge request. Keep credentials out of source files, command history, and commit messages. If GitLab TLS validation fails, configure the correct trusted CA rather than disabling certificate verification.

## 6. Open and complete a merge request

Open a merge request from `feature/short-description` into `main` in the hosting repository. In the description, summarize the behavior change and list the checks you ran. Review the diff, address feedback, push follow-up commits to the same branch, and merge only after the required approvals and checks pass.

## 7. Build and deploy

The intended release flow is:

1. A push to `main` triggers the Harness pipeline.
2. Harness runs its configured CI/security stages and builds and publishes the container image to GHCR.
3. The GitOps update step writes the new image tag to `k8s/values.yaml` and pushes a manifest update to GitHub `main`. Its `[skip ci]` commit message prevents a trigger loop.
4. ArgoCD watches the `k8s/` Helm chart in GitHub `main` and reconciles the `emp-api` deployment in the `shemer` namespace.
5. Check the Harness execution for its result, then check ArgoCD until the application is **Synced** and **Healthy**. The service is named `emp-api`.

Harness performs CI and updates Git; ArgoCD applies the Kubernetes changes. Harness does not deploy directly to the cluster.

### Important: verify the source-of-truth wiring

This repository currently has both GitLab and GitHub remotes. The checked-in Harness trigger uses the `shemer_github` connector and listens for pushes to GitHub `main`; [argocd/application.yaml](./argocd/application.yaml) also points ArgoCD at the GitHub repository. Therefore, merging a GitLab-only merge request does not by itself trigger this deployment flow. Ensure the merged change reaches GitHub `main`, or update the Harness webhook/connector and ArgoCD source to use GitLab before treating GitLab as the deployment source of truth.

Also verify the active Harness pipeline includes the GitOps manifest-update step. The organization-scoped pipeline file references build and security templates, while the root-level [`.harness/test_pipeline.yaml`](./.harness/test_pipeline.yaml) contains an explicit manifest-update stage. Confirm the live pipeline configuration in Harness before relying on automatic tag updates.

## 8. Roll back a release

If a release must be rolled back, revert the GitOps manifest-update commit that changed `k8s/values.yaml` and push the revert to the deployment source branch. ArgoCD will reconcile the previous image tag. Avoid manually changing the cluster, since that would be overwritten by GitOps reconciliation.

## 9. One-time deployment prerequisites

- Harness has working GitHub and container-registry connectors and the required CI infrastructure.
- Any GitHub token required by the manifest-update step is stored as a Harness secret, not committed to the repository.
- The Harness push trigger has a working GitHub webhook.
- ArgoCD is installed and [argocd/application.yaml](./argocd/application.yaml) has been applied.
- The cluster can pull the image from GHCR.
