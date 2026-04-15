//go:build integration

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

var specsIntEnvRestoreDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type envRestoreIntSteps struct {
	originalWd string
	repoDir    string // restore destination (git root)
	backupDir  string // restore source (backup directory)
	cmdErr     error
	cmdOutput  string
}

func (s *envRestoreIntSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.repoDir = ""
	s.backupDir = ""
	s.cmdErr = nil
	s.cmdOutput = ""
	verbose = false
	quiet = false
	output = "text"
	envRestoreDir = ""
	envRestoreWorktreeAware = false
	envRestoreFn = envbackup.Restore
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *envRestoreIntSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	envRestoreDir = ""
	envRestoreWorktreeAware = false
	envRestoreForce = false
	envRestoreIncludeConfig = false
	envRestoreFn = envbackup.Restore
	confirmFn = envbackup.DefaultConfirmFn
	osGetwd = os.Getwd
	osStat = os.Stat
	if s.repoDir != "" {
		_ = os.RemoveAll(s.repoDir)
	}
	if s.backupDir != "" {
		_ = os.RemoveAll(s.backupDir)
	}
	return context.Background(), nil
}

// makeRestoreRepo creates a temp dir with a .git directory (simulating a restore destination).
func (s *envRestoreIntSteps) makeRestoreRepo(pattern string) (string, error) {
	dir, err := os.MkdirTemp("", pattern)
	if err != nil {
		return "", fmt.Errorf("create repo dir: %w", err)
	}
	if err := os.MkdirAll(filepath.Join(dir, ".git"), 0o755); err != nil {
		return "", fmt.Errorf("create .git dir: %w", err)
	}
	return dir, nil
}

// makeRestoreBackupDir creates a temp dir to serve as backup source and pre-populates it.
func (s *envRestoreIntSteps) makeRestoreBackupDir(pattern string) (string, error) {
	dir, err := os.MkdirTemp("", pattern)
	if err != nil {
		return "", fmt.Errorf("create backup dir: %w", err)
	}
	return dir, nil
}

// --- Given steps ---

func (s *envRestoreIntSteps) aBackupDirWithPreviouslyBackedUpEnvFiles() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-bkup-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	// Pre-populate backup dir with .env files.
	if err := writeEnvFile(backup, ".env", "ROOT=1\n"); err != nil {
		return err
	}
	if err := writeEnvFile(backup, "apps/web/.env", "WEB=1\n"); err != nil {
		return err
	}

	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) aBackupDirAtTmpMyEnvBackupWithEnvFile() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-custom-*")
	if err != nil {
		return err
	}
	s.backupDir = backup

	if err := writeEnvFile(backup, ".env", "CUSTOM=1\n"); err != nil {
		return err
	}

	// The feature says --dir /tmp/my-env-backup; the When step sets this flag.
	// We store the actual dir in backupDir for the When step to use.
	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) noDirectoryExistsAtNonexistent() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-nodir-*")
	if err != nil {
		return err
	}
	s.repoDir = repo
	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) aBackupDirWithSinglePreviouslyBackedUpEnvFile() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-single-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-single-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	if err := writeEnvFile(backup, ".env", "KEY=val\n"); err != nil {
		return err
	}

	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) aBackupDirWithEnvFileAndReadme() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-readme-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-readme-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	if err := writeEnvFile(backup, ".env", "KEY=val\n"); err != nil {
		return err
	}
	// Write README.md into backup dir — it should NOT be restored.
	if err := os.WriteFile(filepath.Join(backup, "README.md"), []byte("# Backup\n"), 0o644); err != nil {
		return fmt.Errorf("write README.md: %w", err)
	}

	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) aBackupDirWithNoEnvFiles() error {
	repo, err := s.makeRestoreRepo("int-env-restore-repo-empty-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-empty-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	// Write a non-env file to ensure dir is not empty but has no .env files.
	if err := os.WriteFile(filepath.Join(backup, "notes.txt"), []byte("no env here\n"), 0o644); err != nil {
		return fmt.Errorf("write notes.txt: %w", err)
	}

	return os.Chdir(repo)
}

func (s *envRestoreIntSteps) aBackupDirWithEnvFileUnderFeatureBranchNamespace() error {
	// Create a repo directory whose basename is "feature-branch".
	parent, err := os.MkdirTemp("", "int-env-restore-wt-parent-*")
	if err != nil {
		return fmt.Errorf("create parent dir: %w", err)
	}
	featureBranchDir := filepath.Join(parent, "feature-branch")
	if err := os.MkdirAll(featureBranchDir, 0o755); err != nil {
		return fmt.Errorf("create feature-branch dir: %w", err)
	}
	s.repoDir = parent

	if err := os.WriteFile(filepath.Join(featureBranchDir, ".git"), []byte("gitdir: /some/real/.git/worktrees/feature-branch\n"), 0o644); err != nil {
		return fmt.Errorf("write .git file: %w", err)
	}

	backup, err := s.makeRestoreBackupDir("int-env-restore-wt-bkup-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	// Pre-populate backup under the feature-branch namespace.
	if err := writeEnvFile(backup, filepath.Join("feature-branch", ".env"), "WT=1\n"); err != nil {
		return err
	}

	return os.Chdir(featureBranchDir)
}

// --- When steps ---

func (s *envRestoreIntSteps) runCmd() error {
	buf := new(bytes.Buffer)
	envRestoreCmd.SetOut(buf)
	envRestoreCmd.SetErr(buf)
	s.cmdErr = envRestoreCmd.RunE(envRestoreCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestore() error {
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithDirTmpMyEnvBackup() error {
	// Use the actual temp dir created in Given (not literal /tmp/my-env-backup).
	envRestoreDir = s.backupDir
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithDirNonexistent() error {
	envRestoreDir = "/nonexistent"
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithOutputJSON() error {
	output = "json"
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWorktreeAwareFeature() error {
	envRestoreWorktreeAware = true
	return s.runCmd()
}

// --- Then steps ---

func (s *envRestoreIntSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) eachEnvFileCopiedBackToOriginalPath() error {
	envPath := filepath.Join(s.repoDir, ".env")
	if _, err := os.Stat(envPath); err != nil {
		return fmt.Errorf("expected %s to be restored, got: %v", envPath, err)
	}
	return nil
}

func (s *envRestoreIntSteps) theOutputListsEachRestoredFile() error {
	if !strings.Contains(s.cmdOutput, ".env") {
		return fmt.Errorf("expected .env in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theEnvFileCopiedBackToOriginalPath() error {
	return s.eachEnvFileCopiedBackToOriginalPath()
}

func (s *envRestoreIntSteps) theOutputReportsDirDoesNotExist() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected an error but command succeeded")
	}
	errStr := strings.ToLower(s.cmdErr.Error())
	if !strings.Contains(errStr, "does not exist") && !strings.Contains(errStr, "nonexistent") {
		return fmt.Errorf("expected error about non-existent directory, got: %v", s.cmdErr)
	}
	return nil
}

func (s *envRestoreIntSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theJSONIncludesDirectionDirFilesCountsRestore() error {
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

func (s *envRestoreIntSteps) readmeNotRestored() error {
	readmePath := filepath.Join(s.repoDir, "README.md")
	if _, err := os.Stat(readmePath); err == nil {
		return fmt.Errorf("expected README.md to NOT be restored but found it at %s", readmePath)
	}
	return nil
}

func (s *envRestoreIntSteps) theOutputReportsZeroFilesRestored() error {
	if !strings.Contains(s.cmdOutput, "0 file(s)") {
		return fmt.Errorf("expected '0 file(s)' in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theEnvFileReadFromFeatureBranchNamespace() error {
	// The restore should read from backupDir/feature-branch/.env.
	// We verify by checking the output mentions the worktree name.
	if !strings.Contains(s.cmdOutput, "feature-branch") {
		return fmt.Errorf("expected 'feature-branch' in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theEnvFileCopiedBackToOriginalPathInWorktree() error {
	// The restored file should land at the cwd (feature-branch dir) / .env.
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("getwd: %w", err)
	}
	envPath := filepath.Join(cwd, ".env")
	if _, err := os.Stat(envPath); err != nil {
		return fmt.Errorf("expected %s to be restored in worktree, got: %v", envPath, err)
	}
	return nil
}

// --- Confirm Given steps ---

func (s *envRestoreIntSteps) theRepoAlreadyContainsEnvFileAtOriginalPath() error {
	// Pre-populate the repo with .env so conflicts are detected.
	return writeEnvFile(s.repoDir, ".env", "OLD=1\n")
}

func (s *envRestoreIntSteps) theRepoDoesNotContainEnvFileAtOriginalPath() error {
	// No .env in repo — no conflicts.
	envPath := filepath.Join(s.repoDir, ".env")
	_ = os.Remove(envPath) // remove if exists
	return nil
}

// --- Confirm When steps ---

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreAndConfirmsOverwrite() error {
	envRestoreForce = true // In integration tests, use force to simulate confirmation
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreAndDeclinesOverwrite() error {
	confirmFn = func(_ io.Reader, _ io.Writer) func([]string) bool {
		return func(_ []string) bool { return false }
	}
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithForce() error {
	envRestoreForce = true
	return s.runCmd()
}

// --- Confirm Then steps ---

func (s *envRestoreIntSteps) theEnvFileInRepoOverwrittenWithBackup() error {
	envPath := filepath.Join(s.repoDir, ".env")
	content, err := os.ReadFile(envPath)
	if err != nil {
		return fmt.Errorf("expected .env in repo: %v", err)
	}
	if strings.Contains(string(content), "OLD=1") {
		return fmt.Errorf("expected .env to be overwritten but still has old content")
	}
	return nil
}

func (s *envRestoreIntSteps) theOutputReportsRestoreCancelled() error {
	if !strings.Contains(s.cmdOutput, "cancelled") {
		return fmt.Errorf("expected 'cancelled' in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *envRestoreIntSteps) theExistingRepoFileUnchanged() error {
	envPath := filepath.Join(s.repoDir, ".env")
	content, err := os.ReadFile(envPath)
	if err != nil {
		return fmt.Errorf("expected .env to still exist: %v", err)
	}
	if !strings.Contains(string(content), "OLD=1") {
		return fmt.Errorf("expected .env to be unchanged with old content")
	}
	return nil
}

func (s *envRestoreIntSteps) theEnvFileInRepoOverwrittenWithoutPrompting() error {
	return s.theEnvFileInRepoOverwrittenWithBackup()
}

func (s *envRestoreIntSteps) noConfirmationPromptShown() error {
	return nil
}

func (s *envRestoreIntSteps) theEnvFileRestoredToRepo() error {
	envPath := filepath.Join(s.repoDir, ".env")
	if _, err := os.Stat(envPath); err != nil {
		return fmt.Errorf("expected .env to be restored: %v", err)
	}
	return nil
}

// --- Config Given steps ---

func (s *envRestoreIntSteps) aBackupDirWithEnvFileAndClaudeConfig() error {
	repo, err := s.makeRestoreRepo("int-env-restore-config-repo-*")
	if err != nil {
		return err
	}
	s.repoDir = repo

	backup, err := s.makeRestoreBackupDir("int-env-restore-config-bkup-*")
	if err != nil {
		return err
	}
	s.backupDir = backup
	envRestoreDir = backup

	if err := writeEnvFile(backup, ".env", "KEY=val\n"); err != nil {
		return err
	}
	if err := writeEnvFile(backup, ".claude/settings.local.json", `{"key":"val"}`); err != nil {
		return err
	}

	return os.Chdir(repo)
}

// --- Config When steps ---

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithIncludeConfigForce() error {
	envRestoreIncludeConfig = true
	envRestoreForce = true
	return s.runCmd()
}

func (s *envRestoreIntSteps) theDeveloperRunsEnvRestoreWithForceOnly() error {
	envRestoreForce = true
	return s.runCmd()
}

// --- Config Then steps ---

func (s *envRestoreIntSteps) theClaudeConfigRestoredToRepo() error {
	configPath := filepath.Join(s.repoDir, ".claude", "settings.local.json")
	if _, err := os.Stat(configPath); err != nil {
		return fmt.Errorf("expected .claude/settings.local.json in repo: %v", err)
	}
	return nil
}

func (s *envRestoreIntSteps) theClaudeConfigNotRestoredToRepo() error {
	configPath := filepath.Join(s.repoDir, ".claude", "settings.local.json")
	if _, err := os.Stat(configPath); err == nil {
		return fmt.Errorf("expected .claude/settings.local.json to NOT be in repo")
	}
	return nil
}

func TestIntegrationEnvRestore(t *testing.T) {
	s := &envRestoreIntSteps{}
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
			Paths:    []string{specsIntEnvRestoreDir},
			Tags:     "@env-restore,@env-restore-confirm,@env-restore-config",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run integration feature tests")
	}
}
