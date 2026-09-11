# Harness.io Enterprise CI/CD Golden Template

## Overview

This document defines the recommended enterprise-grade Harness.io CI/CD framework for organizational adoption. The goal is to provide consistency, governance, security, scalability, and operational excellence across all engineering teams.

---

# Organizational Structure

```text
Organization
│
├── Shared Templates
│   ├── CI Build Template
│   ├── Security Scan Template
│   ├── Docker Build Template
│   ├── Artifact Promotion Template
│   ├── Deployment Template
│   └── Rollback Template
│
├── Projects
│   ├── Team-A
│   ├── Team-B
│   └── Team-C
│
└── Platform Services
    ├── Shared Connectors
    ├── Secrets
    ├── Service Accounts
    └── Policies
```

---

# Golden CI Pipeline Template

Every application should use the same standardized CI workflow.

```text
1. Checkout Source
2. Restore Cache
3. Build
4. Unit Tests
5. Code Quality
6. Security Scan
7. SBOM Generation
8. Build Container
9. Container Scan
10. Push Artifact
11. Publish Build Metadata
```

### Example Flow

```text
Build
 ├─ Maven/NPM/DotNet Build
 ├─ Unit Tests
 ├─ SonarQube Scan
 ├─ SAST Scan
 ├─ Generate SBOM
 ├─ Docker Build
 ├─ Trivy Scan
 └─ Push to Registry
```

---

# Golden CD Pipeline Template

Standard promotion path:

```text
DEV → QA → UAT → PROD
```

Stages:

```text
Deploy
Verify
Approval
Promote
```

Example:

```text
DEV
 ├─ Deploy
 └─ Smoke Test

QA
 ├─ Deploy
 ├─ Integration Tests
 └─ Approval

PROD
 ├─ Canary
 ├─ Verification
 ├─ Full Release
 └─ Post Validation
```

---

# Template Design Principles

## 1. Use Stage Templates

Avoid embedding deployment logic directly in pipelines.

Create reusable templates:

- Build Stage Template
- Kubernetes Deployment Template
- Security Scan Template
- Approval Template
- Rollback Template

Example:

```yaml
template:
  templateRef: k8s_deploy_template
```

---

## 2. Parameterize Everything

Recommended parameters:

```yaml
serviceName
repository
dockerfilePath
imageRepository
namespace
cpuLimit
memoryLimit
```

Avoid hardcoded values such as:

```yaml
namespace: payments-prod
```

---

## 3. Centralize Secrets

Supported secret stores:

- Harness Secrets
- Azure Key Vault
- AWS Secrets Manager
- HashiCorp Vault

Never store credentials directly inside pipelines.

---

## 4. Enforce Policies as Code

### Security Policies

- Block critical vulnerabilities
- Require image signing
- Require security scans
- Require SBOM generation

### Governance Policies

- Require production approvals
- Require rollback capability
- Require deployment verification

---

# Recommended Git Strategy

```text
main
release/*
feature/*
hotfix/*
```

Pipeline triggers:

```text
feature/*  → CI only
main       → Build + Deploy DEV
release/*  → Deploy QA/UAT
tagged release → PROD
```

Avoid environment-specific branches.

---

# Kubernetes Deployment Standard

Every deployment should include:

```text
Pre-deployment validation
Deploy
Health validation
Metrics verification
Automatic rollback trigger
```

Recommended production rollout:

```text
Deploy 10%
Verify
Deploy 25%
Verify
Deploy 50%
Verify
Deploy 100%
```

Use Canary deployment by default.

---

# Security Pipeline Template

## SAST

- SonarQube
- Checkmarx
- Veracode

## Dependency Scanning

- Snyk
- OWASP Dependency Check

## Container Scanning

- Trivy
- Aqua
- Prisma

## Supply Chain Security

- SBOM Generation
- Image Signing
- Artifact Provenance

---

# Observability Template

Post-deployment verification should integrate with:

- Datadog
- Dynatrace
- Grafana
- Azure Monitor
- Application Insights

Validation checks:

```text
Error Rate
Latency
CPU
Memory
Availability
```

Automatic rollback should occur when thresholds are exceeded.

---

# Recommended Template Repository Structure

```text
Org Templates
│
├── CI
│   ├── build
│   ├── test
│   └── security
│
├── CD
│   ├── deploy-k8s
│   ├── canary
│   └── rollback
│
├── Governance
│   ├── approvals
│   └── policies
│
└── Utilities
    ├── notifications
    └── reporting
```

---

# CTO Office Recommended Standards

## Mandatory Controls

- Shared templates only
- GitOps deployments (ArgoCD or Harness GitOps)
- Security scan in every pipeline
- Canary deployment for production
- Automated rollback
- SBOM generation
- Centralized secrets
- Policy enforcement

## Optional Enhancements

- Cost optimization stage
- Performance testing stage
- Chaos engineering stage

---

# Golden End-to-End Pipeline

```text
Code Commit
    ↓
Build
    ↓
Unit Test
    ↓
SonarQube
    ↓
Security Scan
    ↓
Build Image
    ↓
Push Artifact
    ↓
Deploy DEV
    ↓
Automated Tests
    ↓
Promote QA
    ↓
Approval
    ↓
Canary PROD
    ↓
Verify Metrics
    ↓
Full Release
```

## Expected Outcomes

- Consistent delivery process across all teams
- Reduced operational risk
- Strong governance and auditability
- Improved deployment reliability
- Standardized security controls
- Faster onboarding of new services and teams
