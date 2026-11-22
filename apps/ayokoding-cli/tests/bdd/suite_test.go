package bdd_test

import (
	"testing"

	"github.com/cucumber/godog"
)

// godogSuccess is the suite status godog reports when every scenario passes.
const godogSuccess = 0

// Behaviour corpus bindings (contract C13). TestContract runs the features
// below under Options.Strict, so an undefined step fails the run; one
// whole-feature reference per file names each scenario, and the build tag of
// the level decides which of them that level runs (see levelPaths).
//
// @scenario specs/apps/ayokoding/cli/behaviours/cli-contract/command-line-contract.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/content-layout.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/coverage-report.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/determinism.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/environment-failures.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/example-execution.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/inert-courses.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/run-spec-validation.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/selection.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/simulation-runs.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/examples/static-mode.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/toolchains/rootless-runtime.feature: *
// @scenario specs/apps/ayokoding/cli/behaviours/toolchains/toolchain-catalog.feature: *

// TestContract runs the CLI-contract corpus through the driver that the
// level's build tag selects (see driver_unit_test.go, driver_integration_test.go,
// and driver_e2e_test.go). The default build reads no environment, so the
// unit level stays hermetic under contract C21.
func TestContract(t *testing.T) {
	driver, adapter := selectDriver(t)
	suite := godog.TestSuite{
		Name:                "cli-contract",
		ScenarioInitializer: func(ctx *godog.ScenarioContext) { registerSteps(ctx, driver, adapter) },
		Options: &godog.Options{
			Format: "pretty",
			Paths:  levelPaths(),
			Strict: true,
		},
	}
	if status := suite.Run(); status != godogSuccess {
		t.Fatalf("godog suite exited %d", status)
	}
}
