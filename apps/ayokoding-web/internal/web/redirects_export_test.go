package web

import (
	_ "embed"
	"encoding/json"
	"slices"
	"strings"
	"testing"
)

// committedRedirectExport is the redirect table the old www app declares in its
// six redirect modules, written by the recorded Node command in the P3-Inventory
// unit. The parity inventory reads this file, so a silent edit here would move
// the inventory without any other test noticing.
//
//go:embed testdata/www-redirects.json
var committedRedirectExport []byte

type committedRedirect struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Permanent   bool   `json:"permanent"`
}

// temporaryRedirectSources are the three rules the www modules declare with
// permanent: false. Every other rule is permanent and answers 308 in the new app.
var temporaryRedirectSources = []string{
	"/en/learn/information-security/by-example",
	"/en/learn/software-engineering/software-architecture/by-example",
	"/en/learn/software-engineering/system-design/by-example",
}

func TestCommittedRedirectExportMatchesTheWwwModules(t *testing.T) {
	var rules []committedRedirect
	if err := json.Unmarshal(committedRedirectExport, &rules); err != nil {
		t.Fatalf("committed redirect export is not a JSON rule list: %v", err)
	}
	if len(rules) != 87 {
		t.Fatalf("export holds %d rules, want the 87 the six www modules declare", len(rules))
	}
	var temporary []string
	for _, rule := range rules {
		if strings.Contains(rule.Source+rule.Destination, "://") {
			t.Fatalf("rule %q -> %q names a host; the export must hold paths only", rule.Source, rule.Destination)
		}
		if !rule.Permanent {
			temporary = append(temporary, rule.Source)
		}
	}
	slices.Sort(temporary)
	want := slices.Clone(temporaryRedirectSources)
	slices.Sort(want)
	if !slices.Equal(temporary, want) {
		t.Fatalf("temporary rules = %q, want %q", temporary, want)
	}
}
