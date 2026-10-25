// => Example 54: Gin Serves Requests Concurrently.
// => Gin runs each request on its own goroutine, so handlers must be safe
// => for concurrent use. This example fires ninety-six in-process requests
// => from sixteen workers at once and counts that every answer is correct.
package main

import (
	"fmt"                      // => prints the deterministic totals
	"github.com/gin-gonic/gin" // => the router under concurrent load (co-07)
	"net/http/httptest"        // => in-process requests by the dozen (co-09)
	"sync"                     // => workers serve concurrently (co-07)
	"sync/atomic"              // => race-free counters across workers
)

// => newRouter wires one constant route: the only answer is "ok".
// => stateless handlers are trivially safe: nothing is shared at all
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => constant work per request: the load measures plumbing, not logic
	router.GET("/ok", func(c *gin.Context) { c.String(200, "ok") }) // => no state, no races
	return router                                                   // => hand the wired engine back
}

// => hammer serves total requests from workers goroutines and counts answers.
// => the shape mirrors production: concurrent clients, one service (co-07)
func hammer(router *gin.Engine, total int, workers int) (int64, int64) { // => workload size plus parallelism
	var ok, bad atomic.Int64 // => correct and incorrect answer counters
	var wg sync.WaitGroup    // => waits for every worker to finish
	// => 96 divides by 16 into 6: every worker serves the same share
	share := total / workers       // => requests per worker: exact division below
	for w := 0; w < workers; w++ { // => one goroutine per worker
		wg.Add(1)   // => count the worker before starting it
		go func() { // => workers serve concurrently, like real traffic
			defer wg.Done()              // => always mark done, on every return path
			for i := 0; i < share; i++ { // => this worker's fixed share
				req := httptest.NewRequest("GET", "/ok", nil) // => identical request, every time
				rec := httptest.NewRecorder()                 // => fresh recorder per request
				router.ServeHTTP(rec, req)                    // => ServeHTTP is safe for concurrent use
				// => only 200 plus "ok" counts: anything else is a failure
				if rec.Code == 200 && rec.Body.String() == "ok" { // => the contract, checked per request
					// => every 200-plus-ok increments the correct counter
					ok.Add(1) // => correct answers accumulate here
				} else {
					// => any deviation lands in the failure counter instead
					bad.Add(1) // => anything else accumulates here
				}
			}
		}()
	}
	// => waiting joins all workers: counts are complete after this line
	wg.Wait() // => join every worker: totals are final below
	// => loads finalize the counts: workers already joined above
	return ok.Load(), bad.Load() // => the deterministic totals
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => ninety-six requests on sixteen workers: stateless means all correct
	ok, bad := hammer(router, 96, 16)                           // => divisible shares: six per worker
	fmt.Println("served", ok+bad, "correct", ok, "failed", bad) // => Output: served 96 correct 96 failed 0
}
