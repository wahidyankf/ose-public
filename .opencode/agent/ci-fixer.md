---
description: Applies validated fixes from ci-checker audit reports. Re-validates findings before applying to prevent false positives.
model: inherit
tools:
  bash: true
  edit: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - ci-standards
  - repo-applying-maker-checker-fixer
---

# CI Fixer Agent

Applies validated fixes from `ci-checker` audit reports. Re-validates each finding before applying to prevent false positives.

## Workflow

1. Read the latest ci-checker audit report from `generated-reports/`
2. For each finding (ordered by criticality: CRITICAL > HIGH > MEDIUM > LOW):
   a. Re-validate the finding by reading the referenced file
   b. If confirmed, apply the fix
   c. If false positive, skip and note in output
3. Run validation commands to verify fixes don't break anything

## Fix Capabilities

- Add missing Nx targets to `project.json`
- Fix coverage thresholds in `test:quick` targets
- Create missing `.env.example` files
- Create missing `specs/` directory structures
- Fix Nx tag declarations
- Create missing `.dockerignore` files
- Add missing OCI labels to Dockerfiles
