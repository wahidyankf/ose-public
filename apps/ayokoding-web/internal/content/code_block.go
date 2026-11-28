package content

import (
	"regexp"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/util"
)

// codeBlockRenderer renders a fenced block the way the ayokoding-www page does:
// a wrapper carrying a language label, a pre with data-language, and a copy
// control whose clipboard text is the verbatim source. Mermaid keeps goldmark's
// plain code element, because the diagram path reads that element.
type codeBlockRenderer struct{}

// RegisterFuncs registers the fenced-code renderer with goldmark.
func (codeBlockRenderer) RegisterFuncs(registerer renderer.NodeRendererFuncRegisterer) {
	registerer.Register(ast.KindFencedCodeBlock, renderFencedCode)
}

func renderFencedCode(writer util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}
	block := node.(*ast.FencedCodeBlock)
	language := string(util.EscapeHTML(block.Language(source)))
	if language == "mermaid" {
		_, _ = writer.WriteString(`<pre><code class="language-mermaid">`)
		writeCodeLines(writer, source, block)
		_, _ = writer.WriteString("</code></pre>\n")
		return ast.WalkContinue, nil
	}
	_, _ = writer.WriteString("<div data-code-block>\n")
	if language != "" {
		_, _ = writer.WriteString("<div data-code-language-label>" + language + "</div>\n")
		_, _ = writer.WriteString(`<pre data-language="` + language + `"><code class="language-` + language + `">`)
	} else {
		_, _ = writer.WriteString("<pre><code>")
	}
	writeCodeLines(writer, source, block)
	_, _ = writer.WriteString("</code></pre>\n")
	_, _ = writer.WriteString(`<button type="button" data-copy="true" data-copy-label="Copy" data-copied-label="Copied" data-failed-label="Copy failed">Copy</button>` + "\n")
	_, _ = writer.WriteString("</div>\n")
	return ast.WalkContinue, nil
}

// writeCodeLines writes the block's source lines, HTML-escaped and byte-for-byte.
func writeCodeLines(writer util.BufWriter, source []byte, block *ast.FencedCodeBlock) {
	lines := block.Lines()
	for index := 0; index < lines.Len(); index++ {
		segment := lines.At(index)
		_, _ = writer.Write(util.EscapeHTML(segment.Value(source)))
	}
}

// codeBlockPolicy is the UGC policy plus the attributes codeBlockRenderer emits.
// Each added value is constrained so authored Markdown cannot inject markup.
func codeBlockPolicy() *bluemonday.Policy {
	policy := bluemonday.UGCPolicy()
	empty := regexp.MustCompile(`^$`)
	label := regexp.MustCompile(`^[A-Za-z ]{1,40}$`)
	language := regexp.MustCompile(`^[A-Za-z0-9_+.#-]{1,40}$`)
	policy.AllowAttrs("data-code-block").Matching(empty).OnElements("div")
	policy.AllowAttrs("data-code-language-label").Matching(empty).OnElements("div")
	policy.AllowAttrs("data-language").Matching(language).OnElements("pre")
	policy.AllowAttrs("type").Matching(regexp.MustCompile(`^button$`)).OnElements("button")
	policy.AllowAttrs("data-copy").Matching(regexp.MustCompile(`^true$`)).OnElements("button")
	policy.AllowAttrs("data-copy-label", "data-copied-label", "data-failed-label").Matching(label).OnElements("button")
	policy.AllowElements("button")
	return policy
}
