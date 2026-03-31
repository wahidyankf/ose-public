//go:build integration

package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"

	"github.com/cucumber/godog"
)

var specsValidateTestCoverageDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

// Scenario: A Go coverage file above the threshold reports success
// Scenario: A Go coverage file below the threshold reports failure
// Scenario: An LCOV file above the threshold reports success
// Scenario: Coverage at exactly the threshold passes
// Scenario: JSON output includes structured coverage metrics
// Scenario: Per-file flag shows individual file coverage
// Scenario: A Cobertura XML file above the threshold reports success
// Scenario: A Cobertura XML file with partial branches classifies correctly
// Scenario: A non-existent coverage file reports an error

type validateTestCoverageSteps struct {
	originalWd string
	tmpDir     string
	coverFile  string
	cmdErr     error
	cmdOutput  string
}

func (s *validateTestCoverageSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-test-coverage-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	perFile = false
	belowThreshold = 0
	excludePatterns = nil
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateTestCoverageSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

// goCoverContent90 produces a Go coverage file with 9/10 lines covered (90%).
func goCoverContent90() string {
	return "mode: set\n" +
		"pkg/file.go:1.1,1.9 1 1\n" +
		"pkg/file.go:2.1,2.9 1 1\n" +
		"pkg/file.go:3.1,3.9 1 1\n" +
		"pkg/file.go:4.1,4.9 1 1\n" +
		"pkg/file.go:5.1,5.9 1 1\n" +
		"pkg/file.go:6.1,6.9 1 1\n" +
		"pkg/file.go:7.1,7.9 1 1\n" +
		"pkg/file.go:8.1,8.9 1 1\n" +
		"pkg/file.go:9.1,9.9 1 1\n" +
		"pkg/file.go:10.1,10.9 1 0\n"
}

// goCoverContent70 produces a Go coverage file with 7/10 lines covered (70%).
func goCoverContent70() string {
	return "mode: set\n" +
		"pkg/file.go:1.1,1.9 1 1\n" +
		"pkg/file.go:2.1,2.9 1 1\n" +
		"pkg/file.go:3.1,3.9 1 1\n" +
		"pkg/file.go:4.1,4.9 1 1\n" +
		"pkg/file.go:5.1,5.9 1 1\n" +
		"pkg/file.go:6.1,6.9 1 1\n" +
		"pkg/file.go:7.1,7.9 1 1\n" +
		"pkg/file.go:8.1,8.9 1 0\n" +
		"pkg/file.go:9.1,9.9 1 0\n" +
		"pkg/file.go:10.1,10.9 1 0\n"
}

// goCoverContent85 produces a Go coverage file with 17/20 lines covered (85%).
func goCoverContent85() string {
	var sb strings.Builder
	sb.WriteString("mode: set\n")
	for i := 1; i <= 17; i++ {
		n := strconv.Itoa(i)
		sb.WriteString("pkg/file.go:" + n + ".1," + n + ".9 1 1\n")
	}
	for i := 18; i <= 20; i++ {
		n := strconv.Itoa(i)
		sb.WriteString("pkg/file.go:" + n + ".1," + n + ".9 1 0\n")
	}
	return sb.String()
}

// lcovContent90 produces an LCOV coverage file with 9/10 lines covered (90%).
func lcovContent90() string {
	return "TN:\n" +
		"SF:src/foo.ts\n" +
		"DA:1,1\n" +
		"DA:2,1\n" +
		"DA:3,1\n" +
		"DA:4,1\n" +
		"DA:5,1\n" +
		"DA:6,1\n" +
		"DA:7,1\n" +
		"DA:8,1\n" +
		"DA:9,1\n" +
		"DA:10,0\n" +
		"LH:9\n" +
		"LF:10\n" +
		"end_of_record\n"
}

func (s *validateTestCoverageSteps) aGoCoverageFileRecording90PercentLineCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "cover.out")
	if err := os.WriteFile(coverPath, []byte(goCoverContent90()), 0644); err != nil {
		return err
	}
	s.coverFile = "cover.out"
	return nil
}

func (s *validateTestCoverageSteps) aGoCoverageFileRecording70PercentLineCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "cover.out")
	if err := os.WriteFile(coverPath, []byte(goCoverContent70()), 0644); err != nil {
		return err
	}
	s.coverFile = "cover.out"
	return nil
}

func (s *validateTestCoverageSteps) aGoCoverageFileRecording85PercentLineCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "cover.out")
	if err := os.WriteFile(coverPath, []byte(goCoverContent85()), 0644); err != nil {
		return err
	}
	s.coverFile = "cover.out"
	return nil
}

func (s *validateTestCoverageSteps) anLCOVCoverageFileRecording90PercentLineCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "lcov.info")
	if err := os.WriteFile(coverPath, []byte(lcovContent90()), 0644); err != nil {
		return err
	}
	s.coverFile = "lcov.info"
	return nil
}

// coberturaCoverContent90 produces a Cobertura XML file with 9/10 lines covered (90%).
func coberturaCoverContent90() string {
	return `<?xml version="1.0" ?>
<coverage version="5.5" timestamp="1234567890">
  <packages>
    <package name="pkg">
      <classes>
        <class name="pkg.Cls" filename="pkg/cls.py">
          <lines>
            <line number="1" hits="1"/>
            <line number="2" hits="1"/>
            <line number="3" hits="1"/>
            <line number="4" hits="1"/>
            <line number="5" hits="1"/>
            <line number="6" hits="1"/>
            <line number="7" hits="1"/>
            <line number="8" hits="1"/>
            <line number="9" hits="1"/>
            <line number="10" hits="0"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>`
}

// coberturaCoverContentPartial produces a Cobertura XML file with partial branches (33% coverage).
func coberturaCoverContentPartial() string {
	return `<?xml version="1.0" ?>
<coverage version="5.5">
  <packages>
    <package name="pkg">
      <classes>
        <class name="pkg.Cls" filename="pkg/cls.py">
          <lines>
            <line number="1" hits="1" branch="true" condition-coverage="50% (1/2)"/>
            <line number="2" hits="1" branch="true" condition-coverage="100% (2/2)"/>
            <line number="3" hits="0"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>`
}

// lcovContentMultiFile produces an LCOV file with 2 source files (overall 90%).
func lcovContentMultiFile() string {
	return "TN:\n" +
		"SF:src/a.ts\n" +
		"DA:1,1\n" +
		"DA:2,1\n" +
		"DA:3,1\n" +
		"DA:4,1\n" +
		"DA:5,1\n" +
		"LH:5\n" +
		"LF:5\n" +
		"end_of_record\n" +
		"TN:\n" +
		"SF:src/b.ts\n" +
		"DA:1,1\n" +
		"DA:2,1\n" +
		"DA:3,1\n" +
		"DA:4,1\n" +
		"DA:5,0\n" +
		"LH:4\n" +
		"LF:5\n" +
		"end_of_record\n"
}

func (s *validateTestCoverageSteps) anLCOVCoverageFileWithMultipleSourceFiles() error {
	coverPath := filepath.Join(s.tmpDir, "lcov.info")
	if err := os.WriteFile(coverPath, []byte(lcovContentMultiFile()), 0644); err != nil {
		return err
	}
	s.coverFile = "lcov.info"
	return nil
}

func (s *validateTestCoverageSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdAndPerFileFlag() error {
	perFile = true
	buf := new(bytes.Buffer)
	validateTestCoverageCmd.SetOut(buf)
	validateTestCoverageCmd.SetErr(buf)
	s.cmdErr = validateTestCoverageCmd.RunE(validateTestCoverageCmd, []string{s.coverFile, "85"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateTestCoverageSteps) theOutputContainsPerFileCoverageBreakdown() error {
	if !strings.Contains(s.cmdOutput, "Per-file") && !strings.Contains(s.cmdOutput, "src/") {
		return fmt.Errorf("expected per-file output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theDeveloperRunsValidateWithExclusion() error {
	perFile = true
	excludePatterns = []string{"b.ts"}
	buf := new(bytes.Buffer)
	validateTestCoverageCmd.SetOut(buf)
	validateTestCoverageCmd.SetErr(buf)
	s.cmdErr = validateTestCoverageCmd.RunE(validateTestCoverageCmd, []string{s.coverFile, "85"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateTestCoverageSteps) theOutputDoesNotContainTheExcludedFile() error {
	if strings.Contains(s.cmdOutput, "src/b.ts") {
		return fmt.Errorf("expected output to NOT contain src/b.ts but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) aCoberturaXMLCoverageFileRecording90PercentLineCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "cobertura.xml")
	if err := os.WriteFile(coverPath, []byte(coberturaCoverContent90()), 0644); err != nil {
		return err
	}
	s.coverFile = "cobertura.xml"
	return nil
}

func (s *validateTestCoverageSteps) aCoberturaXMLCoverageFileWithPartialBranchCoverage() error {
	coverPath := filepath.Join(s.tmpDir, "cobertura.xml")
	if err := os.WriteFile(coverPath, []byte(coberturaCoverContentPartial()), 0644); err != nil {
		return err
	}
	s.coverFile = "cobertura.xml"
	return nil
}

func (s *validateTestCoverageSteps) noCoverageFileExistsAtTheSpecifiedPath() error {
	s.coverFile = "nonexistent_cover.out"
	return nil
}

func (s *validateTestCoverageSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold() error {
	buf := new(bytes.Buffer)
	validateTestCoverageCmd.SetOut(buf)
	validateTestCoverageCmd.SetErr(buf)
	s.cmdErr = validateTestCoverageCmd.RunE(validateTestCoverageCmd, []string{s.coverFile, "85"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateTestCoverageSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdRequestingJSONOutput() error {
	output = "json"
	buf := new(bytes.Buffer)
	validateTestCoverageCmd.SetOut(buf)
	validateTestCoverageCmd.SetErr(buf)
	s.cmdErr = validateTestCoverageCmd.RunE(validateTestCoverageCmd, []string{s.coverFile, "85"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateTestCoverageSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theOutputReportsTheMeasuredCoveragePercentage() error {
	if !strings.Contains(s.cmdOutput, "%") {
		return fmt.Errorf("expected output to contain '%%' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theOutputIndicatesTheCoveragePassesTheThreshold() error {
	if !strings.Contains(s.cmdOutput, "PASS") {
		return fmt.Errorf("expected output to contain 'PASS' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theOutputIndicatesTheCoverageFailsTheThreshold() error {
	if !strings.Contains(s.cmdOutput, "FAIL") {
		return fmt.Errorf("expected output to contain 'FAIL' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theJSONIncludesTheCoveragePercentageAndPassFailStatus() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	if _, ok := parsed["pct"]; !ok {
		return fmt.Errorf("expected JSON to contain 'pct' field but got: %s", s.cmdOutput)
	}
	if _, ok := parsed["status"]; !ok {
		return fmt.Errorf("expected JSON to contain 'status' field but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageSteps) theOutputDescribesTheMissingFile() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "coverage check failed") &&
		!strings.Contains(lc, "no such file") &&
		!strings.Contains(lc, "not found") &&
		!strings.Contains(lc, "open ") {
		return fmt.Errorf("expected output to describe missing file but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

// InitializeValidateTestCoverageScenario registers all step definitions.
func InitializeValidateTestCoverageScenario(sc *godog.ScenarioContext) {
	s := &validateTestCoverageSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a Go coverage file recording 90% line coverage$`, s.aGoCoverageFileRecording90PercentLineCoverage)
	sc.Step(`^a Go coverage file recording 70% line coverage$`, s.aGoCoverageFileRecording70PercentLineCoverage)
	sc.Step(`^a Go coverage file recording 85% line coverage$`, s.aGoCoverageFileRecording85PercentLineCoverage)
	sc.Step(`^an LCOV coverage file recording 90% line coverage$`, s.anLCOVCoverageFileRecording90PercentLineCoverage)
	sc.Step(`^an LCOV coverage file with multiple source files$`, s.anLCOVCoverageFileWithMultipleSourceFiles)
	sc.Step(`^the developer runs test-coverage validate with an 85% threshold and per-file flag$`, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdAndPerFileFlag)
	sc.Step(`^the output contains per-file coverage breakdown$`, s.theOutputContainsPerFileCoverageBreakdown)
	sc.Step(`^the developer runs test-coverage validate with exclusion of a source file$`, s.theDeveloperRunsValidateWithExclusion)
	sc.Step(`^the output does not contain the excluded file$`, s.theOutputDoesNotContainTheExcludedFile)
	sc.Step(`^a Cobertura XML coverage file recording 90% line coverage$`, s.aCoberturaXMLCoverageFileRecording90PercentLineCoverage)
	sc.Step(`^a Cobertura XML coverage file with partial branch coverage$`, s.aCoberturaXMLCoverageFileWithPartialBranchCoverage)
	sc.Step(`^no coverage file exists at the specified path$`, s.noCoverageFileExistsAtTheSpecifiedPath)
	sc.Step(`^the developer runs test-coverage validate with an 85% threshold$`, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold)
	sc.Step(`^the developer runs test-coverage validate with an 85% threshold requesting JSON output$`, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdRequestingJSONOutput)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
	sc.Step(`^the output reports the measured coverage percentage$`, s.theOutputReportsTheMeasuredCoveragePercentage)
	sc.Step(`^the output indicates the coverage passes the threshold$`, s.theOutputIndicatesTheCoveragePassesTheThreshold)
	sc.Step(`^the output indicates the coverage fails the threshold$`, s.theOutputIndicatesTheCoverageFailsTheThreshold)
	sc.Step(`^the output is valid JSON$`, s.theOutputIsValidJSON)
	sc.Step(`^the JSON includes the coverage percentage and pass/fail status$`, s.theJSONIncludesTheCoveragePercentageAndPassFailStatus)
	sc.Step(`^the output describes the missing file$`, s.theOutputDescribesTheMissingFile)
}

func TestIntegrationValidateTestCoverage(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateTestCoverageScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsValidateTestCoverageDir},
			TestingT: t,
			Tags:     "@test-coverage-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
