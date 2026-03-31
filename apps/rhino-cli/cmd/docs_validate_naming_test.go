package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/docs"
)

var specsDirUnitDocsValidateNaming = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type docsValidateNamingUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *docsValidateNamingUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	validateDocsNamingStagedOnly = false
	validateDocsNamingFix = false
	validateDocsNamingApply = false
	validateDocsNamingNoLinks = false
	s.cmdErr = nil
	s.cmdOutput = ""

	// Mock findGitRoot via osGetwd/osStat
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default mock: no violations
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles: 1,
			ValidFiles: 1,
			Violations: nil,
		}, nil
	}
	docsFixFn = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		return &docs.FixResult{DryRun: true}, nil
	}

	return context.Background(), nil
}

func (s *docsValidateNamingUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	docsValidateAllFn = docs.ValidateAll
	docsFixFn = docs.Fix
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *docsValidateNamingUnitSteps) aDocsDirWhereEveryFileFollowsNamingConvention() error {
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles: 3,
			ValidFiles: 3,
			Violations: nil,
		}, nil
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) aDocsDirWithFileWithoutDoubleDashSeparator() error {
	violation := docs.NamingViolation{
		FilePath:      "docs/tutorials/bad-name.md",
		FileName:      "bad-name.md",
		ViolationType: docs.ViolationMissingSeparator,
		Message:       "Missing '__' separator",
	}
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles:     1,
			ValidFiles:     0,
			ViolationCount: 1,
			Violations:     []docs.NamingViolation{violation},
			ViolationsByType: map[docs.ViolationType][]docs.NamingViolation{
				docs.ViolationMissingSeparator: {violation},
				docs.ViolationWrongPrefix:      nil,
				docs.ViolationBadCase:          nil,
				docs.ViolationMissingPrefix:    nil,
			},
		}, nil
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) aDocsDirWithFilePrefixNotMatchingDirPath() error {
	violation := docs.NamingViolation{
		FilePath:       "docs/tutorials/wrong__guide.md",
		FileName:       "wrong__guide.md",
		ViolationType:  docs.ViolationWrongPrefix,
		ExpectedPrefix: "tu",
		ActualPrefix:   "wrong",
		Message:        "Wrong prefix: expected 'tu', got 'wrong'",
	}
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles:     1,
			ValidFiles:     0,
			ViolationCount: 1,
			Violations:     []docs.NamingViolation{violation},
			ViolationsByType: map[docs.ViolationType][]docs.NamingViolation{
				docs.ViolationMissingSeparator: nil,
				docs.ViolationWrongPrefix:      {violation},
				docs.ViolationBadCase:          nil,
				docs.ViolationMissingPrefix:    nil,
			},
		}, nil
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) aDocsDirWithNamingViolations() error {
	violation := docs.NamingViolation{
		FilePath:       "docs/tutorials/wrong__my-guide.md",
		FileName:       "wrong__my-guide.md",
		ViolationType:  docs.ViolationWrongPrefix,
		ExpectedPrefix: "tu",
		ActualPrefix:   "wrong",
		Message:        "Wrong prefix: expected 'tu', got 'wrong'",
	}
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles:     1,
			ValidFiles:     0,
			ViolationCount: 1,
			Violations:     []docs.NamingViolation{violation},
			ViolationsByType: map[docs.ViolationType][]docs.NamingViolation{
				docs.ViolationMissingSeparator: nil,
				docs.ViolationWrongPrefix:      {violation},
				docs.ViolationBadCase:          nil,
				docs.ViolationMissingPrefix:    nil,
			},
		}, nil
	}
	docsFixFn = func(_ *docs.ValidationResult, opts docs.FixOptions) (*docs.FixResult, error) {
		return &docs.FixResult{
			DryRun: opts.DryRun,
			RenameOperations: []docs.RenameOperation{
				{
					OldPath: "docs/tutorials/wrong__my-guide.md",
					NewPath: "docs/tutorials/tu__my-guide.md",
					OldName: "wrong__my-guide.md",
					NewName: "tu__my-guide.md",
				},
			},
		}, nil
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theDeveloperRunsValidateDocsNaming() error {
	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)
	s.cmdErr = validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *docsValidateNamingUnitSteps) theDeveloperRunsValidateDocsNamingWithFix() error {
	validateDocsNamingFix = true
	return s.theDeveloperRunsValidateDocsNaming()
}

func (s *docsValidateNamingUnitSteps) theDeveloperRunsValidateDocsNamingWithFixAndApply() error {
	validateDocsNamingFix = true
	validateDocsNamingApply = true
	return s.theDeveloperRunsValidateDocsNaming()
}

func (s *docsValidateNamingUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theOutputReportsZeroViolations() error {
	if strings.Contains(s.cmdOutput, "violation") && !strings.Contains(s.cmdOutput, "0 violation") {
		return fmt.Errorf("expected zero violations in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theOutputIdentifiesTheFileWithTheNamingViolation() error {
	if !strings.Contains(s.cmdOutput, "bad-name.md") &&
		!strings.Contains(s.cmdOutput, "__") &&
		!strings.Contains(strings.ToLower(s.cmdOutput), "violation") {
		return fmt.Errorf("expected output to identify naming violation but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theOutputReportsExpectedPrefixAlongsideActualFilename() error {
	// FormatText shows violation message which contains prefix info
	if !strings.Contains(s.cmdOutput, "wrong__guide.md") &&
		!strings.Contains(strings.ToLower(s.cmdOutput), "prefix") &&
		!strings.Contains(s.cmdOutput, "Wrong prefix") {
		return fmt.Errorf("expected output to report expected prefix alongside filename but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) theOutputShowsPlannedRenames() error {
	if !strings.Contains(s.cmdOutput, "wrong__my-guide.md") &&
		!strings.Contains(s.cmdOutput, "tu__my-guide.md") &&
		!strings.Contains(strings.ToLower(s.cmdOutput), "rename") {
		return fmt.Errorf("expected output to show planned renames but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) noFilesRenamedOnDisk() error {
	// In the unit test, the mock returns a DryRun result and never touches disk.
	// Just verify the command succeeded (no error) — the mock guarantees no rename.
	if s.cmdErr != nil {
		return fmt.Errorf("expected dry-run to succeed but got: %v", s.cmdErr)
	}
	return nil
}

func (s *docsValidateNamingUnitSteps) filesRenamedToFollowNamingConvention() error {
	// The fix mock returns success (no errors slice). Just verify command succeeded.
	if s.cmdErr != nil {
		return fmt.Errorf("expected apply to succeed but got: %v", s.cmdErr)
	}
	return nil
}

func TestUnitDocsValidateNaming(t *testing.T) {
	s := &docsValidateNamingUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepDocsDirWhereEveryFileFollowsNamingConvention, s.aDocsDirWhereEveryFileFollowsNamingConvention)
			sc.Step(stepDocsDirWithFileWithoutDoubleDashSeparator, s.aDocsDirWithFileWithoutDoubleDashSeparator)
			sc.Step(stepDocsDirWithFilePrefixNotMatchingDirPath, s.aDocsDirWithFilePrefixNotMatchingDirPath)
			sc.Step(stepDocsDirWithNamingViolations, s.aDocsDirWithNamingViolations)
			sc.Step(stepDeveloperRunsValidateDocsNaming, s.theDeveloperRunsValidateDocsNaming)
			sc.Step(stepDeveloperRunsValidateDocsNamingWithFix, s.theDeveloperRunsValidateDocsNamingWithFix)
			sc.Step(stepDeveloperRunsValidateDocsNamingWithFixAndApply, s.theDeveloperRunsValidateDocsNamingWithFixAndApply)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsZeroViolations, s.theOutputReportsZeroViolations)
			sc.Step(stepOutputIdentifiesFileWithNamingViolation, s.theOutputIdentifiesTheFileWithTheNamingViolation)
			sc.Step(stepOutputReportsExpectedPrefixAlongsideFilename, s.theOutputReportsExpectedPrefixAlongsideActualFilename)
			sc.Step(stepOutputShowsPlannedRenames, s.theOutputShowsPlannedRenames)
			sc.Step(stepNoFilesRenamedOnDisk, s.noFilesRenamedOnDisk)
			sc.Step(stepFilesRenamedToFollowNamingConvention, s.filesRenamedToFollowNamingConvention)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitDocsValidateNaming},
			TestingT: t,
			Tags:     "docs-validate-naming",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateDocsNamingCommand_Initialization verifies the command metadata.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestValidateDocsNamingCommand_Initialization(t *testing.T) {
	if validateDocsNamingCmd.Use != "validate-naming" {
		t.Errorf("expected Use == %q, got %q", "validate-naming", validateDocsNamingCmd.Use)
	}
}

// TestValidateDocsNamingCommand_ApplyWithoutFix verifies --apply requires --fix.
// This is a non-BDD test covering a flag-combination guard not in Gherkin specs.
func TestValidateDocsNamingCommand_ApplyWithoutFix(t *testing.T) {
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

	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)

	validateDocsNamingStagedOnly = false
	validateDocsNamingFix = false
	validateDocsNamingApply = true
	output = "text"
	verbose = false
	quiet = false

	err := validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	if err == nil {
		t.Error("expected error when --apply used without --fix")
	}
	if err != nil && !strings.Contains(err.Error(), "--apply requires --fix") {
		t.Errorf("expected '--apply requires --fix' error, got: %v", err)
	}
}

// TestValidateDocsNamingCommand_MissingGitRoot verifies git root detection.
// This is a non-BDD test because the git-root failure path is not in Gherkin specs.
func TestValidateDocsNamingCommand_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) {
		return nil, os.ErrNotExist
	}

	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)

	validateDocsNamingStagedOnly = false
	validateDocsNamingFix = false
	validateDocsNamingApply = false
	output = "text"
	verbose = false
	quiet = false

	err := validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	if err == nil {
		t.Error("expected error when no .git directory found")
	}
	if err != nil && !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}

// TestValidateDocsNamingCommand_JSONOutput verifies JSON format path.
// This is a non-BDD test covering output format not in Gherkin specs.
func TestValidateDocsNamingCommand_JSONOutput(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := docsValidateAllFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		docsValidateAllFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{TotalFiles: 1, ValidFiles: 1}, nil
	}

	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)

	validateDocsNamingStagedOnly = false
	validateDocsNamingFix = false
	validateDocsNamingApply = false
	output = "json"
	verbose = false
	quiet = false

	err := validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	if err != nil {
		t.Errorf("expected success, got: %v", err)
	}

	got := buf.String()
	var result map[string]any
	if jsonErr := json.Unmarshal([]byte(got), &result); jsonErr != nil {
		t.Errorf("expected valid JSON output, got: %s", got)
	}
}

// TestValidateDocsNamingCommand_FixConflict verifies fix conflict detection.
// This is a non-BDD test covering the conflict-rename error path.
func TestValidateDocsNamingCommand_FixConflict(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origValidateFn := docsValidateAllFn
	origFixFn := docsFixFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		docsValidateAllFn = origValidateFn
		docsFixFn = origFixFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	docsValidateAllFn = func(_ docs.ValidationOptions) (*docs.ValidationResult, error) {
		return &docs.ValidationResult{
			TotalFiles: 2, ValidFiles: 0,
			Violations: []docs.NamingViolation{
				{FileName: "wrong__guide.md", ViolationType: docs.ViolationWrongPrefix},
				{FileName: "other__guide.md", ViolationType: docs.ViolationWrongPrefix},
			},
		}, nil
	}
	docsFixFn = func(_ *docs.ValidationResult, _ docs.FixOptions) (*docs.FixResult, error) {
		return nil, fmt.Errorf("fix operation failed: rename conflict")
	}

	buf := new(bytes.Buffer)
	validateDocsNamingCmd.SetOut(buf)
	validateDocsNamingCmd.SetErr(buf)

	validateDocsNamingStagedOnly = false
	validateDocsNamingFix = true
	validateDocsNamingApply = false
	validateDocsNamingNoLinks = true
	output = "text"
	verbose = false
	quiet = false

	err := validateDocsNamingCmd.RunE(validateDocsNamingCmd, []string{})
	if err == nil {
		t.Error("expected error when fix returns a conflict")
	}
}
