package web_test

import (
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// seedSources is the recorded launcher environment and the in-memory source
// trees the seed reads in unit tests. No process variable or disk root moves.
type seedSources struct {
	env   map[string]string
	trees map[string]fs.FS
}

func (s seedSources) sources() web.Sources {
	return web.Sources{
		Environment: func(key string) (string, bool) {
			value, ok := s.env[key]
			return value, ok
		},
		Root: func(dir string) fs.FS {
			if tree, ok := s.trees[dir]; ok {
				return tree
			}
			return unreadableFS{}
		},
	}
}

// unreadableFS is a source root the operating system refused: every open fails.
type unreadableFS struct{}

func (unreadableFS) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

// seedParity builds the parity fixture's Deps over the recorded sources
// through the launcher's seed, failing the test on a refused start.
func seedParity(t *testing.T, sources web.Sources) web.Deps {
	t.Helper()
	cfg, err := web.ResolveConfig([]string{"--fixture", "parity"}, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, sources)
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	return deps
}

func seedFile(body string) *fstest.MapFile {
	return &fstest.MapFile{Data: []byte(body)}
}

func seedContentTree() fstest.MapFS {
	return fstest.MapFS{
		"en/learn/courses/go-basics/learning/hello-world.md": seedFile("---\ntitle: Hello World\ndescription: First program\nweight: 1\n---\n\n# Hello\n\nServed from disk.\n"),
		"en/learn/courses/go-basics/_index.md":               seedFile("---\ntitle: Go Basics\ndescription: Learn Go\ncategory: fundamentals\nformat: course\nestimatedHours: 4\nprerequisites: [\"setup\"]\n---\n\nCourse index.\n"),
		"en/learn/courses/go-basics/draft-note.md":           seedFile("---\ntitle: Draft\ndraft: true\n---\n\n# Draft\n"),
		"en/learn/courses/outline-course/_index.md":          seedFile("---\ntitle: Outline Course\nstatus: outline\nprerequisites: []\n---\n\nCourse index.\n"),
		"en/learn/courses/float-course/_index.md":            seedFile("---\ntitle: Float Course\nestimatedHours: 4.5\nprerequisites: [\"a\"]\n---\n\nCourse index.\n"),
		"en/learn/courses/labelled-course/_index.md":         seedFile("---\ntitle: Labelled Course\nestimatedHours: self-paced\n---\n\nCourse index.\n"),
		"en/learn/courses/bare-course/learning/lesson.md":    seedFile("---\ntitle: Bare Lesson\n---\n\n# Bare\n"),
		"en/learn/courses/broken-course/_index.md":           seedFile("---\ntitle: [unclosed\n---\n\nIndex.\n"),
		"en/learn/courses/broken-course/learning/lesson.md":  seedFile("---\ntitle: Broken Lesson\n---\n\n# Broken\n"),
	}
}

func seedManifestTree() fstest.MapFS {
	return fstest.MapFS{
		"careers/backend.json": seedFile(`{
  "pathId": "careers/backend",
  "title": "Backend",
  "phases": [{"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]}]
}`),
	}
}

// fileBacked records both source roots of the file-backed seed.
func fileBacked(contentDir, manifestsDir, showDrafts string) seedSources {
	return seedSources{
		env: map[string]string{
			"AYOKODING_WEB_CONTENT_DIR":   contentDir,
			"AYOKODING_WEB_MANIFESTS_DIR": manifestsDir,
			"AYOKODING_WEB_SHOW_DRAFTS":   showDrafts,
		},
		trees: map[string]fs.FS{
			"/content":   seedContentTree(),
			"/manifests": seedManifestTree(),
		},
	}
}

func TestSeedFixtureDepsKeepsCannedCorpusWithoutSourceRoots(t *testing.T) {
	deps := web.SeedFixtureDeps("parity", seedSources{}.sources())
	page, ok := deps.Content.Find("en", "go-basics", "hello-world")
	if !ok || page.Title != "Hello World" {
		t.Fatalf("canned lesson = %+v, %v; want Hello World", page, ok)
	}
	if _, ok := deps.Paths.Path("backend-id"); !ok {
		t.Fatal("canned path backend-id must resolve")
	}
}

func TestSeedFileDepsServesFileBackedSources(t *testing.T) {
	deps := seedParity(t, fileBacked("/content", "/manifests", "").sources())
	page, ok := deps.Content.Find("en", "go-basics", "hello-world")
	if !ok || page.Title != "Hello World" {
		t.Fatalf("file lesson = %+v, %v; want Hello World", page, ok)
	}
	if got := page.BodyHTML; got == "" || !strings.Contains(got, "Served from disk.") {
		t.Fatalf("file body = %q, want rendered disk content", got)
	}
	if _, ok := deps.Content.Find("en", "go-basics", "draft-note"); ok {
		t.Fatal("draft must stay hidden without AYOKODING_WEB_SHOW_DRAFTS=true")
	}
	path, ok := deps.Paths.Path("careers/backend")
	if !ok || path.Title != "Backend" {
		t.Fatalf("file path = %+v, %v; want Backend", path, ok)
	}
	if !deps.Paths.ActivePathContext("careers/backend", "go-basics") {
		t.Fatal("file path must activate its member course context")
	}
	course, ok := deps.Paths.Course("go-basics")
	if !ok || course.Title != "Go Basics" || course.Description != "Learn Go" {
		t.Fatalf("composed course = %+v, %v; want Go Basics from _index", course, ok)
	}
	if course.Category != "fundamentals" || course.Format != "course" || course.Effort != "4 hours" {
		t.Fatalf("composed course metadata = %+v, want category/format/effort from _index", course)
	}
	if len(course.Prerequisites) != 1 || course.Prerequisites[0] != "setup" {
		t.Fatalf("composed prerequisites = %+v, want [setup]", course.Prerequisites)
	}
}

func TestSeedFileDepsHonorsShowDrafts(t *testing.T) {
	deps := seedParity(t, fileBacked("/content", "", "true").sources())
	if _, ok := deps.Content.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("draft must resolve with AYOKODING_WEB_SHOW_DRAFTS=true")
	}
}

// TestSeedFixtureDepsHonorsShowDraftsWithoutSourceRoot pins the draft setting
// for the canned corpus: AYOKODING_WEB_SHOW_DRAFTS applies even when no source
// root is configured (contract AYB-007).
func TestSeedFixtureDepsHonorsShowDraftsWithoutSourceRoot(t *testing.T) {
	sources := seedSources{env: map[string]string{"AYOKODING_WEB_SHOW_DRAFTS": "true"}}
	deps := web.SeedFixtureDeps("parity", sources.sources())
	if _, ok := deps.Content.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("canned draft must resolve with AYOKODING_WEB_SHOW_DRAFTS=true and no source root")
	}
}

// TestSeedFileDepsRefusesAnUnreadableNamedRoot pins the fail-fast rule: an
// unreadable content root stops startup and never falls back to the fixture.
func TestSeedFileDepsRefusesAnUnreadableNamedRoot(t *testing.T) {
	cfg, err := web.ResolveConfig([]string{"--fixture", "parity"}, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	if _, err := web.SeedDeps(cfg, fileBacked("/missing-root", "", "").sources()); err == nil {
		t.Fatal("an unreadable source root must refuse startup, not serve the canned fixture")
	}
}

func TestSeedFileDepsComposesCourseMetadataVariants(t *testing.T) {
	deps := seedParity(t, fileBacked("/content", "/manifests", "").sources())
	outline, ok := deps.Paths.Course("outline-course")
	if !ok {
		t.Fatal("outline course must compose")
	}
	if !outline.Outline || outline.Effort != "" {
		t.Fatalf("outline course = %+v, want outline status with no estimate", outline)
	}
	if len(outline.Prerequisites) != 0 {
		t.Fatalf("prerequisites must decode empty, got %+v", outline.Prerequisites)
	}
	floatCourse, ok := deps.Paths.Course("float-course")
	if !ok {
		t.Fatal("float course must compose")
	}
	if floatCourse.Effort != "4.5 hours" {
		t.Fatalf("float effort = %q, want fractional hours", floatCourse.Effort)
	}
	if len(floatCourse.Prerequisites) != 1 || floatCourse.Prerequisites[0] != "a" {
		t.Fatalf("prerequisites = %+v, want non-strings skipped", floatCourse.Prerequisites)
	}
	if _, ok := deps.Paths.Course("bare-course"); ok {
		t.Fatal("course without _index must not compose")
	}
	if _, ok := deps.Paths.Course("broken-course"); ok {
		t.Fatal("course with invalid _index must not compose")
	}
	diagnostics := deps.Paths.Diagnostics()
	for _, want := range []string{"bare-course/_index.md", "broken-course/_index.md"} {
		found := false
		for _, diagnostic := range diagnostics {
			if diagnostic == want {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("diagnostics %q must record malformed %q", diagnostics, want)
		}
	}
	labelled, ok := deps.Paths.Course("labelled-course")
	if !ok {
		t.Fatal("labelled course must compose")
	}
	if labelled.Effort != "" {
		t.Fatalf("labelled effort = %q, want empty for non-numeric hours", labelled.Effort)
	}
}

// TestSeedFileDepsRefusesAnUnreadableManifestsRoot pins the fail-fast rule for
// the manifests root: an unreadable root stops startup and names its setting.
func TestSeedFileDepsRefusesAnUnreadableManifestsRoot(t *testing.T) {
	cfg, err := web.ResolveConfig([]string{"--fixture", "parity"}, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	sources := fileBacked("/content", "/manifest-file", "")
	sources.trees["/manifest-file"] = unreadableFS{}
	if _, err := web.SeedDeps(cfg, sources.sources()); err == nil || !strings.Contains(err.Error(), "AYOKODING_WEB_MANIFESTS_DIR") {
		t.Fatalf("unreadable manifests root must refuse startup naming AYOKODING_WEB_MANIFESTS_DIR, got %v", err)
	}
}

// TestSeedFileDepsRecordsMalformedCourseDiagnostics pins the course diagnostics
// that a readable corpus still records for malformed manifests.
func TestSeedFileDepsRecordsMalformedCourseDiagnostics(t *testing.T) {
	deps := seedParity(t, fileBacked("/content", "/manifests", "").sources())
	diagnostics := deps.Paths.Diagnostics()
	for _, want := range []string{"bare-course/_index.md", "broken-course/_index.md"} {
		found := false
		for _, diagnostic := range diagnostics {
			if diagnostic == want {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("diagnostics %q must record malformed %q", diagnostics, want)
		}
	}
}

// TestSeedFileDepsRefusesAnUnreadableContentRootFile pins the fail-fast rule for
// the content root: a root that cannot be read stops startup and never falls
// back to the canned fixture.
func TestSeedFileDepsRefusesAnUnreadableContentRootFile(t *testing.T) {
	cfg, err := web.ResolveConfig([]string{"--fixture", "parity"}, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	sources := fileBacked("/content/en/learn/courses/go-basics/learning/hello-world.md", "", "")
	sources.trees["/content/en/learn/courses/go-basics/learning/hello-world.md"] = unreadableFS{}
	if _, err := web.SeedDeps(cfg, sources.sources()); err == nil || !strings.Contains(err.Error(), "AYOKODING_WEB_CONTENT_DIR") {
		t.Fatalf("unreadable content root must refuse startup naming AYOKODING_WEB_CONTENT_DIR, got %v", err)
	}
}

func TestSeedUnavailableCatalogStaysEmpty(t *testing.T) {
	deps := web.SeedFixtureDeps("unavailable-catalog", seedSources{}.sources())
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); ok {
		t.Fatal("unavailable catalog must not resolve lessons")
	}
}
