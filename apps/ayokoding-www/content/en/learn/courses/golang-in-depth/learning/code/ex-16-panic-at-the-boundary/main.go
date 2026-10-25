// Example 16: Panic Stays at the Boundary.
//
// Panic is for programmer errors, and recover belongs at the boundary that
// converts it back into an ordinary error. Libraries return errors instead.
package main

import "fmt" // => prints the recovered boundary message, then the normal path

// mustPositive panics on bad input the way a must-style helper would.
// => panic signals a PROGRAMMER bug: the caller broke the documented contract
// => never panic for user input or I/O: those are ordinary error returns
func mustPositive(n int) int { // => no error return: panic is the failure mode
	// => violated precondition: the caller promised a positive number
	if n <= 0 { // => contract breach, not a runtime surprise: panic fits
		panic("mustPositive: n must be positive") // => unwinds to the boundary
	}
	return n // => contract holds: the value passes straight through
}

// runBoundary is the recover boundary: deferred recover converts panic to error.
// => named return err: the deferred function assigns it during the unwind
// => only the boundary recovers: inner code stays panic-free and simple
func runBoundary(n int) (err error) { // => named err: recover assigns it
	// => deferred closure runs during panic unwind, before runBoundary exits
	defer func() { // => anonymous func: recover only works directly inside defer
		// => recover stops the unwind and reports what the panic carried
		if r := recover(); r != nil { // => nil means no panic: leave err alone
			// => convert: the panic value becomes an ordinary error return
			err = fmt.Errorf("recovered: %v", r) // => boundary translates panic
		}
	}()
	// => the risky call: panics here jump straight to the deferred closure
	mustPositive(n) // => n <= 0 panics; positive returns normally
	return nil      // => no panic: success flows through untouched
}

func main() {
	// => contract breach: panic unwinds, the boundary converts it to error
	if err := runBoundary(0); err != nil { // => recovered, not crashed
		fmt.Println(err) // => Output: recovered: mustPositive: n must be positive
	}
	// => contract holds: no panic, nil error, nothing recovered
	if err := runBoundary(5); err != nil { // => nil skips this branch
		fmt.Println("unexpected:", err) // => unreachable: 5 is positive
	} else {
		fmt.Println("ok") // => Output: ok
	}
}
