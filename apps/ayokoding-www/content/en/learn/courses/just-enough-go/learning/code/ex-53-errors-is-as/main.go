package main

import (
	"errors"
	"fmt"
)

var ErrMissing = errors.New("missing") // => Target for errors.Is.

type StatusError struct{ Code int } // => Target type for errors.As.

func (err *StatusError) Error() string { return "status error" } // => Pointer implements error.

func main() { // => Compares a sentinel and extracts a wrapped concrete error.
	cause := &StatusError{Code: 503}                                          // => Concrete cause carries code 503.
	err := fmt.Errorf("wrapped: %w", cause)                                   // => Preserve cause in error chain.
	var status *StatusError                                                   // => As writes matched pointer here.
	fmt.Println(errors.Is(fmt.Errorf("wrapped: %w", ErrMissing), ErrMissing)) // => Output: true.
	fmt.Println(errors.As(err, &status), status.Code)                         // => Output: true 503.
}
