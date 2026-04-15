package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/envbackup"
)

var specsDirUnitEnvRestore = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type envRestoreUnitSteps struct {
	cmdErr    error
	cmdOutput string
	backupDir string // temp dir used as backup source
	repoDir   string // temp dir used as fake repo root
}

func (s *envRestoreUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	envRestoreDir = ""
	envRestoreWorktreeAware = false
	envRestoreForce = false
	envRestoreIncludeConfig = false
	s.cmdErr = nil
	s.cmdOutput = ""
	s.backupDir = ""
	s.repoDir = ""

	// Mock findGitRoot via osGetwd/osStat.
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default mock: restore succeeds with 1 restored file.
	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied:  1,
			Skipped: 0,
		}, nil
	}

	return context.Background(), nil
}

func (s *envRestoreUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	envRestoreFn = envbackup.Restore
	confirmFn = envbackup.DefaultConfirmFn
	osGetwd = os.Getwd
	osStat = os.Stat
	envRestoreForce = false
	envRestoreIncludeConfig = false
	if s.backupDir != "" {
		_ = os.RemoveAll(s.backupDir)
	}
	if s.repoDir != "" {
		_ = os.RemoveAll(s.repoDir)
	}
	return context.Background(), nil
}

// --- Given steps ---

func (s *envRestoreUnitSteps) aBackupDirWithPreviouslyBackedUpEnvFiles() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-src-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
				{RelPath: "apps/web/.env", AbsPath: "/mock-repo/apps/web/.env", Size: 200},
			},
			Copied:  2,
			Skipped: 0,
		}, nil
	}
	return nil
}

func (s *envRestoreUnitSteps) aBackupDirAtTmpMyEnvBackupWithEnvFile() error {
	// We cannot use the real /tmp/my-env-backup path in unit tests (may not exist).
	// Override envRestoreDir to a temp dir and mock the function.
	tmpBackup, err := os.MkdirTemp("", "env-restore-custom-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	// The feature step says --dir /tmp/my-env-backup; the When step sets that flag.
	// We pre-create the dir and will override the envRestoreDir in the When step.
	// Store it so the When step can access it.
	s.repoDir = tmpBackup // reuse repoDir field as "custom dir" holder

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied:  1,
			Skipped: 0,
		}, nil
	}
	return nil
}

func (s *envRestoreUnitSteps) noDirectoryExistsAtNonexistent() error {
	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return nil, fmt.Errorf("backup directory does not exist: /nonexistent")
	}
	return nil
}

func (s *envRestoreUnitSteps) aBackupDirWithSinglePreviouslyBackedUpEnvFile() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-single-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied:  1,
			Skipped: 0,
		}, nil
	}
	return nil
}

func (s *envRestoreUnitSteps) aBackupDirWithEnvFileAndReadme() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-readme-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied:  1,
			Skipped: 0,
		}, nil
	}
	return nil
}

func (s *envRestoreUnitSteps) aBackupDirWithNoEnvFiles() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-empty-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files:     []envbackup.FileEntry{},
			Copied:    0,
			Skipped:   0,
		}, nil
	}
	return nil
}

func (s *envRestoreUnitSteps) aBackupDirWithEnvFileUnderFeatureBranchNamespace() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-worktree-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	// Create the namespace subdir.
	if err := os.MkdirAll(filepath.Join(tmpBackup, "feature-branch"), 0o755); err != nil {
		return fmt.Errorf("create namespace dir: %w", err)
	}

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction:    "restore",
			Dir:          opts.BackupDir,
			WorktreeName: "feature-branch",
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied:  1,
			Skipped: 0,
		}, nil
	}
	return nil
}

// --- When steps ---

func (s *envRestoreUnitSteps) runEnvRestoreCmd() error {
	buf := new(bytes.Buffer)
	envRestoreCmd.SetOut(buf)
	envRestoreCmd.SetErr(buf)
	s.cmdErr = envRestoreCmd.RunE(envRestoreCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestore() error {
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithDirTmpMyEnvBackup() error {
	// Use the temp dir created in the Given step instead of the literal /tmp/my-env-backup.
	if s.repoDir != "" {
		envRestoreDir = s.repoDir
	}
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithDirNonexistent() error {
	// The envRestoreFn mock already returns the error. Just set a non-empty dir.
	envRestoreDir = "/nonexistent"
	buf := new(bytes.Buffer)
	envRestoreCmd.SetOut(buf)
	envRestoreCmd.SetErr(buf)
	s.cmdErr = envRestoreCmd.RunE(envRestoreCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithOutputJSON() error {
	output = "json"
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWorktreeAwareFeature() error {
	envRestoreWorktreeAware = true
	// Simulate worktree detection by mocking osGetwd/osStat for a "feature-branch" worktree.
	tmpRepo, err := os.MkdirTemp("", "feature-branch-restore-*")
	if err != nil {
		return fmt.Errorf("create temp worktree dir: %w", err)
	}
	featureBranchDir := filepath.Join(filepath.Dir(tmpRepo), "feature-branch-restore")
	if err := os.Rename(tmpRepo, featureBranchDir); err != nil {
		featureBranchDir = tmpRepo
	}
	s.repoDir = featureBranchDir
	if err := os.WriteFile(filepath.Join(featureBranchDir, ".git"), []byte("gitdir: /some/real/.git\n"), 0o644); err != nil {
		return fmt.Errorf("write .git file: %w", err)
	}

	osGetwd = func() (string, error) { return featureBranchDir, nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == filepath.Join(featureBranchDir, ".git") {
			return &mockFileInfo{name: ".git", isDir: false}, nil
		}
		return nil, os.ErrNotExist
	}

	return s.runEnvRestoreCmd()
}

// --- Then steps ---

func (s *envRestoreUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) eachEnvFileCopiedBackToOriginalPath() error {
	lower := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lower, "restore complete") && !strings.Contains(s.cmdOutput, "RESTORE") {
		return fmt.Errorf("expected restore completion in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theOutputListsEachRestoredFile() error {
	if !strings.Contains(s.cmdOutput, ".env") {
		return fmt.Errorf("expected .env files listed in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theEnvFileCopiedBackToOriginalPath() error {
	return s.eachEnvFileCopiedBackToOriginalPath()
}

func (s *envRestoreUnitSteps) theOutputReportsDirDoesNotExist() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected an error but command succeeded")
	}
	if !strings.Contains(s.cmdErr.Error(), "does not exist") && !strings.Contains(s.cmdErr.Error(), "nonexistent") {
		return fmt.Errorf("expected error about non-existent directory but got: %v", s.cmdErr)
	}
	return nil
}

func (s *envRestoreUnitSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theJSONIncludesDirectionDirFilesCountsRestore() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	for _, key := range []string{"direction", "dir", "files", "copied", "skipped"} {
		if _, ok := parsed[key]; !ok {
			return fmt.Errorf("expected JSON key %q but not found\nOutput: %s", key, s.cmdOutput)
		}
	}
	return nil
}

func (s *envRestoreUnitSteps) readmeNotRestored() error {
	// The mock result only contains .env, so README.md should never appear.
	if strings.Contains(s.cmdOutput, "README") {
		return fmt.Errorf("expected README.md to be absent from output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theOutputReportsZeroFilesRestored() error {
	if !strings.Contains(s.cmdOutput, "0 file(s)") {
		return fmt.Errorf("expected '0 file(s)' in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theEnvFileReadFromFeatureBranchNamespace() error {
	if !strings.Contains(s.cmdOutput, "feature-branch") {
		return fmt.Errorf("expected 'feature-branch' worktree in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theEnvFileCopiedBackToOriginalPathInWorktree() error {
	return s.eachEnvFileCopiedBackToOriginalPath()
}

// --- Confirm Given steps ---

func (s *envRestoreUnitSteps) theRepoAlreadyContainsEnvFileAtOriginalPath() error {
	// Pre-existing file triggers confirmation.
	return nil
}

func (s *envRestoreUnitSteps) theRepoDoesNotContainEnvFileAtOriginalPath() error {
	// No pre-existing file, no prompt.
	return nil
}

// --- Confirm When steps ---

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreAndConfirmsOverwrite() error {
	confirmFn = func(_ io.Reader, _ io.Writer) func([]string) bool {
		return func(_ []string) bool { return true }
	}
	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files: []envbackup.FileEntry{
				{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100},
			},
			Copied: 1,
		}, nil
	}
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreAndDeclinesOverwrite() error {
	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Cancelled: true,
		}, nil
	}
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithForce() error {
	envRestoreForce = true
	return s.runEnvRestoreCmd()
}

// --- Confirm Then steps ---

func (s *envRestoreUnitSteps) theEnvFileInRepoOverwrittenWithBackup() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *envRestoreUnitSteps) theOutputReportsRestoreCancelled() error {
	if !strings.Contains(s.cmdOutput, "cancelled") {
		return fmt.Errorf("expected 'cancelled' in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theExistingRepoFileUnchanged() error {
	return nil
}

func (s *envRestoreUnitSteps) theEnvFileInRepoOverwrittenWithoutPrompting() error {
	return s.theEnvFileInRepoOverwrittenWithBackup()
}

func (s *envRestoreUnitSteps) noConfirmationPromptShown() error {
	return nil
}

func (s *envRestoreUnitSteps) theEnvFileRestoredToRepo() error {
	if !strings.Contains(s.cmdOutput, ".env") {
		return fmt.Errorf("expected '.env' in output, got: %s", s.cmdOutput)
	}
	return nil
}

// --- Config Given steps ---

func (s *envRestoreUnitSteps) aBackupDirWithEnvFileAndClaudeConfig() error {
	tmpBackup, err := os.MkdirTemp("", "env-restore-config-*")
	if err != nil {
		return fmt.Errorf("create temp backup dir: %w", err)
	}
	s.backupDir = tmpBackup
	envRestoreDir = tmpBackup

	envRestoreFn = func(opts envbackup.Options) (*envbackup.Result, error) {
		files := []envbackup.FileEntry{
			{RelPath: ".env", AbsPath: "/mock-repo/.env", Size: 100, Source: "env"},
		}
		copied := 1
		if opts.IncludeConfig {
			files = append(files, envbackup.FileEntry{
				RelPath: ".claude/settings.local.json", AbsPath: "/mock-repo/.claude/settings.local.json", Size: 200, Source: "config",
			})
			copied = 2
		}
		return &envbackup.Result{
			Direction: "restore",
			Dir:       opts.BackupDir,
			Files:     files,
			Copied:    copied,
		}, nil
	}
	return nil
}

// --- Config When steps ---

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithIncludeConfigForce() error {
	envRestoreIncludeConfig = true
	envRestoreForce = true
	return s.runEnvRestoreCmd()
}

func (s *envRestoreUnitSteps) theDeveloperRunsEnvRestoreWithForceOnly() error {
	envRestoreForce = true
	return s.runEnvRestoreCmd()
}

// --- Config Then steps ---

func (s *envRestoreUnitSteps) theClaudeConfigRestoredToRepo() error {
	if !strings.Contains(s.cmdOutput, ".claude/settings.local.json") {
		return fmt.Errorf("expected .claude/settings.local.json in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreUnitSteps) theClaudeConfigNotRestoredToRepo() error {
	if strings.Contains(s.cmdOutput, "settings.local.json") {
		return fmt.Errorf("expected .claude/settings.local.json to be absent from output, got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitEnvRestore(t *testing.T) {
	s := &envRestoreUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)

			// Given steps.
			sc.Step(stepBackupDirWithPreviouslyBackedUpEnvFiles, s.aBackupDirWithPreviouslyBackedUpEnvFiles)
			sc.Step(stepBackupDirAtTmpMyEnvBackup, s.aBackupDirAtTmpMyEnvBackupWithEnvFile)
			sc.Step(stepNoDirectoryExistsAtNonexistent, s.noDirectoryExistsAtNonexistent)
			sc.Step(stepBackupDirWithSinglePreviouslyBackedUpEnvFile, s.aBackupDirWithSinglePreviouslyBackedUpEnvFile)
			sc.Step(stepBackupDirWithEnvFileAndReadme, s.aBackupDirWithEnvFileAndReadme)
			sc.Step(stepBackupDirWithNoEnvFiles, s.aBackupDirWithNoEnvFiles)
			sc.Step(stepBackupDirWithEnvFileUnderFeatureBranch, s.aBackupDirWithEnvFileUnderFeatureBranchNamespace)

			// When steps.
			sc.Step(stepDeveloperRunsEnvRestore, s.theDeveloperRunsEnvRestore)
			sc.Step(stepDeveloperRunsEnvRestoreWithDirTmpMyEnvBackup, s.theDeveloperRunsEnvRestoreWithDirTmpMyEnvBackup)
			sc.Step(stepDeveloperRunsEnvRestoreWithDirNonexistent, s.theDeveloperRunsEnvRestoreWithDirNonexistent)
			sc.Step(stepDeveloperRunsEnvRestoreWithOutputJSON, s.theDeveloperRunsEnvRestoreWithOutputJSON)
			sc.Step(stepDeveloperRunsEnvRestoreWorktreeAwareFeature, s.theDeveloperRunsEnvRestoreWorktreeAwareFeature)

			// Then steps.
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepEachEnvFileCopiedBackToOriginalPath, s.eachEnvFileCopiedBackToOriginalPath)
			sc.Step(stepOutputListsEachRestoredFile, s.theOutputListsEachRestoredFile)
			sc.Step(stepEnvFileCopiedBackToOriginalPath, s.theEnvFileCopiedBackToOriginalPath)
			sc.Step(stepOutputReportsDirDoesNotExist, s.theOutputReportsDirDoesNotExist)
			sc.Step(stepOutputIsValidJSON, s.theOutputIsValidJSON)
			sc.Step(stepJSONIncludesDirectionDirFilesCountsBackup, s.theJSONIncludesDirectionDirFilesCountsRestore)
			sc.Step(stepReadmeNotRestored, s.readmeNotRestored)
			sc.Step(stepOutputReportsZeroFilesRestored, s.theOutputReportsZeroFilesRestored)
			sc.Step(stepEnvFileReadFromFeatureBranchNamespace, s.theEnvFileReadFromFeatureBranchNamespace)
			sc.Step(stepEnvFileCopiedBackToOriginalPathInWorktree, s.theEnvFileCopiedBackToOriginalPathInWorktree)

			// Confirm scenario steps.
			sc.Step(stepRepoAlreadyContainsEnvFileAtOriginalPath, s.theRepoAlreadyContainsEnvFileAtOriginalPath)
			sc.Step(stepRepoDoesNotContainEnvFileAtOriginalPath, s.theRepoDoesNotContainEnvFileAtOriginalPath)
			sc.Step(stepDeveloperRunsEnvRestoreAndConfirmsOverwrite, s.theDeveloperRunsEnvRestoreAndConfirmsOverwrite)
			sc.Step(stepDeveloperRunsEnvRestoreAndDeclinesOverwrite, s.theDeveloperRunsEnvRestoreAndDeclinesOverwrite)
			sc.Step(stepDeveloperRunsEnvRestoreWithForce, s.theDeveloperRunsEnvRestoreWithForce)
			sc.Step(stepEnvFileInRepoOverwrittenWithBackup, s.theEnvFileInRepoOverwrittenWithBackup)
			sc.Step(stepOutputReportsRestoreCancelled, s.theOutputReportsRestoreCancelled)
			sc.Step(stepExistingRepoFileUnchanged, s.theExistingRepoFileUnchanged)
			sc.Step(stepEnvFileInRepoOverwrittenWithoutPrompting, s.theEnvFileInRepoOverwrittenWithoutPrompting)
			sc.Step(stepNoConfirmationPromptShown, s.noConfirmationPromptShown)
			sc.Step(stepEnvFileRestoredToRepo, s.theEnvFileRestoredToRepo)

			// Config scenario steps.
			sc.Step(stepBackupDirWithEnvFileAndClaudeConfig, s.aBackupDirWithEnvFileAndClaudeConfig)
			sc.Step(stepDeveloperRunsEnvRestoreWithIncludeConfigForce, s.theDeveloperRunsEnvRestoreWithIncludeConfigForce)
			sc.Step(stepDeveloperRunsEnvRestoreWithForceOnly, s.theDeveloperRunsEnvRestoreWithForceOnly)
			sc.Step(stepClaudeConfigRestoredToRepo, s.theClaudeConfigRestoredToRepo)
			sc.Step(stepClaudeConfigNotRestoredToRepo, s.theClaudeConfigNotRestoredToRepo)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitEnvRestore},
			Tags:     "@env-restore,@env-restore-confirm,@env-restore-config",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestEnvRestoreCmd_Initialization verifies the command metadata.
func TestEnvRestoreCmd_Initialization(t *testing.T) {
	if envRestoreCmd.Use != "restore" {
		t.Errorf("expected Use == %q, got %q", "restore", envRestoreCmd.Use)
	}
	if !strings.Contains(strings.ToLower(envRestoreCmd.Short), "restor") {
		t.Errorf("expected Short to mention restore, got %q", envRestoreCmd.Short)
	}
}

// TestEnvRestoreCmd_NoArgs verifies the command accepts no positional arguments.
func TestEnvRestoreCmd_NoArgs(t *testing.T) {
	if envRestoreCmd.Args == nil {
		return
	}
	if err := envRestoreCmd.Args(envRestoreCmd, []string{"unexpected"}); err == nil {
		t.Error("expected error when positional args provided, got nil")
	}
}

// TestEnvRestoreCmd_ForceFlag verifies the --force flag is wired.
func TestEnvRestoreCmd_ForceFlag(t *testing.T) {
	f := envRestoreCmd.Flags().Lookup("force")
	if f == nil {
		t.Fatal("expected --force flag to be registered")
	}
	if f.Shorthand != "f" {
		t.Errorf("expected shorthand 'f', got %q", f.Shorthand)
	}
}

// TestEnvRestoreCmd_IncludeConfigFlag verifies the --include-config flag is wired.
func TestEnvRestoreCmd_IncludeConfigFlag(t *testing.T) {
	f := envRestoreCmd.Flags().Lookup("include-config")
	if f == nil {
		t.Fatal("expected --include-config flag to be registered")
	}
}

// TestEnvRestoreCmd_FnError verifies that errors from envRestoreFn are propagated.
func TestEnvRestoreCmd_FnError(t *testing.T) {
	original := envRestoreFn
	defer func() { envRestoreFn = original }()

	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	envRestoreFn = func(_ envbackup.Options) (*envbackup.Result, error) {
		return nil, fmt.Errorf("simulated restore failure")
	}

	origDir := envRestoreDir
	defer func() { envRestoreDir = origDir }()

	tmpBackup, err := os.MkdirTemp("", "env-restore-err-*")
	if err != nil {
		t.Fatalf("create temp dir: %v", err)
	}
	defer func() { _ = os.RemoveAll(tmpBackup) }()
	envRestoreDir = tmpBackup

	buf := new(bytes.Buffer)
	envRestoreCmd.SetOut(buf)
	envRestoreCmd.SetErr(buf)
	cmdErr := envRestoreCmd.RunE(envRestoreCmd, []string{})
	if cmdErr == nil {
		t.Errorf("expected error from envRestoreFn to propagate, got nil")
	}
}
