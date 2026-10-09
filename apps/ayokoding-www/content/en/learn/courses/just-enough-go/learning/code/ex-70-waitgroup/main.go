package main

import (
	"fmt"
	"sync"
)

func main() { // => Waits for two workers before printing completion.
	var wait sync.WaitGroup  // => Counts unfinished workers.
	for i := 0; i < 2; i++ { // => Launch workers for 0 and 1.
		wait.Add(1)                                                     // => Register each before launch.
		go func(value int) { defer wait.Done(); fmt.Println(value) }(i) // => Pass i; print order varies.
	}
	wait.Wait()             // => Blocks until both Done calls.
	fmt.Println("all done") // => Always printed after both numbers.
}
