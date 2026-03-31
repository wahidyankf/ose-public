//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
)

var specsValidateSpecCoverageDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

// Scenario: All feature files have matching test implementations
// Scenario: A feature file without a matching test is reported as a gap
// Scenario: A scenario without a matching implementation is reported as a gap
// Scenario: A step without a matching step definition is reported as a gap
// Scenario: Shared-steps mode validates steps across all source files
// Scenario: Multi-language test file matching recognizes language-specific patterns

type validateSpecCoverageSteps struct {
	originalWd string
	tmpDir     string
	specsDir   string
	appDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateSpecCoverageSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "spec-coverage-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	_ = os.MkdirAll(filepath.Join(s.tmpDir, "specs"), 0755)
	_ = os.MkdirAll(filepath.Join(s.tmpDir, "app"), 0755)
	s.specsDir = "specs"
	s.appDir = "app"
	verbose = false
	quiet = false
	output = "text"
	sharedSteps = false
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateSpecCoverageSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateSpecCoverageSteps) aSpecsDirectoryWhereEveryFeatureFileHasACorrespondingTestFile() error {
	featureContent := "Feature: My Feature\n  Scenario: My scenario\n    Given my step\n"
	featurePath := filepath.Join(s.tmpDir, s.specsDir, "my-feature.feature")
	if err := os.WriteFile(featurePath, []byte(featureContent), 0644); err != nil {
		return fmt.Errorf("failed to write feature file: %w", err)
	}

	testContent := `describeFeature(feature, ({ Scenario }) => {
  Scenario("My scenario", ({ Given }) => {
    Given("my step", () => {});
  });
});
`
	testPath := filepath.Join(s.tmpDir, s.appDir, "my-feature.integration.test.ts")
	if err := os.WriteFile(testPath, []byte(testContent), 0644); err != nil {
		return fmt.Errorf("failed to write test file: %w", err)
	}

	return nil
}

func (s *validateSpecCoverageSteps) aSpecsDirectoryContainingAFeatureFileWithNoCorrespondingTestFile() error {
	featureContent := "Feature: Uncovered Feature\n  Scenario: Uncovered scenario\n    Given an uncovered step\n"
	featurePath := filepath.Join(s.tmpDir, s.specsDir, "uncovered-feature.feature")
	if err := os.WriteFile(featurePath, []byte(featureContent), 0644); err != nil {
		return fmt.Errorf("failed to write feature file: %w", err)
	}
	return nil
}

func (s *validateSpecCoverageSteps) aFeatureFileWithAScenarioWhoseTitleDoesNotAppearInAnyTestFile() error {
	featureContent := "Feature: My Feature\n  Scenario: My scenario\n    Given my step\n"
	featurePath := filepath.Join(s.tmpDir, s.specsDir, "my-feature.feature")
	if err := os.WriteFile(featurePath, []byte(featureContent), 0644); err != nil {
		return fmt.Errorf("failed to write feature file: %w", err)
	}

	testContent := `describeFeature(feature, ({ Scenario }) => {
  Scenario("Other scenario", ({ Given }) => {
    Given("my step", () => {});
  });
});
`
	testPath := filepath.Join(s.tmpDir, s.appDir, "my-feature.integration.test.ts")
	if err := os.WriteFile(testPath, []byte(testContent), 0644); err != nil {
		return fmt.Errorf("failed to write test file: %w", err)
	}

	return nil
}

func (s *validateSpecCoverageSteps) aFeatureFileWithAStepTextThatDoesNotAppearInAnyTestFile() error {
	featureContent := "Feature: My Feature\n  Scenario: My scenario\n    Given my step\n"
	featurePath := filepath.Join(s.tmpDir, s.specsDir, "my-feature.feature")
	if err := os.WriteFile(featurePath, []byte(featureContent), 0644); err != nil {
		return fmt.Errorf("failed to write feature file: %w", err)
	}

	testContent := `describeFeature(feature, ({ Scenario }) => {
  Scenario("My scenario", ({ Given }) => {
    Given("a different step", () => {});
  });
});
`
	testPath := filepath.Join(s.tmpDir, s.appDir, "my-feature.integration.test.ts")
	if err := os.WriteFile(testPath, []byte(testContent), 0644); err != nil {
		return fmt.Errorf("failed to write test file: %w", err)
	}

	return nil
}

func (s *validateSpecCoverageSteps) theDeveloperRunsValidateSpecCoverageOnTheSpecsAndAppDirectories() error {
	buf := new(bytes.Buffer)
	validateSpecCoverageCmd.SetOut(buf)
	validateSpecCoverageCmd.SetErr(buf)
	s.cmdErr = validateSpecCoverageCmd.RunE(validateSpecCoverageCmd, []string{s.specsDir, s.appDir})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateSpecCoverageSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateSpecCoverageSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSpecCoverageSteps) theOutputReportsAllSpecsAsCovered() error {
	if !strings.Contains(s.cmdOutput, "all covered") {
		return fmt.Errorf("expected output to contain 'all covered' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSpecCoverageSteps) theOutputIdentifiesTheFeatureFileAsAnUncoveredSpec() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	if !strings.Contains(combined, "uncovered-feature") && !strings.Contains(combined, "gap") {
		return fmt.Errorf("expected output to identify the uncovered feature file but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateSpecCoverageSteps) theOutputIdentifiesTheScenarioAsAnUnimplementedScenario() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "scenario") && !strings.Contains(lc, "gap") {
		return fmt.Errorf("expected output to identify an unimplemented scenario but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateSpecCoverageSteps) theOutputIdentifiesTheStepAsAnUndefinedStep() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "step") && !strings.Contains(lc, "gap") {
		return fmt.Errorf("expected output to identify an undefined step but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateSpecCoverageSteps) featureFilesWithStepsImplementedInSharedStepFiles() error {
	featureContent := "Feature: Shared\n  Scenario: Shared scenario\n    Given a shared step\n    When another shared step\n"
	if err := os.WriteFile(filepath.Join(s.tmpDir, s.specsDir, "shared.feature"), []byte(featureContent), 0644); err != nil {
		return err
	}
	stepContent := "Given(\"a shared step\", async () => {});\nWhen(\"another shared step\", async () => {});\n"
	if err := os.WriteFile(filepath.Join(s.tmpDir, s.appDir, "common.steps.ts"), []byte(stepContent), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateSpecCoverageSteps) theDeveloperRunsValidateSpecCoverageWithSharedStepsFlag() error {
	sharedSteps = true
	buf := new(bytes.Buffer)
	validateSpecCoverageCmd.SetOut(buf)
	validateSpecCoverageCmd.SetErr(buf)
	s.cmdErr = validateSpecCoverageCmd.RunE(validateSpecCoverageCmd, []string{s.specsDir, s.appDir})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateSpecCoverageSteps) theCommandValidatesStepsAcrossAllSourceFilesWithoutFileMatching() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected shared-steps validation to succeed but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateSpecCoverageSteps) featureFilesWithTestImplementationsInMultipleLanguages() error {
	featureContent := "Feature: Multi\n  Scenario: Multi scenario\n    Given a multi step\n"
	if err := os.WriteFile(filepath.Join(s.tmpDir, s.specsDir, "multi-lang.feature"), []byte(featureContent), 0644); err != nil {
		return err
	}
	testDir := filepath.Join(s.tmpDir, s.appDir, "test")
	if err := os.MkdirAll(testDir, 0755); err != nil {
		return err
	}
	javaContent := "// Scenario: Multi scenario\n@Given(\"a multi step\")\npublic void step() {}\n"
	if err := os.WriteFile(filepath.Join(testDir, "MultiLangSteps.java"), []byte(javaContent), 0644); err != nil {
		return err
	}
	return nil
}

func (s *validateSpecCoverageSteps) testFilesAreMatchedUsingLanguageSpecificConventions() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected multi-language matching to succeed but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

// InitializeValidateSpecCoverageScenario registers all step definitions.
func InitializeValidateSpecCoverageScenario(sc *godog.ScenarioContext) {
	s := &validateSpecCoverageSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a specs directory where every feature file has a corresponding test file$`, s.aSpecsDirectoryWhereEveryFeatureFileHasACorrespondingTestFile)
	sc.Step(`^a specs directory containing a feature file with no corresponding test file$`, s.aSpecsDirectoryContainingAFeatureFileWithNoCorrespondingTestFile)
	sc.Step(`^a feature file with a scenario whose title does not appear in any test file$`, s.aFeatureFileWithAScenarioWhoseTitleDoesNotAppearInAnyTestFile)
	sc.Step(`^a feature file with a step text that does not appear in any test file$`, s.aFeatureFileWithAStepTextThatDoesNotAppearInAnyTestFile)
	sc.Step(`^the developer runs spec-coverage validate on the specs and app directories$`, s.theDeveloperRunsValidateSpecCoverageOnTheSpecsAndAppDirectories)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
	sc.Step(`^the output reports all specs as covered$`, s.theOutputReportsAllSpecsAsCovered)
	sc.Step(`^the output identifies the feature file as an uncovered spec$`, s.theOutputIdentifiesTheFeatureFileAsAnUncoveredSpec)
	sc.Step(`^the output identifies the scenario as an unimplemented scenario$`, s.theOutputIdentifiesTheScenarioAsAnUnimplementedScenario)
	sc.Step(`^the output identifies the step as an undefined step$`, s.theOutputIdentifiesTheStepAsAnUndefinedStep)
	sc.Step(`^feature files with steps implemented in shared step files$`, s.featureFilesWithStepsImplementedInSharedStepFiles)
	sc.Step(`^the developer runs spec-coverage validate with shared-steps flag$`, s.theDeveloperRunsValidateSpecCoverageWithSharedStepsFlag)
	sc.Step(`^the command validates steps across all source files without file matching$`, s.theCommandValidatesStepsAcrossAllSourceFilesWithoutFileMatching)
	sc.Step(`^feature files with test implementations in multiple languages$`, s.featureFilesWithTestImplementationsInMultipleLanguages)
	sc.Step(`^test files are matched using language-specific conventions$`, s.testFilesAreMatchedUsingLanguageSpecificConventions)
}

func TestIntegrationValidateSpecCoverage(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateSpecCoverageScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsValidateSpecCoverageDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
