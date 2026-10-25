// => Example 3: Query String Filters a List.
// => Query strings carry optional filters outside the path, so one route
// => serves many views of one collection. This example lists a fixed catalog
// => three ways: unfiltered, filtered by a query value, and capped by a limit
// => that falls back to a default when the client stays silent.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => query parsing on the context (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => catalog is the fixed collection every query filters: no store, no I/O.
// => package-level data keeps the example about parsing, not storage
var catalog = []string{"gin", "fiber", "echo", "chi"} // => four names, stable order

// => search answers /search by filtering the catalog on q and capping on limit.
// => DefaultQuery returns the fallback when the key is absent (co-03)
func search(c *gin.Context) { // => the query lives beside the path, not in it
	// => q selects, limit caps: two independent optional filters
	q := c.DefaultQuery("q", "") // => empty q means no filtering at all
	limit := 10                  // => the default cap when limit is absent
	// => GetQuery reports presence, so "limit=0" differs from missing limit
	if raw, ok := c.GetQuery("limit"); ok { // => ok is false when the key is missing
		// => one fmt rule parses the cap; a bad value keeps the default
		var n int // => the parsed cap, or zero when parsing fails
		// => Sscanf reads one integer and reports how many items it filled
		if _, err := fmt.Sscanf(raw, "%d", &n); err == nil && n >= 0 { // => negative caps are rejected too
			limit = n // => the client spoke clearly: honor the cap
		}
	}
	out := []string{}              // => start empty: filters only remove, never invent
	for _, name := range catalog { // => stable order: the catalog never shuffles
		// => empty q matches everything; otherwise the name must contain q
		if q == "" || contains(name, q) { // => substring match keeps the demo tiny
			out = append(out, name) // => keep what the filter allows
		}
	}
	// => the cap applies after filtering: at most limit names leave
	if len(out) > limit { // => slicing the stable order keeps output golden
		out = out[:limit] // => cap the tail off, keep the head
	}
	c.JSON(200, out) // => a bare JSON array: the filtered view (co-04)
}

// => contains reports whether sub appears inside s, reusing strings logic.
// => a three-line helper avoids importing strings for one call
func contains(s string, sub string) bool { // => both operands are plain strings
	// => slide the window: every start position gets one comparison
	for i := 0; i+len(sub) <= len(s); i++ { // => the last start still fits sub
		if s[i:i+len(sub)] == sub { // => exact slice match at this position
			return true // => one hit is enough to keep the name
		}
	}
	return false // => no window matched: the name is filtered out
}

// => newRouter wires the single search route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: no hidden middleware
	router.GET("/search", search) // => one path, three views via the query (co-01)
	return router                 // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the query string is the variable
	req := httptest.NewRequest("GET", target, nil)            // => query rides in the URL, no body
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => full pipeline, minus the socket (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => no query at all: the whole catalog in stable order
	check(router, "/search") // => Output: GET /search -> 200 ["gin","fiber","echo","chi"]
	// => q filters to names containing it: only gin survives "gi"
	check(router, "/search?q=gi") // => Output: GET /search?q=gi -> 200 ["gin"]
	// => limit caps the view after filtering: head two of four
	check(router, "/search?limit=2") // => Output: GET /search?limit=2 -> 200 ["gin","fiber"]
	// => a bad limit keeps the default instead of failing the request
	check(router, "/search?limit=many") // => Output: GET /search?limit=many -> 200 ["gin","fiber","echo","chi"]
}
