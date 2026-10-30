package content_test

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// writeFixtureTree materializes a real-corpus-shaped tree under dir.
func writeFixtureTree(t *testing.T, dir string, files map[string]string) {
	t.Helper()
	for name, body := range files {
		full := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatalf("mkdir fixture: %v", err)
		}
		if err := os.WriteFile(full, []byte(body), 0o600); err != nil {
			t.Fatalf("write fixture: %v", err)
		}
	}
}

// realCorpusFixture mirrors content/<locale>/learn/{courses,legacy} plus the
// unserved rants/root/hub markdown the loader must skip with diagnostics.
func realCorpusFixture() map[string]string {
	lesson := func(title string) string {
		return "---\ntitle: " + title + "\ndescription: Fixture page\nweight: 3\n---\n\nBody of " + title + ".\n"
	}
	return map[string]string{
		"en/learn/_index.md":                                       "---\ntitle: Learn\n---\n\nHub.\n",
		"en/learn/courses/_index.md":                               "---\ntitle: Courses\n---\n\nHub.\n",
		"en/learn/courses/go-basics/_index.md":                     "---\ntitle: Go Basics\n---\n\nSection metadata.\n",
		"en/learn/courses/go-basics/overview.md":                   lesson("Course Overview"),
		"en/learn/courses/go-basics/learning/_index.md":            "---\ntitle: Learning\n---\n\nSection metadata.\n",
		"en/learn/courses/go-basics/learning/overview.md":          lesson("Learning Track"),
		"en/learn/courses/go-basics/learning/beginner.md":          lesson("Beginner"),
		"en/learn/courses/go-basics/learning/bad.md":               "---\n:\tbad\n---\n\nBroken.\n",
		"en/learn/courses/go-basics/learning/untitled.md":          "---\nweight: 1\n---\n\nNo title.\n",
		"en/learn/courses/go-basics/learning/draft-note.md":        "---\ntitle: Draft\ndraft: true\nweight: 4\n---\n\nDraft body.\n",
		"en/learn/courses/go-basics/learning/capstone/_index.md":   "---\ntitle: Capstone\n---\n\nSection metadata.\n",
		"en/learn/courses/go-basics/learning/capstone/overview.md": "---\ntitle: Capstone\n---\n\nCapstone body.\n",
		"en/learn/courses/go-basics/assets/note.md":                lesson("Asset Note"),
		"en/learn/courses/go-basics/drilling/_index.md":            "---\ntitle: Drilling\n---\n\nSection metadata.\n",
		"en/learn/courses/go-basics/drilling/overview.md":          "---\ntitle: Drilling Track\ndescription: Fixture page\nweight: \"2\"\n---\n\nBody of Drilling Track.\n",
		"en/learn/legacy/_index.md":                                "---\ntitle: Legacy\n---\n\nSection metadata.\n",
		"en/learn/legacy/deep/nested/page.md":                      lesson("Nested Legacy"),
		"en/learn/legacy/deep/_index.md":                           "---\ntitle: Deep\n---\n\nSection metadata.\n",
		"en/learn/paths/skills/_index.md":                          "---\ntitle: Skills\n---\n\nSection metadata.\n",
		"en/rants/2023/note.md":                                    lesson("Rant"),
		"en/about-ayokoding.md":                                    lesson("About"),
		"fr/learn/_index.md":                                       "---\ntitle: Learn\n---\n\nHub.\n",
		"id/belajar/ikhtisar.md":                                   lesson("Ikhtisar"),
	}
}

func loadFixture(t *testing.T) *content.FakeStore {
	t.Helper()
	dir := t.TempDir()
	writeFixtureTree(t, dir, realCorpusFixture())
	ghost := filepath.Join(dir, "en", "learn", "courses", "go-basics", "learning", "ghost.md")
	if err := os.Symlink("no-such-target.md", ghost); err != nil {
		t.Fatalf("symlink fixture: %v", err)
	}
	store, err := content.LoadDir(dir)
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}
	return store
}

func TestLoadDirMapsCourseLessons(t *testing.T) {
	store := loadFixture(t)
	for _, want := range []struct {
		slug string
		kind string
	}{
		{"overview", "course"},
		{"learning", "learning"},
		{"beginner", "learning"},
		{"capstone/overview", "learning"},
		{"drilling", "drilling"},
	} {
		page, ok := store.Find("en", "go-basics", want.slug)
		if !ok {
			t.Fatalf("Find(go-basics, %q) must resolve", want.slug)
		}
		if page.Course != "go-basics" || page.Slug != want.slug || page.Kind != want.kind {
			t.Fatalf("page = %+v, want course/slug/kind go-basics/%q/%q", page, want.slug, want.kind)
		}
		if page.Locale != "en" || page.Title == "" || page.BodyHTML == "" {
			t.Fatalf("page = %+v, want locale, title, and rendered body", page)
		}
	}
}

func TestLoadDirMapsLegacyPages(t *testing.T) {
	store := loadFixture(t)
	page, ok := store.Find("en", "legacy", "deep/nested/page")
	if !ok {
		t.Fatal("legacy rest-joined slug must resolve")
	}
	if page.Course != "legacy" || page.Title != "Nested Legacy" {
		t.Fatalf("legacy page = %+v", page)
	}
}

func TestLoadDirExcludesInvalidFrontmatterWithDiagnostic(t *testing.T) {
	store := loadFixture(t)
	if _, ok := store.Find("en", "go-basics", "bad"); ok {
		t.Fatal("invalid frontmatter must not publish")
	}
	if _, ok := store.Find("en", "go-basics", "untitled"); ok {
		t.Fatal("missing title must not publish")
	}
	diagnostics := strings.Join(store.Diagnostics(), "\n")
	for _, marker := range []string{"bad.md", "untitled.md", "ghost.md", "assets/note.md"} {
		if !strings.Contains(diagnostics, marker) {
			t.Fatalf("diagnostics must identify %q, got %q", marker, diagnostics)
		}
	}
}

func TestLoadDirSkipsUnservedMarkdownWithDiagnostic(t *testing.T) {
	store := loadFixture(t)
	for _, slug := range []string{"note", "about-ayokoding", "ikhtisar"} {
		if _, ok := store.Find("en", "legacy", slug); ok {
			t.Fatalf("unserved %q must not publish", slug)
		}
	}
	if len(store.Published("id")) != 0 {
		t.Fatal("locale without a learn/ tree must contribute no pages")
	}
	diagnostics := strings.Join(store.Diagnostics(), "\n")
	for _, marker := range []string{"rants", "about-ayokoding", "section-metadata", "belajar", "no learn/ tree"} {
		if !strings.Contains(diagnostics, marker) {
			t.Fatalf("diagnostics must record skipped %q, got %q", marker, diagnostics)
		}
	}
	if len(store.Published("fr")) != 0 {
		t.Fatal("locale with learn/ but no courses or legacy must contribute no pages")
	}
}

func TestLoadDirKeepsDraftsHidden(t *testing.T) {
	store := loadFixture(t)
	if _, ok := store.Find("en", "go-basics", "draft-note"); ok {
		t.Fatal("draft lesson must stay hidden by default")
	}
	store.ShowDrafts(true)
	if _, ok := store.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("draft lesson must resolve when drafts are shown")
	}
}

func TestLoadDirFailsClosedOnKindCollision(t *testing.T) {
	dir := t.TempDir()
	writeFixtureTree(t, dir, map[string]string{
		"en/learn/courses/clash/learning/dup.md": "---\ntitle: A\n---\n\nA.\n",
		"en/learn/courses/clash/drilling/dup.md": "---\ntitle: B\n---\n\nB.\n",
	})
	store, err := content.LoadDir(dir)
	if err == nil || store != nil {
		t.Fatal("kind slug collision must fail closed with an error and no store")
	}
	if !strings.Contains(err.Error(), "dup") || !strings.Contains(err.Error(), "clash") {
		t.Fatalf("collision error must identify course and slug, got %q", err)
	}
}

func TestLoadDirMissingRootFails(t *testing.T) {
	if _, err := content.LoadDir(filepath.Join(t.TempDir(), "no-such-root")); err == nil {
		t.Fatal("missing content root must fail")
	}
}

func TestLoadDirUnreadableCoursesFails(t *testing.T) {
	dir := t.TempDir()
	writeFixtureTree(t, dir, map[string]string{
		"en/learn/_index.md": "---\ntitle: Learn\n---\n\nHub.\n",
		"en/learn/courses":   "a file, not a directory",
	})
	store, err := content.LoadDir(dir)
	if err == nil || store != nil {
		t.Fatal("unreadable courses inventory must fail closed")
	}
	if !strings.Contains(err.Error(), "courses") {
		t.Fatalf("courses error must name the inventory, got %q", err)
	}
}

// realCorpusRoot resolves the checked-in ayokoding-www content tree.
func realCorpusRoot(t *testing.T) string {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Join(filepath.Dir(file), "..", "..", "..", "ayokoding-www", "content")
	if _, err := os.Stat(filepath.Join(root, "en", "learn", "courses")); err != nil {
		t.Fatalf("real corpus unavailable: %v", err)
	}
	return root
}

func TestLoadDirRealCorpus(t *testing.T) {
	store, err := content.LoadDir(realCorpusRoot(t))
	if err != nil {
		t.Fatalf("real corpus must load without collisions: %v", err)
	}
	if got := len(store.Published("en")); got < 1500 {
		t.Fatalf("real en pages = %d, want at least 1500", got)
	}
	page, ok := store.Find("en", "backend-essentials-with-go", "beginner")
	if !ok || page.Title != "Beginner Examples" || page.Kind != "learning" {
		t.Fatalf("real lesson = %+v, %v; want Beginner Examples/learning", page, ok)
	}
	track, ok := store.Find("en", "backend-essentials-with-go", "learning")
	if !ok || track.Title != "Overview" {
		t.Fatalf("real kind overview = %+v, %v; want track landing", track, ok)
	}
	legacy, ok := store.Find("en", "legacy", "software-engineering/automation-testing/tools/vitest/by-example/intermediate")
	if !ok || legacy.Title != "Intermediate" {
		t.Fatalf("real legacy page = %+v, %v; want Intermediate", legacy, ok)
	}
	if len(store.Published("id")) != 0 {
		t.Fatal("id locale has no learn/ tree and must contribute no pages")
	}
	if len(store.Diagnostics()) == 0 {
		t.Fatal("real load must record skip diagnostics")
	}
}
