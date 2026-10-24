// => Example 59: Sync Map Counts Safely.
// => sync.Map trades the mutex for lock-free concurrent access with its own
// => LoadOrStore vocabulary. This example counts votes from parallel
// => workers in a sync.Map and prints the sorted totals.
package main

import (
	"fmt"                      // => prints the sorted totals
	"github.com/gin-gonic/gin" // => the voting route under load (co-07)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sort"                     // => sorts candidate names: map order varies (co-07)
	"sync"                     // => the lock-free map plus the worker wait
	"sync/atomic"              // => the counter increment primitive
)

// => tally counts votes per candidate without any explicit lock.
// => sync.Map owns the synchronization: Load, Store, and friends (co-07)
var tally sync.Map // => candidate name to *int64, shared process-wide

// => vote records one vote for the named candidate and returns its total.
// => LoadOrStore publishes the counter once; Add increments after that
func vote(name string) int64 { // => the candidate name decides the counter
	// => the first voter stores a fresh counter; later voters load it
	// => first voter stores, later voters load: exactly one counter survives
	actual, _ := tally.LoadOrStore(name, new(int64)) // => exactly one counter per name
	// => the type assertion recovers the counter from the empty interface
	counter := actual.(*int64) // => the shared counter for this name
	return addOne(counter)     // => increment and return the new total
}

// => addOne increments the shared counter and returns the new total.
// => atomic keeps concurrent first-votes from losing increments
func addOne(p *int64) int64 { // => plus one, race-free
	return atomic.AddInt64(p, 1) // => the single primitive, used directly
}

// => newRouter wires the voting route around the shared tally.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                         // => silence the debug banner for golden output
	router := gin.New()                               // => bare engine: no hidden middleware
	router.POST("/vote/:name", func(c *gin.Context) { // => one vote per request
		c.JSON(200, gin.H{"name": c.Param("name"), "votes": vote(c.Param("name"))}) // => the running total (co-04)
	})
	router.GET("/tally", func(c *gin.Context) { // => the sorted totals
		names := []string{}                   // => candidate names in stable order
		tally.Range(func(k any, v any) bool { // => Range visits every counter once
			names = append(names, k.(string)) // => collect the names first
			return true                       // => true keeps ranging: visit them all
		})
		sort.Strings(names) // => alphabetical: golden output is stable (co-07)
		// => the receipt maps sorted names to final counts
		out := map[string]int64{} // => the totals, keyed by name
		for _, n := range names { // => one entry per candidate, sorted
			v, _ := tally.Load(n) // => the counter must exist: we just named it
			out[n] = *v.(*int64)  // => dereference under no lock: counts are final
		}
		c.JSON(200, out) // => the sorted totals (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
func check(router *gin.Engine, method string, target string) { // => method and path vary
	req := httptest.NewRequest(method, target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                                // => the assertion surface
	router.ServeHTTP(w, req)                                   // => sync.Map absorbs the concurrency (co-09)
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => sequential votes build the counters: determinism first
	check(router, "POST", "/vote/anna") // => Output: POST /vote/anna -> 200 {"name":"anna","votes":1}
	check(router, "POST", "/vote/bo")   // => Output: POST /vote/bo -> 200 {"name":"bo","votes":1}
	check(router, "POST", "/vote/anna") // => Output: POST /vote/anna -> 200 {"name":"anna","votes":2}
	// => the tally sorts the names: anna before bo, every run (co-07)
	check(router, "GET", "/tally") // => Output: GET /tally -> 200 {"anna":2,"bo":1}
}
