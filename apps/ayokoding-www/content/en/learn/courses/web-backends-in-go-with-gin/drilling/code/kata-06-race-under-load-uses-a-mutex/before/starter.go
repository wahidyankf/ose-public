// => Kata 6 starter: an unguarded counter under load.
// => The visits map is shared with no lock: concurrent workers race on it,
// => and Go panics on concurrent map writes. Your task: guard every access
// => with a mutex spanning the whole read-modify-write, then prove
// => ninety-six concurrent visits total exactly ninety-six.
package main

import (
	"fmt"                      // => prints the totals your lock will protect
	"github.com/gin-gonic/gin" // => the stateful router under load
	"net/http/httptest"        // => in-process requests by the hundred
	"sync"                     // => workers plus the mutex you will add
	"sync/atomic"              // => race-free outcome counters
)

// => counter is the shared visit ledger: add your mutex here.
// => TODO: mu sync.Mutex plus Lock/Unlock around every map access
type counter struct { // => the state every request mutates
	hits map[string]int // => TODO: guard me: concurrent writes panic today
}

// => visit records one hit: the read-modify-write your lock will span.
// => TODO: lock for the whole update: reads and writes alike
func (c *counter) visit(path string) int { // => one locked operation per call, after you
	c.hits[path]++      // => races today: two workers read, one write wins
	return c.hits[path] // => lost updates hide in this line
}

// => newRouter wires one counting route around the shared counter.
func newRouter(k *counter) *gin.Engine { // => the counter arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => the route delegates counting: the handler owns no state
	router.GET("/visit", func(c *gin.Context) { // => every visit counts once
		c.JSON(200, gin.H{"visits": k.visit("/visit")}) // => the running total
	})
	return router // => hand the wired engine back
}

// => hammer serves total visits from workers goroutines and counts answers.
func hammer(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	var ok, bad atomic.Int64 // => correct and broken answer counters
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
				router.ServeHTTP(rec, req)                       // => TODO: the mutex serializes here
				if rec.Code != 200 {                             // => any non-200 is a failure
					bad.Add(1) // => broken answers accumulate here
				} else {
					ok.Add(1) // => correct answers accumulate here
				}
			}
		}()
	}
	// => all workers joined: the ledger holds the final total
	wg.Wait() // => join every worker: totals are final below
	// => loads finalize the counts: workers already joined above
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	k := &counter{hits: map[string]int{}} // => empty ledger at startup
	router := newRouter(k)                // => wiring separate from traffic, as always
	// => panics today: your mutex must print served 96 correct 96 failed 0 total 96
	ok, bad := hammer(router, 96, 16)                                                      // => fixed workload, fixed parallelism
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad, "total", k.hits["/visit"]) // => the exact total, guarded
}
