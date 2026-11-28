package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// lessonContext is the page a body renders for: a learning lesson in a course.
var lessonContext = content.RenderContext{Locale: "en", Slug: "learn/courses/web/learning/overview"}

// Gap 1: the real pipeline must turn each supported shortcode into its component markup, and never leave the
// raw Hugo text in the served body.
func TestRenderPageGap1ShortcodesBecomeComponentMarkup(t *testing.T) {
	source := "{{< callout type=\"warning\" >}}\nBe careful\n{{< /callout >}}\n\n" +
		"{{< tabs items=\"Overview, Details\" >}}\n{{< tab >}}First panel{{< /tab >}}\n" +
		"{{< tab >}}Second panel{{< /tab >}}\n{{< /tabs >}}\n\n" +
		"{{% steps %}}\n1. Do it\n{{% /steps %}}\n"
	body := content.RenderPage(source, lessonContext).HTML
	for _, want := range []string{
		`data-callout="warning"`, "Be careful",
		`data-tabs="Overview, Details"`, "data-tab", "First panel", "Second panel",
		"data-steps", "<ol>",
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("shortcode render lacks %q in %q", want, body)
		}
	}
	for _, raw := range []string{"{{<", "{{%"} {
		if strings.Contains(body, raw) {
			t.Fatalf("raw shortcode text %q survived rendering: %q", raw, body)
		}
	}
}

// Gap 2: a relative Markdown link resolves to the route that serves its target, and its fragment survives.
func TestRenderPageGap2RelativeMarkdownLinkBecomesRoute(t *testing.T) {
	body := content.RenderPage("See [the beginner lesson](./beginner.md#part).\n", lessonContext).HTML
	if !strings.Contains(body, `href="/en/learn/courses/web/learning/beginner#part"`) {
		t.Fatalf("sibling link was not rewritten to its route: %q", body)
	}
}

func TestRenderPageGap2TrackOverviewLinkTargetsTheRouteThatServesIt(t *testing.T) {
	body := content.RenderPage("Prior: [Other track](../../other/learning/overview.md).\n", lessonContext).HTML
	if !strings.Contains(body, `href="/en/learn/courses/other/learning/learning"`) {
		t.Fatalf("overview link does not target the served track route: %q", body)
	}
}

// Gap 3: fenced mermaid keeps the diagram hook the browser renderer reads, and math keeps the KaTeX hooks.
func TestRenderPageGap3MermaidFenceKeepsItsDiagramHook(t *testing.T) {
	body := content.RenderPage("```mermaid\ngraph TD; A-->B\n```\n", lessonContext).HTML
	if !strings.Contains(body, `class="mermaid"`) {
		t.Fatalf("mermaid fence lost its diagram hook: %q", body)
	}
	if !strings.Contains(body, "graph TD; A--&gt;B") {
		t.Fatalf("mermaid source is not kept as the fallback text: %q", body)
	}
}

func TestRenderPageGap3MathKeepsItsKatexHooks(t *testing.T) {
	body := content.RenderPage("Inline $x^2$ here.\n\n$$\ny = mx + b\n$$\n", lessonContext).HTML
	for _, want := range []string{`class="math-inline"`, "x^2", `class="math-display"`, "y = mx + b"} {
		if !strings.Contains(body, want) {
			t.Fatalf("math render lacks %q in %q", want, body)
		}
	}
	if strings.Contains(body, "$") {
		t.Fatalf("math delimiters survived rendering: %q", body)
	}
}

func TestRenderPageGap3DollarAmountsStayText(t *testing.T) {
	body := content.RenderPage("It costs $5 and then $10 more.\n", lessonContext).HTML
	if strings.Contains(body, "math-inline") || !strings.Contains(body, "$5 and then $10") {
		t.Fatalf("currency amounts were read as math: %q", body)
	}
}

// Gap 4: the page carries a table of contents whose entries are the body's h2 to h4 headings, with matching ids.
func TestRenderPageGap4TableOfContentsLinksBodyHeadings(t *testing.T) {
	rendered := content.RenderPage("## Setup\n\nText.\n\n### Details\n\nMore.\n\n#### Deep\n\n##### Too deep\n", lessonContext)
	want := []content.Heading{
		{ID: "setup", Text: "Setup", Level: 2},
		{ID: "details", Text: "Details", Level: 3},
		{ID: "deep", Text: "Deep", Level: 4},
	}
	if len(rendered.TOC) != len(want) {
		t.Fatalf("TOC = %+v, want %+v", rendered.TOC, want)
	}
	for index, entry := range want {
		if rendered.TOC[index] != entry {
			t.Fatalf("TOC[%d] = %+v, want %+v", index, rendered.TOC[index], entry)
		}
	}
	for _, id := range []string{`id="setup"`, `id="details"`, `id="deep"`} {
		if !strings.Contains(rendered.HTML, id) {
			t.Fatalf("body heading lacks the anchor %s: %q", id, rendered.HTML)
		}
	}
}

// Gap 5: the title owns h1, so the body has no h1 and its first heading becomes h2.
func TestRenderPageGap5BodyHeadingsStartAtH2(t *testing.T) {
	body := content.RenderPage("# Title in body\n\n## Part\n\n### Sub\n", lessonContext).HTML
	if strings.Contains(body, "<h1") {
		t.Fatalf("body must not carry an h1, the page title owns it: %q", body)
	}
	for _, want := range []string{`<h2 id="title-in-body">Title in body</h2>`, `<h3 id="part">Part</h3>`, `<h4 id="sub">Sub</h4>`} {
		if !strings.Contains(body, want) {
			t.Fatalf("normalized outline lacks %q in %q", want, body)
		}
	}
}

// Gap 6: a GFM task list keeps its checkbox inputs, and no other input survives.
func TestRenderPageGap6TaskListKeepsCheckboxes(t *testing.T) {
	body := content.RenderPage("- [x] Done step\n- [ ] Open step\n", lessonContext).HTML
	if count := strings.Count(body, `type="checkbox"`); count != 2 {
		t.Fatalf("task list checkboxes = %d, want 2 in %q", count, body)
	}
	if !strings.Contains(body, "checked") || !strings.Contains(body, "disabled") {
		t.Fatalf("task list checkbox state lost: %q", body)
	}
}

func TestRenderPageGap6AuthoredInputOutsideAListIsOmitted(t *testing.T) {
	body := content.RenderPage("<input type=\"checkbox\" checked>\n", lessonContext).HTML
	if strings.Contains(body, "<input") {
		t.Fatalf("an authored input outside a list survived: %q", body)
	}
}

// Gap 7: a line-start raw details block keeps its summary; other raw HTML stays omitted.
func TestRenderPageGap7RawDetailsBlockSurvives(t *testing.T) {
	body := content.RenderPage("<details>\n<summary>More</summary>\n\nHidden text.\n\n</details>\n", lessonContext).HTML
	for _, want := range []string{"<details>", "<summary>More</summary>", "Hidden text."} {
		if !strings.Contains(body, want) {
			t.Fatalf("raw details lacks %q in %q", want, body)
		}
	}
}

func TestRenderPageGap7OtherRawHTMLStaysOmitted(t *testing.T) {
	body := content.RenderPage("<div>raw block</div>\n\nInline `<details>` text.\n", lessonContext).HTML
	if strings.Contains(body, "raw block") {
		t.Fatalf("a raw div block survived rendering: %q", body)
	}
	if !strings.Contains(body, "&lt;details&gt;") {
		t.Fatalf("a details tag in a code span must stay text: %q", body)
	}
}
