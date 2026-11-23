//go:build e2e

package bdd_test

import (
	"os"
	"testing"
)

// selectDriver runs the stamped binary that the end-to-end target names.
func selectDriver(t *testing.T) (*binaryDriver, string) {
	t.Helper()
	binary := os.Getenv("AYOKODING_BIN")
	if binary == "" {
		t.Fatal("AYOKODING_BIN is empty")
	}
	return &binaryDriver{binary: binary}, "e2e"
}
