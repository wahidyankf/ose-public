// => Capstone service: order tracking with five routes, validation,
// => structured errors, and a health check.
// => The demo below exercises every route in-process and prints one line
// => per leg. The test suite in orders_test.go proves the same contract
// => with go test subtests.
package main

import (
	"fmt"                      // => prints one line per demo leg
	"github.com/gin-gonic/gin" // => the service under demo (co-16)
	"net/http"                 // => status codes across the five routes (co-04)
	"net/http/httptest"        // => in-process demo traffic (co-09)
	"strings"                  // => builds the demo request bodies
)

// => createInput is the creation contract: item and quantity, both required.
// => validation tags reject bad bodies before the store sees them (co-10)
type createInput struct { // => the boundary shape for POST /orders
	ID   string `json:"id" binding:"required"`       // => identity is mandatory
	Item string `json:"item" binding:"required"`     // => contents are mandatory too
	Qty  int    `json:"qty" binding:"required,gt=0"` // => at least one: zero is not an order
}

// => statusInput is the transition contract: the next lifecycle state.
// => oneof bounds the workflow: placed, paid, shipped, cancelled
type statusInput struct { // => the boundary shape for PATCH status
	Status string `json:"status" binding:"required,oneof=placed paid shipped cancelled"` // => the four legal moves
}

// => fail writes the shared error envelope: code plus message, always.
// => one helper means every failure speaks the same shape (co-05)
func fail(c *gin.Context, status int, code string, message string) { // => status, machine code, human message
	// => the envelope never changes shape: only its fields vary
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}}) // => JSON even for failures (co-04)
}

// => NewRouter wires the five order routes plus health around the store.
// => exported so tests build the service without main (co-06)
func NewRouter(store *MemoryStore) *gin.Engine { // => the store arrives injected
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	router := gin.New()       // => bare engine: no hidden middleware
	// => creation validates, defaults the status, and answers 201
	router.POST("/orders", func(c *gin.Context) { // => route one: create
		var in createInput // => the bound shape, validated below
		// => missing id, item, or non-positive qty fails here (co-10)
		if err := c.ShouldBindJSON(&in); err != nil { // => first broken rule fails
			fail(c, http.StatusBadRequest, "bad_order", "send id, item, and positive qty") // => 400, fixed envelope
			return                                                                         // => invalid input never reaches the store
		}
		o := store.Save(Order{ID: in.ID, Item: in.Item, Qty: in.Qty, Status: "placed"}) // => new orders start placed
		c.JSON(http.StatusCreated, o)                                                   // => 201 with the stored order (co-04)
	})
	// => the listing answers insertion order: stable, golden-friendly
	router.GET("/orders", func(c *gin.Context) { c.JSON(200, store.List()) }) // => route two: list
	// => reads branch on presence: found echoes, missing 404s
	router.GET("/orders/:id", func(c *gin.Context) { // => route three: read one
		o, ok := store.Get(c.Param("id")) // => the lookup decides the code
		if !ok {                          // => unknown ids are 404, not empty 200
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => 404 names the absence
			return                                                              // => absence stops here
		}
		c.JSON(http.StatusOK, o) // => the found order (co-04)
	})
	// => status moves validate the transition, then persist it
	router.PATCH("/orders/:id/status", func(c *gin.Context) { // => route four: move state
		var in statusInput // => the bound transition, validated below
		// => unknown states fail oneof before the store is touched
		if err := c.ShouldBindJSON(&in); err != nil { // => bad transitions fail here
			fail(c, http.StatusUnprocessableEntity, "bad_status", "status must be placed, paid, shipped, or cancelled") // => 422, same envelope
			return                                                                                                      // => invalid transitions never reach the store
		}
		o, ok := store.SetStatus(c.Param("id"), in.Status) // => the move, persisted
		if !ok {                                           // => unknown ids move nothing
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => same 404 as the read path
			return                                                              // => absence stops here too
		}
		c.JSON(http.StatusOK, o) // => 200 with the moved order (co-04)
	})
	// => deletion answers 204 with no body: gone is the message
	router.DELETE("/orders/:id", func(c *gin.Context) { // => route five: cancel
		if !store.Delete(c.Param("id")) { // => false means nothing was there
			fail(c, http.StatusNotFound, "no_order", "no order "+c.Param("id")) // => same 404 as read and move
			return                                                              // => absence stops here as well
		}
		c.Status(http.StatusNoContent) // => 204: cancelled, nothing to say
	})
	// => health answers beside the versions: cheapest route in the service (co-14)
	router.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) }) // => the orchestrator polls here
	return router                                                                   // => the fully wired, immediately testable service
}

// => leg serves one demo request and prints method, status, and body.
// => bodies print only when present: 204 leaves no trailing space
func leg(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                  // => write bodies bind below
	w := httptest.NewRecorder()                                         // => in-memory response capture
	router.ServeHTTP(w, req)                                            // => the whole service runs per leg (co-09)
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code)          // => status core: always present
	if w.Body.String() != "" {                                          // => 204 prints the code alone
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	// => the demo store starts empty: every leg below earns its answer
	router := NewRouter(NewMemoryStore()) // => wiring separate from traffic, as always
	// => creation validates and defaults to placed: 201 with the order
	leg(router, "POST", "/orders", `{"id":"o1","item":"book","qty":2}`) // => Output: POST /orders -> 201 {"id":"o1","item":"book","qty":2,"status":"placed"}
	// => zero qty breaks gt=0: 400 blames the body, not the store
	leg(router, "POST", "/orders", `{"id":"o2","item":"pen","qty":0}`) // => Output: POST /orders -> 400 {"error":{"code":"bad_order","message":"send id, item, and positive qty"}}
	// => the listing holds one order: insertion order, stable output
	leg(router, "GET", "/orders", "") // => Output: GET /orders -> 200 [{"id":"o1","item":"book","qty":2,"status":"placed"}]
	// => the stored order reads back whole: status travelled with it
	leg(router, "GET", "/orders/o1", "") // => Output: GET /orders/o1 -> 200 {"id":"o1","item":"book","qty":2,"status":"placed"}
	// => paid is a legal move: 200 with the moved order
	leg(router, "PATCH", "/orders/o1/status", `{"status":"paid"}`) // => Output: PATCH /orders/o1/status -> 200 {"id":"o1","item":"book","qty":2,"status":"paid"}
	// => flying is not a state: oneof rejects it with 422
	leg(router, "PATCH", "/orders/o1/status", `{"status":"flying"}`) // => Output: PATCH /orders/o1/status -> 422 {"error":{"code":"bad_status","message":"status must be placed, paid, shipped, or cancelled"}}
	// => cancellation answers 204 with no body: gone is the message
	leg(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 204
	// => deleting again finds nothing: the same 404 as read and move
	leg(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 404 {"error":{"code":"no_order","message":"no order o1"}}
	// => health answers beside the orders: 200 with ok true
	leg(router, "GET", "/healthz", "") // => Output: GET /healthz -> 200 {"ok":true}
}
