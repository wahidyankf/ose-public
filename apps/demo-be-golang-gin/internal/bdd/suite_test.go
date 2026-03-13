package bdd_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"
)

// TestBDD runs the Godog BDD suite using the in-memory store.
func TestUnit(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: initializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"../../../../specs/apps/demo-be/gherkin"},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("godog BDD tests failed")
	}
}

// initializeScenario registers all step definitions.
func initializeScenario(sc *godog.ScenarioContext) {
	ctx := &scenarioCtx{}
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
