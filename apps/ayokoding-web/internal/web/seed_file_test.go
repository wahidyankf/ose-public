package web_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

func writeSeedSource(t *testing.T, root, rel, body string) {
	t.Helper()
	path := filepath.Join(root, rel)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func seedFileRoots(t *testing.T) (contentRoot, manifestsRoot string) {
	t.Helper()
	contentRoot = t.TempDir()
	writeSeedSource(t, contentRoot, "en/learn/courses/go-basics/learning/hello-world.md", "---\ntitle: Hello World\ndescription: First program\nweight: 1\n---\n\n# Hello\n\nServed from disk.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/go-basics/_index.md", "---\ntitle: Go Basics\ndescription: Learn Go\ncategory: fundamentals\nformat: course\nestimatedHours: 4\nprerequisites: [\"setup\"]\n---\n\nCourse index.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/go-basics/draft-note.md", "---\ntitle: Draft\ndraft: true\n---\n\n# Draft\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/outline-course/_index.md", "---\ntitle: Outline Course\nstatus: outline\nprerequisites: []\n---\n\nCourse index.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/float-course/_index.md", "---\ntitle: Float Course\nestimatedHours: 4.5\nprerequisites: [\"a\"]\n---\n\nCourse index.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/labelled-course/_index.md", "---\ntitle: Labelled Course\nestimatedHours: self-paced\n---\n\nCourse index.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/bare-course/learning/lesson.md", "---\ntitle: Bare Lesson\n---\n\n# Bare\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/broken-course/_index.md", "---\ntitle: [unclosed\n---\n\nIndex.\n")
	writeSeedSource(t, contentRoot, "en/learn/courses/broken-course/learning/lesson.md", "---\ntitle: Broken Lesson\n---\n\n# Broken\n")
	manifestsRoot = t.TempDir()
	writeSeedSource(t, manifestsRoot, "careers/backend.json", `{
  "pathId": "careers/backend",
  "title": "Backend",
  "phases": [{"id": "fundamentals", "title": "Fundamentals", "courses": ["go-basics"]}]
}`)
	return contentRoot, manifestsRoot
}

func unsetSeedEnv(t *testing.T) {
	t.Helper()
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", "")
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", "")
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
}

func TestSeedFixtureDepsKeepsCannedCorpusWithoutSourceRoots(t *testing.T) {
	unsetSeedEnv(t)
	deps := web.SeedFixtureDeps("parity")
	page, ok := deps.Content.Find("en", "go-basics", "hello-world")
	if !ok || page.Title != "Hello World" {
		t.Fatalf("canned lesson = %+v, %v; want Hello World", page, ok)
	}
	if _, ok := deps.Paths.Path("backend-id"); !ok {
		t.Fatal("canned path backend-id must resolve")
	}
}

func TestSeedFileDepsServesFileBackedSources(t *testing.T) {
	contentRoot, manifestsRoot := seedFileRoots(t)
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", contentRoot)
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", manifestsRoot)
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
	deps := web.SeedFixtureDeps("parity")
	page, ok := deps.Content.Find("en", "go-basics", "hello-world")
	if !ok || page.Title != "Hello World" {
		t.Fatalf("file lesson = %+v, %v; want Hello World", page, ok)
	}
	if got := page.BodyHTML; got == "" || !contains(got, "Served from disk.") {
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
	contentRoot, _ := seedFileRoots(t)
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", contentRoot)
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", "")
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "true")
	deps := web.SeedFixtureDeps("parity")
	if _, ok := deps.Content.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("draft must resolve with AYOKODING_WEB_SHOW_DRAFTS=true")
	}
}

func TestSeedFileDepsFallsBackToCannedOnUnreadableRoot(t *testing.T) {
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", filepath.Join(t.TempDir(), "no-such-root"))
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", "")
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
	deps := web.SeedFixtureDeps("parity")
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); !ok {
		t.Fatal("unreadable source root must fall back to the canned fixture")
	}
}

func TestSeedFileDepsComposesCourseMetadataVariants(t *testing.T) {
	contentRoot, manifestsRoot := seedFileRoots(t)
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", contentRoot)
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", manifestsRoot)
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
	deps := web.SeedFixtureDeps("parity")
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

func TestSeedFileDepsManifestRootFileServesNoFilePaths(t *testing.T) {
	contentRoot, _ := seedFileRoots(t)
	manifestFile := contentRoot + "/en/learn/courses/go-basics/learning/hello-world.md"
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", contentRoot)
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", manifestFile)
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
	deps := web.SeedFixtureDeps("parity")
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); !ok {
		t.Fatal("file content must still serve when manifests are unreadable")
	}
	if len(deps.Paths.Paths()) != 0 {
		t.Fatalf("manifest file must yield no file paths, got %d", len(deps.Paths.Paths()))
	}
	diagnostics := deps.Paths.Diagnostics()
	if len(diagnostics) != 3 {
		t.Fatalf("manifest failure must record root plus malformed-course diagnostics, got %q", diagnostics)
	}
	if !strings.Contains(diagnostics[0], "manifests root") || !strings.Contains(diagnostics[0], "unreadable") {
		t.Fatalf("first diagnostic must name the unreadable manifests root, got %q", diagnostics)
	}
	for _, want := range []string{"bare-course/_index.md", "broken-course/_index.md"} {
		found := false
		for _, diagnostic := range diagnostics[1:] {
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

func TestSeedFileDepsContentRootFileFallsBackToCanned(t *testing.T) {
	contentRoot, _ := seedFileRoots(t)
	t.Setenv("AYOKODING_WEB_CONTENT_DIR", contentRoot+"/en/learn/courses/go-basics/learning/hello-world.md")
	t.Setenv("AYOKODING_WEB_MANIFESTS_DIR", "")
	t.Setenv("AYOKODING_WEB_SHOW_DRAFTS", "")
	deps := web.SeedFixtureDeps("parity")
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); !ok {
		t.Fatal("file content root must fall back to the canned fixture")
	}
	if len(deps.Content.Diagnostics()) != 1 {
		t.Fatalf("content failure must record one diagnostic, got %q", deps.Content.Diagnostics())
	}
}

func TestSeedUnavailableCatalogStaysEmpty(t *testing.T) {
	unsetSeedEnv(t)
	deps := web.SeedFixtureDeps("unavailable-catalog")
	if _, ok := deps.Content.Find("en", "go-basics", "hello-world"); ok {
		t.Fatal("unavailable catalog must not resolve lessons")
	}
}
