package main

import (
	"errors"
	"fmt"
)

func main() { err := errors.New("release unavailable"); fmt.Println(err.Error()) } // => Prints release unavailable.
