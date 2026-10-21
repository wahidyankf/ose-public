// Cleanup-guaranteed temp files for RoundTrip: no litter on any outcome.
// => t.TempDir: per-test directory, auto-removed after the test finishes
// => t.Cleanup: extra teardown (logging) that runs even on failure paths
package main

import (
	"os"            // => MkdirTemp only as the explicit-cleanup demonstration
	"path/filepath" // => Join builds the scratch path portably
	"testing"       // => TempDir and Cleanup: the hermetic-test toolkit
)

// TestRoundTripKeepsBytes proves the write-read pair with auto-cleanup.
// => TempDir first: the directory exists before any file operation runs
func TestRoundTripKeepsBytes(t *testing.T) { // => hermetic: no repo paths touched
	// => per-test temp dir: unique, and removed automatically afterwards
	dir := t.TempDir() // => no manual Remove needed: the runner owns it
	// => Cleanup logs AFTER removal: proves teardown ran even on success
	t.Cleanup(func() { // => runs last: after the test AND after TempDir removal
		t.Log("scratch verified clean") // => visible in -v: the guarantee, logged
	})
	// => scratch path inside the temp dir: Join keeps separators portable
	path := filepath.Join(dir, "note.txt") // => the only file this test makes
	// => the assertion: fixed text round-trips byte-identically through files
	if got, err := RoundTrip(path, "catat"); err != nil || got != "catat" { // => both halves
		t.Errorf("RoundTrip = %q, %v; want %q, nil", got, err, "catat") // => names both
	}
}

// TestExplicitCleanupShowsOrder proves Cleanup runs LIFO even on failure.
// => second test: order guarantee demonstrated with an explicit temp dir
func TestExplicitCleanupShowsOrder(t *testing.T) { // => LIFO: last registered first
	// => manual temp dir this time: Cleanup (not TempDir) owns its removal
	dir, err := os.MkdirTemp("", "ex43-*") // => explicit: Cleanup must remove it
	// => creation failure aborts: nothing exists to clean up afterwards
	if err != nil { // => environmental: temp dir unwritable, stop here
		t.Fatal(err) // => Fatal: setup failed, cases cannot run meaningfully
	}
	// => deferred-style teardown via Cleanup: runs on pass AND on Fatal above
	t.Cleanup(func() { // => registered once: the single removal point
		os.RemoveAll(dir) // => whole tree: nothing of this test survives
	})
	// => prove the directory exists mid-test: removal happens only at the end
	if _, err := os.Stat(dir); err != nil { // => must exist right now
		t.Errorf("scratch dir missing mid-test: %v", err) // => setup lied otherwise
	}
}
