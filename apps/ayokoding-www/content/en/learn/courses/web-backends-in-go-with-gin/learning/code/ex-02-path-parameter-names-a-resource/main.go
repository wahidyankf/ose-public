// => Example 2: Path Parameter Names a Resource.
// => A colon segment captures one path part into the context by name, while
// => plain segments match literally. This example registers both side by
// => side, serves four requests in-process, and prints the value each
// => handler observed.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => routing with path parameters (co-01)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newUserForm answers the one literal path that must win over the capture.
// => static segments beat parameters: /users/new never reaches userByID
func newUserForm(c *gin.Context) { // => no params read: the path itself is the message
	c.String(200, "new user form") // => fixed body: the route, not data, answered
}

// => userByID answers /users/:id by echoing the captured value back.
// => Param reads the value the colon segment captured (co-03)
func userByID(c *gin.Context) { // => id holds whatever one segment carried
	// => "user-42" arrives intact: gin keeps hyphens, dots, and digits
	c.String(200, "user "+c.Param("id")) // => the captured value becomes the body
}

// => newRouter wires the literal route beside the parameterized one.
// => registration order never decides: the static route always wins (co-01)
func newRouter() *gin.Engine { // => the engine under test
	// => TestMode silences gin's debug banner so stdout stays golden-clean
	gin.SetMode(gin.TestMode) // => no debug output: only our prints appear
	router := gin.New()       // => bare engine: no hidden middleware
	// => the capture is registered FIRST to prove order does not matter
	router.GET("/users/:id", userByID) // => colon segment captures one value (co-01, co-03)
	// => the literal is registered SECOND and still wins its own path
	router.GET("/users/new", newUserForm) // => exact match beats capture (co-01)
	return router                         // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
// => httptest keeps the whole exchange inside this process (co-09)
func check(router *gin.Engine, target string) { // => the path is the only variable
	// => NewRequest builds a server-side request without a client socket
	req := httptest.NewRequest("GET", target, nil)            // => nil body: GET carries no payload
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => full pipeline, minus the socket
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => literal path wins even though the capture was registered first
	check(router, "/users/new") // => Output: GET /users/new -> 200 new user form
	// => the capture carries digits and hyphens untouched
	check(router, "/users/user-42") // => Output: GET /users/user-42 -> 200 user user-42
	// => two segments never match a one-segment pattern: defined absence
	check(router, "/users/a/b") // => Output: GET /users/a/b -> 404 404 page not found
	// => the bare prefix matches neither route: still a clean 404 (co-05)
	check(router, "/users/") // => Output: GET /users/ -> 404 404 page not found
}
