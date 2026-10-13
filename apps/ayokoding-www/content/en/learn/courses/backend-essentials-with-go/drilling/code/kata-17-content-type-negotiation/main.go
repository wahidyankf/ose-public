// Kata 17: Decide JSON-vs-reject from a Content-Type header.
//
// Hand-written content-type enforcement: accept only an
// application/json-compatible media type, else reject with 422.
// A charset suffix is tolerated; a missing or wrong type is not.
package main

import (
	"fmt"     // => prints each header verdict
	"log"     // => fail-fast on any self-check mismatch
	"strings" // => splits off charset suffixes and lowercases the media type
)

// AcceptsJSONBody mirrors strict JSON content-type enforcement.
func AcceptsJSONBody(contentType string) (bool, int) { // => returns (shouldParse, status)
	if strings.TrimSpace(contentType) == "" { // => no Content-Type header sent at all
		return false, 422 // => still 422: the body cannot satisfy the JSON model
	}
	mediaType := strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0])) // => strip "; charset=utf-8" if present
	if mediaType == "application/json" {                                                // => co-21: the only media type accepted as JSON here
		return true, 200
	}
	return false, 422 // => co-21: not a dedicated 415 in this course's convention
}

func main() {
	jsonCT := "application/json"                         // => the well-formed expected case
	jsonWithCharset := "application/json; charset=utf-8" // => co-21: a charset suffix must not break matching
	plainTextCT := "text/plain"                          // => co-21: JSON body sent with the wrong declared type
	missingCT := ""                                      // => co-21: no Content-Type header at all

	cases := []struct{ label, ct string }{ // => four header situations, one verdict each
		{"json", jsonCT},
		{"json+charset", jsonWithCharset},
		{"plain-text", plainTextCT},
		{"missing", missingCT},
	}
	for _, c := range cases { // => evaluate each header in order
		accepted, status := AcceptsJSONBody(c.ct) // => the verdict for this header
		fmt.Println(c.label, accepted, status)    // => Output rows: json true 200 / json+charset true 200 / plain-text false 422 / missing false 422
	}

	if ok, code := AcceptsJSONBody(jsonCT); !ok || code != 200 { // => exact JSON passes
		log.Fatalf("jsonCT = (%v,%d), want (true,200)", ok, code)
	}
	if ok, code := AcceptsJSONBody(jsonWithCharset); !ok || code != 200 { // => charset suffix tolerated
		log.Fatalf("charset CT = (%v,%d), want (true,200)", ok, code)
	}
	if ok, code := AcceptsJSONBody(plainTextCT); ok || code != 422 { // => wrong type rejected by hand-written check
		log.Fatalf("plainText = (%v,%d), want (false,422)", ok, code)
	}
	if ok, code := AcceptsJSONBody(missingCT); ok || code != 422 { // => missing header rejected too
		log.Fatalf("missing = (%v,%d), want (false,422)", ok, code)
	}
	fmt.Println("kata-17 OK") // => the self-check line this track greps for
}
