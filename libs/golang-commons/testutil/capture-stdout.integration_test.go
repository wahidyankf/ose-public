//go:build integration

package testutil_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/testutil"
)

var specsTestutilDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/libs/golang-commons/testutil")
}()

type captureStdoutSteps struct {
	t          *testing.T
	origStdout *os.File
	writeLines []string
	captured   string
}

func newCaptureStdoutSteps(t *testing.T) *captureStdoutSteps {
	return &captureStdoutSteps{t: t, origStdout: os.Stdout}
}

func (s *captureStdoutSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.captured = ""
	s.writeLines = nil
	os.Stdout = s.origStdout
	return context.Background(), nil
}

func (s *captureStdoutSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	os.Stdout = s.origStdout
	return context.Background(), nil
}

func (s *captureStdoutSteps) aMockFunctionThatWritesASingleLineToStdout() error {
	s.writeLines = []string{"hello from mock"}
	return nil
}

func (s *captureStdoutSteps) aMockFunctionThatWritesThreeDistinctLinesToStdout() error {
	s.writeLines = []string{"alpha", "beta", "gamma"}
	return nil
}

func (s *captureStdoutSteps) theDeveloperUsesCaptureStdoutToCaptureTheOutput() error {
	read := testutil.CaptureStdout(s.t)
	for _, line := range s.writeLines {
		fmt.Println(line)
	}
	s.captured = read()
	os.Stdout = s.origStdout
	return nil
}

func (s *captureStdoutSteps) theCapturedStringEqualsTheWrittenLineFollowedByANewline() error {
	expected := s.writeLines[0] + "\n"
	if s.captured != expected {
		return fmt.Errorf("expected %q, got %q", expected, s.captured)
	}
	return nil
}

func (s *captureStdoutSteps) theCapturedStringContainsAllThreeWrittenLines() error {
	for _, line := range s.writeLines {
		if !strings.Contains(s.captured, line) {
			return fmt.Errorf("expected captured output to contain %q, got %q", line, s.captured)
		}
	}
	return nil
}

func TestIntegrationCaptureStdout(t *testing.T) {
	s := newCaptureStdoutSteps(t)
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(`^a mock function that writes a single line to stdout$`, s.aMockFunctionThatWritesASingleLineToStdout)
			sc.Step(`^a mock function that writes three distinct lines to stdout$`, s.aMockFunctionThatWritesThreeDistinctLinesToStdout)
			sc.Step(`^the developer uses CaptureStdout to capture the output$`, s.theDeveloperUsesCaptureStdoutToCaptureTheOutput)
			sc.Step(`^the captured string equals the written line followed by a newline$`, s.theCapturedStringEqualsTheWrittenLineFollowedByANewline)
			sc.Step(`^the captured string contains all three written lines$`, s.theCapturedStringContainsAllThreeWrittenLines)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsTestutilDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
