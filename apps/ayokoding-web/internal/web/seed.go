package web

import (
	"fmt"
	"io/fs"
	"os"
	"path"
	"sort"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/shareddata"
)

// Read-only source roots the launcher honors. They mirror the documented
// .env.example settings. When unset, the default corpus is discovered from the
// repository root (see ResolveCorpus).
const (
	envContentDir   = "AYOKODING_WEB_CONTENT_DIR"
	envManifestsDir = "AYOKODING_WEB_MANIFESTS_DIR"
	envShowDrafts   = "AYOKODING_WEB_SHOW_DRAFTS"
)

// Sources is the port the seed reads launcher variables and source roots
// through. The binary passes the process environment and os.DirFS; unit
// tests pass recorded values and in-memory trees.
type Sources struct {
	Environment Environment
	Root        func(dir string) fs.FS
	// Working is the launcher's working directory, the start of the walk up to
	// repo-config.yml that discovers the default corpus roots.
	Working string
}

// CannedSources reads nothing: no launcher variables and no source roots, so
// the canned parity corpus serves.
var CannedSources = Sources{Environment: noEnvironment}

// SeedFixtureDeps builds the canned fixture corpus that handler unit tests and
// the BDD unit driver serve, and that a selected fixture serves in the binary.
// The "unavailable-catalog" fixture empties the catalog for the E2E unavailable
// mode. It reads no source roots; SeedDeps overlays the file-backed roots.
func SeedFixtureDeps(fixture string, sources Sources) Deps {
	empty := fixture == FixtureUnavailableCatalog
	pages := []content.Page{
		{Locale: "en", Course: "go-basics", Slug: "hello-world", Title: "Hello World", Description: "First program", Section: "start", SectionTitle: "Start", Weight: 1, BodyHTML: lessonBodyHTML, TOC: []content.Heading{{ID: "setup", Text: "Setup", Level: 2}}},
		{Locale: "en", Course: "legacy", Slug: "software-engineering", Title: "Legacy Software Engineering", Description: "Archived canonical content", Section: "legacy", SectionTitle: "Legacy", Weight: 0, BodyHTML: "<p>Archived canonical content.</p>"},
		{Locale: "en", Course: "go-basics", Slug: "setup", Title: "Setup", Description: "Prepare tools", Section: "start", SectionTitle: "Start", Weight: 0, BodyHTML: "<p>Prepare.</p>"},
		{Locale: "en", Course: "go-basics", Slug: "draft-note", Title: "Draft", Description: "Unpublished", Weight: 2, Draft: true, BodyHTML: "<p>Draft.</p>"},
		{Locale: "en", Course: "web", Slug: "section-index", Title: "Section Index", Description: "Index", Section: "web", SectionTitle: "Web", Weight: 0, BodyHTML: "<a href=\"leaf#part\">relative link</a>"},
		{Locale: "en", Course: "web", Slug: "leaf", Title: "Leaf", Description: "Leaf page", Section: "web", SectionTitle: "Web", Weight: 1, BodyHTML: "<h2 id=\"part\">Part</h2>"},
		{Locale: "id", Course: "go-basics", Slug: "hello-world", Title: "Halo Dunia", Description: "Program pertama", Section: "start", SectionTitle: "Mulai", Weight: 1, BodyHTML: "<h2 id=\"persiapan\">Persiapan</h2><p>Halo.</p>" + idLessonHooksHTML, TOC: []content.Heading{{ID: "persiapan", Text: "Persiapan", Level: 2}}},
		{Locale: "id", Course: "go-basics", Slug: "setup", Title: "Persiapan", Description: "Siapkan alat", Section: "start", SectionTitle: "Mulai", Weight: 0, BodyHTML: "<p>Persiapan.</p>"},
	}
	if empty {
		pages = nil
	}
	canned := content.NewFakeStore(pages)
	// The draft setting applies to the canned corpus too, not only to a
	// file-backed root, so AYOKODING_WEB_SHOW_DRAFTS=true always shows drafts.
	canned.ShowDrafts(showDraftsEnabled(sources.Environment))
	deps := Deps{
		Content: canned,
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
				{ID: "web", Title: "Web", Description: "Build for the web", Format: "course", Effort: "2 weeks", Category: "fundamentals"},
				{ID: "legacy", Title: "Legacy Software Engineering", Description: "Archived canonical content", Format: "course", Effort: "1 week", Category: "fundamentals"},
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
		Benchmark: mustSharedBenchmark(),
		Redirects: map[string]string{"/en/old-guide": "/en/learn/courses/go-basics/learning/hello-world"},
	}
	calculatorDataset, calculatorMatrix := mustSharedCalculator()
	deps.Calculator = calculatorDataset
	deps.Matrix = calculatorMatrix
	if empty {
		deps.CatalogErr = errUnavailableCatalog
		return deps
	}
	return deps
}

// SeedDeps builds the Deps a configuration serves. A selected fixture serves
// the canned corpus; the unavailable-catalog fixture serves an empty catalog
// and reads no roots. With no fixture selected, the default corpus is served.
// In either mode an explicitly named root is read, and an unreadable root is
// refused: startup never falls back to the fixture.
func SeedDeps(cfg Config, sources Sources) (Deps, error) {
	if cfg.Fixture == FixtureUnavailableCatalog {
		return SeedFixtureDeps(cfg.Fixture, sources), nil
	}
	if cfg.Fixture != "" {
		return overlayFiles(SeedFixtureDeps(cfg.Fixture, sources), sources,
			explicitRoot(sources, envContentDir), explicitRoot(sources, envManifestsDir))
	}
	corpus, err := ResolveCorpus(sources)
	if err != nil {
		return Deps{}, err
	}
	return overlayFiles(SeedFixtureDeps(cfg.Fixture, sources), sources, corpus.ContentDir, corpus.ManifestsDir)
}

// explicitRoot returns the trimmed value of a source-root variable, or "" when
// the variable is unset or blank.
func explicitRoot(sources Sources, variable string) string {
	value, ok := sources.Environment(variable)
	if !ok {
		return ""
	}
	return strings.TrimSpace(value)
}

// mustSharedBenchmark loads the shared benchmark dataset from the embedded
// copy the build:assets target vendors from libs/ayokoding-data. A load
// failure falls back to an empty dataset (rendered as the intentional
// empty state) with a sanitized stderr note; it never serves fixture
// values as real results and never crashes the listener.
func mustSharedBenchmark() *benchmark.Dataset {
	raw, err := shareddata.Benchmark()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: embedded benchmark data unreadable: %v\n", err)
		return &benchmark.Dataset{}
	}
	dataset, err := benchmark.LoadDataset(raw)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: shared benchmark data invalid: %v\n", err)
		return &benchmark.Dataset{}
	}
	return dataset
}

// mustSharedCalculator loads the shared cost-of-living dataset, FX snapshot,
// and role matrix from the embedded copies with the same fail-open contract.
func mustSharedCalculator() (calculator.Dataset, calculator.RoleMatrix) {
	costRaw, costErr := shareddata.CostOfLiving()
	fxRaw, fxErr := shareddata.Fx()
	if costErr != nil || fxErr != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: embedded calculator data unreadable: %v %v\n", costErr, fxErr)
		return calculator.Dataset{}, calculator.RoleMatrix{}
	}
	dataset, matrix, err := calculator.LoadDataset(costRaw, fxRaw)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ayokoding-web: shared calculator data invalid: %v\n", err)
		return calculator.Dataset{}, calculator.RoleMatrix{}
	}
	return dataset, matrix
}

// overlayFiles replaces the canned content and path stores with the
// file-backed stores the named roots hold. An empty content root keeps the
// canned fixture. A root that cannot be read is an error, which stops startup.
func overlayFiles(fallback Deps, sources Sources, contentDir, manifestsDir string) (Deps, error) {
	if contentDir == "" {
		return fallback, nil
	}
	store, err := content.LoadFS(sources.Root(contentDir))
	if err != nil {
		return Deps{}, fmt.Errorf("%s root %q cannot be read: %w", envContentDir, contentDir, err)
	}
	store.ShowDrafts(showDraftsEnabled(sources.Environment))
	fallback.Content = store
	var courses []coursepaths.Course
	var malformed []string
	for _, locale := range supportedLocaleList() {
		listed, bad := ComposeCourses(sources.Root(contentDir), locale)
		courses = append(courses, listed...)
		malformed = append(malformed, bad...)
	}
	manifests, err := loadFilePaths(fallback.Paths, sources, manifestsDir)
	if err != nil {
		return Deps{}, err
	}
	diagnostics := append(manifests.Diagnostics(), malformed...)
	fallback.Paths = coursepaths.NewFakeStore(manifests.Paths(), courses, diagnostics)
	return fallback, nil
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
func showDraftsEnabled(environment Environment) bool {
	value, _ := environment(envShowDrafts)
	return strings.EqualFold(strings.TrimSpace(value), "true")
}

// loadFilePaths builds the path store from the manifests root when one is
// named, keeping the canned paths otherwise. An unreadable manifests root is an
// error, which stops startup.
func loadFilePaths(fallback *coursepaths.FakeStore, sources Sources, manifestsDir string) (*coursepaths.FakeStore, error) {
	if manifestsDir == "" {
		return fallback, nil
	}
	loaded, err := coursepaths.LoadFS(sources.Root(manifestsDir))
	if err != nil {
		return nil, fmt.Errorf("%s root %q cannot be read: %w", envManifestsDir, manifestsDir, err)
	}
	return loaded, nil
}

// ComposeCourses scans the real corpus under fsys for the locale's
// courses/*/_index.md manifests and returns catalog entries plus malformed
// sources. A locale without courses contributes nothing. Invalid frontmatter,
// missing titles, and unexpected prerequisite shapes are malformed; draft
// courses stay hidden. Effort renders estimated hours; courses without an
// estimate leave effort empty. "outline" status marks outline-only courses.
func ComposeCourses(fsys fs.FS, locale string) ([]coursepaths.Course, []string) {
	entries, err := fs.ReadDir(fsys, path.Join(locale, "learn", "courses"))
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
		course, ok := composeCourse(fsys, locale, id)
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
func composeCourse(fsys fs.FS, locale, id string) (coursepaths.Course, bool) {
	raw, err := fs.ReadFile(fsys, path.Join(locale, "learn", "courses", id, "_index.md"))
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

// idLessonHooksHTML mirrors the hook-bearing enrichment on the Indonesian
// fixture lesson so renderer proof covers both locales. Markers stay
// identical across locales; only the authored tab panel copy is localized.
const idLessonHooksHTML = `<div class="tabs"><div class="tab-panel">panel authored yang dipilih</div></div>` +
	`<span class="math-inline">inline mathematical notation</span>` +
	`<span class="math-display">display mathematical notation</span>` +
	`<div class="mermaid" role="img" aria-label="diagram" data-chart="graph TD; A-->B">an accessible SVG diagram</div>` +
	`<div class="youtube"><iframe title="responsive video iframe" src="https://www.youtube-nocookie.com/embed/abc"></iframe></div>`

// lessonBodyHTML is the canned rich lesson used by rendering scenarios. P2
// generates it through the goldmark pipeline; the markers are the contract.
const lessonBodyHTML = `` +
	`<h2 id="setup">Setup</h2><p>Hello.</p>` +
	`<table><tr><td>cell</td></tr></table>` +
	`<ul class="task-list"><li>step</li></ul>` +
	`<details><summary>more</summary><p>raw details</p></details>` +
	`<div class="admonition callout"><p>labeled admonition and authored body</p></div>` +
	`<div class="tabs"><div class="tab-panel">selected tab's authored panel</div></div>` +
	`<ol class="steps"><li>ordered numbered learning steps</li></ol>` +
	`<div class="youtube"><iframe title="responsive video iframe" src="https://www.youtube-nocookie.com/embed/abc"></iframe></div>` +
	`<span class="math-inline">inline mathematical notation</span>` +
	`<span class="math-display">display mathematical notation</span>` +
	`<div class="mermaid" role="img" aria-label="diagram" data-chart="graph TD; A-->B">an accessible SVG diagram</div>` +
	`<pre data-language="go"><code>package main // source

func main() {}</code></pre><button data-copy="true" data-copy-label="Copy" data-copied-label="Copied" data-failed-label="Copy failed">Copy</button>` +
	`<p>wrapping inline <code>averylonginlinetokenthatmustwrapwithinthearticlereadingcolumn</code> continues</p>` +
	`<pre class="wide"><code>wide fenced block that scrolls internally without widening the document column width</code></pre>`
