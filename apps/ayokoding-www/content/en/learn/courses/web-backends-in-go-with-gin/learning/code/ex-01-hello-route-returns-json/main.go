// => Example 1: Hello Route Returns JSON.
// => A Gin route maps one method plus one path to one handler function, and
// => the handler turns the request into a response. This example registers
// => GET /hello, calls it in-process (no socket, no network), and prints the
// => status code with the JSON body the handler wrote.
package main

import (
	"fmt"                      // => prints each in-process check result to stdout
	"github.com/gin-gonic/gin" // => the web framework this course teaches (co-01)
	"net/http"                 // => status codes and the request constructor (co-01)
	"net/http/httptest"        // => in-process request and recorder: no socket (co-09)
)

// => hello writes the fixed greeting contract this example promises.
// => gin.Context carries the request in and the response out
// => the handler returns nothing: it writes through c instead
func hello(c *gin.Context) { // => c is the per-request gin context (co-01)
	// => gin.H is a shortcut map for one-off JSON objects
	// => encoding/json sorts the single key, so the body is stable
	c.JSON(http.StatusOK, gin.H{"message": "hello, gin"}) // => 200 plus the greeting body (co-04)
	// => StatusOK names 200: the code says what happened (co-04)
}

// => newRouter builds the service with every route this example serves.
// => a constructor keeps wiring in one place the tests can call (co-06)
// => returning the engine lets each check serve requests in-process (co-09)
func newRouter() *gin.Engine { // => *gin.Engine is the request multiplexer
	// => TestMode silences gin's debug banner so stdout stays golden-clean
	gin.SetMode(gin.TestMode) // => no debug output: only our prints appear
	// => New starts with no middleware: nothing hidden runs here (co-02)
	router := gin.New() // => a bare engine: routes only, no logger (co-01)
	// => GET names the method, "/hello" the path, hello the handler
	router.GET("/hello", hello) // => one method plus one path picks hello (co-01)
	return router               // => hand the wired engine back to the caller
}

// => check serves one request in-process and prints what the handler did.
// => httptest keeps the whole exchange inside this process (co-09)
// => nothing here dials a port: there is no network call at all
func check(router *gin.Engine, method string, target string) { // => method and path name the request
	// => NewRequest builds a server-side request without a client socket
	req := httptest.NewRequest(method, target, nil) // => nil body: GET carries no payload
	// => the recorder captures status, headers, and body in memory
	w := httptest.NewRecorder() // => in-memory response: nothing leaves the process
	// => ServeHTTP runs routing, handlers, and middleware exactly as live
	router.ServeHTTP(w, req) // => the full gin pipeline, minus the socket (co-09)
	// => Code is the numeric status; Body holds the exact bytes written
	fmt.Println(method, target, "->", w.Code, w.Body.String()) // => one golden line per request (co-04)
}

func main() {
	// => build once, check twice: wiring stays separate from traffic
	router := newRouter() // => the service under test, built by its constructor
	// => the known route answers 200 with the greeting contract
	check(router, "GET", "/hello") // => Output: GET /hello -> 200 {"message":"hello, gin"}
	// => unknown paths fall through to gin's 404: a defined absence (co-05)
	check(router, "GET", "/goodbye") // => Output: GET /goodbye -> 404 404 page not found
}
