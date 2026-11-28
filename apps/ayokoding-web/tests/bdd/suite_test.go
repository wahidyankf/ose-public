// Package bdd runs the web-contract corpus through the unit and e2e
// drivers. The integration driver owns tests/bdd-integration, which runs the
// corpus except browser-progress (bound by name in the Playwright home).
package bdd

import (
	"context"
	"testing"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

// Behaviour corpus bindings (contract C13). The unit run has no exemption at
// all, so every feature of the corpus is referenced whole; the suite runs
// Options.Strict, and an undefined step fails it.
//
// @scenario specs/apps/ayokoding/web/behaviours/content/content-rendering.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/content/content-rendering-http.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/courses/course-catalog-and-paths.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/discovery/discovery-documents.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/learning-progress/browser-progress.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development-http.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/navigation/routes-and-navigation.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/navigation/routes-and-navigation-http.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/search/search.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/search/search-http.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/shell/bilingual-shell.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/tools/ai-benchmark.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/tools/cost-of-living-calculator.feature: *

// TestContract runs the web-contract corpus through the driver the
// AYOKODING_BDD_ADAPTER environment names.
func TestContract(t *testing.T) {
	adapter, binary := glue.RequestedAdapter()
	if adapter == "" {
		adapter = "unit"
	}
	var driver glue.Driver
	switch adapter {
	case "unit":
		driver = glue.UnitDriver{}
	case "e2e":
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
