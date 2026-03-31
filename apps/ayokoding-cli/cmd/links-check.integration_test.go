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
	"testing"

	"github.com/cucumber/godog"
)

var specsLinksCheckAyokodingDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/ayokoding-cli/cli/gherkin")
}()

// Scenario: A content directory with all valid Hugo-path links passes validation
// Scenario: A broken internal link is detected and reported
// Scenario: External URLs are not validated
// Scenario: JSON output produces structured results

type linksCheckAyokodingSteps struct {
	originalWd string
	tmpDir     string
	contentDir string
	cmdErr     error
	cmdOutput  string
}

func (s *linksCheckAyokodingSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "links-check-ayokoding-*")
	verbose = false
	quiet = false
	output = "text"
	linksContentDir = "apps/ayokoding-web/content"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *linksCheckAyokodingSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *linksCheckAyokodingSteps) captureRun() {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	s.cmdErr = linksCheckCmd.RunE(linksCheckCmd, []string{})
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	s.cmdOutput = string(out)
}

func (s *linksCheckAyokodingSteps) makeContentDir() (string, error) {
	contentDir := filepath.Join(s.tmpDir, "content")
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		return "", fmt.Errorf("create content dir: %w", err)
	}
	s.contentDir = contentDir
	return contentDir, nil
}

func (s *linksCheckAyokodingSteps) ayokodingWebContentWhereAllInternalLinksResolveCorrectly() error {
	contentDir, err := s.makeContentDir()
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(contentDir, "target.md"), []byte("# Target\n"), 0644); err != nil {
		return fmt.Errorf("create target.md: %w", err)
	}
	if err := os.WriteFile(filepath.Join(contentDir, "page.md"), []byte("[link](/target)\n"), 0644); err != nil {
		return fmt.Errorf("create page.md: %w", err)
	}
	return nil
}

func (s *linksCheckAyokodingSteps) ayokodingWebContentWithALinkPointingToANonExistentPage() error {
	contentDir, err := s.makeContentDir()
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(contentDir, "page.md"), []byte("[link](/nonexistent)\n"), 0644); err != nil {
		return fmt.Errorf("create page.md: %w", err)
	}
	return nil
}

func (s *linksCheckAyokodingSteps) ayokodingWebContentWithOnlyExternalHTTPSLinks() error {
	contentDir, err := s.makeContentDir()
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(contentDir, "page.md"), []byte("[link](https://example.com)\n"), 0644); err != nil {
		return fmt.Errorf("create page.md: %w", err)
	}
	return nil
}

func (s *linksCheckAyokodingSteps) theDeveloperRunsLinksCheck() error {
	linksContentDir = s.contentDir
	s.captureRun()
	return nil
}

func (s *linksCheckAyokodingSteps) theDeveloperRunsLinksCheckWithJSONOutput() error {
	linksContentDir = s.contentDir
	output = "json"
	s.captureRun()
	return nil
}

func (s *linksCheckAyokodingSteps) theLinksCheckCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *linksCheckAyokodingSteps) theLinksCheckCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *linksCheckAyokodingSteps) theLinksOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func InitializeLinksCheckAyokodingScenario(sc *godog.ScenarioContext) {
	s := &linksCheckAyokodingSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^ayokoding-web content where all internal links resolve correctly$`, s.ayokodingWebContentWhereAllInternalLinksResolveCorrectly)
	sc.Step(`^ayokoding-web content with a link pointing to a non-existent page$`, s.ayokodingWebContentWithALinkPointingToANonExistentPage)
	sc.Step(`^ayokoding-web content with only external HTTPS links$`, s.ayokodingWebContentWithOnlyExternalHTTPSLinks)
	sc.Step(`^the developer runs links check$`, s.theDeveloperRunsLinksCheck)
	sc.Step(`^the developer runs links check with JSON output$`, s.theDeveloperRunsLinksCheckWithJSONOutput)
	sc.Step(`^the command exits successfully$`, s.theLinksCheckCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theLinksCheckCommandExitsWithAFailureCode)
	sc.Step(`^the output is valid JSON$`, s.theLinksOutputIsValidJSON)
}

func TestIntegrationLinksCheck(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeLinksCheckAyokodingScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsLinksCheckAyokodingDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
