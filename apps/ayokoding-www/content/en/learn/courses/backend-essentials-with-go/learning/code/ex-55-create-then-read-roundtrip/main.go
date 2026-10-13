// Example 55: Create Then Read -- A Persisted Round Trip.
//
// POST writes, then a SEPARATE GET reads the SAME id back -- proving the
// write genuinely reached storage, not just an in-memory echo. This batch
// keeps the store in a guarded map so the example stays dependency-free;
// the sqlite-backed equivalents already exist elsewhere in the course:
//
//	ID=$(curl -s -X POST http://127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
//	curl -i http://127.0.0.1:8000/tasks/$ID   # => 200, the SAME title back
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the only JSON vocabulary the standard library offers
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the entire server: mux, handlers, statuses
	"strconv"       // => the path id arrives as text; this converts it to an int
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too
	"sync"          // => net/http serves handlers on their own goroutines; the map needs a lock
)

// task is the stored shape: the id the store assigned plus the title.
type task struct { // => one struct for storage AND the wire -- this example is deliberately small
	ID    int    `json:"id"`    // => assigned by the store, echoed on create, read back on GET
	Title string `json:"title"` // => the single client-supplied field
} // => task closes: the whole persistence surface fits in two fields

var (
	storeMu sync.RWMutex     // => POST writes and GET reads race on the same map without this
	tasks   = map[int]task{} // => id -> task; PROCESS-side memory (capstone moves this to a shared DB)
	nextID  = 1              // => the next id to assign; guarded by storeMu like the map itself
	// => co-05 caveat: process-local state -- gone on restart, invisible to a
	// => second worker -- Example 80 makes that concrete with two processes
) // => the store block closes

// apiError is the one failure envelope shape this example returns.
type apiError struct { // => {"code":...,"message":...} -- co-11's two-key envelope
	Code    string `json:"code"`
	Message string `json:"message"`
} // => apiError closes

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"`
} // => errorEnvelope closes

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) { // => one serialization path for every response
	w.Header().Set("Content-Type", "application/json") // => the stdlib never sets this FOR you (co-09)
	w.WriteHeader(status)                              // => the status a client checks first (co-03)
	_ = json.NewEncoder(w).Encode(body)                // => one JSON document straight onto the wire
} // => writeJSON ends

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => co-11, co-03: shape + status
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}}) // => one line, every error
} // => writeError ends

// createTask is step one of the round trip: the write.
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	defer r.Body.Close() // => always release the request body, valid or not
	var body struct {    // => the anonymous request shape: exactly one field, presence-checked by hand
		Title string `json:"title"` // => an empty string still fails the check below
	} // => the request shape closes
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => streaming decode of the POST body
		writeError(w, http.StatusUnprocessableEntity, // => 422: well-formed HTTP, unreadable body
			"invalid_body", "invalid JSON body") // => the client-facing text for a parse failure
		return // => early return: nothing is stored on an undecodable body
	} // => the decode branch ends
	if strings.TrimSpace(body.Title) == "" { // => the presence check decoding will NEVER do for us
		writeError(w, http.StatusUnprocessableEntity, // => 422: present-but-empty is still missing
			"invalid_body", "title is required") // => the domain error, free of HTTP vocabulary underneath
		return // => early return: the store below only runs for valid bodies
	} // => the validation branch ends
	storeMu.Lock()                             // => the write lock: no GET may read mid-insert
	id := nextID                               // => claim the next id while holding the lock
	nextID++                                   // => advance the counter before releasing, so no id is ever reused
	created := task{ID: id, Title: body.Title} // => the stored value, id assigned by THIS store
	tasks[id] = created                        // => step one completes: the write genuinely lands in the map
	storeMu.Unlock()                           // => release: GETs may now observe the new row
	writeJSON(w, http.StatusCreated, created)  // => 201: echoes the id the store actually assigned
} // => createTask ends: the id below is what the read half will use

// getTask is step two of the round trip: the read.
func getTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	idText := r.PathValue("task_id") // => the {task_id} segment, still a string (co-12)
	// => the name inside PathValue MUST match the {task_id} placeholder below
	id, err := strconv.Atoi(idText) // => hand-typed conversion: text -> int
	if err != nil {                 // => "/tasks/abc" fails HERE, inside your own handler
		writeError(w, http.StatusBadRequest, // => 400: the path itself was malformed
			"invalid_id", "task_id must be an integer") // => the client sent text where an int belongs
		return // => early return: no store lookup on a malformed id
	} // => the conversion branch ends
	storeMu.RLock()        // => the read lock: many GETs may run together, never beside a POST
	found, ok := tasks[id] // => a SEPARATE lock acquisition from the one createTask used
	storeMu.RUnlock()      // => release immediately: the value below is a copy, safe to encode
	if !ok {               // => the ONLY store branch: everything else lives in the map above
		writeError(w, http.StatusNotFound, // => 404: well-formed id, no such row
			"not_found", "task not found") // => proves the read consults storage, not an echo
		return // => early return: only a real row reaches the encoder below
	} // => the missing branch ends
	writeJSON(w, http.StatusOK, found) // => co-14: the POST genuinely reached storage -- same id, same title
} // => getTask ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                       // => the routing table: two routes, one store
	mux.HandleFunc("POST /tasks", createTask)       // => co-02: creates a new resource
	mux.HandleFunc("GET /tasks/{task_id}", getTask) // => co-02: reads the SAME resource back afterward
	return mux                                      // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
