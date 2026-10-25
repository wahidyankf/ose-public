// => Example 47: Go Test Checks a Router (application).
// => The router under test lives here, built by a constructor the test file
// => calls. Keeping it in app.go means go test compiles the service without
// => a main function: the test binary supplies its own entry point.
package main

import (
	"github.com/gin-gonic/gin" // => the router under test (co-09)
)

// => NewRouter wires the greeting route the test cases serve.
// => exported so the test in app_test.go builds it directly
func NewRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                         // => silence the debug banner for test output
	router := gin.New()                               // => bare engine: no hidden middleware
	router.GET("/hello/:name", func(c *gin.Context) { // => the route under test
		c.JSON(200, gin.H{"message": "hello, " + c.Param("name")}) // => the contract under test (co-04)
	})
	return router // => hand the wired engine back
}
