// Shrink collapses whitespace runs: the fast unit case plus a slow sweep.
// => fast case: one fixed string, milliseconds, always runs everywhere
// => slow sweep: thousand-input loop, skipped under -short by the test
package main

import "strings" // => Fields splits on whitespace runs: the whole algorithm

// Shrink replaces every whitespace run with a single space, trimmed.
// => Fields drops leading, trailing, and repeated whitespace in one pass
func Shrink(s string) string { // => pure: same text in, same text out
	// => Join(Fields): split on runs, rejoin with singles: collapse complete
	return strings.Join(strings.Fields(s), " ") // => "a  b" becomes "a b"
}
