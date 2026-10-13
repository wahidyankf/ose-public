// Example 10: go mod init -- Nothing to Install.
//
// Every example from here on is served by `go run .` inside its own module.
// This one is the setup step: confirm the toolchain version and that the
// module declares zero third-party dependencies -- the Go analogue of
// pinning framework versions in the Python track.
package main

import (
	"fmt"     // => prints the three-line version report
	"runtime" // => runtime.Version() reads the toolchain the binary was built with
)

func main() {
	fmt.Println("module example/ex-10-go-mod-init") // => the path this directory's go.mod declares
	// => a module path comes from go.mod, not from this print statement --
	// => inspect the colocated go.mod to see the real declaration (co-22)
	fmt.Println("dependencies: none -- net/http is the standard library") // => the whole "install" step
	// => there is no framework to pin: net/http, encoding/json, and net are
	// => all part of the Go standard library, shipped with the toolchain
	fmt.Println("go toolchain:", runtime.Version()) // => e.g. go1.27.2
	// => runtime.Version() is baked in at compile time: the toolchain version
	// => IS this course's stack version, standing in for the Python pins
}
