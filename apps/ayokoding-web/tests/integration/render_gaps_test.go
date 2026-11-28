package integration_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// renderGapServer starts the launcher's default configuration over httptest on the real repository, so every
// page below is rendered by the real pipeline over the real corpus.
func renderGapServer(t *testing.T) *httptest.Server {
	t.Helper()
	working, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd: %v", err)
	}
	noLauncher := func(string) (string, bool) { return "", false }
	cfg, err := web.ResolveConfig(nil, noLauncher)
	if err != nil {
		t.Fatalf("ResolveConfig: %v", err)
	}
	deps, err := web.SeedDeps(cfg, web.Sources{Environment: noLauncher, Root: os.DirFS, Working: working})
	if err != nil {
		t.Fatalf("SeedDeps: %v", err)
	}
	server := httptest.NewServer(web.NewServer(cfg, deps).Handler())
	t.Cleanup(server.Close)
	return server
}

// renderGapPage fetches one real page and returns its status and body.
func renderGapPage(t *testing.T, server *httptest.Server, path string) (int, string) {
	t.Helper()
	response, err := http.Get(server.URL + path)
	if err != nil {
		t.Fatalf("GET %s: %v", path, err)
	}
	defer func() { _ = response.Body.Close() }()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return response.StatusCode, string(body)
}

// gobusterQuickStart is a served legacy lesson with callouts, a steps shortcode, a mermaid fence, and h2 headings.
const gobusterQuickStart = "/en/learn/legacy/information-security/tools/gobuster/quick-start"

// Gap 1 over HTTP: the served lesson carries the callout and steps components, and no raw shortcode text.
func TestRenderGap1ServedLessonRendersShortcodes(t *testing.T) {
	status, body := renderGapPage(t, renderGapServer(t), gobusterQuickStart)
	if status != http.StatusOK {
		t.Fatalf("GET quick-start = %d, want 200", status)
	}
	for _, want := range []string{`data-callout="warning"`, "data-steps"} {
		if !strings.Contains(body, want) {
			t.Fatalf("served lesson lacks %q", want)
		}
	}
	if strings.Contains(body, "{{<") || strings.Contains(body, "{{%") {
		t.Fatal("served lesson still shows raw shortcode text")
	}
}

// Gap 2 over HTTP: the overview's relative link to a sibling lesson is served as that lesson's route.
func TestRenderGap2ServedOverviewLinksToSiblingLesson(t *testing.T) {
	server := renderGapServer(t)
	status, body := renderGapPage(t, server, "/en/learn/courses/frontend-essentials/learning/learning")
	if status != http.StatusOK {
		t.Fatalf("GET overview = %d, want 200", status)
	}
	if strings.Contains(body, `href="./beginner.md"`) {
		t.Fatal("served overview still carries a literal relative .md link")
	}
	if !strings.Contains(body, `href="/en/learn/courses/frontend-essentials/learning/beginner"`) {
		t.Fatal("served overview lacks the sibling lesson route")
	}
	if status, _ := renderGapPage(t, server, "/en/learn/courses/frontend-essentials/learning/beginner"); status != http.StatusOK {
		t.Fatalf("the linked lesson answers %d, want 200", status)
	}
}

// Gap 3 over HTTP: mermaid keeps its diagram hook, and math keeps its KaTeX hooks.
func TestRenderGap3ServedMermaidKeepsDiagramHook(t *testing.T) {
	_, body := renderGapPage(t, renderGapServer(t), gobusterQuickStart)
	if !strings.Contains(body, `class="mermaid"`) {
		t.Fatal("served mermaid fence lost its diagram hook")
	}
}

func TestRenderGap3ServedMathKeepsKatexHooks(t *testing.T) {
	status, body := renderGapPage(t, renderGapServer(t), "/en/learn/legacy/business/corporate-finance")
	if status != http.StatusOK {
		t.Fatalf("GET corporate-finance = %d, want 200", status)
	}
	if !strings.Contains(body, `class="math-display"`) {
		t.Fatal("served display math lost its KaTeX hook")
	}
}

// Gap 4 over HTTP: the served lesson lists its body headings in a table of contents with matching anchors.
func TestRenderGap4ServedLessonHasTableOfContents(t *testing.T) {
	_, body := renderGapPage(t, renderGapServer(t), gobusterQuickStart)
	if !strings.Contains(body, "data-toc") {
		t.Fatal("served lesson has no table of contents")
	}
	if !strings.Contains(body, `href="#learning-path"`) || !strings.Contains(body, `id="learning-path"`) {
		t.Fatal("table of contents does not link the body heading by its anchor")
	}
}

// Gap 5 over HTTP: the served lesson has exactly one h1, the page title.
func TestRenderGap5ServedLessonHasOneTitleHeading(t *testing.T) {
	_, body := renderGapPage(t, renderGapServer(t), gobusterQuickStart)
	if count := strings.Count(body, "<h1"); count != 1 {
		t.Fatalf("served lesson has %d h1 elements, want 1", count)
	}
}

// Gap 6 over HTTP: the served task list keeps its checkboxes.
func TestRenderGap6ServedTaskListKeepsCheckboxes(t *testing.T) {
	status, body := renderGapPage(t, renderGapServer(t), "/en/learn/legacy/information-security/tools/gobuster/beginner")
	if status != http.StatusOK {
		t.Fatalf("GET gobuster beginner = %d, want 200", status)
	}
	if !strings.Contains(body, `type="checkbox"`) {
		t.Fatal("served task list lost its checkboxes")
	}
}

// Gap 7 over HTTP: the served page keeps its raw details block.
func TestRenderGap7ServedRawDetailsSurvives(t *testing.T) {
	_, body := renderGapPage(t, renderGapServer(t), "/en/learn/legacy/business/corporate-finance")
	if !strings.Contains(body, "<details>") || !strings.Contains(body, "<summary>") {
		t.Fatal("served raw details block was dropped")
	}
}
