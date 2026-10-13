// Kata 07: Determine method idempotency from a dispatch table.
//
// RFC 9110 marks some methods idempotent. A client library may blindly
// retry only those; POST and PATCH must never be retried blindly.
package main

import (
	"fmt"     // => prints the verdict map
	"log"     // => fail-fast on any self-check mismatch
	"strings" // => normalizes method casing before lookup
)

// IdempotentMethods is RFC 9110's idempotent set.
var IdempotentMethods = map[string]bool{ // => repeating any of these converges to the same state
	"GET": true, "HEAD": true, "PUT": true, "DELETE": true, "OPTIONS": true, "TRACE": true,
}

// IsIdempotent reports whether the method is safe to replay.
func IsIdempotent(method string) bool { // => O(1) map lookup
	return IdempotentMethods[strings.ToUpper(method)] // => normalize: HTTP methods are conventionally upper
}

// SafeToBlindRetry is what a client library would actually call.
func SafeToBlindRetry(method string) bool { // => the practical consequence clients rely on
	return IsIdempotent(method) // => co-02: only idempotent methods retry without side effects
}

func main() {
	methods := []string{"GET", "POST", "PUT", "PATCH", "DELETE"} // => the five methods this course teaches
	results := make(map[string]bool, len(methods))               // => one verdict per method
	for _, m := range methods {                                  // => classify each in order
		results[m] = IsIdempotent(m) // => store the verdict under the method name
	}
	fmt.Println(results) // => Output: map[DELETE:true GET:true PATCH:false POST:false PUT:true]

	if results["POST"] { // => co-02: POST is explicitly not idempotent
		log.Fatalf("POST must not be idempotent")
	}
	if results["PATCH"] { // => PATCH is neither safe nor idempotent
		log.Fatalf("PATCH must not be idempotent")
	}
	if !results["PUT"] { // => PUT converges to the same state on replay
		log.Fatalf("PUT must be idempotent")
	}
	if !SafeToBlindRetry("GET") { // => reads are always safe to retry
		log.Fatalf("GET must be safe to retry")
	}
	if SafeToBlindRetry("POST") { // => a client must not blindly retry a bare POST
		log.Fatalf("POST must not be safe to retry")
	}
	fmt.Println("kata-07 OK") // => the self-check line this track greps for
}
