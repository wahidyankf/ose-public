// Kata 12: Simulate two stateless workers sharing only a common store.
//
// Each worker has its own local memory, but durable state must live in
// one shared map. The shared counter stays consistent no matter which
// worker handled which request; the local counters diverge.
package main

import (
	"fmt" // => prints the shared progression and the divergent locals
	"log" // => fail-fast on any self-check mismatch
)

// Worker models one server process behind a load balancer.
type Worker struct { // => co-05: its own local memory, none shared with peers
	name       string         // => which worker this is, for reasoning only
	localCache map[string]int // => in-process state: statelessness forbids relying on this
}

// NewWorker starts with an empty local cache.
func NewWorker(name string) *Worker { // => one constructor per simulated process
	return &Worker{name: name, localCache: map[string]int{}}
}

// HandleRequest routes durable state through the shared store only.
func (w *Worker) HandleRequest(sharedDB map[string]int, key string, increment int) int { // => the shared store is the only durable dependency
	w.localCache[key]++        // => a local counter: diverges per worker, proves the point
	sharedDB[key] += increment // => co-05: durable state lives in one shared place
	return sharedDB[key]       // => every worker reads the same shared value
}

// LocalCount exposes the divergent local counter for inspection.
func (w *Worker) LocalCount(key string) int { // => public only so this kata can assert divergence
	return w.localCache[key]
}

func main() {
	sharedDB := map[string]int{}     // => co-05: stands in for the database, the one place real state lives
	workerA := NewWorker("worker-a") // => co-05: two workers, as if behind a load balancer
	workerB := NewWorker("worker-b") // => independent processes, shared nothing but the DB

	result1 := workerA.HandleRequest(sharedDB, "views", 1) // => request 1 lands on A
	result2 := workerB.HandleRequest(sharedDB, "views", 1) // => request 2 lands on B
	result3 := workerA.HandleRequest(sharedDB, "views", 1) // => request 3 lands back on A

	fmt.Println(result1, result2, result3)                                // => Output: 1 2 3
	fmt.Println(workerA.LocalCount("views"), workerB.LocalCount("views")) // => Output: 2 1

	if workerA.LocalCount("views") != 2 || workerB.LocalCount("views") != 1 { // => locals only saw their own requests
		log.Fatalf("locals = (%d,%d), want (2,1)", workerA.LocalCount("views"), workerB.LocalCount("views"))
	}
	if sharedDB["views"] != 3 || result3 != 3 { // => the shared DB is consistent regardless of routing
		log.Fatalf("shared = %d result3 = %d, want 3/3", sharedDB["views"], result3)
	}
	fmt.Println("kata-12 OK") // => the self-check line this track greps for
}
