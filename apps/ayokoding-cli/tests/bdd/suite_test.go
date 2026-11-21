package bdd_test

import (
	"os"
	"testing"

	"github.com/cucumber/godog"
)

// godogSuccess is the suite status godog reports when every scenario passes.
const godogSuccess = 0

// Behaviour corpus bindings (contract C13). TestContract runs every feature
// below under Options.Strict, so an undefined step fails the run; one
// whole-feature reference per file covers each scenario at every level, since
// this directory is a level glob at unit, integration, and end-to-end.
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

// TestContract runs the CLI-contract corpus through the driver the
// AYOKODING_BDD_ADAPTER environment names.
func TestContract(t *testing.T) {
	var driver Driver
	adapter := os.Getenv("AYOKODING_BDD_ADAPTER")
	switch adapter {
	case "", "unit":
		driver = unitDriver{}
	case "integration":
		binary, err := buildBinary("v0.0.0-test", allZeroCommit)
		if err != nil {
			t.Fatal(err)
		}
		driver = &binaryDriver{binary: binary}
	case "e2e":
		binary := os.Getenv("AYOKODING_BIN")
		if binary == "" {
			t.Fatal("AYOKODING_BIN is empty")
		}
		driver = &binaryDriver{binary: binary}
	default:
		t.Fatalf("unknown BDD adapter %q", os.Getenv("AYOKODING_BDD_ADAPTER"))
		driver = unitDriver{}
	}
	suite := godog.TestSuite{
		Name:                "cli-contract",
		ScenarioInitializer: func(ctx *godog.ScenarioContext) { registerSteps(ctx, driver, adapter) },
		Options: &godog.Options{
			Format: "pretty",
			Paths:  []string{"../../../../specs/apps/ayokoding/cli/behaviours"},
			Strict: true,
		},
	}
	if status := suite.Run(); status != godogSuccess {
		t.Fatalf("godog suite exited %d", status)
	}
}
