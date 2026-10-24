// => Example 55: Mutex Guards Shared State.
// => Shared maps are unsafe for concurrent use, so a mutex must serialize
// => every access. This example counts visits from parallel workers behind
// => a mutex and prints the exact total the lock protected.
package main

import (
	"fmt"                      // => prints the deterministic totals
	"github.com/gin-gonic/gin" // => the stateful router under load (co-07)
	"net/http/httptest"        // => in-process requests by the hundred (co-09)
	"sync"                     // => mutex plus workers (co-07)
	"sync/atomic"              // => race-free outcome counters
)

// => counter is the shared visit ledger: a map behind a mutex.
// => every access holds the lock: reads and writes alike (co-07)
type counter struct { // => the state every request mutates
	mu   sync.Mutex     // => serializes all map access
	hits map[string]int // => path to visit count
}

// => visit records one hit for the path and returns the new total.
// => the lock spans read-modify-write: no lost updates between them
func (c *counter) visit(path string) int { // => one locked operation per call
	// => one holder at a time: the map never sees concurrent writes
	c.mu.Lock()         // => exclusive access for the whole update
	defer c.mu.Unlock() // => always release, on every return path
	c.hits[path]++      // => read, add, and store atomically together
	// => the total leaves the critical section: callers print it
	return c.hits[path] // => the new total, computed under the lock
}

// => newRouter wires one counting route around the shared counter.
func newRouter(k *counter) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => the route delegates counting: the handler owns no state
	router.GET("/visit", func(c *gin.Context) { // => every visit counts once
		c.JSON(200, gin.H{"visits": k.visit("/visit")}) // => the running total (co-04)
	})
	return router // => hand the wired engine back
}

// => hammer serves total visits from workers goroutines and checks answers.
// => the totals are exact: the mutex allows no lost updates (co-07)
func hammer(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	var ok, bad atomic.Int64 // => correct-sequence and broken counters
	var wg sync.WaitGroup    // => waits for every worker to finish
	// => 96 divides by 16 into 6: fixed shares keep totals exact
	share := total / workers       // => requests per worker: exact division below
	for w := 0; w < workers; w++ { // => one goroutine per worker
		wg.Add(1)   // => count the worker before starting it
		go func() { // => workers visit concurrently, like real traffic
			defer wg.Done()              // => always mark done, on every return path
			for i := 0; i < share; i++ { // => this worker's fixed share
				req := httptest.NewRequest("GET", "/visit", nil) // => identical request, every time
				rec := httptest.NewRecorder()                    // => fresh recorder per request
				router.ServeHTTP(rec, req)                       // => the mutex serializes inside
				if rec.Code != 200 {                             // => any non-200 is a failure
					// => any non-200 lands in the failure counter instead
					bad.Add(1) // => broken answers accumulate here
				} else {
					// => every 200 increments the correct counter
					ok.Add(1) // => correct answers accumulate here
				}
			}
		}()
	}
	// => all workers joined: the ledger holds the final total
	wg.Wait()                    // => join every worker: totals are final below
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	k := &counter{hits: map[string]int{}} // => empty ledger at startup
	router := newRouter(k)                // => wiring separate from traffic, as always
	// => ninety-six visits on sixteen workers: the mutex loses none
	ok, bad := hammer(router, 96, 16)                                                      // => fixed workload, fixed parallelism
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad, "total", k.hits["/visit"]) // => Output: served 96 correct 96 failed 0 total 96
}
