// Kata 03: Validate required fields into a 422 error envelope.
//
// Hand-written validation that mirrors what a typed model enforces:
// reject a bad shape with a 422 before any business logic runs.
package main

import (
	"encoding/json" // => renders the envelope so the shape is visible
	"fmt"           // => prints the nil case and the envelope JSON
	"log"           // => fail-fast on any self-check mismatch
)

// ErrorBody is the fixed inner shape every error path returns.
type ErrorBody struct { // => co-11: one fixed shape, never a bare string
	Code    string   `json:"code"`    // => machine-readable, e.g. validation_error
	Message string   `json:"message"` // => human-readable summary
	Detail  []string `json:"detail"`  // => names exactly which fields were missing
}

// ErrorEnvelope wraps the body with its status code.
type ErrorEnvelope struct { // => the full response document
	Status int       `json:"status"` // => 422 Unprocessable Content here
	Error  ErrorBody `json:"error"`  // => nested under one constant key
}

// ValidateRequired returns nil when nothing is missing, else a 422 envelope.
func ValidateRequired(body map[string]any, required []string) *ErrorEnvelope { // => co-10/co-11: reject before handler logic
	var missing []string             // => every required field not present
	for _, field := range required { // => one membership check per required name
		if _, ok := body[field]; !ok { // => absent key means a missing field
			missing = append(missing, field) // => collect it for the detail list
		}
	}
	if len(missing) == 0 { // => nothing missing, the body is well-shaped
		return nil // => nil means "no error", the handler may proceed
	}
	return &ErrorEnvelope{ // => co-11: a consistent JSON envelope, never a stack trace
		Status: 422, // => co-03: 422 defined natively in RFC 9110
		Error: ErrorBody{
			Code:    "validation_error",          // => stable code clients can switch on
			Message: "missing required field(s)", // => human summary of the failure
			Detail:  missing,                     // => exactly which fields to fix
		},
	}
}

func main() {
	goodBody := map[string]any{"title": "Ship report", "owner": "alice"} // => fully shaped
	badBody := map[string]any{"title": "Ship report"}                    // => owner is missing
	required := []string{"title", "owner"}                               // => both fields required

	goodResult := ValidateRequired(goodBody, required) // => nothing missing
	badResult := ValidateRequired(badBody, required)   // => owner missing
	fmt.Println(goodResult)                            // => Output: <nil>
	badJSON, _ := json.Marshal(badResult)              // => render the envelope as JSON text
	fmt.Println(string(badJSON))                       // => Output: {"status":422,"error":{"code":"validation_error","message":"missing required field(s)","detail":["owner"]}}

	if goodResult != nil { // => a fully-shaped body produces no envelope
		log.Fatalf("good body must validate to nil, got %+v", goodResult)
	}
	if badResult == nil { // => a missing field must produce an envelope
		log.Fatalf("bad body must produce a 422 envelope")
	}
	if badResult.Status != 422 { // => the status guards the shape failure
		log.Fatalf("status = %d, want 422", badResult.Status)
	}
	if len(badResult.Error.Detail) != 1 || badResult.Error.Detail[0] != "owner" { // => names the exact missing field
		log.Fatalf("detail = %v, want [owner]", badResult.Error.Detail)
	}
	fmt.Println("kata-03 OK") // => the self-check line this track greps for
}
