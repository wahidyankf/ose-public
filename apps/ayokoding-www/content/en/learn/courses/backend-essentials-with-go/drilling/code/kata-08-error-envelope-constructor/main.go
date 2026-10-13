// Kata 08: A reusable error-envelope constructor.
//
// Every failure path funnels through one constructor so five different
// statuses still share one top-level JSON shape. Clients parse once.
package main

import (
	"encoding/json" // => renders each envelope so the shared shape is visible
	"fmt"           // => prints the three envelopes
	"log"           // => fail-fast on any self-check mismatch
)

// APIError is the inner object: a stable code plus human text.
type APIError struct { // => co-11: one fixed shape, never a bare string
	Code    string `json:"code"`    // => stable strings clients can switch on
	Message string `json:"message"` // => actionable text, never a stack trace
	Detail  any    `json:"detail"`  // => optional extra, nil when absent
}

// ErrorEnvelope is the outer document every error path returns.
type ErrorEnvelope struct { // => the full response body
	Status int      `json:"status"` // => the HTTP status traveling with this envelope
	Error  APIError `json:"error"`  // => nested under one constant key
}

// NewErrorEnvelope builds the one shape every failure path calls.
func NewErrorEnvelope(status int, code, message string, detail any) ErrorEnvelope { // => co-11: single constructor, uniform shape
	return ErrorEnvelope{Status: status, Error: APIError{Code: code, Message: message, Detail: detail}}
}

func printEnvelope(env ErrorEnvelope) {
	body, err := json.Marshal(env) // => encode the typed envelope to JSON text
	if err != nil {                // => Marshal fails only for unencodable Detail values
		log.Fatalf("marshal: %v", err)
	}
	fmt.Println(string(body)) // => one JSON document per envelope
}

func main() {
	notFound := NewErrorEnvelope(404, "not_found", "task 42 does not exist", nil)                 // => co-03: a missing resource
	unauthorized := NewErrorEnvelope(401, "unauthorized", "missing or invalid bearer token", nil) // => token-check failure
	serverFault := NewErrorEnvelope(500, "internal_error", "unexpected failure", nil)             // => co-11: never a stack trace

	printEnvelope(notFound)     // => Output: {"status":404,"error":{"code":"not_found","message":"task 42 does not exist","detail":null}}
	printEnvelope(unauthorized) // => Output: {"status":401,"error":{"code":"unauthorized","message":"missing or invalid bearer token","detail":null}}
	printEnvelope(serverFault)  // => Output: {"status":500,"error":{"code":"internal_error","message":"unexpected failure","detail":null}}

	if notFound.Status != 404 { // => the missing-resource status travels with its envelope
		log.Fatalf("notFound status = %d, want 404", notFound.Status)
	}
	if unauthorized.Error.Code != "unauthorized" { // => the stable code clients switch on
		log.Fatalf("unauthorized code = %q", unauthorized.Error.Code)
	}
	if serverFault.Error.Detail != nil { // => no internals leak through Detail here
		log.Fatalf("serverFault detail must be nil")
	}
	fmt.Println("kata-08 OK") // => the self-check line this track greps for
}
