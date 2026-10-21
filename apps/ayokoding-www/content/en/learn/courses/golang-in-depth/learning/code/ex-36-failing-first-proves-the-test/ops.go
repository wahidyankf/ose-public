// Slug lowercases a title and swaps spaces for dashes: the fixed code.
// => the RED state would return the title untouched: this test catches that
// => two transformations in order: case first, separators second, always
package main

import "strings" // => ToLower and ReplaceAll: stdlib only, no dependency

// Slug converts a title to a URL-safe slug: lowercase, dashes for spaces.
// => exported: tests call it directly; the shape is the whole contract
func Slug(title string) string { // => string in, string out: trivially testable
	// => lowercase FIRST: separators added later must already be lowercase
	lower := strings.ToLower(title) // => "Hello World" becomes "hello world"
	// => spaces become dashes: the URL-safe separator, applied second
	return strings.ReplaceAll(lower, " ", "-") // => "hello-world": done
}
