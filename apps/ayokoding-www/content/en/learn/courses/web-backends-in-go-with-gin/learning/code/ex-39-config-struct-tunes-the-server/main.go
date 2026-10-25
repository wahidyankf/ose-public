// => Example 39: Config Struct Tunes the Server.
// => Ports, names, and limits belong in one config struct, not scattered
// => literals. This example builds the same router with two configs and
// => prints how the service name and item limit change the answers.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => config-driven routes (co-06, co-15)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => Config names every knob the service reads: identity plus limits.
// => one struct, JSON-tagged: files and flags fill the same shape (co-15)
type Config struct { // => literals become fields with defaults
	ServiceName string `json:"serviceName"` // => who answers: shown on the status route
	MaxItems    int    `json:"maxItems"`    // => how many the catalog lists: the cap
}

// => newRouter wires the catalog routes around one config.
// => the config arrives built: handlers only read it (co-06)
func newRouter(cfg Config) *gin.Engine { // => tuning in, engine out
	gin.SetMode(gin.TestMode)                                 // => silence the debug banner for golden output
	router := gin.New()                                       // => bare engine: middleware added by hand
	items := []string{"bolt", "nut", "washer", "pin", "ring"} // => five items, always
	// => the status route names the build: operators read this first
	router.GET("/status", func(c *gin.Context) { c.JSON(200, gin.H{"service": cfg.ServiceName}) }) // => identity from config (co-04)
	// => the catalog caps at MaxItems: staging shows two, prod shows all
	router.GET("/items", func(c *gin.Context) { // => the limit is a field, not a literal
		list := items                 // => start with everything, then cap
		if len(list) > cfg.MaxItems { // => the config decides the view
			list = list[:cfg.MaxItems] // => head slice: stable order kept
		}
		c.JSON(200, gin.H{"service": cfg.ServiceName, "items": list}) // => name plus capped list (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => config shapes every answer
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => staging config: two items under a staging name
	staging := newRouter(Config{ServiceName: "shop-staging", MaxItems: 2}) // => small view, test name
	check(staging, "/status")                                              // => Output: GET /status -> 200 {"service":"shop-staging"}
	check(staging, "/items")                                               // => Output: GET /items -> 200 {"items":["bolt","nut"],"service":"shop-staging"}
	// => production config: the full catalog under the real name (co-06)
	prod := newRouter(Config{ServiceName: "shop", MaxItems: 10}) // => full view, real name
	check(prod, "/status")                                       // => Output: GET /status -> 200 {"service":"shop"}
	check(prod, "/items")                                        // => Output: GET /items -> 200 {"items":["bolt","nut","washer","pin","ring"],"service":"shop"}
}
