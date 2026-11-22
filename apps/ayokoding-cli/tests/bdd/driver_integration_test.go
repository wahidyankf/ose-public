//go:build integration

package bdd_test

import "testing"

// selectDriver builds a fresh binary from source, so signals and pipes behave
// like production.
func selectDriver(t *testing.T) (*binaryDriver, string) {
	t.Helper()
	binary, err := buildBinary("v0.0.0-test", allZeroCommit)
	if err != nil {
		t.Fatal(err)
	}
	return &binaryDriver{binary: binary}, "integration"
}
