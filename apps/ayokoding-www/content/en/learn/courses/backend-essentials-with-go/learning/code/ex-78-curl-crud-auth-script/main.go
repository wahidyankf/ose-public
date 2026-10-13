// Example 78: curl CRUD + Auth Script -- the target app script.sh exercises.
//
// This app itself introduces nothing new: every route reuses patterns from
// earlier examples (CRUD from ex-74's replace, the bearer-token guard from
// the auth tier, the {"error":{...}} envelope from ex-77). What is NEW is
// the companion script.sh -- a documented curl sequence driving the FULL
// lifecycle end to end: create (401 without a token, 201 with one), read
// (open, no token), update (guarded PUT), delete (guarded, 204), then read
// after delete (404, genuinely gone).
//
// The store is in-memory and mutex-guarded -- zero setup: `go run .` is
// the whole backend, and script.sh is the whole client.
//
// Run it:
//
//	go run .        # terminal 1: the server on 127.0.0.1:8000
//	./script.sh     # terminal 2: the six-step curl transcript, asserting as it goes
package main

import (
	"encoding/json" // => decodes create/update bodies and encodes every response below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, path values, status codes
	"strconv"       // => the {id} path value arrives as a string; Atoi turns it into an int
	"strings"       // => TrimSpace rejects whitespace-only titles, like the validation examples
	"sync"          // => writes mutate the map while reads run -- handlers need the lock
)

// validToken is the hardcoded stand-in for a real signed/opaque token --
// the SAME literal script.sh sends as "Authorization: Bearer ...".
const validToken = "s3cr3t-token-abc123" // => a demo constant, never a real secret -- see ex-58's minting

// task is the repository's row shape -- id server-assigned, status
// defaulted server-side on create, exactly like the Python twin.
type task struct { // => every route below returns EITHER this shape or nothing, never a raw row
	ID     int    `json:"id"`     // => server-assigned, monotonically increasing from 1
	Title  string `json:"title"`  // => client-chosen at create, replaceable at update
	Status string `json:"status"` // => "todo" by default on create -- PUT may set it explicitly
}

// createBody is POST's expected shape -- deliberately narrow: a client
// cannot set status at creation time; the server default handles that.
type createBody struct { // => one field -- status is never client-settable on the way in
	Title string `json:"title"` // => required -- an empty title is a 422, not a silent default
}

// updateBody is PUT's expected shape -- a FULL replace: unlike POST, PUT
// DOES let the caller set status explicitly, and demands both fields.
type updateBody struct { // => PUT replaces the whole resource -- no "only changed fields" option
	Title  string `json:"title"`  // => required, same rule as create
	Status string `json:"status"` // => required -- full-body replace means full-body validation
}

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "unauthorized" -- stable across examples
	Message string `json:"message"` // => human text -- "missing or invalid token", "no such task", ...
}

// errorEnvelope wraps apiError at the fixed "error" key clients parse.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => unwraps into the flat {"error":{...}} shape, every error
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
	mu     sync.Mutex       // => every map access below -- reads AND writes -- holds this lock
	tasks  = map[int]task{} // => the whole "database": empty at startup, like Python's fresh tasks.db
	nextID = 1              // => the next server-assigned id -- incremented under the lock, never reused
)

// requireToken guards every WRITE -- resolved BEFORE the guarded handler's
// own body runs. Either failure mode (missing, wrong) yields the same 401.
func requireToken(w http.ResponseWriter, r *http.Request) bool { // => true means "allowed": proceed
	if r.Header.Get("Authorization") != "Bearer "+validToken { // => exact match required -- no prefix games
		writeError(w, http.StatusUnauthorized, "unauthorized", "missing or invalid token") // => 401, enveloped
		return false                                                                       // => the handler MUST stop: return without touching the store
	}
	return true // => reaching here IS the "allowed" outcome -- the write proceeds
}

// createTask stores a new row with a server-assigned id and default status.
func createTask(title string) task {
	mu.Lock()                                           // => the write lock: id assignment and insert are one atomic step
	defer mu.Unlock()                                   // => released on return -- the copy below is already safely made
	t := task{ID: nextID, Title: title, Status: "todo"} // => status defaulted SERVER-side, like the schema DEFAULT
	tasks[nextID] = t                                   // => inserted under the lock -- no two POSTs ever share an id
	nextID++                                            // => monotonically increasing -- deleted ids are never recycled
	return t                                            // => the fresh row, including its server-assigned id and status
}

// getTask reads one row by id -- the "R" of CRUD, open to everyone.
func getTask(id int) (task, bool) {
	mu.Lock()          // => the read lock: a concurrent DELETE cannot win mid-copy
	defer mu.Unlock()  // => released immediately -- the copy below outlives the lock
	t, ok := tasks[id] // => ok=false means "no row at this id" -- the HANDLER maps that to 404
	return t, ok       // => a copy, not a pointer into the map -- callers cannot mutate the store
}

// updateTask replaces one row's full state -- the "U" of CRUD, guarded.
func updateTask(id int, title, status string) (task, bool) {
	mu.Lock()          // => the write lock: read-modify-write is one atomic step
	defer mu.Unlock()  // => released on every return path -- found AND not-found alike
	t, ok := tasks[id] // => no row matched: this PUT only replaces, never creates at an id
	if !ok {           // => the missing-id branch -- close BEFORE returning, via the deferred unlock
		return task{}, false // => false signals "not found" -- the HANDLER raises the actual 404
	}
	t.Title = title   // => full replace: BOTH columns overwritten, no merge, no patch
	t.Status = status // => PUT (unlike POST) lets the caller set status explicitly
	tasks[id] = t     // => committed back under the same lock acquisition
	return t, true    // => the fresh, post-update row state
}

// deleteTask removes one row -- the "D" of CRUD, guarded, 204 on success.
func deleteTask(id int) bool {
	mu.Lock()                    // => the write lock: the delete commits atomically
	defer mu.Unlock()            // => released on return -- the bool below is already decided
	if _, ok := tasks[id]; !ok { // => nothing matched: report 404, not a silent no-op
		return false // => false signals "not found" -- success and absence stay distinguishable
	}
	delete(tasks, id) // => genuinely removed -- the later GET proves it, not a soft-delete flag
	return true       // => true means a row genuinely existed and was removed
}

// postTask serves POST /tasks -- CREATE, a WRITE, so it is guarded; 201
// signals a new resource now exists at the returned id.
func postTask(w http.ResponseWriter, r *http.Request) {
	if !requireToken(w, r) { // => the guard runs FIRST -- no row is created on a 401
		return // => 401 already written by the guard -- stop before decoding anything
	}
	var body createBody                                           // => the zero-value target: empty title, ready to reject
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422
		return
	}
	if strings.TrimSpace(body.Title) == "" { // => empty titles are rejected -- never silently defaulted
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "title is required") // => 422
		return
	}
	writeJSON(w, http.StatusCreated, createTask(body.Title)) // => 201: the new row, id and status assigned
}

// readTask serves GET /tasks/{id} -- reads stay OPEN, no token required.
func readTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id")) // => "abc" is not an id -- path validation first
	if err != nil {                            // => the SHAPE is wrong -- 422, like FastAPI's int param
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
		return
	}
	t, ok := getTask(id) // => delegates straight to the repository, no logic in between
	if !ok {             // => no row exists at this id
		writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, enveloped like every miss
		return
	}
	writeJSON(w, http.StatusOK, t) // => the same shape createTask returned on the way in
}

// putTask serves PUT /tasks/{id} -- REPLACE, a WRITE, so it is guarded.
func putTask(w http.ResponseWriter, r *http.Request) {
	if !requireToken(w, r) { // => the guard runs FIRST -- identical to POST's guard
		return // => 401 already written -- stop before decoding anything
	}
	id, err := strconv.Atoi(r.PathValue("id")) // => id from the PATH, state from the BODY
	if err != nil {                            // => non-integer ids fail path validation -- 422
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
		return
	}
	var body updateBody                                           // => the zero-value target for the full-replace shape
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422
		return
	}
	if strings.TrimSpace(body.Title) == "" || strings.TrimSpace(body.Status) == "" { // => BOTH required -- PUT is total
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "title and status are required") // => 422
		return
	}
	updated, ok := updateTask(id, body.Title, body.Status) // => no SQL in this handler either -- one call
	if !ok {                                               // => no row matched -- PUT only replaces, never creates
		writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, consistent with reads
		return
	}
	writeJSON(w, http.StatusOK, updated) // => the fresh, post-update row state
}

// removeTask serves DELETE /tasks/{id} -- a WRITE, so it is guarded; 204
// carries no response body on success.
func removeTask(w http.ResponseWriter, r *http.Request) {
	if !requireToken(w, r) { // => the guard runs FIRST -- identical to POST and PUT
		return // => 401 already written -- stop before touching the store
	}
	id, err := strconv.Atoi(r.PathValue("id")) // => path validation, same as the other id routes
	if err != nil {                            // => non-integer ids fail the same way everywhere
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
		return
	}
	if !deleteTask(id) { // => nothing matched: report 404, not a silent no-op
		writeError(w, http.StatusNotFound, "not_found", "no such task") // => the SAME code every miss uses
		return
	}
	w.WriteHeader(http.StatusNoContent) // => 204: success with NO body -- no writeJSON, no envelope
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router wiring the four repository functions to HTTP
	mux.HandleFunc("POST /tasks", postTask)               // => CREATE -- guarded, 201
	mux.HandleFunc("GET /tasks/{id}", readTask)           // => read -- OPEN, no token
	mux.HandleFunc("PUT /tasks/{id}", putTask)            // => REPLACE -- guarded, idempotent
	mux.HandleFunc("DELETE /tasks/{id}", removeTask)      // => DELETE -- guarded, 204
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
