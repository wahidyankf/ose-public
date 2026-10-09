package main

import (
	"fmt"
	"sync"
)

func main() { // => Passes a label to one anonymous worker.
	var wait sync.WaitGroup                                                      // => Tracks the anonymous worker.
	wait.Add(1)                                                                  // => Register before launch.
	go func(label string) { defer wait.Done(); fmt.Println(label) }("anonymous") // => Pass label at launch.
	wait.Wait()                                                                  // => Output: anonymous before main exits.
}
