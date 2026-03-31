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
	"github.com/wahidyankf/open-sharia-enterprise/libs/hugo-commons/links"
)

var specsLinksCheckOseplatformDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/oseplatform-cli/cli/gherkin")
}()

// Scenario: A content directory with all valid internal links passes validation
// Scenario: A broken internal link is detected and reported
// Scenario: External URLs are not validated
// Scenario: JSON output produces structured results

type linksCheckOseplatformSteps struct {
	originalWd string
	tmpDir     string
	contentDir string
	cmdErr     error
	cmdOutput  string
}

func (s *linksCheckOseplatformSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "links-check-oseplatform-*")
	verbose = false
	quiet = false
	output = "text"
	linksContentDir = "apps/oseplatform-web/content"
	checkLinksFn = links.CheckLinks
	outputLinksJSONFn = links.OutputLinksJSON
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *linksCheckOseplatformSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *linksCheckOseplatformSteps) captureRun() {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	s.cmdErr = linksCheckCmd.RunE(linksCheckCmd, []string{})
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	s.cmdOutput = string(out)
}

func (s *linksCheckOseplatformSteps) makeContentDir() (string, error) {
	contentDir := filepath.Join(s.tmpDir, "content")
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		return "", fmt.Errorf("create content dir: %w", err)
	}
	s.contentDir = contentDir
	return contentDir, nil
}

func (s *linksCheckOseplatformSteps) oseplatformWebContentWhereAllInternalLinksResolveCorrectly() error {
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

func (s *linksCheckOseplatformSteps) oseplatformWebContentWithALinkPointingToANonExistentPage() error {
	contentDir, err := s.makeContentDir()
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(contentDir, "page.md"), []byte("[link](/nonexistent)\n"), 0644); err != nil {
		return fmt.Errorf("create page.md: %w", err)
	}
	return nil
}

func (s *linksCheckOseplatformSteps) oseplatformWebContentWithOnlyExternalHTTPSLinks() error {
	contentDir, err := s.makeContentDir()
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(contentDir, "page.md"), []byte("[link](https://example.com)\n"), 0644); err != nil {
		return fmt.Errorf("create page.md: %w", err)
	}
	return nil
}

func (s *linksCheckOseplatformSteps) theDeveloperRunsLinksCheck() error {
	linksContentDir = s.contentDir
	s.captureRun()
	return nil
}

func (s *linksCheckOseplatformSteps) theDeveloperRunsLinksCheckWithJSONOutput() error {
	linksContentDir = s.contentDir
	output = "json"
	s.captureRun()
	return nil
}

func (s *linksCheckOseplatformSteps) theOseplatformLinksCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *linksCheckOseplatformSteps) theOseplatformLinksCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *linksCheckOseplatformSteps) theOseplatformLinksOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func InitializeLinksCheckOseplatformScenario(sc *godog.ScenarioContext) {
	s := &linksCheckOseplatformSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^oseplatform-web content where all internal links resolve correctly$`, s.oseplatformWebContentWhereAllInternalLinksResolveCorrectly)
	sc.Step(`^oseplatform-web content with a link pointing to a non-existent page$`, s.oseplatformWebContentWithALinkPointingToANonExistentPage)
	sc.Step(`^oseplatform-web content with only external HTTPS links$`, s.oseplatformWebContentWithOnlyExternalHTTPSLinks)
	sc.Step(`^the developer runs links check$`, s.theDeveloperRunsLinksCheck)
	sc.Step(`^the developer runs links check with JSON output$`, s.theDeveloperRunsLinksCheckWithJSONOutput)
	sc.Step(`^the command exits successfully$`, s.theOseplatformLinksCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theOseplatformLinksCommandExitsWithAFailureCode)
	sc.Step(`^the output is valid JSON$`, s.theOseplatformLinksOutputIsValidJSON)
}

func TestIntegrationLinksCheck(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeLinksCheckOseplatformScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsLinksCheckOseplatformDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
