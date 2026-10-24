// => Example 33: Errors Carry Status Codes.
// => Domain errors know their own status, so handlers return them instead of
// => mapping codes by hand. This example defines a status-carrying error,
// => attaches it to gin's error list, and lets one middleware turn every
// => such error into its owned status with the shared envelope.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => the context error list (co-05)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => splits the owned-status assertion below
)

// => appError is a domain failure that owns its HTTP status.
// => code travels with the error: handlers never switch on types (co-05)
type appError struct { // => status core: always present with the message
	status  int    // => the HTTP status this failure owns
	code    string // => the machine-readable name clients switch on
	message string // => the human sentence operators read
}

// => Error makes appError a real error: it prints as its message.
// => the error interface needs exactly this one method
func (e *appError) Error() string { // => message only: status travels beside, not inside
	return e.message // => logs read the sentence; clients read the envelope
}

// => missingWidget is the 404 this store raises for unknown ids.
func missingWidget(id string) *appError { // => constructors name failures at creation
	return &appError{status: 404, code: "no_widget", message: "no widget " + id} // => the absence owns 404 (co-05)
}

// => emptyName is the 422 this store raises for blank widget names.
func emptyName() *appError { // => policy failures own 422, not 400
	return &appError{status: 422, code: "empty_name", message: "name must not be empty"} // => valid shape, bad value
}

// => jsonErrors turns the last attached error into its owned response.
// => one middleware owns the mapping: handlers only attach (co-02, co-05)
func jsonErrors(c *gin.Context) { // => registered after the routes below? No: order matters
	c.Next()                // => handlers run first and attach their failures
	if len(c.Errors) == 0 { // => the happy path leaves the list empty
		return // => nothing failed: the handler already answered
	}
	// => Last surfaces the most recent failure: handlers attach in order
	last := c.Errors.Last()                 // => the error this request should answer
	if ae, ok := last.Err.(*appError); ok { // => domain errors own their status
		c.JSON(ae.status, gin.H{"error": gin.H{"code": ae.code, "message": ae.message}}) // => owned code, shared shape (co-04)
		return                                                                           // => answered from the error itself
	}
	// => unknown error kinds fall back to 500: never leak, never guess
	c.JSON(500, gin.H{"error": gin.H{"code": "internal", "message": "internal failure"}}) // => the safe default
}

// => show looks up one widget, attaching its absence instead of answering.
// => handlers describe failure; the middleware translates it (co-05)
func show(store map[string]string) gin.HandlerFunc { // => the store arrives pre-filled
	return func(c *gin.Context) { // => gin calls this per request
		v, ok := store[c.Param("id")] // => the lookup decides the branch
		if !ok {                      // => unknown ids attach, never answer here
			_ = c.Error(missingWidget(c.Param("id"))) // => attach and return: middleware answers
			return                                    // => the response is written by jsonErrors after Next
		}
		c.JSON(200, gin.H{"id": c.Param("id"), "value": v}) // => the happy path answers inline (co-04)
	}
}

// => create validates one name, attaching policy failures the same way.
func create(store map[string]string) gin.HandlerFunc { // => the store mutates across calls
	return func(c *gin.Context) { // => gin calls this per request
		name := strings.TrimSpace(c.PostForm("name")) // => surrounding spaces never count
		if name == "" {                               // => blank names break policy
			_ = c.Error(emptyName()) // => attach the 422 and stop
			return                   // => middleware answers after Next returns
		}
		store[name] = name                            // => the store gains the widget
		c.JSON(201, gin.H{"id": name, "value": name}) // => 201 with the stored shape (co-04)
	}
}

// => newRouter wires jsonErrors FIRST so it wraps every handler below.
// => middleware registered first runs first: errors need the outer seat
func newRouter(store map[string]string) *gin.Engine { // => the store arrives pre-filled
	gin.SetMode(gin.TestMode)               // => silence the debug banner for golden output
	router := gin.New()                     // => bare engine: middleware added by hand
	router.Use(jsonErrors)                  // => outer layer: translates after handlers run (co-02)
	router.GET("/widgets/:id", show(store)) // => absence attaches a 404
	router.POST("/widgets", create(store))  // => blank names attach a 422
	return router                           // => hand the wired engine back
}

// => check serves one request with form fields and prints the answer.
// => form bodies exercise the policy branch without JSON
func check(router *gin.Engine, method string, target string, form string) { // => empty form means no fields
	reader := strings.NewReader(form)                                         // => fixed bytes, no socket
	req := httptest.NewRequest(method, target, reader)                        // => server-side request, fixed body
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")       // => form binder, explicitly
	w := httptest.NewRecorder()                                               // => in-memory response capture
	router.ServeHTTP(w, req)                                                  // => attach-then-translate runs inside
	fmt.Println(method, target, "form=", form, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	store := map[string]string{"w1": "gear"} // => one widget exists from the start
	router := newRouter(store)               // => wiring separate from traffic, as always
	// => present widgets answer inline: the error list stays empty
	check(router, "GET", "/widgets/w1", "") // => Output: GET /widgets/w1 form=  -> 200 {"id":"w1","value":"gear"}
	// => unknown ids attach missingWidget: the middleware answers 404 (co-05)
	check(router, "GET", "/widgets/w9", "") // => Output: GET /widgets/w9 form=  -> 404 {"error":{"code":"no_widget","message":"no widget w9"}}
	// => blank names attach emptyName: the middleware answers 422
	check(router, "POST", "/widgets", "name=+") // => Output: POST /widgets form= name=+ -> 422 {"error":{"code":"empty_name","message":"name must not be empty"}}
}
