// Example 26: Name Your Module Path.
//
// Every Go project starts with a module path in go.mod, and that path is the
// import prefix for everything inside it. BuildInfo reports it back at runtime.
package main

import (
	"fmt"           // => prints the module path the runtime reports
	"runtime/debug" // => BuildInfo exposes the binary's own module metadata
)

func main() {
	// => ReadBuildInfo returns ok=false only for binaries built without modules
	info, ok := debug.ReadBuildInfo() // => metadata stashed at build time
	// => without module metadata there is no path to report: guard it
	if !ok { // => unreachable for module-built binaries like this one
		fmt.Println("no build info") // => kept so the guard stays explicit
		return                       // => nothing truthful left to print
	}
	// => Path is exactly the module line from this unit's go.mod file
	fmt.Println(info.Path) // => Output: golangindepth/ex26module
	// => Main.Version is empty for a main module: no version of yourself
	fmt.Println("version:", info.Main.Version) // => Output: version:
}
