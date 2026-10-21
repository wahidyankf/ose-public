// Example 57: WaitGroup Waits for the Whole Crew.
//
// A WaitGroup counts launched workers and blocks until the last Done call, so
// main collects only when every answer exists. Sorting keeps it deterministic.
package main

import (
	"fmt"  // => prints the sorted cubes after the whole crew finishes
	"sort" // => order the answers: finish order is schedule-dependent
	"sync" // => WaitGroup: the counter that blocks until every Done lands
)

// cube sends n*n*n, then marks its own work done no matter what follows.
// => defer Done FIRST: even a panic in the worker still releases the counter
// => value travels by channel: no shared slice, no mutex, no race to audit
func cube(n int, out chan<- int, wg *sync.WaitGroup) { // => worker plus group
	// => Done on return: deferred first, so it runs even if sending panicked
	defer wg.Done() // => one Done per Add(1): the fundamental accounting rule
	// => the answer travels by channel: computed locally, shared by sending
	out <- n * n * n // => buffer sized for the crew: never blocks, never waits
}

func main() {
	// => four workers, four answers: buffer and counter agree on the number
	results := make(chan int, 4) // => capacity 4: every send lands without waiting
	// => counter starts at zero: Add before EACH go, never inside the worker
	var wg sync.WaitGroup // => zero value ready: no constructor, no setup
	// => launch the crew: Add(1) immediately before each go, in the same step
	for _, n := range []int{1, 2, 3, 4} { // => four inputs, four workers
		wg.Add(1)                // => count this worker BEFORE it can finish
		go cube(n, results, &wg) // => worker runs; Done lands on its return
	}
	// => block until the counter returns to zero: all four Dones have landed
	wg.Wait() // => the gate: nothing below runs until the crew is complete
	// => close after Wait: no worker can send now, so ranging ends cleanly
	close(results) // => main closes: safe, because Wait proved workers done
	// => collect the closed channel: order varies, contents are exactly four
	got := []int{}           // => empty: appends grow it to the four answers below
	for v := range results { // => ends at close: four iterations, no counting
		got = append(got, v) // => collect every cube, whatever the arrival order
	}
	// => sort for determinism: the schedule must not leak into the output
	sort.Ints(got)   // => [1 8 27 64]: identical on every run, every machine
	fmt.Println(got) // => Output: [1 8 27 64]
}
