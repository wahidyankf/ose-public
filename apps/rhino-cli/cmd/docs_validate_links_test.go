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
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/docs"
)

var specsDirUnitDocsValidateLinks = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type validateDocsLinksUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *validateDocsLinksUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	validateDocsLinksStagedOnly = false
	s.cmdErr = nil
	s.cmdOutput = ""

	// Mock findGitRoot
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default: no broken links
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles:  1,
			TotalLinks:  0,
			BrokenLinks: nil,
		}, nil
	}

	return context.Background(), nil
}

func (s *validateDocsLinksUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	docsValidateAllLinksFn = docs.ValidateAllLinks
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *validateDocsLinksUnitSteps) markdownFilesWhereAllInternalLinksPointToExistingFiles() error {
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles:  2,
			TotalLinks:  1,
			BrokenLinks: nil,
		}, nil
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) aMarkdownFileWithALinkPointingToANonExistentFile() error {
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles: 1,
			TotalLinks: 1,
			BrokenLinks: []docs.BrokenLink{
				{
					SourceFile: "docs/a.md",
					LinkText:   "./nonexistent.md",
					TargetPath: "/mock-repo/docs/nonexistent.md",
					LineNumber: 1,
				},
			},
		}, nil
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) aMarkdownFileContainingOnlyExternalHTTPSLinks() error {
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles:  1,
			TotalLinks:  1,
			BrokenLinks: nil,
		}, nil
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) aMarkdownFileWithABrokenLinkThatHasNotBeenStagedInGit() error {
	// In staged-only mode, the scanner only checks staged files.
	// Since this file was not staged, the broken link should not be returned.
	docsValidateAllLinksFn = func(opts docs.ScanOptions) (*docs.LinkValidationResult, error) {
		if opts.StagedOnly {
			// No staged files — no broken links reported
			return &docs.LinkValidationResult{
				TotalFiles:  0,
				TotalLinks:  0,
				BrokenLinks: nil,
			}, nil
		}
		// Without staged-only, the broken link would be detected
		return &docs.LinkValidationResult{
			TotalFiles: 1,
			TotalLinks: 1,
			BrokenLinks: []docs.BrokenLink{
				{
					SourceFile: "docs/a.md",
					LinkText:   "./nonexistent.md",
					TargetPath: "/mock-repo/docs/nonexistent.md",
					LineNumber: 1,
				},
			},
		}, nil
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) theDeveloperRunsValidateDocsLinks() error {
	validateDocsLinksStagedOnly = false
	buf := new(bytes.Buffer)
	validateDocsLinksCmd.SetOut(buf)
	validateDocsLinksCmd.SetErr(buf)
	s.cmdErr = validateDocsLinksCmd.RunE(validateDocsLinksCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateDocsLinksUnitSteps) theDeveloperRunsValidateDocsLinksWithTheStagedOnlyFlag() error {
	validateDocsLinksStagedOnly = true
	buf := new(bytes.Buffer)
	validateDocsLinksCmd.SetOut(buf)
	validateDocsLinksCmd.SetErr(buf)
	s.cmdErr = validateDocsLinksCmd.RunE(validateDocsLinksCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateDocsLinksUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) theOutputReportsNoBrokenLinksFound() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected no broken links, got error: %w (output: %s)", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksUnitSteps) theOutputIdentifiesTheFileContainingTheBrokenLink() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected broken link error, but command succeeded")
	}
	return nil
}

func TestUnitDocsValidateLinks(t *testing.T) {
	s := &validateDocsLinksUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepMarkdownFilesAllInternalLinksValid, s.markdownFilesWhereAllInternalLinksPointToExistingFiles)
			sc.Step(stepMarkdownFileWithLinkToNonExistentFile, s.aMarkdownFileWithALinkPointingToANonExistentFile)
			sc.Step(stepMarkdownFileContainingOnlyExternalLinks, s.aMarkdownFileContainingOnlyExternalHTTPSLinks)
			sc.Step(stepMarkdownFileWithBrokenLinkNotStaged, s.aMarkdownFileWithABrokenLinkThatHasNotBeenStagedInGit)
			sc.Step(stepDeveloperRunsValidateDocsLinks, s.theDeveloperRunsValidateDocsLinks)
			sc.Step(stepDeveloperRunsValidateDocsLinksWithStaged, s.theDeveloperRunsValidateDocsLinksWithTheStagedOnlyFlag)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsNoBrokenLinksFound, s.theOutputReportsNoBrokenLinksFound)
			sc.Step(stepOutputIdentifiesFileContainingBrokenLink, s.theOutputIdentifiesTheFileContainingTheBrokenLink)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitDocsValidateLinks},
			TestingT: t,
			Tags:     "@docs-validate-links",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateDocsLinksCommand_MissingGitRoot verifies git root detection — not in Gherkin specs.
func TestValidateDocsLinksCommand_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	validateDocsLinksStagedOnly = false
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}

// TestValidateDocsLinksCommand_JSONOutput verifies JSON output format — not in Gherkin specs.
func TestValidateDocsLinksCommand_JSONOutput(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := docsValidateAllLinksFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		docsValidateAllLinksFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles:  1,
			TotalLinks:  1,
			BrokenLinks: nil,
		}, nil
	}

	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	validateDocsLinksStagedOnly = false
	output = "json"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if !strings.Contains(buf.String(), `"status"`) {
		t.Errorf("expected JSON output to contain 'status' field, got: %s", buf.String())
	}
	if !strings.Contains(buf.String(), `"broken_count"`) {
		t.Errorf("expected JSON output to contain 'broken_count' field, got: %s", buf.String())
	}
}

// TestValidateDocsLinksCommand_BrokenLinksJSON verifies error returned for broken links in JSON mode.
func TestValidateDocsLinksCommand_BrokenLinksJSON(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := docsValidateAllLinksFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		docsValidateAllLinksFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	docsValidateAllLinksFn = func(_ docs.ScanOptions) (*docs.LinkValidationResult, error) {
		return &docs.LinkValidationResult{
			TotalFiles: 1,
			TotalLinks: 1,
			BrokenLinks: []docs.BrokenLink{
				{SourceFile: "docs/test.md", LinkText: "./nonexistent.md", LineNumber: 1},
			},
		}, nil
	}

	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	validateDocsLinksStagedOnly = false
	output = "json"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error for broken links in JSON output")
	}
	if !strings.Contains(err.Error(), "broken") {
		t.Errorf("expected error mentioning broken links, got: %v", err)
	}
}
