package catalog_test

import (
	"errors"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// TestValidatedParsesCatalogBytes requires invalid YAML to fail the
// parse before any rule runs.
func TestValidatedParsesCatalogBytes(t *testing.T) {
	_, err := catalog.Validated([]byte("toolchains: [unclosed\n"))
	if err == nil {
		t.Fatal("Validated=nil, want the parse failure")
	}
	coded, found := errors.AsType[*finding.Error](err)
	if !found || coded.Code != finding.CatalogInvalidType {
		t.Fatalf("Validated=%v, want the invalid type code", err)
	}
}

// TestValidatedChecksEntryRules requires bad platforms and misplaced
// timeouts to fail with their lines.
func TestValidatedChecksEntryRules(t *testing.T) {
	badPlatform := "schema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython +
		"    platform: bogus\n"
	_, err := catalog.Validated([]byte(badPlatform))
	if err == nil || !strings.Contains(err.Error(), "bogus") {
		t.Fatalf("Validated=%v, want the platform named", err)
	}
	misplacedTimeout := "schema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython +
		"    readyTimeout: 60s\n"
	_, err = catalog.Validated([]byte(misplacedTimeout))
	if err == nil {
		t.Fatal("Validated=nil, want the misplaced timeout")
	}
	coded, found := errors.AsType[*finding.Error](err)
	if !found || coded.Code != finding.CatalogInvalidTimeout {
		t.Fatalf("Validated=%v, want the timeout code", err)
	}
}

// TestValidatedClassifiesDecoderFailures requires decoder-only defects
// to map onto the closed vocabulary.
func TestValidatedClassifiesDecoderFailures(t *testing.T) {
	duplicated := "schema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython +
		"    version: \"1.0.0\"\n" + "    version: \"2.0.0\"\n"
	_, dupErr := catalog.Validated([]byte(duplicated))
	coded, found := errors.AsType[*finding.Error](dupErr)
	if !found || coded.Code != finding.CatalogDuplicateKey {
		t.Fatalf("Validated=%v, want the duplicate key from the walk", dupErr)
	}
	unknownTop := "schema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython +
		"bogus: true\n"
	_, unknownErr := catalog.Validated([]byte(unknownTop))
	coded, found = errors.AsType[*finding.Error](unknownErr)
	if !found || coded.Code != finding.CatalogUnknownKey {
		t.Fatalf("Validated=%v, want the unknown key from the walk", unknownErr)
	}
}
