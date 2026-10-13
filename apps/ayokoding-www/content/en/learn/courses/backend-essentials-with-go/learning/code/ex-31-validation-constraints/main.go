// Example 31: Validation -- field constraints beyond presence and type.
//
// Pydantic spells this as title: str = Field(min_length=1) and priority: int
// = Field(gt=0): the framework rejects an empty title or a non-positive
// priority BEFORE the handler body ever runs. encoding/json enforces neither
// -- it fills the struct and stops -- so this example layers TWO hand-written
// range checks on top of decoding, inside the same decodeTaskCreate pipeline
// ex-29 and ex-30 built. One function still owns parse-plus-check, and the
// handler still branches exactly once on its error.
//
// Try:
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"","priority":1}'
// => 422, title must not be empty (min_length=1 violated)
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk","priority":0}'
// => 422, priority must be greater than 0 (gt=0 violated)
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk","priority":1}'
// => 201, both constraints satisfied
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the decode step: fills the struct, checks nothing itself
	"errors"        // => builds the two domain errors below, free of HTTP vocabulary
	"fmt"           // => wraps the decode failure with context via %w
	"log"           // => startup line + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"strings"       // => TrimSpace, so a whitespace-only title counts as empty too
) // => the import block closes: zero third-party dependencies

// => the request shape: the constraint story needs BOTH fields at once
type taskCreate struct {
	Title    string `json:"title"`    // => min_length=1 by hand: empty (or blank) is rejected below
	Priority int    `json:"priority"` // => gt=0 by hand: zero or negative is rejected below
} // => the struct closes: json tags keep both wire keys stable

// => decodeTaskCreate parses the body AND enforces every field rule in order:
// => first the body is valid JSON, then the title is non-empty, then the
// => priority is positive -- the first failure wins, exactly like Pydantic's
// => ordered field validation, except every rule here is hand-written
func decodeTaskCreate(r *http.Request) (taskCreate, error) { // => parse+check, one place, like ex-29
	var body taskCreate                          // => zero-value target: empty title, zero priority
	err := json.NewDecoder(r.Body).Decode(&body) // => one decode pass fills every field it can type-check
	if err != nil {                              // => not valid JSON at all, or a wrong type as in ex-30
		return taskCreate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so callers can errors.Is/As the cause
	} // => the decode-failure branch ends: nothing below runs on a bad body

	if strings.TrimSpace(body.Title) == "" { // => the min_length=1 rule decoding will NEVER enforce
		return taskCreate{}, errors.New("title must not be empty") // => mirrors Field(min_length=1): rejects "" and "   "
	} // => the empty-title branch ends

	if body.Priority <= 0 { // => the gt=0 rule: strictly positive, so 0 itself fails
		return taskCreate{}, errors.New("priority must be greater than 0") // => mirrors Field(gt=0): rejects 0 and negatives
	} // => the non-positive-priority branch ends

	return body, nil // => success: present, typed, AND within range
} // => decodeTaskCreate ends: three ordered gates, one success path

// => writeJSON: the same serialization path every example in this batch reuses
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared response writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => map payloads here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends, unchanged from ex-29 so its shape stays familiar

// => the handler stays thin: decode, then either error or echo
// => every constraint lives above this function, never inside it
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature -- w writes, r reads
	task, err := decodeTaskCreate(r) // => decode-and-validate in one call, exactly as ex-29 did
	if err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, // => 422: well-formed HTTP, semantically invalid body
			map[string]string{"error": err.Error()}) // => the constraint text IS the client-facing payload here
		return // => early return: the happy path below only runs for valid bodies
	} // => the invalid-body branch closes

	writeJSON(w, http.StatusCreated, // => 201: a new resource representation is being returned
		map[string]any{"title": task.Title, "priority": task.Priority}) // => both fields survived every check above
} // => createTask ends: two writes, one per branch outcome

// => the routing table: one route, method-prefixed so only POST matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                 // => ServeMux again, plain patterns only
	mux.HandleFunc("POST /tasks", createTask) // => co-08: a handler for creating a task; other methods fall through to 405
	return mux                                // => the mux itself already satisfies http.Handler
} // => newHandler ends

func main() { // => the executable entry point: two lines, both deliberate
	log.Println("listening on 127.0.0.1:8000")                     // => the one startup line uvicorn printed, Go's turn
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends: start the server, then let the kernel keep it alive
