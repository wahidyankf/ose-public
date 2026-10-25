// => Example 11: Custom Validator Names a Rule.
// => Built-in tags cover common shapes, but domain rules need names of
// => their own. This example registers a weekday validator, binds three
// => schedules, and shows the custom rule rejecting a weekend the way min
// => rejects a short name.
package main

import (
	"fmt"                                    // => prints each in-process check result
	"github.com/gin-gonic/gin"               // => binding with a registered custom rule (co-10)
	"github.com/gin-gonic/gin/binding"       // => reaches the underlying validator engine
	"github.com/go-playground/validator/v10" // => the rule function signature
	"net/http"                               // => status codes for success and failure (co-04)
	"net/http/httptest"                      // => in-process request and recorder (co-09)
	"strings"                                // => builds request bodies from fixed strings
)

// => Schedule is a delivery promise: an order on a weekday.
// => the weekday tag is custom: it names a rule this file defines (co-10)
type Schedule struct { // => domain rules sit beside built-in tags
	OrderID string `json:"order_id" binding:"required"`    // => every schedule names its order
	Day     string `json:"day" binding:"required,weekday"` // => weekday is registered below
}

// => weekday rejects Saturday and Sunday by their three-letter names.
// => validator.Func receives the field and returns true when it holds
func weekday(fl validator.FieldLevel) bool { // => FieldLevel carries the field value
	switch fl.Field().String() { // => the Day string, exactly as sent
	case "Sat", "Sun": // => the two days this service never delivers
		return false // => invalid: binding fails like any built-in rule
	}
	return true // => Mon through Fri pass the custom rule
}

// => schedule binds a delivery promise with the custom rule enforced.
// => the registration below makes weekday usable in binding tags
func schedule(c *gin.Context) { // => the handler only sees weekday schedules
	var in Schedule                               // => the target: zero Schedule until binding fills it
	if err := c.ShouldBindJSON(&in); err != nil { // => weekday failures land here too (co-10)
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad schedule"}) // => fixed envelope (co-04)
		return                                                        // => weekends never reach the logic below
	}
	c.JSON(http.StatusCreated, in) // => 201 with the accepted schedule (co-04)
}

// => newRouter registers the rule once, then wires the single route.
// => registration happens at startup: handlers only name the rule (co-10)
func newRouter() *gin.Engine { // => the engine under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => reach through gin to validator: the engine is shared process-wide
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok { // => gin exposes its validator
		// => RegisterValidation names the function for the weekday tag
		_ = v.RegisterValidation("weekday", weekday) // => ignore dupes: registered once here
	}
	router.POST("/schedules", schedule) // => one path, custom rule on the struct
	return router                       // => hand the wired engine back
}

// => check serves one POST with the given body and prints status with body.
func check(router *gin.Engine, body string) { // => the body string is the variable
	req := httptest.NewRequest("POST", "/schedules", strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                        // => JSON binder, explicitly
	w := httptest.NewRecorder()                                               // => in-memory response capture
	router.ServeHTTP(w, req)                                                  // => the custom rule runs inside binding
	fmt.Println("POST /schedules", body, "->", w.Code, w.Body.String())       // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => a weekday passes the custom rule like any built-in tag
	check(router, `{"order_id":"o1","day":"Mon"}`) // => Output: POST /schedules {"order_id":"o1","day":"Mon"} -> 201 {"order_id":"o1","day":"Mon"}
	// => Saturday trips weekday exactly the way min trips a short name (co-10)
	check(router, `{"order_id":"o2","day":"Sat"}`) // => Output: POST /schedules {"order_id":"o2","day":"Sat"} -> 400 {"error":"bad schedule"}
	// => a missing order still fails required: custom and built-in mix freely
	check(router, `{"day":"Tue"}`) // => Output: POST /schedules {"day":"Tue"} -> 400 {"error":"bad schedule"}
}
