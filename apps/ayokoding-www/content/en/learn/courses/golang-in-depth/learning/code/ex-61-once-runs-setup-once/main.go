// Example 61: Once Runs Setup Exactly Once.
//
// sync.Once guarantees one execution however many goroutines ask. Ten callers
// race here; the counter proves setup ran exactly once, deterministically.
package main

import (
	"fmt"  // => prints the setup count: 1 on every schedule, every machine
	"sync" // => Once plus WaitGroup: single execution, awaited crew
)

// Registry holds the once-guard plus the proof counter it protects.
// => struct pairs guard and state: inseparable, like the Counter in Example 58
type Registry struct { // => lazy singleton holder: setup deferred to first use
	once  sync.Once // => zero ready: no constructor, fires exactly once ever
	loads int       // => proof counter: incremented inside the once closure
}

// Load runs the expensive setup exactly once, however often it is called.
// => pointer receiver: every caller shares the ONE Once guard, never a copy
// => never copy a Once: copies reset the fired flag and run setup twice
func (r *Registry) Load() { // => idempotent by construction: call freely
	// => Do runs f once: concurrent callers block until the first finishes
	r.once.Do(func() { // => the closure runs exactly once, ever, for this Once
		r.loads++ // => proof: increments only inside the once-fired closure
	})
}

func main() {
	// => one registry, ten racers: every goroutine calls Load concurrently
	var r Registry // => zero value: unfired Once, zero loads, ready now
	// => WaitGroup awaits the ten racers: same pattern as Examples 57 and 58
	var wg sync.WaitGroup // => counts racers: ten Dones before the verdict
	// => ten goroutines: Add before each go, Done deferred inside each body
	for i := 0; i < 10; i++ { // => ten callers: the race Once was built for
		wg.Add(1)   // => count before launch: accounting rule, unchanged
		go func() { // => each racer calls Load: nine will wait, one will run
			defer wg.Done() // => release the counter on return, always
			r.Load()        // => nine block, one executes: Once decides
		}()
	}
	// => Wait proves all ten called: the counter below is final, not partial
	wg.Wait() // => ten Dones: every racer has passed through Load
	// => exactly one: the deterministic verdict, schedule-independent by design
	fmt.Println("setups:", r.loads) // => Output: setups: 1
}
