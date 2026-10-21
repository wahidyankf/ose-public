// Example 56: Select Waits on Many Channels.
//
// Select waits on several channels and runs the first one ready. Exactly one
// ready channel here makes the choice deterministic: the cache always wins.
package main

import "fmt" // => prints which source answered: the cache, every single run

func main() {
	// => cache arrives pre-filled: the answer is ready before select starts
	cache := make(chan string, 1) // => buffered one: the send below never blocks
	// => the cached answer waits in the buffer: ready from the first select
	cache <- "cached: oat 12" // => pre-fill: select sees a ready case below
	// => network stays empty and unbuffered: nobody sends, nothing is ready
	network := make(chan string) // => no sender exists: this case never fires
	// => select blocks until ONE case can proceed: only the cache qualifies
	select { // => the waiter: first ready case wins, the rest are skipped
	// => cache case: ready immediately, so this branch runs deterministically
	case answer := <-cache: // => receives the pre-filled answer at once
		// => the fast path: cached data answers without any network wait
		fmt.Println(answer) // => Output: cached: oat 12
	// => network case: empty forever, so select never takes this branch here
	case answer := <-network: // => would run only if the network ever sent
		// => unreachable in this run: kept to show the shape select scales to
		fmt.Println("network:", answer) // => documents the slow-path branch
	}
	// => select took exactly one branch and moved on: no loop, no leftover
	fmt.Println("served from cache") // => Output: served from cache
}
