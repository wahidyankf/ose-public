// Solution: Mutex-guarded counter. Twenty goroutines, exact total.
// => Counter bundles total with its mutex: the guard cannot be separated
// => twenty adders, one hundred each: 2000 on every schedule, proven below
package main

import (
	"fmt"  // => prints the exact guarded total: 2000, every single run
	"sync" // => Mutex guards, WaitGroup awaits: the Example 58 pairing
)

// Counter pairs the shared total with the mutex guarding it, inseparably.
// => struct bundles state and guard: unguarded access becomes a shape error
type Counter struct { // => guarded state: only Add and Value may touch total
	mu    sync.Mutex // => zero ready: unlocked, no constructor needed
	total int        // => guarded: between Lock and Unlock, never elsewhere
}

// Add grows the total under the lock: the critical section is one line.
// => pointer receiver: every caller shares the ONE mutex, never a copy
func (c *Counter) Add(n int) { // => the single sanctioned mutation path
	c.mu.Lock()   // => enter: exclusive access starts here
	c.total += n  // => critical section: one statement, nothing more
	c.mu.Unlock() // => leave: waiting adders proceed one by one
}

// Value reads the total under the lock: readers synchronize with writers.
func (c *Counter) Value() int { // => locked snapshot: never a torn read
	c.mu.Lock()         // => readers lock too: exclusion covers both sides
	defer c.mu.Unlock() // => deferred: the read below cannot leak the lock
	return c.total      // => copy out under lock: safe after unlock
}

func main() {
	// => one counter, twenty adders, one hundred each: exact total 2000
	var c Counter // => zero value: unlocked mutex, zero total, ready now
	// => WaitGroup awaits the crew: same accounting as the starter, honest math
	var wg sync.WaitGroup     // => counts twenty adders: twenty Dones expected
	for i := 0; i < 20; i++ { // => twenty goroutines: the race's old company
		wg.Add(1)   // => count before launch: accounting rule, unchanged
		go func() { // => each adder loops one hundred GUARDED increments
			defer wg.Done()            // => release on return: discipline kept from starter
			for j := 0; j < 100; j++ { // => one hundred serialized additions
				c.Add(1) // => guarded: serialized with the other nineteen
			}
		}()
	}
	// => Wait proves every adder finished: the total below is final AND exact
	wg.Wait()                                // => twenty Dones: nobody still holds the mutex
	fmt.Println("guarded total:", c.Value()) // => Output: guarded total: 2000
}
