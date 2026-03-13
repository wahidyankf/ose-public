//go:build integration

package integration_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"
)

// TestIntegration runs the Godog BDD suite.
func TestIntegration(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"../../../../specs/apps/demo/be/gherkin"},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("godog integration tests failed")
	}
}

// InitializeScenario registers all step definitions.
func InitializeScenario(sc *godog.ScenarioContext) {
	ctx := &ScenarioCtx{}
	sc.Before(func(goCtx context.Context, s *godog.Scenario) (context.Context, error) {
		ctx.reset()
		return goCtx, nil
	})
	registerHealthSteps(sc, ctx)
	registerAuthSteps(sc, ctx)
	registerTokenLifecycleSteps(sc, ctx)
	registerUserAccountSteps(sc, ctx)
	registerSecuritySteps(sc, ctx)
	registerTokenManagementSteps(sc, ctx)
	registerAdminSteps(sc, ctx)
	registerExpenseSteps(sc, ctx)
	registerCurrencySteps(sc, ctx)
	registerUnitHandlingSteps(sc, ctx)
	registerReportingSteps(sc, ctx)
	registerAttachmentSteps(sc, ctx)
}
