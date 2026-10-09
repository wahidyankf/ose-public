package main

import "fmt"

func main() { // => Makes both select branches ready before selection.
	left, right := make(chan string, 1), make(chan string, 1) // => Each has one slot.
	left <- "left"                                            // => Left receive is ready.
	right <- "right"                                          // => Right receive is also ready.
	select {                                                  // => Choose one ready case; no ordering guarantee.
	case value := <-left: // => One possible branch.
		fmt.Println(value) // => Could print left.
	case value := <-right: // => Other possible branch.
		fmt.Println(value) // => Could print right.
	}
}
