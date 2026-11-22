package coursepaths_test

import (
	"io/fs"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
)

// faultyTree is an in-memory manifest tree in which chosen files fail to read
// and chosen directories fail to list, as a permission denial does on disk.
type faultyTree struct {
	fstest.MapFS
	unreadableFiles map[string]bool
	unreadableDirs  map[string]bool
}

func (f faultyTree) ReadFile(name string) ([]byte, error) {
	if f.unreadableFiles[name] {
		return nil, fs.ErrPermission
	}
	return f.MapFS.ReadFile(name)
}

func (f faultyTree) ReadDir(name string) ([]fs.DirEntry, error) {
	if f.unreadableDirs[name] {
		return nil, fs.ErrPermission
	}
	return f.MapFS.ReadDir(name)
}

// unreadableFS is a manifest root the operating system refused: every open fails.
type unreadableFS struct{}

func (unreadableFS) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

func manifestFile(body string) *fstest.MapFile {
	return &fstest.MapFile{Data: []byte(body)}
}

func fixtureManifestTree() fstest.MapFS {
	return fstest.MapFS{
		"careers/backend.json": manifestFile(`{
  "pathId": "careers/backend",
  "title": "Backend",
  "description": "Serve HTTP.",
  "phases": [
    {"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]},
    {"title": "Practice", "courses": ["go-web"]}
  ]
}`),
		"skills/accounting.json": manifestFile(`{
  "pathId": "skills/accounting",
  "title": "Accounting",
  "description": "Count money.",
  "phases": [{"id": "core", "title": "Core", "courses": ["bookkeeping"]}]
}`),
	}
}

func TestCoursePathsLoadFSMissingRootFails(t *testing.T) {
	if _, err := coursepaths.LoadFS(unreadableFS{}); err == nil {
		t.Fatal("LoadFS with a missing root must fail")
	}
}

func TestCoursePathsLoadFSDotJSONBasenameSkips(t *testing.T) {
	store, err := coursepaths.LoadFS(fstest.MapFS{".json": manifestFile(`{"title": "Nameless"}`)})
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
	}
	if len(store.Paths()) != 0 {
		t.Fatalf("paths = %v, want no paths from an identifierless manifest", store.Paths())
	}
	if len(store.Diagnostics()) != 1 {
		t.Fatalf("diagnostics = %q, want one missing identifier", store.Diagnostics())
	}
}

func TestCoursePathsLoadFSReportsUnreadableManifest(t *testing.T) {
	store, err := coursepaths.LoadFS(faultyTree{
		MapFS:           fixtureManifestTree(),
		unreadableFiles: map[string]bool{"careers/backend.json": true},
	})
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
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

func TestCoursePathsLoadFSSkipsUnreadableSection(t *testing.T) {
	store, err := coursepaths.LoadFS(faultyTree{
		MapFS:          fixtureManifestTree(),
		unreadableDirs: map[string]bool{"careers": true},
	})
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
	}
	if _, ok := store.Path("careers/backend"); ok {
		t.Fatal("unreadable section must not publish")
	}
}

func TestCoursePathsLoadFSKeepsManifestPhaseOrder(t *testing.T) {
	store, err := coursepaths.LoadFS(fixtureManifestTree())
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
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

func TestCoursePathsLoadFSSkipsMalformedManifestWithDiagnostic(t *testing.T) {
	tree := fixtureManifestTree()
	tree["careers/broken-manifest.json"] = manifestFile(`{"pathId": "careers/broken", "phases": [`)
	tree["careers/untitled.json"] = manifestFile(`{"description": "No identity."}`)
	store, err := coursepaths.LoadFS(tree)
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
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

func TestCoursePathsLoadFSIdentifierAndNameFallbacks(t *testing.T) {
	store, err := coursepaths.LoadFS(fstest.MapFS{
		"flat.json": manifestFile(`{
  "id": "backend",
  "phases": [{"id": "core", "courses": ["go-basics"]}]
}`),
		"dup-a.json": manifestFile(`{
  "pathId": "dupe",
  "title": "First",
  "phases": [{"id": "one", "title": "One", "courses": []}]
}`),
		"dup-b.json": manifestFile(`{
  "pathId": "dupe",
  "title": "Second",
  "phases": [{"id": "two", "title": "Two", "courses": []}]
}`),
		"notes.txt": manifestFile(`not a manifest`),
	})
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
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
	store, err := coursepaths.LoadFS(fixtureManifestTree())
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
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
