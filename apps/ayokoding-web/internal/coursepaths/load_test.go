package coursepaths_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
)

func writeManifest(t *testing.T, root, rel, body string) {
	t.Helper()
	path := filepath.Join(root, rel)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func fixtureManifestRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	writeManifest(t, root, "careers/backend.json", `{
  "pathId": "careers/backend",
  "title": "Backend",
  "description": "Serve HTTP.",
  "phases": [
    {"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]},
    {"title": "Practice", "courses": ["go-web"]}
  ]
}`)
	writeManifest(t, root, "skills/accounting.json", `{
  "pathId": "skills/accounting",
  "title": "Accounting",
  "description": "Count money.",
  "phases": [{"id": "core", "title": "Core", "courses": ["bookkeeping"]}]
}`)
	return root
}

func TestCoursePathsLoadDirMissingRootFails(t *testing.T) {
	if _, err := coursepaths.LoadDir(filepath.Join(t.TempDir(), "no-such-root")); err == nil {
		t.Fatal("LoadDir with a missing root must fail")
	}
}

func TestCoursePathsLoadDirDeletedWorkingDirectoryFails(t *testing.T) {
	previous, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	vacated := t.TempDir()
	if err := os.Chdir(vacated); err != nil {
		t.Fatalf("chdir %s: %v", vacated, err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(previous); err != nil {
			t.Fatalf("chdir %s: %v", previous, err)
		}
	})
	if err := os.Remove(vacated); err != nil {
		t.Fatalf("remove %s: %v", vacated, err)
	}
	if _, err := coursepaths.LoadDir("relative-root"); err == nil {
		t.Fatal("LoadDir with an unresolvable working directory must fail")
	}
}

func TestCoursePathsLoadDirDotJSONBasenameSkips(t *testing.T) {
	root := t.TempDir()
	writeManifest(t, root, ".json", `{"title": "Nameless"}`)
	store, err := coursepaths.LoadDir(root)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	if len(store.Paths()) != 0 {
		t.Fatalf("paths = %v, want no paths from an identifierless manifest", store.Paths())
	}
	if len(store.Diagnostics()) != 1 {
		t.Fatalf("diagnostics = %q, want one missing identifier", store.Diagnostics())
	}
}

func TestCoursePathsLoadDirFileRootFails(t *testing.T) {
	root := t.TempDir()
	leaf := filepath.Join(root, "manifest.json")
	if err := os.WriteFile(leaf, []byte(`{"pathId": "flat", "phases": []}`), 0o600); err != nil {
		t.Fatalf("write %s: %v", leaf, err)
	}
	if _, err := coursepaths.LoadDir(leaf); err == nil {
		t.Fatal("LoadDir with a file root must fail")
	}
}

func TestCoursePathsLoadDirReportsUnreadableManifest(t *testing.T) {
	root := fixtureManifestRoot(t)
	locked := filepath.Join(root, "careers", "backend.json")
	if err := os.Chmod(locked, 0); err != nil {
		t.Skipf("permissions unavailable: %v", err)
	}
	store, err := coursepaths.LoadDir(root)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	if _, ok := store.Path("careers/backend"); ok {
		t.Fatal("unreadable manifest must not resolve")
	}
	if len(store.Diagnostics()) != 1 {
		t.Fatalf("diagnostics = %q, want one skipped manifest", store.Diagnostics())
	}
	if _, ok := store.Path("skills/accounting"); !ok {
		t.Fatal("readable manifest must survive an unreadable sibling")
	}
}

func TestCoursePathsLoadDirSkipsUnreadableSection(t *testing.T) {
	root := fixtureManifestRoot(t)
	if err := os.Chmod(filepath.Join(root, "careers"), 0); err != nil {
		t.Skipf("permissions unavailable: %v", err)
	}
	t.Cleanup(func() { _ = os.Chmod(filepath.Join(root, "careers"), 0o755) })
	store, err := coursepaths.LoadDir(root)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	if _, ok := store.Path("careers/backend"); ok {
		t.Fatal("unreadable section must not publish")
	}
}

func TestCoursePathsLoadDirKeepsManifestPhaseOrder(t *testing.T) {
	store, err := coursepaths.LoadDir(fixtureManifestRoot(t))
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	paths := store.Paths()
	if len(paths) != 2 {
		t.Fatalf("paths = %d, want 2", len(paths))
	}
	path, ok := store.Path("careers/backend")
	if !ok {
		t.Fatal("variable-depth path id must resolve")
	}
	if path.Title != "Backend" || len(path.Phases) != 2 {
		t.Fatalf("path = %+v, want Backend with 2 phases", path)
	}
	if path.Category != "careers" {
		t.Fatalf("category = %q, want careers from the path id", path.Category)
	}
	if path.Phases[0].Name != "Fundamentals" || path.Phases[1].Name != "Practice" {
		t.Fatalf("phases = %+v, want manifest order with title fallback", path.Phases)
	}
	if !store.PathContains("careers/backend", "go-basics") {
		t.Fatal("loaded path must contain its course")
	}
}

func TestCoursePathsLoadDirSkipsMalformedManifestWithDiagnostic(t *testing.T) {
	root := fixtureManifestRoot(t)
	writeManifest(t, root, "careers/broken-manifest.json", `{"pathId": "careers/broken", "phases": [`)
	writeManifest(t, root, "careers/untitled.json", `{"description": "No identity."}`)
	store, err := coursepaths.LoadDir(root)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	for _, path := range store.Paths() {
		if path.ID == "careers/broken" || path.ID == "untitled" {
			t.Fatalf("malformed manifest must be excluded, got %+v", path)
		}
	}
	if len(store.Diagnostics()) != 2 {
		t.Fatalf("diagnostics = %q, want one per skipped manifest", store.Diagnostics())
	}
	if _, ok := store.Path("careers/backend"); !ok {
		t.Fatal("valid path must survive a malformed sibling")
	}
}

func TestCoursePathsLoadDirIdentifierAndNameFallbacks(t *testing.T) {
	root := t.TempDir()
	writeManifest(t, root, "flat.json", `{
  "id": "backend",
  "phases": [{"id": "core", "courses": ["go-basics"]}]
}`)
	writeManifest(t, root, "dup-a.json", `{
  "pathId": "dupe",
  "title": "First",
  "phases": [{"id": "one", "title": "One", "courses": []}]
}`)
	writeManifest(t, root, "dup-b.json", `{
  "pathId": "dupe",
  "title": "Second",
  "phases": [{"id": "two", "title": "Two", "courses": []}]
}`)
	writeManifest(t, root, "notes.txt", `not a manifest`)
	store, err := coursepaths.LoadDir(root)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	flat, ok := store.Path("backend")
	if !ok {
		t.Fatal("id fallback must resolve")
	}
	if flat.Title != "backend" || flat.Category != "" {
		t.Fatalf("flat path = %+v, want title fallback and no category", flat)
	}
	if flat.Phases[0].Name != "core" {
		t.Fatalf("phase name = %q, want id fallback", flat.Phases[0].Name)
	}
	dupe, ok := store.Path("dupe")
	if !ok {
		t.Fatal("duplicate path id must resolve once")
	}
	if dupe.Title != "Second" {
		t.Fatalf("duplicate path title = %q, want last write", dupe.Title)
	}
	count := 0
	for _, id := range []string{"backend", "dupe"} {
		if _, ok := store.Path(id); ok {
			count++
		}
	}
	if count != 2 || len(store.Paths()) != 2 {
		t.Fatalf("paths = %d, want exactly backend and dupe", len(store.Paths()))
	}
}

func TestActivePathContextSelectsMemberCourseOnly(t *testing.T) {
	store, err := coursepaths.LoadDir(fixtureManifestRoot(t))
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	if !store.ActivePathContext("careers/backend", "go-basics") {
		t.Fatal("member course must resolve an active path context")
	}
	if store.ActivePathContext("careers/backend", "bookkeeping") {
		t.Fatal("outside course must not activate the path context")
	}
	if store.ActivePathContext("no-such-path", "go-basics") {
		t.Fatal("unknown path must not activate a context")
	}
	if store.ActivePathContext("", "go-basics") {
		t.Fatal("empty path must fall back to canonical navigation")
	}
}
