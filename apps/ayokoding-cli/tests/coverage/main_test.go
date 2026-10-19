package main

import (
	"strings"
	"testing"
)

func TestCoverageDiscoveryDistinguishesDeclarationsFromExecutableBodies(t *testing.T) {
	for _, row := range []struct {
		name, source string
		want         bool
	}{
		{"types and constants", "package fixture\ntype Value struct{ Count int }; const Limit=1", false},
		{"global literal", "package fixture\nvar Value=map[string]int{\"key\":1}", false},
		{"external declaration", "package fixture\nfunc external()", false},
		{"ordinary function", "package fixture\nfunc decide() int { return 1 }", true},
		{"empty function", "package fixture\nfunc empty() {}", true},
		{"receiver method", "package fixture\ntype Value int;func(Value) decide() int{return 1}", true},
		{"closure initializer", "package fixture\nvar Value=func()int{return 1}()", true},
		{"empty closure", "package fixture\nvar Value=func(){}", true},
	} {
		t.Run(row.name, func(t *testing.T) {
			got, err := coverageHasBody([]byte(row.source))
			if err != nil || got != row.want {
				t.Fatalf("body discovery=%v error=%v, want %v", got, err, row.want)
			}
		})
	}
}

func TestCoverageRejectsMissingProfileForExecutableAndEmptyBodies(t *testing.T) {
	for _, source := range []string{"package fixture\nfunc decide()int{return 1}", "package fixture\nfunc empty(){}", "package fixture\nvar Value=func(){}"} {
		selected, err := coverageHasBody([]byte(source))
		if err != nil {
			t.Fatal(err)
		}
		if !selected {
			t.Fatalf("executable body omitted: %s", source)
		}
		if _, err = countCoverage(strings.NewReader("mode: set\n"), map[string]bool{"body.go": true}); err == nil {
			t.Fatal("missing profile for executable body accepted")
		}
	}
}

func TestCoverageCountsEmptyBodyWithoutChangingStatementFloor(t *testing.T) {
	profile := "mode: set\nmodule/empty.go:2.15,2.17 0 1\nmodule/body.go:2.18,2.30 1 1\n"
	counts, err := countCoverage(strings.NewReader(profile), map[string]bool{"empty.go": true, "body.go": true})
	if err != nil || counts.covered != 1 || counts.total != 1 {
		t.Fatalf("zero-statement body changed floor: %+v %v", counts, err)
	}
}

func TestCoverageMergesSameBlocksAcrossTestPackages(t *testing.T) {
	profile := "mode: set\nmodule/body.go:2.18,2.30 1 0\nmodule/empty.go:2.15,2.17 0 1\nmodule/body.go:2.18,2.30 1 1\nmodule/empty.go:2.15,2.17 0 0\n"
	counts, err := countCoverage(strings.NewReader(profile), map[string]bool{"body.go": true, "empty.go": true})
	if err != nil || counts.covered != 1 || counts.total != 1 {
		t.Fatalf("duplicate blocks changed actual statement coverage: %+v %v", counts, err)
	}
}

func TestCoverageRefusesConflictingBlockStatementCounts(t *testing.T) {
	profile := "mode: set\nmodule/body.go:2.18,2.30 1 0\nmodule/body.go:2.18,2.30 2 1\n"
	if _, err := countCoverage(strings.NewReader(profile), map[string]bool{"body.go": true}); err == nil {
		t.Fatal("conflicting statement counts accepted")
	}
}
