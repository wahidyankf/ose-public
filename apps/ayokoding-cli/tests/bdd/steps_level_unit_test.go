//go:build !integration && !e2e

package bdd_test

import (
	"fmt"

	"github.com/cucumber/godog"
)

// The unit level binds only the hermetic steps in steps_core_test.go. A step
// that reaches a level hook names a scenario the unit selection in
// driver_unit_test.go must not run, so the hook fails it.

// levelState is empty at the unit level: no scenario stages disk, containers,
// or host variables.
type levelState struct{}

// givenLevel rejects a Given step that is outside the unit level.
func (w *world) givenLevel(text string) error {
	return fmt.Errorf("%w: Given %q is outside the unit level", errStepFailed, text)
}

// whenLevel rejects a When step that is outside the unit level.
func (w *world) whenLevel(text string) error {
	return fmt.Errorf("%w: When %q is outside the unit level", errStepFailed, text)
}

// thenLevel rejects a Then step that is outside the unit level.
func (w *world) thenLevel(text string) error {
	return fmt.Errorf("%w: Then %q is outside the unit level", errStepFailed, text)
}

// registerHooks adds no hook: the unit level stages no disk state and sets
// no host variables.
func (*levelState) registerHooks(_ *godog.ScenarioContext) {}
