package glossary

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
)

// fakeStatInfo implements os.FileInfo for testing stat calls.
type fakeStatInfo struct{ isDir bool }

func (f fakeStatInfo) Name() string       { return "" }
func (f fakeStatInfo) IsDir() bool        { return f.isDir }
func (f fakeStatInfo) Size() int64        { return 0 }
func (f fakeStatInfo) Mode() os.FileMode  { return os.ModeDir }
func (f fakeStatInfo) ModTime() time.Time { return time.Time{} }
func (f fakeStatInfo) Sys() any           { return nil }

// ── Parser tests ──────────────────────────────────────────────────────────────

func TestParse_ReadError(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	osReadFileFn = func(_ string) ([]byte, error) { return nil, errors.New("no such file") }

	g := Parse("/nonexistent/glossary.md")
	if len(g.ParseErrors) == 0 {
		t.Fatal("expected parse error for read failure")
	}
}

func TestParse_FullGlossary(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	content := `# Ubiquitous Language — journal

**Bounded context**: ` + "`journal`" + `
**Maintainer**: team
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| ` + "`JournalEvent`" + ` | A record. | ` + "`JournalEvent`" + ` | journal/mechanism.feature |

## Forbidden synonyms

- "Entry" — used by routine.
`
	osReadFileFn = func(_ string) ([]byte, error) { return []byte(content), nil }

	g := Parse("/test.md")
	if g.Frontmatter["Bounded context"] == "" {
		t.Error("expected Bounded context in frontmatter")
	}
	if g.Frontmatter["Maintainer"] == "" {
		t.Error("expected Maintainer in frontmatter")
	}
	if g.Frontmatter["Last reviewed"] == "" {
		t.Error("expected Last reviewed in frontmatter")
	}
	if len(g.Terms) != 1 {
		t.Fatalf("expected 1 term, got %d", len(g.Terms))
	}
	if g.Terms[0].Term != "JournalEvent" {
		t.Errorf("unexpected term: %q", g.Terms[0].Term)
	}
	if len(g.Terms[0].CodeIdentifiers) != 1 || g.Terms[0].CodeIdentifiers[0] != "JournalEvent" {
		t.Errorf("unexpected code identifiers: %v", g.Terms[0].CodeIdentifiers)
	}
	if len(g.Terms[0].UsedInFeatures) != 1 {
		t.Errorf("unexpected feature refs: %v", g.Terms[0].UsedInFeatures)
	}
	if len(g.ForbiddenSynonyms) != 1 {
		t.Fatalf("expected 1 forbidden synonym, got %d", len(g.ForbiddenSynonyms))
	}
	if g.ForbiddenSynonyms[0].Term != "Entry" {
		t.Errorf("unexpected forbidden term: %q", g.ForbiddenSynonyms[0].Term)
	}
}

func TestParse_MalformedHeader(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	content := `# Ubiquitous Language — x

**Bounded context**: ` + "`x`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | BadColumn | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
`
	osReadFileFn = func(_ string) ([]byte, error) { return []byte(content), nil }

	g := Parse("/test.md")
	if len(g.ParseErrors) == 0 {
		t.Fatal("expected parse error for malformed header")
	}
	found := false
	for _, pe := range g.ParseErrors {
		if containsString(pe.Message, "malformed terms table header") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'malformed terms table header' in parse errors, got: %+v", g.ParseErrors)
	}
}

func TestParse_MultipleCodeIdentifiers(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	content := `# Ubiquitous Language — x

**Bounded context**: ` + "`x`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Multi | Multi-id term. | ` + "`TypeA`" + `, ` + "`TypeB`" + ` | x/x.feature |

## Forbidden synonyms

`
	osReadFileFn = func(_ string) ([]byte, error) { return []byte(content), nil }

	g := Parse("/test.md")
	if len(g.Terms) != 1 {
		t.Fatalf("expected 1 term, got %d", len(g.Terms))
	}
	if len(g.Terms[0].CodeIdentifiers) != 2 {
		t.Errorf("expected 2 code identifiers, got %d: %v", len(g.Terms[0].CodeIdentifiers), g.Terms[0].CodeIdentifiers)
	}
}

func TestParse_EmptyTermsTable(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	content := `# Ubiquitous Language — x

**Bounded context**: ` + "`x`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |

## Forbidden synonyms

`
	osReadFileFn = func(_ string) ([]byte, error) { return []byte(content), nil }

	g := Parse("/test.md")
	if len(g.Terms) != 0 {
		t.Errorf("expected 0 terms, got %d", len(g.Terms))
	}
}

func TestParse_NoForbiddenSection(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	content := `# Ubiquitous Language — x

**Bounded context**: ` + "`x`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
`
	osReadFileFn = func(_ string) ([]byte, error) { return []byte(content), nil }

	g := Parse("/test.md")
	if len(g.ForbiddenSynonyms) != 0 {
		t.Errorf("expected 0 forbidden synonyms, got %d", len(g.ForbiddenSynonyms))
	}
}

func TestSplitTableRow(t *testing.T) {
	cells := splitTableRow("| Term | Definition | Code identifier(s) | Used in features |")
	if len(cells) != 4 {
		t.Fatalf("expected 4 cells, got %d: %v", len(cells), cells)
	}
	if cells[0] != "Term" {
		t.Errorf("expected 'Term', got %q", cells[0])
	}
}

func TestIsSeparatorRow(t *testing.T) {
	sep := splitTableRow("| --- | --- | --- | --- |")
	if !isSeparatorRow(sep) {
		t.Error("expected separator row to be detected")
	}
	nonSep := splitTableRow("| Term | Def | Ids | Feats |")
	if isSeparatorRow(nonSep) {
		t.Error("expected non-separator row not to be detected")
	}
}

func TestStripMarkup(t *testing.T) {
	got := stripMarkup("  `JournalEvent`  ")
	if got != "JournalEvent" {
		t.Errorf("expected 'JournalEvent', got %q", got)
	}
}

func TestParseBacktickList_MultipleIdentifiers(t *testing.T) {
	ids := parseBacktickList("`TypeA`, `TypeB` (TS union)")
	if len(ids) != 2 {
		t.Fatalf("expected 2 identifiers, got %d: %v", len(ids), ids)
	}
}

func TestParseBacktickList_Empty(t *testing.T) {
	ids := parseBacktickList("none")
	if len(ids) != 0 {
		t.Errorf("expected 0 identifiers for plain text, got %d", len(ids))
	}
}

func TestParseFeatureRefs_Multiple(t *testing.T) {
	refs := parseFeatureRefs("journal/a.feature, journal/b.feature")
	if len(refs) != 2 {
		t.Fatalf("expected 2 refs, got %d: %v", len(refs), refs)
	}
}

func TestParseFeatureRefs_BRSeparator(t *testing.T) {
	refs := parseFeatureRefs("journal/a.feature<br>journal/b.feature")
	if len(refs) != 2 {
		t.Fatalf("expected 2 refs for <br>-separated, got %d: %v", len(refs), refs)
	}
}

func TestParseForbiddenEntry_WithDash(t *testing.T) {
	term, reason := parseForbiddenEntry(`"Entry" — used by routine.`)
	if term != "Entry" {
		t.Errorf("expected term 'Entry', got %q", term)
	}
	if reason == "" {
		t.Error("expected non-empty reason")
	}
}

func TestParseForbiddenEntry_NoDash(t *testing.T) {
	term, _ := parseForbiddenEntry(`"OnlyTerm"`)
	if term != "OnlyTerm" {
		t.Errorf("expected term 'OnlyTerm', got %q", term)
	}
}

// ── Validator tests ───────────────────────────────────────────────────────────

// oneContextRegistry returns a minimal registry with one context.
func oneContextRegistry() *bcregistry.Registry {
	return &bcregistry.Registry{
		Version: 1,
		App:     "test",
		Contexts: []bcregistry.Context{{
			Name:     "ctx1",
			Layers:   []string{"domain"},
			Code:     "apps/test/src/contexts/ctx1",
			Glossary: "specs/apps/test/ubiquitous-language/ctx1.md",
			Gherkin:  "specs/apps/test/fe/gherkin/ctx1",
		}},
	}
}

func twoContextRegistry() *bcregistry.Registry {
	return &bcregistry.Registry{
		Version: 1,
		App:     "test",
		Contexts: []bcregistry.Context{
			{Name: "ctxa", Code: "apps/test/src/contexts/ctxa", Glossary: "specs/apps/test/ubiquitous-language/ctxa.md", Gherkin: "specs/apps/test/fe/gherkin/ctxa"},
			{Name: "ctxb", Code: "apps/test/src/contexts/ctxb", Glossary: "specs/apps/test/ubiquitous-language/ctxb.md", Gherkin: "specs/apps/test/fe/gherkin/ctxb"},
		},
	}
}

func TestValidateAll_LoadError(t *testing.T) {
	orig := loadRegistryFn
	defer func() { loadRegistryFn = orig }()

	loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) {
		return nil, errors.New("not found")
	}

	_, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err == nil {
		t.Fatal("expected error when registry load fails")
	}
}

func withMocks(t *testing.T, fn func()) {
	t.Helper()
	origLoad := loadRegistryFn
	origRead := osReadFileFn
	origStat := osStatFn
	origGrep := grepFn
	t.Cleanup(func() {
		loadRegistryFn = origLoad
		osReadFileFn = origRead
		osStatFn = origStat
		grepFn = origGrep
	})
	fn()
}

func TestValidateAll_MissingFrontmatterKey(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return oneContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx1

**Bounded context**: ` + "`ctx1`" + `
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |

## Forbidden synonyms

`), nil
		}
		osStatFn = func(_ string) (os.FileInfo, error) { return fakeStatInfo{isDir: false}, nil }
		grepFn = func(_, _ string, _ []string) int { return 1 }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	found := false
	for _, f := range findings {
		if containsString(f.Message, "missing frontmatter key: Maintainer") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'missing frontmatter key: Maintainer' finding, got: %+v", findings)
	}
}

func TestValidateAll_StaleCodeIdentifier(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return oneContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx1

**Bounded context**: ` + "`ctx1`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Ghost | Missing. | ` + "`GhostType`" + ` | ctx1/ctx1.feature |

## Forbidden synonyms

`), nil
		}
		osStatFn = func(_ string) (os.FileInfo, error) { return fakeStatInfo{isDir: false}, nil }
		grepFn = func(_, _ string, _ []string) int { return 0 }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	found := false
	for _, f := range findings {
		if containsString(f.Message, "stale identifier") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'stale identifier' finding, got: %+v", findings)
	}
}

func TestValidateAll_MissingFeatureReference(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return oneContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx1

**Bounded context**: ` + "`ctx1`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Known | Present. | ` + "`KnownType`" + ` | ctx1/nonexistent.feature |

## Forbidden synonyms

`), nil
		}
		grepFn = func(_, _ string, _ []string) int { return 1 }
		osStatFn = func(_ string) (os.FileInfo, error) { return nil, errors.New("not found") }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	found := false
	for _, f := range findings {
		if containsString(f.Message, "missing feature reference") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'missing feature reference' finding, got: %+v", findings)
	}
}

func TestValidateAll_TermCollision(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return twoContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx

**Bounded context**: ` + "`ctx`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Entry | A record. | ` + "`EntryType`" + ` | ctx/ctx.feature |

## Forbidden synonyms

`), nil
		}
		osStatFn = func(_ string) (os.FileInfo, error) { return fakeStatInfo{isDir: false}, nil }
		grepFn = func(_, _ string, _ []string) int { return 1 }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	found := false
	for _, f := range findings {
		if containsString(f.Message, "term collision") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'term collision' finding, got: %+v", findings)
	}
}

func TestValidateAll_ForbiddenSynonymInUse(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return oneContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx1

**Bounded context**: ` + "`ctx1`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |

## Forbidden synonyms

- "BadWord" — do not use.
`), nil
		}
		osStatFn = func(_ string) (os.FileInfo, error) { return fakeStatInfo{isDir: false}, nil }
		grepFn = func(_, _ string, _ []string) int { return 3 }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	found := false
	for _, f := range findings {
		if containsString(f.Message, "forbidden synonym used in own context") {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected 'forbidden synonym used in own context' finding, got: %+v", findings)
	}
}

func TestValidateAll_CleanGlossary(t *testing.T) {
	withMocks(t, func() {
		loadRegistryFn = func(_, _ string) (*bcregistry.Registry, error) { return oneContextRegistry(), nil }
		osReadFileFn = func(_ string) ([]byte, error) {
			return []byte(`# Ubiquitous Language — ctx1

**Bounded context**: ` + "`ctx1`" + `
**Maintainer**: t
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Known | A known type. | ` + "`KnownType`" + ` | ctx1/ctx1.feature |

## Forbidden synonyms

`), nil
		}
		osStatFn = func(_ string) (os.FileInfo, error) { return fakeStatInfo{isDir: false}, nil }
		grepFn = func(_, _ string, _ []string) int { return 1 }
	})

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(findings) != 0 {
		t.Errorf("expected 0 findings for clean glossary, got %d: %+v", len(findings), findings)
	}
}

func TestHasForbiddenFor_True(t *testing.T) {
	g := &Glossary{
		ForbiddenSynonyms: []Forbidden{{Term: "Entry"}},
	}
	if !hasForbiddenFor(g, "Entry", "other") {
		t.Error("expected hasForbiddenFor to return true")
	}
}

func TestHasForbiddenFor_False(t *testing.T) {
	g := &Glossary{
		ForbiddenSynonyms: []Forbidden{{Term: "Other"}},
	}
	if hasForbiddenFor(g, "Entry", "ctx") {
		t.Error("expected hasForbiddenFor to return false")
	}
}

func TestGrepFiles_FindsMatch(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "file.ts"), []byte("export type JournalEvent = {};\n"), 0644)

	count := grepFiles("JournalEvent", dir, []string{"*.ts"})
	if count == 0 {
		t.Error("expected grepFiles to find match")
	}
}

func TestGrepFiles_NoMatch(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "file.ts"), []byte("export type Other = {};\n"), 0644)

	count := grepFiles("JournalEvent", dir, []string{"*.ts"})
	if count != 0 {
		t.Errorf("expected 0 matches, got %d", count)
	}
}

func TestGrepFiles_WrongExtension(t *testing.T) {
	dir := t.TempDir()
	_ = os.WriteFile(filepath.Join(dir, "file.py"), []byte("JournalEvent\n"), 0644)

	count := grepFiles("JournalEvent", dir, []string{"*.ts"})
	if count != 0 {
		t.Errorf("expected 0 matches for wrong extension, got %d", count)
	}
}

func TestGrepFiles_NonexistentDir(t *testing.T) {
	count := grepFiles("JournalEvent", "/nonexistent/dir", []string{"*.ts"})
	if count != 0 {
		t.Errorf("expected 0 matches for nonexistent dir, got %d", count)
	}
}

func TestCheckTableHeader_MalformedInParseErrors(t *testing.T) {
	g := &Glossary{
		ParseErrors: []ParseError{{Message: "malformed terms table header: column BadColumn expected Definition"}},
	}
	findings := checkTableHeader("test.md", g, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding from parse error, got %d", len(findings))
	}
}

func TestCheckFrontmatter_AllPresent(t *testing.T) {
	g := &Glossary{
		Frontmatter: map[string]string{
			"Bounded context": "ctx1",
			"Maintainer":      "team",
			"Last reviewed":   "2026-01-01",
		},
	}
	findings := checkFrontmatter("test.md", g, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings when all keys present, got %d", len(findings))
	}
}

// containsString is a helper for checking substring presence.
func containsString(s, sub string) bool {
	return len(s) >= len(sub) && func() bool {
		for i := 0; i <= len(s)-len(sub); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	}()
}
