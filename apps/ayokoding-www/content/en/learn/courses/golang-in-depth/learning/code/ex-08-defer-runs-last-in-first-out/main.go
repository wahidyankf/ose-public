// Example 8: Defer Runs Last In, First Out.
//
// Deferred calls run when the function returns, in reverse registration
// order. Cleanup therefore reads like a stack unwind: last opened first.
package main

import "fmt" // => traces registration order against execution order

// trace registers three cleanups, then returns so they fire in LIFO order.
// => defers run after the return value is set but before control leaves
// => arguments evaluate NOW: each Println below captures its label eagerly
func trace() { // => no return values: the trace is pure side effect
	// => registered first, runs last: the outermost resource would go here
	defer fmt.Println("close database") // => fires third: opened first
	// => registered second: a middle layer like a transaction boundary
	defer fmt.Println("commit work") // => fires second: middle of the stack
	// => registered last, runs first: the innermost cleanup goes here
	defer fmt.Println("close file") // => fires first: opened last
	// => body ends: return is implicit, then the three defers unwind
	fmt.Println("body done") // => Output first: defers wait for the return
}

func main() {
	// => one call shows all four lines in their true execution order
	trace() // => body line first, then the three defers in reverse
}
