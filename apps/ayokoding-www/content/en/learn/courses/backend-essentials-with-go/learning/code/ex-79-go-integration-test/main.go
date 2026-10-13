// Example 79: Go Integration Test -- CRUD + token auth + pagination, one app.
//
// This file combines EVERY major mechanism of the advanced tier into a
// single app: CRUD (POST create, GET read, PUT replace, DELETE remove,
// plus a paginated GET list), bearer-token auth guarding every WRITE, and
// pagination + filtering on the open list route. The companion main_test.go
// is the fullest httptest suite in this track precisely because it verifies
// all three areas genuinely coexist -- the Go analogue of the pytest
// TestClient suite, driven in-process via net/http/httptest, no socket.
//
// The store is in-memory and mutex-guarded: newServer builds a FRESH store
// per caller, so each test (and main) gets an isolated table with zero
// setup. Run the server with `go run .`, the suite with `go test ./...`.
package main

import (
	"encoding/json" // => decodes create/update bodies and encodes every response below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, path values, status codes
	"strconv"       // => ids and query numbers arrive as strings; Atoi turns them into ints
	"strings"       // => TrimSpace rejects whitespace-only titles, like the validation examples
	"sync"          // => writes mutate the map while reads run -- the store carries its own lock
)

// validToken is the hardcoded stand-in for a real signed/opaque token --
// the SAME literal main_test.go's AUTH header sends on every guarded call.
const validToken = "s3cr3t-token-abc123" // => a demo constant, never a real secret -- see ex-58's minting

// maxLimit caps ?limit= -- the same ceiling as ex-68, reused so the list
// route stays safely bounded while the suite exercises its windows.
const maxLimit = 50 // => FastAPI's le=50, spelled as a named Go constant instead

// task is the repository's row shape -- id server-assigned, status
// defaulted server-side on create, exactly like the earlier CRUD examples.
type task struct { // => every route below returns EITHER this shape or a page of it
	ID     int    `json:"id"`     // => server-assigned, monotonically increasing from 1
	Title  string `json:"title"`  // => client-chosen at create, replaceable at update
	Status string `json:"status"` // => "todo" by default on create -- PUT may set it explicitly
}

// page is the paginated list envelope -- the same items/total/next trio
// as ex-67, here with an optional status filter narrowing the total.
type page struct { // => the list route's ONLY response shape -- never a bare array
	Items []task `json:"items"` // => this page's rows, after any status filter and the limit/offset slice
	Total int    `json:"total"` // => the FILTERED count -- not necessarily the whole table
	Next  *int   `json:"next"`  // => nil encodes as null: "no further page" -- a typed sentinel
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

// server owns the WHOLE store -- one value per process (main) or per test
// (main_test.go builds a fresh one per case, so tests never share rows).
// Methods keep the lock discipline INSIDE, so handlers stay thin.
type server struct { // => the application layer: repository plus auth, no HTTP vocabulary inside
	mu     sync.Mutex   // => every map access below -- reads AND writes -- holds this lock
	tasks  map[int]task // => the whole "database": empty at construction, like a fresh tasks.db
	nextID int          // => the next server-assigned id -- incremented under the lock, never reused
}

// newServer builds a store with nothing in it -- main calls it once, each
// test calls it once, and neither ever sees the other's rows.
func newServer() *server {
	return &server{tasks: map[int]task{}, nextID: 1} // => empty map, ids from 1 -- the known start state
}

// create stores a new row with a server-assigned id and default status.
func (s *server) create(title string) task {
	s.mu.Lock()                                           // => the write lock: id assignment and insert are one atomic step
	defer s.mu.Unlock()                                   // => released on return -- the copy below is already safely made
	t := task{ID: s.nextID, Title: title, Status: "todo"} // => status defaulted SERVER-side, never client-set
	s.tasks[s.nextID] = t                                 // => inserted under the lock -- no two POSTs ever share an id
	s.nextID++                                            // => monotonically increasing -- deleted ids are never recycled
	return t                                              // => the fresh row, including its server-assigned id and status
}

// get reads one row by id -- nil-ok style: false means "no such id" and
// the HANDLER (not this function) decides how that becomes a 404.
func (s *server) get(id int) (task, bool) {
	s.mu.Lock()          // => the read lock: a concurrent DELETE cannot win mid-copy
	defer s.mu.Unlock()  // => released immediately -- the copy below outlives the lock
	t, ok := s.tasks[id] // => ok=false covers "never created" and "already deleted" alike
	return t, ok         // => a copy, not a pointer into the map -- callers cannot mutate the store
}

// update replaces one row's full state -- false means "no row matched,"
// which the PUT route maps to a 404 (PUT here only replaces, never creates).
func (s *server) update(id int, title, status string) (task, bool) {
	s.mu.Lock()          // => the write lock: read-modify-write is one atomic step
	defer s.mu.Unlock()  // => released on every return path -- found AND not-found alike
	t, ok := s.tasks[id] // => no row matched this id -- nothing to replace
	if !ok {             // => the missing-id branch -- close via the deferred unlock, no leak
		return task{}, false // => signals "not found" up to the route, which raises the actual 404
	}
	t.Title = title   // => full replace: BOTH columns overwritten, no merge, no patch
	t.Status = status // => PUT (unlike POST) lets the caller set status explicitly
	s.tasks[id] = t   // => committed back under the same lock acquisition
	return t, true    // => the fresh, post-update row state
}

// remove deletes one row -- true only if a row genuinely existed and was
// removed, so the route can tell "deleted" from "never there".
func (s *server) remove(id int) bool {
	s.mu.Lock()                    // => the write lock: the delete commits atomically
	defer s.mu.Unlock()            // => released on return -- the bool below is already decided
	if _, ok := s.tasks[id]; !ok { // => nothing matched: report 404, not a silent no-op
		return false // => keeps "deleted" and "never there" distinguishable for the route
	}
	delete(s.tasks, id) // => genuinely removed -- a later GET proves it, not a soft-delete flag
	return true         // => a row genuinely existed and was removed
}

// listPage slices the table after the optional status filter -- the
// repository half of pagination+filter, composed exactly like ex-73's but
// over the in-memory map. ids ascend (map iteration order is random, so
// the slice is sorted explicitly -- the twin of ORDER BY id).
func (s *server) listPage(limit, offset int, status string) page {
	s.mu.Lock()                              // => the read lock: a concurrent write cannot skew total vs items
	defer s.mu.Unlock()                      // => released immediately -- the page below is fully copied out
	ordered := make([]task, 0, len(s.tasks)) // => pre-sized: at most the whole table, never more
	for id := 1; id < s.nextID; id++ {       // => id order WITHOUT sorting: ids only ever increase
		t, ok := s.tasks[id] // => gaps are the deleted ids -- skipped, never returned
		if !ok {             // => a deleted id leaves a hole in the sequence -- jump over it
			continue // => the hole contributes nothing to total OR items -- as if never created
		}
		if status != "" && t.Status != status { // => opt-in filter: "" means every status qualifies
			continue // => this row fails the filter -- dropped before counting AND slicing alike
		}
		ordered = append(ordered, t) // => qualified, in ascending id order -- ORDER BY id, in memory
	}
	total := len(ordered) // => the FILTERED count -- computed with the SAME filter as the slice below
	if offset > total {   // => past the end: the window starts beyond the last qualified row
		offset = total // => clamp so the slice below yields [] instead of panicking
	}
	end := offset + limit // => the exclusive upper bound of this page window
	if end > total {      // => the last page is shorter than limit -- genuinely the tail
		end = total // => clamp the upper bound the same way
	}
	nextOffset := offset + limit // => the offset a client would use for the FOLLOWING page
	var next *int                // => nil means "filtered set exhausted" -- encodes as JSON null
	if nextOffset < total {      // => whether another filtered page exists past this one
		next = &nextOffset // => points at the next window -- the client follows it, no math needed
	}
	return page{Items: ordered[offset:end], Total: total, Next: next} // => the envelope: never a bare array
}

// newHandler wires every repository method above to HTTP -- main serves it
// on a socket, main_test.go drives the SAME value in-process via httptest.
func newHandler(s *server) http.Handler {
	mux := http.NewServeMux()                                                                                 // => one explicit router for the five routes below
	guarded := func(next func(http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) { // => the auth wrapper: every WRITE passes through it
		return func(w http.ResponseWriter, r *http.Request) { // => resolved BEFORE the wrapped handler runs
			if r.Header.Get("Authorization") != "Bearer "+validToken { // => missing AND wrong collapse to ONE 401
				writeError(w, http.StatusUnauthorized, "unauthorized", "missing or invalid token") // => 401, enveloped
				return                                                                             // => rejected before the wrapped handler's body ever runs -- no row created
			}
			next(w, r) // => the token matched: the wrapped WRITE proceeds unmodified
		}
	}
	mux.HandleFunc("POST /tasks", guarded(func(w http.ResponseWriter, r *http.Request) { // => CREATE -- guarded, 201
		var body createBody                                           // => the zero-value target: empty title, ready to reject
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422
			return
		}
		if strings.TrimSpace(body.Title) == "" { // => empty titles are rejected -- never silently defaulted
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "title is required") // => 422
			return
		}
		writeJSON(w, http.StatusCreated, s.create(body.Title)) // => 201: the new row, id and status assigned
	}))
	mux.HandleFunc("GET /tasks/{id}", func(w http.ResponseWriter, r *http.Request) { // => read -- OPEN, no token
		id, err := strconv.Atoi(r.PathValue("id")) // => "abc" is not an id -- path validation first
		if err != nil {                            // => the SHAPE is wrong -- 422, like FastAPI's int param
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
			return
		}
		t, ok := s.get(id) // => delegates straight to the repository, no logic in between
		if !ok {           // => no row exists at this id
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, enveloped like every miss
			return
		}
		writeJSON(w, http.StatusOK, t) // => the same shape create returned on the way in
	})
	mux.HandleFunc("PUT /tasks/{id}", guarded(func(w http.ResponseWriter, r *http.Request) { // => REPLACE -- guarded
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
		updated, ok := s.update(id, body.Title, body.Status) // => no SQL in this handler either -- one call
		if !ok {                                             // => no row matched -- PUT only replaces, never creates
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, consistent with reads
			return
		}
		writeJSON(w, http.StatusOK, updated) // => the fresh, post-update row state
	}))
	mux.HandleFunc("DELETE /tasks/{id}", guarded(func(w http.ResponseWriter, r *http.Request) { // => DELETE -- guarded, 204
		id, err := strconv.Atoi(r.PathValue("id")) // => path validation, same as the other id routes
		if err != nil {                            // => non-integer ids fail the same way everywhere
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
			return
		}
		if !s.remove(id) { // => nothing matched: report 404, not a silent no-op
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => the SAME code every miss uses
			return
		}
		w.WriteHeader(http.StatusNoContent) // => 204: success with NO body -- no writeJSON, no envelope
	}))
	mux.HandleFunc("GET /tasks", func(w http.ResponseWriter, r *http.Request) { // => list -- OPEN, reads never need a token
		query := r.URL.Query()                    // => parsed once: limit, offset, and the optional status filter
		limit, offset := 10, 0                    // => the defaults: 10-row page from the very first row -- ex-66 + ex-65
		if raw := query.Get("limit"); raw != "" { // => an explicit value beats the default
			n, err := strconv.Atoi(raw)              // => "5" -> 5; "abc" -> an error, never a silent zero
			if err != nil || n < 1 || n > maxLimit { // => ge=1 AND le=50 -- ex-68's ceiling, reused verbatim
				writeError(w, http.StatusUnprocessableEntity, "validation_error", "limit must be an integer between 1 and 50") // => 422
				return
			}
			limit = n // => valid: this page holds at most n rows
		}
		if raw := query.Get("offset"); raw != "" { // => same opt-in pattern for the skip count
			n, err := strconv.Atoi(raw) // => Atoi again: no floats, no blanks, no coercion
			if err != nil || n < 0 {    // => ge=0 -- ex-65's floor, unchanged
				writeError(w, http.StatusUnprocessableEntity, "validation_error", "offset must be an integer >= 0") // => 422
				return
			}
			offset = n // => valid: skip the first n filtered rows
		}
		writeJSON(w, http.StatusOK, s.listPage(limit, offset, query.Get("status"))) // => "" status means unfiltered -- ex-69's rule
	})
	return mux // => the mux IS an http.Handler -- served by main, driven by tests, no code in between
}

func main() {
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler(newServer()))) // => one store, five routes, localhost:8000
}
