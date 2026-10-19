package architecture_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/tests/architecture"
)

// fixturePaths maps each negative fixture file to the virtual production path
// it stands in for.
var fixturePaths = map[string]string{
	"domain-osexec.go.txt":         "internal/domain/fixture/osexec.go",
	"domain-cobra.go.txt":          "internal/domain/fixture/cobra.go",
	"application-bootstrap.go.txt": "internal/application/fixture/bootstrap.go",
}

// TestNegativeFixturesAreReported pins the three parity row 21 violations:
// domain code reaching for os/exec, domain code reaching for cobra, and
// application code importing internal/bootstrap.
func TestNegativeFixturesAreReported(t *testing.T) {
	for _, row := range []struct {
		name    string
		fixture string
	}{
		{"domain importing os/exec", "domain-osexec.go.txt"},
		{"domain importing cobra", "domain-cobra.go.txt"},
		{"application importing internal/bootstrap", "application-bootstrap.go.txt"},
	} {
		t.Run(row.name, func(t *testing.T) {
			source, err := os.ReadFile(filepath.Join("testdata", row.fixture))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}
			imports, err := architecture.FileImports(source)
			if err != nil {
				t.Fatalf("parse fixture: %v", err)
			}
			found := architecture.Violations(fixturePaths[row.fixture], imports)
			if len(found) == 0 {
				t.Fatalf("fixture %s reported no violation", row.fixture)
			}
			for _, violation := range found {
				if !strings.Contains(violation, ": ") {
					t.Fatalf("violation carries no reason: %s", violation)
				}
			}
		})
	}
}

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
