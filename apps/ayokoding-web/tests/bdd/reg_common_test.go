package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerCommonSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.Given(`^the app is running$`, world.StepAppRunning)
}
