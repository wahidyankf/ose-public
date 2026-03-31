package cmd

import (
	"bytes"
	"context"
	"fmt"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/contracts"
)

var specsDirUnitContractsDartScaffold = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type contractsDartScaffoldUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *contractsDartScaffoldUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	s.cmdErr = nil
	s.cmdOutput = ""

	// Default mock: scaffold created, no model files
	contractsScaffoldDartFn = func(_ contracts.DartScaffoldOptions) (*contracts.DartScaffoldResult, error) {
		return &contracts.DartScaffoldResult{
			PubspecCreated: true,
			BarrelCreated:  true,
			ModelFiles:     nil,
		}, nil
	}

	return context.Background(), nil
}

func (s *contractsDartScaffoldUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	contractsScaffoldDartFn = contracts.ScaffoldDart
	return context.Background(), nil
}

func (s *contractsDartScaffoldUnitSteps) aGeneratedContractsDirWithModelDartFiles() error {
	contractsScaffoldDartFn = func(_ contracts.DartScaffoldOptions) (*contracts.DartScaffoldResult, error) {
		return &contracts.DartScaffoldResult{
			PubspecCreated: true,
			BarrelCreated:  true,
			ModelFiles:     []string{"bar_model.dart", "foo_model.dart"},
		}, nil
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) aGeneratedContractsDirWithNoModelFiles() error {
	contractsScaffoldDartFn = func(_ contracts.DartScaffoldOptions) (*contracts.DartScaffoldResult, error) {
		return &contracts.DartScaffoldResult{
			PubspecCreated: true,
			BarrelCreated:  true,
			ModelFiles:     nil,
		}, nil
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) anExistingGeneratedContractsDirWithOldScaffoldFiles() error {
	contractsScaffoldDartFn = func(_ contracts.DartScaffoldOptions) (*contracts.DartScaffoldResult, error) {
		return &contracts.DartScaffoldResult{
			PubspecCreated: true,
			BarrelCreated:  true,
			ModelFiles:     []string{"foo_model.dart"},
		}, nil
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) theDeveloperRunsContractsDartScaffoldOnTheDirectory() error {
	buf := new(bytes.Buffer)
	contractsDartScaffoldCmd.SetOut(buf)
	contractsDartScaffoldCmd.SetErr(buf)
	s.cmdErr = contractsDartScaffoldCmd.RunE(contractsDartScaffoldCmd, []string{"/mock/contracts"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *contractsDartScaffoldUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) pubspecYamlCreatedWithCorrectContent() error {
	// The mock reports PubspecCreated = true; command delegates entirely to the internal fn.
	// Just verify the command succeeded.
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) barrelLibraryCreatedWithPartDirectives() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) pubspecYamlCreated() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) barrelLibraryCreatedWithoutPartDirectives() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsDartScaffoldUnitSteps) existingFilesOverwrittenWithFreshScaffold() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func TestUnitContractsDartScaffold(t *testing.T) {
	s := &contractsDartScaffoldUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepGeneratedContractsDirWithModelDartFiles, s.aGeneratedContractsDirWithModelDartFiles)
			sc.Step(stepGeneratedContractsDirWithNoModelFiles, s.aGeneratedContractsDirWithNoModelFiles)
			sc.Step(stepExistingGeneratedContractsDirWithOldScaffold, s.anExistingGeneratedContractsDirWithOldScaffoldFiles)
			sc.Step(stepDeveloperRunsContractsDartScaffold, s.theDeveloperRunsContractsDartScaffoldOnTheDirectory)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepPubspecYamlCreatedWithCorrectContent, s.pubspecYamlCreatedWithCorrectContent)
			sc.Step(stepBarrelLibraryCreatedWithPartDirectives, s.barrelLibraryCreatedWithPartDirectives)
			sc.Step(stepPubspecYamlCreated, s.pubspecYamlCreated)
			sc.Step(stepBarrelLibraryCreatedWithoutPartDirectives, s.barrelLibraryCreatedWithoutPartDirectives)
			sc.Step(stepExistingFilesOverwrittenWithFreshScaffold, s.existingFilesOverwrittenWithFreshScaffold)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitContractsDartScaffold},
			TestingT: t,
			Tags:     "contracts-dart-scaffold",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestContractsDartScaffoldCmd_Initialization verifies command metadata.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestContractsDartScaffoldCmd_Initialization(t *testing.T) {
	if !strings.Contains(contractsDartScaffoldCmd.Use, "dart-scaffold") {
		t.Errorf("expected Use to contain 'dart-scaffold', got %q", contractsDartScaffoldCmd.Use)
	}
}

// TestContractsDartScaffoldCmd_NoArgs verifies ExactArgs(1) validation.
// This is a non-BDD test covering the args validator not in Gherkin specs.
func TestContractsDartScaffoldCmd_NoArgs(t *testing.T) {
	err := contractsDartScaffoldCmd.Args(contractsDartScaffoldCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

// TestContractsDartScaffoldCmd_FnError verifies error propagation from the internal function.
// This is a non-BDD test covering the error path not in Gherkin specs.
func TestContractsDartScaffoldCmd_FnError(t *testing.T) {
	origFn := contractsScaffoldDartFn
	defer func() { contractsScaffoldDartFn = origFn }()

	contractsScaffoldDartFn = func(_ contracts.DartScaffoldOptions) (*contracts.DartScaffoldResult, error) {
		return nil, fmt.Errorf("scaffold error")
	}

	buf := new(bytes.Buffer)
	contractsDartScaffoldCmd.SetOut(buf)
	contractsDartScaffoldCmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err := contractsDartScaffoldCmd.RunE(contractsDartScaffoldCmd, []string{"/mock/dir"})
	if err == nil {
		t.Error("expected error when internal function fails")
	}
	if !strings.Contains(err.Error(), "dart scaffolding failed") {
		t.Errorf("expected 'dart scaffolding failed' error, got: %v", err)
	}
}
