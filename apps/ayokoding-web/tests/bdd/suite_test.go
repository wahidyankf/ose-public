// Package bdd runs the web-contract corpus through the unit and e2e
// drivers. The integration driver owns tests/bdd-integration, which binds
// every step except the @integration-exempt browser scenarios.
package bdd

import (
	"context"
	"os"
	"testing"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

// TestContract runs the web-contract corpus through the driver the
// AYOKODING_BDD_ADAPTER environment names.
func TestContract(t *testing.T) {
	adapter := os.Getenv("AYOKODING_BDD_ADAPTER")
	if adapter == "" {
		adapter = "unit"
	}
	var driver glue.Driver
	switch adapter {
	case "unit":
		driver = glue.UnitDriver{}
	case "e2e":
		binary := os.Getenv("AYOKODING_BIN")
		if binary == "" {
			t.Fatal("AYOKODING_BIN is empty")
		}
		glue.SuiteBinary = binary
		driver = &glue.BinaryDriver{Binary: binary}
	default:
		t.Fatalf("unknown BDD adapter %q for this suite", adapter)
	}
	if stop, err := driver.Setup(t); err != nil {
		t.Fatal(err)
	} else {
		defer stop()
	}
	suite := godog.TestSuite{
		Name: "web-contract",
		ScenarioInitializer: func(ctx *godog.ScenarioContext) {
			world := glue.NewWorld(adapter)
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
			registerProgressSteps(ctx, world)
			registerToolsSteps(ctx, world)
			registerLocaldevSteps(ctx, world)
		},
		Options: &godog.Options{
			Format: "pretty",
			Paths:  glue.Corpus,
			Strict: true,
		},
	}
	if status := suite.Run(); status != glue.Success {
		t.Fatalf("godog suite exited %d", status)
	}
}
