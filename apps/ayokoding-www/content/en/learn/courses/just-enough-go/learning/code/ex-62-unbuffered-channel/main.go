package main

import "fmt"

func main() { // => Pairs one worker send with one main receive.
	values := make(chan int)    // => Zero capacity means each send needs a receiver.
	go func() { values <- 7 }() // => Worker blocks until main receives 7.
	fmt.Println(<-values)       // => Receive pairs with send; output: 7.
}
