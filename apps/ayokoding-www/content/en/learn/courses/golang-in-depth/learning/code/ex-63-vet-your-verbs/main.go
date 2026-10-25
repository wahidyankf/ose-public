// Example 63: Vet Your Verbs Before You Ship.
//
// go vet flags mismatched printf verbs that compile yet print lies. The run
// command of this unit vets FIRST: `go vet . && go build`. Vet-clean code below.
package main

import "fmt" // => prints the receipt line with verbs vet has approved

func main() {
	// => %q for the string, %d for the int: verbs match their values exactly
	// => vet's printf check proves it: this line passes `go vet .` silently
	fmt.Printf("receipt %q: %d cents\n", "oat-1", 1500) // => Output: receipt "oat-1": 1500 cents
	// => Sprintf variant: same matched verbs, result built instead of printed
	line := fmt.Sprintf("%s x%d", "rice", 2) // => %s string, %d int: matched
	fmt.Println(line)                        // => Output: rice x2
}
