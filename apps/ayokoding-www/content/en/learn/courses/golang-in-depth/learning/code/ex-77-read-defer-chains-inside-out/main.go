// Example 77: Read Defer Chains Inside Out.
//
// Defers unwind inside-out across calls: the inner function's defers fire
// before its caller resumes. Two levels here trace the exact firing order.
package main

import "fmt" // => prints the trace: inner defers first, outer defers last

// inner registers two cleanups, then returns: both fire before outer resumes.
// => called BY outer: its defers unwind while outer is still suspended
func inner() { // => no returns: the trace is pure side effect, like Example 8
	// => registered first, fires second: the inner-outer of the inner pair
	defer fmt.Println("inner: release lock") // => fires second overall
	// => registered last, fires first: the innermost cleanup of the program
	defer fmt.Println("inner: close cursor") // => fires first overall
	// => implicit return: both defers above unwind before control returns
}

// outer registers its own cleanup, calls inner, then returns: LIFO across levels.
// => outer's defer waits: inner's whole unwind completes before it fires
func outer() { // => the caller: its defer outlives the entire inner call
	// => registered before the call, fires after inner fully unwinds: last
	defer fmt.Println("outer: close session") // => fires third and last
	// => the inner call: its two defers fire DURING this line, before return
	inner() // => inner unwinds here: cursor, then lock, then control returns
	// => outer body ends: now (and only now) the session close fires
}

func main() {
	// => one call shows all three lines in true inside-out firing order
	outer() // => trace: inner cursor, inner lock, outer session, in that order
}
