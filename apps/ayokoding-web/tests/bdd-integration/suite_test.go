// Package bddintegration runs the web-contract corpus through the
// integration driver. It binds every step except the @integration-exempt
// browser scenarios, which the static gate excuses only when no binding
// references them; their alternative proof is the future Playwright suite.
package bddintegration

import (
	"context"
	"os"
	"testing"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

// TestContract runs the non-exempt web-contract corpus against real listeners
// and fixture roots.
func TestContract(t *testing.T) {
	if adapter := os.Getenv("AYOKODING_BDD_ADAPTER"); adapter != "" && adapter != "integration" {
		t.Skipf("bdd-integration suite owns the integration adapter, got %q", adapter)
	}
	binary, err := glue.BuildBinary(t)
	if err != nil {
		t.Skipf("integration binary unavailable: %v", err)
	}
	glue.SuiteBinary = binary
	driver := &glue.BinaryDriver{Binary: binary}
	if stop, err := driver.Setup(t); err != nil {
		t.Fatal(err)
	} else {
		defer stop()
	}
	suite := godog.TestSuite{
		Name: "web-contract-integration",
		ScenarioInitializer: func(ctx *godog.ScenarioContext) {
			world := glue.NewWorld("integration")
			ctx.After(func(ctx context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
				world.CloseScenario()
				return ctx, nil
			})
			registerCommonSteps(ctx, world)
			registerShellSteps(ctx, world)
			registerRoutesSteps(ctx, world)
			registerContentSteps(ctx, world)
			registerCoursesSteps(ctx, world)
			registerSearchSteps(ctx, world)
			registerDiscoverySteps(ctx, world)
			registerToolsSteps(ctx, world)
			registerLocaldevSteps(ctx, world)
		},
		Options: &godog.Options{
			Format: "pretty",
			Paths:  glue.Corpus,
			Strict: true,
			Tags:   "~@integration-exempt",
		},
	}
	if status := suite.Run(); status != glue.Success {
		t.Fatalf("godog suite exited %d", status)
	}
}
