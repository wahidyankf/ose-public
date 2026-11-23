// Package bddintegration runs the web-contract corpus through the
// integration driver against a real binary. browser-progress is not in this
// driver's corpus: the Playwright home runs it and binds it by name.
package bddintegration

import (
	"context"
	"testing"

	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

// Behaviour corpus bindings (contract C13). Every feature this driver runs
// has no exemption at this level, so it is referenced whole. browser-progress
// is bound by name in the Playwright home (an integration-level file).
//
// @scenario specs/apps/ayokoding/web/behaviours/content/content-rendering.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/courses/course-catalog-and-paths.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/discovery/discovery-documents.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/local-development/local-development.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/navigation/routes-and-navigation.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/search/search.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/shell/bilingual-shell.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/tools/ai-benchmark.feature: *
// @scenario specs/apps/ayokoding/web/behaviours/tools/cost-of-living-calculator.feature: *

// TestContract runs the non-exempt web-contract corpus against real listeners
// and fixture roots.
func TestContract(t *testing.T) {
	// The integration suite runs under the integration adapter or with no
	// adapter named; any other adapter must not reach this suite silently.
	if adapter, _ := glue.RequestedAdapter(); adapter != "" && adapter != "integration" {
		t.Fatalf("bdd-integration suite owns the integration adapter, got %q", adapter)
	}
	binary, err := glue.BuildBinary(t)
	if err != nil {
		t.Fatalf("integration binary must build: %v", err)
	}
	features, err := glue.IntegrationCorpus()
	if err != nil {
		t.Fatal(err)
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
			Paths:  features,
			Strict: true,
		},
	}
	if status := suite.Run(); status != glue.Success {
		t.Fatalf("godog suite exited %d", status)
	}
}
