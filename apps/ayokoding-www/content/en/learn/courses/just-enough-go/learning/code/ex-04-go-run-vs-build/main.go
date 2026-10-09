package main

import "fmt"

func main() { // => The build script shows what each tool command leaves behind.
	// go run compiles and immediately executes a temporary program.
	// go build leaves a named executable as the release artifact.
	fmt.Println("compare go run main.go with go build -o hello main.go") // => Program output is the same.
}
