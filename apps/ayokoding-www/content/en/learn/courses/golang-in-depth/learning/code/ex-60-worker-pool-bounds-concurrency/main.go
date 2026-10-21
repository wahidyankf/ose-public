// Example 60: Worker Pool Bounds Concurrency.
//
// A fixed crew pulls jobs from a channel: three workers drain six jobs here.
// Bounding the crew bounds resource use; sorting bounds the output's order.
package main

import (
	"fmt"  // => prints the sorted results after the pool drains the jobs
	"sort" // => schedule-independent output: sorted, like Examples 54 and 57
	"sync" // => WaitGroup: main waits for the crew before closing results
)

// worker pulls job IDs and sends back ten times each, until jobs closes.
// => range over jobs: the loop ends exactly when main closes the channel
// => results buffered for all six: workers never block on delivering answers
func worker(jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	// => Done on return: deferred first, matching the WaitGroup accounting
	defer wg.Done() // => one Done per crew member, released at range end
	// => pull until close: each iteration handles exactly one job fully
	for id := range jobs { // => ends when jobs closes: no counting, no poison
		// => ten-times transform: the "work", deterministic per job ID
		results <- id * 10 // => buffered: delivery never waits for collecting
	}
}

func main() {
	// => six jobs buffered: the send loop below never waits for workers
	jobs := make(chan int, 6) // => capacity 6: all jobs queue before workers start
	// => six results buffered: workers never wait for the collector either
	results := make(chan int, 6) // => capacity 6: delivery decoupled from reading
	// => crew of three: concurrency bounded HERE, not by job count, ever
	var wg sync.WaitGroup    // => counts crew members, not jobs: three Dones total
	for w := 0; w < 3; w++ { // => three workers: the bound, stated as a number
		wg.Add(1)                     // => count before launch: the accounting rule
		go worker(jobs, results, &wg) // => crew runs: pulls until jobs closes
	}
	// => queue all six jobs, then close: close promises "no more are coming"
	for id := 1; id <= 6; id++ { // => jobs 1..6: fixed input, fixed transform
		jobs <- id // => buffered: all six queue without a worker awake yet
	}
	close(jobs) // => workers' range loops now terminate after draining six
	// => Wait for the crew: every job handled before results close below
	wg.Wait() // => three Dones: the pool is fully drained, provably
	// => close results after Wait: no worker can send now, ranging ends cleanly
	close(results) // => collector's range terminates: six iterations exactly
	// => collect and sort: finish order varied, output order must not
	got := []int{}           // => empty: six appends grow it to the full answer set
	for v := range results { // => six values: 10 through 60, arrival order random
		got = append(got, v) // => collect unsorted: sorting happens once below
	}
	sort.Ints(got)   // => [10 20 30 40 50 60]: schedule-free output
	fmt.Println(got) // => Output: [10 20 30 40 50 60]
}
