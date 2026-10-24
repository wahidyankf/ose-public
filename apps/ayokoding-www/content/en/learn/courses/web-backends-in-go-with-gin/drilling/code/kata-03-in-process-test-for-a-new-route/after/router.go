// => Kata 3 solution: the doubling route, unchanged.
// => The route needed no fix, only proof: the test file beside it serves
// => two subtests in-process and logs the contract each proves.
package main

import (
	"fmt"                      // => parses the doubled value
	"github.com/gin-gonic/gin" // => the router under test
)

// => NewRouter wires the doubling route the tests prove.
// => exported so router_test.go builds it directly
func NewRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode)                       // => silence the debug banner for test output
	router := gin.New()                             // => bare engine: no hidden middleware
	router.GET("/double/:n", func(c *gin.Context) { // => the proven route
		n := 0                               // => the parsed value, or zero when unparseable
		fmt.Sscanf(c.Param("n"), "%d", &n)   // => one integer from the path
		c.JSON(200, gin.H{"doubled": n * 2}) // => the contract under test
	})
	return router // => hand the wired engine back
}
