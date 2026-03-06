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

var specsNavRegenDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/ayokoding-cli/nav")
}()

// Scenario: A content directory with index files regenerates successfully
// Scenario: A non-existent directory causes a failure
// Scenario: JSON output produces structured results
// Scenario: Quiet mode suppresses output
// Scenario: A positional path argument works the same as the flag

type navRegenSteps struct {
	originalWd string
	tmpDir     string
	contentDir string
	cmdErr     error
	cmdOutput  string
}

func (s *navRegenSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "nav-regen-*")
	verbose = false
	quiet = false
	output = "text"
	regenPath = ""
	regenExclude = []string{"en/_index.md", "id/_index.md"}
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *navRegenSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *navRegenSteps) captureRun(args []string) {
	r, w, _ := os.Pipe()
	origStdout := os.Stdout
	os.Stdout = w
	s.cmdErr = navRegenCmd.RunE(navRegenCmd, args)
	_ = w.Close()
	os.Stdout = origStdout
	out, _ := io.ReadAll(r)
	s.cmdOutput = string(out)
}

func (s *navRegenSteps) aContentDirectoryWithIndexFiles() error {
	content := "---\ntitle: \"Test\"\n---\n"
	if err := os.WriteFile(filepath.Join(s.tmpDir, "_index.md"), []byte(content), 0644); err != nil {
		return fmt.Errorf("create _index.md: %w", err)
	}
	s.contentDir = s.tmpDir
	return nil
}

func (s *navRegenSteps) aContentDirectoryThatDoesNotExist() error {
	s.contentDir = "/nonexistent-dir-xyz"
	return nil
}

func (s *navRegenSteps) theDeveloperRunsNavRegen() error {
	regenPath = s.contentDir
	s.captureRun([]string{})
	return nil
}

func (s *navRegenSteps) theDeveloperRunsNavRegenWithJSONOutput() error {
	regenPath = s.contentDir
	output = "json"
	s.captureRun([]string{})
	return nil
}

func (s *navRegenSteps) theDeveloperRunsNavRegenInQuietMode() error {
	regenPath = s.contentDir
	quiet = true
	s.captureRun([]string{})
	return nil
}

func (s *navRegenSteps) theDeveloperRunsNavRegenWithAPositionalPath() error {
	regenPath = ""
	s.captureRun([]string{s.contentDir})
	return nil
}

func (s *navRegenSteps) theNavRegenCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *navRegenSteps) theNavRegenCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *navRegenSteps) theOutputReportsFilesProcessed() error {
	if !strings.Contains(s.cmdOutput, "Processed") {
		return fmt.Errorf("expected output to contain 'Processed' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *navRegenSteps) theOutputIsValidJSONWithStatusSuccessNavRegen() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	if parsed["status"] != "success" {
		return fmt.Errorf("expected status 'success' but got: %v\nOutput: %s", parsed["status"], s.cmdOutput)
	}
	return nil
}

func (s *navRegenSteps) noOutputIsProduced() error {
	if s.cmdOutput != "" {
		return fmt.Errorf("expected no output but got: %s", s.cmdOutput)
	}
	return nil
}

func InitializeNavRegenScenario(sc *godog.ScenarioContext) {
	s := &navRegenSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a content directory with _index\.md files$`, s.aContentDirectoryWithIndexFiles)
	sc.Step(`^a content directory that does not exist$`, s.aContentDirectoryThatDoesNotExist)
	sc.Step(`^the developer runs nav regen$`, s.theDeveloperRunsNavRegen)
	sc.Step(`^the developer runs nav regen with JSON output$`, s.theDeveloperRunsNavRegenWithJSONOutput)
	sc.Step(`^the developer runs nav regen in quiet mode$`, s.theDeveloperRunsNavRegenInQuietMode)
	sc.Step(`^the developer runs nav regen with a positional path$`, s.theDeveloperRunsNavRegenWithAPositionalPath)
	sc.Step(`^the command exits successfully$`, s.theNavRegenCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theNavRegenCommandExitsWithAFailureCode)
	sc.Step(`^the output reports files processed$`, s.theOutputReportsFilesProcessed)
	sc.Step(`^the output is valid JSON with status success$`, s.theOutputIsValidJSONWithStatusSuccessNavRegen)
	sc.Step(`^no output is produced$`, s.noOutputIsProduced)
}

func TestIntegrationNavRegen(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeNavRegenScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsNavRegenDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
