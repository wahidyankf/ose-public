//go:build integration

package architecture_test

import (
	"os"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/tests/architecture"
)

// TestProductionGraphPasses walks the real cmd and internal trees and requires
// zero violations.
func TestProductionGraphPasses(t *testing.T) {
	files, err := architecture.ProductionFiles("../..")
	if err != nil {
		t.Fatalf("walk production tree: %v", err)
	}
	if len(files) == 0 {
		t.Fatal("production walk found no Go files")
	}
	for virtual, disk := range files {
		source, err := os.ReadFile(disk)
		if err != nil {
			t.Fatalf("read production file: %v", err)
		}
		imports, err := architecture.FileImports(source)
		if err != nil {
			t.Fatalf("parse production file: %v", err)
		}
		for _, violation := range architecture.Violations(virtual, imports) {
			t.Errorf("production violation: %s", violation)
		}
	}
}
