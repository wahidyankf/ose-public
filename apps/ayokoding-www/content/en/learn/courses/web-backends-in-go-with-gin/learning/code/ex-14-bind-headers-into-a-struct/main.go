// => Example 14: Bind Headers into a Struct.
// => Headers carry metadata like request ids and client versions, and they
// => bind into structs with defaults. This example binds a request id and a
// => client version, requires the id, and prints the struct two header sets
// => produce.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => header binding into a typed struct (co-03)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Meta is the request metadata contract: identity plus client version.
// => header tags name the HTTP headers; canonical form is handled (co-03)
type Meta struct { // => metadata becomes data instead of string lookups
	RequestID string `header:"X-Request-Id" binding:"required"` // => every request must carry identity
	Version   string `header:"X-Client-Version,default=v1"`     // => absent version means the first one
}

// => meta binds the headers and echoes the typed metadata back.
// => ShouldBindHeader reads the request headers, never the body (co-03)
func meta(c *gin.Context) { // => the handler works with Meta, not Get calls
	var m Meta // => the target: zero Meta until binding fills it
	// => a missing request id fails required: anonymous requests stop here
	if err := c.ShouldBindHeader(&m); err != nil { // => header rules run here
		c.JSON(400, gin.H{"error": "bad headers"}) // => fixed envelope (co-04)
		return                                     // => metadata-less requests never reach the logic below
	}
	c.JSON(200, m) // => the typed metadata, echoed as the contract (co-04)
}

// => newRouter wires the single metadata route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	router.GET("/meta", meta) // => one path, headers bound beside it (co-03)
	return router             // => hand the wired engine back
}

// => check serves one GET with the given headers and prints the answer.
// => headers ride on the request: two calls differ only in metadata
func check(router *gin.Engine, id string, version string) { // => id empty means the header is absent
	req := httptest.NewRequest("GET", "/meta", nil) // => fixed path, varying headers
	// => only set the headers the caller names: empty stays absent
	if id != "" { // => presence is meaningful: required watches it
		req.Header.Set("X-Request-Id", id) // => the identity under test
	}
	if version != "" { // => absent version exercises the default
		req.Header.Set("X-Client-Version", version) // => the version under test
	}
	w := httptest.NewRecorder()                                                          // => in-memory response capture
	router.ServeHTTP(w, req)                                                             // => header binding runs inside
	fmt.Println("GET /meta id=", id, "version=", version, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => both headers set: the struct echoes exactly what arrived
	router := newRouter()        // => wiring separate from traffic, as always
	check(router, "req-1", "v2") // => Output: GET /meta id= req-1 version= v2 -> 200 {"RequestID":"req-1","Version":"v2"}
	// => version absent: the default fills v1 without the client asking
	check(router, "req-2", "") // => Output: GET /meta id= req-2 version=  -> 200 {"RequestID":"req-2","Version":"v1"}
	// => id absent: required fails and the fixed envelope answers (co-10)
	check(router, "", "v2") // => Output: GET /meta id=  version= v2 -> 400 {"error":"bad headers"}
}
