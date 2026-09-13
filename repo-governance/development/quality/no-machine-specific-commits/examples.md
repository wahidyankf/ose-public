---
description: "Worked prohibited-vs-correct examples for hardcoded paths, test fixtures, and committed credentials."
when_to_use: "Use when you need a concrete before/after example of fixing a machine-specific value."
---

# Examples

## Prohibited: Hardcoded absolute path in a script

```bash
# WRONG — only works on one machine
export GOPATH=/Users/<name>/go
```

```bash
# CORRECT — derived from the environment
export GOPATH="${GOPATH:-$HOME/go}"
```

## Prohibited: Hardcoded path in a test fixture

```go
// WRONG — encodes the developer's home directory
configPath := "/Users/<name>/.config/tool/config.yaml"
```

```go
// CORRECT — resolved from the environment at runtime
configPath := filepath.Join(os.Getenv("HOME"), ".config", "tool", "config.yaml")
```

## Prohibited: Credential in a committed configuration file

```yaml
# WRONG — literal credential in source
database:
  url: postgres://alice:s3cr3t@localhost:5432/devdb
```

```yaml
# CORRECT — references environment variable
database:
  url: ${DATABASE_URL}
```

## Acceptable: Realistic value in a parser test

```go
// CORRECT — tests OS/arch parsing; value is synthetic test input, not the real machine
func TestParseOSArch(t *testing.T) {
    result := parseOSArch("darwin/arm64")
    assert.Equal(t, "darwin", result.OS)
    assert.Equal(t, "arm64", result.Arch)
}
```
