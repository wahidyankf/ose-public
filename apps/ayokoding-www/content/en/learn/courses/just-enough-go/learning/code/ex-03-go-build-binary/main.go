package main

import "fmt"

func main() { // => go build compiles this entry point into the named binary.
	// Build with: go build -o hello main.go
	// The resulting hello executable can run without go run.
	fmt.Println("hello binary") // => Output when ./hello runs.
}
