package main

import "fmt"

func main() { // => Queues exactly two values in a two-slot buffer.
	values := make(chan int, 2)     // => Buffer holds two queued integers.
	values <- 1                     // => First send fits without a receiver.
	values <- 2                     // => Second send fills the buffer.
	fmt.Println(<-values, <-values) // => FIFO receives print 1 2.
}
