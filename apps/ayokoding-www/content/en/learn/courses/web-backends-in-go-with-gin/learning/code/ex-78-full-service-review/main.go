// => Example 78: Full Service Review.
// => The course ends where services begin: one small service touching
// => routing, middleware, validation, responses, errors, and health
// => together. This example serves a two-item catalog with an id-stamping
// => layer, validated creation, JSON envelopes, and a health probe,
// => printing one line per capability.
package main

import (
	"fmt"                      // => prints one line per capability
	"github.com/gin-gonic/gin" // => the whole course in one service (co-16)
	"net/http"                 // => status codes across the service (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds the creation bodies
	"sync/atomic"              // => the race-free request counter (co-07)
)

// => Item is the catalog shape: validated on the way in, typed throughout.
// => binding tags guard creation: rules live with the shape (co-10, co-15)
type Item struct { // => the contract both routes share
	Name  string `json:"name" binding:"required,min=2"` // => present and spelled out
	Price int    `json:"price" binding:"required,gt=0"` // => present and positive
}

// => Service owns the catalog behind routes, middleware, and health.
// => constructor-built, interface-free: the review stays concrete (co-06)
type Service struct { // => the small service this course built toward
	items map[string]Item // => name to Item: the whole store
	ids   atomic.Int64    // => the request counter for the log lines
}

// => stamp numbers every request and logs its edges without timestamps.
// => the id rides the header: clients and logs agree (co-02, co-13)
func (s *Service) stamp(c *gin.Context) { // => the cross-cutting layer
	n := s.ids.Add(1)              // => req-1, req-2: sequential and deterministic
	id := fmt.Sprintf("req-%d", n) // => the human form of the counter
	c.Set("requestID", id)         // => handlers read the same id
	c.Header("X-Request-Id", id)   // => clients read it on the way out
	c.Next()                       // => the routes run under the stamp
}

// => fail writes the shared error envelope: code plus message, always.
// => one helper means every failure speaks the same shape (co-05)
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures (co-04)
}

// => NewService wires the catalog routes, the stamp layer, and health.
// => groups version the API: v1 today, v2 without touching v1 (co-11)
func NewService() *gin.Engine { // => the constructor under test
	gin.SetMode(gin.TestMode)                // => silence the debug banner for golden output
	s := &Service{items: map[string]Item{}}  // => empty catalog at startup
	router := gin.New()                      // => bare engine: middleware added by hand
	router.Use(s.stamp)                      // => every route below is stamped
	v1 := router.Group("/api/v1")            // => the versioned catalog (co-11)
	v1.POST("/items", func(c *gin.Context) { // => validated creation (co-10)
		var in Item                                   // => the bound shape, validated below
		if err := c.ShouldBindJSON(&in); err != nil { // => broken bodies fail here (co-03)
			fail(c, http.StatusBadRequest, "bad_item", "send name and positive price") // => 400, shared envelope
			return                                                                     // => invalid input never reaches the catalog
		}
		s.items[in.Name] = in          // => store the validated item
		c.JSON(http.StatusCreated, in) // => 201 with the stored shape (co-04)
	})
	v1.GET("/items/:name", func(c *gin.Context) { // => read one item back (co-01)
		it, ok := s.items[c.Param("name")] // => the lookup decides the code
		if !ok {                           // => unknown names are 404, not empty 200
			fail(c, http.StatusNotFound, "no_item", "no item "+c.Param("name")) // => 404, same envelope (co-05)
			return                                                              // => absence stops here
		}
		c.JSON(http.StatusOK, it) // => the found item (co-04)
	})
	router.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) }) // => the probe beside the versions (co-14)
	return router                                                                   // => the fully wired, immediately testable service
}

// => check serves one request with a body and prints id, status, and body.
// => every line carries the request id: observability is asserted too
func check(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	req := httptest.NewRequest(method, target, strings.NewReader(body))                              // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                                               // => creation bodies bind below
	w := httptest.NewRecorder()                                                                      // => the assertion surface
	router.ServeHTTP(w, req)                                                                         // => the whole service runs per line (co-09)
	line := fmt.Sprintf("%s %s id=%s -> %d", method, target, w.Header().Get("X-Request-Id"), w.Code) // => status core: always present
	if w.Body.String() != "" {                                                                       // => every answer here has a body
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	router := NewService() // => wiring separate from traffic, as always
	// => creation validates and stamps: 201 with req-1 on the side
	check(router, "POST", "/api/v1/items", `{"name":"bolt","price":4}`) // => Output: POST /api/v1/items id=req-1 -> 201 {"name":"bolt","price":4}
	// => bad creation fails validation: 400 with req-2, same envelope
	check(router, "POST", "/api/v1/items", `{"name":"x","price":0}`) // => Output: POST /api/v1/items id=req-2 -> 400 {"error":{"code":"bad_item","message":"send name and positive price"}}
	// => the stored item reads back: 200 with req-3
	check(router, "GET", "/api/v1/items/bolt", "") // => Output: GET /api/v1/items/bolt id=req-3 -> 200 {"name":"bolt","price":4}
	// => unknown items 404 with req-4: absence in the shared envelope
	check(router, "GET", "/api/v1/items/nut", "") // => Output: GET /api/v1/items/nut id=req-4 -> 404 {"error":{"code":"no_item","message":"no item nut"}}
	// => health answers beside the versions: 200 with req-5
	check(router, "GET", "/healthz", "") // => Output: GET /healthz id=req-5 -> 200 {"ok":true}
}
