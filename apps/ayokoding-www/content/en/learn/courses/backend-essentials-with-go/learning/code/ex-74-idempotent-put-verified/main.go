// Example 74: Idempotent PUT, Verified -- the same PUT twice, same state.
//
// RFC 9110 CLASSIFIES PUT as idempotent, but a classification is only a
// promise -- this example PROVES it by applying the same PUT twice and
// checking the row count stays 1 and both bodies are byte-identical. PUT
// REPLACES the full resource ({title,status}, both required); a missing id
// is a 404, never an auto-create. One in-memory row (id 1), mutex-guarded
// because PUT mutates -- stdlib only, zero setup.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl -X PUT -H "Content-Type: application/json" -d '{"title":"write the report","status":"in_progress"}' http://127.0.0.1:8000/tasks/1 # 200, replaced
//	curl -X PUT -H "Content-Type: application/json" -d '{"title":"write the report","status":"in_progress"}' http://127.0.0.1:8000/tasks/1 # 200, IDENTICAL body
//	curl "http://127.0.0.1:8000/tasks/count" # {"total":1} -- before AND after: never a duplicate
//	curl -X PUT -H "Content-Type: application/json" -d '{"title":"x","status":"todo"}' http://127.0.0.1:8000/tasks/999 # 404 -- replace only
package main

import (
	"encoding/json" // => decodes the PUT body and encodes every response below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, path values, status codes
	"strconv"       // => the {id} path value arrives as a string; Atoi turns it into an int
	"strings"       // => TrimSpace rejects whitespace-only titles, like the validation examples
	"sync"          // => PUT mutates the map while GETs read it -- handlers run on own goroutines
)

// task is the one row shape this file stores AND returns.
type task struct { // => id plus the two PUT-replaceable fields -- deliberately SMALL, no filter/sort noise
	ID     int    `json:"id"`     // => the URL path selects this -- never client-settable in the body
	Title  string `json:"title"`  // => required in every PUT body -- omitting it is a 422, not partial
	Status string `json:"status"` // => required in every PUT body -- PUT has no "unchanged" option
}

// taskUpdate is the exact shape a PUT body must take -- both fields, always.
type taskUpdate struct { // => unlike PATCH, there is no "only the fields you're changing" with PUT
	Title  string `json:"title"`  // => required -- presence-checked by hand below
	Status string `json:"status"` // => required -- same rule as title
}

// countResponse is the helper body proving PUT never inserts a duplicate.
type countResponse struct { // => {"total":1}: read before AND after the two PUTs to compare
	Total int `json:"total"` // => stays 1 no matter how many times /tasks/1 is PUT to
}

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "not_found" -- stable across examples
	Message string `json:"message"` // => human text -- "no such task", "title is required", ...
}

// errorEnvelope wraps apiError at the fixed "error" key clients parse.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => every error body below nests exactly here
}

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => shape plus status, one call
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}})
}

var (
	mu    sync.Mutex      // => PUT takes it to write; reads take it to copy -- one tiny critical section each
	tasks = map[int]task{ // => the whole "database": a single seed row, id 1 -- the ONLY row PUT ever targets
		1: {ID: 1, Title: "write the report", Status: "todo"}, // => the known starting state every curl shares
	}
)

// replaceTask is the repository function -- calling it TWICE with the SAME
// arguments leaves the SAME final state, because an UPDATE setting columns
// to the values they ALREADY hold changes nothing. The SQL-free twin of
// that: a map store has no memory of prior calls either.
func replaceTask(id int, update taskUpdate) (task, bool) {
	mu.Lock()                // => the write lock: no concurrent GET observes a half-replaced row
	defer mu.Unlock()        // => released on every return path -- found AND not-found alike
	current, ok := tasks[id] // => "does a row exist at this id" -- the only question that branches
	if !ok {                 // => no row matched: this example only REPLACES, never auto-creates at an id
		return task{}, false // => false signals "not found" -- the HANDLER decides the 404, not here
	}
	current.Title = update.Title   // => full replace: BOTH columns overwritten, no merge, no patch
	current.Status = update.Status // => the second PUT writes the SAME values -- a silent no-change
	tasks[id] = current            // => committed back to the map -- first AND second PUT commit alike
	return current, true           // => the CURRENT state -- byte-identical across identical PUTs
}

// decodeUpdate parses the PUT body AND enforces both fields' presence --
// one function, the whole validation pipeline, like the ex-29 decoder.
func decodeUpdate(r *http.Request) (taskUpdate, string) {
	var body taskUpdate                                           // => the zero-value target: empty strings, ready to reject
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE, before any check
		return taskUpdate{}, "invalid JSON body: " + err.Error() // => Go names the field AND the type
	}
	if strings.TrimSpace(body.Title) == "" { // => present-but-empty counts as missing -- ex-29's rule
		return taskUpdate{}, "title is required" // => a domain message, free of HTTP vocabulary
	}
	if strings.TrimSpace(body.Status) == "" { // => status cardio: PUT's full shape demands BOTH fields
		return taskUpdate{}, "status is required" // => same presence rule, second field
	}
	return body, "" // => an empty message IS success -- the caller checks this, not a bool
}

// putTask serves PUT /tasks/{id} -- RFC 9110's idempotent method, verified
// by calling it twice with an identical body further down the page.
func putTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id")) // => the URL PATH selects the row -- "abc" is not a row
	if err != nil {                            // => non-integer ids fail path validation -- FastAPI 422 parity
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422, not 404: the SHAPE is wrong
		return
	}
	update, errMsg := decodeUpdate(r) // => parse plus presence-check in one call
	if errMsg != "" {                 // => a bad body never reaches the store below
		writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422: valid HTTP, invalid data
		return
	}
	updated, ok := replaceTask(id, update) // => the single repository call -- no SQL in this handler
	if !ok {                               // => well-formed id, but no row lives there
		writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404: replace-only, never create
		return
	}
	writeJSON(w, http.StatusOK, updated) // => the post-update state -- IDENTICAL across identical PUTs
}

// countTasks serves GET /tasks/count -- used ONLY to prove no duplicate
// row was ever created: expected to read 1, both before AND after two PUTs.
func countTasks(w http.ResponseWriter, r *http.Request) {
	mu.Lock()                                                // => the read lock: count under the same mutex PUT writes under
	total := len(tasks)                                      // => the whole map's size -- 1 unless a duplicate ever sneaks in
	mu.Unlock()                                              // => released immediately -- the count is already copied out
	writeJSON(w, http.StatusOK, countResponse{Total: total}) // => {"total":1} -- PUT never INSERTs
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's two routes
	mux.HandleFunc("PUT /tasks/{id}", putTask)            // => PUT -- the idempotent method under test
	mux.HandleFunc("GET /tasks/count", countTasks)        // => the helper proving no duplicate was created
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
