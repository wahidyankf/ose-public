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
	"testing"

	"github.com/cucumber/godog"
)

var specsDocsDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/rhino-cli/docs")
}()

// Scenario: A document set with all valid internal links passes validation
// Given markdown files where all internal links point to existing files
// When the developer runs validate-docs-links
// Then the command exits successfully
// And the output reports no broken links found

// Scenario: A broken internal link is detected and reported
// Given a markdown file with a link pointing to a non-existent file
// When the developer runs validate-docs-links
// Then the command exits with a failure code
// And the output identifies the file containing the broken link

// Scenario: External URLs are not validated
// Given a markdown file containing only external HTTPS links
// When the developer runs validate-docs-links
// Then the command exits successfully
// And the output reports no broken links found

// Scenario: With --staged-only only staged files are checked
// Given a markdown file with a broken link that has not been staged in git
// When the developer runs validate-docs-links with the --staged-only flag
// Then the command exits successfully

type validateDocsLinksSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateDocsLinksSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-docs-links-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	validateDocsLinksStagedOnly = false
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateDocsLinksSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateDocsLinksSteps) markdownFilesWhereAllInternalLinksPointToExistingFiles() error {
	docsDir := filepath.Join(s.tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(docsDir, "b.md"), []byte("# B\n"), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(docsDir, "a.md"), []byte("[see](./b.md)\n"), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateDocsLinksSteps) aMarkdownFileWithALinkPointingToANonExistentFile() error {
	docsDir := filepath.Join(s.tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(docsDir, "a.md"), []byte("[see](./nonexistent.md)\n"), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateDocsLinksSteps) aMarkdownFileContainingOnlyExternalHTTPSLinks() error {
	docsDir := filepath.Join(s.tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(docsDir, "a.md"), []byte("[link](https://example.com)\n"), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateDocsLinksSteps) aMarkdownFileWithABrokenLinkThatHasNotBeenStagedInGit() error {
	// Re-initialize tmpDir as a real git repo so git diff --cached works correctly.
	if err := exec.Command("git", "init", s.tmpDir).Run(); err != nil {
		return fmt.Errorf("git init failed: %w", err)
	}
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.email", "test@example.com").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.name", "Test User").Run()

	docsDir := filepath.Join(s.tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		return err
	}
	// Write a broken link but do NOT stage the file.
	if err := os.WriteFile(filepath.Join(docsDir, "a.md"), []byte("[see](./nonexistent.md)\n"), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateDocsLinksSteps) theDeveloperRunsValidateDocsLinks() error {
	validateDocsLinksStagedOnly = false
	buf := new(bytes.Buffer)
	validateDocsLinksCmd.SetOut(buf)
	validateDocsLinksCmd.SetErr(buf)
	s.cmdErr = validateDocsLinksCmd.RunE(validateDocsLinksCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateDocsLinksSteps) theDeveloperRunsValidateDocsLinksWithTheStagedOnlyFlag() error {
	validateDocsLinksStagedOnly = true
	buf := new(bytes.Buffer)
	validateDocsLinksCmd.SetOut(buf)
	validateDocsLinksCmd.SetErr(buf)
	s.cmdErr = validateDocsLinksCmd.RunE(validateDocsLinksCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateDocsLinksSteps) theValidateDocsLinksCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully, got error: %w (output: %s)", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksSteps) theValidateDocsLinksCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to exit with failure, but it succeeded (output: %s)", s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksSteps) theOutputReportsNoBrokenLinksFound() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected no broken links, got error: %w (output: %s)", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateDocsLinksSteps) theOutputIdentifiesTheFileContainingTheBrokenLink() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected broken link error, but command succeeded")
	}
	return nil
}

func InitializeValidateDocsLinksScenario(sc *godog.ScenarioContext) {
	s := &validateDocsLinksSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^markdown files where all internal links point to existing files$`,
		s.markdownFilesWhereAllInternalLinksPointToExistingFiles)
	sc.Step(`^a markdown file with a link pointing to a non-existent file$`,
		s.aMarkdownFileWithALinkPointingToANonExistentFile)
	sc.Step(`^a markdown file containing only external HTTPS links$`,
		s.aMarkdownFileContainingOnlyExternalHTTPSLinks)
	sc.Step(`^a markdown file with a broken link that has not been staged in git$`,
		s.aMarkdownFileWithABrokenLinkThatHasNotBeenStagedInGit)
	sc.Step(`^the developer runs validate-docs-links$`,
		s.theDeveloperRunsValidateDocsLinks)
	sc.Step(`^the developer runs validate-docs-links with the --staged-only flag$`,
		s.theDeveloperRunsValidateDocsLinksWithTheStagedOnlyFlag)
	sc.Step(`^the command exits successfully$`,
		s.theValidateDocsLinksCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`,
		s.theValidateDocsLinksCommandExitsWithAFailureCode)
	sc.Step(`^the output reports no broken links found$`,
		s.theOutputReportsNoBrokenLinksFound)
	sc.Step(`^the output identifies the file containing the broken link$`,
		s.theOutputIdentifiesTheFileContainingTheBrokenLink)
}

func TestIntegrationValidateDocsLinks(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateDocsLinksScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDocsDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
