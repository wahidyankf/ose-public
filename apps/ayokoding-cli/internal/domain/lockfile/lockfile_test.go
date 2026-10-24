package lockfile_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/lockfile"
)

// TestParseLine_pinsTheLockAgreement drives the lock grammar both plans 09
// and 10 share: two fields, a three-part coordinate, a 64-hex hash.
func TestParseLine_pinsTheLockAgreement(t *testing.T) {
	line, ok, err := lockfile.ParseLine("com.google.code.gson:gson:2.13.1 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120")
	if err != nil {
		t.Fatalf("valid line rejected: %v", err)
	}
	if !ok {
		t.Fatal("valid line reported as skipped")
	}
	if line.SHA256 != "94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120" {
		t.Fatalf("hash=%q", line.SHA256)
	}
	for raw, want := range map[string]string{
		"nogroup 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120": "one-part coordinate",
		"a:b 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120":     "two-part coordinate",
		"a:b:c:d 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120": "four-part coordinate",
		"com.google.code.gson:gson:2.13.1 nothex":                                  "bad hash",
		"com.google.code.gson:gson:2.13.1 9485 extra":                              "bad hash and repository",
		"com.google.code.gson:gson:2.13.1":                                         "one field",
	} {
		if _, _, err := lockfile.ParseLine(raw); err == nil {
			t.Errorf("%s accepted: %q", want, raw)
		}
	}
}

// TestParseLine_acceptsTheRepositoryField drives the AC-1 grammar: an optional
// third field naming the repository (`central`, the default, or `clojars`);
// any other name is rejected.
func TestParseLine_acceptsTheRepositoryField(t *testing.T) {
	for _, raw := range []string{
		"com.google.code.gson:gson:2.13.1 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120 central",
		"migratus:migratus:1.6.8 2bb23f04e4d0f03418ca5408782bcfc57004b5051a131e4f272627df43a7b34f clojars",
	} {
		line, ok, err := lockfile.ParseLine(raw)
		if err != nil {
			t.Errorf("repository line rejected: %q: %v", raw, err)
			continue
		}
		if !ok {
			t.Errorf("repository line reported as skipped: %q", raw)
		}
		if line.Repository == "" {
			t.Errorf("repository lost: %q", raw)
		}
	}
	central, _, err := lockfile.ParseLine("com.google.code.gson:gson:2.13.1 94855942d4992f112946d3de1c334e709237b8126d8130bf07807c018a4a2120")
	if err != nil {
		t.Fatalf("two-field line rejected: %v", err)
	}
	if central.Repository != "central" {
		t.Errorf("missing repository does not default to central: %q", central.Repository)
	}
	for _, raw := range []string{
		"migratus:migratus:1.6.8 2bb23f04e4d0f03418ca5408782bcfc57004b5051a131e4f272627df43a7b34f elsewhere",
		"migratus:migratus:1.6.8 2bb23f04e4d0f03418ca5408782bcfc57004b5051a131e4f272627df43a7b34f CENTRAL",
	} {
		if _, _, err := lockfile.ParseLine(raw); err == nil {
			t.Errorf("unknown repository accepted: %q", raw)
		}
	}
}

// TestParseLine_skipsNothingElse ensures only blanks and comments skip.
func TestParseLine_skipsNothingElse(t *testing.T) {
	for _, raw := range []string{"#x", "  # indented", ""} {
		if _, ok, err := lockfile.ParseLine(raw); err != nil || ok {
			t.Errorf("skip line misread: %q (ok=%v, err=%v)", raw, ok, err)
		}
	}
}
