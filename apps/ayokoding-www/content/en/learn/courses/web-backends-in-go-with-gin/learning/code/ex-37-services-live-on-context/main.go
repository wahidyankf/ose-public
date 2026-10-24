// => Example 37: Services Live on Context.
// => Middleware can inject the service each request needs, so handlers pull
// => dependencies from the context instead of globals. This example injects
// => a greeter service for every request and prints the greeting it renders
// => for two languages.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => middleware injection into the context (co-06)
	"net/http/httptest"        // => in-process request and recorder (co-09)
)

// => greeter renders hello in one language per instance.
// => a service with state (the language) and one method using it
type greeter struct { // => small services beat big frameworks
	lang string // => en or id: chosen once per instance
}

// => hello renders the greeting for a name in the service language.
func (g *greeter) hello(name string) string { // => the method handlers call
	if g.lang == "id" { // => Indonesian when configured so
		return "halo, " + name // => the second language this demo speaks
	}
	return "hello, " + name // => English by default
}

// => inject stores one greeter on every request context.
// => c.Set publishes the service; handlers MustGet it below (co-06)
func inject(g *greeter) gin.HandlerFunc { // => the service arrives pre-built
	return func(c *gin.Context) { // => gin calls this before each handler
		c.Set("greeter", g) // => publish under a fixed key
		c.Next()            // => handlers run with the service available
	}
}

// => greet pulls the injected greeter and renders its answer.
// => MustGet panics when the key is missing: wiring bugs surface fast
func greet(c *gin.Context) { // => the handler assumes the service exists
	// => the type assertion recovers the concrete service from any
	g := c.MustGet("greeter").(*greeter)    // => panics loudly when unwired (co-06)
	c.String(200, g.hello(c.Param("name"))) // => the service renders, the handler serves
}

// => newRouter injects one greeter for every route it wires.
// => swapping "en" for "id" here re-languages the whole service
func newRouter(lang string) *gin.Engine { // => the language arrives at startup
	gin.SetMode(gin.TestMode)         // => silence the debug banner for golden output
	router := gin.New()               // => bare engine: middleware added by hand
	g := &greeter{lang: lang}         // => the one shared service instance
	router.Use(inject(g))             // => every request below carries it (co-06)
	router.GET("/hello/:name", greet) // => one route, service-rendered
	return router                     // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the name is the variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => injection runs before the handler
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	// => English service: every answer renders in English
	en := newRouter("en")    // => one instance, one language
	check(en, "/hello/Sari") // => Output: GET /hello/Sari -> 200 hello, Sari
	// => Indonesian service: identical wiring, different tongue (co-06)
	id := newRouter("id")    // => the same constructor, another instance
	check(id, "/hello/Sari") // => Output: GET /hello/Sari -> 200 halo, Sari
}
