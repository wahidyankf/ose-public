// Starter: validation by panic. The bug: user input triggers a crash path.
// => panics on empty input: callers cannot recover without a boundary
// => rewrite: return (string, error) instead, following Example 16's rule
package main

import "fmt" // => prints the "validated" name: panics first on empty input

// mustName crashes on empty names: the panic-as-validation anti-pattern.
// => BUG: user input reaches panic: this is a crash path, not a contract
func mustName(name string) string { // => no error return: panic is the failure
	// => empty input panics: the exact shape Example 16 forbids in libraries
	if name == "" { // => user-controlled input: panic is never the answer
		panic("name is empty") // => BUG: crashes the caller without recourse
	}
	return "halo, " + name // => valid input: the only path that survives
}

func main() {
	// => valid input works: the bug hides until the empty string arrives
	fmt.Println(mustName("Sari")) // => prints, then the next call explodes
	fmt.Println(mustName(""))     // => BUG: panic, crash, no error to check
}
