package git

import (
	"bytes"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/docs"
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
		ValidateClaude: func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
			return &agents.ValidationResult{}, nil
		},
		SyncAll: func(_ agents.SyncOptions) (*agents.SyncResult, error) {
			return &agents.SyncResult{}, nil
		},
		ValidateSync: func(_ string) (*agents.ValidationResult, error) {
			return &agents.ValidationResult{}, nil
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
// step7ValidateLinks
// --------------------------------------------------------------------------

func TestStep7ValidateLinks_NoBrokenLinks_Passes(t *testing.T) {
	d := fakeDeps()
	err := step7ValidateLinks(t.TempDir(), d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep7ValidateLinks_BrokenLinksFound_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			BrokenLinks: []docs.BrokenLink{{SourceFile: "README.md", LinkText: "broken"}},
		}, nil
	}
	err := step7ValidateLinks(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "broken links") {
		t.Fatalf("expected broken links error, got: %v", err)
	}
}

func TestStep7ValidateLinks_ValidateLinksError_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return nil, errors.New("links error")
	}
	err := step7ValidateLinks(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "links error") {
		t.Fatalf("expected links error, got: %v", err)
	}
}

// --------------------------------------------------------------------------
// step8LintMarkdown
// --------------------------------------------------------------------------

func TestStep8LintMarkdown_Success(t *testing.T) {
	d := fakeDeps()
	if err := step8LintMarkdown(t.TempDir(), d); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestStep8LintMarkdown_Failure_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = failExec
	err := step8LintMarkdown(t.TempDir(), d)
	if err == nil || !strings.Contains(err.Error(), "markdown linting failed") {
		t.Fatalf("expected markdown linting error, got: %v", err)
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

func TestRun_Step5Fails_DoesNotRunStep6DocsNaming(t *testing.T) {
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
	d.GetStagedFiles = func(_ string) ([]string, error) {
		return []string{"docs/tutorials/getting-started.md"}, nil
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

func TestStep8LintMarkdown_CallsNpmRun(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	_ = step8LintMarkdown(t.TempDir(), d)
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
// step7ValidateLinks: stderr output on broken links
// --------------------------------------------------------------------------

func TestStep7ValidateLinks_BrokenLinks_WritesToStderr(t *testing.T) {
	d := fakeDeps()
	errBuf := &bytes.Buffer{}
	d.Stderr = errBuf
	d.ValidateLinks = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			BrokenLinks: []docs.BrokenLink{{SourceFile: "a.md", LinkText: "bad"}},
		}, nil
	}
	_ = step7ValidateLinks(t.TempDir(), d)
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
// Run: step 8 fail
// --------------------------------------------------------------------------

func TestRun_Step8LintMarkdownFails_ReturnsError(t *testing.T) {
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

// --------------------------------------------------------------------------
// step5bSyncLockfiles
// --------------------------------------------------------------------------

func TestStep5bSyncLockfiles_NoPackageJsonStaged_Noop(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	err := step5bSyncLockfiles(t.TempDir(), []string{"README.md", "apps/foo/src/main.ts"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	// No output when nothing to sync.
	if strings.Contains(out.String(), "Syncing") {
		t.Error("expected no sync message when no package.json staged")
	}
}

func TestStep5bSyncLockfiles_PackageJsonStagedButNoLockfile_Noop(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	tmpDir := t.TempDir()

	// Create apps/myapp/package.json but NO package-lock.json.
	appDir := filepath.Join(tmpDir, "apps", "myapp")
	_ = os.MkdirAll(appDir, 0o755)
	_ = os.WriteFile(filepath.Join(appDir, "package.json"), []byte("{}"), 0o644)

	err := step5bSyncLockfiles(tmpDir, []string{"apps/myapp/package.json"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if strings.Contains(out.String(), "Syncing") {
		t.Error("expected no sync message when no lockfile exists")
	}
}

func TestStep5bSyncLockfiles_PackageJsonStagedWithLockfile_RegeneratesAndStages(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	out := &bytes.Buffer{}
	d.Stdout = out
	tmpDir := t.TempDir()

	// Create apps/myapp/ with both package.json and package-lock.json.
	appDir := filepath.Join(tmpDir, "apps", "myapp")
	_ = os.MkdirAll(appDir, 0o755)
	_ = os.WriteFile(filepath.Join(appDir, "package.json"), []byte("{}"), 0o644)
	_ = os.WriteFile(filepath.Join(appDir, "package-lock.json"), []byte("{}"), 0o644)

	err := step5bSyncLockfiles(tmpDir, []string{"apps/myapp/package.json"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Verify npm install --package-lock-only was called.
	foundNpm := false
	for _, call := range rec.calls {
		if len(call) >= 3 && call[0] == "npm" && call[1] == "install" && call[2] == "--package-lock-only" {
			foundNpm = true
		}
	}
	if !foundNpm {
		t.Error("expected npm install --package-lock-only to be called")
	}

	// Verify git add was called for the lockfile.
	foundGitAdd := false
	for _, call := range rec.calls {
		if len(call) >= 3 && call[0] == "git" && call[1] == "add" {
			if strings.Contains(call[2], "package-lock.json") {
				foundGitAdd = true
			}
		}
	}
	if !foundGitAdd {
		t.Error("expected git add for package-lock.json to be called")
	}

	if !strings.Contains(out.String(), "✅ All app lockfiles synced") {
		t.Error("expected success message")
	}
}

func TestStep5bSyncLockfiles_NestedPackageJson_Ignored(t *testing.T) {
	d := fakeDeps()
	out := &bytes.Buffer{}
	d.Stdout = out
	tmpDir := t.TempDir()

	// Create deeply nested package.json (should be ignored — only direct apps/*/package.json).
	nestedDir := filepath.Join(tmpDir, "apps", "myapp", "subdir")
	_ = os.MkdirAll(nestedDir, 0o755)
	_ = os.WriteFile(filepath.Join(nestedDir, "package.json"), []byte("{}"), 0o644)
	_ = os.WriteFile(filepath.Join(nestedDir, "package-lock.json"), []byte("{}"), 0o644)

	err := step5bSyncLockfiles(tmpDir, []string{"apps/myapp/subdir/package.json"}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if strings.Contains(out.String(), "Syncing") {
		t.Error("expected no sync for nested package.json")
	}
}

func TestStep5bSyncLockfiles_NpmFails_ReturnsError(t *testing.T) {
	d := fakeDeps()
	d.ExecCommand = failExec
	d.Stdout = &bytes.Buffer{}
	d.Stderr = &bytes.Buffer{}
	tmpDir := t.TempDir()

	appDir := filepath.Join(tmpDir, "apps", "myapp")
	_ = os.MkdirAll(appDir, 0o755)
	_ = os.WriteFile(filepath.Join(appDir, "package.json"), []byte("{}"), 0o644)
	_ = os.WriteFile(filepath.Join(appDir, "package-lock.json"), []byte("{}"), 0o644)

	err := step5bSyncLockfiles(tmpDir, []string{"apps/myapp/package.json"}, d)
	if err == nil {
		t.Fatal("expected error when npm fails")
	}
	if !strings.Contains(err.Error(), "failed to regenerate package-lock.json") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestStep5bSyncLockfiles_MultipleApps_AllSynced(t *testing.T) {
	rec := &recordingExec{}
	d := fakeDeps()
	d.ExecCommand = rec.exec
	out := &bytes.Buffer{}
	d.Stdout = out
	tmpDir := t.TempDir()

	// Create two apps with lockfiles.
	for _, app := range []string{"app-a", "app-b"} {
		appDir := filepath.Join(tmpDir, "apps", app)
		_ = os.MkdirAll(appDir, 0o755)
		_ = os.WriteFile(filepath.Join(appDir, "package.json"), []byte("{}"), 0o644)
		_ = os.WriteFile(filepath.Join(appDir, "package-lock.json"), []byte("{}"), 0o644)
	}

	err := step5bSyncLockfiles(tmpDir, []string{
		"apps/app-a/package.json",
		"apps/app-b/package.json",
	}, d)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Count npm install calls — should be 2.
	npmCalls := 0
	for _, call := range rec.calls {
		if len(call) >= 3 && call[0] == "npm" && call[1] == "install" {
			npmCalls++
		}
	}
	if npmCalls != 2 {
		t.Errorf("expected 2 npm install calls, got %d", npmCalls)
	}
}
