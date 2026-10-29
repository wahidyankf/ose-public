package web

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

// Read-only source roots honored by the file-backed seed. They mirror the
// documented .env.example settings; when AYOKODING_WEB_CONTENT_DIR is unset
// the canned parity fixture serves instead so unit and behaviour tests stay
// deterministic.
const (
	envContentDir   = "AYOKODING_WEB_CONTENT_DIR"
	envManifestsDir = "AYOKODING_WEB_MANIFESTS_DIR"
	envShowDrafts   = "AYOKODING_WEB_SHOW_DRAFTS"
)

// SeedFixtureDeps builds the canned P1H corpus shared by the served binary,
// handler unit tests, and the BDD unit driver. The "unavailable-catalog"
// fixture empties the catalog for the E2E unavailable mode. When
// AYOKODING_WEB_CONTENT_DIR names a source root, content and learning paths
// load from disk through the file-backed adapters while tools, search, and
// redirects keep their canned parity slices; the Deps shape stays.
func SeedFixtureDeps(fixture string) Deps {
	empty := fixture == FixtureUnavailableCatalog
	pages := []content.Page{
		{Locale: "en", Course: "go-basics", Slug: "hello-world", Title: "Hello World", Description: "First program", Section: "start", SectionTitle: "Start", Weight: 1, BodyHTML: lessonBodyHTML},
		{Locale: "en", Course: "legacy", Slug: "software-engineering", Title: "Legacy Software Engineering", Description: "Archived canonical content", Section: "legacy", SectionTitle: "Legacy", Weight: 0, BodyHTML: "<h1>Legacy Software Engineering</h1><p>Archived canonical content.</p>"},
		{Locale: "en", Course: "go-basics", Slug: "setup", Title: "Setup", Description: "Prepare tools", Section: "start", SectionTitle: "Start", Weight: 0, BodyHTML: "<h1>Setup</h1><p>Prepare.</p>"},
		{Locale: "en", Course: "go-basics", Slug: "draft-note", Title: "Draft", Description: "Unpublished", Weight: 2, Draft: true, BodyHTML: "<h1>Draft</h1>"},
		{Locale: "en", Course: "web", Slug: "section-index", Title: "Section Index", Description: "Index", Section: "web", SectionTitle: "Web", Weight: 0, BodyHTML: "<h1>Section Index</h1><a href=\"leaf#part\">relative link</a>"},
		{Locale: "en", Course: "web", Slug: "leaf", Title: "Leaf", Description: "Leaf page", Section: "web", SectionTitle: "Web", Weight: 1, BodyHTML: "<h1>Leaf</h1><h2 id=\"part\">Part</h2>"},
		{Locale: "id", Course: "go-basics", Slug: "hello-world", Title: "Halo Dunia", Description: "Program pertama", Section: "start", SectionTitle: "Mulai", Weight: 1, BodyHTML: "<h1>Halo Dunia</h1><h2>Persiapan</h2><p>Halo.</p>"},
		{Locale: "id", Course: "go-basics", Slug: "setup", Title: "Persiapan", Description: "Siapkan alat", Section: "start", SectionTitle: "Mulai", Weight: 0, BodyHTML: "<h1>Persiapan</h1>"},
		{Locale: "en", Course: "legacy", Slug: "software-engineering", Title: "Legacy Software Engineering", Description: "Archived domain", Weight: 0, BodyHTML: "<h1>Legacy Software Engineering</h1><p>Archived canonical content.</p>"},
	}
	if empty {
		pages = nil
	}
	deps := Deps{
		Content: content.NewFakeStore(pages),
		Paths: coursepaths.NewFakeStore(
			[]coursepaths.LearningPath{
				{ID: "backend-id", Title: "Backend", Category: "careers", Phases: []coursepaths.Phase{
					{Name: "Fundamentals", Courses: []string{"go-basics"}},
					{Name: "Practice", Courses: []string{"go-web"}},
				}},
			},
			[]coursepaths.Course{
				{ID: "go-basics", Title: "Go Basics", Description: "Learn Go", Format: "course", Effort: "4 weeks", Category: "fundamentals"},
				{ID: "go-web", Title: "Go Web", Description: "Serve HTTP", Format: "course", Effort: "6 weeks", Category: "fundamentals", Prerequisites: []string{"go-basics"}},
				{ID: "outline-only", Title: "Coming Soon", Description: "Planned", Format: "course", Effort: "TBD", Category: "fundamentals", Outline: true},
			},
			[]string{"broken-manifest.json"},
		),
		Index: search.NewFakeIndex([]search.Entry{
			{Title: "Hello World", Section: "Go Basics", Excerpt: "first program", URL: "/en/learn/courses/go-basics/learning/hello-world", Locale: "en", Kind: "lesson", Body: "hello world first program"},
			{Title: "Setup", Section: "Go Basics", Excerpt: "prepare tools", URL: "/en/learn/courses/go-basics/learning/setup", Locale: "en", Kind: "lesson", Body: "setup prepare tools"},
			{Title: "AI Benchmark", Section: "Tools", Excerpt: "compare models", URL: "/en/tools/ai-benchmark", Locale: "en", Kind: "tool", Body: "benchmark compare models"},
			{Title: "Cost Calculator", Section: "Tools", Excerpt: "living costs", URL: "/en/tools/cost-of-living-calculator", Locale: "en", Kind: "tool", Body: "calculator living costs savings"},
			{Title: "Halo Dunia", Section: "Go Basics", Excerpt: "program pertama", URL: "/id/learn/courses/go-basics/learning/hello-world", Locale: "id", Kind: "lesson", Body: "halo dunia program pertama"},
		}),
		Benchmark: benchmark.NewFakeEngine(map[string]benchmark.Result{
			"chat|mid": {Models: []benchmark.ModelResult{{Name: "Model B", Score: 9.1, PriceUSD: 4}, {Name: "Model A", Score: 8.2, PriceUSD: 2}}},
		}),
		Calculator: calculator.NewFakeEngine(map[string]calculator.Estimate{
			"jakarta|mid|standard|1": {MonthlyCostUSD: 900, MonthlySaving: 600, MinRole: "mid"},
		}),
		Redirects: map[string]string{"/en/old-guide": "/en/learn/courses/go-basics/learning/hello-world"},
	}
	if empty {
		deps.CatalogErr = errUnavailableCatalog
		return deps
	}
	return withFileBackedSources(deps)
}

// withFileBackedSources replaces the canned content and path stores with
// file-backed adapters when AYOKODING_WEB_CONTENT_DIR is configured. Tools,
// search, and redirects keep their canned parity slices until their own
// adapters land. An unreadable root falls back to the canned fixture with a
// stderr warning and a recorded store diagnostic; it never serves a 200
// empty page to mask the failure.
func withFileBackedSources(fallback Deps) Deps {
	contentRoot, ok := os.LookupEnv(envContentDir)
	if !ok || strings.TrimSpace(contentRoot) == "" {
		return fallback
	}
	locales := supportedLocaleList()
	store, err := content.LoadDir(contentRoot)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: content root %q: %v; serving canned fixture\n", contentRoot, err)
		fallback.Content.Report("content: file-backed root " + contentRoot + " unreadable; serving canned fixture")
		return fallback
	}
	store.ShowDrafts(showDraftsEnabled())
	fallback.Content = store
	var courses []coursepaths.Course
	var malformed []string
	for _, locale := range locales {
		listed, bad := ComposeCourses(contentRoot, locale)
		courses = append(courses, listed...)
		malformed = append(malformed, bad...)
	}
	manifests := loadFilePaths(fallback.Paths)
	diagnostics := append(manifests.Diagnostics(), malformed...)
	fallback.Paths = coursepaths.NewFakeStore(manifests.Paths(), courses, diagnostics)
	return fallback
}

// supportedLocaleList lists the served locales in stable order.
func supportedLocaleList() []string {
	locales := make([]string, 0, len(supportedLocales))
	for locale := range supportedLocales {
		locales = append(locales, locale)
	}
	sort.Strings(locales)
	return locales
}

// showDraftsEnabled reports whether owned test or authoring fixtures may see
// draft content.
func showDraftsEnabled() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv(envShowDrafts)), "true")
}

// loadFilePaths builds the path store from AYOKODING_WEB_MANIFESTS_DIR when
// configured, keeping the canned paths untouched otherwise. An unreadable
// manifests root yields an empty path catalog with a diagnostic instead of
// mixing canned paths with file-backed content.
func loadFilePaths(fallback *coursepaths.FakeStore) *coursepaths.FakeStore {
	manifestsRoot, ok := os.LookupEnv(envManifestsDir)
	if !ok || strings.TrimSpace(manifestsRoot) == "" {
		return fallback
	}
	loaded, err := coursepaths.LoadDir(manifestsRoot)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: manifests root %q: %v; serving no file paths\n", manifestsRoot, err)
		return coursepaths.NewFakeStore(nil, nil, []string{"coursepaths: manifests root " + manifestsRoot + " unreadable"})
	}
	return loaded
}

// ComposeCourses scans the real corpus at contentRoot for the locale's
// courses/*/_index.md manifests and returns catalog entries plus malformed
// sources. A locale without courses contributes nothing. Invalid frontmatter,
// missing titles, and unexpected prerequisite shapes are malformed; draft
// courses stay hidden. Effort renders estimated hours; courses without an
// estimate leave effort empty. "outline" status marks outline-only courses.
func ComposeCourses(contentRoot, locale string) ([]coursepaths.Course, []string) {
	entries, err := os.ReadDir(filepath.Join(contentRoot, locale, "learn", "courses"))
	if err != nil {
		return nil, nil
	}
	var ids []string
	for _, entry := range entries {
		if entry.IsDir() {
			ids = append(ids, entry.Name())
		}
	}
	sort.Strings(ids)
	var courses []coursepaths.Course
	var malformed []string
	for _, id := range ids {
		course, ok := composeCourse(contentRoot, locale, id)
		if !ok {
			malformed = append(malformed, id+"/_index.md")
			continue
		}
		courses = append(courses, course)
	}
	return courses, malformed
}

// composeCourse reads one course manifest; ok is false for malformed or
// draft sources.
func composeCourse(contentRoot, locale, id string) (coursepaths.Course, bool) {
	raw, err := os.ReadFile(filepath.Join(contentRoot, locale, "learn", "courses", id, "_index.md"))
	if err != nil {
		return coursepaths.Course{}, false
	}
	front, _ := content.SplitFrontmatter(string(raw))
	meta, err := content.ParseFrontmatter(front)
	if err != nil {
		return coursepaths.Course{}, false
	}
	title, _ := meta["title"].(string)
	if strings.TrimSpace(title) == "" {
		return coursepaths.Course{}, false
	}
	if draft, _ := meta["draft"].(bool); draft {
		return coursepaths.Course{}, false
	}
	prerequisites, ok := frontStrings(meta["prerequisites"])
	if !ok {
		return coursepaths.Course{}, false
	}
	return coursepaths.Course{
		ID:            id,
		Title:         strings.TrimSpace(title),
		Description:   strings.TrimSpace(firstString(meta["description"])),
		Category:      strings.TrimSpace(firstString(meta["category"])),
		Format:        strings.TrimSpace(firstString(meta["format"])),
		Effort:        frontEffort(meta["estimatedHours"]),
		Prerequisites: prerequisites,
		Outline:       strings.TrimSpace(firstString(meta["status"])) == "outline",
	}, true
}

// frontStrings coerces an optional YAML sequence of course identifiers.
func frontStrings(value any) ([]string, bool) {
	if value == nil {
		return nil, true
	}
	raw, ok := value.([]any)
	if !ok {
		return nil, false
	}
	var out []string
	for _, item := range raw {
		text, ok := item.(string)
		if !ok {
			return nil, false
		}
		out = append(out, text)
	}
	return out, true
}

// firstString coerces optional manifest text.
func firstString(value any) string {
	text, _ := value.(string)
	return text
}

// frontEffort renders the estimated-hours manifest field. Whole hours keep
// their integer label; fractional hours keep one compact decimal so a "4.5"
// estimate never becomes a misleading finite "4 hours" or an empty label.
// Non-numeric values yield no estimate.
func frontEffort(value any) string {
	var hours float64
	switch number := value.(type) {
	case int:
		hours = float64(number)
	case float64:
		hours = number
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(number), 64)
		if err != nil {
			return ""
		}
		hours = parsed
	default:
		return ""
	}
	return strconv.FormatFloat(hours, 'f', -1, 64) + " hours"
}

// lessonBodyHTML is the canned rich lesson used by rendering scenarios. P2
// generates it through the goldmark pipeline; the markers are the contract.
const lessonBodyHTML = `<h1>Hello World</h1>` +
	`<h2>Setup</h2><p>Hello.</p>` +
	`<table><tr><td>cell</td></tr></table>` +
	`<ul class="task-list"><li>step</li></ul>` +
	`<details><summary>more</summary><p>raw details</p></details>` +
	`<div class="admonition callout"><p>labeled admonition and authored body</p></div>` +
	`<div class="tabs"><div class="tab-panel">selected tab's authored panel</div></div>` +
	`<ol class="steps"><li>ordered numbered learning steps</li></ol>` +
	`<div class="youtube"><iframe title="responsive video iframe" src="https://www.youtube.com/embed/abc"></iframe></div>` +
	`<span class="math-inline">inline mathematical notation</span>` +
	`<span class="math-display">display mathematical notation</span>` +
	`<div class="mermaid" role="img" aria-label="diagram">an accessible SVG diagram</div>` +
	`<pre data-language="go"><code>package main // source

func main() {}</code></pre><button data-copy="true">Copy</button>` +
	`<p>wrapping inline <code>averylonginlinetokenthatmustwrapwithinthearticlereadingcolumn</code> continues</p>` +
	`<pre class="wide"><code>wide fenced block that scrolls internally without widening the document column width</code></pre>`
