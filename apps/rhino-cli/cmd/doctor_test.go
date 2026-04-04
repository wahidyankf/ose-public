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
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/doctor"
)

var specsDirUnitDoctor = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type doctorUnitSteps struct {
	cmdErr     error
	cmdOutput  string
	mockResult *doctor.DoctorResult
}

func (s *doctorUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	scope = "full"
	fix = false
	dryRun = false
	s.cmdErr = nil
	s.cmdOutput = ""
	s.mockResult = nil

	// Mock findGitRoot via osGetwd/osStat
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	return context.Background(), nil
}

func (s *doctorUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	// Restore all real implementations
	doctorCheckAllFn = doctor.CheckAll
	doctorFixAllFn = doctor.FixAll
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *doctorUnitSteps) allRequiredDevelopmentToolsArePresentWithMatchingVersions() error {
	s.mockResult = &doctor.DoctorResult{
		MissingCount: 0,
		WarnCount:    0,
		OKCount:      19,
		Checks:       makeAllOKChecks(19),
	}
	doctorCheckAllFn = func(opts doctor.CheckOptions) (*doctor.DoctorResult, error) {
		if opts.Scope == doctor.ScopeMinimal {
			minimalNames := []string{"git", "volta", "node", "npm", "golang", "docker", "jq"}
			checks := make([]doctor.ToolCheck, len(minimalNames))
			for i, name := range minimalNames {
				checks[i] = doctor.ToolCheck{
					Name:   name,
					Binary: name,
					Status: doctor.StatusOK,
				}
			}
			return &doctor.DoctorResult{
				OKCount: 7,
				Checks:  checks,
				Scope:   doctor.ScopeMinimal,
			}, nil
		}
		return s.mockResult, nil
	}
	return nil
}

func (s *doctorUnitSteps) aRequiredDevelopmentToolIsNotFoundInTheSystemPATH() error {
	s.mockResult = &doctor.DoctorResult{
		MissingCount: 1,
		WarnCount:    0,
		OKCount:      18,
		Checks: append(makeAllOKChecks(18), doctor.ToolCheck{
			Name:   "golang",
			Binary: "go",
			Status: doctor.StatusMissing,
			Note:   "not found in PATH",
		}),
	}
	doctorCheckAllFn = func(_ doctor.CheckOptions) (*doctor.DoctorResult, error) {
		return s.mockResult, nil
	}
	return nil
}

func (s *doctorUnitSteps) aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion() error {
	s.mockResult = &doctor.DoctorResult{
		MissingCount: 0,
		WarnCount:    1,
		OKCount:      18,
		Checks: append(makeAllOKChecks(18), doctor.ToolCheck{
			Name:             "node",
			Binary:           "node",
			Status:           doctor.StatusWarning,
			InstalledVersion: "1.0.0",
			RequiredVersion:  "24.11.1",
		}),
	}
	doctorCheckAllFn = func(_ doctor.CheckOptions) (*doctor.DoctorResult, error) {
		return s.mockResult, nil
	}
	return nil
}

func (s *doctorUnitSteps) theDeveloperRunsTheDoctorCommand() error {
	buf := new(bytes.Buffer)
	doctorCmd.SetOut(buf)
	doctorCmd.SetErr(buf)
	s.cmdErr = doctorCmd.RunE(doctorCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *doctorUnitSteps) theDeveloperRunsTheDoctorCommandWithJSONOutput() error {
	output = "json"
	return s.theDeveloperRunsTheDoctorCommand()
}

func (s *doctorUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputReportsEachToolAsPassing() error {
	if !strings.Contains(s.cmdOutput, "Doctor Report") {
		return fmt.Errorf("expected output to contain 'Doctor Report' but got: %s", s.cmdOutput)
	}
	if strings.Contains(s.cmdOutput, "✗") {
		return fmt.Errorf("expected no missing tools (✗) in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputIdentifiesTheMissingTool() error {
	if !strings.Contains(s.cmdOutput, "✗") && !strings.Contains(strings.ToLower(s.cmdOutput), "missing") {
		return fmt.Errorf("expected output to identify missing tool (✗ or 'missing') but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputReportsTheToolAsAWarningRatherThanAFailure() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to exit successfully (warnings don't fail) but got: %v", s.cmdErr)
	}
	if !strings.Contains(s.cmdOutput, "⚠") && !strings.Contains(strings.ToLower(s.cmdOutput), "warning") {
		return fmt.Errorf("expected output to contain warning indicator (⚠ or 'warning') but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theJSONListsEveryCheckedToolWithItsStatus() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	tools, ok := parsed["tools"].([]any)
	if !ok {
		return fmt.Errorf("expected 'tools' array in JSON but got: %s", s.cmdOutput)
	}
	if len(tools) != 19 {
		return fmt.Errorf("expected 19 tools in JSON output, got %d\nOutput: %s", len(tools), s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theDeveloperRunsTheDoctorCommandWithMinimalScope() error {
	scope = "minimal"
	return s.theDeveloperRunsTheDoctorCommand()
}

func (s *doctorUnitSteps) theOutputChecksOnlyTheMinimalToolSet() error {
	// Minimal scope should check 7 tools: git, volta, node, npm, golang, docker, jq
	minimalToolNames := []string{"git", "volta", "node", "npm", "golang", "docker", "jq"}
	for _, name := range minimalToolNames {
		if !strings.Contains(s.cmdOutput, name) {
			return fmt.Errorf("expected minimal tool %q in output but not found:\n%s", name, s.cmdOutput)
		}
	}
	// Should NOT contain tools outside the minimal set
	excludedTools := []string{"java", "maven", "python", "rust", "elixir", "erlang", "dotnet", "clojure", "dart", "flutter"}
	for _, name := range excludedTools {
		if strings.Contains(s.cmdOutput, name) {
			return fmt.Errorf("minimal scope should not contain %q but found it in output:\n%s", name, s.cmdOutput)
		}
	}
	return nil
}

func (s *doctorUnitSteps) theDeveloperRunsTheDoctorCommandWithFix() error {
	fix = true
	dryRun = false
	// Mock fixAll to simulate a successful install
	doctorFixAllFn = func(result *doctor.DoctorResult, opts doctor.CheckOptions, fixOpts doctor.FixOptions, printf func(string, ...any)) doctor.FixResult {
		fr := doctor.FixResult{}
		for _, check := range result.Checks {
			if check.Status == doctor.StatusMissing {
				printf("Installing %s: mock install\n", check.Name)
				fr.Fixed++
			} else {
				fr.AlreadyOK++
			}
		}
		return fr
	}
	return s.theDeveloperRunsTheDoctorCommand()
}

func (s *doctorUnitSteps) theDeveloperRunsTheDoctorCommandWithFixDryRun() error {
	fix = true
	dryRun = true
	// Mock fixAll to simulate a dry-run preview
	doctorFixAllFn = func(result *doctor.DoctorResult, opts doctor.CheckOptions, fixOpts doctor.FixOptions, printf func(string, ...any)) doctor.FixResult {
		fr := doctor.FixResult{}
		for _, check := range result.Checks {
			if check.Status == doctor.StatusMissing {
				printf("Would install: %s via mock command\n", check.Name)
			} else {
				fr.AlreadyOK++
			}
		}
		return fr
	}
	return s.theDeveloperRunsTheDoctorCommand()
}

func (s *doctorUnitSteps) theOutputContainsFixProgress() error {
	if !strings.Contains(s.cmdOutput, "Fix summary") && !strings.Contains(s.cmdOutput, "Installing") {
		return fmt.Errorf("expected fix progress output, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputContainsDryRunPreview() error {
	if !strings.Contains(s.cmdOutput, "Would install") && !strings.Contains(s.cmdOutput, "Skip:") {
		return fmt.Errorf("expected dry-run preview, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *doctorUnitSteps) theOutputReportsNothingToFix() error {
	if !strings.Contains(s.cmdOutput, "Nothing to fix") {
		return fmt.Errorf("expected 'Nothing to fix', got: %s", s.cmdOutput)
	}
	return nil
}

// makeAllOKChecks creates n tool checks all with StatusOK.
func makeAllOKChecks(n int) []doctor.ToolCheck {
	names := []string{"git", "volta", "node", "npm", "java", "maven", "golang",
		"python", "rust", "cargo-llvm-cov", "elixir", "erlang", "dotnet",
		"clojure", "dart", "flutter", "docker", "jq", "playwright"}
	checks := make([]doctor.ToolCheck, n)
	for i := 0; i < n; i++ {
		name := "tool"
		if i < len(names) {
			name = names[i]
		}
		checks[i] = doctor.ToolCheck{
			Name:   name,
			Binary: name,
			Status: doctor.StatusOK,
		}
	}
	return checks
}

func TestUnitDoctor(t *testing.T) {
	s := &doctorUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepAllToolsPresentWithMatchingVersions, s.allRequiredDevelopmentToolsArePresentWithMatchingVersions)
			sc.Step(stepARequiredToolNotFoundInPATH, s.aRequiredDevelopmentToolIsNotFoundInTheSystemPATH)
			sc.Step(stepARequiredToolInstalledWithNonMatching, s.aRequiredDevelopmentToolIsInstalledWithANonMatchingVersion)
			sc.Step(stepDeveloperRunsDoctorCommand, s.theDeveloperRunsTheDoctorCommand)
			sc.Step(stepDeveloperRunsDoctorCommandWithJSON, s.theDeveloperRunsTheDoctorCommandWithJSONOutput)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsEachToolAsPassing, s.theOutputReportsEachToolAsPassing)
			sc.Step(stepOutputIdentifiesMissingTool, s.theOutputIdentifiesTheMissingTool)
			sc.Step(stepOutputReportsToolAsWarning, s.theOutputReportsTheToolAsAWarningRatherThanAFailure)
			sc.Step(stepOutputIsValidJSON, s.theOutputIsValidJSON)
			sc.Step(stepJSONListsEveryCheckedToolWithStatus, s.theJSONListsEveryCheckedToolWithItsStatus)
			sc.Step(stepDeveloperRunsDoctorWithMinimalScope, s.theDeveloperRunsTheDoctorCommandWithMinimalScope)
			sc.Step(stepOutputChecksOnlyMinimalToolSet, s.theOutputChecksOnlyTheMinimalToolSet)
			sc.Step(stepDeveloperRunsDoctorWithFix, s.theDeveloperRunsTheDoctorCommandWithFix)
			sc.Step(stepDeveloperRunsDoctorWithFixDryRun, s.theDeveloperRunsTheDoctorCommandWithFixDryRun)
			sc.Step(stepOutputContainsFixProgress, s.theOutputContainsFixProgress)
			sc.Step(stepOutputContainsDryRunPreview, s.theOutputContainsDryRunPreview)
			sc.Step(stepOutputReportsNothingToFix, s.theOutputReportsNothingToFix)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitDoctor},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestDoctorCommand_Initialization verifies the command metadata is correct.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestDoctorCommand_Initialization(t *testing.T) {
	if doctorCmd.Use != "doctor" {
		t.Errorf("expected Use == %q, got %q", "doctor", doctorCmd.Use)
	}
	if !strings.Contains(strings.ToLower(doctorCmd.Short), "tool") {
		t.Errorf("expected Short to contain 'tool', got %q", doctorCmd.Short)
	}
}
