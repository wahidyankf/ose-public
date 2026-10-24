// Example 30: Pin the Toolchain in go.mod.
//
// The go directive declares the assumed language version, so a wrong toolchain
// fails loudly instead of miscompiling quietly. The runtime reports itself here.
package main

import (
	"fmt"           // => prints the toolchain version twice, two independent ways
	"runtime"       // => Version reports the exact toolchain running this binary
	"runtime/debug" // => ReadBuildInfo reports the same version from metadata
)

func main() {
	// => runtime.Version is baked at build: "go1.27.2" under the pinned image
	fmt.Println(runtime.Version()) // => Output: go1.27.2
	// => BuildInfo carries the same version as module metadata: cross-checked
	// => GOOS and GOARCH are deliberately NOT printed: they vary by platform,
	// => so asserting them would make the run host-dependent instead of exact
	if info, ok := debug.ReadBuildInfo(); ok { // => module-built: always true here
		fmt.Println(info.GoVersion) // => Output: go1.27.2
	}
}
