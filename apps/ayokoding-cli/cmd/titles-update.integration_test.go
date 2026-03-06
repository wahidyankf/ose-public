//go:build integration

package cmd

import (
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
)

var specsTitlesUpdateDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/ayokoding-cli/titles")
}()

// Scenario: Updating titles in a content directory exits successfully
// Scenario: Dry-run mode previews changes without writing files
// Scenario: JSON output produces structured results
// Scenario: An invalid language value causes a failure

type titlesUpdateSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *titlesUpdateSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "titles-update-*")
	verbose = false
	quiet = false
	output = "text"
	titlesLang = "both"
	titlesDryRun = false
	titlesConfigEn = "apps/ayokoding-cli/config/title-overrides-en.yaml"
	titlesConfigID = "apps/ayokoding-cli/config/title-overrides-id.yaml"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *titlesUpdateSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *titlesUpdateSteps) captureRun() {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	s.cmdErr = titlesUpdateCmd.RunE(titlesUpdateCmd, []string{})
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	s.cmdOutput = string(out)
}

func (s *titlesUpdateSteps) makeEnContentDir() error {
	enDir := filepath.Join(s.tmpDir, "apps", "ayokoding-web", "content", "en")
	if err := os.MkdirAll(enDir, 0755); err != nil {
		return fmt.Errorf("create en content dir: %w", err)
	}
	content := "---\ntitle: \"Old\"\n---\n"
	if err := os.WriteFile(filepath.Join(enDir, "my-page.md"), []byte(content), 0644); err != nil {
		return fmt.Errorf("create my-page.md: %w", err)
	}
	return nil
}

func (s *titlesUpdateSteps) aContentDirectoryWithMarkdownFilesNeedingTitleUpdates() error {
	return s.makeEnContentDir()
}

func (s *titlesUpdateSteps) anyContentSetup() error {
	// No fixture needed — invalid lang error fires before any file scanning
	return nil
}

func (s *titlesUpdateSteps) theDeveloperRunsTitlesUpdate() error {
	titlesLang = "en"
	s.captureRun()
	return nil
}

func (s *titlesUpdateSteps) theDeveloperRunsTitlesUpdateWithDryRunFlag() error {
	titlesLang = "en"
	titlesDryRun = true
	s.captureRun()
	return nil
}

func (s *titlesUpdateSteps) theDeveloperRunsTitlesUpdateWithJSONOutput() error {
	titlesLang = "en"
	output = "json"
	s.captureRun()
	return nil
}

func (s *titlesUpdateSteps) theDeveloperRunsTitlesUpdateWithAnInvalidLanguage() error {
	titlesLang = "invalid"
	s.captureRun()
	return nil
}

func (s *titlesUpdateSteps) theTitlesCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *titlesUpdateSteps) theTitlesCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *titlesUpdateSteps) theOutputReportsTitleUpdateComplete() error {
	if !strings.Contains(s.cmdOutput, "Title Update Complete") {
		return fmt.Errorf("expected output to contain 'Title Update Complete' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *titlesUpdateSteps) theOutputIsValidJSONWithStatusSuccessTitles() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	if parsed["status"] != "success" {
		return fmt.Errorf("expected status 'success' but got: %v\nOutput: %s", parsed["status"], s.cmdOutput)
	}
	return nil
}

func InitializeTitlesUpdateScenario(sc *godog.ScenarioContext) {
	s := &titlesUpdateSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a content directory with markdown files needing title updates$`, s.aContentDirectoryWithMarkdownFilesNeedingTitleUpdates)
	sc.Step(`^any content setup$`, s.anyContentSetup)
	sc.Step(`^the developer runs titles update$`, s.theDeveloperRunsTitlesUpdate)
	sc.Step(`^the developer runs titles update with dry-run flag$`, s.theDeveloperRunsTitlesUpdateWithDryRunFlag)
	sc.Step(`^the developer runs titles update with JSON output$`, s.theDeveloperRunsTitlesUpdateWithJSONOutput)
	sc.Step(`^the developer runs titles update with an invalid language$`, s.theDeveloperRunsTitlesUpdateWithAnInvalidLanguage)
	sc.Step(`^the command exits successfully$`, s.theTitlesCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theTitlesCommandExitsWithAFailureCode)
	sc.Step(`^the output reports title update complete$`, s.theOutputReportsTitleUpdateComplete)
	sc.Step(`^the output is valid JSON with status success$`, s.theOutputIsValidJSONWithStatusSuccessTitles)
}

func TestIntegrationTitlesUpdate(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeTitlesUpdateScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsTitlesUpdateDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
