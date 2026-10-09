---
title: "Beginner Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 10
---

Examples 1–26 establish Go's daily toolchain, executable package shape, modules, values, types,
functions, control flow, and deterministic cleanup. Each source lives beside the rendered example.

## Example 1: Hello World and Run

_ex-01 · exercises co-02, co-01_

A `main` package and `main` function form an executable Go command; `fmt.Println` writes its first result. Run the file by name and notice that no separate build artifact remains in this directory. The code block is rendered from `learning/code/ex-01-hello-world-run/main.go`.

```go
package main

import "fmt"

func main() { fmt.Println("hello, Go") } // => Go starts this function when the command runs.; Output: hello, Go
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `hello, Go` appears on standard output.

**Key takeaway**: An executable Go program needs `package main` and `func main()`.

**Why it matters**: This is the smallest complete command you can run while learning the toolchain. Keep its package boundary and entry point in mind when a later example adds functions or imports: those additions still execute only because `main` calls them. Change the greeting, then run the file again to separate source edits from compiler or runtime behavior.

## Example 2: Initialize a Module

_ex-02 · exercises co-03, co-01_

The `go.mod` beside this source names a module; `go mod init example/hello` would create that file in a new directory. The printed sentence is only a message; inspect `go.mod` to see the actual module declaration. The code block is rendered from `learning/code/ex-02-go-mod-init/main.go`.

```go
package main

import "fmt"

func main() { // => A module path is recorded in go.mod, outside this function.
	// Run: go mod init example/hello
	// That command writes go.mod; this program belongs to that module.
	fmt.Println("module example/hello is ready") // => Output after the module already exists.
}
```

**Run**: inspect the colocated `go.mod`, then run `go run .`. To practice creating a module, copy `main.go` into a fresh directory there and run `go mod init example/hello` followed by `go run .`.

**Expected observation**: `module example/hello is ready` appears; inspect `go.mod` for the actual module path.

**Key takeaway**: A module path comes from `go.mod`, not from a print statement.

**Why it matters**: Modules give related packages one import-path prefix and record the Go version and dependencies. The printed line is only a message: it does not create or validate a module. Compare it with `go.mod`, then try `go mod init` in an empty scratch directory to see which artifact the command really creates.

## Example 3: Build a Binary

_ex-03 · exercises co-01_

`go build -o hello main.go` leaves an executable file; running the source with `go run` does not leave that named artifact. The companion script first builds `hello` and then executes that saved binary. The code block is rendered from `learning/code/ex-03-go-build-binary/main.go`.

```go
package main

import "fmt"

func main() { // => go build compiles this entry point into the named binary.
	// Build with: go build -o hello main.go
	// The resulting hello executable can run without go run.
	fmt.Println("hello binary") // => Output when ./hello runs.
}
```

**Run**: `sh build.sh` from this example directory; it builds `hello` and runs that binary.

**Expected observation**: the built `hello` binary prints `hello binary`.

**Key takeaway**: Use `go build` when you need a binary to keep or distribute.

**Why it matters**: The distinction matters when moving from a tutorial command to deployment or automation. `go run` is convenient for a quick check, while `go build` produces the executable you can test and ship. The program output cannot prove which command built it, so inspect the binary created by the companion build script.

## Example 4: Compare Run and Build

_ex-04 · exercises co-01_

The source prints a reminder of the two command paths; the companion script demonstrates a persistent build artifact. Both paths compile the source, but only the build path leaves a named file to inspect. The code block is rendered from `learning/code/ex-04-go-run-vs-build/main.go`.

```go
package main

import "fmt"

func main() { // => The build script shows what each tool command leaves behind.
	// go run compiles and immediately executes a temporary program.
	// go build leaves a named executable as the release artifact.
	fmt.Println("compare go run main.go with go build -o hello main.go") // => Program output is the same.
}
```

**Run**: `sh build.sh` from this example directory; it runs the source, builds `hello`, and checks that the binary exists.

**Expected observation**: `compare go run main.go with go build -o hello main.go` appears.

**Key takeaway**: `go run` executes a compiled temporary program; `go build` writes an executable.

**Why it matters**: A command can produce the same application output through both paths, so observing stdout alone does not show how it was launched. Use this comparison to decide whether you need fast iteration or a retained artifact. The compiler still checks the same source in either case, but the workflow around the result differs.

## Example 5: Use a Package and Import

_ex-05 · exercises co-02_

The `greet` subpackage exports `Message`; `main` imports it by its module path and calls it. The capital M in `Message` makes the function callable from `main` across the package boundary. The code block is rendered from `learning/code/ex-05-package-and-import/main.go`.

```go
package main

import (
	"example/package-import/greet"
	"fmt"
)

func main() { // => The import path comes from go.mod plus the greet directory.
	// Imports are explicit; an unused import is a compile error.
	fmt.Println(greet.Message("Go")) // => Output: hello, Go
}
```

**Run**: `go run .` from this example directory; inspect `greet/greet.go` for the imported package.

**Expected observation**: `hello, Go` comes from the imported package.

**Key takeaway**: An import path joins the module path and subdirectory.

**Why it matters**: Separating a reusable function into a package makes its boundary visible. The capital M in `Message` matters: lowercase names are unavailable to another package. This example is a useful bridge from one-file commands to multi-package programs, and it shows why an import must match the path declared in `go.mod`. The import path is part of that boundary.

## Example 6: Declare Variables

_ex-06 · exercises co-04_

A `var` declaration can state a type explicitly or let Go infer it from an initializer. The compiler checks that each initializer matches the type stated beside its variable. The code block is rendered from `learning/code/ex-06-var-declaration/main.go`.

```go
package main

import "fmt"

func main() { // => The explicit types are checked against their initializers.
	var name string = "Ada" // => name is a string containing Ada.
	var year int = 2026     // => year is an int containing 2026.
	fmt.Println(name, year) // => Output: Ada 2026.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `Ada 2026` appears.

**Key takeaway**: Use `var` when declaration form or an explicit type helps the reader.

**Why it matters**: Variable declarations are common at package scope and when a zero value is useful before assignment. In a function, an initializer can often provide the type without repeating it. Inspect the declarations here and identify which information is supplied by source text and which information the compiler infers. Each form communicates a slightly different intention.

## Example 7: Use Short Variable Declarations

_ex-07 · exercises co-04_

The `:=` form declares and initializes variables inside a function from their right-hand values. `name` remains statically typed even though its declaration does not spell out `string`. The code block is rendered from `learning/code/ex-07-short-var-decl/main.go`.

```go
package main

import "fmt"

func main() { // => Short declarations are legal inside functions.
	name := "Ada"                        // => name has inferred type string.
	fmt.Printf("%s is %T\n", name, name) // => Output: Ada is string.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `Ada is string` appears.

**Key takeaway**: `:=` declares a new local variable; it is not a general assignment operator.

**Why it matters**: Short declarations make local code concise without giving up compile-time types. They are restricted to function bodies and need at least one new variable on the left. Knowing that boundary prevents confusion when a similar-looking `=` updates an existing variable later in a function or in a loop. The compiler makes that distinction visible.

## Example 8: Inspect Zero Values

_ex-08 · exercises co-04_

Declared values receive their type’s zero value before explicit assignment. The four outputs differ because each declared type has its own zero-value rule. The code block is rendered from `learning/code/ex-08-zero-values/main.go`.

```go
package main

import "fmt"

func main() { // => The declarations below begin with their type-specific zero values.
	var n int                                // => n is 0 before assignment.
	var s string                             // => s is the empty string before assignment.
	var ok bool                              // => ok is false before assignment.
	var p *int                               // => p is nil before it points at an integer.
	fmt.Printf("%d %q %t %v\n", n, s, ok, p) // => Output: 0 "" false <nil>.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `0 "" false <nil>` shows zero values for an integer, string, bool, and pointer.

**Key takeaway**: Zero values are defined by type; a nil pointer is not an empty object.

**Why it matters**: A Go declaration without an initializer is still usable for many ordinary values. Zero values reduce boilerplate for counters and flags, but a nil pointer or map may need initialization before use. Read the four outputs as different type-specific states, then decide which one can safely be read or updated.

## Example 9: Group Constants

_ex-09 · exercises co-05_

A grouped `const` declaration gives stable names to values used together. The names describe a fixed application label and port rather than anonymous literals at their use sites. The code block is rendered from `learning/code/ex-09-const-block/main.go`.

```go
package main

import "fmt"

const ( // => Groups immutable application settings.
	AppName     = "ship" // => AppName is an untyped string constant.
	DefaultPort = 8080   // => DefaultPort is an untyped integer constant.
)

func main() { fmt.Println(AppName, DefaultPort) } // => Output: ship 8080.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `ship 8080` appears.

**Key takeaway**: Constants name fixed values and are checked at compile time.

**Why it matters**: Named constants make configuration-like literals easier to read and change consistently in source. They do not replace runtime configuration: a port that differs by environment should be read from outside the binary. Use this example to distinguish an immutable source-level value from a variable that a running program must receive.

## Example 10: Generate an Enum with iota

_ex-10 · exercises co-05_

`iota` supplies successive untyped integer constants inside one const group. The declarations share a const group, so `iota` advances once per specification. The code block is rendered from `learning/code/ex-10-iota-enum/main.go`.

```go
package main

import "fmt"

type state int // => state is a distinct named type whose underlying type is int.

const ( // => iota resets to zero for this declaration group.
	queued  state = iota // => queued is state(0), starting this const group.
	running              // => The omitted expression repeats the prior specification with iota at 1.
	done                 // => iota advances again, giving done the value 2.
)

func main() { fmt.Println(queued, running, done) } // => Output: 0 1 2.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `0 1 2` shows the successive values.

**Key takeaway**: `iota` restarts at zero for each const group.

**Why it matters**: This pattern is useful for a compact set of internal states, but the numeric values can become a compatibility concern if they are persisted or sent over a wire. Inserting a new line changes later values. Prefer explicit values whenever those numbers are part of an external contract. Review the values before exposing them externally.

## Example 11: Convert Numeric Types

_ex-11 · exercises co-06_

Go does not silently mix `int` and `float64`; the program converts before arithmetic. Go requires `float64(n)` before the integer can participate in floating-point multiplication. The code block is rendered from `learning/code/ex-11-int-float-types/main.go`.

```go
package main

import "fmt"

func main() { // => Go needs an explicit conversion before multiplying unlike numeric types.
	n := 3                      // => n has inferred type int.
	f := 2.5                    // => f has inferred type float64.
	fmt.Println(float64(n) * f) // => 3 becomes 3.0; output is 7.5.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `7.5` appears after converting `3` to `float64` and multiplying by `2.5`.

**Key takeaway**: Convert numeric values explicitly when their types differ.

**Why it matters**: Explicit conversion makes the point where precision or range may change visible. That matters when a calculation combines counts, measurements, or parsed input. The conversion does not validate whether the number is suitable for the operation; it only changes its type according to Go’s conversion rules. The type checker makes this boundary explicit.

## Example 12: Compare Bytes and Runes

_ex-12 · exercises co-06_

A UTF-8 string has bytes, while a `rune` represents a Unicode code point. Compare byte length, decoded code point, and first byte for the same visible symbol. The code block is rendered from `learning/code/ex-12-string-rune-byte/main.go`.

```go
package main

import "fmt"

func main() { // => The euro sign occupies three bytes in UTF-8.
	s := "€"                             // => One rune, stored as three UTF-8 bytes.
	fmt.Println(len(s), []rune(s), s[0]) // => Output: 3 [8364] 226.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `3 [8364] 226` contrasts the euro sign’s byte length, code point, and first byte.

**Key takeaway**: String byte length and rune count answer different questions.

**Why it matters**: Unicode text can look like one character while occupying several UTF-8 bytes. Indexing a string retrieves a byte, not a full code point; ranging decodes code points. This distinction matters for text validation, truncation, and indexing. Even rune count is not always the same as user-perceived character count. A code point may still span multiple display cells.

## Example 13: Convert Explicitly

_ex-13 · exercises co-06_

The explicit conversion changes a value from one numeric type to another. The two conversion expressions make the destination type visible at each step. The code block is rendered from `learning/code/ex-13-type-conversion/main.go`.

```go
package main

import "fmt"

func main() { // => Each conversion names its destination type.
	n := 7                     // => n has inferred type int.
	var wide int64 = int64(n)  // => wide is the same value in int64 form.
	fmt.Println(float64(wide)) // => Output: 7 as a float64.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `7` appears in default float formatting after `int` → `int64` → `float64` conversion.

**Key takeaway**: The example converts `int` to `int64` and then to `float64`; it does not start with a fractional value.

**Why it matters**: Go requires the programmer to state many conversions that other languages perform implicitly. That clarity helps reviewers notice where representation changes. Here the integer value `7` survives both conversions, even though the final value has type `float64`. Try a large integer and ask whether every integer can still be represented exactly as a float. Numeric conversion does not validate suitability for money or indexes.

## Example 14: Use Boolean Short-Circuiting

_ex-14 · exercises co-06_

Boolean expressions use short-circuit evaluation, so a later operand is skipped when the result is already known. The skipped operand leaves the counter unchanged, exposing the short-circuit rule. The code block is rendered from `learning/code/ex-14-bool-and-comparison/main.go`.

```go
package main

import "fmt"

func main() { // => The function call in the right operand records whether it ran.
	calls := 0                                               // => calls starts at zero.
	ready := false && func() bool { calls++; return true }() // => false makes && skip the function call; ready stays false.
	fmt.Println(ready, calls)                                // => Output: false 0, proving the right operand was skipped.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `false 0` shows the result and the unchanged counter.

**Key takeaway**: Use short-circuiting to guard work that should occur only when an earlier condition permits it.

**Why it matters**: A guard such as `value != nil && value.Ready()` relies on the second expression not running when the first is false. This example makes that control flow observable through a counter. Keep side effects in conditions modest so a reader can still tell which work happens and why. This guard prevents an unnecessary operation.

## Example 15: Write a Basic Function

_ex-15 · exercises co-07_

The named function accepts typed arguments and returns a typed result. The function call supplies values for the parameters declared in its signature. The code block is rendered from `learning/code/ex-15-func-basic/main.go`.

```go
package main

import "fmt"

func twice(n int) int { return n * 2 }          // => twice receives an int and returns twice that value.
func main()           { fmt.Println(twice(4)) } // => twice(4) returns 8, which main prints.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `8` appears from the function call.

**Key takeaway**: Function signatures make inputs and outputs explicit.

**Why it matters**: A small function gives a repeated calculation a name and a testable boundary. Go requires types in its signature, allowing the compiler to reject unsuitable calls. Change one argument and predict the return value before rerunning; that is the foundation for later examples with multiple results and errors. The caller supplies every required argument.

## Example 16: Return a Value and Error

_ex-16 · exercises co-07_

The function returns both a useful value and an `error`, and the caller checks the error before using the value. The caller receives both results and can distinguish success from a recoverable failure. The code block is rendered from `learning/code/ex-16-func-multiple-return/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) { // => The two return positions carry the quotient and failure status.
	if b == 0 { // => Zero cannot be used as a divisor.
		return 0, errors.New("zero divisor") // => On failure, return a placeholder quotient and non-nil error.
	}
	return a / b, nil // => On success, return integer division and nil error.
}

func main() { // => The caller handles the error before using q.
	q, err := divide(8, 2) // => This call returns q=4 and err=nil.
	if err != nil {        // => Only a failed call enters this branch.
		fmt.Println("divide failed:", err) // => The failure branch reports the error instead of printing q.
		return                             // => Stop main after reporting a failure.
	}
	fmt.Println(q) // => Output: 4 for the successful call.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `4` appears after the caller checks the nil error and prints the quotient.

**Key takeaway**: Treat the error result as part of the function contract.

**Why it matters**: A value plus error lets expected failures travel through ordinary control flow instead of a panic. The successful run shows only one branch; try an input that fails and verify the caller does not use an invalid result. This shape appears throughout Go’s standard library and later course examples. The nil error marks success; the caller checks it before using the quotient.

## Example 17: Return Named Values

_ex-17 · exercises co-07_

Named result parameters are initialized to zero values and can be assigned before an explicit return. The returned names are local variables initialized before the function body runs. The code block is rendered from `learning/code/ex-17-named-return-values/main.go`.

```go
package main

import "fmt"

func bounds(values []int) (small, large int) { // => Named results start at zero and are local variables inside bounds.
	small, large = values[0], values[0] // => Seed both bounds from the first element; this example requires a nonempty slice.
	for _, value := range values {      // => Visit every candidate, including the first seeded value.
		if value < small { // => A smaller candidate replaces the current minimum.
			small = value // => small now holds the lowest value seen so far.
		}
		if value > large { // => A larger candidate replaces the current maximum.
			large = value // => large now holds the highest value seen so far.
		}
	}
	return // => Bare return sends the current small and large results to the caller.
}

func main() { fmt.Println(bounds([]int{3, 1, 4})) } // => Output: 1 4, in the same order as the named results.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `1 4` shows both returned values.

**Key takeaway**: Use named results only when their names clarify the return contract.

**Why it matters**: Named results can make several same-typed outputs easier to distinguish, especially in a short function. They also create local variables that a bare `return` would use. In longer functions, bare returns can hide which values leave the function, so this example uses the names to explain the mechanism rather than prescribe it everywhere.

## Example 18: Accept Variadic Arguments

_ex-18 · exercises co-07_

A variadic parameter collects zero or more arguments into a slice inside the function. Each call supplies a different number of values to the same typed variadic parameter. The code block is rendered from `learning/code/ex-18-variadic-func/main.go`.

```go
package main

import "fmt"

func sum(values ...int) int { // => values is a []int inside sum, regardless of call argument count.
	total := 0                     // => The running total starts at zero, so an empty call returns zero.
	for _, value := range values { // => Visit each supplied integer once.
		total += value // => Add the current element to the accumulated total.
	}
	return total // => Return the sum after all arguments have been consumed.
}

func main() { // => The two calls use direct arguments and a spread slice.
	values := []int{4, 5}                     // => values is [4, 5] before expansion at the call site.
	fmt.Println(sum(1, 2, 3), sum(values...)) // => Output: 6 9.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `6 9` shows calls with different argument counts.

**Key takeaway**: Use `...T` when a function naturally accepts a variable number of values of one type.

**Why it matters**: Variadic calls are useful for aggregations and convenience APIs. Inside the function, the arguments are a slice, so normal slice operations apply. A caller can also expand an existing slice with `values...`; without the expansion, the call has a different shape and may fail to compile. The empty call also has a defined result.

## Example 19: Scope a Value in an if

_ex-19 · exercises co-08_

An `if` statement can initialize a local value whose scope includes the condition and its branches. The initialized value exists inside this decision and does not leak into later statements. The code block is rendered from `learning/code/ex-19-if-with-init/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

func lookup(ok bool) (string, error) { // => lookup returns either a name or an error, according to ok.
	if !ok { // => false selects the missing-value path.
		return "", errors.New("missing") // => The name is empty whenever the error is non-nil.
	}
	return "release", nil // => true returns the release name and a nil error.
}

func main() { // => main keeps name and err scoped to this one if statement.
	if name, err := lookup(true); err != nil { // => lookup(true) initializes both values before err is tested.
		fmt.Println(err) // => The failure branch would print the error.
	} else { // => This branch runs only when err is nil.
		fmt.Println(name) // => This run prints release from the success branch.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `release` appears for the chosen branch.

**Key takeaway**: Use an `if` initializer to keep a short-lived value near its decision.

**Why it matters**: Narrow scope keeps later code from accidentally reusing a temporary value. This form is common when a call returns a value and error and the error only matters for the immediate branch. The variable still exists inside both branches, so choose names that make the condition easy to follow. This keeps the temporary out of later statements.

## Example 20: Use a C-Style for Loop

_ex-20 · exercises co-08_

A `for` loop can include an initializer, condition, and post statement. Trace initialization, condition, and increment to predict the three printed indexes. The code block is rendered from `learning/code/ex-20-for-c-style/main.go`.

```go
package main

import "fmt"

func main() { // => main runs a counted loop and then exits.
	for i := 0; i < 3; i++ { // => Start at zero, continue while i is below three, then increment.
		fmt.Println(i) // => Output: 0, then 1, then 2 on separate lines.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `0`, `1`, and `2` appear on separate lines.

**Key takeaway**: Go uses `for` for counted loops.

**Why it matters**: The three-part form is familiar from several languages, but Go has no separate `while` keyword. It suits a known iteration count or index progression. Check the initial value, termination comparison, and update together; an off-by-one error usually comes from one of those three pieces. The condition is checked before each iteration.

## Example 21: Use a While-Style for Loop

_ex-21 · exercises co-08_

A `for` loop can use only a condition, repeating while that condition remains true. The condition is checked again after each update, which ends the countdown at zero. The code block is rendered from `learning/code/ex-21-for-while-style/main.go`.

```go
package main

import "fmt"

func main() { // => main owns the countdown state.
	remaining := 3      // => First printed value is three.
	for remaining > 0 { // => The loop stops once remaining reaches zero.
		fmt.Println(remaining) // => Print the current positive count.
		remaining--            // => Decrement before the condition is checked again.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `3`, `2`, `1` appear before the value reaches zero.

**Key takeaway**: A condition-only `for` is Go’s while-style loop.

**Why it matters**: This form works when termination depends on changing state rather than a fixed count. The body must make progress toward stopping or arrange an explicit `break` or cancellation path. Trace the changing variable here to see why the loop ends and which value is never printed. The final zero fails the condition.

## Example 22: Range over Collections

_ex-22 · exercises co-08_

`range` gives an index and value for a slice and can also iterate other collection types. The slice retains index order, and the loop receives each index with its value. The code block is rendered from `learning/code/ex-22-for-range/main.go`.

```go
package main

import "fmt"

func main() { // => main demonstrates range on a slice and a map.
	for index, value := range []string{"go", "rust"} { // => Slice iteration yields indexes 0 and 1 with their values.
		fmt.Println(index, value) // => Output: 0 go, then 1 rust.
	}
	for key, value := range map[string]int{"ok": 1} { // => Map iteration yields a key and value; order is unspecified for multiple keys.
		fmt.Println(key, value) // => This one-entry map prints ok 1.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `0 go`, `1 rust`, then `ok 1` appear.

**Key takeaway**: Choose only the `range` values you need; use `_` to discard one.

**Why it matters**: Range loops express collection traversal without manual index bounds. For maps, iteration order is unspecified, while slices retain index order. This example uses a slice so its output is predictable. Recognizing the collection type matters before writing a test that assumes any particular iteration order. This loop keeps element order for slices.

## Example 23: Dispatch with switch

_ex-23 · exercises co-08_

A `switch` chooses one matching case and does not fall through by default. Only the matching branch runs unless the source explicitly requests fallthrough. The code block is rendered from `learning/code/ex-23-switch-statement/main.go`.

```go
package main

import "fmt"

func main() { // => main selects a message for one command value.
	switch command := "check"; command { // => command is scoped to the switch statement.
	case "check": // => This case matches the current command.
		fmt.Println("validating") // => Output: validating.
	case "publish": // => This branch would run for publish, without fallthrough from check.
		fmt.Println("releasing") // => Its output would be releasing.
	default: // => Unknown commands use the fallback branch.
		fmt.Println("unknown") // => Its output would be unknown.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `validating` appears for the selected case.

**Key takeaway**: Use `switch` when several discrete cases describe one decision.

**Why it matters**: Grouping related cases makes branching easier to scan than a long chain of `if` statements. Go stops after a matching case unless `fallthrough` is requested explicitly. Change the input to exercise a different branch and check whether a default case handles values you did not enumerate. An unmatched value may need an explicit default.

## Example 24: Use a Conditionless switch

_ex-24 · exercises co-08_

A conditionless `switch` evaluates boolean case expressions in order. The first true case wins when the cases are boolean expressions rather than values. The code block is rendered from `learning/code/ex-24-switch-no-condition/main.go`.

```go
package main

import "fmt"

func main() { // => main evaluates ordered boolean cases against one integer.
	n := -2  // => The negative value will match the second case.
	switch { // => Without an expression after switch, each case is a condition.
	case n > 0: // => This branch is skipped because -2 is not positive.
		fmt.Println("positive") // => It would print positive for a value above zero.
	case n < 0: // => This is the first true case for -2.
		fmt.Println("negative") // => Output: negative.
	default: // => Zero reaches this fallback.
		fmt.Println("zero") // => It would print zero.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `negative` appears for the first matching condition.

**Key takeaway**: A conditionless `switch` can replace a clear ordered `if` chain.

**Why it matters**: This form is useful when cases are related predicates rather than equality checks against one value. Order still matters if conditions overlap: the first true case wins. Keep cases simple enough that readers can see precedence without simulating a complicated expression or hidden side effect. Put the most specific condition first.

## Example 25: Defer Cleanup

_ex-25 · exercises co-09_

`defer` schedules a call for execution when the surrounding function returns. Cleanup is registered before work and executes when the surrounding function returns. The code block is rendered from `learning/code/ex-25-defer-basic/main.go`.

```go
package main

import "fmt"

func closeResource() { fmt.Println("cleanup") } // => The named cleanup function prints when it is called.

func main() { // => main registers cleanup before doing work.
	defer closeResource() // => Run closeResource when main returns.
	fmt.Println("work")   // => Output first: work; deferred cleanup prints afterward.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `work` appears before `cleanup`.

**Key takeaway**: Place cleanup after acquiring a resource so every later return executes it.

**Why it matters**: A deferred close or unlock keeps cleanup tied to the function that owns a resource. The call is registered now and runs on return, including early returns. This example prints the order; later code must also handle errors from operations whose cleanup result matters, rather than silently discarding them. Defer runs after the body, before the caller resumes.

## Example 26: Observe Defer LIFO Order

_ex-26 · exercises co-09_

Multiple deferred calls run in last-in, first-out order when the function returns. The final registered deferred call runs first, which reverses the declaration order. The code block is rendered from `learning/code/ex-26-defer-lifo-order/main.go`.

```go
package main

import "fmt"

func main() { // => Deferred calls belong to the surrounding main function.
	defer fmt.Println("first deferred")  // => Register the first call; it will run last.
	defer fmt.Println("second deferred") // => Register the second call; it will run second.
	defer fmt.Println("third deferred")  // => Register the third call; it will run first.
	fmt.Println("body")                  // => Output body now, then third, second, first deferred.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `body`, then `third deferred`, `second deferred`, and `first deferred` appear.

**Key takeaway**: Defers form a stack within one function.

**Why it matters**: Last-in, first-out execution matters when cleanup steps depend on each other, such as releasing nested resources or restoring temporary state. Read the registration order and predict the output before running it. Avoid making correctness depend on a long, surprising stack of deferred actions when straightforward code would be clearer.
That order is visible in the printed trace.
