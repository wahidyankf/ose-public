package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

func fixturePages() []content.Page {
	return []content.Page{
		{Locale: "en", Course: "go-basics", Slug: "hello-world", Title: "Hello World", Weight: 2},
		{Locale: "en", Course: "go-basics", Slug: "setup", Title: "Setup", Weight: 1},
		{Locale: "en", Course: "go-basics", Slug: "draft-note", Title: "Draft", Weight: 3, Draft: true},
		{Locale: "id", Course: "go-basics", Slug: "hello-world", Title: "Halo Dunia", Weight: 2},
	}
}

func TestPublishedHidesDraftsAndOrdersByWeight(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	pages := store.Published("en")
	if len(pages) != 2 {
		t.Fatalf("published pages = %d, want 2 (draft hidden)", len(pages))
	}
	if pages[0].Slug != "setup" || pages[1].Slug != "hello-world" {
		t.Fatalf("catalog order = %q, want weight order [setup hello-world]", []string{pages[0].Slug, pages[1].Slug})
	}
}

func TestFindResolvesLesson(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	page, ok := store.Find("en", "go-basics", "hello-world")
	if !ok {
		t.Fatal("published lesson must resolve")
	}
	if page.Title != "Hello World" {
		t.Fatalf("title = %q, want Hello World", page.Title)
	}
}

func TestFindHidesDraftRoute(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	if _, ok := store.Find("en", "go-basics", "draft-note"); ok {
		t.Fatal("draft route must not resolve")
	}
}

func TestFindMissingReturnsFalse(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	if _, ok := store.Find("en", "go-basics", "nope"); ok {
		t.Fatal("missing lesson must not resolve")
	}
}

func TestShowDraftsRevealsDraftsForFixtures(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	store.ShowDrafts(true)
	pages := store.Published("en")
	if len(pages) != 3 {
		t.Fatalf("published pages with drafts = %d, want 3", len(pages))
	}
	if _, ok := store.Find("en", "go-basics", "draft-note"); !ok {
		t.Fatal("draft route must resolve when drafts are shown")
	}
}

func TestDiagnosticsRoundTrip(t *testing.T) {
	store := content.NewFakeStore(fixturePages())
	if len(store.Diagnostics()) != 0 {
		t.Fatal("fresh store must have no diagnostics")
	}
	store.Report("content: invalid frontmatter in lessons/broken.md")
	if len(store.Diagnostics()) != 1 {
		t.Fatalf("diagnostics = %d, want 1", len(store.Diagnostics()))
	}
}

func TestSplitFrontmatterVariants(t *testing.T) {
	front, body := content.SplitFrontmatter("---\ntitle: Hi\n---\n# Body\n")
	if front != "title: Hi" || body != "# Body\n" {
		t.Fatalf("dash fence split = %q/%q", front, body)
	}
	front, body = content.SplitFrontmatter("# No fence\n")
	if front != "" || body != "# No fence\n" {
		t.Fatalf("missing fence split = %q/%q", front, body)
	}
	front, body = content.SplitFrontmatter("+++\nunclosed\n")
	if front != "" || body != "+++\nunclosed\n" {
		t.Fatalf("unclosed fence split = %q/%q", front, body)
	}
	front, body = content.SplitFrontmatter("")
	if front != "" || body != "" {
		t.Fatalf("empty source split = %q/%q", front, body)
	}
}

func TestParseFrontmatterEmptyAndInvalid(t *testing.T) {
	meta, err := content.ParseFrontmatter("")
	if err != nil || len(meta) != 0 {
		t.Fatalf("empty frontmatter = %v, %v; want empty map", meta, err)
	}
	if _, err := content.ParseFrontmatter(":\tbad"); err == nil {
		t.Fatal("invalid YAML must fail")
	}
}

func TestSplitFrontmatter(t *testing.T) {
	front, body := content.SplitFrontmatter("+++\ntitle = \"Hi\"\n+++\n# Body\n")
	if !strings.Contains(front, "title") {
		t.Fatalf("frontmatter = %q, want title metadata", front)
	}
	if !strings.Contains(body, "# Body") {
		t.Fatalf("body = %q, want markdown body", body)
	}
}

func TestParseFrontmatter(t *testing.T) {
	meta, err := content.ParseFrontmatter("title: Hello\nweight: 2\n")
	if err != nil {
		t.Fatalf("ParseFrontmatter: %v", err)
	}
	if meta["title"] != "Hello" {
		t.Fatalf("title = %v, want Hello", meta["title"])
	}
}

func TestRenderMarkdownKeepsStructure(t *testing.T) {
	html := content.RenderMarkdown("# Title\n\nParagraph with **bold**.\n")
	if !strings.Contains(html, "Paragraph") || !strings.Contains(html, "<strong>") {
		t.Fatalf("rendered html = %q, want paragraph and bold", html)
	}
}

func TestSanitizeRemovesEventHandlers(t *testing.T) {
	clean := content.SanitizeHTML(`<p onclick="evil()">Hi</p><script>alert(1)</script>`)
	if strings.Contains(clean, "onclick") || strings.Contains(clean, "<script>") {
		t.Fatalf("sanitized html = %q, want handlers and scripts removed", clean)
	}
	if !strings.Contains(clean, "Hi") {
		t.Fatalf("sanitized html = %q, want authored text kept", clean)
	}
}
