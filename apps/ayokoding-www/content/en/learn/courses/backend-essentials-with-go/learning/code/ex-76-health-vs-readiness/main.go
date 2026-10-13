// Example 76: Health vs Readiness -- /health never touches state, /ready pings it.
//
// Two DIFFERENT questions that sound similar: "is the process alive"
// (health) versus "can this instance actually do its job right now"
// (readiness). Orchestrators treat them differently: a failed health check
// usually triggers a RESTART, a failed readiness check just pulls the
// instance out of rotation until it recovers on its own.
//
// The Python twin pings a real SQLite file (its path overridable via
// TASKS_DB_PATH, so a missing parent dir genuinely breaks readiness). This
// Go port stays stdlib-only, so /ready probes the same env var the same
// way: unset means "in-memory store" (always ready); set means "prove that
// path is genuinely writable" by creating it -- a missing parent dir fails
// the probe for real, never by hand-faked response.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/health" # {"status":"ok"} -- always 200, no dependency
//	curl "http://127.0.0.1:8000/ready"  # {"status":"ready"} -- the store answers
//
// And the down-dependency case (a second shell, server restarted with the var):
//
//	TASKS_DB_PATH=/nonexistent-dir/tasks.db go run . # parent dir does not exist...
//	curl "http://127.0.0.1:8000/health" # STILL 200 -- liveness never depends on storage
//	curl -i "http://127.0.0.1:8000/ready" # 503 {"status":"not_ready",...} -- genuinely failed
package main

import (
	"encoding/json" // => encodes the three tiny status bodies below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"os"            // => Getenv reads TASKS_DB_PATH; OpenFile performs the genuine probe
)

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// health serves GET /health -- LIVENESS: "is the process itself running
// and responsive at all?" No dependency on anything external: always 200.
func health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"}) // => no probe, no store, no failure mode
}

// ready serves GET /ready -- READINESS: "can this instance actually SERVE
// a real request?" With TASKS_DB_PATH unset the store is in-memory and the
// answer is trivially yes; with it set, a REAL filesystem probe runs --
// the cheapest genuine reachability check stdlib-only Go can perform.
func ready(w http.ResponseWriter, r *http.Request) {
	dbPath := os.Getenv("TASKS_DB_PATH") // => empty means in-memory: no external dependency to fail
	if dbPath == "" {                    // => the default demo shape -- nothing to ping, always ready
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"}) // => 200, no probe needed
		return
	}
	// => a path IS configured: prove it is genuinely writable, exactly like
	// => the Python twin's sqlite3.connect(DB_PATH) attempt -- no mocks, the
	// => OS itself decides whether this succeeds or fails.
	probe, err := os.OpenFile(dbPath, os.O_RDWR|os.O_CREATE, 0o600) // => O_CREATE touches the real path
	if err != nil {                                                 // => e.g. "no such file or directory"
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{ // => 503: cannot serve traffic now
			"status": "not_ready", // => the machine-readable state a load balancer acts on
			"reason": err.Error(), // => the REAL underlying error, for operator debugging -- never end-user text
		})
		return
	}
	probe.Close()                                                     // => the probe only tested reachability -- close it immediately, keep nothing
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"}) // => 200: the path genuinely answered
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for the two probe routes
	mux.HandleFunc("GET /health", health)                 // => liveness -- never guarded, never probing
	mux.HandleFunc("GET /ready", ready)                   // => readiness -- genuinely pings the configured path
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
