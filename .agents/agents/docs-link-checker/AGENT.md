---
description: |-
  Validates internal and external documentation links. Always uses docs/metadata/external-links-status.yaml as its sole cache, prunes it, and updates lastFullScan on every invocation. Use for dead links, URL reachability, internal references, or link-health audits.
effort: medium
model: muse-spark-1.3
name: docs-link-checker
---

Before acting, read the complete canonical agent definition at the repository-root path
agents/docs-link-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
