package bcregistry

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"testing"
)

// fakeFileInfo implements os.FileInfo for testing.
type fakeFileInfo struct {
	name  string
	isDir bool
}

func (f fakeFileInfo) Name() string      { return f.name }
func (f fakeFileInfo) IsDir() bool       { return f.isDir }
func (f fakeFileInfo) Size() int64       { return 0 }
func (f fakeFileInfo) Mode() os.FileMode { return 0 }
func (f fakeFileInfo) ModTime() any {
	panic("not used")
}
func (f fakeFileInfo) Sys() any { return nil }

// fakeDirEntry implements fs.DirEntry for testing.
type fakeDirEntry struct {
	name  string
	isDir bool
}

func (e fakeDirEntry) Name() string               { return e.name }
func (e fakeDirEntry) IsDir() bool                { return e.isDir }
func (e fakeDirEntry) Type() os.FileMode          { return 0 }
func (e fakeDirEntry) Info() (os.FileInfo, error) { return nil, nil }

// dirEntries builds a []os.DirEntry from name+isDir pairs.
func dirEntries(pairs ...any) []os.DirEntry {
	var out []os.DirEntry
	for i := 0; i+1 < len(pairs); i += 2 {
		out = append(out, fakeDirEntry{name: pairs[i].(string), isDir: pairs[i+1].(bool)})
	}
	return out
}

func TestLoad_Success(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	yaml := []byte(`version: 1
app: test
contexts:
  - name: ctx1
    summary: first
    layers: [domain, application]
    code: apps/test/src/contexts/ctx1
    glossary: specs/apps/test/ubiquitous-language/ctx1.md
    gherkin: specs/apps/test/fe/gherkin/ctx1
    relationships: []
`)
	osReadFileFn = func(_ string) ([]byte, error) { return yaml, nil }

	reg, err := Load("/repo", "test")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if reg.App != "test" || len(reg.Contexts) != 1 || reg.Contexts[0].Name != "ctx1" {
		t.Errorf("unexpected registry: %+v", reg)
	}
}

func TestLoad_ReadError(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	osReadFileFn = func(_ string) ([]byte, error) { return nil, errors.New("not found") }

	_, err := Load("/repo", "test")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestLoad_ParseError(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	osReadFileFn = func(_ string) ([]byte, error) { return []byte(":\tinvalid: yaml: {"), nil }

	_, err := Load("/repo", "test")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestValidateAll_LoadError(t *testing.T) {
	orig := osReadFileFn
	defer func() { osReadFileFn = orig }()

	osReadFileFn = func(_ string) ([]byte, error) { return nil, errors.New("not found") }

	_, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: "error"})
	if err == nil {
		t.Fatal("expected error from ValidateAll when Load fails")
	}
}

func TestValidateAll_DefaultSeverity(t *testing.T) {
	origRead := osReadFileFn
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osReadFileFn = origRead
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	osReadFileFn = func(_ string) ([]byte, error) {
		return []byte("version: 1\napp: test\ncontexts: []\n"), nil
	}
	osStatFn = func(_ string) (os.FileInfo, error) { return nil, nil }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) { return nil, nil }

	findings, err := ValidateAll(ValidateOptions{RepoRoot: "/repo", App: "test", Severity: ""})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Empty contexts → no findings
	if len(findings) != 0 {
		t.Errorf("expected 0 findings, got %d", len(findings))
	}
}

func TestCheckContext_MissingCodeDir(t *testing.T) {
	orig := osStatFn
	defer func() { osStatFn = orig }()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, errors.New("not found") }

	ctx := Context{
		Name:     "journal",
		Layers:   []string{"domain"},
		Code:     "apps/test/src/contexts/journal",
		Glossary: "specs/apps/test/ubiquitous-language/journal.md",
		Gherkin:  "specs/apps/test/fe/gherkin/journal",
	}
	findings := checkContext("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for missing code dir, got %d", len(findings))
	}
	if findings[0].Severity != "error" {
		t.Errorf("expected severity 'error', got %q", findings[0].Severity)
	}
}

func TestCheckContext_AllPresent(t *testing.T) {
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, nil }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("domain", true, "application", true), nil
	}

	ctx := Context{
		Name:     "journal",
		Layers:   []string{"domain", "application"},
		Code:     "apps/test/src/contexts/journal",
		Glossary: "specs/apps/test/ubiquitous-language/journal.md",
		Gherkin:  "specs/apps/test/fe/gherkin/journal",
	}

	// Provide feature file for gherkin check.
	origReadDir2 := osReadDirFn
	callCount := 0
	osReadDirFn = func(p string) ([]os.DirEntry, error) {
		callCount++
		if filepath.Base(p) == "journal" && callCount > 1 {
			return dirEntries("journal.feature", false), nil
		}
		return origReadDir2(p)
	}

	findings := checkContext("/repo", ctx, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings, got %d: %+v", len(findings), findings)
	}
}

func TestCheckLayers_MissingLayer(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("domain", true), nil // application missing
	}

	ctx := Context{
		Name:   "journal",
		Layers: []string{"domain", "application"},
		Code:   "apps/test/src/contexts/journal",
	}
	findings := checkLayers("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for missing layer, got %d: %+v", len(findings), findings)
	}
	if findings[0].Message == "" {
		t.Error("expected non-empty message")
	}
}

func TestCheckLayers_ExtraLayer(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("domain", true, "application", true, "extra", true), nil
	}

	ctx := Context{
		Name:   "journal",
		Layers: []string{"domain", "application"},
		Code:   "apps/test/src/contexts/journal",
	}
	findings := checkLayers("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for extra layer, got %d: %+v", len(findings), findings)
	}
}

func TestCheckLayers_ExactMatch(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("domain", true, "application", true), nil
	}

	ctx := Context{
		Name:   "journal",
		Layers: []string{"domain", "application"},
		Code:   "apps/test/src/contexts/journal",
	}
	findings := checkLayers("/repo", ctx, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings, got %d", len(findings))
	}
}

func TestCheckLayers_ReadDirError(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return nil, errors.New("permission denied")
	}

	ctx := Context{
		Name:   "journal",
		Layers: []string{"domain"},
		Code:   "apps/test/src/contexts/journal",
	}
	findings := checkLayers("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for readdir error, got %d", len(findings))
	}
}

func TestCheckGherkin_MissingDir(t *testing.T) {
	orig := osStatFn
	defer func() { osStatFn = orig }()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, errors.New("not found") }

	ctx := Context{
		Name:    "journal",
		Gherkin: "specs/apps/test/fe/gherkin/journal",
	}
	findings := checkGherkin("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for missing gherkin dir, got %d", len(findings))
	}
}

func TestCheckGherkin_NoFeatureFiles(t *testing.T) {
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, nil }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("README.md", false), nil
	}

	ctx := Context{
		Name:    "journal",
		Gherkin: "specs/apps/test/fe/gherkin/journal",
	}
	findings := checkGherkin("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for no feature files, got %d", len(findings))
	}
}

func TestCheckGherkin_HasFeatureFile(t *testing.T) {
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, nil }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("journal.feature", false), nil
	}

	ctx := Context{
		Name:    "journal",
		Gherkin: "specs/apps/test/fe/gherkin/journal",
	}
	findings := checkGherkin("/repo", ctx, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings, got %d", len(findings))
	}
}

func TestCheckGherkin_ReadDirError(t *testing.T) {
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	osStatFn = func(_ string) (os.FileInfo, error) { return nil, nil }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return nil, errors.New("permission denied")
	}

	ctx := Context{
		Name:    "journal",
		Gherkin: "specs/apps/test/fe/gherkin/journal",
	}
	findings := checkGherkin("/repo", ctx, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for readdir error, got %d", len(findings))
	}
}

func TestDetectOrphanDirs_FindsOrphan(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("phantom", true), nil
	}

	registered := map[string]bool{"/repo/apps/test/src/contexts/journal": true}
	findings := detectOrphanDirs("/repo/apps/test/src/contexts", registered, "orphan code directory", "registered in bounded-contexts.yaml", "error")

	if len(findings) != 1 {
		t.Fatalf("expected 1 orphan finding, got %d", len(findings))
	}
}

func TestDetectOrphanDirs_NoOrphan(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(p string) ([]os.DirEntry, error) {
		return dirEntries("journal", true), nil
	}

	registered := map[string]bool{"/repo/apps/test/src/contexts/journal": true}
	findings := detectOrphanDirs("/repo/apps/test/src/contexts", registered, "orphan code directory", "registered in bounded-contexts.yaml", "error")

	if len(findings) != 0 {
		t.Errorf("expected 0 findings, got %d", len(findings))
	}
}

func TestDetectOrphanDirs_ReadDirError(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return nil, errors.New("no such directory")
	}

	findings := detectOrphanDirs("/nonexistent", map[string]bool{}, "orphan", "reason", "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings on readdir error, got %d", len(findings))
	}
}

func TestDetectOrphanFiles_FindsOrphan(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("phantom.md", false), nil
	}

	registered := map[string]bool{"/repo/specs/apps/test/ubiquitous-language/journal.md": true}
	findings := detectOrphanFiles("/repo/specs/apps/test/ubiquitous-language", ".md", registered, "orphan glossary file", "registered in bounded-contexts.yaml", "error")

	if len(findings) != 1 {
		t.Fatalf("expected 1 orphan finding, got %d", len(findings))
	}
}

func TestDetectOrphanFiles_SkipsREADME(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("README.md", false), nil
	}

	findings := detectOrphanFiles("/repo/specs/apps/test/ubiquitous-language", ".md", map[string]bool{}, "orphan glossary file", "registered", "error")
	if len(findings) != 0 {
		t.Errorf("expected README.md to be skipped, got %d findings", len(findings))
	}
}

func TestDetectOrphanFiles_SkipsDirectories(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return dirEntries("subdir", true), nil
	}

	findings := detectOrphanFiles("/repo", ".md", map[string]bool{}, "orphan", "reason", "error")
	if len(findings) != 0 {
		t.Errorf("expected directories to be skipped, got %d findings", len(findings))
	}
}

func TestDetectOrphanFiles_ReadDirError(t *testing.T) {
	orig := osReadDirFn
	defer func() { osReadDirFn = orig }()

	osReadDirFn = func(_ string) ([]os.DirEntry, error) {
		return nil, errors.New("permission denied")
	}

	findings := detectOrphanFiles("/nonexistent", ".md", map[string]bool{}, "orphan", "reason", "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings on readdir error, got %d", len(findings))
	}
}

func TestCheckRelationshipSymmetry_Symmetric(t *testing.T) {
	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{Name: "a", Relationships: []Relationship{{To: "b", Kind: "customer-supplier"}}},
			{Name: "b", Relationships: []Relationship{{To: "a", Kind: "customer-supplier"}}},
		},
	}
	ctxByName := map[string]*Context{
		"a": &reg.Contexts[0],
		"b": &reg.Contexts[1],
	}
	findings := checkRelationshipSymmetry(reg, ctxByName, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings for symmetric relationships, got %d: %+v", len(findings), findings)
	}
}

func TestCheckRelationshipSymmetry_Asymmetric(t *testing.T) {
	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{Name: "a", Relationships: []Relationship{{To: "b", Kind: "customer-supplier"}}},
			{Name: "b", Relationships: []Relationship{}},
		},
	}
	ctxByName := map[string]*Context{
		"a": &reg.Contexts[0],
		"b": &reg.Contexts[1],
	}
	findings := checkRelationshipSymmetry(reg, ctxByName, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for asymmetric relationship, got %d", len(findings))
	}
}

func TestCheckRelationshipSymmetry_MissingTarget(t *testing.T) {
	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{Name: "a", Relationships: []Relationship{{To: "nonexistent", Kind: "customer-supplier"}}},
		},
	}
	ctxByName := map[string]*Context{"a": &reg.Contexts[0]}
	findings := checkRelationshipSymmetry(reg, ctxByName, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for missing target, got %d", len(findings))
	}
}

func TestCheckRelationshipSymmetry_ConformistKind(t *testing.T) {
	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{Name: "a", Relationships: []Relationship{{To: "b", Kind: "conformist"}}},
			{Name: "b", Relationships: []Relationship{}},
		},
	}
	ctxByName := map[string]*Context{
		"a": &reg.Contexts[0],
		"b": &reg.Contexts[1],
	}
	findings := checkRelationshipSymmetry(reg, ctxByName, "error")
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding for asymmetric conformist, got %d", len(findings))
	}
}

func TestCheckRelationshipSymmetry_IgnoresNonAsymmetricKind(t *testing.T) {
	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{Name: "a", Relationships: []Relationship{{To: "b", Kind: "shared-kernel"}}},
			{Name: "b", Relationships: []Relationship{}},
		},
	}
	ctxByName := map[string]*Context{
		"a": &reg.Contexts[0],
		"b": &reg.Contexts[1],
	}
	findings := checkRelationshipSymmetry(reg, ctxByName, "error")
	if len(findings) != 0 {
		t.Errorf("expected 0 findings for non-asymmetric kind, got %d", len(findings))
	}
}

func TestHasReciprocal_True(t *testing.T) {
	ctx := &Context{
		Relationships: []Relationship{{To: "source", Kind: "customer-supplier"}},
	}
	if !hasReciprocal(ctx, "source", "customer-supplier") {
		t.Error("expected hasReciprocal to return true")
	}
}

func TestHasReciprocal_False_WrongTo(t *testing.T) {
	ctx := &Context{
		Relationships: []Relationship{{To: "other", Kind: "customer-supplier"}},
	}
	if hasReciprocal(ctx, "source", "customer-supplier") {
		t.Error("expected hasReciprocal to return false for wrong To")
	}
}

func TestHasReciprocal_False_WrongKind(t *testing.T) {
	ctx := &Context{
		Relationships: []Relationship{{To: "source", Kind: "shared-kernel"}},
	}
	if hasReciprocal(ctx, "source", "customer-supplier") {
		t.Error("expected hasReciprocal to return false for wrong Kind")
	}
}

func TestValidate_SortsFindings(t *testing.T) {
	origStat := osStatFn
	origReadDir := osReadDirFn
	defer func() {
		osStatFn = origStat
		osReadDirFn = origReadDir
	}()

	// Simulate missing code dirs for two contexts — findings should be sorted by File.
	osStatFn = func(_ string) (os.FileInfo, error) { return nil, errors.New("not found") }
	osReadDirFn = func(_ string) ([]os.DirEntry, error) { return nil, nil }

	reg := &Registry{
		App: "test",
		Contexts: []Context{
			{
				Name:     "zzz",
				Layers:   []string{"domain"},
				Code:     "apps/test/src/contexts/zzz",
				Glossary: "specs/apps/test/ubiquitous-language/zzz.md",
				Gherkin:  "specs/apps/test/fe/gherkin/zzz",
			},
			{
				Name:     "aaa",
				Layers:   []string{"domain"},
				Code:     "apps/test/src/contexts/aaa",
				Glossary: "specs/apps/test/ubiquitous-language/aaa.md",
				Gherkin:  "specs/apps/test/fe/gherkin/aaa",
			},
		},
	}

	findings := validate("/repo", reg, "error")
	if !sort.SliceIsSorted(findings, func(i, j int) bool {
		return findings[i].File < findings[j].File
	}) {
		t.Error("findings not sorted by File")
	}
}
