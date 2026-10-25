// Example 1: Hello with an Early Return.
//
// Go checks the failure first and returns it, so the happy path stays
// at the left margin instead of nesting inside an if block.
package main

import (
	"errors" // => builds the failure value this example returns early
	"fmt"    // => prints the greeting on the happy path only
)

// greet refuses an empty name before it ever prints anything.
// => the signature returns only an error: nothing else to report
// => callers handle the failure where the call happens, not far away
func greet(name string) error { // => error return is data, not an exception
	// => guard clause first: the failure case is decided up front
	if name == "" { // => the one input this function cannot serve
		// => construct the failure value and leave immediately
		return errors.New("name is empty") // => errors.New makes a simple sentinel
	}
	// => past the guard, the name is safe to use without further checks
	fmt.Println("hello,", name) // => happy path stays flat at the margin
	return nil                  // => nil error means success in Go
}

func main() {
	// => call and check in one statement: the idiomatic if-err pattern
	if err := greet(""); err != nil { // => empty name trips the guard clause
		fmt.Println("error:", err) // => print the failure the guard returned
	}
	// => same call shape, valid input: success prints inside greet
	if err := greet("Sari"); err != nil { // => nil error skips this branch
		// => unreachable: a nil error never enters the failure branch
		fmt.Println("error:", err) // => kept so the check shape stays uniform
	}
}
