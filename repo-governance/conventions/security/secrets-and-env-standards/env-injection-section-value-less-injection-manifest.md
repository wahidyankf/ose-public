---
description: The repo-config.yml env-injection section that declares, per app, the injection home for every key at every stage, and how it feeds the validate-env manifest-consistency check.
when_to_use: "Use when adding a new app or a new CI test-harness key to the env-injection manifest in repo-config.yml."
---

# `env-injection:` Section — Value-Less Injection Manifest

The `env-injection:` section in `repo-config.yml` declares, per app, the injection home for every
key at every stage it runs in — names only, never values. It is the static contract that
`validate-env` checks for manifest consistency: every app-runtime key in `.env.example` has a
documented home at each stage the app runs; every CI test-harness key is registered and has no
`.env.example` entry. It is also the **checklist wire-vercel works from** when populating real values.

```yaml
# repo-config.yml — env-injection: section (value-less injection contract)
env-injection:
  apps:
    - app: organiclever-app-web
      runtime: { local: env-local, staging: vercel-preview, production: vercel-production }
      keys-from: apps/organiclever-app-web/.env.example
    - app: organiclever-be
      runtime: { local-ci: compose, staging: k3s-coralpolyp }
      keys-from: apps/organiclever-be/.env.example
  ci-harness:
    # test-only keys, never in any .env.example
    - key: WEB_BASE_URL
      class: var
      environments: [organiclever-app-staging, ose-app-staging]
    - key: VERCEL_AUTOMATION_BYPASS_SECRET
      class: secret
      environments: [organiclever-app-staging, ose-app-staging]
```

`rhino-cli env validate` gains a manifest-consistency pass — not a separate Nx target. The manifest
and `.env.example` are the same conceptual surface (the env contract), and `env validate` is already
wired into `.husky/pre-push` and `validate-env.yml`, so extending it adds the check with no
new target wiring. The check remains static and value-free. Actual presence of secret values in
GitHub, Vercel, or k3s is not machine-checkable from this repo and stays a wire-vercel / the private sibling
`[HUMAN]` responsibility — the manifest is what they verify against.
