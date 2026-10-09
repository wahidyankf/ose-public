package main

import (
	"errors"
	"fmt"
)

func open(name string) error { // => Returns only an error, no success value.
	if name == "" { // => Empty input is the failure case.
		return errors.New("name is required") // => Caller receives this error value.
	}
	return nil // => Nonempty name succeeds.
}

func main() { // => Calls the failure path to demonstrate explicit error handling.
	if err := open(""); err != nil { // => Check the error before proceeding.
		fmt.Println(err) // => Output: name is required.
	}
}
