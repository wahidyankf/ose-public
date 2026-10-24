// Command ex33queue drains a two-item queue, proving the documented contract.
//
// The program exists so the lesson's claims stay executable end to end.
// NewQueue starts the line, Push fills it, Pop drains it in arrival order.
// This file keeps plain comments on purpose: queue.go carries the real docs.
package main

import "fmt"

// main runs the documented contract: build, fill, drain, print in order.
//
// Keeping main thin is the point: construction, filling, and draining each
// call one documented function, so the program reads as the manual's example.
func main() {
	// Start from the constructor: the documented entry point, never a literal.
	q := NewQueue()
	// Push two items: arrival order decides departure order below.
	q.Push("sari")
	// Second arrival waits behind the first: FIFO, exactly as documented.
	q.Push("budi")
	// Pop twice: sari leaves first, then budi, each gated by its ok flag.
	front, ok := q.Pop()
	// Print only on a real removal: ok false would mean the line was empty.
	if ok {
		fmt.Println(front)
	}
	// Second pop: budi departs now that sari has left the front.
	front, ok = q.Pop()
	// Same gate: the flag, not hope, decides whether front is worth printing.
	if ok {
		fmt.Println(front)
	}
}
