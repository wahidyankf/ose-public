// Example 27: One Package, Many Files.
//
// A package is a directory, not a file: both files here share one package
// clause, so main.go uses the counter type declared in counter.go directly.
package main

import "fmt" // => prints the running totals the shared type produces

func main() {
	// => counter is declared in counter.go: same package, no import needed
	var c counter // => zero value works: tally starts at 0, no setup call
	// => add lives in counter.go too: the method call crosses no boundary
	fmt.Println(c.add()) // => Output: 1
	// => second call keeps counting: state lives in c, shared across files
	fmt.Println(c.add()) // => Output: 2
	// => direct field access compiles here: unexported means package-wide
	fmt.Println("raw:", c.n) // => Output: raw: 2
}
