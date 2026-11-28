package content_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// A heading's table-of-contents text reads the way the heading reads: emphasis and code spans keep their words.
func TestRenderPageTOCTextKeepsEmphasisAndCodeWords(t *testing.T) {
	rendered := content.RenderPage("## Use *bold* and `code`\n\n## Plain\n", lessonContext)
	if len(rendered.TOC) != 2 {
		t.Fatalf("TOC = %+v, want two entries", rendered.TOC)
	}
	if got := rendered.TOC[0].Text; got != "Use bold and code" {
		t.Fatalf("TOC text = %q, want %q", got, "Use bold and code")
	}
	if got := rendered.TOC[1].Text; got != "Plain" {
		t.Fatalf("TOC text = %q, want %q", got, "Plain")
	}
}
