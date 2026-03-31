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
	"time"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/open-sharia-enterprise/libs/hugo-commons/links"
)

var specsDirUnitLinksCheckOseplatform = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/oseplatform-cli/cli/gherkin")
}()

type linksCheckOseplatformUnitSteps struct {
	cmdErr     error
	cmdOutput  string
	mockResult *links.CheckResult
}

func (s *linksCheckOseplatformUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	linksContentDir = "apps/oseplatform-web/content"
	s.cmdErr = nil
	s.cmdOutput = ""
	s.mockResult = nil
	return context.Background(), nil
}

func (s *linksCheckOseplatformUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	checkLinksFn = links.CheckLinks
	outputLinksJSONFn = links.OutputLinksJSON
	return context.Background(), nil
}

func (s *linksCheckOseplatformUnitSteps) oseplatformWebContentWhereAllInternalLinksResolveCorrectly() error {
	s.mockResult = &links.CheckResult{
		CheckedCount: 2,
		ErrorCount:   0,
		BrokenLinks:  nil,
	}
	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return s.mockResult, nil
	}
	return nil
}

func (s *linksCheckOseplatformUnitSteps) oseplatformWebContentWithALinkPointingToANonExistentPage() error {
	s.mockResult = &links.CheckResult{
		CheckedCount: 1,
		ErrorCount:   1,
		BrokenLinks: []links.BrokenLink{
			{SourceFile: "page.md", Line: 1, Text: "link", Target: "/nonexistent"},
		},
	}
	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return s.mockResult, nil
	}
	return nil
}

func (s *linksCheckOseplatformUnitSteps) oseplatformWebContentWithOnlyExternalHTTPSLinks() error {
	s.mockResult = &links.CheckResult{
		CheckedCount: 1,
		ErrorCount:   0,
		BrokenLinks:  nil,
	}
	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return s.mockResult, nil
	}
	return nil
}

func (s *linksCheckOseplatformUnitSteps) captureRun() {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	s.cmdErr = linksCheckCmd.RunE(linksCheckCmd, []string{})
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	s.cmdOutput = string(out)
}

func (s *linksCheckOseplatformUnitSteps) theDeveloperRunsLinksCheck() error {
	s.captureRun()
	return nil
}

func (s *linksCheckOseplatformUnitSteps) theDeveloperRunsLinksCheckWithJSONOutput() error {
	output = "json"
	s.captureRun()
	return nil
}

func (s *linksCheckOseplatformUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *linksCheckOseplatformUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *linksCheckOseplatformUnitSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func TestUnitLinksCheck(t *testing.T) {
	s := &linksCheckOseplatformUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(`^oseplatform-web content where all internal links resolve correctly$`, s.oseplatformWebContentWhereAllInternalLinksResolveCorrectly)
			sc.Step(`^oseplatform-web content with a link pointing to a non-existent page$`, s.oseplatformWebContentWithALinkPointingToANonExistentPage)
			sc.Step(`^oseplatform-web content with only external HTTPS links$`, s.oseplatformWebContentWithOnlyExternalHTTPSLinks)
			sc.Step(`^the developer runs links check$`, s.theDeveloperRunsLinksCheck)
			sc.Step(`^the developer runs links check with JSON output$`, s.theDeveloperRunsLinksCheckWithJSONOutput)
			sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
			sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
			sc.Step(`^the output is valid JSON$`, s.theOutputIsValidJSON)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitLinksCheckOseplatform},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestLinksCheckCommand_Initialization verifies the command metadata is correct.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestLinksCheckCommand_Initialization(t *testing.T) {
	if linksCheckCmd.Use != "check" {
		t.Errorf("expected Use == %q, got %q", "check", linksCheckCmd.Use)
	}
	if !strings.Contains(strings.ToLower(linksCheckCmd.Short), "link") {
		t.Errorf("expected Short to contain 'link', got %q", linksCheckCmd.Short)
	}
}

// captureStdoutRun runs f() while capturing os.Stdout; returns captured output.
func captureStdoutRun(f func()) string {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	f()
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	return string(out)
}

// TestRunLinksCheck_CheckLinksFnError verifies error propagation from checkLinksFn.
// This is a non-BDD test because the error path from checkLinksFn is not in Gherkin specs.
func TestRunLinksCheck_CheckLinksFnError(t *testing.T) {
	origFn := checkLinksFn
	defer func() { checkLinksFn = origFn }()

	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return nil, fmt.Errorf("simulated check error")
	}

	quiet = false
	output = "text"
	linksContentDir = "any/dir"

	var err error
	captureStdoutRun(func() {
		err = runLinksCheck(nil, nil)
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "link check failed") {
		t.Errorf("expected 'link check failed' in error, got %q", err.Error())
	}
}

// TestRunLinksCheck_JSONOutputError verifies error propagation from outputLinksJSONFn.
// This is a non-BDD test because the JSON output error path is not in Gherkin specs.
func TestRunLinksCheck_JSONOutputError(t *testing.T) {
	origCheckFn := checkLinksFn
	origOutputFn := outputLinksJSONFn
	defer func() {
		checkLinksFn = origCheckFn
		outputLinksJSONFn = origOutputFn
	}()

	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return &links.CheckResult{CheckedCount: 0}, nil
	}
	outputLinksJSONFn = func(_ *links.CheckResult, _ time.Duration) error {
		return fmt.Errorf("simulated json output error")
	}

	quiet = false
	output = "json"
	linksContentDir = "any/dir"

	var err error
	captureStdoutRun(func() {
		err = runLinksCheck(nil, nil)
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "simulated json output error") {
		t.Errorf("expected simulated error in message, got %q", err.Error())
	}
}

// TestRunLinksCheck_MarkdownOutput verifies markdown output mode.
// This is a non-BDD test because the markdown output path is not in Gherkin specs.
func TestRunLinksCheck_MarkdownOutput(t *testing.T) {
	origFn := checkLinksFn
	defer func() { checkLinksFn = origFn }()

	checkLinksFn = func(_ string) (*links.CheckResult, error) {
		return &links.CheckResult{CheckedCount: 1}, nil
	}

	quiet = false
	output = "markdown"
	linksContentDir = "any/dir"

	out := captureStdoutRun(func() {
		if err := runLinksCheck(nil, nil); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	if !strings.Contains(out, "# Link Check Report") {
		t.Errorf("expected '# Link Check Report' in output, got %q", out)
	}
}
