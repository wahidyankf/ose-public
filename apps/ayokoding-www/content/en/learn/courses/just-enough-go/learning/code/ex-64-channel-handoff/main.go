package main

import "fmt"

func main() { // => Receives one string from a worker.
	result := make(chan string)      // => Carries one string with no buffer.
	go func() { result <- "ship" }() // => Worker waits for main to receive.
	fmt.Println(<-result)            // => Handoff completes; output: ship.
}
