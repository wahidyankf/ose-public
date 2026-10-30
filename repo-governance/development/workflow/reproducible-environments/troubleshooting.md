---
description: Common reproducibility failure modes — CI/local drift, cross-machine install differences, and a workspace-hoisting gotcha.
when_to_use: Use when diagnosing a "works on my machine but not CI/others" reproducibility failure.
---

# Troubleshooting

## Common Issues

**"Different behaviour locally vs CI"**:

- Check Node.js/npm versions match
- Verify using npm ci (not npm install)
- Check environment variables (.env vs CI secrets)
- Review lockfile is committed and up-to-date

**"Dependencies install differently on different machines"**:

- Ensure package-lock.json committed
- Use npm ci instead of npm install
- Check npm version matches (Volta should handle this)

**"Works on my machine but fails for others"**:

- Document system dependencies (OpenSSL, Python for node-gyp)
- Use rootless Podman containers to eliminate system dependency variance
- Check for hardcoded paths (use relative paths)
- Review .env.example is up-to-date

**"`npm ls <package>` shows it resolved, but a consumer still reports it missing"**:

- A workspace version conflict can leave npm nesting the package under one workspace's own
  `node_modules/` instead of hoisting it to root. If the consumer that needs it (e.g. a
  root-hoisted `vitest`) resolves bare specifiers by walking up from its own location, it never
  reaches a sibling workspace's nested copy — `npm ls` still reports the dependency graph as
  resolved because the package exists somewhere, just not where the consumer can see it.
- Run `npm dedupe` to re-hoist without touching any declared version — do not reach for
  `npm install <package>@<version> -w <workspace>` as the fix; it silently converts an exact pin to
  a caret range, violating this repo's [Dependency Bump Stability & Safety Policy](../dependency-bump-policy.md)
  "exact pins only" rule.
