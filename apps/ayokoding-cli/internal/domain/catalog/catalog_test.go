package catalog_test

import (
	"errors"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// pinnedPython is the digest-pinned language entry every catalog test builds
// on. Digests are fixture-shaped and never pulled.
const pinnedPython = `  - id: python
    kind: language
    version: "3.15.0"
    image: docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
`

// pinnedPostgres is the digest-pinned service entry every catalog test builds
// on.
const pinnedPostgres = `  - id: postgres
    kind: service
    version: "18.6"
    image: docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    ready: [pg_isready, -h, 127.0.0.1, -U, postgres]
    readyTimeout: 60s
    connect:
      PGHOST: postgres
`

// validCatalogBytes holds one language and one service, both pinned.
func validCatalogBytes() []byte {
	return []byte("schema: ayokoding.toolchains/v1\ntoolchains:\n" + pinnedPython + pinnedPostgres)
}

// catalogCase is one catalog decoding case.
type catalogCase struct {
	name      string
	yaml      string
	wantCodes []string
	wantLine  int
}

// catalogCases holds one row per catalog rule.
func catalogCases() []catalogCase {
	cases := append(catalogStructureCases(), catalogImageServiceCases()...)
	return cases
}

// catalogStructureCases holds the decoding, identity, and kind rows.
func catalogStructureCases() []catalogCase {
	return []catalogCase{
		{
			name: "unknown key is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				pinnedPython +
				"    extra: true\n" +
				pinnedPostgres,
			wantCodes: []string{finding.CatalogUnknownKey},
			wantLine:  7,
		},
		{
			name: "duplicate key is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: python\n" +
				"    kind: language\n" +
				"    kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
			wantCodes: []string{finding.CatalogDuplicateKey},
			wantLine:  5,
		},
		{
			name:      "missing schema is rejected",
			yaml:      "toolchains:\n" + pinnedPython,
			wantCodes: []string{finding.CatalogMissingSchema},
			wantLine:  1,
		},
		{
			name:      "wrong schema is rejected",
			yaml:      "schema: ayokoding.toolchains/v9\ntoolchains:\n" + pinnedPython,
			wantCodes: []string{finding.CatalogInvalidSchema},
			wantLine:  1,
		},
		{
			name: "missing id is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
			wantCodes: []string{finding.CatalogMissingID},
			wantLine:  3,
		},
		{
			name: "duplicate id is rejected at the second entry",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				pinnedPython +
				"  - id: python\n" +
				"    kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
			wantCodes: []string{finding.CatalogDuplicateID},
			wantLine:  7,
		},
		{
			name: "unknown kind is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: python\n" +
				"    kind: runtime\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
			wantCodes: []string{finding.CatalogInvalidKind},
			wantLine:  4,
		},
	}
}

// catalogImageServiceCases holds the digest and service rows.
func catalogImageServiceCases() []catalogCase {
	return []catalogCase{
		{
			name: "image without a digest is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: python\n" +
				"    kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0\n",
			wantCodes: []string{finding.CatalogUnpinnedImage},
			wantLine:  6,
		},
		{
			name: "placeholder digest is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: python\n" +
				"    kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:PENDING\n",
			wantCodes: []string{finding.CatalogUnpinnedImage},
			wantLine:  6,
		},
		{
			name: "short digest is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: python\n" +
				"    kind: language\n" +
				"    version: \"3.15.0\"\n" +
				"    image: docker.io/library/python:3.15.0@sha256:abc\n",
			wantCodes: []string{finding.CatalogUnpinnedImage},
			wantLine:  6,
		},
		{
			name: "service without readiness is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: postgres\n" +
				"    kind: service\n" +
				"    version: \"18.6\"\n" +
				"    image: docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n" +
				"    connect:\n" +
				"      PGHOST: postgres\n",
			wantCodes: []string{finding.CatalogInvalidService},
			wantLine:  3,
		},
		{
			name: "service without connect variables is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: postgres\n" +
				"    kind: service\n" +
				"    version: \"18.6\"\n" +
				"    image: docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n" +
				"    ready: [pg_isready]\n",
			wantCodes: []string{finding.CatalogInvalidService},
			wantLine:  3,
		},
		{
			name: "readiness past one hundred twenty seconds is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: postgres\n" +
				"    kind: service\n" +
				"    version: \"18.6\"\n" +
				"    image: docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n" +
				"    ready: [pg_isready]\n" +
				"    readyTimeout: 121s\n" +
				"    connect:\n" +
				"      PGHOST: postgres\n",
			wantCodes: []string{finding.CatalogInvalidTimeout},
			wantLine:  8,
		},
		{
			name: "unparsable readiness timeout is rejected",
			yaml: "schema: ayokoding.toolchains/v1\ntoolchains:\n" +
				"  - id: postgres\n" +
				"    kind: service\n" +
				"    version: \"18.6\"\n" +
				"    image: docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n" +
				"    ready: [pg_isready]\n" +
				"    readyTimeout: soon\n" +
				"    connect:\n" +
				"      PGHOST: postgres\n",
			wantCodes: []string{finding.CatalogInvalidTimeout},
			wantLine:  8,
		},
	}
}

// TestDecodeChecksEveryCatalogRule runs one YAML slice per catalog rule.
func TestDecodeChecksEveryCatalogRule(t *testing.T) {
	for _, row := range catalogCases() {
		t.Run(row.name, func(t *testing.T) {
			_, findings := catalog.Decode([]byte(row.yaml))
			if len(findings) != len(row.wantCodes) {
				codes := make([]string, 0, len(findings))
				for _, found := range findings {
					codes = append(codes, found.Code)
				}
				t.Fatalf("codes=%q, want %q", codes, row.wantCodes)
			}
			for i, want := range row.wantCodes {
				if findings[i].Code != want {
					t.Fatalf("finding %d code=%q, want %q", i, findings[i].Code, want)
				}
			}
			if findings[0].Line != row.wantLine {
				t.Fatalf("line=%d, want %d (code=%q)", findings[0].Line, row.wantLine, findings[0].Code)
			}
		})
	}
}

// TestDecodeAcceptsPinnedCatalog requires the valid catalog to decode with
// its entries intact.
func TestDecodeAcceptsPinnedCatalog(t *testing.T) {
	got, findings := catalog.Decode(validCatalogBytes())
	if len(findings) != 0 {
		t.Fatalf("findings=%+v, want none", findings)
	}
	if len(got.Toolchains) != 2 {
		t.Fatalf("toolchains=%d, want 2", len(got.Toolchains))
	}
	python, found := got.Lookup("python")
	if !found || python.Kind != catalog.KindLanguage {
		t.Fatalf("python=%+v, want the language entry", python)
	}
	if _, found := got.Lookup("cobol"); found {
		t.Fatalf("cobol lookup succeeded, want failure")
	}
	service, found := got.Lookup("postgres")
	if !found || service.Kind != catalog.KindService {
		t.Fatalf("postgres=%+v, want the service entry", service)
	}
	if len(service.Ready) == 0 || len(service.Connect) == 0 {
		t.Fatalf("postgres=%+v, want ready and connect", service)
	}
}

// TestLoadRefusesUnpinnedCatalog requires Load to fail closed with the
// unpinned-image code.
func TestLoadRefusesUnpinnedCatalog(t *testing.T) {
	files := fstest.MapFS{
		"catalog.yaml": {Data: []byte("schema: ayokoding.toolchains/v1\ntoolchains:\n" +
			"  - id: python\n" +
			"    kind: language\n" +
			"    version: \"3.15.0\"\n" +
			"    image: docker.io/library/python:3.15.0\n")},
	}
	_, err := catalog.Load(files)
	if err == nil {
		t.Fatalf("Load succeeded, want unpinned-image refusal")
	}
	coded, found := errors.AsType[*finding.Error](err)
	if !found {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.CatalogUnpinnedImage {
		t.Fatalf("code=%q, want unpinned-image", coded.Code)
	}
}

// TestLoadReadsPinnedCatalog requires Load to accept the valid catalog from
// a filesystem.
func TestLoadReadsPinnedCatalog(t *testing.T) {
	files := fstest.MapFS{"catalog.yaml": {Data: validCatalogBytes()}}
	got, err := catalog.Load(files)
	if err != nil {
		t.Fatalf("Load=%v, want nil", err)
	}
	if len(got.Toolchains) != 2 {
		t.Fatalf("toolchains=%d, want 2", len(got.Toolchains))
	}
}

// TestDerivedTagChangesWithRecipe requires the tag to follow the base
// digest, the Dockerfile bytes, and the build arguments.
func TestDerivedTagChangesWithRecipe(t *testing.T) {
	recipe := []byte("FROM debian@trixie\nRUN apt-get install -y bash\n")
	base := "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	first := catalog.DerivedTag("shell", "docker.io/library/debian:trixie@"+base, recipe, nil)
	if !strings.HasPrefix(first, "ayokoding-toolchain/shell:") {
		t.Fatalf("tag=%q, want the ayokoding-toolchain/shell prefix", first)
	}
	changed := append(append([]byte(nil), recipe...), '\n')
	second := catalog.DerivedTag("shell", "docker.io/library/debian:trixie@"+base, changed, nil)
	if first == second {
		t.Fatalf("one Dockerfile byte changed but tag=%q stayed", first)
	}
	third := catalog.DerivedTag("shell", "docker.io/library/debian:trixie@"+base, recipe, []string{"SNAPSHOT=20260101"})
	if first == third {
		t.Fatalf("build arguments changed but tag=%q stayed", first)
	}
	if catalog.DerivedTag("shell", "docker.io/library/debian:trixie@"+base, recipe, nil) != first {
		t.Fatalf("same recipe gave a different tag")
	}
}

// TestHashIdentifiesCatalogBytes requires the hash to be stable, sensitive,
// and hex-shaped.
func TestHashIdentifiesCatalogBytes(t *testing.T) {
	first := catalog.Hash(validCatalogBytes())
	if len(first) != 64 {
		t.Fatalf("hash=%q, want 64 hex characters", first)
	}
	for _, digit := range first {
		if (digit < '0' || digit > '9') && (digit < 'a' || digit > 'f') {
			t.Fatalf("hash=%q, want lowercase hex", first)
		}
	}
	if catalog.Hash(validCatalogBytes()) != first {
		t.Fatalf("same bytes gave a different hash")
	}
	if catalog.Hash([]byte("schema: ayokoding.toolchains/v1\n")) == first {
		t.Fatalf("different bytes gave the same hash")
	}
}
