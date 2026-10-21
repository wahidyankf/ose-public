// Doc example for JoinPath: runnable manual entry, verified by go test.
// => Example naming: Example + function name links docs to code exactly
// => Output comment: the runner compares printed output byte-for-byte
package main

import "fmt" // => the example prints: Output comment asserts what follows

// ExampleJoinPath shows the two canonical shapes: nested and root-only.
// => runs as a test: stale docs fail the suite, not just confuse readers
func ExampleJoinPath() { // => no *testing.T: output IS the assertion here
	fmt.Println(JoinPath("learn", "courses", "golang-in-depth")) // => nested path first
	fmt.Println(JoinPath())                                      // => printed: "/" alone, no panic, no special case
	// Output:
	// /learn/courses/golang-in-depth
	// /
}
