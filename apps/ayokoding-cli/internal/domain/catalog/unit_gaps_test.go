package catalog_test

import (
	"errors"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// TestLoadRefusesUnreadableCatalog requires a missing catalog file to fail
// the read before any decoding runs.
func TestLoadRefusesUnreadableCatalog(t *testing.T) {
	_, err := catalog.Load(fstest.MapFS{})
	if err == nil || !strings.Contains(err.Error(), "catalog.yaml") {
		t.Fatalf("Load=%v, want the missing catalog.yaml", err)
	}
}

// TestValidatedCountsFindings requires several defects to name their count
// on the first finding.
func TestValidatedCountsFindings(t *testing.T) {
	yaml := "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
		pinnedPython +
		"    extra: true\n" +
		"  - id: second\n" +
		"    kind: language\n" +
		"    version: \"1.0.0\"\n" +
		"    image: docker.io/library/x:1.0.0@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\n" +
		"    extra2: true\n"
	_, err := catalog.Validated([]byte(yaml))
	if err == nil {
		t.Fatal("Validated=nil, want findings")
	}
	if !strings.Contains(err.Error(), "(2 findings)") {
		t.Fatalf("Validated=%v, want the finding count", err)
	}
	coded, found := errors.AsType[*finding.Error](err)
	if !found || coded.Code != finding.CatalogUnknownKey {
		t.Fatalf("Validated=%v, want the first finding code", err)
	}
}

// TestDecodeRejectsNonMapping requires a scalar catalog to fail with the
// mapping rule.
func TestDecodeRejectsNonMapping(t *testing.T) {
	for _, doc := range []string{"just a string\n", "- a\n- list\n"} {
		_, err := catalog.Validated([]byte(doc))
		if err == nil {
			t.Fatalf("Validated=nil for %q, want the mapping rule", doc)
		}
		coded, found := errors.AsType[*finding.Error](err)
		if !found || coded.Code != finding.CatalogInvalidType {
			t.Fatalf("Validated=%v, want the invalid type code", err)
		}
	}
}

// TestDecodeRejectsDuplicateKeys requires a repeated key to name both
// lines.
func TestDecodeRejectsDuplicateKeys(t *testing.T) {
	yaml := "schema: ayokoding.toolchains/v1\nschema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython
	_, findings := catalog.Decode([]byte(yaml))
	if len(findings) == 0 {
		t.Fatal("findings empty, want the duplicate key")
	}
	if findings[0].Code != finding.CatalogDuplicateKey {
		t.Fatalf("code=%q, want the duplicate key code", findings[0].Code)
	}
	if findings[0].Line != 2 {
		t.Fatalf("Line=%d, want the repeated key line", findings[0].Line)
	}
}

// TestDecodeRejectsUntypedFields requires a wrong-typed field to fail with
// the invalid type code.
func TestDecodeRejectsUntypedFields(t *testing.T) {
	yaml := "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
		"  - id: typed\n" +
		"    kind: language\n" +
		"    version: [1, 2]\n" +
		"    image: docker.io/library/x:1.0.0@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\n"
	_, findings := catalog.Decode([]byte(yaml))
	if len(findings) == 0 {
		t.Fatal("findings empty, want the invalid type code")
	}
	if findings[0].Code != finding.CatalogInvalidType {
		t.Fatalf("code=%q, want the invalid type code", findings[0].Code)
	}
	if findings[0].Line < 1 {
		t.Fatalf("Line=%d, want a positive line", findings[0].Line)
	}
}

// TestLookupMissesUnknownIDs requires an unknown id to report absence.
func TestLookupMissesUnknownIDs(t *testing.T) {
	got, err := catalog.Validated(validCatalogBytes())
	if err != nil {
		t.Fatalf("Validated=%v, want nil", err)
	}
	if _, ok := got.Lookup("zeta"); ok {
		t.Fatal("Lookup=true, want false for the unknown id")
	}
	tool, ok := got.Lookup("python")
	if !ok || tool.ID != "python" {
		t.Fatalf("Lookup=%+v,%v, want the python toolchain", tool, ok)
	}
}
