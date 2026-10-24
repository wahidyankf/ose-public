// Example 15: Join Independent Failures.
//
// When several independent validations run, errors.Join bundles every failure
// into one error instead of stopping at the first. Is and As still match parts.
package main

import (
	"errors" // => Join bundles; Is still matches each bundled part
	"fmt"    // => prints the joined message and each individual verdict
)

// validateName and validateAge fail independently: neither gates the other.
// => separate functions: each owns exactly one rule and one message
func validateName(name string) error { // => nil when the rule holds
	// => empty names are rejected: the rule in one comparison
	if name == "" { // => violation: build this check's own failure
		return errors.New("name is empty") // => standalone error value
	}
	return nil // => rule holds: contribute nothing to the join
}

// validateAge rejects negative ages with its own independent failure value.
func validateAge(age int) error { // => same shape: nil or one failure
	// => negative ages are impossible: the rule in one comparison
	if age < 0 { // => violation: this check's failure, built the same way
		return errors.New("age is negative") // => standalone error value
	}
	return nil // => rule holds: contribute nothing to the join
}

func main() {
	// => run BOTH checks even though the first already failed: no short-circuit
	// => nil results contribute nothing: Join skips nils silently by design
	err := errors.Join(validateName(""), validateAge(-2)) // => two failures in one
	// => joined message concatenates parts with newlines, in join order
	fmt.Println(err) // => Output: name is empty
	// => age is negative (errors.Join separates parts with newlines)
	// => Is sees THROUGH the join: each part still matches individually
	fmt.Println(errors.Is(err, validateName(""))) // => Output: true
	// => different message, different value: correctly reports no match
	fmt.Println(errors.Is(err, errors.New("other"))) // => Output: false
}
