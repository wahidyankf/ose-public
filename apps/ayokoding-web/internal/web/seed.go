package web

import (
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/coursepaths"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/search"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

// SeedFixtureDeps builds the canned P1H corpus shared by the served binary,
// handler unit tests, and the BDD unit driver. The "unavailable-catalog"
// fixture empties the catalog for the E2E unavailable mode. P2 replaces this
// seed with file-backed adapters; the Deps shape stays.
func SeedFixtureDeps(fixture string) Deps {
	empty := fixture == FixtureUnavailableCatalog
	pages := []content.Page{
		{Locale: "en", Course: "go-basics", Slug: "hello-world", Title: "Hello World", Description: "First program", Section: "start", SectionTitle: "Start", Weight: 1, BodyHTML: lessonBodyHTML},
		{Locale: "en", Course: "go-basics", Slug: "setup", Title: "Setup", Description: "Prepare tools", Section: "start", SectionTitle: "Start", Weight: 0, BodyHTML: "<h1>Setup</h1><p>Prepare.</p>"},
		{Locale: "en", Course: "go-basics", Slug: "draft-note", Title: "Draft", Description: "Unpublished", Weight: 2, Draft: true, BodyHTML: "<h1>Draft</h1>"},
		{Locale: "en", Course: "web", Slug: "section-index", Title: "Section Index", Description: "Index", Section: "web", SectionTitle: "Web", Weight: 0, BodyHTML: "<h1>Section Index</h1><a href=\"leaf#part\">relative link</a>"},
		{Locale: "en", Course: "web", Slug: "leaf", Title: "Leaf", Description: "Leaf page", Section: "web", SectionTitle: "Web", Weight: 1, BodyHTML: "<h1>Leaf</h1><h2 id=\"part\">Part</h2>"},
		{Locale: "id", Course: "go-basics", Slug: "hello-world", Title: "Halo Dunia", Description: "Program pertama", Section: "start", SectionTitle: "Mulai", Weight: 1, BodyHTML: "<h1>Halo Dunia</h1><h2>Persiapan</h2><p>Halo.</p>"},
		{Locale: "id", Course: "go-basics", Slug: "setup", Title: "Persiapan", Description: "Siapkan alat", Section: "start", SectionTitle: "Mulai", Weight: 0, BodyHTML: "<h1>Persiapan</h1>"},
	}
	if empty {
		pages = nil
	}
	return Deps{
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
			{Title: "Hello World", Section: "Go Basics", Excerpt: "first program", URL: "/en/learn/go-basics/hello-world", Locale: "en", Kind: "lesson", Body: "hello world first program"},
			{Title: "Setup", Section: "Go Basics", Excerpt: "prepare tools", URL: "/en/learn/go-basics/setup", Locale: "en", Kind: "lesson", Body: "setup prepare tools"},
			{Title: "AI Benchmark", Section: "Tools", Excerpt: "compare models", URL: "/en/tools/ai-benchmark", Locale: "en", Kind: "tool", Body: "benchmark compare models"},
			{Title: "Cost Calculator", Section: "Tools", Excerpt: "living costs", URL: "/en/tools/cost-of-living-calculator", Locale: "en", Kind: "tool", Body: "calculator living costs savings"},
			{Title: "Halo Dunia", Section: "Go Basics", Excerpt: "program pertama", URL: "/id/learn/go-basics/hello-world", Locale: "id", Kind: "lesson", Body: "halo dunia program pertama"},
		}),
		Benchmark: benchmark.NewFakeEngine(map[string]benchmark.Result{
			"chat|mid": {Models: []benchmark.ModelResult{{Name: "Model B", Score: 9.1, PriceUSD: 4}, {Name: "Model A", Score: 8.2, PriceUSD: 2}}},
		}),
		Calculator: calculator.NewFakeEngine(map[string]calculator.Estimate{
			"jakarta|mid|standard|1": {MonthlyCostUSD: 900, MonthlySaving: 600, MinRole: "mid"},
		}),
		Redirects: map[string]string{"/en/old-guide": "/en/learn/go-basics/hello-world"},
	}
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
