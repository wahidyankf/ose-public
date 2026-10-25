// => Example 58: WaitGroup Waits for Fan Out.
// => Fan-out without joining leaks goroutines and loses results, so a
// => WaitGroup joins every worker before the handler answers. This example
// => fetches three fixed parts concurrently, joins all three, and prints
// => the assembled page in stable key order.
package main

import (
	"fmt"                      // => prints the assembled page
	"github.com/gin-gonic/gin" // => the handler that fans out (co-07)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sort"                     // => sorts part names: finish order varies (co-07)
	"sync"                     // => joins the three fetchers (co-07)
)

// => fetch pretends to retrieve one page part: fixed bytes, no I/O.
// => deterministic stand-in: real fetchers call stores or clients here
func fetch(part string) string { // => the part name decides the content
	return "content-of-" + part // => fixed bytes per part, no timing
}

// => page fans three fetches out, joins them, and assembles the page.
// => the map collects by name: every part lands in its slot (co-07)
func page(c *gin.Context) { // => the handler that waits for everything
	parts := []string{"head", "body", "foot"} // => the three parts, fixed order
	// => the map collects by name: every part lands in its slot
	got := map[string]string{} // => name to content, filled by workers
	var mu sync.Mutex          // => guards the map: workers share it
	var wg sync.WaitGroup      // => joins all three fetchers
	for _, p := range parts {  // => one goroutine per part
		p := p      // => capture the loop variable: each worker keeps its own
		wg.Add(1)   // => count the worker before starting it
		go func() { // => fetchers run concurrently, like real backends
			defer wg.Done()     // => always mark done, on every return path
			content := fetch(p) // => the fetch itself, instant here
			mu.Lock()           // => exclusive access for the map write
			got[p] = content    // => file the part under its name
			mu.Unlock()         // => release before returning
		}()
	}
	wg.Wait() // => join every fetcher: the map is complete below
	// => maps iterate randomly: sort the names before assembling
	// => names first, content second: two passes keep order stable
	names := []string{}       // => the part names in stable order
	for _, p := range parts { // => insertion order, not map order
		names = append(names, p) // => head, body, foot, every run
	}
	sort.Strings(names) // => alphabetical: body, foot, head, stable
	// => the assembled page maps sorted names to fetched content
	out := map[string]string{} // => the assembled page, keyed by part
	for _, n := range names {  // => one entry per part, sorted
		out[n] = got[n] // => content filed under its sorted name
	}
	c.JSON(200, out) // => the assembled page, stable key order (co-04)
}

// => newRouter wires the single assembling route this example serves.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	router.GET("/page", page) // => the handler that fans out and joins
	return router             // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => the assertion surface
	router.ServeHTTP(w, req)                                  // => fan-out and join run inside (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => three parts fetched concurrently, assembled in sorted key order (co-07)
	check(router, "/page") // => Output: GET /page -> 200 {"body":"content-of-body","foot":"content-of-foot","head":"content-of-head"}
}
