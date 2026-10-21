// Example 54: Goroutines Run Beside You.
//
// A goroutine is a lightweight concurrent function call. Three squarers run
// beside main here; a buffered channel carries answers back, and sorting
// before printing keeps the output deterministic whatever the schedule.
package main

import (
	"fmt"  // => prints the sorted squares after all workers answer
	"sort" // => sort orders results: scheduling must not leak into output
)

// square sends n*n into out, then returns: one worker, one answer, no sharing.
// => send-only parameter (chan<- int): the type system forbids receiving here
// => no shared state: the argument travels by value, the answer by channel
func square(n int, out chan<- int) { // => worker body: compute, send, done
	// => the send never blocks: the buffer was sized for every worker below
	out <- n * n // => answer travels back; scheduling order is irrelevant
}

func main() {
	// => buffered for exactly three answers: workers never block on sending
	results := make(chan int, 3) // => capacity 3: one slot per worker, no deadlock
	// => launch three workers: go makes each call concurrent, order unknown
	for _, n := range []int{3, 1, 2} { // => launch order fixed, finish order not
		go square(n, results) // => concurrent call: returns to the loop at once
	}
	// => collect exactly three answers: the count, not the order, is the contract
	got := make([]int, 0, 3) // => pre-sized: three answers, zero regrowth
	for i := 0; i < 3; i++ { // => three receives: matches the three workers
		got = append(got, <-results) // => receive order is schedule-dependent
	}
	// => sort before printing: determinism is a presentation choice here
	sort.Ints(got)   // => [1 4 9]: same output on every schedule, every machine
	fmt.Println(got) // => Output: [1 4 9]
}
