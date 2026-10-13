// Example 75: Method Not Allowed -- an unsupported method is a 405 with Allow.
//
// No handler in this file raises a 405 by hand: the status comes PURELY
// from route registration. net/http's ServeMux method patterns (since Go
// 1.22) answer 405 automatically when the path matches but the verb does
// not -- and set the Allow header RFC 9110 SS15.5.6 requires, listing the
// method(s) that path genuinely supports. /tasks speaks ONLY GET,
// /reports speaks ONLY POST, so each path's Allow names its own method.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl -i -X DELETE http://127.0.0.1:8000/tasks   # 405, Allow: GET
//	curl -i -X DELETE http://127.0.0.1:8000/reports # 405, Allow: POST -- per-PATH, not fixed
//	curl -i http://127.0.0.1:8000/tasks             # 200 -- registered methods are unaffected
//	curl -i -X POST http://127.0.0.1:8000/reports   # 200 -- same here
package main

import (
	"encoding/json" // => encodes the two tiny success bodies below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole lesson: mux, method patterns, the automatic 405 + Allow
)

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// listTasks serves GET /tasks -- the ONLY verb registered for this exact
// path. No PUT/POST/DELETE exists here at all, so every other verb 405s.
func listTasks(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, []string{"write the report"}) // => a fixed single-item list -- never mutated
}

// createReport serves POST /reports -- a DIFFERENT path with ONLY POST,
// proving Allow reflects the actual path, not one fixed value app-wide.
func createReport(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"created": "true"}) // => reachable only via POST
}

func main() {
	mux := http.NewServeMux() // => one explicit router -- registration alone drives this example
	// => two separate single-method paths: keep them separate (not two patterns on one
	// => path) so each 405's Allow header names exactly the method its own path supports.
	mux.HandleFunc("GET /tasks", listTasks)               // => ONLY GET: DELETE /tasks 405s with "Allow: GET"
	mux.HandleFunc("POST /reports", createReport)         // => ONLY POST: DELETE /reports 405s with "Allow: POST"
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
