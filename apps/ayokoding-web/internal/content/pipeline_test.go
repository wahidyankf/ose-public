package content_test

import (
	"html/template"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

func TestSafeSlugAcceptsIdentities(t *testing.T) {
	for _, slug := range []string{"hello-world", "go_basics", "ABC123", "a", "setup"} {
		if !content.SafeSlug(slug) {
			t.Fatalf("SafeSlug(%q) = false, want true", slug)
		}
	}
}

func TestSafeSlugRejectsUnsafeIdentities(t *testing.T) {
	for _, slug := range []string{
		"", ".", "..", "...",
		"a/b", "a\\b", "a b", "a.md", "a#part", "a?b",
		"%2e", "a%20b", "a\x00b", "a\nb", "a\tb",
		"/en", "../evil", "a/b/../c",
		"{{.X}}", "<script>", "héllo",
	} {
		if content.SafeSlug(slug) {
			t.Fatalf("SafeSlug(%q) = true, want false", slug)
		}
	}
}

func TestSlugifyHeading(t *testing.T) {
	for text, want := range map[string]string{
		"Setup":            "setup",
		"Hello World!":     "hello-world",
		"  Trim  Spaces  ": "trim-spaces",
		"Go & You":         "go-you",
		"Persiapan":        "persiapan",
		"Halo Dunia!":      "halo-dunia",
		"a---b___c":        "a-b-c",
		"v1.2 release":     "v1-2-release",
	} {
		if got := content.SlugifyHeading(text); got != want {
			t.Fatalf("SlugifyHeading(%q) = %q, want %q", text, got, want)
		}
	}
	if got := content.SlugifyHeading("!!!"); got != "" {
		t.Fatalf("SlugifyHeading punctuation = %q, want empty", got)
	}
}

func TestNormalizeHeadingLevels(t *testing.T) {
	for name, vectors := range map[string]struct {
		levels []int
		want   []int
	}{
		"title-first body shifts up":   {[]int{1, 2, 3}, []int{2, 3, 4}},
		"already h2 stays":             {[]int{2, 3}, []int{2, 3}},
		"deep first shifts down":       {[]int{3, 4}, []int{2, 3}},
		"clamps at h6":                 {[]int{1, 6, 4}, []int{2, 6, 5}},
		"clamps at h2":                 {[]int{4, 2}, []int{2, 2}},
		"single title":                 {[]int{1}, []int{2}},
		"later h2 after h3 normalizes": {[]int{3, 2}, []int{2, 2}},
	} {
		t.Run(name, func(t *testing.T) {
			got := content.NormalizeHeadingLevels(vectors.levels)
			if len(got) != len(vectors.want) {
				t.Fatalf("NormalizeHeadingLevels(%v) = %v, want %v", vectors.levels, got, vectors.want)
			}
			for index := range got {
				if got[index] != vectors.want[index] {
					t.Fatalf("NormalizeHeadingLevels(%v) = %v, want %v", vectors.levels, got, vectors.want)
				}
			}
		})
	}
	if got := content.NormalizeHeadingLevels(nil); len(got) != 0 {
		t.Fatalf("NormalizeHeadingLevels(nil) = %v, want empty", got)
	}
}

func TestExtractTOC(t *testing.T) {
	entries := content.ExtractTOC(
		[]int{2, 3, 4, 1, 5, 2},
		[]string{"Setup", "Install", "Verify", "Title", "Deep", "Setup"},
	)
	if len(entries) != 4 {
		t.Fatalf("TOC entries = %+v, want 4 h2-h4 entries", entries)
	}
	want := []content.Heading{
		{ID: "setup", Text: "Setup", Level: 2},
		{ID: "install", Text: "Install", Level: 3},
		{ID: "verify", Text: "Verify", Level: 4},
		{ID: "setup-1", Text: "Setup", Level: 2},
	}
	for index := range want {
		if entries[index] != want[index] {
			t.Fatalf("TOC[%d] = %+v, want %+v", index, entries[index], want[index])
		}
	}
	ragged := content.ExtractTOC([]int{2, 2, 2, 2}, []string{"Alpha", "!!!", "Alpha"})
	if len(ragged) != 2 || ragged[0].ID != "alpha" || ragged[1].ID != "alpha-1" {
		t.Fatalf("ragged TOC = %+v, want alpha then alpha-1 with blanks skipped", ragged)
	}
}

func TestTransformShortcodes(t *testing.T) {
	got := content.TransformShortcodes("{{< callout type=\"warning\" >}}\nBe careful\n{{< /callout >}}")
	if !strings.Contains(got, `<div data-callout="warning">`) || !strings.Contains(got, "Be careful") {
		t.Fatalf("callout transform = %q", got)
	}
	got = content.TransformShortcodes("{{< tabs items=\"a,b\" >}}\n{{< tab >}}First{{< /tab >}}\n{{< tab >}}Second{{< /tab >}}\n{{< /tabs >}}")
	for _, marker := range []string{`<div data-tabs="a,b">`, `<div data-tab>`, "First", "Second"} {
		if !strings.Contains(got, marker) {
			t.Fatalf("tabs transform misses %q in %q", marker, got)
		}
	}
	got = content.TransformShortcodes("{{< youtube abc123 >}}")
	if !strings.Contains(got, `<div data-youtube="abc123"></div>`) {
		t.Fatalf("youtube transform = %q", got)
	}
	got = content.TransformShortcodes("{{% steps %}}\n1. Do it\n{{% /steps %}}")
	if !strings.Contains(got, "<div data-steps>") || !strings.Contains(got, "1. Do it") {
		t.Fatalf("steps transform = %q", got)
	}
	plain := "Just **markdown**, no shortcode."
	if got := content.TransformShortcodes(plain); got != plain {
		t.Fatalf("plain transform = %q, want unchanged", got)
	}
}

func TestTransformShortcodesNeverEmitsTemplateDirectives(t *testing.T) {
	for _, source := range []string{
		"{{.Shell}}",
		"{{< callout type=\"info\" >}}\n{{.X}}\n{{< /callout >}}",
		"{{template \"x\"}} {{if .Y}}hi{{end}}",
	} {
		got := content.TransformShortcodes(source)
		for _, directive := range []string{"{{define", "{{template", "{{if", "{{range", "{{end}}"} {
			if strings.Contains(source, directive) {
				continue
			}
			if strings.Contains(got, directive) {
				t.Fatalf("transform of %q emits %q", source, directive)
			}
		}
	}
	rendered := content.RenderMarkdown("{{.Shell}}")
	page := template.Must(template.New("page").Parse(`<article>{{.Body}}</article>`))
	var output strings.Builder
	if err := page.Execute(&output, map[string]any{"Body": template.HTML(rendered)}); err != nil {
		t.Fatalf("outer template: %v", err)
	}
	if !strings.Contains(output.String(), "{{.Shell}}") {
		t.Fatalf("markdown braces must survive as text, got %q", output.String())
	}
}

func TestResolveContentHref(t *testing.T) {
	section := &content.LinkContext{Locale: "en", Slug: "web", IsSection: true}
	leaf := &content.LinkContext{Locale: "en", Slug: "learn/x/overview"}
	for name, vector := range map[string]struct {
		href    string
		context *content.LinkContext
		want    string
	}{
		"external unchanged":            {"https://example.com/a.md", leaf, "https://example.com/a.md"},
		"mailto unchanged":              {"mailto:a@b.id", leaf, "mailto:a@b.id"},
		"site root unchanged":           {"/en/learn", leaf, "/en/learn"},
		"anchor unchanged":              {"#part", leaf, "#part"},
		"asset unchanged":               {"image.png", leaf, "image.png"},
		"nil context unchanged":         {"leaf.md", nil, "leaf.md"},
		"leaf sibling":                  {"beginner.md", leaf, "/en/learn/x/beginner"},
		"leaf sibling with fragment":    {"beginner.md#part", leaf, "/en/learn/x/beginner#part"},
		"leaf parent":                   {"../overview.md", leaf, "/en/learn/overview"},
		"section child":                 {"leaf.md", section, "/en/web/leaf"},
		"section child with fragment":   {"leaf.md#part", section, "/en/web/leaf#part"},
		"section index target":          {"_index.md", section, "/en/web"},
		"home index target":             {"_index.md", &content.LinkContext{Locale: "en"}, "/en"},
		"section parent section":        {"../other/_index.md", section, "/en/other"},
		"current dir":                   {"./beginner.md", leaf, "/en/learn/x/beginner"},
		"dotdot file":                   {"../../top.md", &content.LinkContext{Locale: "id", Slug: "a/b/c"}, "/id/top"},
		"section dir itself":            {"./_index.md", section, "/en/web"},
		"query only anchor passthrough": {"other.md?x=1", leaf, "other.md?x=1"},
	} {
		t.Run(name, func(t *testing.T) {
			if got := content.ResolveContentHref(vector.href, vector.context); got != vector.want {
				t.Fatalf("ResolveContentHref(%q) = %q, want %q", vector.href, got, vector.want)
			}
		})
	}
}

func TestContentURL(t *testing.T) {
	for name, vector := range map[string]struct {
		locale string
		slug   string
		path   []string
		want   string
	}{
		"locale home":       {"en", "", nil, "/en"},
		"index is home":     {"en", "_index", nil, "/en"},
		"lesson":            {"en", "learn/go-basics/hello-world", nil, "/en/learn/go-basics/hello-world"},
		"indonesian":        {"id", "web/leaf", nil, "/id/web/leaf"},
		"trims slashes":     {"en", "/learn/x/", nil, "/en/learn/x"},
		"with path context": {"en", "learn/go-basics/setup", []string{"backend-id"}, "/en/learn/go-basics/setup?path=backend-id"},
	} {
		t.Run(name, func(t *testing.T) {
			if got := content.ContentURL(vector.locale, vector.slug, vector.path...); got != vector.want {
				t.Fatalf("ContentURL = %q, want %q", got, vector.want)
			}
		})
	}
}
