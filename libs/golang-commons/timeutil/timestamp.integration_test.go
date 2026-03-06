//go:build integration

package timeutil_test

import (
	"fmt"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/timeutil"
)

var specsTimeutilDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/libs/golang-commons/timeutil")
}()

type timestampSteps struct {
	result string
}

func (s *timestampSteps) theDeveloperCallsTimestamp() error {
	s.result = timeutil.Timestamp()
	return nil
}

func (s *timestampSteps) theDeveloperCallsJakartaTimestamp() error {
	s.result = timeutil.JakartaTimestamp()
	return nil
}

func (s *timestampSteps) theResultCanBeParsedAsRFC3339() error {
	_, err := time.Parse(time.RFC3339, s.result)
	if err != nil {
		return fmt.Errorf("expected RFC3339 format, got %q: %w", s.result, err)
	}
	return nil
}

func (s *timestampSteps) theResultContainsThePlusZeroSevenZeroZeroTimezoneOffset() error {
	if !strings.Contains(s.result, "+07:00") {
		return fmt.Errorf("expected +07:00 offset in %q", s.result)
	}
	return nil
}

func TestIntegrationTimestamp(t *testing.T) {
	s := &timestampSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Step(`^the developer calls Timestamp$`, s.theDeveloperCallsTimestamp)
			sc.Step(`^the result can be parsed as RFC3339$`, s.theResultCanBeParsedAsRFC3339)
			sc.Step(`^the developer calls JakartaTimestamp$`, s.theDeveloperCallsJakartaTimestamp)
			sc.Step(`^the result contains the "\+07:00" timezone offset$`, s.theResultContainsThePlusZeroSevenZeroZeroTimezoneOffset)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsTimeutilDir},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
