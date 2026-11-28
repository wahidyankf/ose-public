package content

import (
	"regexp"
	"strings"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

// RenderContext names the page a body renders for: its locale and its
// locale-relative content slug, the on-disk path without the .md extension.
type RenderContext struct {
	Locale string
	Slug   string
}

// RenderedBody is the sanitized body HTML of one page and its table of contents.
type RenderedBody struct {
	HTML string
	TOC  []Heading
}

// RenderPage runs the real page pipeline over one Markdown body: the Hugo shortcodes become component markup
// first, then the GFM Markdown is converted and sanitized. The loader and the served lesson both use it.
func RenderPage(source string, context RenderContext) RenderedBody {
	links := &LinkContext{Locale: context.Locale, Slug: context.Slug}
	var toc []Heading
	converter := newConverter(
		util.Prioritized(linkRewriter{context: links}, 100),
		util.Prioritized(outlineBuilder{toc: &toc}, 200),
	)
	var output strings.Builder
	if err := converter.Convert([]byte(TransformShortcodes(source)), &output); err != nil {
		return RenderedBody{}
	}
	return RenderedBody{HTML: pagePolicy().Sanitize(output.String()), TOC: toc}
}

// outlineBuilder normalizes the body's heading levels, gives each h2 to h4 heading the stable id that ExtractTOC
// derives, and records the table of contents. The ids the page carries are the ids its table of contents links to.
type outlineBuilder struct {
	toc *[]Heading
}

// Transform rewrites the heading levels and ids of the document and stores its table of contents.
func (builder outlineBuilder) Transform(document *ast.Document, reader text.Reader, _ parser.Context) {
	source := reader.Source()
	var headings []*ast.Heading
	_ = ast.Walk(document, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if heading, ok := node.(*ast.Heading); ok && entering {
			headings = append(headings, heading)
		}
		return ast.WalkContinue, nil
	})
	levels := make([]int, len(headings))
	texts := make([]string, len(headings))
	for index, heading := range headings {
		levels[index] = heading.Level
		texts[index] = headingText(heading, source)
	}
	shifted := NormalizeHeadingLevels(levels)
	for index, heading := range headings {
		heading.Level = shifted[index]
	}
	entries := ExtractTOC(shifted, texts)
	next := 0
	for index, heading := range headings {
		if shifted[index] < 2 || shifted[index] > 4 || SlugifyHeading(texts[index]) == "" {
			continue
		}
		heading.SetAttributeString("id", entries[next].ID)
		next++
	}
	*builder.toc = entries
}

// headingText is the plain text of a heading: the text segments of its inline children, in order. Emphasis and code
// spans contribute their text, so the table of contents reads the way the heading reads.
func headingText(heading *ast.Heading, source []byte) string {
	var builder strings.Builder
	_ = ast.Walk(heading, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if text, ok := node.(*ast.Text); ok && entering {
			builder.Write(text.Segment.Value(source))
		}
		return ast.WalkContinue, nil
	})
	return builder.String()
}

// newConverter builds the GFM converter with the fenced-code and raw-block renderers, plus any AST transformers.
func newConverter(transformers ...util.PrioritizedValue) goldmark.Markdown {
	return goldmark.New(
		goldmark.WithExtensions(extension.GFM, codeBlockExtension{}, rawHTMLExtension{}, mathExtension{}),
		goldmark.WithParserOptions(parser.WithASTTransformers(transformers...)),
	)
}

// linkRewriter resolves every relative Markdown link in the body to its served route before rendering.
type linkRewriter struct {
	context *LinkContext
}

// Transform rewrites each link destination with ResolveContentHref, leaving absolute and asset links unchanged.
func (rewriter linkRewriter) Transform(document *ast.Document, _ text.Reader, _ parser.Context) {
	_ = ast.Walk(document, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if link, ok := node.(*ast.Link); ok && entering {
			link.Destination = []byte(ResolveContentHref(string(link.Destination), rewriter.context))
		}
		return ast.WalkContinue, nil
	})
}

// pagePolicy is the fenced-code policy plus the shortcode component markers that TransformShortcodes emits.
// Each value is constrained so authored Markdown cannot inject markup.
func pagePolicy() *bluemonday.Policy {
	policy := codeBlockPolicy()
	empty := regexp.MustCompile(`^$`)
	policy.AllowAttrs("data-callout").Matching(regexp.MustCompile(`^(warning|info|tip)$`)).OnElements("div")
	policy.AllowAttrs("data-tabs").Matching(regexp.MustCompile(`^[^<>"']{1,200}$`)).OnElements("div")
	policy.AllowAttrs("data-tab", "data-steps").Matching(empty).OnElements("div")
	policy.AllowAttrs("class").Matching(regexp.MustCompile(`^(mermaid|math-display)$`)).OnElements("div")
	policy.AllowAttrs("class").Matching(regexp.MustCompile(`^(math-inline|math-display)$`)).OnElements("span")
	// A task-list checkbox is the only input the pipeline produces: goldmark's task extension writes it inside a list
	// item, and raw HTML blocks reach the sanitiser only when they open with a shortcode or details marker.
	policy.AllowAttrs("type").Matching(regexp.MustCompile(`^checkbox$`)).OnElements("input")
	policy.AllowAttrs("checked", "disabled").Matching(empty).OnElements("input")
	return policy
}
