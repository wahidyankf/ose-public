// => Example 4: Method and Path Pick the Handler.
// => The method is half the address: the same path can create, read, replace,
// => and delete depending on the verb. This example serves four methods on
// => one notes path, answers 405 for a fifth, and proves each verb reaches
// => its own handler.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => method-based routing on one path (co-01)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => newRouter wires four verbs on /notes plus the 405 switch for the rest.
// => one path, four handlers: the method disambiguates (co-01)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => gin answers 405 instead of 404 when the path exists for others
	router.HandleMethodNotAllowed = true // => wrong verb becomes 405, not 404 (co-05)
	// => each verb gets its own small handler: no method switch inside
	router.GET("/notes", func(c *gin.Context) { c.String(200, "list notes") })    // => read the collection
	router.POST("/notes", func(c *gin.Context) { c.String(201, "note created") }) // => 201: something new exists (co-04)
	router.PUT("/notes", func(c *gin.Context) { c.String(200, "note replaced") }) // => replace the whole entry
	router.DELETE("/notes", func(c *gin.Context) { c.String(204, "") })           // => 204: gone, nothing to say
	return router                                                                 // => hand the wired engine back
}

// => check serves one request in-process and prints method, status, and body.
// => the method is the variable under test here, not the path
func check(router *gin.Engine, method string) { // => four verbs plus one intruder
	// => NewRequest takes the method first: same path every time
	req := httptest.NewRequest(method, "/notes", nil) // => fixed path, varying verb
	w := httptest.NewRecorder()                       // => in-memory response capture
	router.ServeHTTP(w, req)                          // => routing picks by method plus path
	// => the body is empty for 204: only print it when something was written
	line := fmt.Sprintf("%s /notes -> %d", method, w.Code) // => status core: always present
	if w.Body.String() != "" {                             // => bodies print after a space, never a trailing one
		line += " " + w.Body.String() // => non-empty bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => each verb reaches its own handler with its own status
	check(router, "GET")    // => Output: GET /notes -> 200 list notes
	check(router, "POST")   // => Output: POST /notes -> 201 note created
	check(router, "PUT")    // => Output: PUT /notes -> 200 note replaced
	check(router, "DELETE") // => Output: DELETE /notes -> 204
	// => PATCH exists nowhere here: 405 names the allowed set instead (co-05)
	check(router, "PATCH") // => Output: PATCH /notes -> 405 405 method not allowed
}
