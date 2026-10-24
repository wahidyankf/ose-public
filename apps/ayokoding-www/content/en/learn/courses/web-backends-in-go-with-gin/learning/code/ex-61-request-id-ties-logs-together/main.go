// => Example 61: Request Id Ties Logs Together.
// => Structured logs carry the request id on every line, so concurrent
// => requests stay separable. This example stamps sequential ids, appends
// => start and finish lines without timestamps, and prints the log in the
// => stable order the single-threaded checks produce.
package main

import (
	"fmt"                      // => prints the collected log lines
	"github.com/gin-gonic/gin" // => the stamping middleware (co-02)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sync"                     // => guards the shared log slice
	"sync/atomic"              // => the sequential id counter (co-07)
)

// => journal collects structured log lines: every line names its request.
// => a mutex guards appends: checks below run sequentially, safely (co-07)
type journal struct { // => the in-memory stand-in for a log shipper
	mu    sync.Mutex // => serializes appends from concurrent requests
	lines []string   // => start and finish lines, in arrival order
}

// => log appends one line naming the request id and the event.
// => no timestamps: golden output must never depend on the clock (co-13)
func (j *journal) log(id string, event string) { // => id plus event, nothing else
	j.mu.Lock()         // => exclusive access for the append
	defer j.mu.Unlock() // => always release, on every return path
	// => the line shape is fixed: id, then event, separated by one space
	j.lines = append(j.lines, id+" "+event) // => "req-1 start", "req-1 finish"
}

// => stamp assigns sequential ids and logs both edges of each request.
// => before-log, Next, after-log: the onion measures the request (co-02)
func stamp(j *journal, ids *atomic.Int64) gin.HandlerFunc { // => the journal and counter arrive injected
	return func(c *gin.Context) { // => gin calls this around each handler
		n := ids.Add(1)                // => req-1, req-2: sequential and deterministic
		id := fmt.Sprintf("req-%d", n) // => the human form of the counter
		c.Set("requestID", id)         // => handlers read the same id
		j.log(id, "start")             // => the entry edge of the request
		c.Next()                       // => the handler runs between the lines
		j.log(id, "finish")            // => the exit edge, same id
	}
}

// => newRouter wires the stamping middleware around one instant route.
func newRouter(j *journal, ids *atomic.Int64) *gin.Engine { // => the journal arrives injected
	gin.SetMode(gin.TestMode)                                           // => silence the debug banner for golden output
	router := gin.New()                                                 // => bare engine: middleware added by hand
	router.Use(stamp(j, ids))                                           // => every request below is logged twice
	router.GET("/fast", func(c *gin.Context) { c.String(200, "fast") }) // => instant work: no sleep, no flake
	return router                                                       // => hand the wired engine back
}

// => check serves one GET and discards the body: the journal is the answer.
// => responses prove nothing here: the log lines are the lesson
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil) // => server-side request, no socket
	w := httptest.NewRecorder()                    // => the assertion surface
	router.ServeHTTP(w, req)                       // => stamp logs both edges (co-09)
}

func main() {
	j := &journal{}              // => empty journal at startup
	var ids atomic.Int64         // => the sequential counter, zero at start
	router := newRouter(j, &ids) // => wiring separate from traffic, as always
	// => two sequential requests: start and finish lines interleave by id
	check(router, "/fast") // => req-1 start, req-1 finish
	check(router, "/fast") // => req-2 start, req-2 finish
	// => the journal prints in arrival order: deterministic, no clock (co-13)
	for _, line := range j.lines { // => four lines, one per edge
		fmt.Println("log", line) // => Output: log req-1 start
		// => Output: log req-1 finish
		// => Output: log req-2 start
		// => Output: log req-2 finish
	}
}
