// Kata 10: Parse a raw JSON request body, handling malformed input.
//
// Bodies arrive as bytes. encoding/json turns them into a typed value;
// malformed text or a non-object shape becomes a caller-facing error,
// never a panic.
package main

import (
	"encoding/json" // => the stdlib JSON decoder: text -> Go values
	"fmt"           // => prints each parse outcome
	"log"           // => fail-fast on any self-check mismatch
)

// ParseJSONBody decodes raw text into an object map or a caller-facing reason.
func ParseJSONBody(raw string) (map[string]any, string) { // => returns (parsed, errString); empty errString is success
	var parsed any                                               // => decode into any first so non-objects are detectable
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil { // => co-13: malformed body must not crash the handler
		return nil, fmt.Sprintf("invalid JSON: %v", err) // => caller-facing reason, not a raw traceback
	}
	obj, ok := parsed.(map[string]any) // => co-13: the handler expects an object, not a bare list or number
	if !ok {                           // => valid JSON but the wrong top-level shape
		return nil, "request body must be a JSON object"
	}
	return obj, "" // => JSON objects always have string keys, safe for the handler
}

func main() {
	goodRaw := `{"title": "Ship report", "done": false}` // => a well-formed object body
	malformedRaw := `{"title": "Ship report",}`          // => trailing comma: invalid syntax
	wrongShapeRaw := `[1, 2, 3]`                         // => valid JSON but an array, not an object

	goodParsed, goodErr := ParseJSONBody(goodRaw)                // => should succeed
	malformedParsed, malformedErr := ParseJSONBody(malformedRaw) // => should fail on syntax
	wrongParsed, wrongErr := ParseJSONBody(wrongShapeRaw)        // => should fail on shape

	fmt.Println(goodParsed, goodErr == "")           // => Output: map[done:false title:Ship report] true
	fmt.Println(malformedParsed, malformedErr != "") // => Output: map[] true
	fmt.Println(wrongParsed, wrongErr)               // => Output: map[] request body must be a JSON object

	if goodErr != "" || goodParsed["title"] != "Ship report" || goodParsed["done"] != false { // => the decoded object
		log.Fatalf("good body misparsed: %v err=%q", goodParsed, goodErr)
	}
	if malformedParsed != nil || malformedErr == "" { // => rejected, not silently truncated
		log.Fatalf("malformed body must be rejected")
	}
	if wrongParsed != nil || wrongErr != "request body must be a JSON object" { // => shape guard holds
		log.Fatalf("array body must be rejected as non-object, got err=%q", wrongErr)
	}
	fmt.Println("kata-10 OK") // => the self-check line this track greps for
}
