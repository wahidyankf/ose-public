package main

import "fmt"

type StatusError struct{ Code int } // => Carries the status for its message.

func (err StatusError) Error() string { return fmt.Sprintf("status %d", err.Code) } // => Satisfies error.

func main() { var err error = StatusError{Code: 503}; fmt.Println(err) } // => Output: status 503.
