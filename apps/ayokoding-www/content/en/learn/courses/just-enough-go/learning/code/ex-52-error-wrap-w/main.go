package main

import (
	"errors"
	"fmt"
)

var ErrMissing = errors.New("missing") // => Sentinel retained inside wrapped error.

func load() error { return fmt.Errorf("load config: %w", ErrMissing) } // => %w preserves unwrap behavior.

func main() { err := load(); fmt.Println(errors.Unwrap(err)) } // => Output: missing.
