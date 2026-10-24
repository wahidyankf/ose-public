// => Example 17: Query Array Collects Repeats.
// => Repeated keys express lists in a query string, and they bind into
// => slices. This example binds tag=a&tag=b into a []string, prints the
// => collected tags, and shows a missing repeated key binding to an empty
// => slice.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => repeated keys bind into slices (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Filter is the search contract: one optional list of tags.
// => a slice field collects every repetition of its key (co-03)
type Filter struct { // => lists ride in the query without brackets
	Tags []string `form:"tag" json:"tags"` // => tag=a&tag=b becomes two elements
}

// => filter binds the repeated keys and echoes the collected slice back.
// => absent keys bind to nil, which marshals as JSON null (co-04)
func filter(c *gin.Context) { // => the handler works with the slice, not the query
	var f Filter // => the target: nil slice until binding fills it
	// => no validation tags here: any list, including empty, is legal
	if err := c.ShouldBindQuery(&f); err != nil { // => repeated keys rarely fail to bind
		c.JSON(400, gin.H{"error": "bad filter"}) // => fixed envelope, kept for symmetry (co-04)
		return                                    // => unreachable in practice, but the path stays total
	}
	// => nil would print as null: normalize to [] so clients see one shape
	if f.Tags == nil { // => absent keys leave the slice nil
		f.Tags = []string{} // => empty array serializes as [], never null
	}
	c.JSON(200, f) // => the collected tags, in arrival order (co-04)
}

// => newRouter wires the single filter route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: no hidden middleware
	router.GET("/search", filter) // => one path, a list in the query (co-03)
	return router                 // => hand the wired engine back
}

// => check serves one GET in-process and prints the query with the answer.
func check(router *gin.Engine, target string) { // => the query string is the variable
	req := httptest.NewRequest("GET", target, nil)            // => repeats ride in the URL
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => slice binding runs inside
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => two tag keys collect into a two-element slice, order kept
	check(router, "/search?tag=go&tag=web") // => Output: GET /search?tag=go&tag=web -> 200 {"tags":["go","web"]}
	// => one tag collects into a one-element slice: same shape, shorter
	check(router, "/search?tag=go") // => Output: GET /search?tag=go -> 200 {"tags":["go"]}
	// => no tags at all: the normalized empty array, never null (co-04)
	check(router, "/search") // => Output: GET /search -> 200 {"tags":[]}
}
