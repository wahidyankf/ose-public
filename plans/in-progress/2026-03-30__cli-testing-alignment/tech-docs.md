# Technical Documentation: CLI Testing Alignment

## Architecture Overview

### Before (Current)

```text
specs/apps/rhino-cli/**/*.feature
          │
          │ (consumed by)
          ▼
  cmd/*.integration_test.go ──── godog + real fs + real tools
          │                       //go:build integration
          │
  cmd/*_test.go ─────────────── stdlib testing.T + real fs
                                  (no Gherkin, no godog)

  internal/**/*_test.go ──────── stdlib testing.T + testdata
                                  (pure function tests)
```

### After (Target)

```text
specs/apps/rhino-cli/**/*.feature
          │
          ├──────────── (consumed by BOTH)
          │                      │
          ▼                      ▼
  cmd/*_test.go              cmd/*.integration_test.go
  godog + mocked fs/tools    godog + real fs + real tools
  (no build tag)             //go:build integration
  coverage measured here     no coverage measurement

  internal/**/*_test.go ──────── stdlib testing.T + testdata
                                  (unchanged — pure function tests)
```

## Refactoring Strategy

### Phase 1: Introduce Mockable Interfaces

The current code calls `os.*`, `exec.Command`, and `filepath.*` directly. To mock at unit level,
introduce package-level function variables (matching the existing `var osExit = os.Exit` pattern
in `root.go`).

#### New file: `cmd/testable.go`

```go
package cmd

import (
    "io/fs"
    "os"
    "os/exec"
    "path/filepath"
)

// Filesystem operations — overridable in unit tests.
var (
    osReadFile  = os.ReadFile
    osWriteFile = os.WriteFile
    osMkdirAll  = os.MkdirAll
    osStat      = os.Stat
    osLstat     = os.Lstat
    osGetwd     = os.Getwd
    osChdir     = os.Chdir
    osRemoveAll = os.RemoveAll
    osOpen      = os.Open
    osCreate    = os.Create
    osReadDir   = os.ReadDir
    osUserHomeDir = os.UserHomeDir // included for future use; no current cmd/*.go file uses this
)

// Command execution — overridable in unit tests.
var (
    execLookPath = exec.LookPath
    execCommand  = exec.Command
)

// WalkDir wrapper — overridable in unit tests.
var walkDir = func(root string, fn fs.WalkDirFunc) error {
    return filepath.WalkDir(root, fn)
}
```

#### Migration pattern for existing code

Before:

```go
func runDoctor(cmd *cobra.Command, args []string) error {
    repoRoot, err := findGitRoot()
    // ...
    data, err := os.ReadFile(filepath.Join(repoRoot, "package.json"))
    // ...
}
```

After:

```go
func runDoctor(cmd *cobra.Command, args []string) error {
    repoRoot, err := findGitRoot()
    // ...
    data, err := osReadFile(filepath.Join(repoRoot, "package.json"))
    // ...
}
```

The change is mechanical: `os.ReadFile` → `osReadFile`, `os.Stat` → `osStat`, etc. Each command
file is updated independently.

### Phase 2: Unit Test Files — Add Godog + Mocks

Each `cmd/*_test.go` file is rewritten to:

1. **Consume Gherkin** via godog (same feature files as integration tests)
2. **Mock all I/O** via the package-level variables
3. **Keep non-BDD tests** for logic not covered by Gherkin

#### Unit test structure pattern

```go
package cmd

import (
    "context"
    "io/fs"
    "os"
    "os/exec"
    "path/filepath"
    "runtime"
    "testing"

    "github.com/cucumber/godog"
)

// specsDir points to the Gherkin feature files
var specsDoctorDirUnit = func() string {
    _, f, _, _ := runtime.Caller(0)
    return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/doctor")
}()

// Scenario: All required tools are installed and versions match
// Scenario: A required tool is missing from the environment
// Scenario: A tool is installed but its version does not match the requirement
// Scenario: JSON output lists all tool check results

type doctorUnitSteps struct {
    cmdErr    error
    cmdOutput string

    // Mocked state
    mockFiles    map[string][]byte        // path → content
    mockDirs     map[string]bool           // path → exists
    mockTools    map[string]string         // binary → version output
    mockLookPath map[string]error          // binary → LookPath error (nil = found)
}

func (s *doctorUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
    // Reset global flags
    verbose = false
    quiet = false
    output = "text"

    // Reset mocked state
    s.mockFiles = make(map[string][]byte)
    s.mockDirs = make(map[string]bool)
    s.mockTools = make(map[string]string)
    s.mockLookPath = make(map[string]error)
    s.cmdErr = nil
    s.cmdOutput = ""

    // Install mocks
    osReadFile = func(name string) ([]byte, error) {
        if data, ok := s.mockFiles[name]; ok {
            return data, nil
        }
        return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
    }
    osStat = func(name string) (fs.FileInfo, error) {
        if s.mockDirs[name] || s.mockFiles[name] != nil {
            return mockFileInfo{name: filepath.Base(name), isDir: s.mockDirs[name]}, nil
        }
        return nil, &fs.PathError{Op: "stat", Path: name, Err: fs.ErrNotExist}
    }
    execLookPath = func(file string) (string, error) {
        if err, ok := s.mockLookPath[file]; ok {
            return "", err
        }
        return "/usr/bin/" + file, nil
    }
    // ... more mocks as needed

    return context.Background(), nil
}

func (s *doctorUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
    // Restore real implementations
    osReadFile = os.ReadFile
    osStat = os.Stat
    execLookPath = exec.LookPath
    // ... restore all
    return context.Background(), nil
}

// Step definitions — SAME Gherkin text as integration tests, different implementation

func (s *doctorUnitSteps) allRequiredDevelopmentToolsArePresentWithMatchingVersions() error {
    // Set up mock filesystem with config files containing matching versions
    s.mockFiles["/mock-repo/package.json"] = []byte(`{"volta":{"node":"24.11.1","npm":"11.6.3"}}`)
    s.mockFiles["/mock-repo/apps/rhino-cli/go.mod"] = []byte("module foo\n\ngo 1.24.2\n")
    // ... more config files
    // Set up mock tool versions to match
    s.mockTools["node"] = "v24.11.1"
    s.mockTools["npm"] = "11.6.3"
    // ...
    return nil
}

// Run godog suite
func TestUnitDoctor(t *testing.T) {
    s := &doctorUnitSteps{}
    suite := godog.TestSuite{
        ScenarioInitializer: func(sc *godog.ScenarioContext) {
            sc.Before(s.before)
            sc.After(s.after)
            sc.Step(`^all required development tools are present...`, s.allRequiredDevelopmentToolsArePresentWithMatchingVersions)
            // ... register all steps with mocked implementations
        },
        Options: &godog.Options{
            Format:   "pretty",
            Paths:    []string{specsDoctorDirUnit},
            TestingT: t,
        },
    }
    if suite.Run() != 0 {
        t.Fatal("non-zero status returned, failed to run unit feature tests")
    }
}

// --- Non-BDD unit tests for logic not covered by Gherkin ---

func TestDoctorCommand_Initialization(t *testing.T) {
    // Keep existing non-BDD tests for command registration, flag defaults, etc.
    if doctorCmd.Use != "doctor" {
        t.Errorf("expected Use == %q, got %q", "doctor", doctorCmd.Use)
    }
}
```

### Phase 3: Integration Test Files — Minimal Changes

Integration tests already consume Gherkin via godog. The main changes:

1. **Ensure real filesystem usage** — verify no accidental mocking
2. **Use `/tmp` fixtures consistently** — `os.MkdirTemp("", "rhino-*")`
3. **Skip scenarios when tools aren't installed** — `t.Skip()` for optional tool checks
4. **No HTTP mocking needed** — rhino-cli commands don't make HTTP calls (if future commands
   do, mock at integration level)

The integration test files require **minimal changes** — mostly verifying they already follow
the "real I/O" pattern. The `doctor.integration_test.go` already does this correctly.

### Phase 4: Wire godog into `test:unit` Nx Target

Current `test:unit` command:

```json
"test:unit": {
    "command": "CGO_ENABLED=0 go test ./... -count=1"
}
```

This already runs all `*_test.go` files (excluding `//go:build integration`). Once unit test
files import godog and consume features, this command picks them up automatically. **No change
needed to the Nx target command.**

However, the `inputs` for `test:unit` and `test:quick` must be updated to include Gherkin specs:

```json
"test:unit": {
    "command": "CGO_ENABLED=0 go test ./... -count=1",
    "inputs": [
        "{projectRoot}/**/*.go",
        "{workspaceRoot}/specs/apps/rhino-cli/**/*.feature"
    ]
}
```

Similarly for `test:quick`:

```json
"test:quick": {
    "inputs": [
        "{projectRoot}/**/*.go",
        "{workspaceRoot}/specs/apps/rhino-cli/**/*.feature"
    ]
}
```

This ensures Nx invalidates the cache when Gherkin specs change.

## Mock Helpers Library

Create `cmd/testable_mock_test.go` with reusable mock utilities:

```go
package cmd

import (
    "io/fs"
    "os/exec"
    "path/filepath"
    "time"
)

// mockFileInfo implements fs.FileInfo for mocked os.Stat results.
type mockFileInfo struct {
    name  string
    size  int64
    isDir bool
    mode  fs.FileMode
}

func (m mockFileInfo) Name() string      { return m.name }
func (m mockFileInfo) Size() int64       { return m.size }
func (m mockFileInfo) Mode() fs.FileMode { return m.mode }
func (m mockFileInfo) ModTime() time.Time { return time.Time{} }
func (m mockFileInfo) IsDir() bool       { return m.isDir }
func (m mockFileInfo) Sys() any          { return nil }

// mockFS provides a simple in-memory filesystem for unit tests.
type mockFS struct {
    files map[string][]byte
    dirs  map[string]bool
}

func newMockFS() *mockFS {
    return &mockFS{
        files: make(map[string][]byte),
        dirs:  make(map[string]bool),
    }
}

func (m *mockFS) addFile(path string, content []byte) {
    m.files[path] = content
    // Add all parent directories
    dir := filepath.Dir(path)
    for dir != "." && dir != "/" {
        m.dirs[dir] = true
        dir = filepath.Dir(dir)
    }
}

func (m *mockFS) addDir(path string) {
    m.dirs[path] = true
}

// installMocks replaces global function vars with mock implementations.
// Returns a restore function that puts back the originals.
func (m *mockFS) installMocks() func() {
    origReadFile := osReadFile
    origStat := osStat
    origLstat := osLstat
    origGetwd := osGetwd
    origMkdirAll := osMkdirAll
    // ... save all originals

    osReadFile = func(name string) ([]byte, error) {
        if data, ok := m.files[name]; ok {
            return data, nil
        }
        return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
    }
    // ... install all mocks

    return func() {
        osReadFile = origReadFile
        osStat = origStat
        osLstat = origLstat
        osGetwd = origGetwd
        osMkdirAll = origMkdirAll
        // ... restore all
    }
}

// mockCommandRunner stubs execCommand and execLookPath for unit tests.
// Keys are binary names; outputs/errors are keyed by "binary arg1 arg2..." strings.
type mockCommandRunner struct {
    outputs        map[string]string // "binary arg1 arg2..." → combined stdout
    errors         map[string]error  // "binary arg1 arg2..." → exec error (nil = success)
    lookPathErrors map[string]error  // binary → LookPath error (nil = found at /usr/bin/binary)
}

func newMockCommandRunner() *mockCommandRunner {
    return &mockCommandRunner{
        outputs:        make(map[string]string),
        errors:         make(map[string]error),
        lookPathErrors: make(map[string]error),
    }
}

// installMocks replaces execCommand and execLookPath with mock implementations.
// Returns a restore function that puts back the originals.
func (r *mockCommandRunner) installMocks() func() {
    origExecCommand := execCommand
    origExecLookPath := execLookPath

    execLookPath = func(file string) (string, error) {
        if err, ok := r.lookPathErrors[file]; ok {
            return "", err
        }
        return "/usr/bin/" + file, nil
    }
    execCommand = func(name string, args ...string) *exec.Cmd {
        key := name
        for _, a := range args {
            key += " " + a
        }
        if out, ok := r.outputs[key]; ok {
            // Return a command that echoes the canned output.
            return exec.Command("echo", out)
        }
        if err, ok := r.errors[key]; ok {
            _ = err // caller must handle via cmd.Run() return value
            return exec.Command("false")
        }
        return exec.Command("true")
    }

    return func() {
        execCommand = origExecCommand
        execLookPath = origExecLookPath
    }
}
```

## Step Definition Sharing

Unit and integration tests consume the **same Gherkin text** but with different step
implementations. To minimize duplication of step registration patterns, extract the step
text patterns into constants:

```go
// cmd/steps_common_test.go (shared between unit and integration)
package cmd

const (
    stepAllToolsPresent     = `^all required development tools are present with matching versions$`
    stepToolMissing         = `^a required development tool is not found in the system PATH$`
    stepRunDoctorCommand    = `^the developer runs the doctor command$`
    stepExitsSuccessfully   = `^the command exits successfully$`
    stepExitsWithFailure    = `^the command exits with a failure code$`
    // ... etc
)
```

Both `*_test.go` and `*.integration_test.go` reference these constants:

```go
sc.Step(stepAllToolsPresent, s.allToolsPresent)
sc.Step(stepRunDoctorCommand, s.runDoctorCommand)
```

This ensures the regex patterns stay in sync without duplicating strings.

## Naming Convention Update

| Artifact                    | Pattern                                          | Example                                      |
| --------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Command file                | `{domain}_{action}.go`                           | `doctor.go`                                  |
| Unit test (BDD + non-BDD)   | `{domain}_{action}_test.go`                      | `doctor_test.go`                             |
| Integration test (BDD only) | `{domain}_{action}.integration_test.go`          | `doctor.integration_test.go`                 |
| Feature file                | `specs/{app}/{domain}/{domain}-{action}.feature` | `specs/apps/rhino-cli/doctor/doctor.feature` |
| Step constants (shared)     | `steps_common_test.go`                           | `cmd/steps_common_test.go`                   |
| Mock helpers                | `testable_mock_test.go`                          | `cmd/testable_mock_test.go`                  |
| Mockable vars               | `testable.go`                                    | `cmd/testable.go`                            |

> **Note**: ayokoding-cli and oseplatform-cli use hyphens instead of underscores in their
> integration test filenames, following the pre-existing convention in those apps (e.g.,
> `links-check.integration_test.go`, not `links_check.integration_test.go`). The structure
> diagrams in this document reflect the correct hyphenated names for those CLIs. The underscore
> pattern above applies to rhino-cli only.

## Affected Commands (14)

Each command requires:

1. **Replace** direct `os.*`/`exec.*` calls with package-level vars in the command `.go` file
2. **Rewrite** `*_test.go` to use godog + mocks for Gherkin scenarios, keeping non-BDD tests
3. **Verify** `*.integration_test.go` uses real fs (minimal changes expected)

| Command                        | Command File                      | Unit Test                              | Integration Test                                   | Feature File                                                |
| ------------------------------ | --------------------------------- | -------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `doctor`                       | `doctor.go`                       | `doctor_test.go`                       | `doctor.integration_test.go`                       | `doctor/doctor.feature`                                     |
| `test-coverage validate`       | `test_coverage_validate.go`       | `test_coverage_validate_test.go`       | `test_coverage_validate.integration_test.go`       | `test-coverage/test-coverage-validate.feature`              |
| `test-coverage merge`          | `test_coverage_merge.go`          | (new)                                  | `test_coverage_merge.integration_test.go`          | `test-coverage/test-coverage-merge.feature`                 |
| `test-coverage diff`           | `test_coverage_diff.go`           | (new)                                  | (new — does not exist yet)                         | `test-coverage/test-coverage-diff.feature`                  |
| `agents sync`                  | `agents_sync.go`                  | `agents_sync_test.go`                  | `agents_sync.integration_test.go`                  | `agents/agents-sync.feature`                                |
| `agents validate-claude`       | `agents_validate_claude.go`       | `agents_validate_claude_test.go`       | `agents_validate_claude.integration_test.go`       | `agents/agents-validate-claude.feature`                     |
| `agents validate-sync`         | `agents_validate_sync.go`         | `agents_validate_sync_test.go`         | `agents_validate_sync.integration_test.go`         | `agents/agents-sync.feature` (tag: `@agents-validate-sync`) |
| `docs validate-links`          | `docs_validate_links.go`          | `docs_validate_links_test.go`          | `docs_validate_links.integration_test.go`          | `docs/docs-validate-links.feature`                          |
| `docs validate-naming`         | `docs_validate_naming.go`         | `docs_validate_naming_test.go`         | `docs_validate_naming.integration_test.go`         | `docs/docs-validate-naming.feature`                         |
| `contracts java-clean-imports` | `contracts_java_clean_imports.go` | `contracts_java_clean_imports_test.go` | `contracts_java_clean_imports.integration_test.go` | `contracts/contracts-java-clean-imports.feature`            |
| `contracts dart-scaffold`      | `contracts_dart_scaffold.go`      | `contracts_dart_scaffold_test.go`      | `contracts_dart_scaffold.integration_test.go`      | `contracts/contracts-dart-scaffold.feature`                 |
| `java validate-annotations`    | `java_validate_annotations.go`    | `java_validate_annotations_test.go`    | `java_validate_annotations.integration_test.go`    | `java/java-validate-annotations.feature`                    |
| `spec-coverage validate`       | `spec_coverage_validate.go`       | `spec_coverage_validate_test.go`       | `spec_coverage_validate.integration_test.go`       | `spec-coverage/spec-coverage-validate.feature`              |
| `git pre-commit`               | `git_pre_commit.go`               | `git_pre_commit_test.go`               | `git_pre_commit.integration_test.go`               | `git/git-pre-commit.feature`                                |

**Note**: Files that do not currently exist and need to be created:

- `test_coverage_merge_test.go` — unit test (no file exists)
- `test_coverage_diff_test.go` — unit test (no file exists)
- `test_coverage_diff.integration_test.go` — integration test (no file exists; `test_coverage_merge.integration_test.go` does exist)

## ayokoding-cli and oseplatform-cli

Both CLIs follow the same pattern as rhino-cli but are much smaller (1 command each: `links check`).
They delegate link validation to `libs/hugo-commons/links.CheckLinks()`.

### ayokoding-cli Structure

```text
apps/ayokoding-cli/cmd/
├── root.go                          # Root command (version 0.5.0)
├── root_test.go                     # 2 unit tests (help, error exit)
├── links.go                         # Group command
├── links_check.go                   # links check command → calls hugo-commons
├── links_check_test.go              # 8 unit tests (real fs, no Gherkin)
└── links-check.integration_test.go  # godog, 4 scenarios from @links-check-ayokoding
```

### oseplatform-cli Structure

```text
apps/oseplatform-cli/cmd/
├── root.go                          # Root command (version 0.1.0)
├── root_test.go                     # 4 unit tests (init, flags, help, error)
├── links.go                         # Group command
├── links_check.go                   # links check command → calls hugo-commons
│                                    # Already has outputLinksJSONFn injectable var
├── links_check_test.go              # 8 unit tests (real fs + mock outputLinksJSONFn)
└── links-check.integration_test.go  # godog, 4 scenarios from @links-check-oseplatform
```

### Mocking Strategy for Link Check Commands

The `links check` commands call `links.CheckLinks()` from hugo-commons. At unit level, this
function must be mocked since it walks real directories.

#### Approach: Inject `checkLinksFn`

```go
// cmd/testable.go (in each CLI app)
var checkLinksFn = links.CheckLinks  // default: real implementation
```

In `links_check.go`, replace:

```go
// Before
result, err := links.CheckLinks(contentDir)

// After
result, err := checkLinksFn(contentDir)
```

Unit test mocks `checkLinksFn` to return canned results:

```go
func (s *linksCheckUnitSteps) before(...) {
    checkLinksFn = func(contentDir string) (*links.CheckResult, error) {
        return s.mockResult, s.mockErr
    }
}
```

Integration test leaves `checkLinksFn` pointing to `links.CheckLinks` (real implementation).

**oseplatform-cli note**: Already has `outputLinksJSONFn` as an injectable var. Extend the same
pattern to `checkLinksFn` for consistency.

### Spec Feature Files (Unchanged)

The feature files themselves don't change:

| CLI             | Feature File                                           | Tag                        | Scenarios |
| --------------- | ------------------------------------------------------ | -------------------------- | --------- |
| ayokoding-cli   | `specs/apps/ayokoding-cli/links/links-check.feature`   | `@links-check-ayokoding`   | 4         |
| oseplatform-cli | `specs/apps/oseplatform-cli/links/links-check.feature` | `@links-check-oseplatform` | 4         |

Both have identical scenario structures:

1. Valid links pass validation
2. Broken link detected and reported
3. External URLs are not validated
4. JSON output produces structured results

### Specs README Updates

All three specs READMEs need a "Dual Consumption" section:

```markdown
## Dual Consumption

Both unit and integration tests consume the Gherkin specs in this directory:

| Level       | Test File Pattern           | Step Implementation                  |
| ----------- | --------------------------- | ------------------------------------ |
| Unit        | `cmd/*_test.go`             | Mocked filesystem and tool execution |
| Integration | `cmd/*.integration_test.go` | Real filesystem with `/tmp` fixtures |

The same Gherkin scenarios run at both levels — only the step definitions differ.
Unit tests verify business logic in isolation; integration tests verify the command
works with real file I/O.
```

### Nx Config Updates

Both `project.json` files need `specs/**/*.feature` added to `test:unit` and `test:quick` inputs:

**ayokoding-cli/project.json**:

```json
"test:unit": {
    "command": "CGO_ENABLED=0 go test ./... -count=1",
    "inputs": [
        "{projectRoot}/**/*.go",
        "{workspaceRoot}/specs/apps/ayokoding-cli/**/*.feature"
    ]
},
"test:quick": {
    "inputs": [
        "{projectRoot}/**/*.go",
        "{workspaceRoot}/specs/apps/ayokoding-cli/**/*.feature"
    ]
}
```

**oseplatform-cli/project.json**: Same pattern with `oseplatform-cli` path.

### App README Updates

Both `apps/ayokoding-cli/README.md` and `apps/oseplatform-cli/README.md` need their testing
sections updated to describe dual Gherkin consumption, matching the rhino-cli README update.
