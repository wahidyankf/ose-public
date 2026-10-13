// Example 53: The 422 Detail Array Lists Every Offending Field.
//
// The SAME shape breaks in two INDEPENDENT ways at once here: an empty
// title AND a non-positive priority. The handler reports BOTH in one 422
// body, not just the first failure:
//
//	curl -X POST http://127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk","priority":-1}'  # => one entry
//	curl -X POST http://127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"","priority":-1}'        # => two entries
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the decode step: where the raw body becomes checkable fields
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server, mux, statuses
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too
)

// taskCreate is the shape of a valid POST /tasks body.
type taskCreate struct { // => the request shape: two INDEPENDENT constraints live here
	Title    string `json:"title"`    // => must be non-blank after trimming
	Priority int    `json:"priority"` // => must be greater than zero
} // => the struct closes: json tags keep both wire keys stable

// fieldError is ONE entry in the 422 detail array.
type fieldError struct { // => mirrors FastAPI's per-field error objects
	Loc  []string `json:"loc"`  // => e.g. ["body","priority"]: WHERE the failure lives
	Msg  string   `json:"msg"`  // => human-readable reason for THIS field
	Type string   `json:"type"` // => a stable, machine-matchable kind tag
} // => fieldError closes

// detailEnvelope is the 422 body: a detail ARRAY, not a single object.
type detailEnvelope struct { // => co-10/co-11: the ARRAY lists every offender at once
	Detail []fieldError `json:"detail"` // => one entry per violated field
} // => detailEnvelope closes

// writeJSON centralizes every response this example sends.
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one serialization path
	w.Header().Set("Content-Type", "application/json") // => declare the body encoding first
	w.WriteHeader(status)                              // => then freeze headers with the status line
	_ = json.NewEncoder(w).Encode(payload)             // => one JSON document onto the wire
} // => writeJSON ends

// validate collects EVERY violation instead of returning after the first.
func validate(body taskCreate) []fieldError { // => pure check: no I/O, no status codes here
	var details []fieldError                 // => nil when valid: the happy path allocates nothing
	if strings.TrimSpace(body.Title) == "" { // => present-but-empty counts exactly like absent
		details = append(details, fieldError{ // => the title offender joins the array
			Loc:  []string{"body", "title"}, // => names the exact field, like FastAPI's loc
			Msg:  "title must not be empty", // => the reason for THIS field
			Type: "string_too_short",        // => the kind tag a client could match on
		}) // => the title entry closes
	} // => the title branch ends: priority is still checked independently below
	if body.Priority <= 0 { // => zero AND negatives both fail the gt=0 rule
		details = append(details, fieldError{ // => the priority offender joins the SAME array
			Loc:  []string{"body", "priority"},      // => the second field, individually named
			Msg:  "priority must be greater than 0", // => its own reason, independent of title
			Type: "greater_than",                    // => its own kind tag
		}) // => the priority entry closes
	} // => the priority branch ends
	return details // => nil-or-longer: the caller decides 201 vs 422 from the length
} // => validate ends: two checks, one array, no early return

// createTask decodes, validates, then answers 201 or 422.
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature
	defer r.Body.Close()                                          // => always release the request body, valid or not
	var body taskCreate                                           // => the zero-value target the decoder fills
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => malformed JSON never reaches validate
		writeJSON(w, http.StatusUnprocessableEntity, // => 422: well-formed HTTP, unreadable body
			detailEnvelope{Detail: []fieldError{{ // => a one-entry array keeps the SHAPE identical
				Loc:  []string{"body"},    // => the whole body failed, not one field
				Msg:  "invalid JSON body", // => Go's decode text stays server-side; this is the client text
				Type: "json_invalid",      // => the kind tag for a parse failure
			}}}) // => the envelope closes
		return // => early return: nothing below runs on an undecodable body
	} // => the decode branch ends
	if details := validate(body); len(details) > 0 { // => BOTH fields were checked, whatever failed is listed
		writeJSON(w, http.StatusUnprocessableEntity, // => co-03: still ONE 422, not two responses
			detailEnvelope{Detail: details}) // => co-10/co-11: the ARRAY carries every offender
		return // => early return: the happy path below only runs for valid bodies
	} // => the invalid-body branch ends
	writeJSON(w, http.StatusCreated, // => 201: both fields passed, echo them back
		map[string]any{"title": body.Title, "priority": body.Priority}) // => the validated values, now trusted
} // => createTask ends

// newHandler assembles the routing table, separate from main.
func newHandler() http.Handler { // => wiring, extracted so httptest could reuse it
	mux := http.NewServeMux()                 // => the routing table: exactly one route here
	mux.HandleFunc("POST /tasks", createTask) // => co-08: a handler for creating a task
	return mux                                // => the mux IS an http.Handler, ready to serve
} // => newHandler ends

func main() { // => the executable entry point
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => blocks forever; a listen error exits 1
} // => main ends
