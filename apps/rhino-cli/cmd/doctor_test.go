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
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
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
	doctorCheckAllFn = func(_ doctor.CheckOptions) (*doctor.DoctorResult, error) {
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
			Name:   "hugo",
			Binary: "hugo",
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

// makeAllOKChecks creates n tool checks all with StatusOK.
func makeAllOKChecks(n int) []doctor.ToolCheck {
	names := []string{"git", "volta", "node", "npm", "java", "maven", "golang", "hugo",
		"python", "rust", "cargo-llvm-cov", "elixir", "erlang", "dotnet",
		"clojure", "dart", "flutter", "docker", "jq"}
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
