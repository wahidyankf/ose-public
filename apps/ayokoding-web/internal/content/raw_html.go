package content

import (
	"regexp"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/util"
)

// allowedRawBlock names the raw HTML blocks the page pipeline passes to the sanitiser: the shortcode component
// markers that TransformShortcodes writes and their closing div, and the details and summary disclosure elements.
// Every other raw HTML block stays omitted.
var allowedRawBlock = regexp.MustCompile(`(?i)^\s*(<div\s+data-(callout|tabs|tab|steps)[\s=>]|</div>\s*$|<details[\s>]|</details>\s*$|<summary[\s>]|</summary>\s*$)`)

// rawHTMLBlockRenderer replaces goldmark's default raw-HTML handling, which omits every raw block. It writes an
// allowed block through unchanged, so the sanitiser decides what survives, and omits every other block as before.
type rawHTMLBlockRenderer struct{}

// RegisterFuncs registers the raw HTML block renderer with goldmark.
func (rawHTMLBlockRenderer) RegisterFuncs(registerer renderer.NodeRendererFuncRegisterer) {
	registerer.Register(ast.KindHTMLBlock, renderRawHTMLBlock)
}

func renderRawHTMLBlock(writer util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}
	lines := node.(*ast.HTMLBlock).Lines()
	first := lines.At(0)
	if !allowedRawBlock.Match(first.Value(source)) {
		_, _ = writer.WriteString("<!-- raw HTML omitted -->\n")
		return ast.WalkSkipChildren, nil
	}
	for index := 0; index < lines.Len(); index++ {
		segment := lines.At(index)
		_, _ = writer.Write(segment.Value(source))
	}
	return ast.WalkSkipChildren, nil
}

// rawHTMLExtension installs rawHTMLBlockRenderer on the Markdown converter.
type rawHTMLExtension struct{}

// Extend registers the raw HTML block renderer ahead of goldmark's default one, which has priority 1000.
func (rawHTMLExtension) Extend(m goldmark.Markdown) {
	m.Renderer().AddOptions(renderer.WithNodeRenderers(util.Prioritized(rawHTMLBlockRenderer{}, 1)))
}
