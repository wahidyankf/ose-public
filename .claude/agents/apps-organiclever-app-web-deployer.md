---
description: |-
  Deploys the OrganicLever app group to staging via the scheduled organiclever-app-test-local-deploy-stag.yml GitHub Actions workflow. The workflow runs the full local-stack test suite, then force-pushes the stag-organiclever-app-web and stag-organiclever-be branches. Vercel listens to stag-organiclever-app-web for automatic builds. Production promotion is deferred — no production-CD workflow exists yet.
effort: xhigh
model: haiku
name: apps-organiclever-app-web-deployer
skills:
  - repo-practicing-trunk-based-development
  - apps-organiclever-www-developing-content
  - repo-maintaining-task-lists
  - apps-deploying-vercel-branches
tools: |-
  Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/apps-organiclever-app-web-deployer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
