// => Example 53: Measure with a Fixed Workload.
// => Benchmarks prove performance, but timing never belongs in golden
// => output. This example serves a fixed thousand-request workload
// => in-process, asserts every answer, and prints only deterministic
// => totals: requests served, all correct, zero failures.
package main

import (
	"fmt"                      // => prints the deterministic totals
	"github.com/gin-gonic/gin" // => the router under load (co-07)
	"net/http/httptest"        // => in-process requests by the thousand (co-09)
	"sync"                     // => workers serve the workload concurrently (co-07)
	"sync/atomic"              // => race-free counters across workers
)

// => newRouter wires one fast route: the workload below hammers exactly this.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => constant work per request: the workload measures plumbing, not logic
	router.GET("/fast", func(c *gin.Context) { c.String(200, "fast") }) // => constant work per request
	return router                                                       // => hand the wired engine back
}

// => workload serves total requests across workers and counts the outcomes.
// => workers divide the requests; atomics merge the counts safely (co-07)
func workload(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	// => two counters, zero locks: atomics merge worker results
	var ok, bad atomic.Int64 // => served-correct and served-wrong counters
	var wg sync.WaitGroup    // => waits for every worker to finish
	// => 1000 divides by 8 into 125: every worker serves the same share
	share := total / workers       // => requests per worker, exact division below
	for w := 0; w < workers; w++ { // => one goroutine per worker
		wg.Add(1)   // => count the worker before starting it
		go func() { // => workers serve concurrently, like real traffic (co-07)
			defer wg.Done()              // => always mark done, on every return path
			for i := 0; i < share; i++ { // => this worker's fixed share
				req := httptest.NewRequest("GET", "/fast", nil) // => identical request, every time
				rec := httptest.NewRecorder()                   // => fresh recorder per request
				router.ServeHTTP(rec, req)                      // => full pipeline, minus the network (co-09)
				// => only 200 plus "fast" counts as correct: anything else is a failure
				if rec.Code == 200 && rec.Body.String() == "fast" { // => the contract, checked per request
					ok.Add(1) // => correct answers accumulate here
				} else {
					bad.Add(1) // => anything else accumulates here
				}
			}
		}()
	}
	// => waiting joins all workers: counts are complete after this line
	wg.Wait()                    // => join every worker: totals are final below
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => a thousand requests on eight workers: every one 200 plus fast
	ok, bad := workload(router, 1000, 8)                        // => fixed workload, fixed parallelism
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad) // => Output: served 1000 correct 1000 failed 0
}
