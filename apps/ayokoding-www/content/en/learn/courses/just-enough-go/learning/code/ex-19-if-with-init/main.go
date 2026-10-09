package main

import (
	"errors"
	"fmt"
)

func lookup(ok bool) (string, error) { // => lookup returns either a name or an error, according to ok.
	if !ok { // => false selects the missing-value path.
		return "", errors.New("missing") // => The name is empty whenever the error is non-nil.
	}
	return "release", nil // => true returns the release name and a nil error.
}

func main() { // => main keeps name and err scoped to this one if statement.
	if name, err := lookup(true); err != nil { // => lookup(true) initializes both values before err is tested.
		fmt.Println(err) // => The failure branch would print the error.
	} else { // => This branch runs only when err is nil.
		fmt.Println(name) // => This run prints release from the success branch.
	}
}
