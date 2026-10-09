package main

import "fmt"

func main() { // => Closes a filled buffer so range can terminate.
	values := make(chan int, 2) // => Room for both values before reads.
	values <- 1                 // => First queued value.
	values <- 2                 // => Second queued value.
	close(values)               // => Signal that no further values will arrive.
	for value := range values { // => Drain buffer; stop when closed and empty.
		fmt.Println(value) // => Prints 1, then 2.
	}
}
