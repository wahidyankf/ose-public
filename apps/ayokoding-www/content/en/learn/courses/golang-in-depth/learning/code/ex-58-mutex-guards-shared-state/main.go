// Example 58: Mutex Guards Shared State.
//
// A Mutex serializes access to shared state: fifty concurrent adders produce
// exactly one correct total. The critical section holds only the addition.
package main

import (
	"fmt"  // => prints the exact total the mutex protected
	"sync" // => Mutex plus WaitGroup: guard the state, await the crew
)

// Counter pairs the shared total with the mutex that guards it.
// => struct bundles state and guard: they can never be separated by accident
// => never copy a Counter: methods take pointers so the mutex stays single
type Counter struct { // => guarded state: the only legal access is below
	mu    sync.Mutex // => zero value ready: unlocked, no setup needed
	total int        // => guarded: touched only between Lock and Unlock
}

// Add grows the total under the lock: the critical section is one statement.
// => pointer receiver: every caller shares the ONE mutex, never a copy
func (c *Counter) Add(n int) { // => the single sanctioned mutation path
	c.mu.Lock()   // => enter: exclusive access starts here
	c.total += n  // => critical section: one statement, nothing more
	c.mu.Unlock() // => leave: waiting adders proceed one by one
}

// Value reads the total under the lock: readers synchronize with writers.
// => locked read: an unlocked read would race the writers above, exactly
func (c *Counter) Value() int { // => consistent snapshot, never a torn read
	c.mu.Lock()         // => readers lock too: exclusion covers both directions
	defer c.mu.Unlock() // => deferred: the read below cannot leak the lock
	return c.total      // => copy out under the lock: safe after unlock
}

func main() {
	// => one counter, fifty adders, two hundred each: exact total 10000
	var c Counter // => zero value: unlocked mutex, zero total, ready now
	// => WaitGroup reuses Example 57's pattern: await the whole crew first
	var wg sync.WaitGroup // => counts the fifty adders below, nothing else
	// => fifty goroutines: Add(1) before each go, Done deferred in each body
	for i := 0; i < 50; i++ { // => fifty iterations: fifty concurrent adders
		wg.Add(1)   // => count before launch: the accounting rule, always
		go func() { // => closure per adder: no arguments, shared counter
			defer wg.Done() // => release the counter whatever happens inside
			c.Add(200)      // => guarded add: serialized with the other 49
		}()
	}
	// => Wait proves every adder finished: the total below is final, not partial
	wg.Wait() // => all Dones landed: no adder still holds the mutex
	// => locked read: the exact total, reproducible on every schedule
	fmt.Println("total:", c.Value()) // => Output: total: 10000
}
