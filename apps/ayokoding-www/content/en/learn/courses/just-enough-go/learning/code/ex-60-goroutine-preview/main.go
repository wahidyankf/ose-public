package main

import (
	"fmt"
	"sync"
)

func main() { // => Waits for one worker to print before exit.
	var wait sync.WaitGroup                                     // => Tracks the single worker.
	wait.Add(1)                                                 // => Register it before starting.
	go func() { defer wait.Done(); fmt.Println("goroutine") }() // => Done runs after printing.
	wait.Wait()                                                 // => Main waits, so the message is observable.
}
