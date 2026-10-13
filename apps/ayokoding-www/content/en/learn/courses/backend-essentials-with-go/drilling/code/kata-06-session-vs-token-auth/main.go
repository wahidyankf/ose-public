// Kata 06: Authenticate via session cookie vs bearer token.
//
// Sessions keep identity in server-side state keyed by a cookie;
// bearer tokens carry identity in the token itself. Both checks below
// run against mocked stores, with no network involved.
package main

import (
	"fmt" // => prints each authentication outcome
	"log" // => fail-fast on any self-check mismatch
)

// CheckSession looks a cookie up in a server-side store.
func CheckSession(sessionID string, sessions map[string]string) (string, bool) { // => co-17: the store, not the cookie, is truth
	if sessionID == "" { // => no cookie sent at all
		return "", false
	}
	caller, ok := sessions[sessionID] // => opaque key into server-side state
	return caller, ok                 // => empty + false when unknown or expired
}

// CheckBearerToken self-validates an Authorization header value.
func CheckBearerToken(authorization string, validTokens map[string]string) (int, string) { // => returns (status, caller)
	const prefix = "Bearer "                                                                               // => co-18: the required scheme prefix
	if authorization == "" || len(authorization) <= len(prefix) || authorization[:len(prefix)] != prefix { // => missing or malformed
		return 401, "" // => reject before ever touching validTokens
	}
	token := authorization[len(prefix):] // => strip the scheme, keep the opaque value
	caller, ok := validTokens[token]     // => co-18: reads Authorization, validates the token
	if !ok {                             // => the token matches no known-valid entry
		return 401, ""
	}
	return 200, caller // => a good token identifies the caller with no session lookup
}

func main() {
	sessions := map[string]string{"sess-abc123": "alice"} // => co-17: session store, state lives on the server
	tokens := map[string]string{"tok-xyz789": "bob"}      // => co-17/co-18: token validity set, state lives in the token

	sessionHit, hitOK := CheckSession("sess-abc123", sessions) // => cookie resolves via the store
	_, missOK := CheckSession("sess-nope", sessions)           // => an unknown or expired session id
	fmt.Println(sessionHit, missOK)                            // => Output: alice false

	statusOK, callerOK := CheckBearerToken("Bearer tok-xyz789", tokens)  // => a valid bearer token
	statusMissing, callerMissing := CheckBearerToken("", tokens)         // => co-18: no Authorization header at all
	statusBad, callerBad := CheckBearerToken("Bearer tok-wrong", tokens) // => co-18: malformed or unknown token
	fmt.Println(statusOK, callerOK)                                      // => Output: 200 bob
	fmt.Println(statusMissing, callerMissing)                            // => Output: 401
	fmt.Println(statusBad, callerBad)                                    // => Output: 401

	if !hitOK || sessionHit != "alice" { // => the cookie alone means nothing without the store
		log.Fatalf("session hit = (%q,%v), want (alice,true)", sessionHit, hitOK)
	}
	if missOK { // => unknown ids must miss
		log.Fatalf("unknown session must miss")
	}
	if statusOK != 200 || callerOK != "bob" { // => the token alone is enough
		log.Fatalf("valid token = (%d,%q), want (200,bob)", statusOK, callerOK)
	}
	if statusMissing != 401 || statusBad != 401 { // => co-18: both reject with 401, not a crash
		log.Fatalf("missing/bad must be 401, got %d/%d", statusMissing, statusBad)
	}
	fmt.Println("kata-06 OK") // => the self-check line this track greps for
}
