// Solution: validation by error return. Panic is gone from the path.
// => (string, error): user input failures travel as values, checkable locally
// => empty input returns an error: callers decide, exactly like Example 9
package main

import (
	"errors" // => the empty-name failure, built once and returned
	"fmt"    // => prints the greeting or the checked failure, never crashes
)

// greetName validates and greets: empty names return an error, never panic.
// => error return: the caller checks at the site, no boundary needed
func greetName(name string) (string, error) { // => (value, error): the contract
	// => guard clause first: failure returns before any greeting builds
	if name == "" { // => user input: refused as data, not as a crash
		return "", errors.New("name is empty") // => value plus failure, honest
	}
	return "halo, " + name, nil // => valid: greeting plus nil, success shape
}

func main() {
	// => valid input: greeting prints, error stays nil and unchecked-branch skips
	if g, err := greetName("Sari"); err != nil { // => nil skips this branch
		fmt.Println("unexpected:", err) // => unreachable: Sari is valid
	} else {
		fmt.Println(g) // => Output: halo, Sari
	}
	// => empty input: error returns, caller prints it, program survives
	if g, err := greetName(""); err != nil { // => non-nil: the refused path
		fmt.Println("error:", err) // => Output: error: name is empty
	} else {
		fmt.Println(g) // => unreachable: empty never greets
	}
}
