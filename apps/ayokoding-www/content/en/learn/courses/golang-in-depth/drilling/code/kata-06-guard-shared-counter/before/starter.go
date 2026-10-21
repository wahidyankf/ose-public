// Starter: unguarded shared counter. The race: += is not atomic.
// => twenty goroutines share total with no mutex: increments interleave freely
// => rewrite: bundle a Mutex with the total, following Example 58's Counter
package main

import (
	"fmt"  // => prints the racy total: usually short of 2000, never reliably
	"sync" // => WaitGroup awaits the crew: the race itself is in the += below
)

// The race needs no special runner: main below races whenever it executes.
func main() {
	// => shared total: every goroutine writes this one variable, unguarded
	total := 0 // => the race site: += below is read-modify-write, not atomic
	// => twenty adders, one hundred each: exact answer would be 2000
	var wg sync.WaitGroup     // => awaits the crew: the count is exact, the sum not
	for i := 0; i < 20; i++ { // => twenty goroutines: the race needs company
		wg.Add(1)   // => count before launch: accounting correct, math racy
		go func() { // => each adder loops one hundred unguarded increments
			defer wg.Done()            // => release on return: the only disciplined line
			for j := 0; j < 100; j++ { // => one hundred read-modify-writes
				total++ // => RACE: lost updates when increments interleave
			}
		}()
	}
	// => Wait proves completion: the total below is final, just usually wrong
	wg.Wait()                         // => all done: the number is complete AND unreliable together
	fmt.Println("racy total:", total) // => often < 2000: the race made visible
}
