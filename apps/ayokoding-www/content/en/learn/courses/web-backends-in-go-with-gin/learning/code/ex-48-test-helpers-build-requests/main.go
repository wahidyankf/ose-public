// => Example 48: Test Helpers Build Requests.
// => Repeated request construction belongs in one helper, so cases stay one
// => line each. This example centralizes JSON request building in a perform
// => helper and prints the verdicts for one creation and two failures.
package main

import (
	"bytes"                    // => buffers the JSON body for the request
	"fmt"                      // => prints one verdict per case
	"github.com/gin-gonic/gin" // => the router every case serves (co-09)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => item is the tiny stored shape: name only, validated.
type item struct { // => the contract under test
	Name string `json:"name" binding:"required"` // => blank names fail (co-10)
}

// => newRouter wires one creation route around a fixed store.
func newRouter(store map[string]bool) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode)                    // => silence the debug banner for golden output
	router := gin.New()                          // => bare engine: no hidden middleware
	router.POST("/items", func(c *gin.Context) { // => create one item
		var in item                                   // => the bound shape, validated below
		if err := c.ShouldBindJSON(&in); err != nil { // => missing name fails here
			c.JSON(400, gin.H{"error": "bad item"}) // => 400, fixed envelope (co-05)
			return                                  // => invalid input never reaches the store
		}
		if store[in.Name] { // => duplicates conflict: the store already has it
			c.JSON(409, gin.H{"error": "duplicate"}) // => 409 names the conflict (co-04)
			return                                   // => the second write loses
		}
		// => the map remembers: second creation of the same name conflicts
		store[in.Name] = true               // => remember the name
		c.JSON(201, gin.H{"name": in.Name}) // => 201 with the stored shape
	})
	return router // => hand the wired engine back
}

// => perform builds a JSON request, serves it, and returns the recorder.
// => every case calls this: construction lives in exactly one place (co-09)
func perform(router *gin.Engine, method string, target string, body string) *httptest.ResponseRecorder { // => method, path, payload in
	// => bytes.Buffer turns the fixed string into a request stream
	req := httptest.NewRequest(method, target, bytes.NewBufferString(body)) // => no socket, fixed bytes
	req.Header.Set("Content-Type", "application/json")                      // => JSON bodies bind below
	// => the recorder captures status and body for the verdict
	w := httptest.NewRecorder() // => the assertion surface
	router.ServeHTTP(w, req)    // => full pipeline, minus the network
	return w                    // => callers assert on status and body
}

// => verdict serves one case through perform and prints PASS or FAIL.
// => the helper builds, this function judges: two jobs, two functions
func verdict(tag string, w *httptest.ResponseRecorder, wantCode int, wantBody string) { // => tag names the case
	// => code and body must both match: either mismatch fails the case
	if w.Code != wantCode || w.Body.String() != wantBody { // => exact on both halves
		fmt.Println("FAIL", tag, "got", w.Code, w.Body.String()) // => the tag plus what happened
		return                                                   // => failure recorded: the next case still runs
	}
	fmt.Println("PASS", tag) // => the case held: name the proof
}

func main() {
	store := map[string]bool{} // => empty store at startup
	router := newRouter(store) // => wiring separate from traffic, as always
	// => the helper compresses each case to one serve plus one verdict
	verdict("create bolt", perform(router, "POST", "/items", `{"name":"bolt"}`), 201, `{"name":"bolt"}`)                // => Output: PASS create bolt
	verdict("bolt twice conflicts", perform(router, "POST", "/items", `{"name":"bolt"}`), 409, `{"error":"duplicate"}`) // => Output: PASS bolt twice conflicts
	// => empty names prove required: the tag rejects blank strings
	verdict("blank name is 400", perform(router, "POST", "/items", `{"name":""}`), 400, `{"error":"bad item"}`) // => Output: PASS blank name is 400
}
