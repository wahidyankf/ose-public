// Example 77: Error Envelope Consistency -- every error shares one shape.
//
// Five DIFFERENT failure kinds (400, 401, 404, 422, 500), all rendered
// through the SAME envelope helper: a client parses exactly one shape,
// regardless of WHICH check failed. Python registers global exception
// handlers for this; stdlib Go has no such hook, so a tiny recover
// MIDDLEWARE plays that role for the 500 path, while the other four write
// the envelope directly at the site that detects them.
//
// Run it:
//
//	go run .
//
// Then in another terminal (every body below nests under the same "error" key):
//
//	curl "http://127.0.0.1:8000/tasks?bad=true" # 400 -- a business-rule violation, not a type error
//	curl -X POST -H "Content-Type: application/json" -d '{"title":"x"}' http://127.0.0.1:8000/tasks # 401 -- no token
//	curl "http://127.0.0.1:8000/tasks/999" # 404 -- well-formed id, nonexistent row
//	curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer s3cr3t-token-abc123" -d '{}' http://127.0.0.1:8000/tasks # 422 -- title omitted
//	curl "http://127.0.0.1:8000/boom" # 500 -- generic text only, the panic never leaks
package main

import (
	"encoding/json" // => decodes the POST body and encodes every response below
	"log"           // => the operator log: panics are recorded HERE, never on the wire
	"net/http"      // => the whole server: mux, handlers, status codes
	"strconv"       // => the {id} path value arrives as a string; Atoi turns it into an int
	"strings"       // => TrimSpace rejects whitespace-only titles, like the validation examples
)

// validToken is the hardcoded stand-in for a real signed/opaque token --
// the SAME literal the curl transcript above presents as "Bearer ...".
const validToken = "s3cr3t-token-abc123" // => a demo constant, never a real secret -- see ex-58's minting

// tasks is the tiny in-memory store, just enough to trigger each error
// kind -- id 1 exists (drives the 200 path), any other id drives 404.
var tasks = map[int]string{ // => read-only after startup: handlers need no lock here
	1: "write the report", // => the single seeded row -- the only id that ever 200s
}

// createBody is the POST body's expected shape -- validated BEFORE the
// handler's own logic runs, the stdlib twin of Pydantic-before-handler.
type createBody struct { // => one field: omitting it triggers the 422 path below
	Title string `json:"title"` // => required -- the presence rule, checked by hand
}

// apiError is the ONE shape every error path in this app returns -- a
// machine-readable code plus a human-readable message.
type apiError struct { // => {"code":...,"message":...}: identical keys, every time, no exceptions
	Code    string `json:"code"`    // => e.g. "not_found" -- stable strings clients can switch on
	Message string `json:"message"` // => human text -- actionable, never a stack trace
}

// errorEnvelope wraps apiError at the fixed "error" key the page documents.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => never "detail", never a bare string -- verified across all five
}

// envelope builds the one shape -- the single reference for "what does an
// error look like in this app," whatever route or check raised it.
func envelope(code, message string) errorEnvelope { // => every error below funnels through HERE
	return errorEnvelope{Error: apiError{Code: code, Message: message}} // => one constructor, five callers
}

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// withRecovery is the LAST-resort middleware -- the stdlib twin of
// Python's generic Exception handler. Registration WRAPS the whole mux, so
// a panic in ANY route lands here and becomes a sanitized 500 instead of
// a dropped connection. The real value goes to the OPERATOR log only.
func withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() { // => deferred: runs on panic AND on the normal return alike
			if rec := recover(); rec != nil { // => a panicking handler lands here, not in the client conn
				log.Printf("panic: %v", rec)                 // => recorded for the operator -- NEVER echoed to the client
				writeJSON(w, http.StatusInternalServerError, // => the SAME two-key shape as every other error
					envelope("internal_error", "an unexpected error occurred")) // => deliberately generic: no type, no trace
			}
		}()
		next.ServeHTTP(w, r) // => the unmodified pass-through -- recovery only fires on panic
	})
}

// requireToken is the 401 trigger -- exact match required, either missing
// entirely or genuinely wrong collapses into the SAME 401 body on purpose.
func requireToken(r *http.Request) bool { // => true means "allowed": the handler proceeds
	return r.Header.Get("Authorization") == "Bearer "+validToken // => net/http canonicalizes casing for us
}

// getTask serves GET /tasks/{id} -- the 404 trigger. A non-integer id is a
// 422 (path TYPE validation, automatic in FastAPI); existence is business
// logic, checked here by hand.
func getTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id")) // => "abc" never reaches the map below
	if err != nil {                            // => the SHAPE is wrong, not the row -- 422, not 404
		writeJSON(w, http.StatusUnprocessableEntity, envelope("validation_error", "task id must be an integer")) // => same envelope, 422 code path
		return
	}
	title, ok := tasks[id] // => the ONLY existence check in this file -- id 1 hits, the rest miss
	if !ok {               // => any id besides the single seeded one triggers this branch
		writeJSON(w, http.StatusNotFound, envelope("not_found", "no such task")) // => 404 in the shared shape
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"title": title}) // => the ONLY success body in this file
}

// listTasks serves GET /tasks -- the 400 trigger: a semantically bad input
// no type system can catch. ?bad=true is a well-formed bool; rejecting it
// is BUSINESS logic, not typing -- hence 400, not 422.
func listTasks(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("bad") == "true" { // => a deliberate business-rule violation flag
		writeJSON(w, http.StatusBadRequest, envelope("bad_request", "the bad=true flag is rejected")) // => 400, same envelope
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"count": strconv.Itoa(len(tasks))}) // => the ordinary success path
}

// createTask serves POST /tasks -- the 401 trigger (no valid token) AND
// the 422 trigger (title omitted), in that order: identity BEFORE shape.
func createTask(w http.ResponseWriter, r *http.Request) {
	if !requireToken(r) { // => missing header AND wrong token collapse into ONE outcome
		writeJSON(w, http.StatusUnauthorized, envelope("unauthorized", "missing or invalid token")) // => 401, same envelope
		return
	}
	var body createBody                                           // => the zero-value target: empty title, ready to reject
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => a wrong TYPE fails here, before any check
		writeJSON(w, http.StatusUnprocessableEntity, envelope("validation_error", "invalid JSON body: "+err.Error())) // => Go names the field AND the type
		return
	}
	if strings.TrimSpace(body.Title) == "" { // => omitted OR whitespace-only: the 422 trigger proper
		writeJSON(w, http.StatusUnprocessableEntity, envelope("validation_error", "body.title: title is required")) // => names the OFFENDING field, first error only
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"title": body.Title}) // => unreachable without BOTH token and body
}

// boom serves GET /boom -- the 500 trigger: an unhandled failure the
// recover middleware above catches and sanitizes into the shared shape.
func boom(w http.ResponseWriter, r *http.Request) {
	panic("a genuinely unexpected internal failure") // => never reaches the client verbatim -- by design
}

func main() {
	mux := http.NewServeMux()                                           // => one explicit router for the four trigger routes
	mux.HandleFunc("GET /tasks/{id}", getTask)                          // => the 404 trigger (plus path-type 422)
	mux.HandleFunc("GET /tasks", listTasks)                             // => the 400 trigger
	mux.HandleFunc("POST /tasks", createTask)                           // => the 401 trigger, then the 422 trigger
	mux.HandleFunc("GET /boom", boom)                                   // => the 500 trigger -- panics, middleware sanitizes
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", withRecovery(mux))) // => the middleware wraps EVERYTHING
}
