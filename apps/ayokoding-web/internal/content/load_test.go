package content_test

import (
	"io/fs"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// brokenTree is an in-memory corpus whose listed files appear in directory
// listings but fail to read, as a dangling symlink does on disk.
type brokenTree struct {
	fstest.MapFS
	broken map[string]bool
}

func (b brokenTree) ReadFile(name string) ([]byte, error) {
	if b.broken[name] {
		return nil, fs.ErrNotExist
	}
	return b.MapFS.ReadFile(name)
}

// unreadableFS is a content root the operating system refused: every open fails.
type unreadableFS struct{}

func (unreadableFS) Open(string) (fs.File, error) { return nil, fs.ErrPermission }

func contentFile(body string) *fstest.MapFile {
	return &fstest.MapFile{Data: []byte(body)}
}

// realCorpusFixture mirrors content/<locale>/learn/{courses,legacy} plus the
// unserved rants/root/hub markdown the loader must skip with diagnostics.
func realCorpusFixture() fstest.MapFS {
	lesson := func(title string) *fstest.MapFile {
		return contentFile("---\ntitle: " + title + "\ndescription: Fixture page\nweight: 3\n---\n\nBody of " + title + ".\n")
	}
	return fstest.MapFS{
		"en/learn/_index.md":                                       contentFile("---\ntitle: Learn\n---\n\nHub.\n"),
		"en/learn/courses/_index.md":                               contentFile("---\ntitle: Courses\n---\n\nHub.\n"),
		"en/learn/courses/go-basics/_index.md":                     contentFile("---\ntitle: Go Basics\n---\n\nSection metadata.\n"),
		"en/learn/courses/go-basics/overview.md":                   lesson("Course Overview"),
		"en/learn/courses/go-basics/learning/_index.md":            contentFile("---\ntitle: Learning\n---\n\nSection metadata.\n"),
		"en/learn/courses/go-basics/learning/overview.md":          lesson("Learning Track"),
		"en/learn/courses/go-basics/learning/beginner.md":          lesson("Beginner"),
		"en/learn/courses/go-basics/learning/bad.md":               contentFile("---\n:\tbad\n---\n\nBroken.\n"),
		"en/learn/courses/go-basics/learning/untitled.md":          contentFile("---\nweight: 1\n---\n\nNo title.\n"),
		"en/learn/courses/go-basics/learning/draft-note.md":        contentFile("---\ntitle: Draft\ndraft: true\nweight: 4\n---\n\nDraft body.\n"),
		"en/learn/courses/go-basics/learning/capstone/_index.md":   contentFile("---\ntitle: Capstone\n---\n\nSection metadata.\n"),
		"en/learn/courses/go-basics/learning/capstone/overview.md": contentFile("---\ntitle: Capstone\n---\n\nCapstone body.\n"),
		"en/learn/courses/go-basics/assets/note.md":                lesson("Asset Note"),
		"en/learn/courses/go-basics/drilling/_index.md":            contentFile("---\ntitle: Drilling\n---\n\nSection metadata.\n"),
		"en/learn/courses/go-basics/drilling/overview.md":          contentFile("---\ntitle: Drilling Track\ndescription: Fixture page\nweight: \"2\"\n---\n\nBody of Drilling Track.\n"),
		"en/learn/legacy/_index.md":                                contentFile("---\ntitle: Legacy\n---\n\nSection metadata.\n"),
		"en/learn/legacy/deep/nested/page.md":                      lesson("Nested Legacy"),
		"en/learn/legacy/deep/_index.md":                           contentFile("---\ntitle: Deep\n---\n\nSection metadata.\n"),
		"en/learn/paths/skills/_index.md":                          contentFile("---\ntitle: Skills\n---\n\nSection metadata.\n"),
		"en/rants/2023/note.md":                                    lesson("Rant"),
		"en/about-ayokoding.md":                                    lesson("About"),
		"fr/learn/_index.md":                                       contentFile("---\ntitle: Learn\n---\n\nHub.\n"),
		"id/belajar/ikhtisar.md":                                   lesson("Ikhtisar"),
	}
}

// ghostPath is the dangling-link source the disk fixture plants; in memory it
// is a listed file that cannot be read.
const ghostPath = "en/learn/courses/go-basics/learning/ghost.md"

func loadFixture(t *testing.T) *content.FakeStore {
	t.Helper()
	tree := brokenTree{MapFS: realCorpusFixture(), broken: map[string]bool{ghostPath: true}}
	tree.MapFS[ghostPath] = contentFile("")
	store, err := content.LoadFS(tree)
	if err != nil {
		t.Fatalf("LoadFS: %v", err)
	}
	return store
}

func TestLoadFSMapsCourseLessons(t *testing.T) {
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

func TestLoadFSMapsLegacyPages(t *testing.T) {
	store := loadFixture(t)
	page, ok := store.Find("en", "legacy", "deep/nested/page")
	if !ok {
		t.Fatal("legacy rest-joined slug must resolve")
	}
	if page.Course != "legacy" || page.Title != "Nested Legacy" {
		t.Fatalf("legacy page = %+v", page)
	}
}

func TestLoadFSExcludesInvalidFrontmatterWithDiagnostic(t *testing.T) {
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

func TestLoadFSSkipsUnservedMarkdownWithDiagnostic(t *testing.T) {
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

func TestLoadFSKeepsDraftsHidden(t *testing.T) {
	store := loadFixture(t)
	if _, ok := store.Find("en", "go-basics", "draft-note"); ok {
		t.Fatal("draft lesson must stay hidden by default")
	}
	store.ShowDrafts(true)
	if _, ok := store.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("draft lesson must resolve when drafts are shown")
	}
}

func TestLoadFSFailsClosedOnKindCollision(t *testing.T) {
	store, err := content.LoadFS(fstest.MapFS{
		"en/learn/courses/clash/learning/dup.md": contentFile("---\ntitle: A\n---\n\nA.\n"),
		"en/learn/courses/clash/drilling/dup.md": contentFile("---\ntitle: B\n---\n\nB.\n"),
	})
	if err == nil || store != nil {
		t.Fatal("kind slug collision must fail closed with an error and no store")
	}
	if !strings.Contains(err.Error(), "dup") || !strings.Contains(err.Error(), "clash") {
		t.Fatalf("collision error must identify course and slug, got %q", err)
	}
}

func TestLoadFSMissingRootFails(t *testing.T) {
	if _, err := content.LoadFS(unreadableFS{}); err == nil {
		t.Fatal("missing content root must fail")
	}
}

func TestLoadFSUnreadableCoursesFails(t *testing.T) {
	store, err := content.LoadFS(fstest.MapFS{
		"en/learn/_index.md": contentFile("---\ntitle: Learn\n---\n\nHub.\n"),
		"en/learn/courses":   contentFile("a file, not a directory"),
	})
	if err == nil || store != nil {
		t.Fatal("unreadable courses inventory must fail closed")
	}
	if !strings.Contains(err.Error(), "courses") {
		t.Fatalf("courses error must name the inventory, got %q", err)
	}
}
