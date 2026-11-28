package content

import (
	"bytes"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
)

// Math nodes. The layout's KaTeX loader reads these hooks: an inline span with class math-inline, and a display
// element with class math-display, each holding the authored TeX as its text. The browser typesets them.
var (
	kindMathInline  = ast.NewNodeKind("MathInline")
	kindMathDisplay = ast.NewNodeKind("MathDisplay")
)

// mathInline is one $...$ span, or a one-line $$...$$ span rendered in display mode.
type mathInline struct {
	ast.BaseInline
	Display bool
	TeX     []byte
}

func (node *mathInline) Kind() ast.NodeKind { return kindMathInline }

func (node *mathInline) Dump(source []byte, level int) {
	ast.DumpHelper(node, source, level, map[string]string{"TeX": string(node.TeX)}, nil)
}

// mathBlock is a $$ fence: a line holding only $$, the TeX lines, and a closing line holding only $$.
type mathBlock struct {
	ast.BaseBlock
}

func (node *mathBlock) Kind() ast.NodeKind { return kindMathDisplay }

func (node *mathBlock) Dump(source []byte, level int) {
	ast.DumpHelper(node, source, level, nil, nil)
}

// mathInlineParser recognises $...$ and $$...$$ on one line. A $ opens only when a non-space follows it, and it
// closes only on a $ that follows a non-space and is not followed by a digit, so "$5 and $10" stays text.
type mathInlineParser struct{}

func (mathInlineParser) Trigger() []byte { return []byte{'$'} }

func (mathInlineParser) Parse(_ ast.Node, reader text.Reader, _ parser.Context) ast.Node {
	line, _ := reader.PeekLine()
	if len(line) < 3 || reader.PrecendingCharacter() == '\\' {
		return nil
	}
	if line[1] == '$' {
		end := bytes.Index(line[2:], []byte("$$"))
		if end <= 0 || isSpace(line[2]) || isSpace(line[2+end-1]) {
			return nil
		}
		tex := append([]byte(nil), line[2:2+end]...)
		reader.Advance(2 + end + 2)
		return &mathInline{Display: true, TeX: tex}
	}
	if isSpace(line[1]) {
		return nil
	}
	for index := 2; index < len(line); index++ {
		if line[index] != '$' || isSpace(line[index-1]) || line[index-1] == '\\' {
			continue
		}
		if index+1 < len(line) && line[index+1] >= '0' && line[index+1] <= '9' {
			continue
		}
		tex := append([]byte(nil), line[1:index]...)
		reader.Advance(index + 1)
		return &mathInline{TeX: tex}
	}
	return nil
}

func isSpace(character byte) bool {
	return character == ' ' || character == '\t'
}

// mathBlockParser opens a display block on a line that is exactly $$ and closes it on the next line that is exactly $$.
type mathBlockParser struct{}

func (mathBlockParser) Trigger() []byte { return []byte{'$'} }

func (mathBlockParser) Open(_ ast.Node, reader text.Reader, _ parser.Context) (ast.Node, parser.State) {
	line, segment := reader.PeekLine()
	if !isDelimiterLine(line) {
		return nil, parser.NoChildren
	}
	reader.Advance(segment.Len() - 1)
	return &mathBlock{}, parser.NoChildren
}

func (mathBlockParser) Continue(node ast.Node, reader text.Reader, _ parser.Context) parser.State {
	line, segment := reader.PeekLine()
	if isDelimiterLine(line) {
		reader.Advance(segment.Len() - 1)
		return parser.Close
	}
	node.Lines().Append(segment)
	reader.Advance(segment.Len() - 1)
	return parser.Continue | parser.NoChildren
}

func (mathBlockParser) Close(_ ast.Node, _ text.Reader, _ parser.Context) {}

func (mathBlockParser) CanInterruptParagraph() bool { return true }

func (mathBlockParser) CanAcceptIndentedLine() bool { return false }

func isDelimiterLine(line []byte) bool {
	return string(bytes.TrimSpace(line)) == "$$"
}

// mathRenderer writes the hook elements. The TeX is HTML-escaped, so the text the browser reads is the authored TeX.
type mathRenderer struct{}

// RegisterFuncs registers the math renderers with goldmark.
func (mathRenderer) RegisterFuncs(registerer renderer.NodeRendererFuncRegisterer) {
	registerer.Register(kindMathInline, renderMathInline)
	registerer.Register(kindMathDisplay, renderMathDisplay)
}

func renderMathInline(writer util.BufWriter, _ []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}
	inline := node.(*mathInline)
	class := "math-inline"
	if inline.Display {
		class = "math-display"
	}
	_, _ = writer.WriteString(`<span class="` + class + `">`)
	_, _ = writer.Write(util.EscapeHTML(inline.TeX))
	_, _ = writer.WriteString("</span>")
	return ast.WalkContinue, nil
}

func renderMathDisplay(writer util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}
	block := node.(*mathBlock)
	_, _ = writer.WriteString(`<div class="math-display">`)
	lines := block.Lines()
	for index := 0; index < lines.Len(); index++ {
		segment := lines.At(index)
		_, _ = writer.Write(util.EscapeHTML(segment.Value(source)))
	}
	_, _ = writer.WriteString("</div>\n")
	return ast.WalkSkipChildren, nil
}

// mathExtension installs the $ inline and $$ block parsers and their renderers.
type mathExtension struct{}

// Extend registers the math parsers and renderers on the converter.
func (mathExtension) Extend(m goldmark.Markdown) {
	m.Parser().AddOptions(
		parser.WithInlineParsers(util.Prioritized(mathInlineParser{}, 500)),
		parser.WithBlockParsers(util.Prioritized(mathBlockParser{}, 500)),
	)
	m.Renderer().AddOptions(renderer.WithNodeRenderers(util.Prioritized(mathRenderer{}, 500)))
}
