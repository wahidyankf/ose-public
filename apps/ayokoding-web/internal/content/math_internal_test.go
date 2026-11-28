package content

import "testing"

// The math nodes implement goldmark's Dump for debugging; each prints its own source, and must not panic on nil source.
func TestMathNodesDumpWithoutSource(t *testing.T) {
	(&mathInline{TeX: []byte("x")}).Dump(nil, 0)
	(&mathBlock{}).Dump(nil, 0)
}
