// => Example 16: Content Type Picks the Binder.
// => One handler can accept JSON, XML, or form bodies when the Content-Type
// => chooses the binder. This example binds the same Note struct three ways
// => and prints the struct each content type produces.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => ShouldBind selects by Content-Type (co-03, co-12)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => Note is the shared shape: three wire formats, one Go struct.
// => every format tag names the same two fields in its own syntax (co-15)
type Note struct { // => one struct, three spellings
	Title string `json:"title" xml:"title" form:"title" binding:"required"` // => all three binders fill Title
	Body  string `json:"body" xml:"body" form:"body"`                       // => Body stays optional everywhere
}

// => create binds whatever the Content-Type names and echoes the Note back.
// => ShouldBind (no suffix) switches on the request content type (co-12)
func create(c *gin.Context) { // => the handler never names a format
	var in Note // => the target: zero Note until binding fills it
	// => JSON, XML, and form all land in the same struct through one call
	if err := c.ShouldBind(&in); err != nil { // => a missing title fails every format alike
		c.JSON(400, gin.H{"error": "bad note"}) // => fixed envelope (co-04)
		return                                  // => unparseable bodies never reach the logic below
	}
	c.JSON(200, in) // => always JSON out: one response shape (co-04)
}

// => newRouter wires the single creation route this example serves.
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode)     // => silence the debug banner for golden output
	router := gin.New()           // => bare engine: no hidden middleware
	router.POST("/notes", create) // => one path, three body formats in (co-12)
	return router                 // => hand the wired engine back
}

// => check serves one POST with a body and type, then prints the answer.
// => the Content-Type is the binder switch: same handler, three paths
func check(router *gin.Engine, contentType string, body string) { // => type plus body vary together
	req := httptest.NewRequest("POST", "/notes", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", contentType)                           // => this header picks the binder
	w := httptest.NewRecorder()                                           // => in-memory response capture
	router.ServeHTTP(w, req)                                              // => ShouldBind switches inside
	fmt.Println(contentType, "->", w.Code, w.Body.String())               // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => JSON names fields with braces: the native tongue of this course
	check(router, "application/json", `{"title":"groceries","body":"milk"}`) // => Output: application/json -> 200 {"title":"groceries","body":"milk"}
	// => XML names the same fields with tags: the binder translates (co-12)
	check(router, "application/xml", `<Note><title>groceries</title><body>milk</body></Note>`) // => Output: application/xml -> 200 {"title":"groceries","body":"milk"}
	// => forms encode flatly: title=milk pairs, no nesting at all
	check(router, "application/x-www-form-urlencoded", `title=groceries&body=milk`) // => Output: application/x-www-form-urlencoded -> 200 {"title":"groceries","body":"milk"}
}
