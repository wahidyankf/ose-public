//go:build !integration && !e2e

package bdd_test

import (
	"fmt"
	"testing"
)

// selectDriver returns the in-process driver. The unit level starts no binary
// and reads no environment, so the default build stays hermetic.
func selectDriver(_ *testing.T) (unitDriver, string) {
	return unitDriver{}, "unit"
}

// levelPaths selects the unit-level scenarios by their feature line. Every
// other scenario reads a fixture course, a temporary directory, a child
// process, or the clock, so it runs at the integration and end-to-end levels.
// The unit list is the command-line contract scenarios that touch none of
// those: help, usage, version, colour, a closed pipe, and an internal
// failure. The no-input and interrupt scenarios are re-levelled.
func levelPaths() []string {
	const feature = "../../../../specs/apps/ayokoding/cli/behaviours/cli-contract/command-line-contract.feature"
	lines := []int{9, 17, 24, 31, 38, 46, 64, 71, 86}
	paths := make([]string, 0, len(lines))
	for _, line := range lines {
		paths = append(paths, fmt.Sprintf("%s:%d", feature, line))
	}
	return paths
}
