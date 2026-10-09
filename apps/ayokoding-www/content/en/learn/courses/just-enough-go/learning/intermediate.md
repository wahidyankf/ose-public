---
title: "Intermediate Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 20
---

Examples 27–54 cover collections, pointers, composition, receivers, interfaces, error values, and
JSON. Each has a colocated runnable source.

## Example 27: Compare an Array and Slice

_ex-27 · exercises co-10_

Arrays have a fixed length in their type; slices are views over an array. Identical printed elements do not make the array and slice interchangeable types. The code block is rendered from `learning/code/ex-27-array-vs-slice/main.go`.

```go
package main

import "fmt"

func main() { // => Compares equal printed values with different array and slice types.
	array := [3]int{1, 2, 3}  // => Its length 3 is part of its type.
	slice := []int{1, 2, 3}   // => The slice type has no fixed length.
	fmt.Println(array, slice) // => Both print [1 2 3] here.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Both values print `[1 2 3]`, although their types differ.

**Key takeaway**: Arrays have a fixed length in their type; slices are views over an array.

**Why it matters**: The output looks identical, so inspect the declarations to see the type distinction. Slices suit variable-length collection APIs; arrays make fixed length part of the type and are copied as values. When debugging a collection, check its type rather than inferring it from how `fmt` prints it. Change the array length and compare the resulting types.

## Example 28: Append to a Slice

_ex-28 · exercises co-10_

`append` returns a slice with the new element and may allocate a new backing array. The returned slice header carries the new length, even if its backing array was reused. The code block is rendered from `learning/code/ex-28-slice-append/main.go`.

```go
package main

import "fmt"

func main() { // => Shows why append’s returned slice must be retained.
	values := []int{1, 2}      // => Initial length is 2.
	values = append(values, 3) // => Assign the returned slice; length becomes 3.
	fmt.Println(values)        // => Output: [1 2 3].
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The resulting slice prints `[1 2 3]`.

**Key takeaway**: `append` returns a slice with the new element and may allocate a new backing array.

**Why it matters**: Keep the returned slice header after `append`; ignoring it can lose the updated length. This matters when a helper receives a slice and appends to it: its caller must receive the result if it needs the expanded view. Mutation of underlying elements and change of slice length are separate effects. Try appending without assigning the result and inspect the compiler response.

## Example 29: Inspect Slice Length and Capacity

_ex-29 · exercises co-10_

Slice length counts visible elements; capacity measures available backing storage. Observe length as data grows and treat the capacity numbers as allocation details. The code block is rendered from `learning/code/ex-29-slice-len-cap/main.go`.

```go
package main

import "fmt"

func main() { // => Tracks length and capacity through three appends.
	values := make([]int, 0, 2) // => Zero elements, space reserved for two.
	// => Append 0, 1, then 2; the third append exceeds initial capacity.
	for i := 0; i < 3; i++ { // => i takes values 0, 1, then 2.
		values = append(values, i)            // => Length increases each time.
		fmt.Println(len(values), cap(values)) // => Capacity may grow when needed.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Length grows after `append`; exact capacity growth is implementation dependent.

**Key takeaway**: Slice length counts visible elements; capacity measures available backing storage.

**Why it matters**: Capacity can help reduce allocations, but the precise growth pattern is not a program contract. Use length for bounds and data count. A later Go release or input size may produce a different capacity while the same slice behavior remains correct. This example separates correctness from an optimization detail. Predict which indexes are legal after each append.

## Example 30: Allocate Slice Capacity

_ex-30 · exercises co-10_

`make([]T, 0, capacity)` reserves storage without creating visible elements. Reserving ten slots does not make any of them indexable while length remains zero. The code block is rendered from `learning/code/ex-30-make-slice-capacity/main.go`.

```go
package main

import "fmt"

func main() { // => Separates a slice’s readable length from reserved capacity.
	values := make([]int, 0, 10)          // => Length 0 means no readable elements yet.
	fmt.Println(len(values), cap(values)) // => Output: 0 10.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The program prints `0 10` for length and capacity.

**Key takeaway**: `make([]T, 0, capacity)` reserves storage without creating visible elements.

**Why it matters**: Preallocating a known approximate size can avoid repeated allocations during append-heavy work. Capacity does not permit indexing past length: a slice with length zero still has no element at index zero. Distinguish reservation from population when building a result collection or passing it to another function. Try indexing element zero before appending.

## Example 31: Share a Slice Backing Array

_ex-31 · exercises co-10_

Two slices can share one backing array, so mutation through either view is visible to both. One assignment changes both printed views because they overlap in the same storage. The code block is rendered from `learning/code/ex-31-slice-shares-backing/main.go`.

```go
package main

import "fmt"

func main() { // => Shows a subslice changing the original backing array.
	values := []int{1, 2, 3}  // => Original backing array holds three integers.
	view := values[:2]        // => View covers the first two elements of that array.
	view[0] = 9               // => The write also changes values[0].
	fmt.Println(values, view) // => Output: [9 2 3] [9 2].
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Changing one view produces `[9 2 3] [9 2]`.

**Key takeaway**: Two slices can share one backing array, so mutation through either view is visible to both.

**Why it matters**: Sharing avoids copies but makes ownership important. A function that returns a subslice may leave the original data mutable through another reference. If callers require independent state, copy the elements. This is also why retaining a tiny subslice can keep a much larger backing array alive. Change a different shared element and predict both outputs.

## Example 32: Create a Map

_ex-32 · exercises co-11_

A map literal creates keyed values for fast lookup. Lookup uses a key, while ordered presentation needs a separate sorting step. The code block is rendered from `learning/code/ex-32-map-basic/main.go`.

```go
package main

import "fmt"

func main() { // => Starts with one map entry and inserts another.
	counts := map[string]int{"ok": 1} // => The key "ok" starts at 1.
	counts["warn"] = 2                // => Assignment inserts a second key.
	fmt.Println(counts)               // => Both entries appear; map order is unspecified.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: `fmt` prints `map[ok:1 warn:2]` for this map.

**Key takeaway**: A map literal creates keyed values for fast lookup.

**Why it matters**: Maps provide convenient lookup but do not promise iteration order. `fmt` formats keys predictably here; a `for range` loop is a different operation. If an API or test needs stable order, sort keys before visiting them. Also notice that map keys must be comparable types. Add a third key, then inspect the map and a range loop.

## Example 33: Use Map Comma-Ok

_ex-33 · exercises co-11_

The comma-ok lookup distinguishes a missing key from a present zero value. The second result reports presence independently of the integer zero value. The code block is rendered from `learning/code/ex-33-map-comma-ok/main.go`.

```go
package main

import "fmt"

func main() { // => Distinguishes absent key from a stored zero.
	counts := map[string]int{"ok": 0}   // => An existing key can also hold zero.
	value, present := counts["missing"] // => Missing key gives zero and false.
	fmt.Println(value, present)         // => Output: 0 false.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The lookup prints `0 false` for an absent key.

**Key takeaway**: The comma-ok lookup distinguishes a missing key from a present zero value.

**Why it matters**: A single lookup returns the value type’s zero value on a miss, which can be useful for counters but ambiguous for configuration or IDs. The second result tells you whether the key existed. Check it whenever absence needs different handling from a stored zero. Insert the key with value zero and compare both results.

## Example 34: Delete and Iterate a Map

_ex-34 · exercises co-11_

`delete` removes a map entry; `range` visits the remaining entries. The remaining key appears after deletion; adding more keys would not promise visit order. The code block is rendered from `learning/code/ex-34-map-delete-iterate/main.go`.

```go
package main

import "fmt"

func main() { // => Deletes one entry before iteration.
	counts := map[string]int{"ok": 1, "warn": 2} // => Two initial entries.
	delete(counts, "warn")                       // => Only "ok" remains.
	// => The single remaining key makes this output deterministic.
	for key, value := range counts { // => Only the ok entry can be visited.
		fmt.Println(key, value) // => Output: ok 1.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Only `ok 1` remains after deletion.

**Key takeaway**: `delete` removes a map entry; `range` visits the remaining entries.

**Why it matters**: Deleting an absent key is safe, so cleanup code need not check first. Range order remains unspecified when several keys exist. This matters for tests and user-facing output: sort keys if ordering is part of the result. A map is a lookup structure, not an ordered list. Add another remaining key and avoid assuming which prints first.

## Example 35: Read through a Pointer

_ex-35 · exercises co-12_

A pointer holds an address; dereferencing reads the value at that address. The pointer refers to the existing integer rather than storing another independent integer. The code block is rendered from `learning/code/ex-35-pointer-basics/main.go`.

```go
package main

import "fmt"

func main() { // => Takes an address and reads through the resulting pointer.
	value := 7            // => An addressable integer variable.
	pointer := &value     // => Stores value's address, not a copy of 7.
	fmt.Println(*pointer) // => Dereference reads 7.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The dereference prints `7`.

**Key takeaway**: A pointer holds an address; dereferencing reads the value at that address.

**Why it matters**: Pointers allow sharing a value instead of copying it, but they can also be nil. In this example the address is valid. Before passing a pointer to another function, decide whether it may mutate the value and who keeps ownership; that decision affects how easy the call is to reason about. Set the pointer to nil and explain why dereferencing changes behavior.

## Example 36: Modify through a Pointer

_ex-36 · exercises co-12_

Dereferencing a pointer for assignment changes the caller’s original value. The assignment through the pointer changes what the caller reads after the function returns. The code block is rendered from `learning/code/ex-36-pointer-modify/main.go`.

```go
package main

import "fmt"

func increment(value *int) { *value++ } // => Dereference then increment the caller's integer.

func main() { // => Passes an address so increment can update the caller’s variable.
	value := 7         // => Initial value before the call.
	increment(&value)  // => Pass its address so the function can write to it.
	fmt.Println(value) // => Output: 8.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The caller sees `8` after the update.

**Key takeaway**: Dereferencing a pointer for assignment changes the caller’s original value.

**Why it matters**: A pointer parameter gives the callee the ability to mutate state visible elsewhere. Use that when identity or in-place change is the contract, and prefer returning a new value when a copy is clearer. The difference matters when debugging a value that changes after a function call. Pass a copied value instead and compare the effect.

## Example 37: Recover a Nil Pointer Panic

_ex-37 · exercises co-12_

A nil-pointer dereference panics; this example recovers only to expose that fact. `recover` captures the panic during deferred cleanup; the nil pointer remains invalid. The code block is rendered from `learning/code/ex-37-nil-pointer-panic/main.go`.

```go
package main

import "fmt"

func dereference(pointer *int) (recovered any) { // => Named result captures the recovered panic.
	defer func() { recovered = recover() }() // => Runs during panic unwinding.
	_ = *pointer                             // => A nil pointer causes the panic being demonstrated.
	// => A non-nil pointer reaches this return without invoking recover.
	return nil // => A non-nil pointer reaches this line without recovery.
}

func main() { fmt.Println(dereference(nil) != nil) } // => Output: true; the panic was recovered.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The program prints `true` because `recover()` returns a non-nil panic value for the nil dereference.

**Key takeaway**: A nil-pointer dereference panics; this example recovers only to expose that fact.

**Why it matters**: Recovery is not normal input validation. Ordinary invalid input should be checked and returned as an error before a dereference. A boundary may recover to keep a larger process alive, but the failed operation still failed. This example teaches recognition of a programming error, not a pattern for routine control flow. Remove the recovery and inspect the failing stack trace.

## Example 38: Define a Struct

_ex-38 · exercises co-13_

A struct groups related named fields into one value type. The field selector reads a named part of the grouped value. The code block is rendered from `learning/code/ex-38-struct-definition/main.go`.

```go
package main

import "fmt"

type Release struct { // => Defines two fields with distinct types.
	Name   string // => Text field accessed below.
	Number int    // => Independent integer field; zero if omitted.
}

func main() { release := Release{Name: "ship", Number: 1}; fmt.Println(release.Name) } // => Prints ship from Name.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Reading the field prints `ship`.

**Key takeaway**: A struct groups related named fields into one value type.

**Why it matters**: Named fields make a small domain value clearer than unrelated variables and let the compiler check field names and types. Struct values can be copied, passed, and later given methods. Start with this simple grouping before layering on JSON tags, interfaces, or pointer receivers. Add another field and decide its useful zero value.

## Example 39: Build a Struct Literal

_ex-39 · exercises co-13_

A keyed struct literal supplies named fields; omitted fields receive zero values. The field omitted from the literal still exists and receives its zero value. The code block is rendered from `learning/code/ex-39-struct-literal/main.go`.

```go
package main

import "fmt"

type Release struct { // => Only Name is set in the literal below.
	Name   string // => Set explicitly by the literal.
	Number int    // => Omitted field defaults to zero.
}

func main() { release := Release{Name: "ship"}; fmt.Println(release.Name, release.Number) } // => Output: ship 0.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The fields print `ship 0`.

**Key takeaway**: A keyed struct literal supplies named fields; omitted fields receive zero values.

**Why it matters**: Keyed literals explain which value belongs to which field and tolerate changes in field order. An omitted field might be intentionally optional or might mean required data was forgotten. The compiler checks shape but not domain completeness, so validate required fields at the boundary where values enter. Supply the second field and compare the output.

## Example 40: Embed a Struct

_ex-40 · exercises co-13_

Embedding a struct promotes its fields and methods for convenient selectors. The promoted selector is shorthand for a field reached through the embedded value. The code block is rendered from `learning/code/ex-40-embedded-struct/main.go`.

```go
package main

import "fmt"

type Metadata struct{ Owner string } // => Owner belongs to Metadata.

type Release struct { // => Embedding promotes Metadata.Owner.
	Metadata        // => Embedding promotes Owner to Release.Owner.
	Name     string // => Name remains a field of Release.
}

func main() { // => Initializes the embedded struct before reading Owner.
	release := Release{Metadata: Metadata{Owner: "Ada"}, Name: "ship"} // => Initialize embedded value explicitly.
	fmt.Println(release.Owner)                                         // => Output: Ada via the promoted field.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The promoted field prints `Ada`.

**Key takeaway**: Embedding a struct promotes its fields and methods for convenient selectors.

**Why it matters**: Embedding is composition: the inner value remains a field even when callers use a shortened selector. This is useful for small, deliberate reuse, but exposing an entire embedded type can enlarge an API unexpectedly. Check which fields and methods become reachable before choosing this shape for a public type. Use the explicit embedded-field selector and compare the value.

## Example 41: Use a Value Receiver

_ex-41 · exercises co-14_

A value receiver reads a copy and returns a new `Counter`; this method never mutates either value. Compare the returned `2` with the original `1` to see value semantics without mutation. The code block is rendered from `learning/code/ex-41-method-value-receiver/main.go`.

```go
package main

import "fmt"

type Counter int // => Defined integer type can have methods.

func (counter Counter) Incremented() Counter { return counter + 1 } // => Returns 2 without changing caller's 1.

func main() { counter := Counter(1); fmt.Println(counter.Incremented(), counter) } // => Output: 2 1.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The output `2 1` contrasts the returned value with the unchanged original.

**Key takeaway**: This value receiver computes a new `Counter`; the original stays `1`.

**Why it matters**: Method call syntax does not reveal whether a receiver is copied. Here `Incremented` computes a new `Counter` from its value receiver and leaves the caller’s value at `1`; it does not update a copy in place. Choose value receivers for small value-like types and pointer receivers when a method must mutate the original. Call this method twice and predict the unchanged original value.

## Example 42: Use a Pointer Receiver

_ex-42 · exercises co-14_

A pointer receiver can update the original named integer value through its address. The receiver’s address lets the method mutate the value that the caller retains. The code block is rendered from `learning/code/ex-42-method-pointer-receiver/main.go`.

```go
package main

import "fmt"

type Counter int // => Defined integer type, not a struct.

func (counter *Counter) Increment() { *counter++ } // => Pointer receiver writes the caller's value.

func main() { counter := Counter(1); counter.Increment(); fmt.Println(counter) } // => Output: 2.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The modified value prints `2`.

**Key takeaway**: A pointer receiver can update the original named integer through its address.

**Why it matters**: Pointer receivers support mutation; on a larger type, they can also avoid copying. They also influence the method set used for interface satisfaction, even when call syntax automatically takes the address of a local variable. Decide receiver kind for a type consistently so its API behaves predictably. Try calling the method through an addressable value and a pointer.

## Example 43: Choose a Receiver

_ex-43 · exercises co-14_

Receiver choice expresses whether a method needs mutation, identity, or value semantics. Receiver kind also affects the type’s method set when it is used as an interface. The code block is rendered from `learning/code/ex-43-receiver-choice/main.go`.

```go
package main

import "fmt"

type Release struct{ Name string } // => The field both methods use.

func (release Release) Label() string { return release.Name } // => Reading a copy does not mutate Release.

func (release *Release) Rename(name string) { release.Name = name } // => Pointer receiver changes the original Name.

func main() { release := Release{Name: "ship"}; release.Rename("dock"); fmt.Println(release.Label()) } // => Output: dock.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The method returns `dock`.

**Key takeaway**: Receiver choice expresses whether a method needs mutation, identity, or value semantics.

**Why it matters**: A receiver is part of a method’s public contract. Switching from value to pointer can change which value forms satisfy an interface. Use a value receiver for small immutable values, and a pointer receiver where mutation or shared identity is needed; avoid mixing choices without reason. Explain whether copying the receiver changes this method’s result.

## Example 44: Satisfy an Interface Implicitly

_ex-44 · exercises co-15_

A type satisfies an interface when its method set has the required method. Assigning the concrete value to the interface is where the compiler checks its method set. The code block is rendered from `learning/code/ex-44-interface-implicit/main.go`.

```go
package main

import "fmt"

type Stringer interface{ String() string } // => Requires exactly this method signature.

type Release struct{ Name string } // => Concrete type has no implements declaration.

func (release Release) String() string { return release.Name } // => Makes Release satisfy Stringer.

func printValue(value Stringer) { fmt.Println(value.String()) } // => Calls through the interface.

func main() { printValue(Release{Name: "ship"}) } // => Output: ship.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The interface call prints `ship`.

**Key takeaway**: A type satisfies an interface when its method set has the required method.

**Why it matters**: No `implements` declaration binds the concrete type to its consumer. That lets a consumer define the smallest behavior it needs, but a mismatch may first surface at assignment or call time during compilation. Check method names, signatures, and receiver kinds when the compiler reports missing implementation. Change the method signature and read the compile error.

## Example 45: Use Two Interface Implementations

_ex-45 · exercises co-15_

Two concrete types can implement the same small interface independently. The caller makes the same method call on two different concrete implementations. The code block is rendered from `learning/code/ex-45-interface-two-impls/main.go`.

```go
package main

import "fmt"

type Runner interface{ Run() string } // => Both concrete types below satisfy this contract.

type Check struct{} // => Has no data fields; behavior comes from Run.

func (Check) Run() string { return "checked" } // => First implementation's result.

type Publish struct{} // => Second empty type with different Run behavior.

func (Publish) Run() string { return "published" } // => Second implementation's result.

func main() { // => Calls two implementations through one interface slice.
	for _, runner := range []Runner{Check{}, Publish{}} { // => Interface slice preserves this order.
		fmt.Println(runner.Run()) // => Prints checked, then published.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Their calls print `checked` and `published`.

**Key takeaway**: Two concrete types can implement the same small interface independently.

**Why it matters**: An interface is valuable when a caller truly accepts interchangeable behavior, such as real and test implementations. Each type can keep its own state and logic. Avoid introducing an interface merely because one type has a method; let the consuming code’s need establish the abstraction. Add a third implementation without changing the caller.

## Example 46: Store Values in any

_ex-46 · exercises co-15_

`any` is an alias for `interface{}` and can hold values of different concrete types. Each element retains its dynamic type even though the slice element type is `any`. The code block is rendered from `learning/code/ex-46-empty-interface-any/main.go`.

```go
package main

import "fmt"

func main() { // => Stores three concrete types behind any values.
	values := []any{"ship", 7, true} // => Elements retain different dynamic types.
	for _, value := range values {   // => Visits string, int, then bool.
		fmt.Printf("%T %v\n", value, value) // => Prints each dynamic type and value.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The program reports `string ship`, `int 7`, and `bool true`.

**Key takeaway**: `any` is an alias for `interface{}` and can hold values of different concrete types.

**Why it matters**: The dynamic type remains present, but type-specific operations require inspection or assertion. This flexibility is useful at generic decoding or formatting boundaries; it sacrifices compile-time guarantees within that boundary. Prefer a concrete type or a generic function when the permitted value type is known. Try assigning each value to an `int` without an assertion.

## Example 47: Use a Safe Type Assertion

_ex-47 · exercises co-15_

The comma-ok type assertion reports a mismatch without panicking. A failed comma-ok assertion produces `false` instead of a panic. The code block is rendered from `learning/code/ex-47-type-assertion/main.go`.

```go
package main

import "fmt"

func main() { // => Tests a successful and an unsuccessful assertion.
	var value any = "ship"     // => Dynamic type is string.
	name, ok := value.(string) // => Matching assertion returns ship, true.
	fmt.Println(name, ok)      // => Output: ship true.
	_, ok = value.(int)        // => Mismatch returns zero int and false, no panic.
	fmt.Println(ok)            // => Output: false.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The string assertion yields `ship true`; the other yields `false`.

**Key takeaway**: The comma-ok type assertion reports a mismatch without panicking.

**Why it matters**: A one-result assertion is appropriate only when the dynamic type is guaranteed. At uncertain boundaries, the second boolean gives a normal branch for another type. This avoids turning ordinary data variation into a panic and makes the caller state what it will do when the type differs. Replace comma-ok with one-result assertion and run the failing case.

## Example 48: Use a Type Switch

_ex-48 · exercises co-15_

A type switch branches on the concrete type stored in an interface value. Each case narrows the interface value to the concrete type named in that branch. The code block is rendered from `learning/code/ex-48-type-switch/main.go`.

```go
package main

import "fmt"

func describe(value any) string { // => Accepts values of different dynamic types.
	switch item := value.(type) { // => Binds item at the type in each matching case.
	case string: // => Item is a string in this branch.
		return "string " + item // => "ship" becomes "string ship".
	case int: // => Item is an int in this branch.
		return fmt.Sprintf("int %d", item) // => 7 becomes "int 7".
	default: // => No known case matched.
		return "other" // => All unhandled dynamic types use this result.
	}
}

func main() { fmt.Println(describe("ship"), describe(7)) } // => Output: string ship int 7.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The two handled cases print `string ship` and `int 7`.

**Key takeaway**: A type switch branches on the concrete type stored in an interface value.

**Why it matters**: Type switches are useful for a small known set of dynamic types, especially at a boundary that receives `any`. Include a default when other types can arrive. If the switch becomes long or repeated, consider whether an interface method or generic function better expresses the common operation. Add a boolean input and decide what the default should report.

## Example 49: Check an Error Value

_ex-49 · exercises co-16_

The function returns an error for invalid input and the caller checks it. The invalid name is represented as an error result that the caller checks explicitly. The code block is rendered from `learning/code/ex-49-error-value-check/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

func open(name string) error { // => Returns only an error, no success value.
	if name == "" { // => Empty input is the failure case.
		return errors.New("name is required") // => Caller receives this error value.
	}
	return nil // => Nonempty name succeeds.
}

func main() { // => Calls the failure path to demonstrate explicit error handling.
	if err := open(""); err != nil { // => Check the error before proceeding.
		fmt.Println(err) // => Output: name is required.
	}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The invalid name reports `name is required`.

**Key takeaway**: The function returns an error for invalid input and the caller checks it.

**Why it matters**: Error values make expected failure visible in a function signature and at the call site. The caller can then recover, add context, or show a message instead of continuing with an invalid result. This pattern is used by file, parser, and network APIs throughout Go. Pass a valid name and observe that `open` returns only a nil error; this function has no value result.

## Example 50: Create an Error

_ex-50 · exercises co-16_

`errors.New` constructs a simple error with a fixed message. The constructed error value can be returned or wrapped by another function. The code block is rendered from `learning/code/ex-50-errors-new/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

func main() { err := errors.New("release unavailable"); fmt.Println(err.Error()) } // => Prints release unavailable.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The error prints `release unavailable`.

**Key takeaway**: `errors.New` constructs a simple error with a fixed message.

**Why it matters**: Messages explain failures to people, but callers should not parse the string to choose behavior. If callers need a stable category or structured details, use an error identity or type. Start with this form when the failure only needs to be reported or wrapped by the next layer. Change the message and see why string matching would be brittle.

## Example 51: Implement a Custom Error

_ex-51 · exercises co-16_

A custom type implements `error` with an `Error() string` method. The error message includes a status field supplied by the custom type. The code block is rendered from `learning/code/ex-51-custom-error-type/main.go`.

```go
package main

import "fmt"

type StatusError struct{ Code int } // => Carries the status for its message.

func (err StatusError) Error() string { return fmt.Sprintf("status %d", err.Code) } // => Satisfies error.

func main() { var err error = StatusError{Code: 503}; fmt.Println(err) } // => Output: status 503.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The reported error includes `status 503`.

**Key takeaway**: A custom type implements `error` with an `Error() string` method.

**Why it matters**: A structured error can expose data such as a status code without forcing callers to parse prose. Add such a type when a caller can act on that field, and keep its contract small. Later inspection through `errors.As` can recover the type after contextual wrapping. Change the status field and inspect the formatted message.

## Example 52: Wrap an Error

_ex-52 · exercises co-17_

`fmt.Errorf` with `%w` wraps a cause while adding operation context. `%w` keeps the underlying cause available to callers that inspect the chain. The code block is rendered from `learning/code/ex-52-error-wrap-w/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

var ErrMissing = errors.New("missing") // => Sentinel retained inside wrapped error.

func load() error { return fmt.Errorf("load config: %w", ErrMissing) } // => %w preserves unwrap behavior.

func main() { err := load(); fmt.Println(errors.Unwrap(err)) } // => Output: missing.
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The wrapped cause remains discoverable as `missing`.

**Key takeaway**: `fmt.Errorf` with `%w` wraps a cause while adding operation context.

**Why it matters**: Wrapping tells the next caller which operation failed without destroying the original error identity. That is what makes `errors.Is` and `errors.As` useful through layers. Add context where meaning changes, rather than stacking nearly identical text at every function call. Replace `%w` with `%v` and test whether unwrapping still works. The wrapper remains inspectable by the caller.

## Example 53: Inspect Wrapped Errors

_ex-53 · exercises co-17_

`errors.Is` checks an error identity; `errors.As` extracts a matching error type. Both operations follow wrappers to reach the original condition or structured details. The code block is rendered from `learning/code/ex-53-errors-is-as/main.go`.

```go
package main

import (
	"errors"
	"fmt"
)

var ErrMissing = errors.New("missing") // => Target for errors.Is.

type StatusError struct{ Code int } // => Target type for errors.As.

func (err *StatusError) Error() string { return "status error" } // => Pointer implements error.

func main() { // => Compares a sentinel and extracts a wrapped concrete error.
	cause := &StatusError{Code: 503}                                          // => Concrete cause carries code 503.
	err := fmt.Errorf("wrapped: %w", cause)                                   // => Preserve cause in error chain.
	var status *StatusError                                                   // => As writes matched pointer here.
	fmt.Println(errors.Is(fmt.Errorf("wrapped: %w", ErrMissing), ErrMissing)) // => Output: true.
	fmt.Println(errors.As(err, &status), status.Code)                         // => Output: true 503.
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: Both checks print `true`, and the extracted status is `503`.

**Key takeaway**: `errors.Is` checks an error identity; `errors.As` extracts a matching error type.

**Why it matters**: An error can be wrapped several times before it reaches a caller that must choose a response. Direct equality or a direct type assertion may then miss the cause. Use `Is` or `As` when a real decision depends on identity or structured details, rather than comparing text. Add one more `%w` wrapper and repeat the checks.

## Example 54: Marshal Struct Tags

_ex-54 · exercises co-18_

A JSON struct tag maps an exported Go field to a chosen wire name. The JSON key differs from the exported Go field, while the secret field is omitted. The code block is rendered from `learning/code/ex-54-struct-tags-json/main.go`.

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Release struct { // => Tags govern JSON field names and exclusion.
	Name   string `json:"name"` // => Encodes under the lower-case JSON key.
	Secret string `json:"-"`    // => Excluded from JSON even though exported.
}

func main() { // => Marshals a value containing one public and one hidden field.
	bytes, err := json.Marshal(Release{Name: "ship", Secret: "hidden"}) // => Only Name enters JSON.
	if err != nil {                                                     // => Marshal may fail for unsupported field values.
		fmt.Println("encode failed:", err) // => Report the actual encoding error.
		return                             // => Do not print unusable bytes.
	}
	fmt.Println(string(bytes)) // => Output: {"name":"ship"}
}
```

**Run**: `go run main.go` from this example directory.

**Expected observation**: The JSON output is `{"name":"ship"}`.

**Key takeaway**: A JSON struct tag maps an exported Go field to a chosen wire name.

**Why it matters**: Wire formats often use names that differ from exported Go identifiers. Tags make that relationship explicit and help preserve an external JSON contract while keeping readable Go fields. Remember that `encoding/json` ignores unexported fields; a tag alone cannot expose one. Remove the tag, then compare the resulting key name.
The field remains exported within Go.
