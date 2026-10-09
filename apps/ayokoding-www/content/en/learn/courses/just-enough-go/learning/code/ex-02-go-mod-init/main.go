package main

import "fmt"

func main() { // => A module path is recorded in go.mod, outside this function.
	// Run: go mod init example/hello
	// That command writes go.mod; this program belongs to that module.
	fmt.Println("module example/hello is ready") // => Output after the module already exists.
}
