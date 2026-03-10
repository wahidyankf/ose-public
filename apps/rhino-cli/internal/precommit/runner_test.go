package precommit

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/agents"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/docs"
)

// --------------------------------------------------------------------------
// Fake helpers
// --------------------------------------------------------------------------

// succeedExec returns an *exec.Cmd that always exits 0.
func succeedExec(_ string, _ ...string) *exec.Cmd { return exec.Command("true") }

// failExec returns an *exec.Cmd that always exits 1.
func failExec(_ string, _ ...string) *exec.Cmd { return exec.Command("false") }

// recordingExec records every call and returns a success command.
type recordingExec struct {
	calls [][]string
}

func (r *recordingExec) exec(name string, args ...string) *exec.Cmd {
	r.calls = append(r.calls, append([]string{name}, args...))
	return exec.Command("true")
}

// fakeDeps returns a Deps wired with safe defaults: all execs succeed, no staged
// files, all internal validators pass, discard stdout/stderr.
func fakeDeps() Deps {
	return Deps{
		GetStagedFiles: func(_ string) ([]string, error) { return nil, nil },
		ExecCommand:    succeedExec,
		FindMixRoot:    func(_, _ string) (string, bool) { return "", false },
		LookPath:       func(_ string) (string, error) { return "/usr/bin/mix", nil },
		ValidateClaude: func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
			return &agents.ValidationResult{}, nil
		},
		SyncAll: func(_ agents.SyncOptions) (*agents.SyncResult, error) {
			return &agents.SyncResult{}, nil
		},
		ValidateSync: func(_ string) (*agents.ValidationResult, error) {
			return &agents.ValidationResult{}, nil
		},
		ValidateNaming: func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
			return &docs.ValidationResult{}, nil
		},
		FixNaming: func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
			return &docs.FixResult{}, nil
		},
		ValidateLinks: func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
			return &docs.LinkValidationResult{}, nil
		},
		Stdout: &bytes.Buffer{},
		Stderr: &bytes.Buffer{},
	}
}

// --------------------------------------------------------------------------
// DefaultDeps
// --------------------------------------------------------------------------

func TestDefaultDeps_ReturnsNonNilFields(t *testing.T) {
	d := DefaultDeps()
	if d.GetStagedFiles == nil {
		t.Error("GetStagedFiles should not be nil")
	}
	if d.ExecCommand == nil {
		t.Error("ExecCommand should not be nil")
	}
	if d.FindMixRoot == nil {
		t.Error("FindMixRoot should not be nil")
	}
	if d.ValidateClaude == nil {
		t.Error("ValidateClaude should not be nil")
	}
	if d.Stdout == nil {
		t.Error("Stdout should not be nil")
	}
}

// --------------------------------------------------------------------------
// Run — happy path (all steps succeed, no staged files triggers all skips)
// --------------------------------------------------------------------------

func TestRun_NoStagedFiles_AllConditionalStepsSkipped(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	// GetStagedFiles returns empty → all staged-file-conditional steps are skipped.
	// ExecCommand returns true for nx, git-add, lint-staged, npm.
	if err := Run(t.TempDir(), d); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	o := out.String()
	if !strings.Contains(o, "Skipping config validation") {
		t.Error("expected config validation skip message")
	}
	if !strings.Contains(o, "Skipping docker-compose") {
		t.Error("expected docker-compose skip message")
	}
	if !strings.Contains(o, "Skipping Elixir") {
		t.Error("expected Elixir skip message")
	}
	if !strings.Contains(o, "Skipping docs naming") {
		t.Error("expected docs naming skip message")
	}
}

// --------------------------------------------------------------------------
// Run — GetStagedFiles error
// --------------------------------------------------------------------------

func TestRun_GetStagedFilesError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.GetStagedFiles = func(_ string) ([]string, error) {
		return nil, errors.New("git error")
	}
	err := Run(t.TempDir(), d)
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "staged files") {
		t.Errorf("unexpected error: %v", err)
	}
}

// --------------------------------------------------------------------------
// step1Config
// --------------------------------------------------------------------------

func TestStep1Config_NoConfigStaged_Skips(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step1Config(t.TempDir(), []string{"README.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping config validation") {
		t.Error("expected skip message")
	}
}

func TestStep1Config_ClaudeStaged_AllPass(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "✅ Configuration validation passed") {
		t.Error("expected success message")
	}
}

func TestStep1Config_OpencodeStaged_AllPass(t *testing.T) {
	d := fakeDeps()
	err := step1Config(t.TempDir(), []string{".opencode/agent/foo.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep1Config_ValidateClaudeError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateClaude = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return nil, errors.New("validate error")
	}
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "validate error") {
		t.Fatalf("expected validate error, got: %v", err)
	}
}

func TestStep1Config_ValidateClaudeFailedChecks_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateClaude = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{FailedChecks: 2}, nil
	}
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "validation failed") {
		t.Fatalf("expected validation-failed error, got: %v", err)
	}
}

func TestStep1Config_SyncAllError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.SyncAll = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return nil, errors.New("sync error")
	}
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "sync error") {
		t.Fatalf("expected sync error, got: %v", err)
	}
}

func TestStep1Config_ValidateSyncError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateSync = func(_ string) (*agents.ValidationResult, error) {
		return nil, errors.New("sync-validate error")
	}
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "sync-validate error") {
		t.Fatalf("expected sync-validate error, got: %v", err)
	}
}

func TestStep1Config_ValidateSyncFailedChecks_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateSync = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{FailedChecks: 1}, nil
	}
	err := step1Config(t.TempDir(), []string{".claude/agents/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "sync validation failed") {
		t.Fatalf("expected sync validation failed error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step2DockerCompose
// --------------------------------------------------------------------------

func TestStep2DockerCompose_NoCompose_Skips(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step2DockerCompose(t.TempDir(), []string{"README.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping docker-compose") {
		t.Error("expected skip message")
	}
}

func TestStep2DockerCompose_ComposeFileNotOnDisk_Skips(t *testing.T) {
	// Staged file exists in git but not on disk (deleted) — continue silently.
	d := fakeDeps()
	err := step2DockerCompose(t.TempDir(), []string{"docker-compose.yml"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep2DockerCompose_ComposeFileValid_Passes(t *testing.T) {
	tmp := t.TempDir()
	// Create a compose file so os.Stat passes.
	composeFile := filepath.Join(tmp, "docker-compose.yml")
	if err := os.WriteFile(composeFile, []byte("version: '3'"), 0644); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	// ExecCommand succeeds (docker compose config exits 0).
	err := step2DockerCompose(tmp, []string{"docker-compose.yml"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "✅ All docker-compose files validated") {
		t.Error("expected success message")
	}
}

func TestStep2DockerCompose_ComposeFileBadYAML_ReturnsError(t *testing.T) {
	tmp := t.TempDir()
	composeFile := filepath.Join(tmp, "docker-compose.yaml")
	if err := os.WriteFile(composeFile, []byte("bad yaml"), 0644); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.ExecCommand = failExec // docker compose config exits 1
	err := step2DockerCompose(tmp, []string{"docker-compose.yaml"}, d)
	if err == nil {
		t.Fatal("expected error for invalid compose file")
	}
	if !strings.Contains(err.Error(), "docker compose validation failed") {
		t.Errorf("unexpected error: %v", err)
	}
}

// --------------------------------------------------------------------------
// step3NxPreCommit
// --------------------------------------------------------------------------

func TestStep3NxPreCommit_Success_NoWarning(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	step3NxPreCommit(t.TempDir(), d)
	if strings.Contains(out.String(), "⚠️") {
		t.Error("expected no warning when nx succeeds")
	}
}

func TestStep3NxPreCommit_Failure_PrintsWarning(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	d.ExecCommand = failExec
	step3NxPreCommit(t.TempDir(), d)
	if !strings.Contains(out.String(), "⚠️") {
		t.Error("expected warning when nx fails")
	}
}

// --------------------------------------------------------------------------
// step4StageAyokoding
// --------------------------------------------------------------------------

func TestStep4StageAyokoding_AlwaysSucceeds(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = failExec // even if git add fails, no error returned
	step4StageAyokoding(t.TempDir(), d)
}

// --------------------------------------------------------------------------
// step5LintStaged
// --------------------------------------------------------------------------

func TestStep5LintStaged_Success(t *testing.T) {
	d := fakeDeps()
	if err := step5LintStaged(t.TempDir(), d); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep5LintStaged_Failure_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = failExec
	err := step5LintStaged(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "lint-staged failed") {
		t.Fatalf("expected lint-staged error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step6ElixirFormat
// --------------------------------------------------------------------------

func TestStep6ElixirFormat_NoElixirFiles_Skips(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step6ElixirFormat(t.TempDir(), []string{"README.md", "src/foo.ts"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping Elixir") {
		t.Error("expected Elixir skip message")
	}
}

func TestStep6ElixirFormat_ExcludesDepsAndBuild(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	// Files in deps/ and _build/ should be excluded → no elixir files remain.
	staged := []string{
		"apps/foo/deps/lib/bar.ex",
		"apps/foo/_build/dev/lib/baz.exs",
	}
	err := step6ElixirFormat(t.TempDir(), staged, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping Elixir") {
		t.Error("expected Elixir skip due to no valid files")
	}
}

func TestStep6ElixirFormat_MixNotFound_PrintsWarning(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	d.LookPath = func(_ string) (string, error) { return "", errors.New("not found") }
	err := step6ElixirFormat(t.TempDir(), []string{"apps/foo/lib/bar.ex"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "mix not found") {
		t.Error("expected 'mix not found' warning")
	}
}

func TestStep6ElixirFormat_FindMixRootFails_SkipsFile(t *testing.T) {
	// FindMixRoot returns false → no project roots → mix never called.
	d := fakeDeps()
	d.FindMixRoot = func(_, _ string) (string, bool) { return "", false }
	rec := &recordingExec{}
	d.ExecCommand = rec.exec
	err := step6ElixirFormat(t.TempDir(), []string{"apps/foo/lib/bar.ex"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	// Only git-add call (for re-staging), no mix call.
	for _, call := range rec.calls {
		if call[0] == "mix" {
			t.Error("expected mix not to be called when no mix root found")
		}
	}
}

func TestStep6ElixirFormat_MixFormatSucceeds(t *testing.T) {
	tmp := t.TempDir()
	// Create the project directory so cmd.Dir succeeds.
	if err := os.MkdirAll(filepath.Join(tmp, "apps", "organiclever-be-exph"), 0755); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		return "apps/organiclever-be-exph", true
	}
	rec := &recordingExec{}
	d.ExecCommand = rec.exec
	out := &bytes.Buffer{}
	d.Stdout = out

	err := step6ElixirFormat(tmp, []string{"apps/organiclever-be-exph/lib/foo.ex"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "✅ Elixir files formatted") {
		t.Error("expected success message")
	}
	// Verify mix was called.
	found := false
	for _, call := range rec.calls {
		if call[0] == "mix" {
			found = true
		}
	}
	if !found {
		t.Error("expected mix to be called")
	}
}

func TestStep6ElixirFormat_MixFormatFails_ReturnsError(t *testing.T) {
	tmp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmp, "apps", "organiclever-be-exph"), 0755); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		return "apps/organiclever-be-exph", true
	}
	d.ExecCommand = func(name string, args ...string) *exec.Cmd {
		if name == "mix" {
			return exec.Command("false")
		}
		return exec.Command("true")
	}
	err := step6ElixirFormat(tmp, []string{"apps/organiclever-be-exph/lib/foo.ex"}, d)
	if err == nil || !strings.Contains(err.Error(), "mix format failed") {
		t.Fatalf("expected mix format error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step7DocsNaming
// --------------------------------------------------------------------------

func TestStep7DocsNaming_NoDocsStaged_Skips(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step7DocsNaming(t.TempDir(), []string{"README.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping docs naming") {
		t.Error("expected docs naming skip message")
	}
}

func TestStep7DocsNaming_DocsStaged_NoViolations_Passes(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step7DocsNaming(t.TempDir(), []string{"docs/tutorials/tu__foo.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "✅ Documentation naming validation passed") {
		t.Error("expected success message")
	}
}

func TestStep7DocsNaming_ValidateNamingError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateNaming = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return nil, errors.New("naming error")
	}
	err := step7DocsNaming(t.TempDir(), []string{"docs/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "naming error") {
		t.Fatalf("expected naming error, got: %v", err)
	}
}

func TestStep7DocsNaming_ViolationsFound_FixApplied(t *testing.T) {
	d := fakeDeps()
	d.ValidateNaming = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			Violations: []docs.NamingViolation{{FileName: "bad.md"}},
		}, nil
	}
	fixCalled := false
	d.FixNaming = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		fixCalled = true
		return &docs.FixResult{}, nil
	}
	err := step7DocsNaming(t.TempDir(), []string{"docs/foo.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !fixCalled {
		t.Error("expected FixNaming to be called when violations found")
	}
}

func TestStep7DocsNaming_FixError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateNaming = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			Violations: []docs.NamingViolation{{FileName: "bad.md"}},
		}, nil
	}
	d.FixNaming = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		return nil, errors.New("fix error")
	}
	err := step7DocsNaming(t.TempDir(), []string{"docs/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "fix error") {
		t.Fatalf("expected fix error, got: %v", err)
	}
}

func TestStep7DocsNaming_FixResultErrors_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateNaming = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			Violations: []docs.NamingViolation{{FileName: "bad.md"}},
		}, nil
	}
	d.FixNaming = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		return &docs.FixResult{Errors: []string{"rename failed"}}, nil
	}
	err := step7DocsNaming(t.TempDir(), []string{"docs/foo.md"}, d)
	if err == nil || !strings.Contains(err.Error(), "rename failed") {
		t.Fatalf("expected fix result error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step8ValidateLinks
// --------------------------------------------------------------------------

func TestStep8ValidateLinks_NoBrokenLinks_Passes(t *testing.T) {
	d := fakeDeps()
	err := step8ValidateLinks(t.TempDir(), d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep8ValidateLinks_BrokenLinksFound_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			BrokenLinks: []docs.BrokenLink{{SourceFile: "README.md", LinkText: "broken"}},
		}, nil
	}
	err := step8ValidateLinks(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "broken links") {
		t.Fatalf("expected broken links error, got: %v", err)
	}
}

func TestStep8ValidateLinks_ValidateLinksError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return nil, errors.New("links error")
	}
	err := step8ValidateLinks(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "links error") {
		t.Fatalf("expected links error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step9LintMarkdown
// --------------------------------------------------------------------------

func TestStep9LintMarkdown_Success(t *testing.T) {
	d := fakeDeps()
	if err := step9LintMarkdown(t.TempDir(), d); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep9LintMarkdown_Failure_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = failExec
	err := step9LintMarkdown(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "markdown linting failed") {
		t.Fatalf("expected markdown linting error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// findMixRootDefault
// --------------------------------------------------------------------------

func TestFindMixRootDefault_FoundInParent(t *testing.T) {
	tmp := t.TempDir()
	// Create: tmp/apps/myapp/mix.exs and a file tmp/apps/myapp/lib/foo.ex
	appDir := filepath.Join(tmp, "apps", "myapp")
	libDir := filepath.Join(appDir, "lib")
	if err := os.MkdirAll(libDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(appDir, "mix.exs"), []byte(""), 0644); err != nil {
		t.Fatal(err)
	}

	file := filepath.Join("apps", "myapp", "lib", "foo.ex")
	got, ok := findMixRootDefault(file, tmp)
	if !ok {
		t.Fatal("expected mix root to be found")
	}
	if got != filepath.Join("apps", "myapp") {
		t.Errorf("expected apps/myapp, got %q", got)
	}
}

func TestFindMixRootDefault_NotFound_ReturnsFalse(t *testing.T) {
	tmp := t.TempDir()
	// No mix.exs anywhere.
	file := filepath.Join("apps", "myapp", "lib", "foo.ex")
	_, ok := findMixRootDefault(file, tmp)
	if ok {
		t.Error("expected not found")
	}
}

func TestFindMixRootDefault_FileAtRoot_ReturnsFalse(t *testing.T) {
	tmp := t.TempDir()
	// File is directly at repo root level with no mix.exs anywhere.
	_, ok := findMixRootDefault("foo.ex", tmp)
	if ok {
		t.Error("expected not found")
	}
}

// --------------------------------------------------------------------------
// hasMatch
// --------------------------------------------------------------------------

func TestHasMatch_EmptySlice_ReturnsFalse(t *testing.T) {
	if hasMatch(nil, func(_ string) bool { return true }) {
		t.Error("expected false for nil slice")
	}
}

func TestHasMatch_NoMatch_ReturnsFalse(t *testing.T) {
	if hasMatch([]string{"a", "b"}, func(s string) bool { return s == "c" }) {
		t.Error("expected false")
	}
}

func TestHasMatch_Match_ReturnsTrue(t *testing.T) {
	if !hasMatch([]string{"a", "b", "c"}, func(s string) bool { return s == "b" }) {
		t.Error("expected true")
	}
}

// --------------------------------------------------------------------------
// Run integration: verify fail-fast stops at first error
// --------------------------------------------------------------------------

func TestRun_Step1Fails_DoesNotRunLaterSteps(t *testing.T) {
	d := fakeDeps()
	d.GetStagedFiles = func(_ string) ([]string, error) {
		return []string{".claude/agents/bad.md"}, nil
	}
	d.ValidateClaude = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return nil, errors.New("claude invalid")
	}
	rec := &recordingExec{}
	d.ExecCommand = rec.exec

	err := Run(t.TempDir(), d)
	if err == nil {
		t.Fatal("expected error")
	}
	// lint-staged (step 5) must NOT have been called.
	for _, call := range rec.calls {
		if call[0] == "npx" {
			t.Error("expected npx not to be called after step 1 failure")
		}
	}
}

func TestRun_Step5Fails_DoesNotRunStep6(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = func(name string, args ...string) *exec.Cmd {
		if name == "npx" {
			return exec.Command("false")
		}
		return exec.Command("true")
	}
	err := Run(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "lint-staged") {
		t.Fatalf("expected lint-staged error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// Run integration: verify all steps run when everything succeeds
// --------------------------------------------------------------------------

func TestRun_AllStepsSucceed_NoError(t *testing.T) {
	d := fakeDeps()
	// Stage docs/ to trigger step 7 path, but ValidateNaming returns no violations.
	d.GetStagedFiles = func(_ string) ([]string, error) {
		return []string{"docs/tutorials/tu__foo.md"}, nil
	}
	if err := Run(t.TempDir(), d); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// ExecCommand call tracking for specific steps
// --------------------------------------------------------------------------

func TestStep3NxPreCommit_CallsNxAffected(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	step3NxPreCommit(t.TempDir(), d)
	if len(rec.calls) == 0 || rec.calls[0][0] != "nx" {
		t.Error("expected nx to be called")
	}
}

func TestStep9LintMarkdown_CallsNpmRun(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	_ = step9LintMarkdown(t.TempDir(), d)
	found := false
	for _, c := range rec.calls {
		if c[0] == "npm" && len(c) >= 3 && c[2] == "lint:md" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected npm run lint:md, got: %v", rec.calls)
	}
}

// --------------------------------------------------------------------------
// step6ElixirFormat: multiple projects
// --------------------------------------------------------------------------

func TestStep6ElixirFormat_TwoProjects_MixCalledForEach(t *testing.T) {
	tmp := t.TempDir()
	for _, p := range []string{"apps/app1", "apps/app2"} {
		if err := os.MkdirAll(filepath.Join(tmp, p), 0755); err != nil {
			t.Fatal(err)
		}
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		if strings.HasPrefix(file, "apps/app1/") {
			return "apps/app1", true
		}
		return "apps/app2", true
	}
	rec := &recordingExec{}
	d.ExecCommand = rec.exec

	staged := []string{
		"apps/app1/lib/foo.ex",
		"apps/app2/lib/bar.ex",
	}
	err := step6ElixirFormat(tmp, staged, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	mixCalls := 0
	for _, c := range rec.calls {
		if c[0] == "mix" {
			mixCalls++
		}
	}
	if mixCalls != 2 {
		t.Errorf("expected 2 mix calls (one per project), got %d; calls: %v", mixCalls, rec.calls)
	}
}

// --------------------------------------------------------------------------
// Error message formatting
// --------------------------------------------------------------------------

func TestStep7DocsNaming_MultipleFixErrors_JoinedInMessage(t *testing.T) {
	d := fakeDeps()
	d.ValidateNaming = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			Violations: []docs.NamingViolation{{FileName: "bad.md"}},
		}, nil
	}
	d.FixNaming = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		return &docs.FixResult{Errors: []string{"err1", "err2"}}, nil
	}
	err := step7DocsNaming(t.TempDir(), []string{"docs/foo.md"}, d)
	if err == nil {
		t.Fatal("expected error")
	}
	msg := err.Error()
	if !strings.Contains(msg, "err1") || !strings.Contains(msg, "err2") {
		t.Errorf("expected both errors in message, got: %s", msg)
	}
}

// --------------------------------------------------------------------------
// step2DockerCompose: both .yml and .yaml extensions
// --------------------------------------------------------------------------

func TestStep2DockerCompose_YamlExtension_Detected(t *testing.T) {
	tmp := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmp, "docker-compose.yaml"), []byte("v: '3'"), 0644); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step2DockerCompose(tmp, []string{"docker-compose.yaml"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "✅ All docker-compose files validated") {
		t.Error("expected success message for .yaml extension")
	}
}

// --------------------------------------------------------------------------
// DefaultDeps: findMixRootDefault coverage via the default implementation
// --------------------------------------------------------------------------

func TestDefaultDeps_FindMixRoot_IsDefaultImpl(t *testing.T) {
	d := DefaultDeps()
	tmp := t.TempDir()
	// No mix.exs → returns false.
	_, ok := d.FindMixRoot("some/file.ex", tmp)
	if ok {
		t.Error("expected false when no mix.exs")
	}
}

// --------------------------------------------------------------------------
// getStagedFiles via GetStagedFiles injection (coverage for defaultGetStagedFiles
// is provided indirectly; here we verify the Run plumbing passes it through).
// --------------------------------------------------------------------------

func TestRun_GetStagedFilesReturnsError_WrapsError(t *testing.T) {
	d := fakeDeps()
	sentinel := errors.New("sentinel")
	d.GetStagedFiles = func(_ string) ([]string, error) { return nil, sentinel }
	err := Run(t.TempDir(), d)
	if !errors.Is(err, sentinel) {
		t.Errorf("expected sentinel error to be wrapped, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step8ValidateLinks: stderr output on broken links
// --------------------------------------------------------------------------

func TestStep8ValidateLinks_BrokenLinks_WritesToStderr(t *testing.T) {
	d := fakeDeps()
	errBuf := &bytes.Buffer{}
	d.Stderr = errBuf
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			BrokenLinks: []docs.BrokenLink{{SourceFile: "a.md", LinkText: "bad"}},
		}, nil
	}
	_ = step8ValidateLinks(t.TempDir(), d)
	if !strings.Contains(errBuf.String(), "❌") {
		t.Error("expected ❌ in stderr when broken links found")
	}
}

// --------------------------------------------------------------------------
// step5 ExecCommand receives correct binary
// --------------------------------------------------------------------------

func TestStep5LintStaged_CallsNpxLintStaged(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	_ = step5LintStaged(t.TempDir(), d)
	if len(rec.calls) == 0 || rec.calls[0][0] != "npx" {
		t.Errorf("expected npx call, got: %v", rec.calls)
	}
}

// --------------------------------------------------------------------------
// Verify step 1 skip message for .opencode/ prefix
// --------------------------------------------------------------------------

func TestStep1Config_SkipWhenUnrelatedFiles(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step1Config(t.TempDir(), []string{"apps/foo/main.go", "README.md"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !strings.Contains(out.String(), "Skipping config validation") {
		t.Errorf("expected skip message, got: %s", out.String())
	}
}

// --------------------------------------------------------------------------
// step6: git add is called after formatting
// --------------------------------------------------------------------------

func TestStep6ElixirFormat_GitAddCalledAfterFormat(t *testing.T) {
	tmp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmp, "apps", "myapp"), 0755); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		return "apps/myapp", true
	}
	rec := &recordingExec{}
	d.ExecCommand = rec.exec

	_ = step6ElixirFormat(tmp, []string{"apps/myapp/lib/foo.ex"}, d)

	gitAdded := false
	for _, c := range rec.calls {
		if c[0] == "git" && len(c) >= 2 && c[1] == "add" {
			gitAdded = true
		}
	}
	if !gitAdded {
		t.Errorf("expected git add to be called; calls: %v", rec.calls)
	}
}

// --------------------------------------------------------------------------
// Run: step 2 fail stops execution
// --------------------------------------------------------------------------

func TestRun_Step2DockerComposeFails_ReturnsError(t *testing.T) {
	tmp := t.TempDir()
	// Create compose file on disk.
	if err := os.WriteFile(filepath.Join(tmp, "docker-compose.yml"), []byte("v: '3'"), 0644); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.GetStagedFiles = func(_ string) ([]string, error) {
		return []string{"docker-compose.yml"}, nil
	}
	d.ExecCommand = func(name string, args ...string) *exec.Cmd {
		if name == "docker" {
			return exec.Command("false")
		}
		return exec.Command("true")
	}
	err := Run(tmp, d)
	if err == nil || !strings.Contains(err.Error(), "docker compose") {
		t.Fatalf("expected docker compose error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// Run: step 9 fail
// --------------------------------------------------------------------------

func TestRun_Step9LintMarkdownFails_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = func(name string, args ...string) *exec.Cmd {
		if name == "npm" {
			return exec.Command("false")
		}
		return exec.Command("true")
	}
	err := Run(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "markdown linting") {
		t.Fatalf("expected markdown linting error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step6: ExcludesDepsAndBuild with mixed valid/invalid files
// --------------------------------------------------------------------------

func TestStep6ElixirFormat_MixedFiles_OnlyValidFilesFormatted(t *testing.T) {
	tmp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmp, "apps", "myapp"), 0755); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		if strings.Contains(file, "deps/") || strings.Contains(file, "_build/") {
			// Should not be called for excluded files.
			return "", false
		}
		return "apps/myapp", true
	}
	rec := &recordingExec{}
	d.ExecCommand = rec.exec

	staged := []string{
		"apps/myapp/lib/good.ex",
		"apps/myapp/deps/lib/excluded.ex",
	}
	err := step6ElixirFormat(tmp, staged, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// mix should be called once (for the good file only).
	mixCalls := 0
	for _, c := range rec.calls {
		if c[0] == "mix" {
			mixCalls++
		}
	}
	if mixCalls != 1 {
		t.Errorf("expected 1 mix call, got %d; calls: %v", mixCalls, rec.calls)
	}
}

// --------------------------------------------------------------------------
// findMixRootDefault: stops at "." (relative root)
// --------------------------------------------------------------------------

func TestFindMixRootDefault_StopsAtDot(t *testing.T) {
	tmp := t.TempDir()
	// File at project root (dir is ".").
	_, ok := findMixRootDefault("foo.exs", tmp)
	if ok {
		t.Error("expected not found for file at root level")
	}
}

// --------------------------------------------------------------------------
// step2: uses both yml and yaml in same run
// --------------------------------------------------------------------------

func TestStep2DockerCompose_BothExtensions_Detected(t *testing.T) {
	tmp := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmp, "docker-compose.yml"), []byte("v: '3'"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "docker-compose.yaml"), []byte("v: '3'"), 0644); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	err := step2DockerCompose(tmp, []string{"docker-compose.yml", "docker-compose.yaml"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// defaultGetStagedFiles: direct tests
// --------------------------------------------------------------------------

func TestDefaultGetStagedFiles_EmptyStaged_ReturnsNil(t *testing.T) {
	tmp := t.TempDir()
	cmd := exec.Command("git", "init", tmp)
	if err := cmd.Run(); err != nil {
		t.Skip("git not available in test environment")
	}
	files, err := defaultGetStagedFiles(tmp)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if files != nil {
		t.Errorf("expected nil for empty staged, got: %v", files)
	}
}

func TestDefaultGetStagedFiles_NotGitRepo_ReturnsError(t *testing.T) {
	tmp := t.TempDir()
	// Not a git repo → git diff --cached exits non-zero.
	_, err := defaultGetStagedFiles(tmp)
	if err == nil {
		t.Fatal("expected error when not in a git repository")
	}
}

func TestDefaultGetStagedFiles_StagedFile_ReturnsFileName(t *testing.T) {
	tmp := t.TempDir()
	if err := exec.Command("git", "init", tmp).Run(); err != nil {
		t.Skip("git not available")
	}
	_ = exec.Command("git", "-C", tmp, "config", "user.email", "t@test.com").Run()
	_ = exec.Command("git", "-C", tmp, "config", "user.name", "Test").Run()
	// Stage a file.
	testFile := filepath.Join(tmp, "hello.txt")
	if err := os.WriteFile(testFile, []byte("hi"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := exec.Command("git", "-C", tmp, "add", "hello.txt").Run(); err != nil {
		t.Fatal(err)
	}

	files, err := defaultGetStagedFiles(tmp)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(files) != 1 || files[0] != "hello.txt" {
		t.Errorf("expected [hello.txt], got: %v", files)
	}
}

// step6: verify filepath.Rel path for files in project subdir
func TestStep6ElixirFormat_RelPathPassedToMix(t *testing.T) {
	tmp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmp, "apps", "myapp"), 0755); err != nil {
		t.Fatal(err)
	}
	d := fakeDeps()
	d.FindMixRoot = func(file, _ string) (string, bool) {
		return "apps/myapp", true
	}
	var mixArgs []string
	d.ExecCommand = func(name string, args ...string) *exec.Cmd {
		if name == "mix" {
			mixArgs = args
		}
		return exec.Command("true")
	}

	_ = step6ElixirFormat(tmp, []string{"apps/myapp/lib/foo.ex"}, d)

	// mix format should receive the relative path "lib/foo.ex", not the full path.
	if len(mixArgs) < 2 {
		t.Fatalf("expected mix args, got: %v", mixArgs)
	}
	rel := mixArgs[1]
	if strings.Contains(rel, "apps/myapp/") {
		t.Errorf("expected relative path for mix, got: %q", rel)
	}
	expected := fmt.Sprintf("lib%cfoo.ex", filepath.Separator)
	if rel != expected {
		t.Errorf("expected %q, got %q", expected, rel)
	}
}
