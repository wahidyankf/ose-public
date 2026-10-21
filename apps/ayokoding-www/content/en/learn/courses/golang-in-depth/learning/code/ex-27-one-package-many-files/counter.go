// Counter holds the shared state for this package's two files.
// => same package clause in both files: one package, two source files
// => lowercase type and field: visible package-wide, hidden outside it
package main

// counter is the package-level state both files below operate on.
// => lowercase: shared inside the package, invisible to importers
// => package state is a choice: small tools use it, libraries avoid it
type counter struct { // => unexported struct: construction stays local
	n int // => the tally both files read and write directly
}

// add grows the tally by one step and reports the new total.
// => lowercase: callable from main.go next door, hidden from importers
func (c *counter) add() int { // => pointer receiver: mutation sticks
	c.n++      // => one step: the only mutation this type allows
	return c.n // => new total: callers never touch the field directly
}
