package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// Math parsing boundaries: the opener and closer rules, escaped and unclosed delimiters, and block forms.
func TestRenderPageMathInlineDoubleDollarIsDisplayMode(t *testing.T) {
	body := content.RenderPage("Use $$a+b$$ inline.\n", lessonContext).HTML
	if !strings.Contains(body, `<span class="math-display">a+b</span>`) {
		t.Fatalf("one-line double dollar math is not display mode: %q", body)
	}
}

func TestRenderPageMathOpenerNeedsANonSpaceCharacter(t *testing.T) {
	for _, source := range []string{"A $ x$ text.\n", "B $$ x$$ text.\n", "C $\tx$ text.\n"} {
		if body := content.RenderPage(source, lessonContext).HTML; strings.Contains(body, "math-") {
			t.Fatalf("math opened on a space for %q: %q", source, body)
		}
	}
}

func TestRenderPageMathUnclosedOrEscapedDollarStaysText(t *testing.T) {
	for _, source := range []string{"Price $5 only.\n", "Cost \\$5 and \\$6.\n", "Empty $$ pair.\n"} {
		if body := content.RenderPage(source, lessonContext).HTML; strings.Contains(body, "math-") {
			t.Fatalf("delimiter read as math for %q: %q", source, body)
		}
	}
}

func TestRenderPageMathBlockInterruptsAParagraph(t *testing.T) {
	body := content.RenderPage("Lead line\n$$\nq = 1\n$$\n", lessonContext).HTML
	if !strings.Contains(body, `<div class="math-display">`) || !strings.Contains(body, "q = 1") {
		t.Fatalf("display block did not interrupt the paragraph: %q", body)
	}
}

func TestRenderPageMathBlockRunsToTheEndWhenUnclosed(t *testing.T) {
	body := content.RenderPage("$$\nopen = true\n", lessonContext).HTML
	if !strings.Contains(body, `<div class="math-display">open = true`) {
		t.Fatalf("unclosed display block lost its TeX: %q", body)
	}
}

func TestRenderPageInlineMathStartsALine(t *testing.T) {
	body := content.RenderPage("$x^2$ starts the line.\n", lessonContext).HTML
	if !strings.Contains(body, `<span class="math-inline">x^2</span> starts the line.`) {
		t.Fatalf("inline math at a line start was not rendered: %q", body)
	}
}

func TestRenderPageIndentedDelimiterIsCodeNotMath(t *testing.T) {
	body := content.RenderPage("Para.\n\n    $$\n    x\n    $$\n", lessonContext).HTML
	if strings.Contains(body, "math-display") {
		t.Fatalf("an indented delimiter must stay code, not math: %q", body)
	}
}
