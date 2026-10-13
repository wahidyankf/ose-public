// Example 56: net/http/httptest -- The In-Process TestClient.
//
// This app.py is unremarkable on purpose -- the interesting part is the
// httptest machinery: httptest.NewRecorder drives newHandler() WITHOUT a
// real socket, yet through the exact same routing/validation stack curl
// would travel. Run the server, or run the in-process suite:
//
//	go run .                          # => serve on 127.0.0.1:8000 like every example
//	go run . selftest                 # => the httptest suite: create, list, isolation -- no socket
//	curl -X POST http://127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json"     // => bodies in both directions ride on the stdlib encoder
	"fmt"               // => the selftest's progress lines to stdout
	"log"               // => Fatal() for the ListenAndServe startup error
	"net/http"          // => the stdlib server: mux, handlers, statuses
	"net/http/httptest" // => the Go analogue of FastAPI's TestClient: no socket, same stack
	"os"                // => reads os.Args for the optional "selftest" verb
	"strings"           // => builds POST bodies and checks the isolation proof below
	"sync"              // => net/http serves handlers on their own goroutines; the map needs a lock
)

// task is the stored shape: the id the store assigned plus the title.
type task struct { // => one struct for storage AND the wire -- deliberately small
	ID    int    `json:"id"`    // => assigned by the store, echoed on create
	Title string `json:"title"` // => the single client-supplied field
} // => task closes

var (
	storeMu sync.RWMutex     // => POST writes and GET reads race on the same map without this
	tasks   = map[int]task{} // => id -> task; PROCESS-side memory, reset per selftest case
	nextID  = 1              // => the next id to assign; guarded by storeMu like the map
) // => the store block closes

// resetStore empties the map: the fixture analogue -- a FRESH store before every case.
func resetStore() { // => co-22: isolation lives HERE, not in the handlers
	storeMu.Lock()         // => exclusive: no handler may observe a half-reset map
	defer storeMu.Unlock() // => released on return, even if the block below ever grew
	tasks = map[int]task{} // => drop every row the previous case wrote
	nextID = 1             // => ids restart, so assertions stay deterministic
} // => resetStore ends: each case below starts from the identical empty world

// writeJSON centralizes every response this example sends.
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one serialization path
	w.Header().Set("Content-Type", "application/json") // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                              // => the status the client checks first (co-03)
	_ = json.NewEncoder(w).Encode(payload)             // => one JSON document onto the wire
} // => writeJSON ends

// createTask stores one title and echoes the id the store assigned.
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	defer r.Body.Close() // => always release the request body, valid or not
	var body struct {    // => the anonymous request shape: exactly one field
		Title string `json:"title"` // => presence-checked by hand below
	} // => the request shape closes
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Title) == "" { // => one combined guard
		// => a parse failure OR a blank title both land here: this suite's focus
		// => is the httptest plumbing, so validation stays a single branch
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "title is required"}) // => 422, one shape
		return                                                                                        // => early return: the store below only runs for valid bodies
	} // => the invalid-body branch ends
	storeMu.Lock()                             // => the write lock: no GET may read mid-insert
	id := nextID                               // => claim the next id while holding the lock
	nextID++                                   // => advance before releasing, so no id is ever reused
	created := task{ID: id, Title: body.Title} // => the stored value, id assigned by THIS store
	tasks[id] = created                        // => the write the list below will observe
	storeMu.Unlock()                           // => release: GETs may now see the new row
	writeJSON(w, http.StatusCreated, created)  // => 201: echoes the id the store assigned
} // => createTask ends

// listTasks returns a JSON ARRAY, one element per row in id order.
func listTasks(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	storeMu.RLock()                    // => the read lock: many GETs may run together
	out := make([]task, 0, len(tasks)) // => an empty (non-nil) slice: encodes as [] when empty
	for id := 1; id < nextID; id++ {   // => id order: insertion order, proven end to end
		if found, ok := tasks[id]; ok { // => skip ids a reset (or a gap) left absent
			out = append(out, found) // => one element per stored row
		} // => the present-id branch ends
	} // => the scan loop ends
	storeMu.RUnlock()                // => release before encoding: out is a copy, safe to write
	writeJSON(w, http.StatusOK, out) // => the array shape a client can iterate directly
} // => listTasks ends

// newHandler assembles the routing table -- the SAME value curl AND httptest drive.
func newHandler() http.Handler { // => wiring, extracted so BOTH entry points share it
	mux := http.NewServeMux()                 // => the routing table: two routes, one store
	mux.HandleFunc("POST /tasks", createTask) // => co-08: a handler for creating a task
	mux.HandleFunc("GET /tasks", listTasks)   // => co-14: returns a JSON ARRAY, one element per row
	return mux                                // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends

// postJSON drives newHandler() IN-PROCESS: no uvicorn, no socket, no network.
func postJSON(handler http.Handler, body string) *httptest.ResponseRecorder { // => the suite's POST helper
	req := httptest.NewRequest(http.MethodPost, "/tasks", strings.NewReader(body)) // => a synthetic request, body included
	// => NewRequest builds the *http.Request the stack would have parsed off the wire
	req.Header.Set("Content-Type", "application/json") // => the same header curl would send
	rec := httptest.NewRecorder()                      // => captures status + headers + body in memory
	handler.ServeHTTP(rec, req)                        // => routing/validation run EXACTLY as over a socket
	return rec                                         // => the caller asserts on rec.Code and rec.Body
} // => postJSON ends

// getList drives a GET /tasks IN-PROCESS and decodes the array body.
func getList(handler http.Handler) (int, []task) { // => status plus the decoded array
	req := httptest.NewRequest(http.MethodGet, "/tasks", nil) // => a synthetic GET, no body
	rec := httptest.NewRecorder()                             // => the in-memory capture again
	handler.ServeHTTP(rec, req)                               // => the same mux curl would hit
	var out []task                                            // => nil when the body was []: len 0 either way
	_ = json.NewDecoder(rec.Body).Decode(&out)                // => decode the captured body for assertions
	return rec.Code, out                                      // => both facts the cases below assert on
} // => getList ends

// runSelfTests is the three-case suite: create, list-reflects, isolation.
func runSelfTests() { // => the pytest-file analogue, driven by httptest instead of TestClient
	handler := newHandler()                          // => the SAME instance every case drives -- state resets via resetStore
	resetStore()                                     // => a FRESH store before the first case, like the fixture's init_db
	rec := postJSON(handler, `{"title":"Buy milk"}`) // => in-process POST, no curl needed
	if rec.Code != http.StatusCreated {              // => co-03: matches the handler's 201
		log.Fatalf("create: status = %d, want 201", rec.Code) // => fail loudly with the exact mismatch
	} // => the status branch ends
	var created task                                    // => the decoded 201 body
	_ = json.NewDecoder(rec.Body).Decode(&created)      // => the body round-trips through real validation
	if created.Title != "Buy milk" || created.ID != 1 { // => the echo proves the store assigned id 1
		log.Fatalf("create: body = %+v, want id 1 Buy milk", created) // => the exact mismatch
	} // => the create-case branch ends
	fmt.Println("ok: create returns 201 with the stored id")                                                // => one progress line per passing case
	resetStore()                                                                                            // => FRESH again before the second case
	_ = postJSON(handler, `{"title":"Buy milk"}`)                                                           // => grows the list this case itself sees
	_ = postJSON(handler, `{"title":"Walk dog"}`)                                                           // => a second row, same isolated store
	code, out := getList(handler)                                                                           // => reads back everything this case just wrote
	if code != http.StatusOK || len(out) != 2 || out[0].Title != "Buy milk" || out[1].Title != "Walk dog" { // => insertion order
		log.Fatalf("list: code = %d out = %+v, want two titles in order", code, out) // => the exact mismatch
	} // => the list-case branch ends
	fmt.Println("ok: list reflects created tasks in order") // => the second progress line
	resetStore()                                            // => FRESH again: proves the reset genuinely isolates
	code, out = getList(handler)                            // => runs AFTER the two cases above
	if code != http.StatusOK || len(out) != 0 {             // => this case creates nothing, so the list starts empty
		// => if a previous case's rows had leaked in, this list would NOT be empty
		log.Fatalf("isolation: code = %d out = %+v, want empty", code, out) // => the exact mismatch
	} // => the isolation branch ends
	fmt.Println("ok: each case gets an isolated store") // => the third progress line
} // => runSelfTests ends: three cases, one shared handler, fresh state each time

func main() { // => two entry points, one binary
	if len(os.Args) > 1 && os.Args[1] == "selftest" { // => `go run . selftest`: the httptest suite, no socket
		runSelfTests() // => in-process cases via httptest, the TestClient analogue (co-22)
		return         // => exit after the suite: nothing listens in this mode
	} // => the selftest branch ends
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light for serve mode
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
