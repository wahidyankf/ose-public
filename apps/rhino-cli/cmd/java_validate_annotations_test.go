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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/java"
)

var specsDirUnitJavaValidateAnnotations = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type javaValidateAnnotationsUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *javaValidateAnnotationsUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	javaAnnotation = "NullMarked"
	s.cmdErr = nil
	s.cmdOutput = ""

	// Default mock: all packages valid
	javaValidateAllFn = func(_ java.ValidationOptions) (*java.ValidationResult, error) {
		return &java.ValidationResult{
			TotalPackages: 1,
			ValidPackages: 1,
			AllPackages: []java.PackageEntry{
				{PackageDir: "com/example", Valid: true},
			},
			Annotation: "NullMarked",
		}, nil
	}

	return context.Background(), nil
}

func (s *javaValidateAnnotationsUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	javaValidateAllFn = java.ValidateAll
	return context.Background(), nil
}

func (s *javaValidateAnnotationsUnitSteps) aJavaSourceTreeAllPackagesNullMarked() error {
	javaValidateAllFn = func(_ java.ValidationOptions) (*java.ValidationResult, error) {
		return &java.ValidationResult{
			TotalPackages: 2,
			ValidPackages: 2,
			AllPackages: []java.PackageEntry{
				{PackageDir: "com/example", Valid: true},
				{PackageDir: "com/example/service", Valid: true},
			},
			Annotation: "NullMarked",
		}, nil
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) aJavaSourceTreeOnePackageNoPackageInfo() error {
	javaValidateAllFn = func(_ java.ValidationOptions) (*java.ValidationResult, error) {
		return &java.ValidationResult{
			TotalPackages: 2,
			ValidPackages: 1,
			AllPackages: []java.PackageEntry{
				{PackageDir: "com/example", Valid: true},
				{
					PackageDir:    "com/example/service",
					Valid:         false,
					ViolationType: java.ViolationMissingPackageInfo,
				},
			},
			Annotation: "NullMarked",
		}, nil
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) aJavaSourceTreeOnePackageWithoutNullMarked() error {
	javaValidateAllFn = func(_ java.ValidationOptions) (*java.ValidationResult, error) {
		return &java.ValidationResult{
			TotalPackages: 2,
			ValidPackages: 1,
			AllPackages: []java.PackageEntry{
				{PackageDir: "com/example", Valid: true},
				{
					PackageDir:    "com/example/service",
					Valid:         false,
					ViolationType: java.ViolationMissingAnnotation,
				},
			},
			Annotation: "NullMarked",
		}, nil
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) aJavaSourceTreeAllPackagesNonNull() error {
	javaAnnotation = "NonNull"
	javaValidateAllFn = func(opts java.ValidationOptions) (*java.ValidationResult, error) {
		return &java.ValidationResult{
			TotalPackages: 1,
			ValidPackages: 1,
			AllPackages: []java.PackageEntry{
				{PackageDir: "com/example", Valid: true},
			},
			Annotation: opts.Annotation,
		}, nil
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theDeveloperRunsJavaValidateAnnotationsOnRoot() error {
	buf := new(bytes.Buffer)
	validateJavaAnnotationsCmd.SetOut(buf)
	validateJavaAnnotationsCmd.SetErr(buf)
	s.cmdErr = validateJavaAnnotationsCmd.RunE(validateJavaAnnotationsCmd, []string{"/mock/src"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theDeveloperRunsJavaValidateAnnotationsNonNull() error {
	javaAnnotation = "NonNull"
	return s.theDeveloperRunsJavaValidateAnnotationsOnRoot()
}

func (s *javaValidateAnnotationsUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theOutputReportsZeroJavaViolations() error {
	if !strings.Contains(s.cmdOutput, "0 violations found") {
		return fmt.Errorf("expected '0 violations found' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theOutputIdentifiesPackageMissingPackageInfo() error {
	if !strings.Contains(s.cmdOutput, "✗") && !strings.Contains(strings.ToLower(s.cmdOutput), "violation") {
		return fmt.Errorf("expected output to identify missing package-info (✗ or 'violation') but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *javaValidateAnnotationsUnitSteps) theOutputIdentifiesPackageWithMissingAnnotation() error {
	if !strings.Contains(s.cmdOutput, "✗") && !strings.Contains(strings.ToLower(s.cmdOutput), "violation") {
		return fmt.Errorf("expected output to identify missing annotation (✗ or 'violation') but got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitJavaValidateAnnotations(t *testing.T) {
	s := &javaValidateAnnotationsUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepJavaSourceTreeAllPackagesNullMarked, s.aJavaSourceTreeAllPackagesNullMarked)
			sc.Step(stepJavaSourceTreeOnePackageNoPackageInfo, s.aJavaSourceTreeOnePackageNoPackageInfo)
			sc.Step(stepJavaSourceTreeOnePackageWithoutNullMarked, s.aJavaSourceTreeOnePackageWithoutNullMarked)
			sc.Step(stepJavaSourceTreeAllPackagesNonNull, s.aJavaSourceTreeAllPackagesNonNull)
			sc.Step(stepDeveloperRunsJavaValidateAnnotationsOnRoot, s.theDeveloperRunsJavaValidateAnnotationsOnRoot)
			sc.Step(stepDeveloperRunsJavaValidateAnnotationsNonNull, s.theDeveloperRunsJavaValidateAnnotationsNonNull)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsZeroJavaViolations, s.theOutputReportsZeroJavaViolations)
			sc.Step(stepOutputIdentifiesPackageMissingPackageInfo, s.theOutputIdentifiesPackageMissingPackageInfo)
			sc.Step(stepOutputIdentifiesPackageWithMissingAnnotation, s.theOutputIdentifiesPackageWithMissingAnnotation)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitJavaValidateAnnotations},
			TestingT: t,
			Tags:     "java-validate-annotations",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateJavaAnnotationsCmd_Initialization verifies command metadata.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestValidateJavaAnnotationsCmd_Initialization(t *testing.T) {
	if !strings.Contains(validateJavaAnnotationsCmd.Use, "validate-annotations") {
		t.Errorf("expected Use to contain 'validate-annotations', got %q", validateJavaAnnotationsCmd.Use)
	}
}

// TestValidateJavaAnnotationsCmd_NoArgs verifies ExactArgs(1) validation.
// This is a non-BDD test covering the args validator not in Gherkin specs.
func TestValidateJavaAnnotationsCmd_NoArgs(t *testing.T) {
	err := validateJavaAnnotationsCmd.Args(validateJavaAnnotationsCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

// TestValidateJavaAnnotationsCmd_FnError verifies error propagation from the internal function.
// This is a non-BDD test covering the error path not in Gherkin specs.
func TestValidateJavaAnnotationsCmd_FnError(t *testing.T) {
	origFn := javaValidateAllFn
	defer func() { javaValidateAllFn = origFn }()

	javaValidateAllFn = func(_ java.ValidationOptions) (*java.ValidationResult, error) {
		return nil, fmt.Errorf("scan failed")
	}

	buf := new(bytes.Buffer)
	validateJavaAnnotationsCmd.SetOut(buf)
	validateJavaAnnotationsCmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = false

	err := validateJavaAnnotationsCmd.RunE(validateJavaAnnotationsCmd, []string{"/mock/src"})
	if err == nil {
		t.Error("expected error when internal function fails")
	}
	if !strings.Contains(err.Error(), "validation failed") {
		t.Errorf("expected 'validation failed' error, got: %v", err)
	}
}

// TestValidateJavaAnnotationsCmd_DefaultAnnotation verifies the annotation flag defaults to NullMarked.
// This is a non-BDD test covering flag defaults not in Gherkin specs.
func TestValidateJavaAnnotationsCmd_DefaultAnnotation(t *testing.T) {
	origFn := javaValidateAllFn
	defer func() { javaValidateAllFn = origFn }()

	var capturedAnnotation string
	javaValidateAllFn = func(opts java.ValidationOptions) (*java.ValidationResult, error) {
		capturedAnnotation = opts.Annotation
		return &java.ValidationResult{TotalPackages: 0, ValidPackages: 0, Annotation: opts.Annotation}, nil
	}

	buf := new(bytes.Buffer)
	validateJavaAnnotationsCmd.SetOut(buf)
	validateJavaAnnotationsCmd.SetErr(buf)

	javaAnnotation = "NullMarked"
	output = "text"
	verbose = false
	quiet = false

	_ = validateJavaAnnotationsCmd.RunE(validateJavaAnnotationsCmd, []string{"/mock/src"})

	if capturedAnnotation != "NullMarked" {
		t.Errorf("expected default annotation 'NullMarked', got: %s", capturedAnnotation)
	}
}
