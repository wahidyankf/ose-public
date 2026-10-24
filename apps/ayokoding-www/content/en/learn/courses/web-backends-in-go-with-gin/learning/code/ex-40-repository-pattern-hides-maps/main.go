// => Example 40: Repository Pattern Hides Maps.
// => A repository interface hides whether orders live in a map, a file, or a
// => database. This example serves full order CRUD through an
// => OrderRepository with a memory implementation, printing each
// => operation's answer.
package main

import (
	"fmt"                      // => prints each in-process check result
	"github.com/gin-gonic/gin" // => CRUD routes over the repository (co-06)
	"net/http"                 // => status codes across the CRUD set (co-04)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"strings"                  // => builds request bodies from fixed strings
)

// => Order is the stored shape: id, item, and count.
// => the repository trades in Orders, never in JSON or maps (co-15)
type Order struct { // => the domain type every layer shares
	ID    string `json:"id"`
	Item  string `json:"item"`
	Count int    `json:"count"`
}

// => OrderRepository is the persistence contract: four operations, no storage.
// => SQL implements this tomorrow; handlers never change (co-06)
type OrderRepository interface { // => the seam around all storage
	List() []Order               // => every order, stable order
	Get(id string) (Order, bool) // => one order plus whether it exists
	Save(o Order) Order          // => insert or replace, then echo
	Delete(id string) bool       // => remove, reporting whether one was there
}

// => memoryOrders keeps orders in a map behind the repository contract.
// => maps are the honest test double: fast, resettable, in-process
type memoryOrders struct { // => the implementation handlers never name
	rows map[string]Order // => id to Order, insertion order untracked
	keys []string         // => insertion order, kept beside the map
}

// => List returns every order in insertion order.
// => sorting by insertion keeps golden output stable across runs
func (m *memoryOrders) List() []Order { // => the full collection, ordered
	out := []Order{} // => empty slice, never nil: clients see []
	// => nil would marshal as null: the literal keeps the array shape
	// => maps iterate randomly: keys restores the order rows were saved
	for _, k := range m.keys { // => insertion order, not map order
		out = append(out, m.rows[k]) // => stable sequence every run
	}
	return out // => the ordered collection
}

// => Get returns one order and whether it exists.
// => Lifting the comma-ok idiom keeps handlers free of map mechanics.
func (m *memoryOrders) Get(id string) (Order, bool) { // => the comma-ok idiom, lifted up
	o, ok := m.rows[id] // => map lookup with presence
	return o, ok        // => callers branch on ok, like maps do
}

// => Save inserts or replaces one order, tracking new ids in order.
// => One verb for both keeps the route table small: POST means store.
func (m *memoryOrders) Save(o Order) Order { // => upsert: create and update are one call
	if _, ok := m.rows[o.ID]; !ok { // => first sight of this id
		m.keys = append(m.keys, o.ID) // => remember the arrival order
	}
	m.rows[o.ID] = o // => store (or overwrite) the order
	// => maps forget insertion: keys remembers what rows cannot
	return o // => echo what was stored
}

// => Delete removes one order, reporting whether one was there.
// => The boolean lets the handler choose 204 from 404 directly.
func (m *memoryOrders) Delete(id string) bool { // => true removed something, false was absent
	if _, ok := m.rows[id]; !ok { // => absent ids delete nothing
		return false // => the handler answers 404 from this
	}
	delete(m.rows, id) // => remove the row itself
	// => keys still names the id: rebuild the order without it
	kept := []string{}         // => rebuild the order without the id
	for _, k := range m.keys { // => stable order survives deletion
		// => the deleted id drops out: survivors keep their relative order
		if k != id { // => every other id stays
			kept = append(kept, k) // => keep the survivors in order
		}
	}
	m.keys = kept // => the order forgets the id too
	return true   // => something was removed
}

// => newRouter wires CRUD routes against the repository interface.
// => OrderRepository (not *memoryOrders) is the parameter (co-06)
func newRouter(r OrderRepository) *gin.Engine { // => storage arrives behind the seam
	gin.SetMode(gin.TestMode)                                             // => silence the debug banner for golden output
	router := gin.New()                                                   // => bare engine: no hidden middleware
	router.GET("/orders", func(c *gin.Context) { c.JSON(200, r.List()) }) // => the ordered listing (co-04)
	router.POST("/orders", func(c *gin.Context) {                         // => create or replace
		var o Order                                                // => the bound shape, validated below
		if err := c.ShouldBindJSON(&o); err != nil || o.ID == "" { // => malformed or id-less fails
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad order"}) // => 400, fixed envelope (co-05)
			return                                                     // => invalid input never reaches the repository
		}
		// => Save echoes the stored shape: the receipt matches the shelf
		c.JSON(http.StatusCreated, r.Save(o)) // => 201 with the stored order
	})
	router.GET("/orders/:id", func(c *gin.Context) { // => read one order
		o, ok := r.Get(c.Param("id")) // => presence decides the code
		if !ok {                      // => unknown ids are 404, not empty 200
			c.JSON(http.StatusNotFound, gin.H{"error": "no order"}) // => 404, fixed envelope (co-05)
			return                                                  // => absence stops here
		}
		c.JSON(200, o) // => the found order (co-04)
	})
	router.DELETE("/orders/:id", func(c *gin.Context) { // => remove one order
		if !r.Delete(c.Param("id")) { // => false means nothing was there
			c.JSON(http.StatusNotFound, gin.H{"error": "no order"}) // => same 404 as the read path
			return                                                  // => absence stops here too
		}
		c.Status(http.StatusNoContent) // => 204: gone, nothing to say
	})
	return router // => hand the wired engine back
}

// => check serves one request with a body and prints method, status, body.
// => bodies print only when present: 204 leaves no trailing space
func check(router *gin.Engine, method string, target string, body string) { // => method, path, and payload vary
	req := httptest.NewRequest(method, target, strings.NewReader(body)) // => fixed bytes, no socket
	req.Header.Set("Content-Type", "application/json")                  // => JSON bodies bind below
	w := httptest.NewRecorder()                                         // => in-memory response capture
	router.ServeHTTP(w, req)                                            // => repository CRUD runs inside
	line := fmt.Sprintf("%s %s -> %d", method, target, w.Code)          // => status core: always present
	if w.Body.String() != "" {                                          // => 204 prints the code alone
		line += " " + w.Body.String() // => bodies join with one space
	}
	fmt.Println(line) // => one golden line, never a trailing space
}

func main() {
	repo := &memoryOrders{rows: map[string]Order{}, keys: []string{}} // => empty store at startup
	router := newRouter(repo)                                         // => handlers see the interface only (co-06)
	// => the empty store lists []: an array, never null
	check(router, "GET", "/orders", "") // => Output: GET /orders -> 200 []
	// => saving creates: 201 with the stored order
	check(router, "POST", "/orders", `{"id":"o1","item":"book","count":2}`) // => Output: POST /orders -> 201 {"id":"o1","item":"book","count":2}
	// => saving again replaces: same id, new count (upsert, not duplicate)
	check(router, "POST", "/orders", `{"id":"o1","item":"book","count":5}`) // => Output: POST /orders -> 201 {"id":"o1","item":"book","count":5}
	// => the listing holds one order: insertion order, stable output
	check(router, "GET", "/orders", "") // => Output: GET /orders -> 200 [{"id":"o1","item":"book","count":5}]
	// => deleting answers 204 with no body: gone is the message
	check(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 204
	// => deleting again finds nothing: the same 404 as the read path
	check(router, "DELETE", "/orders/o1", "") // => Output: DELETE /orders/o1 -> 404 {"error":"no order"}
}
