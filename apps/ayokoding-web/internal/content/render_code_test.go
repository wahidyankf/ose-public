package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// renderedBody renders Markdown the way the real page pipeline does: GFM, then the sanitizer.
func renderedBody(source string) string {
	return content.SanitizeHTML(content.RenderMarkdown(source))
}

func TestFencedCodeShowsLanguageLabelAndPreLanguage(t *testing.T) {
	body := renderedBody("```go\npackage main\n```\n")
	for _, want := range []string{`data-language="go"`, `data-code-language-label`, "go</div>", "<pre"} {
		if !strings.Contains(body, want) {
			t.Fatalf("fenced go block lacks %q in %q", want, body)
		}
	}
}

func TestFencedCodeCarriesCopyControlWithLabels(t *testing.T) {
	body := renderedBody("```go\npackage main\n```\n")
	for _, want := range []string{
		`data-copy="true"`,
		`data-copy-label="Copy"`,
		`data-copied-label="Copied"`,
		`data-failed-label="Copy failed"`,
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("copy control lacks %q in %q", want, body)
		}
	}
}

func TestFencedCodeKeepsVerbatimSourceInsidePre(t *testing.T) {
	body := renderedBody("```go\npackage main // source\n\nfunc main() {}\n```\n")
	if !strings.Contains(body, "<pre") || !strings.Contains(body, "package main // source\n\nfunc main() {}") {
		t.Fatalf("code block lost its verbatim source and blank line: %q", body)
	}
}

func TestFencedCodeWithoutLanguageStillGetsCopyControl(t *testing.T) {
	body := renderedBody("```\nplain text\n```\n")
	if !strings.Contains(body, `data-copy="true"`) {
		t.Fatalf("plain fence lacks a copy control: %q", body)
	}
}

func TestMermaidFenceIsNotWrappedAsCode(t *testing.T) {
	body := renderedBody("```mermaid\ngraph TD; A-->B\n```\n")
	if strings.Contains(body, `data-copy="true"`) {
		t.Fatalf("mermaid source must keep its diagram path, not a copy control: %q", body)
	}
}

func TestInlineCodeGetsNoCopyControl(t *testing.T) {
	body := renderedBody("Use `go test` here.\n")
	if strings.Contains(body, `data-copy="true"`) {
		t.Fatalf("inline code must not get a copy control: %q", body)
	}
}
