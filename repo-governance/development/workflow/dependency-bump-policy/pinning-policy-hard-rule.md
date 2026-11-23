---
description: The required exact-pin form for every manifest type — npm, Cargo, .NET, Dockerfile, GitHub Actions — and the caret/tilde verification command.
when_to_use: Use when writing or reviewing a version string in any manifest to confirm it is an exact pin.
---

# Pinning Policy (Hard Rule)

All version specifications MUST be exact strings. No caret (`^`), no tilde (`~`), no `latest`, no `*` (except npm workspace-internal references).

| Manifest                                                | Required Form                                         | Example                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `package.json` deps / devDeps                           | Exact string                                          | `"react": "19.2.6"` (NOT `"^19.2.6"`)                                                          |
| `package.json` `volta` block                            | Exact (Volta enforces this)                           | `"node": "24.15.0"`                                                                            |
| `package.json` `optionalDependencies` (native binaries) | Exact                                                 | `"@next/swc-linux-x64-gnu": "16.2.6"`                                                          |
| `Cargo.toml` `[dependencies]`                           | Exact (no caret/tilde)                                | `axum = "0.8.4"` (NOT `axum = "^0.8"`)                                                         |
| `global.json` `sdk.version`                             | Exact (`rollForward` allowed per upstream pattern)    | `"version": "10.0.300"`                                                                        |
| Dockerfile `FROM`                                       | Exact tag (digest preferred for production)           | `FROM docker.io/library/node:24.15.0-alpine3.23` (NOT `FROM docker.io/library/node:24-alpine`) |
| GitHub Actions `uses:`                                  | Full 40-character commit SHA plus a `# <tag>` comment | `uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6`                         |
| Composite action input defaults                         | Exact                                                 | `default: "1.26.3"` (NOT `default: "1.26"`)                                                    |

**Verification command** after every `package.json` edit:

```bash
grep -E '"\^|"~' <changed-file> && echo "FAIL: caret/tilde found" || echo "OK: all exact"
```
