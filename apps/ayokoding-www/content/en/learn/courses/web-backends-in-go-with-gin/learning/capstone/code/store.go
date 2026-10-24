// => Capstone store: orders behind a memory repository.
// => The routes in main.go never touch a map directly: every read and
// => write crosses the MemoryStore below. Swapping this file for SQL keeps
// => every route, test, and golden byte identical.
package main

// => Order is the stored shape: identity, contents, and lifecycle state.
// => json tags fix the wire names the routes and tests share (co-15)
type Order struct { // => the domain type every layer trades in
	ID     string `json:"id"`     // => the order key, echoed back untouched
	Item   string `json:"item"`   // => what was ordered, a plain string
	Qty    int    `json:"qty"`    // => how many: an int, never a string
	Status string `json:"status"` // => placed, paid, shipped, or cancelled
}

// => MemoryStore keeps orders in a map with insertion order beside it.
// => keys preserves arrival order: List stays golden-stable (co-06)
type MemoryStore struct { // => the test double that behaves like a table
	rows map[string]Order // => id to Order, the actual storage
	keys []string         // => insertion order, kept beside the map
}

// => NewMemoryStore builds an empty store: tests start here every time.
// => construction keeps tests isolated: no shared state (co-09)
func NewMemoryStore() *MemoryStore { // => the fixture constructor
	return &MemoryStore{rows: map[string]Order{}, keys: []string{}} // => empty rows, empty order
}

// => List returns every order in insertion order.
// => empty slice, never nil: clients always see an array
func (m *MemoryStore) List() []Order { // => the full collection, ordered
	out := []Order{}           // => start empty: filters remove, never invent
	for _, k := range m.keys { // => insertion order, not map order
		out = append(out, m.rows[k]) // => stable sequence every run
	}
	return out // => the ordered collection
}

// => Get returns one order and whether it exists.
// => the comma-ok idiom, lifted up for the routes to branch on
func (m *MemoryStore) Get(id string) (Order, bool) { // => one order plus presence
	o, ok := m.rows[id] // => map lookup with presence
	return o, ok        // => callers branch on ok, like maps do
}

// => Save inserts or replaces one order, tracking new ids in order.
// => upsert keeps creation one call: PUT-like semantics on POST
func (m *MemoryStore) Save(o Order) Order { // => store and echo what was stored
	if _, ok := m.rows[o.ID]; !ok { // => first sight of this id
		m.keys = append(m.keys, o.ID) // => remember the arrival order
	}
	m.rows[o.ID] = o // => store (or overwrite) the order
	return o         // => echo exactly what the store holds
}

// => SetStatus moves one order to a new lifecycle state.
// => false means unknown: the route answers 404 from this
func (m *MemoryStore) SetStatus(id string, status string) (Order, bool) { // => id plus the new state
	o, ok := m.rows[id] // => the order must exist before it can move
	if !ok {            // => unknown ids move nothing
		return Order{}, false // => zero order plus the absence
	}
	o.Status = status // => the transition happens here, nowhere else
	m.rows[id] = o    // => write the moved order back
	return o, true    // => the moved order plus the presence
}

// => Delete removes one order, reporting whether one was there.
// => true removed something: the route answers 204 from this
func (m *MemoryStore) Delete(id string) bool { // => remove and report
	if _, ok := m.rows[id]; !ok { // => absent ids delete nothing
		return false // => the route answers 404 from this
	}
	delete(m.rows, id)         // => remove the row itself
	kept := []string{}         // => rebuild the order without the id
	for _, k := range m.keys { // => survivors keep their relative order
		if k != id { // => the deleted id drops out
			kept = append(kept, k) // => keep the survivors in order
		}
	}
	m.keys = kept // => the order forgets the id too
	return true   // => something was removed
}
