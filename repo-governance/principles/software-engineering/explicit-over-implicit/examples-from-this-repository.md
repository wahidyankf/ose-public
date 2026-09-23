---
description: This repository's concrete explicit configurations.
when_to_use: Use to find an existing explicit configuration to reuse or extend.
---

# Examples from This Repository

## Git Hook Configuration

**Location**: `.husky/pre-commit`

```sh
#!/usr/bin/env sh
set -eu

# Thin lifecycle adapter. Rhino applies declared mutations to the Git index.
export RHINO_GATE_SURFACE=pre-commit
exec ./hippo run --class transactional --resource-tier standard --disk-path . -- \
  ./rhino gate run --surface pre-commit
```

**Explicit behaviour**:

- Hook triggers on pre-commit
- Runs one declared surface, `pre-commit`, of the `repo-config.yml` gate registry
- No hidden magic
- Every gate it runs is listed by `./rhino gate list`

## Formatter Configuration

**Location**: `scripts/format-staged`, invoked by the `format-staged` gate in `repo-config.yml`

```bash
case "$path" in
  *.md | *.js | *.jsx | *.ts | *.tsx | *.mjs | *.cjs | *.json | *.yml | *.yaml | *.css | *.scss)
    prettier_paths+=("$path")
    ;;
  *.rs) rust_paths+=("$path") ;;
esac
```

**Explicit behaviour**:

- File patterns explicitly listed
- Command explicitly stated
- No "format all files" magic
- Only staged files processed

## Nx Path Mappings

**Location**: `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@open-sharia-enterprise/ts-validation": ["libs/ts-validation/src/index.ts"]
    }
  }
}
```

**Explicit behaviour**:

- Path alias explicitly mapped
- Exact file path specified
- No convention-based discovery
- Behaviour traceable
