package main

import "fmt"

func main() { // => Uses default because no sender makes receive ready.
	values := make(chan int) // => No sender exists, so receive is unready.
	select {                 // => Default prevents waiting indefinitely.
	case value := <-values: // => Cannot run for this program state.
		fmt.Println(value) // => Would print only if a value arrived.
	default: // => Runs immediately when receive is unready.
		fmt.Println("not ready") // => Output: not ready.
	}
}
