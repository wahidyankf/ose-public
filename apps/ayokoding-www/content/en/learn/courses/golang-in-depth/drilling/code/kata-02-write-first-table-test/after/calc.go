// Double returns twice its input: the function the new test pins down.
// => pure function: same input always gives the same double, no state anywhere
// => table-tested in calc_test.go: zero, positive, and negative rows below
package after

// Double returns twice its input for any integer, negative included.
// => exported: the test file (same package) calls it directly by name
func Double(n int) int { // => int in, int out: exact, no floats near math
	return n * 2 // => the logic the table test locks in place, line by line
}
