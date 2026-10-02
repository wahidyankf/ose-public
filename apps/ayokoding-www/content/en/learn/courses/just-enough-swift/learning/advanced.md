---
title: "Advanced Examples"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 30
---

Examples 55–78 complete the primer with constrained reuse, explicit failures, and a language-only
concurrency preview. The async samples use `Task` plus a short `RunLoop` turn solely so a CLI file
does not exit before its child task prints; iOS ownership and cancellation are deferred to the next course.

## Example 55: Write a Generic Swap

_ex-55 · exercises co-25_

```swift
// => exchange works for any type T; inout lets it rewrite both arguments
func exchange<T>(_ left: inout T, _ right: inout T) { // => one body for every T
    // => saved keeps the original left value while left is overwritten
    let saved = left
    left = right // => left now holds the right value
    right = saved // => right now holds the original left value
}

var first = 1 // => first is an Int
var second = 2 // => second is an Int
exchange(&first, &second) // => T is inferred as Int
var a = "a" // => a is a String
var b = "b" // => b is a String
exchange(&a, &b) // => the same implementation runs with T as String
// => both pairs are now swapped
print("\(first),\(second); \(a),\(b)") // => 2,1; b,a
```

**Key takeaway:** a type parameter preserves type relationships without `Any`. **Why it matters:**
one tested algorithm serves many types while the compiler still rejects mismatched arguments. Without generics you
would write one swap per type or erase everything to `Any`, losing the guarantee that both arguments share a type.
iOS code relies on the same idea in collection APIs and `SwiftUI` views, so recognizing a type parameter early makes
standard-library signatures readable instead of intimidating.

## Example 56: Make a Generic Stack

_ex-56 · exercises co-25_

```swift
// => Element is a placeholder the caller fills in
struct Stack<Element> { // => a value type generic over Element
    var items: [Element] = [] // => storage holds only Element values
    // => push appends to the top; mutating because it changes items
    mutating func push(_ item: Element) { // => accepts only Element
        items.append(item) // => items grows by one
    }
    // => pop returns nil when the stack is empty
    mutating func pop() -> Element? { // => returns Element, never another type
        items.popLast() // => removes and returns the top item, if any
    }
}

var stack = Stack<String>() // => Element is String for this stack
stack.push("first") // => items is ["first"]
print(stack.pop() ?? "empty") // => first
print(stack.pop() ?? "empty") // => empty; the stack is now empty
```

**Key takeaway:** generic types expose one model over a variable element type. **Why it matters:**
the stack cannot accidentally accept one type and return another unrelated one. A generic container keeps its element
type in every signature, so the compiler checks each `push` and `pop` at the call site rather than at runtime. Swift's
own `Array`, `Dictionary`, and `Optional` are generic types built the same way, which is why their methods return
precisely typed values.

## Example 57: Constrain a Generic Function

_ex-57 · exercises co-25_

```swift
// => T: Comparable lets the body use > on two T values
func maximum<T: Comparable>(_ left: T, _ right: T) -> T { // => both arguments share T
    left > right ? left : right // => returns the larger argument
}

print(maximum(3, 7)) // => 7; Int conforms to Comparable
print(maximum("Ada", "Lin")) // => Lin; String also supplies ordering
// => maximum(3, "Lin") would not compile: both arguments must share one T
```

**Key takeaway:** `<T: Comparable>` requires the operation the implementation needs. **Why it matters:**
constraints state the algorithm's real dependency instead of accepting values it cannot compare. The constraint turns a
would-be runtime failure into a compile-time error at the call site, and it documents the contract for the next reader.
Standard-library functions such as `max(_:_:)` and `sorted()` use the same `Comparable` constraint, so your own generic
code composes with them naturally.

## Example 58: Constrain to Your Protocol

_ex-58 · exercises co-25, co-23_

```swift
protocol Identified { var id: String { get } }
struct User: Identified { let id: String }
func printID<T: Identified>(_ value: T) { print(value.id) } // => generic T must meet the contract
printID(User(id: "u-1")) // => u-1
```

**Key takeaway:** custom protocol bounds preserve concrete type information. **Why it matters:** a
generic helper can reuse required behavior without erasing every other property of its input.

## Example 59: Throw from a Function

_ex-59 · exercises co-26_

```swift
enum ParseError: Error { case invalid }
func parse(_ text: String) throws -> Int { guard let number = Int(text) else { throw ParseError.invalid }; return number }
print(try! parse("42")) // => 42; this force-try is safe only because this literal is known-valid
```

**Key takeaway:** `throws` makes a failure-capable call visible. **Why it matters:** callers must
choose a policy rather than silently receiving a fake value after parsing fails.

## Example 60: Handle Failure with `do`/`catch`

_ex-60 · exercises co-26_

```swift
enum ParseError: Error { case invalid }
func parse(_ text: String) throws -> Int { guard let value = Int(text) else { throw ParseError.invalid }; return value }
do { print(try parse("oops")) } catch { print("invalid input") } // => catch owns the error policy
```

**Key takeaway:** `do` scopes work whose errors you handle. **Why it matters:** a local catch can
translate technical failure into a useful boundary message while preserving a throwing core.

## Example 61: Convert an Error to an Optional

_ex-61 · exercises co-26, co-06_

```swift
enum ParseError: Error { case invalid }
func parse(_ text: String) throws -> Int { guard let value = Int(text) else { throw ParseError.invalid }; return value }
let value = try? parse("oops") // => nil rather than a propagated error
print(value ?? 0) // => 0
```

**Key takeaway:** `try?` is appropriate when failure really means absence. **Why it matters:** do
not discard diagnostics this way when a caller needs to distinguish malformed input from no input.

## Example 62: Match a Specific Error

_ex-62 · exercises co-26, co-21_

```swift
enum ParseError: Error { case empty; case invalid(String) }
func parse(_ text: String) throws -> Int { if text.isEmpty { throw ParseError.empty }; guard let value = Int(text) else { throw ParseError.invalid(text) }; return value }
do { _ = try parse("x") } catch ParseError.invalid(let text) { print("bad: \(text)") } catch { print("other error") }
```

**Key takeaway:** error enums carry only the context each failure needs. **Why it matters:** callers
can give a targeted recovery message rather than treating every failure as the same opaque event.

## Example 63: Return `Result`

_ex-63 · exercises co-26_

```swift
enum ParseError: Error { case invalid }
func parsed(_ text: String) -> Result<Int, ParseError> { Int(text).map(Result.success) ?? .failure(.invalid) }
switch parsed("42") { case let .success(value): print(value); case .failure: print("invalid") } // => 42
```

**Key takeaway:** `Result` stores a success or failure as data. **Why it matters:** use it when
the outcome must travel through a non-throwing API or be handled later as part of another model.

## Example 64: Share a Protocol Extension

_ex-64 · exercises co-24_

```swift
protocol Named { var name: String { get } }
extension Named { func greeting() -> String { "Hello, \(name)" } }
struct User: Named { let name: String }; struct Team: Named { let name: String }
print("\(User(name: "Ada").greeting()) / \(Team(name: "Core").greeting())")
```

**Key takeaway:** default behavior is shared by every conformer. **Why it matters:** this removes
duplication while keeping the protocol's required surface small and understandable.

## Example 65: Compose Protocol Requirements

_ex-65 · exercises co-23_

```swift
protocol Named { var name: String { get } }; protocol Aged { var age: Int { get } }
struct Person: Named, Aged { let name: String; let age: Int }
func introduction(_ value: some Named & Aged) { print("\(value.name): \(value.age)") }
introduction(Person(name: "Ada", age: 30)) // => Ada: 30
```

**Key takeaway:** `&` asks for the intersection of contracts. **Why it matters:** callers state the
minimum behavior required without inventing a broad umbrella protocol prematurely.

## Example 66: Conform to `Equatable`

_ex-66 · exercises co-23_

```swift
struct Coordinate: Equatable { let x: Int; let y: Int } // => compiler synthesizes equality
print(Coordinate(x: 1, y: 2) == Coordinate(x: 1, y: 2)) // => true
```

**Key takeaway:** value models can declare meaningful comparison. **Why it matters:** structural
equality makes assertions and state-change tests express intent directly.

## Example 67: Define a Getter and Setter

_ex-67 · exercises co-18_

```swift
struct Temperature {
    private var celsius = 0.0 // => canonical storage
    var fahrenheit: Double {
        get { celsius * 9 / 5 + 32 } // => derives the display unit
        set { celsius = (newValue - 32) * 5 / 9 } // => converts input back to storage unit
    }
}
var temperature = Temperature(); temperature.fahrenheit = 212
print(temperature.fahrenheit) // => 212.0, setter updates the canonical Celsius storage
```

**Key takeaway:** a computed setter converts at a controlled boundary. **Why it matters:** one
canonical representation prevents two stored units from contradicting each other.

## Example 68: Give an Enum Behavior

_ex-68 · exercises co-20, co-19_

```swift
enum Priority { case low, high; func label() -> String { self == .high ? "act now" : "normal" } }
print(Priority.high.label()) // => act now
```

**Key takeaway:** an enum can keep per-case behavior with its cases. **Why it matters:** it avoids
scattering mappings across callers that all need to know the same domain rule.

## Example 69: Chain Three Optional Links

_ex-69 · exercises co-08_

```swift
struct City { let name: String }; struct Address { let city: City? }; struct User { let address: Address? }
let user = User(address: Address(city: nil))
print(user.address?.city?.name as Any) // => nil; the complete chain short-circuits safely
```

**Key takeaway:** every `?.` preserves the possibility of absence. **Why it matters:** a deep model
can be read safely, but repeated deep chains may also signal a boundary worth simplifying.

## Example 70: Compose a Collection Pipeline

_ex-70 · exercises co-14_

```swift
let total = [1, 2, 3, 4].filter { $0.isMultiple(of: 2) }.map { $0 * 10 }.reduce(0, +)
print(total) // => 60: keep 2,4; transform 20,40; combine
```

**Key takeaway:** each operator has one data role. **Why it matters:** a linear pipeline is easier
to review than interleaving branching, mutation, and transformation in a long loop.

## Example 71: Store an Escaping Closure

_ex-71 · exercises co-13_

```swift
final class Later { private var work: (() -> Void)?; func store(_ action: @escaping () -> Void) { work = action }; func run() { work?() } }
let later = Later(); later.store { print("deferred") }; later.run() // => callback survives the store call
```

**Key takeaway:** `@escaping` declares that a closure outlives the call. **Why it matters:** the
marker makes lifetime and capture review explicit, especially when a closure holds an object reference.

## Example 72: Declare an Async Function

_ex-72 · exercises co-28_

```swift
import Foundation
func fetchCount() async -> Int { 3 } // => async function may suspend in a real implementation
Task { print(await fetchCount()) } // => callers need an async context
RunLoop.current.run(until: Date().addingTimeInterval(0.01)) // => lets this CLI task finish
```

**Key takeaway:** `async` changes the call contract. **Why it matters:** a potentially waiting API
cannot masquerade as an immediate calculation, even when this introductory body returns quickly.

## Example 73: Await a Result

_ex-73 · exercises co-28_

```swift
import Foundation
func greeting() async -> String { "hello" }
Task { let message = await greeting(); print(message) } // => await marks the suspension point
RunLoop.current.run(until: Date().addingTimeInterval(0.01)) // => prints hello before process exit
```

**Key takeaway:** `await` is written where execution may suspend. **Why it matters:** visible
suspension prevents a caller from accidentally assuming a network-like operation is instantaneous.

## Example 74: Start a `Task`

_ex-74 · exercises co-28_

```swift
import Foundation
Task { print("child task") } // => starts asynchronous work from synchronous top-level code
RunLoop.current.run(until: Date().addingTimeInterval(0.01)) // => a CLI needs to remain alive to observe it
```

**Key takeaway:** `Task {}` supplies an async context. **Why it matters:** it is a bridge for this
CLI preview; production work still needs ownership, cancellation, and error policy.

## Example 75: Start Concurrent Children with `async let`

_ex-75 · exercises co-28_

```swift
import Foundation
func value(_ number: Int) async -> Int { number }
Task { async let left = value(2); async let right = value(3); print(await (left + right)) }
RunLoop.current.run(until: Date().addingTimeInterval(0.01)) // => 5 after both children finish
```

**Key takeaway:** `async let` starts child operations before their result is awaited. **Why it matters:**
independent work can overlap, but only when its results and lifetime are both understood.

## Example 76: Handle an Async Error

_ex-76 · exercises co-28, co-26_

```swift
import Foundation
enum FetchError: Error { case unavailable }
func fetch() async throws -> String { throw FetchError.unavailable }
Task { do { print(try await fetch()) } catch { print("try again") } }
RunLoop.current.run(until: Date().addingTimeInterval(0.01)) // => try again
```

**Key takeaway:** `try await` makes both failure and suspension visible. **Why it matters:** callers
must make two decisions—how to wait and how to recover—rather than silently ignoring either one.

## Example 77: Combine Protocols and Generics

_ex-77 · exercises co-23, co-25_

```swift
protocol Describable { func describe() -> String }
struct Task: Describable { let title: String; func describe() -> String { title } }
func labels<T: Describable>(_ values: [T]) -> [String] { values.map { $0.describe() } }
print(labels([Task(title: "read"), Task(title: "run")])) // => ["read", "run"]
```

**Key takeaway:** generic code can require exactly one behavior. **Why it matters:** the compiler
keeps each collection concrete while the algorithm remains reusable across conforming models.

## Example 78: Assemble the Primer CLI

_ex-78 · exercises co-06, co-21, co-23, co-13, co-28_

```swift
import Foundation
enum Availability { case available(String); case unavailable(String) }
protocol Inventory { func find(_ sku: String) -> Availability }
struct LocalInventory: Inventory { let stock: Set<String>; func find(_ sku: String) -> Availability { stock.contains(sku) ? .available(sku) : .unavailable(sku) } }
func report(_ state: Availability) -> String { switch state { case let .available(sku): return "\(sku): available"; case let .unavailable(sku): return "\(sku): unavailable" } }
func fetchRequests() async -> [String?] { ["tea", nil, "coffee"] }
Task { let inventory: Inventory = LocalInventory(stock: ["tea"]); let lines = await fetchRequests().compactMap { $0 }.map { report(inventory.find($0)) }; lines.forEach { print($0) } }
RunLoop.current.run(until: Date().addingTimeInterval(0.01))
```

**Key takeaway:** small language features compose into a total CLI flow. **Why it matters:** the
[capstone](./capstone/overview.md) materializes this same shape in a readable source file and proves
you can move from Swift syntax into the iOS course.
