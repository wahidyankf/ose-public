// => Kata 3 starter: a route with no test.
// => The doubling route serves but nothing proves it: no test file exists.
// => Your task: add router_test.go with two subtests (one doubling case,
// => one unknown path) served through httptest, logging each contract.
package main

import (
	"fmt"                      // => parses the doubled value (starter demo)
	"github.com/gin-gonic/gin" // => the router your tests will build
	"net/http/httptest"        // => you will serve through this in tests
)

// => NewRouter wires the doubling route your tests will prove.
// => exported so the test file you write builds it directly
func NewRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for test output
	router := gin.New()       // => bare engine: no hidden middleware
	// => the route your tests will build through NewRouter
	router.GET("/double/:n", func(c *gin.Context) { // => the untested route
		n := 0                               // => the parsed value, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n)   // => one integer from the path
		c.JSON(200, gin.H{"doubled": n * 2}) // => the contract to prove
	})
	return router // => hand the wired engine back
}
