package glue

import "embed"

// vectorFiles holds the checked-in test vectors the figure steps compare
// against. They are compiled in, so no unit step reads the disk for them.
//
//go:embed vectors/benchmark-vectors.json vectors/calculator-vectors.json
var vectorFiles embed.FS

// Vector returns one checked-in test-vector file by name.
func Vector(name string) ([]byte, error) {
	return vectorFiles.ReadFile("vectors/" + name)
}
