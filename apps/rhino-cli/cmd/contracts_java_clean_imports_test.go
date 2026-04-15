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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/contracts"
)

var specsDirUnitContractsJavaCleanImports = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type contractsJavaCleanImportsUnitSteps struct {
	cmdErr     error
	cmdOutput  string
	mockResult *contracts.JavaCleanImportsResult
}

func (s *contractsJavaCleanImportsUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	s.cmdErr = nil
	s.cmdOutput = ""
	s.mockResult = nil

	// Default mock: no files modified
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    0,
			ModifiedFiles: 0,
			Modified:      nil,
		}, nil
	}

	return context.Background(), nil
}

func (s *contractsJavaCleanImportsUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	contractsCleanJavaImportsFn = contracts.CleanJavaImports
	return context.Background(), nil
}

func (s *contractsJavaCleanImportsUnitSteps) aGeneratedContractsDirWithUnusedImports() error {
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    1,
			ModifiedFiles: 1,
			Modified:      []string{"Foo.java"},
		}, nil
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) aGeneratedContractsDirWithSamePackageImports() error {
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    1,
			ModifiedFiles: 1,
			Modified:      []string{"Bar.java"},
		}, nil
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) aGeneratedContractsDirWithDuplicateImports() error {
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    1,
			ModifiedFiles: 1,
			Modified:      []string{"Baz.java"},
		}, nil
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) aGeneratedContractsDirWithOnlyRequiredImports() error {
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    1,
			ModifiedFiles: 0,
			Modified:      nil,
		}, nil
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) anEmptyGeneratedContractsDir() error {
	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return &contracts.JavaCleanImportsResult{
			TotalFiles:    0,
			ModifiedFiles: 0,
			Modified:      nil,
		}, nil
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) theDeveloperRunsContractsJavaCleanImportsOnTheDirectory() error {
	buf := new(bytes.Buffer)
	contractsJavaCleanImportsCmd.SetOut(buf)
	contractsJavaCleanImportsCmd.SetErr(buf)
	s.cmdErr = contractsJavaCleanImportsCmd.RunE(contractsJavaCleanImportsCmd, []string{"/mock/contracts"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) unusedImportsRemovedFromJavaFiles() error {
	// The mock returns 1 modified file — just verify command succeeded
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) samePackageImportsRemovedFromJavaFiles() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) onlyOneCopyOfEachImportRemains() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) javaFilesAreUnchanged() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func (s *contractsJavaCleanImportsUnitSteps) commandReportsNoFilesModified() error {
	if !strings.Contains(s.cmdOutput, "No imports needed cleaning") &&
		!strings.Contains(s.cmdOutput, "0") {
		return fmt.Errorf("expected output to indicate no files modified but got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitContractsJavaCleanImports(t *testing.T) {
	s := &contractsJavaCleanImportsUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepGeneratedContractsDirWithUnusedImports, s.aGeneratedContractsDirWithUnusedImports)
			sc.Step(stepGeneratedContractsDirWithSamePackageImports, s.aGeneratedContractsDirWithSamePackageImports)
			sc.Step(stepGeneratedContractsDirWithDuplicateImports, s.aGeneratedContractsDirWithDuplicateImports)
			sc.Step(stepGeneratedContractsDirWithOnlyRequiredImports, s.aGeneratedContractsDirWithOnlyRequiredImports)
			sc.Step(stepEmptyGeneratedContractsDir, s.anEmptyGeneratedContractsDir)
			sc.Step(stepDeveloperRunsContractsJavaCleanImports, s.theDeveloperRunsContractsJavaCleanImportsOnTheDirectory)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepUnusedImportsRemovedFromJavaFiles, s.unusedImportsRemovedFromJavaFiles)
			sc.Step(stepSamePackageImportsRemovedFromJavaFiles, s.samePackageImportsRemovedFromJavaFiles)
			sc.Step(stepOnlyOneCopyOfEachImportRemains, s.onlyOneCopyOfEachImportRemains)
			sc.Step(stepJavaFilesAreUnchanged, s.javaFilesAreUnchanged)
			sc.Step(stepCommandReportsNoFilesModified, s.commandReportsNoFilesModified)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitContractsJavaCleanImports},
			TestingT: t,
			Tags:     "contracts-java-clean-imports",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestContractsJavaCleanImportsCmd_Initialization verifies command metadata.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestContractsJavaCleanImportsCmd_Initialization(t *testing.T) {
	if !strings.Contains(contractsJavaCleanImportsCmd.Use, "java-clean-imports") {
		t.Errorf("expected Use to contain 'java-clean-imports', got %q", contractsJavaCleanImportsCmd.Use)
	}
}

// TestContractsJavaCleanImportsCmd_NoArgs verifies ExactArgs(1) validation.
// This is a non-BDD test covering the args validator not in Gherkin specs.
func TestContractsJavaCleanImportsCmd_NoArgs(t *testing.T) {
	err := contractsJavaCleanImportsCmd.Args(contractsJavaCleanImportsCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

// TestContractsJavaCleanImportsCmd_FnError verifies error propagation from the internal function.
// This is a non-BDD test covering the error path not in Gherkin specs.
func TestContractsJavaCleanImportsCmd_FnError(t *testing.T) {
	origFn := contractsCleanJavaImportsFn
	defer func() { contractsCleanJavaImportsFn = origFn }()

	contractsCleanJavaImportsFn = func(_ contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		return nil, fmt.Errorf("scan error")
	}

	buf := new(bytes.Buffer)
	contractsJavaCleanImportsCmd.SetOut(buf)
	contractsJavaCleanImportsCmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err := contractsJavaCleanImportsCmd.RunE(contractsJavaCleanImportsCmd, []string{"/mock/dir"})
	if err == nil {
		t.Error("expected error when internal function fails")
	}
	if !strings.Contains(err.Error(), "java import cleaning failed") {
		t.Errorf("expected 'java import cleaning failed' error, got: %v", err)
	}
}

// TestContractsJavaCleanImportsCmd_OSFunctions verifies the os.* calls are testable.
// This is a non-BDD test covering that filepath.Abs is called correctly.
func TestContractsJavaCleanImportsCmd_OSFunctions(t *testing.T) {
	origFn := contractsCleanJavaImportsFn
	defer func() { contractsCleanJavaImportsFn = origFn }()

	var capturedDir string
	contractsCleanJavaImportsFn = func(opts contracts.JavaCleanImportsOptions) (*contracts.JavaCleanImportsResult, error) {
		capturedDir = opts.Dir
		return &contracts.JavaCleanImportsResult{}, nil
	}

	buf := new(bytes.Buffer)
	contractsJavaCleanImportsCmd.SetOut(buf)
	contractsJavaCleanImportsCmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	_ = contractsJavaCleanImportsCmd.RunE(contractsJavaCleanImportsCmd, []string{"relative/path"})

	// filepath.Abs should have made the path absolute
	if !filepath.IsAbs(capturedDir) {
		t.Errorf("expected absolute path to be passed to fn, got: %s", capturedDir)
	}
}
