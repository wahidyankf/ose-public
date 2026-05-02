package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/governance"
)

// Step constant patterns for governance vendor-audit scenarios.
const (
	stepGovernanceFileWithForbiddenTermInProse              = `^a governance markdown file containing "Claude Code" in plain prose$`
	stepGovernanceFileWithForbiddenTermInCodeFence          = `^a governance markdown file containing "Claude Code" inside a code fence$`
	stepGovernanceFileWithForbiddenTermInBindingFence       = `^a governance markdown file containing "Claude Code" inside a binding-example fence$`
	stepGovernanceFileWithForbiddenTermUnderPlatformHeading = `^a governance markdown file containing "Claude Code" under a "Platform Binding Examples" heading$`
	stepGovernanceDirectoryWithNoForbiddenTerms             = `^a governance directory with no forbidden terms in prose$`
	stepDeveloperRunsGovernanceVendorAuditOnFile            = `^the developer runs governance vendor-audit on the file$`
	stepDeveloperRunsGovernanceVendorAuditOnDir             = `^the developer runs governance vendor-audit on the directory$`
	stepOutputIdentifiesForbiddenTerm                       = `^the output identifies the forbidden term and its location$`
	stepOutputReportsZeroGovernanceFindings                 = `^the output reports zero findings$`
)

var specsDirUnitGovernanceVendorAudit = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type governanceVendorAuditUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *governanceVendorAuditUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	s.cmdErr = nil
	s.cmdOutput = ""

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) { return nil, nil }
	return context.Background(), nil
}

func (s *governanceVendorAuditUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	governanceVendorAuditFn = governanceVendorAudit
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *governanceVendorAuditUnitSteps) fileWithForbiddenTermInProse() error {
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) {
		return []governance.Finding{{
			Path:        "/mock-repo/governance/foo.md",
			Line:        23,
			Match:       "Claude Code",
			Replacement: `"the coding agent"`,
		}}, nil
	}
	return nil
}

func (s *governanceVendorAuditUnitSteps) fileWithForbiddenTermInCodeFence() error {
	// Term is inside a code fence → mock returns zero findings.
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) { return nil, nil }
	return nil
}

func (s *governanceVendorAuditUnitSteps) fileWithForbiddenTermInBindingFence() error {
	// Term is inside a binding-example fence → mock returns zero findings.
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) { return nil, nil }
	return nil
}

func (s *governanceVendorAuditUnitSteps) fileWithForbiddenTermUnderPlatformHeading() error {
	// Term is under Platform Binding Examples heading → mock returns zero findings.
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) { return nil, nil }
	return nil
}

func (s *governanceVendorAuditUnitSteps) directoryWithNoForbiddenTerms() error {
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) { return nil, nil }
	return nil
}

func (s *governanceVendorAuditUnitSteps) runOnFile() error {
	buf := new(bytes.Buffer)
	governanceVendorAuditCmd.SetOut(buf)
	governanceVendorAuditCmd.SetErr(buf)
	s.cmdErr = governanceVendorAuditCmd.RunE(governanceVendorAuditCmd, []string{"governance/"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *governanceVendorAuditUnitSteps) runOnDir() error {
	buf := new(bytes.Buffer)
	governanceVendorAuditCmd.SetOut(buf)
	governanceVendorAuditCmd.SetErr(buf)
	s.cmdErr = governanceVendorAuditCmd.RunE(governanceVendorAuditCmd, []string{"governance/"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *governanceVendorAuditUnitSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *governanceVendorAuditUnitSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *governanceVendorAuditUnitSteps) outputIdentifiesForbiddenTerm() error {
	if !strings.Contains(s.cmdOutput, "Claude Code") {
		return fmt.Errorf("expected output to contain 'Claude Code', got: %s", s.cmdOutput)
	}
	if !strings.Contains(s.cmdOutput, "governance/foo.md") {
		return fmt.Errorf("expected output to contain file path, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *governanceVendorAuditUnitSteps) outputReportsZeroFindings() error {
	if !strings.Contains(s.cmdOutput, "PASSED") {
		return fmt.Errorf("expected PASSED in output, got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitGovernanceVendorAudit(t *testing.T) {
	s := &governanceVendorAuditUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepGovernanceFileWithForbiddenTermInProse, s.fileWithForbiddenTermInProse)
			sc.Step(stepGovernanceFileWithForbiddenTermInCodeFence, s.fileWithForbiddenTermInCodeFence)
			sc.Step(stepGovernanceFileWithForbiddenTermInBindingFence, s.fileWithForbiddenTermInBindingFence)
			sc.Step(stepGovernanceFileWithForbiddenTermUnderPlatformHeading, s.fileWithForbiddenTermUnderPlatformHeading)
			sc.Step(stepGovernanceDirectoryWithNoForbiddenTerms, s.directoryWithNoForbiddenTerms)
			sc.Step(stepDeveloperRunsGovernanceVendorAuditOnFile, s.runOnFile)
			sc.Step(stepDeveloperRunsGovernanceVendorAuditOnDir, s.runOnDir)
			sc.Step(stepOutputIdentifiesForbiddenTerm, s.outputIdentifiesForbiddenTerm)
			sc.Step(stepOutputReportsZeroGovernanceFindings, s.outputReportsZeroFindings)
			sc.Step(stepExitsSuccessfully, s.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.exitsWithFailure)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitGovernanceVendorAudit},
			TestingT: t,
			Tags:     "governance-vendor-audit",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestGovernanceVendorAudit_MissingGitRoot verifies the command fails gracefully
// when not inside a git repository.
func TestGovernanceVendorAudit_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	buf := new(bytes.Buffer)
	governanceVendorAuditCmd.SetOut(buf)
	governanceVendorAuditCmd.SetErr(buf)

	err := governanceVendorAuditCmd.RunE(governanceVendorAuditCmd, []string{})
	if err == nil || !strings.Contains(err.Error(), "git") {
		t.Fatalf("expected git-root error, got: %v", err)
	}
}

// TestGovernanceVendorAudit_RealTree exercises the real filesystem walker
// against a small tmp fixture to verify coverage of the walk logic.
func TestGovernanceVendorAudit_RealTree(t *testing.T) {
	tmp := t.TempDir()
	govDir := filepath.Join(tmp, "governance")
	if err := os.MkdirAll(govDir, 0o755); err != nil {
		t.Fatal(err)
	}

	writeFile := func(path, content string) {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	// File with a violation.
	writeFile(filepath.Join(govDir, "foo.md"), "# Doc\n\nClaude Code is used here.\n")
	// Clean file — no violation.
	writeFile(filepath.Join(govDir, "bar.md"), "# Clean\n\nNo issues here.\n")
	// The convention definition file — must be skipped even with forbidden terms.
	convPath := filepath.Join(tmp, "governance", "conventions", "structure", "governance-vendor-independence.md")
	writeFile(convPath, "# Convention\n\nClaude Code\nOpenCode\nAnthropic\n")

	findings, err := governanceVendorAudit(govDir)
	if err != nil {
		t.Fatalf("governanceVendorAudit: %v", err)
	}

	// Should find violation in foo.md but not in the convention file.
	for _, f := range findings {
		if strings.HasSuffix(filepath.ToSlash(f.Path), "governance-vendor-independence.md") {
			t.Errorf("convention file should be skipped, got finding: %+v", f)
		}
	}
	if len(findings) == 0 {
		t.Error("expected at least one finding for foo.md")
	}
}

// TestGovernanceVendorAudit_OutputFormats checks that all three output formats
// produce non-empty output.
func TestGovernanceVendorAudit_OutputFormats(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := governanceVendorAuditFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		governanceVendorAuditFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	governanceVendorAuditFn = func(_ string) ([]governance.Finding, error) {
		return []governance.Finding{{
			Path:        "/mock-repo/governance/foo.md",
			Line:        5,
			Match:       "Claude Code",
			Replacement: `"the coding agent"`,
		}}, nil
	}

	for _, format := range []string{"json", "markdown", "text"} {
		t.Run(format, func(t *testing.T) {
			buf := new(bytes.Buffer)
			governanceVendorAuditCmd.SetOut(buf)
			governanceVendorAuditCmd.SetErr(buf)
			output = format
			verbose = false
			quiet = false
			_ = governanceVendorAuditCmd.RunE(governanceVendorAuditCmd, []string{})
			if buf.Len() == 0 {
				t.Errorf("format %s produced no output", format)
			}
		})
	}
	output = "text"
}

// TestGovernanceVendorAudit_DefaultPathUsesGovernance verifies that when no
// path argument is provided, the default "governance" path is used.
func TestGovernanceVendorAudit_DefaultPathUsesGovernance(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := governanceVendorAuditFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		governanceVendorAuditFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	var capturedPath string
	governanceVendorAuditFn = func(path string) ([]governance.Finding, error) {
		capturedPath = path
		return nil, nil
	}

	buf := new(bytes.Buffer)
	governanceVendorAuditCmd.SetOut(buf)
	governanceVendorAuditCmd.SetErr(buf)
	_ = governanceVendorAuditCmd.RunE(governanceVendorAuditCmd, []string{})

	expected := "/mock-repo/governance"
	if capturedPath != expected {
		t.Errorf("expected path %q, got %q", expected, capturedPath)
	}
}
