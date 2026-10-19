# WebAssembly hello

The unit runs a WASI module built from Go (`GOOS=wasip1 GOARCH=wasm`) and
prints a fixed line. `main.wasm` is a committed fixture; rebuild it with
the same Go toolchain when the source changes.

**`learning/code/ex-01-miracle/miracle.go`**

```go
package main

import "fmt"

func main() {
	fmt.Println("miracle")
}
```

**Output** (`learning/code/ex-01-miracle/expected/main.stdout.txt`):

```text
miracle
```
