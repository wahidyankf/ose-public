//go:build integration_pg

package integration_pg_test

import (
	"context"
	"testing"

	"github.com/cucumber/godog"
)

// TestIntegrationPG runs the Godog BDD suite against a real PostgreSQL database.
func TestIntegrationPG(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: initializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"/specs/apps/demo/be/gherkin"},
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("godog integration_pg tests failed")
	}
}

// initializeScenario registers all step definitions.
func initializeScenario(sc *godog.ScenarioContext) {
	ctx := &scenarioCtx{}
	sc.Before(func(goCtx context.Context, s *godog.Scenario) (context.Context, error) {
		if err := ctx.reset(); err != nil {
			return goCtx, err
		}
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
