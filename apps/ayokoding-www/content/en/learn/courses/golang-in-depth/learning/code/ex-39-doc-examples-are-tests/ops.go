// JoinPath joins path segments with slashes: the documented function.
// => pure string work: examples below pin its exact rendering forever
// => documented BY an Example test: the manual entry cannot rot silently
package main

import "strings" // => Join renders the segments with one separator

// JoinPath renders segments as a slash-separated path with a leading slash.
// => starts with the name: godoc links it, readers find it, vet approves
func JoinPath(segments ...string) string { // => variadic: any segment count
	// => Join handles zero segments too: "" becomes "/" alone, no special case
	return "/" + strings.Join(segments, "/") // => leading slash, always
}
