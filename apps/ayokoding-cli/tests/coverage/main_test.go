package main

import (
	"errors"
	"strings"
	"testing"
	"testing/fstest"
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

func TestCoverageLoadExclusionRules(t *testing.T) {
	fsys := fstest.MapFS{
		"valid.txt":      {Data: []byte("body.go:10 # real runtime only\n\nother.go:20 # no unit trigger\n")},
		"reasonless.txt": {Data: []byte("body.go:10\n")},
	}
	for _, row := range []struct {
		name, path string
		want       int
		wantErr    error
	}{
		{"valid rules", "valid.txt", 2, nil},
		{"missing file", "missing.txt", 0, nil}, // any error closes the gate; sentinel asserted below
		{"missing reason", "reasonless.txt", 0, errCoverageExcludeFormat},
	} {
		t.Run(row.name, func(t *testing.T) {
			rules, err := loadExclusionRules(fsys, row.path)
			if row.wantErr != nil {
				if !errors.Is(err, row.wantErr) {
					t.Fatalf("error=%v, want %v", err, row.wantErr)
				}
				return
			}
			if row.path == "missing.txt" {
				if err == nil {
					t.Fatal("missing rule file accepted")
				}
				return
			}
			if err != nil || len(rules) != row.want {
				t.Fatalf("rules=%v error=%v, want %d rules", rules, err, row.want)
			}
			if rules[0].path != "body.go" || rules[0].line != 10 || rules[0].reason == "" {
				t.Fatalf("rule parsed wrong: %+v", rules[0])
			}
		})
	}
}

func TestCoverageParseExclusionRules(t *testing.T) {
	rules, err := parseExclusionRules(strings.NewReader("body.go:10 # real runtime only\n\nother.go:20 # no unit trigger\n"))
	if err != nil || len(rules) != 2 {
		t.Fatalf("rules=%v error=%v, want 2 rules", rules, err)
	}
	if rules[0].path != "body.go" || rules[0].line != 10 || rules[0].reason == "" {
		t.Fatalf("rule parsed wrong: %+v", rules[0])
	}
	if _, err := parseExclusionRules(strings.NewReader("body.go:10\n")); !errors.Is(err, errCoverageExcludeFormat) {
		t.Fatalf("reasonless rule accepted: %v", err)
	}
}

func TestCoverageExclusionMatchesBlockRange(t *testing.T) {
	rule := func(path string, line int) exclusionRule {
		return exclusionRule{path: path, line: line, reason: "owner-granted fixture"}
	}
	for _, row := range []struct {
		name                   string
		profile                string
		exclusions             []exclusionRule
		wantCovered, wantTotal int
		wantExcluded           excludedCoverage
		wantErr                error
	}{
		{"rule matches single-line block", "mode: set\nmod/cmd/ayokoding-cli/main.go:7.12,7.40 1 0\nmod/other.go:2.1,2.10 1 1\n", []exclusionRule{rule("cmd/ayokoding-cli/main.go", 7)}, 1, 1, excludedCoverage{total: 1, blocks: 1}, nil},
		{"rule inside multi-line block", "mode: set\nmodule/main.go:6.12,8.40 2 0\nmodule/other.go:2.1,2.10 1 1\n", []exclusionRule{rule("main.go", 7)}, 1, 1, excludedCoverage{total: 2, blocks: 1}, nil},
		{"stale rule matches nothing", "mode: set\nmodule/main.go:6.12,8.40 2 0\n", []exclusionRule{rule("main.go", 99)}, 0, 0, excludedCoverage{}, errCoverageExcludeStale},
		{"matched covered block", "mode: set\nmodule/main.go:6.12,8.40 2 1\n", []exclusionRule{rule("main.go", 7)}, 0, 0, excludedCoverage{}, errCoverageExcludeCovered},
	} {
		t.Run(row.name, func(t *testing.T) {
			selected := map[string]bool{"main.go": true}
			if strings.Contains(row.profile, "other.go") {
				selected["other.go"] = true
			}
			counts, excluded, err := countCoverageExcluding(strings.NewReader(row.profile), selected, row.exclusions)
			if row.wantErr != nil {
				if !errors.Is(err, row.wantErr) {
					t.Fatalf("error=%v, want %v", err, row.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if counts.covered != row.wantCovered || counts.total != row.wantTotal || excluded != row.wantExcluded {
				t.Fatalf("covered/total/excluded=%+v/%+v, want %d/%d/%+v", counts, excluded, row.wantCovered, row.wantTotal, row.wantExcluded)
			}
		})
	}
}

func TestCoverageExcluding(t *testing.T) {
	profile := "mode: set\n" +
		"module/body.go:10.20,12.5 2 0\n" +
		"module/body.go:14.1,16.9 3 1\n" +
		"module/other.go:10.3,11.7 1 0\n"
	selected := map[string]bool{"body.go": true, "other.go": true}
	rule := func(path string, line int) exclusionRule {
		return exclusionRule{path: path, line: line, reason: "owner-granted fixture"}
	}
	for _, row := range []struct {
		name                   string
		exclusions             []exclusionRule
		wantCovered, wantTotal int
		wantExcluded           excludedCoverage
		wantErr                error
	}{
		{"no exclusions", nil, 3, 6, excludedCoverage{}, nil},
		{"skips matched uncovered block", []exclusionRule{rule("body.go", 10)}, 3, 4, excludedCoverage{total: 2, blocks: 1}, nil},
		{"skips two blocks", []exclusionRule{rule("body.go", 10), rule("other.go", 10)}, 3, 3, excludedCoverage{total: 3, blocks: 2}, nil},
		{"stale rule", []exclusionRule{rule("gone.go", 99)}, 0, 0, excludedCoverage{}, errCoverageExcludeStale},
		{"covered block", []exclusionRule{rule("body.go", 14)}, 0, 0, excludedCoverage{}, errCoverageExcludeCovered},
	} {
		t.Run(row.name, func(t *testing.T) {
			counts, excluded, err := countCoverageExcluding(strings.NewReader(profile), selected, row.exclusions)
			if row.wantErr != nil {
				if !errors.Is(err, row.wantErr) {
					t.Fatalf("error=%v, want %v", err, row.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if counts.covered != row.wantCovered || counts.total != row.wantTotal || excluded != row.wantExcluded {
				t.Fatalf("covered/total/excluded=%+v/%+v, want %d/%d/%+v", counts, excluded, row.wantCovered, row.wantTotal, row.wantExcluded)
			}
		})
	}
}
