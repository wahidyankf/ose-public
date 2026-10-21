// Example 13: Extract Details with errors.As.
//
// Some failures carry data, not just identity. errors.As finds the typed
// link in the chain so the caller can read its fields and react precisely.
package main

import (
	"errors" // => As walks the chain looking for the target type
	"fmt"    // => prints the extracted field and the offending limit
)

// FieldError reports WHICH input failed and the limit it broke.
// => struct, not string: the failure carries machine-readable detail
// => pointer receiver below: As needs a *FieldError target to fill in
type FieldError struct { // => the typed failure this chain will carry
	Field string // => which input broke the rule, e.g. "retries"
	Limit int    // => the boundary it crossed, for the message and the fix
}

// Error satisfies the error interface: message first, data stays on fields.
// => one method makes *FieldError an error: Error() string, nothing more
func (e *FieldError) Error() string { // => pointer receiver matches As target
	// => Sprintf formats the human message from the machine-readable fields
	return fmt.Sprintf("%s exceeds limit %d", e.Field, e.Limit) // => e.g. retries exceeds limit 3
}

// check rejects retry counts above the policy limit with a typed failure.
// => returns the concrete type; callers needing detail use As to find it
func check(retries int) error { // => error interface hides the concrete type
	// => the policy lives here: three retries, no more, for this service
	if retries > 3 { // => breach: build the typed failure with its data
		// => &FieldError: pointer so As can match *FieldError below
		return &FieldError{Field: "retries", Limit: 3} // => data, not text
	}
	return nil // => within policy: nothing to report
}

func main() {
	// => wrap the typed failure the way a middleware layer naturally would
	err := check(9) // => typed failure arrives, concrete type hidden in error
	// => wrap once: proves As sees through context frames to the data
	if err != nil { // => 9 exceeds 3, so err is always set here
		err = fmt.Errorf("apply policy: %w", err) // => context over the data
	}
	// => As target: pointer to a *FieldError variable for As to fill in
	var detail *FieldError // => nil until As finds the typed link
	// => As walks the chain: first *FieldError link wins and fills detail
	if errors.As(err, &detail) { // => true: the chain carries a *FieldError
		// => fields are now readable: react to data, not to message text
		fmt.Println(detail.Field, detail.Limit) // => Output: retries 3
	}
}
