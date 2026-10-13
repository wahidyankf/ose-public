// Example Capstone: Task Notes -- CRUD + bearer-token auth + pagination/filter/sort.
//
// ONE runnable Go service combining the whole track: a task/notes API with
// full CRUD (POST create, GET read-one, PUT replace, DELETE remove), a
// bearer-token guard on every WRITE (reads stay open), and an open list
// route composing the status filter, the created_at sort, and limit/offset
// pagination with total/next metadata -- plus /health (always 200) and
// /ready (pings the store), and ONE {"error":{...}} envelope app-wide.
//
// The store is IN-MEMORY (see store.go): readers run this capstone with
// zero setup -- no database to install, no file to create, just `go run .`.
// Durability is the documented tradeoff; the repository shape mirrors a
// SQL-backed one method-for-method, so adding database/sql later changes
// the store file, not the handlers.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/health" # {"status":"ok"} -- liveness, always 200
//	curl "http://127.0.0.1:8000/ready"  # {"status":"ready"} -- the store answers
//	curl -X POST -H "Content-Type: application/json" -d '{"title":"write the report","description":"Q3 summary"}' http://127.0.0.1:8000/tasks # 401 -- writes need a token
//	curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer s3cr3t-token-abc123" -d '{"title":"write the report","description":"Q3 summary"}' http://127.0.0.1:8000/tasks # 201 -- created, status "todo"
//	curl "http://127.0.0.1:8000/tasks/1" # 200 -- reads stay OPEN, no token
//	curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer s3cr3t-token-abc123" -d '{"title":"write the report","description":"Q3 summary","status":"done"}' http://127.0.0.1:8000/tasks/1 # 200 -- full replace
//	curl "http://127.0.0.1:8000/tasks?status=done&limit=5&offset=0&sort=-created_at" # the composed list: filter + sort + page
//	curl -X DELETE -H "Authorization: Bearer s3cr3t-token-abc123" http://127.0.0.1:8000/tasks/1 # 204 -- gone
package main

import (
	"encoding/json" // => decodes create/update bodies and encodes every response below
	"fmt"           // => Sprintf builds the limit-bounds message below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, path values, status codes
	"strconv"       // => ids and query numbers arrive as strings; Atoi turns them into ints
)

// maxLimit caps ?limit= -- the same ceiling as ex-68, reused so the list
// route stays safely bounded while composing with filter and sort.
const maxLimit = 50 // => FastAPI's le=50, spelled as a named Go constant instead

// createRequest is POST's expected shape -- deliberately narrow: title is
// required, description defaults to "", and status is NEVER client-settable
// at creation (the store defaults it to "todo").
type createRequest struct { // => the twin of the Python TaskCreate model, minus Pydantic
	Title       string `json:"title"`       // => required, 1..200 chars -- enforced by the store
	Description string `json:"description"` // => optional -- "" when omitted, max 2000 chars
}

// updateRequest is PUT's expected shape -- a FULL replace: title,
// description, AND status are all required, status from the closed set.
type updateRequest struct { // => the twin of the Python TaskUpdate model -- total, not partial
	Title       string `json:"title"`       // => required, 1..200 chars -- same contract as create
	Description string `json:"description"` // => required here (may be "") -- PUT means "become exactly this"
	Status      string `json:"status"`      // => required -- one of "todo", "in_progress", "done"
}

// apiError is the ONE shape every error in this app returns -- a
// machine-readable code plus a human-readable message.
type apiError struct { // => {"code":...,"message":...}: identical keys, every time, no exceptions
	Code    string `json:"code"`    // => e.g. "not_found" -- stable strings clients can switch on
	Message string `json:"message"` // => human text -- actionable, never a stack trace
}

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => never "detail", never a bare string -- one shape app-wide
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

// parseID reads the {id} path value -- non-integer ids fail path
// validation (422, like FastAPI's int param), so handlers never see them.
func parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id")) // => "abc" is not a row -- the SHAPE is wrong, not the data
	if err != nil {                            // => 422, not 404: validation precedes existence, always
		writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => names the problem
		return 0, false                                                                                 // => false means "a response is already written" -- the handler MUST stop
	}
	return id, true // => a well-formed id -- existence is still the handler's next check
}

// newHandler wires the store to HTTP -- main serves the SAME value this
// function returns, so there is exactly one routing table to read.
func newHandler(s *Store) http.Handler {
	mux := http.NewServeMux()                                                    // => one explicit router for the six routes below
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { // => LIVENESS -- always 200, no store touch
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"}) // => the process is alive -- nothing else claimed
	})
	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) { // => READINESS -- the store genuinely answers
		s.mu.Lock()                                                       // => the cheapest real probe: the lock itself proves the store is usable
		s.mu.Unlock()                                                     // => released immediately -- an in-memory store is ready when it answers
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"}) // => 200 -- reachable, serving
	})
	mux.HandleFunc("POST /tasks", func(w http.ResponseWriter, r *http.Request) { // => CREATE -- guarded by withAuth, 201
		var body createRequest                                        // => the zero-value target: empty strings, ready to default
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE, before any default
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422, Go names field AND type
			return
		}
		created, errMsg := s.Create(body.Title, body.Description) // => title validated, status+created_at defaulted inside
		if errMsg != "" {                                         // => validation failed -- nothing was stored
			writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, the store's own words
			return
		}
		writeJSON(w, http.StatusCreated, created) // => 201: the new row -- id, defaults, and stamp included
	})
	mux.HandleFunc("GET /tasks/{id}", func(w http.ResponseWriter, r *http.Request) { // => read -- OPEN, no token (middleware lets GETs pass)
		id, ok := parseID(w, r) // => path validation first -- 422 already written on failure
		if !ok {                // => the response is already on the wire -- stop
			return // => nothing left to do: parseID wrote the 422
		}
		found, exists := s.Get(id) // => delegates straight to the store, no logic in between
		if !exists {               // => well-formed id, but no row lives there
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, enveloped like every miss
			return
		}
		writeJSON(w, http.StatusOK, found) // => the same Task shape Create returned on the way in
	})
	mux.HandleFunc("PUT /tasks/{id}", func(w http.ResponseWriter, r *http.Request) { // => REPLACE -- guarded by withAuth
		id, ok := parseID(w, r) // => id from the PATH, state from the BODY -- validated separately
		if !ok {                // => the 422 is already written -- stop
			return // => nothing left to do: parseID wrote the 422
		}
		var body updateRequest                                        // => the zero-value target for the full-replace shape
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422
			return
		}
		updated, errMsg, exists := s.Update(id, body.Title, body.Description, body.Status) // => validated, then replaced
		if errMsg != "" {                                                                  // => validation failed -- existence never checked
			writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, the store's own words
			return
		}
		if !exists { // => well-formed AND valid, but no row lives there -- PUT only replaces, never creates
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => 404, consistent with reads
			return
		}
		writeJSON(w, http.StatusOK, updated) // => the fresh, post-update row state
	})
	mux.HandleFunc("DELETE /tasks/{id}", func(w http.ResponseWriter, r *http.Request) { // => DELETE -- guarded by withAuth, 204
		id, ok := parseID(w, r) // => path validation, same as the other id routes
		if !ok {                // => the 422 is already written -- stop
			return // => nothing left to do: parseID wrote the 422
		}
		if !s.Delete(id) { // => nothing matched: report 404, not a silent no-op
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => the SAME code every miss uses
			return
		}
		w.WriteHeader(http.StatusNoContent) // => 204: success with NO body -- no writeJSON, no envelope
	})
	mux.HandleFunc("GET /tasks", func(w http.ResponseWriter, r *http.Request) { // => list -- OPEN: filter + sort + page, no token
		query := r.URL.Query()                    // => parsed once: limit, offset, status, sort -- each independently optional
		limit, offset := 10, 0                    // => the defaults: 10-row page from the first row -- ex-66 + ex-65
		sort := "created_at"                      // => the default direction: oldest first -- ex-72
		if raw := query.Get("limit"); raw != "" { // => an explicit value beats the default
			n, err := strconv.Atoi(raw)              // => "5" -> 5; "abc" -> an error, never a silent zero
			if err != nil || n < 1 || n > maxLimit { // => ge=1 AND le=50 -- ex-68's ceiling, reused verbatim
				writeError(w, http.StatusUnprocessableEntity, "validation_error", fmt.Sprintf("limit must be an integer between 1 and %d", maxLimit)) // => 422
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
			offset = n // => valid: skip the first n filtered-and-sorted rows
		}
		status := query.Get("status")            // => "" when absent: that dimension simply does not narrow -- ex-69
		if raw := query.Get("sort"); raw != "" { // => an explicit direction beats ascending -- ex-72's override
			if raw != "created_at" && raw != "-created_at" { // => the CLOSED set: two values, nothing else
				writeError(w, http.StatusUnprocessableEntity, "validation_error", `sort must be "created_at" or "-created_at"`) // => 422
				return
			}
			sort = raw // => a genuine member of the closed set -- safe for the store to branch on
		}
		writeJSON(w, http.StatusOK, s.List(limit, offset, status, sort)) // => one composed call -- zero SQL-shaped logic here
	})
	return withAuth(mux) // => the token middleware wraps EVERYTHING -- writes checked, reads passed through
}

func main() {
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler(NewStore()))) // => one store, six routes, auth outside, localhost:8000
}
