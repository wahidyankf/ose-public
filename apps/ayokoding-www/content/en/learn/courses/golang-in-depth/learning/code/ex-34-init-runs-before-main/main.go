// Example 34: Init Runs Before Main.
//
// Both init functions in setup.go run before main starts, in file order. main
// only READS the registry: the ordering proof is in the printed markers.
package main

import "fmt" // => prints the registry main inherited from the init phase

func main() {
	// => registry is already full: both inits ran before this first line
	fmt.Println(setupNote()) // => Output: seed+load
	// => two markers, strict order: file order is the guarantee being shown
	fmt.Println("steps:", len(registry)) // => Output: steps: 2
}
