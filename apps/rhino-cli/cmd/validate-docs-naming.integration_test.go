//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
)

var specsDocsNamingDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/rhino-cli/docs")
}()

// Scenario: A docs directory with correctly named files passes validation
// Scenario: A file missing the required prefix separator fails validation
// Scenario: A file with the wrong prefix for its location fails validation
// Scenario: The --fix flag previews renames without modifying files
// Scenario: The --fix --apply flags rename files using git mv

type validateDocsNamingSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateDocsNamingSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-docs-naming-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	validateDocsNamingFix = false
	validateDocsNamingApply = false
	validateDocsNamingStagedOnly = false
	validateDocsNamingNoLinks = false
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateDocsNamingSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateDocsNamingSteps) aDocsDirWithValidFiles() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "docs", "tutorials"), 0755); err != nil {
		return err
	}
	return os.WriteFile(
		filepath.Join(s.tmpDir, "docs", "tutorials", "tu__getting-started.md"),
		[]byte("# Getting Started"),
		0644,
	)
}

func (s *validateDocsNamingSteps) aDocsDirWithMissingSeparator() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "docs", "tutorials"), 0755); err != nil {
		return err
	}
	return os.WriteFile(
		filepath.Join(s.tmpDir, "docs", "tutorials", "getting-started.md"),
		[]byte("# Getting Started"),
		0644,
	)
}

func (s *validateDocsNamingSteps) aDocsDirWithWrongPrefix() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "docs", "tutorials"), 0755); err != nil {
		return err
	}
	return os.WriteFile(
		filepath.Join(s.tmpDir, "docs", "tutorials", "wrong__my-guide.md"),
		[]byte("# My Guide"),
		0644,
	)
}

func (s *validateDocsNamingSteps) aDocsDirWithNamingViolations() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "docs", "tutorials"), 0755); err != nil {
		return err
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "docs", "tutorials", "wrong__my-guide.md"),
		[]byte("# My Guide"),
		0644,
	); err != nil {
		return err
	}
	// Initialize a real git repo so --fix --apply can use git mv
	_ = exec.Command("git", "init", s.tmpDir).Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.email", "t@test.com").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.name", "Test").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "add", ".").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "commit", "-m", "init").Run()
	return nil
}

func (s *validateDocsNamingSteps) runValidateDocsNaming() error {
	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)
	s.cmdErr = validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateDocsNamingSteps) runValidateDocsNamingWithFix() error {
	validateDocsNamingFix = true
	return s.runValidateDocsNaming()
}

func (s *validateDocsNamingSteps) runValidateDocsNamingWithFixAndApply() error {
	validateDocsNamingFix = true
	validateDocsNamingApply = true
	validateDocsNamingNoLinks = true
	return s.runValidateDocsNaming()
}

func (s *validateDocsNamingSteps) commandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed, got error: %v\noutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) commandExitsWithFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail, but it succeeded\noutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) outputReportsZeroViolations() error {
	if strings.Contains(s.cmdOutput, "violation") && !strings.Contains(s.cmdOutput, "0 violation") {
		return fmt.Errorf("expected zero violations in output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) outputIdentifiesNamingViolation() error {
	if !strings.Contains(s.cmdOutput, "getting-started.md") {
		return fmt.Errorf("expected output to identify 'getting-started.md', got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) outputReportsExpectedPrefixAlongsideActualFilename() error {
	if !strings.Contains(s.cmdOutput, "Wrong prefix") && !strings.Contains(s.cmdOutput, "tu") {
		return fmt.Errorf("expected output to report expected prefix, got: %s", s.cmdOutput)
	}
	if !strings.Contains(s.cmdOutput, "wrong__my-guide.md") {
		return fmt.Errorf("expected output to contain 'wrong__my-guide.md', got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) outputShowsPlannedRenames() error {
	if !strings.Contains(s.cmdOutput, "wrong__my-guide.md") && !strings.Contains(s.cmdOutput, "tu__") {
		return fmt.Errorf("expected output to show planned renames, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsNamingSteps) noFilesAreRenamedOnDisk() error {
	originalPath := filepath.Join(s.tmpDir, "docs", "tutorials", "wrong__my-guide.md")
	if _, err := os.Stat(originalPath); os.IsNotExist(err) {
		return fmt.Errorf("expected 'wrong__my-guide.md' to still exist on disk after dry-run")
	}
	return nil
}

func (s *validateDocsNamingSteps) filesAreRenamedToFollowNamingConvention() error {
	originalPath := filepath.Join(s.tmpDir, "docs", "tutorials", "wrong__my-guide.md")
	if _, err := os.Stat(originalPath); err == nil {
		return fmt.Errorf("expected 'wrong__my-guide.md' to no longer exist after apply")
	}
	renamedPath := filepath.Join(s.tmpDir, "docs", "tutorials", "tu__my-guide.md")
	if _, err := os.Stat(renamedPath); os.IsNotExist(err) {
		return fmt.Errorf("expected 'tu__my-guide.md' to exist after apply, but it does not")
	}
	return nil
}

func InitializeValidateDocsNamingScenario(sc *godog.ScenarioContext) {
	s := &validateDocsNamingSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a docs directory where every file follows the naming convention$`, s.aDocsDirWithValidFiles)
	sc.Step(`^a docs directory containing a file without the double-underscore prefix separator$`, s.aDocsDirWithMissingSeparator)
	sc.Step(`^a docs directory containing a file whose prefix does not match its directory path$`, s.aDocsDirWithWrongPrefix)
	sc.Step(`^a docs directory containing files with naming violations$`, s.aDocsDirWithNamingViolations)
	sc.Step(`^the developer runs validate-docs-naming$`, s.runValidateDocsNaming)
	sc.Step(`^the developer runs validate-docs-naming with the --fix flag$`, s.runValidateDocsNamingWithFix)
	sc.Step(`^the developer runs validate-docs-naming with --fix and --apply flags$`, s.runValidateDocsNamingWithFixAndApply)
	sc.Step(`^the command exits successfully$`, s.commandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.commandExitsWithFailureCode)
	sc.Step(`^the output reports zero violations$`, s.outputReportsZeroViolations)
	sc.Step(`^the output identifies the file with the naming violation$`, s.outputIdentifiesNamingViolation)
	sc.Step(`^the output reports the expected prefix alongside the actual filename$`, s.outputReportsExpectedPrefixAlongsideActualFilename)
	sc.Step(`^the output shows the planned renames$`, s.outputShowsPlannedRenames)
	sc.Step(`^no files are renamed on disk$`, s.noFilesAreRenamedOnDisk)
	sc.Step(`^the files are renamed to follow the naming convention$`, s.filesAreRenamedToFollowNamingConvention)
}

func TestIntegrationValidateDocsNaming(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateDocsNamingScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDocsNamingDir},
			Tags:     "validate-docs-naming",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
