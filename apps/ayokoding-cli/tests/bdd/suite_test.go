package bdd_test

import (
	"os"
	"testing"

	"github.com/cucumber/godog"
)

// godogSuccess is the suite status godog reports when every scenario passes.
const godogSuccess = 0

// TestContract runs the CLI-contract corpus through the driver the
// AYOKODING_BDD_ADAPTER environment names.
func TestContract(t *testing.T) {
	var driver Driver
	switch os.Getenv("AYOKODING_BDD_ADAPTER") {
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
		ScenarioInitializer: func(ctx *godog.ScenarioContext) { registerSteps(ctx, driver) },
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
