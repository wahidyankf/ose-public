// Example 47: An explicit constructor takes the database.
//
// The Python track wires the connection with FastAPI's Depends(): the
// framework calls a generator dependency per request and injects the yielded
// connection into the handler's signature -- the handler never opens or
// closes anything itself. Go has no DI framework, so the same lifecycle rule
// is spelled as ordinary construction: main opens ONE *sql.DB pool, passes it
// explicitly to NewStore, and the handler methods receive an already-open
// store instead of opening their own. The wiring is visible in main -- no
// registry, no decorator, no generator -- and SQL still lives only in the
// store methods, never in the HTTP layer.
//
// Try:
// curl -s 127.0.0.1:8000/tasks
// => [{"id":1,"title":"Buy milk"},{"id":2,"title":"Walk dog"}] -- via the constructed store
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool type the constructor ACCEPTS -- never opened inside a handler
	"encoding/json" // => the handler's only vocabulary: bytes out, no query syntax
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => the handler's only server vocabulary: mux, methods, statuses
	"os"            // => NEEDED by setup; no handler method below calls Remove

	_ "modernc.org/sqlite" // => the pure-Go driver: registered once for the store, never named by handlers
) // => the import block closes -- handlers below never open or close a connection themselves

// => the row shape crossing the store boundary: plain data, no driver residue
type taskRow struct {
	ID    int    `json:"id"`    // => the primary key, as plain data
	Title string `json:"title"` // => the one data column, as plain data
} // => the struct closes: data only, no query syntax attached

// ---------------------------------------------------------------------------
// Store layer -- the constructor takes an already-open *sql.DB, and every
// method below receives that pool instead of opening its own. SQL still lives
// only here, never in the HTTP layer.
// ---------------------------------------------------------------------------

// => Store is the repository object: it HOLDS the pool its constructor was
// => given. No method below calls sql.Open -- the lifecycle belongs to main.
type Store struct {
	db *sql.DB // => the already-open pool, supplied once at construction time
} // => the struct closes: one field, the whole dependency, explicit

// => NewStore is the explicit constructor: no framework, no registry -- the
// => caller hands over a live pool and gets a usable store back. A nil pool
// => would fail at first use, so construction-time wiring IS the check.
func NewStore(db *sql.DB) *Store { // => co-23: the Go spelling of Depends() -- wiring as a plain function call
	return &Store{db: db} // => store the dependency; every method below reads it, none opens it
} // => NewStore ends: one line, fully visible in main below

// => initSchema creates the table and seeds two starter rows through the
// => store's OWN pool -- setup travels the same constructed path as requests
func (s *Store) initSchema() { // => a method, so even setup uses the constructed dependency
	if _, err := s.db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"); err != nil { // => defines the table's shape once, for the whole example
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	if _, err := s.db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog"); err != nil { // => two seed rows so ListTasks below has something real to return
		log.Fatalf("seed tasks: %v", err) // => one "?" per value, bound positionally -- also ONLY here
	} // => the seed branch ends
} // => initSchema ends

// => ListTasks is the ONLY reader: it receives the already-open pool via the
// => struct field -- co-14 holds (SQL lives only here), while the open/close
// => lifecycle lives in main, exactly like the Depends() split
func (s *Store) ListTasks() ([]taskRow, error) { // => the constructed store answers, no connect()/close() inside
	rows, err := s.db.Query("SELECT id, title FROM tasks ORDER BY id") // => no connect() call here -- main already supplied the pool
	if err != nil {                                                    // => no WHERE clause -- returns every row, oldest first
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done

	out := []taskRow{} // => START as [] (not nil) so the empty table encodes as [], never null
	for rows.Next() {  // => one pass per row, oldest id first
		var t taskRow                                      // => the typed target each row scans into
		if err := rows.Scan(&t.ID, &t.Title); err != nil { // => column order matches the SELECT list above
			return nil, err // => propagate: a corrupt row is a 500, not a skip
		} // => the scan-failure branch ends
		out = append(out, t) // => grow the typed slice one row at a time
	} // => the row loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	return out, nil // => success: every caller gets taskRow, never driver rows
} // => ListTasks ends

// ---------------------------------------------------------------------------
// HTTP layer -- handlers are store METHODS: they call ListTasks on their
// receiver and never open, close, or name the driver. The wiring (which store
// serves which route) is a plain value in newHandler.
// ---------------------------------------------------------------------------

// => listTasksHandler serves GET /tasks through its receiver's store: one
// => method call, one error branch, one echo -- no sql.Open, no Close, no
// => query string anywhere in this function
func (s *Store) listTasksHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a handler for listing tasks, as a store method
	tasks, err := s.ListTasks() // => co-14: SQL still lives only in the store -- this call carries no query text
	if err != nil {             // => the pool, the query, or a scan failed -- the handler only knows THAT
		w.WriteHeader(http.StatusInternalServerError) // => 500 with no body -- this example's lesson is the wiring, not the envelope
		return                                        // => early return: the echo below only runs for a good read
	} // => the failure branch ends
	w.Header().Set("Content-Type", "application/json") // => response header first...
	body, _ := json.Marshal(tasks)                     // => []taskRow encodes as a JSON array directly
	_, _ = w.Write(body)                               // => ...onto the wire with the default 200 status
} // => listTasksHandler ends: never calls Open itself, never closes anything

// => newHandler takes the constructed store and wires its method as the route
// => -- the application-layer assembly point, visible and testable: pass a
// => different *sql.DB to NewStore and the same routes serve different data
func newHandler(store *Store) http.Handler { // => wiring accepts the dependency -- no global lookup, no registry
	mux := http.NewServeMux()                            // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks", store.listTasksHandler) // => the METHOD VALUE closes over this store's pool
	return mux                                           // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main passes the one constructed store below

func main() { // => the executable entry point: open, construct, seed, serve
	_ = os.Remove("tasks.db") // => start every run from a clean, deterministic file
	// => Remove ignores its error: a missing file is the normal first-run case

	db, err := sql.Open("sqlite", "file:tasks.db") // => ONE pool, opened here in main -- never inside a handler or method
	if err != nil {                                // => Open validates the name, not the file itself
		log.Fatalf("open db: %v", err) // => fail FAST at startup, not on the first real request
	} // => the open-failure branch ends
	defer db.Close()      // => main owns the lifecycle end to end: Close runs when the process exits
	db.SetMaxOpenConns(1) // => one writer-friendly connection: SQLite files dislike concurrent writers

	if err := db.Ping(); err != nil { // => Ping actually dials the file -- Open alone never touches it
		log.Fatalf("ping db: %v", err) // => fail FAST before ListenAndServe
	} // => the ping-failure branch ends

	store := NewStore(db)                                               // => co-23: explicit construction -- the framework call Depends() made is THIS line, by hand
	store.initSchema()                                                  // => fresh, seeded tasks.db for every run, through the constructed store
	log.Println("listening on 127.0.0.1:8000")                          // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler(store))) // => serve until interrupted
} // => main ends: open, construct, seed, serve -- the whole lifecycle in one place
