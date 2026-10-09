package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) { // => The two return positions carry the quotient and failure status.
	if b == 0 { // => Zero cannot be used as a divisor.
		return 0, errors.New("zero divisor") // => On failure, return a placeholder quotient and non-nil error.
	}
	return a / b, nil // => On success, return integer division and nil error.
}

func main() { // => The caller handles the error before using q.
	q, err := divide(8, 2) // => This call returns q=4 and err=nil.
	if err != nil {        // => Only a failed call enters this branch.
		fmt.Println("divide failed:", err) // => The failure branch reports the error instead of printing q.
		return                             // => Stop main after reporting a failure.
	}
	fmt.Println(q) // => Output: 4 for the successful call.
}
