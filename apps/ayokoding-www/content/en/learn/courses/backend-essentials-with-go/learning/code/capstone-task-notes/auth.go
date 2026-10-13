// Capstone: auth.go -- the bearer-token check protecting writes.
//
// The token rule, isolated in its own file so main.go never mixes identity
// with routing: only WRITES need a token (POST, PUT, DELETE on /tasks*),
// reads (/tasks*, /health, /ready) stay OPEN. Missing AND wrong collapse
// into the SAME 401 envelope on purpose -- one outcome, no distinguishing
// leak. The middleware shape mirrors the Python capstone's
// token_check_middleware; the hard examination (exact match against the
// stand-in constant) mirrors the auth tier's require_token.
package main

import (
	"net/http" // => the middleware signature: wrap a handler, return a handler
)

// validToken is the hardcoded stand-in for a real signed/opaque token --
// the SAME literal every curl below presents as "Authorization: Bearer ...".
const validToken = "s3cr3t-token-abc123" // => a demo constant, never a real secret -- see ex-58's minting

// writeMethods are the verbs that need a token -- reads never appear here,
// so GET /tasks* plus /health and /ready pass through untouched.
var writeMethods = map[string]bool{ // => membership IS the policy -- three verbs, nothing else
	"POST":   true, // => create -- a WRITE, guarded
	"PUT":    true, // => replace -- a WRITE, guarded
	"DELETE": true, // => remove -- a WRITE, guarded
}

// needsToken reports whether THIS request must carry a token: a task path
// (/tasks or /tasks/...) reached via a write verb. Health, readiness, and
// every GET fall through as open -- the middleware never even LOOKS at them.
func needsToken(r *http.Request) bool { // => true means "the guard below must see a valid token"
	path := r.URL.Path                                                       // => the raw path -- "/tasks", "/tasks/3", "/health", ...
	isTaskPath := path == "/tasks" || len(path) > 7 && path[:7] == "/tasks/" // => prefix match on the task tree only
	return isTaskPath && writeMethods[r.Method]                              // => BOTH conditions: task path AND write verb -- reads stay open
}

// withAuth is the middleware: it wraps the whole mux, checks the token on
// writes, and passes everything else through unmodified. A rejection is a
// 401 in the SAME {"error":{...}} envelope every other error in this app
// uses -- the client parses one shape, whatever failed.
func withAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !needsToken(r) { // => open route (any GET, /health, /ready) -- no header examined at all
			next.ServeHTTP(w, r) // => unmodified pass-through -- the fast path for reads
			return               // => returned BEFORE any token logic -- reads cannot 401, by construction
		}
		if r.Header.Get("Authorization") != "Bearer "+validToken { // => exact match: missing OR wrong land here
			writeError(w, http.StatusUnauthorized, "unauthorized", "missing or invalid token") // => 401, enveloped
			return                                                                             // => rejected BEFORE the wrapped handler's body ever runs -- no row created, changed, or gone
		}
		next.ServeHTTP(w, r) // => the token matched: the wrapped WRITE proceeds unmodified
	})
}
