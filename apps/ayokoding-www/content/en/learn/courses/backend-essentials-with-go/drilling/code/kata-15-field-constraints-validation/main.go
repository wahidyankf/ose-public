// Kata 15: Validate field constraints without a framework.
//
// Mimics min_length and gt=0 style rules in plain Go, collecting every
// violation instead of stopping at the first so one 422 lists them all.
package main

import (
	"fmt" // => prints each violation list
	"log" // => fail-fast on any self-check mismatch
)

// ValidateConstraints checks title and quantity rules, collecting all failures.
func ValidateConstraints(body map[string]any) []string { // => co-10: mimics typed-model field rules
	var errors []string                // => co-11: collect all violations, not just the first
	title, _ := body["title"].(string) // => type-assert: non-strings fail the length rule below
	if len(title) < 3 {                // => co-10: min_length 3 equivalent
		errors = append(errors, "title: must be a string with min_length 3")
	}
	quantity, ok := body["quantity"].(int) // => Go ints only; floats or strings fail here
	if !ok || quantity <= 0 {              // => co-10: gt=0 equivalent
		errors = append(errors, "quantity: must be an integer greater than 0")
	}
	return errors // => empty means the body satisfies every constraint
}

func main() {
	valid := map[string]any{"title": "Ship it", "quantity": 3}       // => satisfies both rules
	shortTitle := map[string]any{"title": "Hi", "quantity": 3}       // => violates min_length
	badQuantity := map[string]any{"title": "Ship it", "quantity": 0} // => violates gt=0
	bothBad := map[string]any{"title": "Hi", "quantity": -1}         // => violates both

	fmt.Println(ValidateConstraints(valid))       // => Output: []
	fmt.Println(ValidateConstraints(shortTitle))  // => Output: [title: must be a string with min_length 3]
	fmt.Println(ValidateConstraints(badQuantity)) // => Output: [quantity: must be an integer greater than 0]
	fmt.Println(ValidateConstraints(bothBad))     // => Output: [title: must be a string with min_length 3 quantity: must be an integer greater than 0]

	if len(ValidateConstraints(valid)) != 0 { // => nothing to reject, the body is valid
		log.Fatalf("valid body must have zero errors")
	}
	if len(ValidateConstraints(shortTitle)) != 1 { // => exactly one violation
		log.Fatalf("short title must have one error")
	}
	if len(ValidateConstraints(bothBad)) != 2 { // => co-11: both violations reported in one 422
		log.Fatalf("both-bad body must have two errors, got %v", ValidateConstraints(bothBad))
	}
	fmt.Println("kata-15 OK") // => the self-check line this track greps for
}
