//go:build integration

package links_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/libs/golang-commons/testutil"
	"github.com/wahidyankf/ose-public/libs/hugo-commons/links"
)

var specsCheckLinksDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/libs/hugo-commons/gherkin/links")
}()

type checkLinksSteps struct {
	t          *testing.T
	origStdout *os.File
	tmpDir     string
	result     *links.CheckResult
	elapsed    time.Duration
	checkErr   error
	textOutput string
	jsonOutput string
	mdOutput   string
}

func newCheckLinksSteps(t *testing.T) *checkLinksSteps {
	return &checkLinksSteps{t: t, origStdout: os.Stdout}
}

func (s *checkLinksSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	var err error
	s.tmpDir, err = os.MkdirTemp("", "hugo-links-*")
	if err != nil {
		return context.Background(), fmt.Errorf("failed to create temp dir: %w", err)
	}
	s.result = nil
	s.checkErr = nil
	s.textOutput = ""
	s.jsonOutput = ""
	s.mdOutput = ""
	// Restore os.Stdout to handle pipe state from previous scenarios.
	os.Stdout = s.origStdout
	return context.Background(), nil
}

func (s *checkLinksSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.RemoveAll(s.tmpDir)
	os.Stdout = s.origStdout
	return context.Background(), nil
}

// Given steps

func (s *checkLinksSteps) aHugoContentDirectoryWhereAllInternalLinksResolveToExistingPages() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "en", "learn"), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "en", "learn", "overview.md"),
		[]byte("# Overview\n\nIntroduction to the topic."),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write overview.md: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "en", "index.md"),
		[]byte("# Index\n\nSee the [Overview](/en/learn/overview) for details."),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write index.md: %w", err)
	}
	return nil
}

func (s *checkLinksSteps) aHugoContentDirectoryContainingABrokenInternalLink() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "en"), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "en", "index.md"),
		[]byte("# Index\n\n[Missing Page](/en/learn/missing-page)"),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write index.md: %w", err)
	}
	return nil
}

func (s *checkLinksSteps) aBilingualHugoContentDirectoryWithEnglishAndIndonesianContent() error {
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "en", "learn"), 0755); err != nil {
		return fmt.Errorf("failed to create en/learn directory: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "en", "learn", "guide.md"),
		[]byte("# Guide"),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write en/learn/guide.md: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "en", "index.md"),
		[]byte("[Guide](/en/learn/guide)"),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write en/index.md: %w", err)
	}
	if err := os.MkdirAll(filepath.Join(s.tmpDir, "id", "belajar"), 0755); err != nil {
		return fmt.Errorf("failed to create id/belajar directory: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "id", "belajar", "panduan.md"),
		[]byte("# Panduan"),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write id/belajar/panduan.md: %w", err)
	}
	if err := os.WriteFile(
		filepath.Join(s.tmpDir, "id", "index.md"),
		[]byte("[Panduan](/id/belajar/panduan)"),
		0644,
	); err != nil {
		return fmt.Errorf("failed to write id/index.md: %w", err)
	}
	return nil
}

// When steps

func (s *checkLinksSteps) theDeveloperChecksLinksInTheContentDirectory() error {
	start := time.Now()
	s.result, s.checkErr = links.CheckLinks(s.tmpDir)
	s.elapsed = time.Since(start)
	return s.checkErr
}

func (s *checkLinksSteps) theDeveloperChecksLinksAndRequestsJSONOutput() error {
	start := time.Now()
	var err error
	s.result, err = links.CheckLinks(s.tmpDir)
	s.elapsed = time.Since(start)
	if err != nil {
		return err
	}
	read := testutil.CaptureStdout(s.t)
	_ = links.OutputLinksJSON(s.result, s.elapsed)
	s.jsonOutput = read()
	os.Stdout = s.origStdout
	return nil
}

func (s *checkLinksSteps) theDeveloperChecksLinksAndRequestsMarkdownOutput() error {
	start := time.Now()
	var err error
	s.result, err = links.CheckLinks(s.tmpDir)
	s.elapsed = time.Since(start)
	if err != nil {
		return err
	}
	read := testutil.CaptureStdout(s.t)
	links.OutputLinksMarkdown(s.result, s.elapsed)
	s.mdOutput = read()
	os.Stdout = s.origStdout
	return nil
}

// Then/And steps

func (s *checkLinksSteps) theCheckCompletesWithZeroBrokenLinks() error {
	if s.result == nil {
		return fmt.Errorf("result is nil")
	}
	if len(s.result.BrokenLinks) != 0 {
		return fmt.Errorf("expected 0 broken links, got %d: %v", len(s.result.BrokenLinks), s.result.BrokenLinks)
	}
	return nil
}

func (s *checkLinksSteps) theCheckCompletesWithOneBrokenLinkReported() error {
	if s.result == nil {
		return fmt.Errorf("result is nil")
	}
	if len(s.result.BrokenLinks) != 1 {
		return fmt.Errorf("expected 1 broken link, got %d: %v", len(s.result.BrokenLinks), s.result.BrokenLinks)
	}
	return nil
}

func (s *checkLinksSteps) theTextOutputContainsTheLinkCheckSummary() error {
	read := testutil.CaptureStdout(s.t)
	links.OutputLinksText(s.result, s.elapsed, false, false)
	s.textOutput = read()
	os.Stdout = s.origStdout
	if !strings.Contains(s.textOutput, "Link Check Complete") {
		return fmt.Errorf("expected 'Link Check Complete' in text output, got: %q", s.textOutput)
	}
	return nil
}

func (s *checkLinksSteps) theTextOutputContainsTheBrokenLinksSection() error {
	read := testutil.CaptureStdout(s.t)
	links.OutputLinksText(s.result, s.elapsed, false, false)
	s.textOutput = read()
	os.Stdout = s.origStdout
	if !strings.Contains(s.textOutput, "Broken Links:") {
		return fmt.Errorf("expected 'Broken Links:' in text output, got: %q", s.textOutput)
	}
	return nil
}

func (s *checkLinksSteps) theJSONOutputContainsASuccessStatusField() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.jsonOutput), &parsed); err != nil {
		return fmt.Errorf("JSON output is not valid JSON: %w\noutput: %q", err, s.jsonOutput)
	}
	if parsed["status"] != "success" {
		return fmt.Errorf("expected status 'success', got %v", parsed["status"])
	}
	return nil
}

func (s *checkLinksSteps) theMarkdownOutputShowsFAILStatusWithABrokenLinksTable() error {
	if !strings.Contains(s.mdOutput, "**Status**: FAIL") {
		return fmt.Errorf("expected '**Status**: FAIL' in markdown output, got: %q", s.mdOutput)
	}
	if !strings.Contains(s.mdOutput, "## Broken Links") {
		return fmt.Errorf("expected '## Broken Links' section in markdown output, got: %q", s.mdOutput)
	}
	return nil
}

func TestIntegrationCheckLinks(t *testing.T) {
	s := newCheckLinksSteps(t)
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(`^a Hugo content directory where all internal links resolve to existing pages$`, s.aHugoContentDirectoryWhereAllInternalLinksResolveToExistingPages)
			sc.Step(`^a Hugo content directory containing a broken internal link$`, s.aHugoContentDirectoryContainingABrokenInternalLink)
			sc.Step(`^a bilingual Hugo content directory with English and Indonesian content$`, s.aBilingualHugoContentDirectoryWithEnglishAndIndonesianContent)
			sc.Step(`^the developer checks links in the content directory$`, s.theDeveloperChecksLinksInTheContentDirectory)
			sc.Step(`^the developer checks links and requests JSON output$`, s.theDeveloperChecksLinksAndRequestsJSONOutput)
			sc.Step(`^the developer checks links and requests Markdown output$`, s.theDeveloperChecksLinksAndRequestsMarkdownOutput)
			sc.Step(`^the check completes with zero broken links$`, s.theCheckCompletesWithZeroBrokenLinks)
			sc.Step(`^the check completes with one broken link reported$`, s.theCheckCompletesWithOneBrokenLinkReported)
			sc.Step(`^the text output contains the link check summary$`, s.theTextOutputContainsTheLinkCheckSummary)
			sc.Step(`^the text output contains the broken links section$`, s.theTextOutputContainsTheBrokenLinksSection)
			sc.Step(`^the JSON output contains a success status field$`, s.theJSONOutputContainsASuccessStatusField)
			sc.Step(`^the Markdown output shows FAIL status with a broken links table$`, s.theMarkdownOutputShowsFAILStatusWithABrokenLinksTable)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsCheckLinksDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
