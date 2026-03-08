---
title: "Beginner"
weight: 10000001
date: 2026-02-02T00:00:00+07:00
draft: false
description: "Examples 1-30: C# fundamentals including Hello World, variables, types, control flow, methods, classes, collections, LINQ basics, and exception handling (0-40% coverage)"
tags: ["c-sharp", "csharp", "dotnet", "tutorial", "by-example", "beginner", "fundamentals"]
---

This beginner tutorial covers C#'s foundational syntax and object-oriented paradigm through 30 heavily annotated examples. Each example demonstrates core concepts with detailed inline comments explaining the imperative and OO approach.

## Example 1: Hello World and C# Compilation

C# is a compiled language that targets the .NET runtime. You can run C# code through compilation to assemblies or use C# Interactive for REPL-style development.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Source Code<br/>Program.cs]:::blue --> B[C# Compiler<br/>Roslyn]:::orange
    B --> C[IL Assembly<br/>Program.dll]:::teal
    C --> D[.NET Runtime<br/>Execution]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 1: Hello World and C# Compilation
Console.WriteLine("Hello, World!");  // => Outputs: Hello, World!
                                      // => Console.WriteLine prints to stdout with newline
```

**Key Takeaway**: C# uses `Console.WriteLine` for output. Statements end with semicolons. The language emphasizes statements and side effects.

**Why It Matters**: C# Interactive (csi) enables rapid prototyping similar to Python's REPL, but with .NET's type safety and performance. Enterprise applications use the compilation model for optimized production deployments, while developers use scripting for quick experiments and automation tasks. Understanding how C# code moves from source to IL to native execution helps diagnose performance issues, choose the right build configurations (Debug vs Release), and understand why JIT warm-up affects initial request latency in web applications.

## Example 2: Variables with Type Inference (var)

C# supports type inference with the `var` keyword, allowing the compiler to deduce types from initialization expressions while maintaining static typing.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[var x = 10]:::blue --> B[Compiler Inference]:::orange
    B --> C[Type: int]:::teal
    B --> D[Mutable by default]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 2: Variables with Type Inference (var)
var x = 10;                  // => x is int (inferred from literal 10)
                             // => MUTABLE - can reassign x
                             // => Type determined at compile time

x = 20;                      // => REASSIGNMENT: x is now 20
                             // => No error - mutation is default in C#
                             // => Previous value 10 is lost

var name = "Alice";          // => name is string (inferred from string literal)
                             // => Compiler determines most specific type

Console.WriteLine(x);        // => Outputs: 20
                             // => Current value of x
Console.WriteLine(name);     // => Outputs: Alice
```

**Key Takeaway**: Use `var` for local variables when type is clear from initializer. Variables are mutable by default - reassignment is allowed.

**Why It Matters**: Mutability by default provides flexibility but introduces risks related to unexpected state changes. Understanding mutation patterns is critical for writing maintainable C# code, especially in multi-threaded applications. When multiple threads access the same mutable variable without synchronization, race conditions occur. Production bugs from unexpected mutations are difficult to reproduce and diagnose. Prefer immutability (readonly, const, records) when the value should not change after initialization to prevent entire classes of concurrency bugs.

## Example 3: Explicit Type Declarations

While `var` provides convenience, explicit type declarations improve code clarity and document developer intent.

```csharp
// Example 3: Explicit Type Declarations
int age = 30;                // => age is int (32-bit signed integer)
                             // => Explicitly declared type

string name = "Bob";         // => name is string (immutable UTF-16 sequence)

double pi = 3.14159;         // => pi is double (64-bit IEEE 754 float)

bool isValid = true;         // => isValid is bool (true or false)

Console.WriteLine($"{age} {name} {pi:F2} {isValid}");
                             // => String interpolation with $""
                             // => {pi:F2} formats to 2 decimal places
                             // => Outputs: 30 Bob 3.14 True
```

**Key Takeaway**: Explicit types document intent and improve readability at API boundaries. Use format specifiers in string interpolation for controlled output.

**Why It Matters**: Type declarations at public API boundaries prevent unintended type changes and improve IntelliSense documentation. String interpolation with format specifiers replaces verbose `String.Format` calls, improving code readability while maintaining type safety and performance. Explicit types at method signatures serve as live documentation - developers reading the API immediately see what types are expected and returned. IDE tooling provides richer autocomplete and refactoring support when types are explicit, reducing the feedback loop from code to understanding.

## Example 4: Nullable Reference Types

C# 8.0+ introduced nullable reference types to eliminate null reference exceptions through compile-time analysis.

```csharp
// Example 4: Nullable Reference Types
string name = "Alice";       // => Non-nullable string
                             // => Cannot be assigned null (compiler warning)
                             // => Guaranteed to have a value

string? nullableName = null; // => Nullable string (? suffix)
                             // => Can be assigned null
                             // => Type: string? (nullable reference type)

int? nullableAge = null;     // => Nullable value type
                             // => int? is shorthand for Nullable<int>
                             // => Can hold int values OR null

nullableAge = 25;            // => Assign value to nullable int
                             // => nullableAge now holds 25 (not null)

if (nullableAge.HasValue)    // => HasValue checks if null
{                            // => true when value is present
    Console.WriteLine(nullableAge.Value);
                             // => .Value extracts int value
                             // => Outputs: 25
                             // => Throws if HasValue is false
}

int age = nullableAge ?? 0;  // => Null-coalescing operator ??
                             // => Returns left if not null, else right
                             // => age is 25 (nullableAge has value)
Console.WriteLine(age);      // => Outputs: 25
```

**Key Takeaway**: Use `?` suffix for nullable types. Check `HasValue` before accessing `.Value`. Use `??` for default values.

**Why It Matters**: Nullable reference types eliminate null reference exceptions - Tony Hoare's "billion-dollar mistake". Codebases that enable nullable reference types see significant reductions in null-related production errors, making systems more reliable without runtime overhead. Enabling `<Nullable>enable</Nullable>` in new projects is a best practice that makes nullability intent explicit in API contracts. Teams migrating existing codebases incrementally adopt nullable annotations file by file, exposing hidden null assumptions that previously caused production crashes.

## Example 5: Control Flow - If Statements

C# `if` statements control execution flow based on boolean conditions. Unlike F#, they're statements (not expressions) executed for side effects.

```csharp
// Example 5: Control Flow - If Statements
int x = 10;                  // => x is 10 (positive integer)
                             // => Will be tested in conditional branches

if (x > 0)                   // => Condition: x > 0 evaluates to true
{                            // => Braces define code block
                             // => Required for multi-line blocks
    Console.WriteLine("Positive");
                             // => Executes when condition is true
                             // => Outputs: Positive
                             // => First matching branch wins
}
else if (x < 0)              // => Additional condition (not evaluated here)
{                            // => Would execute if x < 0
                             // => Skipped when previous condition matched
    Console.WriteLine("Negative");
                             // => Not executed (x is positive)
}
else                         // => Default case (not executed)
{                            // => Executes when neither above condition true
                             // => Catch-all for remaining cases
    Console.WriteLine("Zero");
                             // => Not executed (first condition was true)
}

// Ternary operator (expression form):
string description = x > 0 ? "positive" : "non-positive";
                             // => condition ? true-value : false-value
                             // => Returns "positive" (x > 0 is true)
                             // => description is "positive"
                             // => Ternary returns value (expression not statement)

Console.WriteLine(description);
                             // => Outputs: positive
```

**Key Takeaway**: If statements use braces for blocks. Ternary operator (`? :`) provides expression-based conditional.

**Why It Matters**: While if statements don't return values like F# expressions, the ternary operator provides expression semantics when needed. Understanding when to use statements vs expressions improves code clarity - use ternary for simple value selection, if statements for complex multi-line logic. Well-structured conditionals communicate intent clearly; deeply nested if-else chains signal the need for refactoring into guard clauses, early returns, or switch expressions. Clean conditional logic reduces cognitive load for reviewers and reduces defect introduction during maintenance.

## Example 6: Switch Expressions (C# 8.0+)

Switch expressions provide pattern matching with expression semantics, replacing verbose switch statements.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[number input]:::blue --> B{Pattern Match}:::orange
    B -->|1| C[One]:::teal
    B -->|2| D[Two]:::teal
    B -->|_| E[Other]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 6: Switch Expressions (C# 8.0+)
int number = 2;              // => number is 2

string description = number switch  // => Switch expression returns value
{                            // => Pattern matching on number
    1 => "One",              // => Pattern: constant 1, result: "One"
                             // => => separates pattern from result
    2 => "Two",              // => Pattern: constant 2, result: "Two"
                             // => Matches current number value
    _ => "Other"             // => _ is discard pattern (wildcard/default)
                             // => Must be EXHAUSTIVE or compiler warns
};                           // => Semicolon ends expression statement
                             // => description is "Two" (matched pattern 2)

Console.WriteLine(description);
                             // => Outputs: Two

// Switch with guards:
string category = number switch
{                            // => Pattern matching with relational operators
    > 0 and < 10 => "Small",    // => Relational pattern with and
                                  // => Pattern: number > 0 AND number < 10
                                  // => Matches: number=2 satisfies both conditions
    >= 10 and < 100 => "Medium", // => Multiple conditions
                                  // => Not evaluated (previous pattern matched)
    >= 100 => "Large",           // => Single relational pattern
                                  // => Not evaluated
    _ => "Invalid"               // => Default case
                                  // => Not needed (previous pattern matched)
};                               // => category is "Small" (first match wins)
Console.WriteLine(category);     // => Outputs: Small
```

**Key Takeaway**: Switch expressions return values and support pattern matching. Use relational patterns (`>`, `<`, `>=`) and logical patterns (`and`, `or`).

**Why It Matters**: Switch expressions bring functional programming patterns to C#, eliminating temporary variables and improving readability. They reduce code complexity compared to equivalent if/else chains while maintaining compile-time exhaustiveness checking. The compiler warns when a switch expression is not exhaustive, preventing runtime failures from unhandled cases. In domain-driven design, switch expressions on discriminated union types (via records/interfaces) model state transitions cleanly. Pattern matching in switch expressions enables powerful routing logic with minimal boilerplate in API handlers and business rule engines.

## Example 7: Loops - For Loop

For loops enable iteration over sequences with index-based control, executing code blocks repeatedly.

```csharp
// Example 7: Loops - For Loop
for (int i = 0; i < 5; i++)  // => Initializer: int i = 0
                             // => Condition: i < 5 (checked before each iteration)
                             // => Iterator: i++ (increments after each iteration)
{                            // => Loop body executes while condition is true
    Console.WriteLine(i);    // => Iteration 1: i=0, Outputs: 0
                             // => Iteration 2: i=1, Outputs: 1
                             // => Iteration 3: i=2, Outputs: 2
                             // => Iteration 4: i=3, Outputs: 3
                             // => Iteration 5: i=4, Outputs: 4
                             // => Iteration 6: i=5 (condition false, exits)
}

// Nested loop:
for (int i = 1; i <= 3; i++)
{                            // => Outer loop: i from 1 to 3
    for (int j = 1; j <= 2; j++)
    {                        // => Inner loop: j from 1 to 2
        Console.WriteLine($"i={i}, j={j}");
                             // => Outputs: i=1, j=1
                             // => Outputs: i=1, j=2
                             // => Outputs: i=2, j=1
                             // => Outputs: i=2, j=2
                             // => Outputs: i=3, j=1
                             // => Outputs: i=3, j=2
    }
}
```

**Key Takeaway**: For loops have initializer, condition, and iterator. Nested loops multiply iteration counts.

**Why It Matters**: For loops provide imperative iteration with fine-grained control over index variables. While LINQ and foreach offer more declarative alternatives for most cases, for loops remain optimal for algorithms requiring index manipulation (binary search, insertion sort) or backwards iteration. Performance-critical code such as array processing in game engines, signal processing, or numerical algorithms often requires for loops to achieve cache-friendly sequential memory access patterns. Understanding loop semantics prevents common bugs like modifying a collection while iterating or incorrect boundary conditions.

## Example 8: Loops - Foreach Loop

Foreach loops iterate over collections without explicit index management, providing cleaner syntax than for loops.

```csharp
// Example 8: Loops - Foreach Loop
int[] numbers = { 1, 2, 3, 4, 5 };  // => Array initializer syntax
                                     // => numbers is int[] (mutable array)
                                     // => Length: 5 elements

foreach (int num in numbers)  // => Iterates over each element
{                             // => num takes value of current element
    Console.WriteLine(num);   // => Iteration 1: num=1, Outputs: 1
                              // => Iteration 2: num=2, Outputs: 2
                              // => Iteration 3: num=3, Outputs: 3
                              // => Iteration 4: num=4, Outputs: 4
                              // => Iteration 5: num=5, Outputs: 5
}

// Foreach with var:
foreach (var num in numbers)  // => Type inference: var becomes int
{                             // => num is int (inferred from array element type)
    Console.WriteLine(num * 2);
                              // => Doubles each element
                              // => Outputs: 2, 4, 6, 8, 10 (on separate lines)
}
```

**Key Takeaway**: Foreach iterates over IEnumerable collections. Element type can use `var` for inference.

**Why It Matters**: Foreach eliminates index-related bugs (off-by-one errors) and clearly expresses intent - "process each element" rather than "loop from 0 to N-1". Foreach generates optimized code for arrays and Lists equivalent to manual indexing, with no performance penalty. The `foreach` keyword works with any `IEnumerable<T>` implementation - custom collections, LINQ queries, database result sets via Entity Framework, and file readers all support foreach iteration. This abstraction allows switching underlying data sources without changing iteration logic.

## Example 9: Methods - Basic Syntax

Methods encapsulate reusable logic with parameters and return values. They're the fundamental building block of C# code organization.

```csharp
// Example 9: Methods - Basic Syntax
int Add(int x, int y)        // => Method signature: return type, name, parameters
{                            // => Parameters: x and y (both int)
    return x + y;            // => return keyword REQUIRED to return value
                             // => Returns sum of x and y
}                            // => Method type: (int, int) -> int

int result = Add(3, 5);      // => Method invocation with arguments 3 and 5
                             // => Calls Add method
                             // => result is 8 (3 + 5)
Console.WriteLine(result);   // => Outputs: 8

// Method with no return value (void):
void PrintMessage(string message)
{                            // => void means no return value
                             // => message is parameter (string type)
    Console.WriteLine($"Message: {message}");
                             // => Executes for side effect (printing)
                             // => $ enables string interpolation
}                            // => No return statement needed for void

PrintMessage("Hello");       // => Invocation with "Hello" argument
                             // => Outputs: Message: Hello
```

**Key Takeaway**: Methods use `return` to return values. `void` indicates no return value. Parameters declared with type annotations.

**Why It Matters**: Methods provide code reuse and abstraction boundaries. Unlike functional languages where functions are values, C# methods are class members (except local functions), making them the primary organizational unit for business logic in object-oriented designs. Well-named methods serve as self-documenting code - a method called `ValidatePaymentAmount` communicates intent better than inline logic. Short methods (5-15 lines) are easier to test, review, and modify. Static analysis tools and code coverage metrics operate at the method level, making method decomposition critical for maintainability.

## Example 10: Lambda Expressions

Lambda expressions create anonymous functions inline, commonly used with LINQ and higher-order methods.

```csharp
// Example 10: Lambda Expressions
Func<int, int> double = x => x * 2;
                             // => Lambda: parameter => expression
                             // => Func<int, int>: type of function (int -> int)
                             // => x is parameter (type inferred as int)
                             // => x * 2 is expression body
                             // => Creates inline function without separate method declaration

int result = double(5);      // => Invoke lambda like method
                             // => result is 10

// Multi-parameter lambda:
Func<int, int, int> add = (x, y) => x + y;
                             // => Parentheses REQUIRED for multiple parameters
                             // => Func<int, int, int>: (int, int) -> int
int sum = add(3, 5);         // => sum is 8

// Lambda with statement body:
Func<int, int> square = x =>
{                            // => Braces for multi-statement body
    int result = x * x;      // => Local variable in lambda
    return result;           // => return REQUIRED in statement body
};                           // => Semicolon ends variable declaration
int squared = square(4);     // => squared is 16

Console.WriteLine($"{result}, {sum}, {squared}");
                             // => Outputs: 10, 8, 16
```

**Key Takeaway**: Lambdas use `param => expression` or `param => { statements }` syntax. Declare with `Func<>` delegate types.

**Why It Matters**: Lambdas enable functional programming patterns in C# - LINQ queries, event handlers, and callbacks all use lambda syntax extensively. Modern C# codebases use lambdas extensively in LINQ operations, replacing verbose anonymous method syntax from C# 2.0. Lambdas capture outer variables (closures), enabling patterns like memoization and partial application. Understanding when lambdas capture by reference vs by value prevents subtle bugs in async code and loops. Lambda expressions are the foundation of expression trees, which Entity Framework uses to translate C# queries into SQL.

## Example 11: Classes and Objects

Classes define object templates with fields, properties, and methods. They're C#'s primary abstraction mechanism.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Person Class<br/>Template]:::blue --> B[alice Instance<br/>Name: Alice<br/>Age: 30]:::orange
    A --> C[bob Instance<br/>Name: Bob<br/>Age: 25]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 11: Classes and Objects
class Person                 // => Class definition (reference type)
{                            // => Classes are mutable by default
    public string Name;      // => Public field (direct access allowed)
                             // => Reference type (string)
    public int Age;          // => Value type field (int)
                             // => public allows access from anywhere
}                            // => Semicolon NOT required after class

Person alice = new Person(); // => Create instance with new keyword
                             // => alice is reference to Person object on heap
                             // => Fields initialized to defaults (null, 0)

alice.Name = "Alice";        // => Assign to Name field
                             // => alice.Name is now "Alice"
alice.Age = 30;              // => Assign to Age field
                             // => alice.Age is now 30

Person bob = new Person      // => Object initializer syntax (C# 3.0+)
{                            // => Braces contain initialization expressions
    Name = "Bob",            // => Initialize Name field to "Bob"
    Age = 25                 // => Initialize Age field to 25
};                           // => Semicolon ends statement
                             // => bob.Name="Bob", bob.Age=25

Console.WriteLine($"{alice.Name} is {alice.Age}");
                             // => String interpolation with $ prefix
                             // => Outputs: Alice is 30
Console.WriteLine($"{bob.Name} is {bob.Age}");
                             // => Outputs: Bob is 25
```

**Key Takeaway**: Classes use `class Name { members }` syntax. Create instances with `new`. Fields are mutable by default.

**Why It Matters**: Classes are reference types - multiple variables can reference the same object, enabling shared mutable state. This power comes with responsibility - many C# bugs relate to unexpected object mutations. Understanding reference semantics is critical for writing correct multi-threaded code. When passing objects to methods or storing in collections, no copy is made - the reference is passed. Equality comparison with `==` compares references by default, not values. Overriding `Equals` and `GetHashCode` is necessary for value-based equality semantics required by dictionaries and LINQ operations like `Distinct`.

## Example 12: Properties with Get/Set

Properties provide controlled access to private fields through getters and setters, encapsulating implementation details.

```csharp
// Example 12: Properties with Get/Set
class Person                 // => Person class with encapsulated fields
{
    private string _name;    // => Private field (backing field)
                             // => Convention: _ prefix for private fields
    private int _age;        // => Private int field

    public string Name       // => Public property
    {                        // => Provides controlled access to _name
        get { return _name; }
                             // => Getter: returns private field value
        set { _name = value; }
                             // => Setter: value is implicit parameter
                             // => Assigns to private field
    }

    public int Age           // => Public Age property
    {                        // => Provides validated access to _age
        get { return _age; }
                             // => Getter: returns _age value
        set                  // => Setter with validation logic
        {                    // => value is implicit parameter (int)
            if (value >= 0)  // => Check age is non-negative
            {                // => Valid ages only
                _age = value;
                             // => Only update if valid
            }                // => Invalid values ignored (silent failure)
        }
    }
}

Person alice = new Person();
                             // => Create Person instance
                             // => _name=null, _age=0 (defaults)
alice.Name = "Alice";        // => Calls Name setter with "Alice"
                             // => _name field becomes "Alice"
alice.Age = 30;              // => Calls Age setter with 30
                             // => Validation passes (30 >= 0)
                             // => _age field becomes 30

Console.WriteLine($"{alice.Name} is {alice.Age}");
                             // => Calls Name getter and Age getter
                             // => Outputs: Alice is 30

alice.Age = -5;              // => Calls setter with invalid value -5
                             // => Fails validation (-5 < 0)
                             // => _age unchanged (remains 30)
Console.WriteLine(alice.Age);// => Calls Age getter
                             // => Outputs: 30 (invalid value rejected)
```

**Key Takeaway**: Properties use `get` and `set` accessors. Setters receive `value` parameter implicitly. Enable validation and computed values.

**Why It Matters**: Properties maintain encapsulation while providing field-like syntax. They're the .NET standard for data access - public fields violate conventions and break databinding, reflection, and serialization frameworks that expect property semantics. Validation in property setters catches invalid data at the point of assignment rather than at use, making bugs easier to locate. Properties enable lazy loading patterns (compute value on first access), change notification (INotifyPropertyChanged for UI databinding), and logging (log every read/write for audit trails) without changing the calling code.

## Example 13: Auto-Implemented Properties

Auto-implemented properties eliminate boilerplate for simple getters and setters, improving code conciseness.

```csharp
// Example 13: Auto-Implemented Properties
class Person                 // => Person class with auto-properties
{
    public string Name { get; set; }
                             // => Auto-implemented property
                             // => Compiler generates private backing field
                             // => public get and set accessors

    public int Age { get; set; }
                             // => Same pattern for Age property
                             // => Mutable through public setter

    public string Email { get; private set; }
                             // => Public getter, private setter
                             // => Can only be set within class
                             // => Immutable from outside class

    public Person(string email)
    {                        // => Constructor with email parameter
                             // => Required for Email initialization
        Email = email;       // => Private setter accessible here
                             // => Email can't be changed after construction
    }
}

Person alice = new Person("alice@example.com")
{                            // => Constructor + object initializer
                             // => Calls constructor first with email
    Name = "Alice",          // => Uses public Name setter
    Age = 30                 // => Uses public Age setter
};                           // => Semicolon ends statement
                             // => alice.Email is "alice@example.com"

Console.WriteLine($"{alice.Name}, {alice.Age}, {alice.Email}");
                             // => String interpolation with all properties
                             // => Outputs: Alice, 30, alice@example.com

// alice.Email = "new@example.com";  // => ERROR: setter is private
                             // => Compile error: Email setter not accessible
```

**Key Takeaway**: Auto-properties use `{ get; set; }` syntax. Make setters private for immutability. Use in constructors for initialization.

**Why It Matters**: Auto-properties significantly reduce boilerplate compared to manual properties with backing fields. Private setters enable immutability patterns without readonly fields, supporting scenarios where initialization must occur in constructors rather than field initializers. The `{ get; init; }` pattern (C# 9+) provides immutability with object initializer support, widely used in configuration objects and DTOs. Record types use auto-properties under the hood. Serialization frameworks like `System.Text.Json` and XML serializers require properties (not fields) to serialize class members correctly.

## Example 14: Constructors

Constructors initialize object state when instances are created. They run before object is fully available.

```csharp
// Example 14: Constructors
class Person                 // => Person class with multiple constructors
{
    public string Name { get; set; }
                             // => Auto-property for Name
    public int Age { get; set; }
                             // => Auto-property for Age

    public Person()          // => Default constructor (no parameters)
    {                        // => Called with: new Person()
        Name = "Unknown";    // => Sets default Name value
        Age = 0;             // => Sets default Age value
    }                        // => Provides safe defaults

    public Person(string name, int age)
    {                        // => Parameterized constructor
                             // => name is string parameter
                             // => age is int parameter
        Name = name;         // => Initialize Name from parameter
        Age = age;           // => Sets Age from parameter
    }                        // => Called with: new Person("Alice", 30)
}

Person person1 = new Person();
                             // => Calls default constructor (no arguments)
                             // => person1.Name="Unknown", person1.Age=0

Person person2 = new Person("Bob", 25);
                             // => Calls parameterized constructor
                             // => Passes "Bob" for name, 25 for age
                             // => person2.Name="Bob", person2.Age=25

Console.WriteLine($"{person1.Name}, {person1.Age}");
                             // => Accesses Name and Age properties
                             // => Outputs: Unknown, 0
Console.WriteLine($"{person2.Name}, {person2.Age}");
                             // => Outputs: Bob, 25
```

**Key Takeaway**: Constructors have same name as class, no return type. Multiple constructors provide initialization flexibility.

**Why It Matters**: Constructors guarantee invariants - required fields can be validated before objects become available. Dependency injection frameworks rely on constructor injection to provide dependencies, making constructors the standard initialization pattern in enterprise C# applications. Constructor injection makes dependencies explicit and testable - unit tests pass mock implementations through constructors without framework magic. Parameterless constructors are required by many serializers and ORMs for deserialization. Constructor chaining with `this()` reduces code duplication when multiple constructors share initialization logic.

## Example 15: Collections - List<T>

`List<T>` is a generic, dynamically-sized collection - the most commonly used collection type in C#.

```csharp
// Example 15: Collections - List<T>
List<int> numbers = new List<int>();
                             // => Generic list of integers
                             // => Type parameter: <int>
                             // => Initially empty (Count=0)

numbers.Add(1);              // => Append 1 to list
                             // => numbers is [1], Count=1
numbers.Add(2);              // => numbers is [1, 2], Count=2
numbers.Add(3);              // => numbers is [1, 2, 3], Count=3

int first = numbers[0];      // => Index access with [index]
                             // => first is 1 (zero-based indexing)

numbers[0] = 10;             // => MUTATION: update element at index 0
                             // => numbers is [10, 2, 3]

numbers.Remove(2);           // => Remove first occurrence of value 2
                             // => numbers is [10, 3], Count=2

// Collection initializer:
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
                             // => Initialize with values
                             // => names is ["Alice", "Bob", "Charlie"]

Console.WriteLine(string.Join(", ", numbers));
                             // => Join elements with separator
                             // => Outputs: 10, 3
Console.WriteLine(string.Join(", ", names));
                             // => Outputs: Alice, Bob, Charlie
```

**Key Takeaway**: `List<T>` provides dynamic sizing. Access elements with `[index]`. Initialize with `{ }` syntax. Mutable by default.

**Why It Matters**: `List<T>` is the default collection choice for most scenarios - it provides O(1) indexed access, O(1) amortized append, and full LINQ support. Understanding List vs Array vs IEnumerable tradeoffs is fundamental to C# performance optimization. Arrays are faster for fixed-size data with predictable access patterns. `IReadOnlyList<T>` communicates non-mutation intent at API boundaries. Pre-sizing lists with `new List<T>(capacity)` eliminates resize reallocations when the expected count is known, improving performance in data processing pipelines that handle thousands of elements.

## Example 16: Collections - Dictionary<TKey, TValue>

Dictionaries provide key-value storage with O(1) average lookup time, essential for caching and mapping scenarios.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A["Dictionary<string, int>"]:::blue
    A --> B["Alice → 30"]:::orange
    A --> C["Bob → 25"]:::teal
    A --> D["Charlie → 35"]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 16: Collections - Dictionary<TKey, TValue>
Dictionary<string, int> ages = new Dictionary<string, int>();
                             // => Generic dictionary: key=string, value=int
                             // => Type parameters: TKey=string, TValue=int
                             // => Initially empty (Count=0)

ages["Alice"] = 30;          // => Add key-value pair using indexer
                             // => ages has {"Alice": 30}, Count=1
ages["Bob"] = 25;            // => Add another pair
                             // => ages has {"Alice": 30, "Bob": 25}
ages["Charlie"] = 35;        // => Count=3

int aliceAge = ages["Alice"];// => Index with key (not integer index)
                             // => aliceAge is 30
                             // => Throws KeyNotFoundException if key missing

ages["Alice"] = 31;          // => MUTATION: update existing key
                             // => ages["Alice"] is now 31 (overwrites 30)

bool hasCharlie = ages.ContainsKey("Charlie");
                             // => Check if key exists (O(1) operation)
                             // => hasCharlie is true

// TryGetValue pattern (recommended):
if (ages.TryGetValue("Alice", out int age))
{                            // => Tries to get value for key "Alice"
                             // => If found: returns true, sets age to value
                             // => out parameter receives value
    Console.WriteLine($"Alice is {age}");
                             // => age is 31 (from dictionary)
                             // => Outputs: Alice is 31
}

// Collection initializer:
Dictionary<string, int> scores = new Dictionary<string, int>
{                            // => Initialize with key-value pairs
    ["Alice"] = 100,         // => Index initializer syntax
    ["Bob"] = 85             // => scores has {"Alice": 100, "Bob": 85}
};

Console.WriteLine($"Count: {ages.Count}");
                             // => Outputs: Count: 3
```

**Key Takeaway**: Dictionaries use `[key]` syntax for access. Use `TryGetValue` to avoid exceptions. Check `ContainsKey` before access.

**Why It Matters**: Dictionaries enable O(1) lookups critical for performance - caching, indexing, and mapping operations. TryGetValue pattern avoids exceptions in hot paths, improving performance by 10-100x compared to exception-based control flow. `ConcurrentDictionary<TKey, TValue>` provides thread-safe dictionary operations for shared caches without explicit locking. `ImmutableDictionary<TKey, TValue>` prevents mutations and is safe to share across threads. In-memory caches, symbol tables, and configuration lookups all rely on dictionary performance characteristics to serve thousands of requests per second.

## Example 17: Collections - HashSet<T>

HashSets store unique elements with O(1) add/contains operations, ideal for deduplication and membership testing.

```csharp
// Example 17: Collections - HashSet<T>
HashSet<int> uniqueNumbers = new HashSet<int>();
                             // => HashSet of integers
                             // => Stores unique values only
                             // => Initially empty (Count=0)

uniqueNumbers.Add(1);        // => Add 1 to set
                             // => uniqueNumbers is {1}, Count=1
                             // => Returns true (element added)

bool added = uniqueNumbers.Add(1);
                             // => Try to add duplicate 1
                             // => Returns false (already exists)
                             // => uniqueNumbers still {1}, Count=1

uniqueNumbers.Add(2);        // => uniqueNumbers is {1, 2}
uniqueNumbers.Add(3);        // => uniqueNumbers is {1, 2, 3}

bool contains = uniqueNumbers.Contains(2);
                             // => O(1) membership test
                             // => contains is true

// Collection initializer:
HashSet<string> tags = new HashSet<string> { "c-sharp", "dotnet", "tutorial" };
                             // => Initialize with values
                             // => Duplicates automatically removed

tags.Add("c-sharp");         // => Duplicate, not added
                             // => tags still has 3 elements

Console.WriteLine($"Count: {uniqueNumbers.Count}");
                             // => Outputs: Count: 3
Console.WriteLine(string.Join(", ", uniqueNumbers));
                             // => Order not guaranteed in HashSet
                             // => Outputs: 1, 2, 3 (may vary)
```

**Key Takeaway**: HashSet guarantees uniqueness. `Add` returns `bool` indicating whether element was added. Order is not preserved.

**Why It Matters**: HashSets eliminate duplicates efficiently - processing 1 million elements with List.Distinct() takes seconds, while HashSet.Add loops take milliseconds. Use HashSets for deduplication, set operations (union, intersect), and fast membership testing. Permission systems store granted roles in a HashSet for O(1) authorization checks on every request. Data pipelines use HashSets to track processed record IDs and skip duplicates. `IntersectWith` and `UnionWith` enable set algebra on tag collections, product categories, and feature flags without nested loop complexity.

## Example 18: LINQ - Where (Filtering)

LINQ (Language Integrated Query) provides functional operations on collections through extension methods and query syntax.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Source: 1,2,3,4,5,6,7,8,9,10]:::blue -->|Where n % 2 == 0| B[Filtered: 2,4,6,8,10]:::orange
    B -->|ToList| C[Result List]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 18: LINQ - Where (Filtering)
List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
                             // => Source collection: 1 through 10

IEnumerable<int> evens = numbers.Where(n => n % 2 == 0);
                             // => Where is extension method
                             // => Predicate lambda: n => n % 2 == 0
                             // => Returns IEnumerable<int> (lazy)
                             // => No filtering happens yet (deferred execution)

List<int> evensList = evens.ToList();
                             // => ToList() forces evaluation
                             // => Creates new list with results
                             // => evensList is [2, 4, 6, 8, 10]

// Method chaining:
IEnumerable<int> result = numbers
    .Where(n => n > 5)       // => Filter: keep elements > 5
                             // => Intermediate result: [6, 7, 8, 9, 10]
    .Where(n => n % 2 == 0); // => Filter: keep even numbers
                             // => Final result (lazy): [6, 8, 10]

Console.WriteLine(string.Join(", ", evensList));
                             // => Outputs: 2, 4, 6, 8, 10
Console.WriteLine(string.Join(", ", result));
                             // => Forces evaluation, Outputs: 6, 8, 10
```

**Key Takeaway**: `Where` filters with predicate lambda. Returns `IEnumerable<T>` (lazy). Chain multiple operations. Use `ToList()` to force evaluation.

**Why It Matters**: LINQ enables declarative data transformations - queries express WHAT to compute, not HOW. Deferred execution optimizes performance by eliminating intermediate collections, and LINQ-to-SQL/EF translates C# queries to database SQL, enabling type-safe database access. Composing LINQ queries incrementally (adding filters based on user input) is safer than concatenating SQL strings, eliminating SQL injection vectors. IQueryable providers (Entity Framework, LINQ to XML) translate expression trees to domain-specific query languages, enabling the same C# syntax to query databases, XML documents, and in-memory collections.

## Example 19: LINQ - Select (Mapping)

Select transforms each element in a collection, projecting to a new type or value.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Source: 1,2,3,4,5]:::blue -->|Select n => n * 2| B[Transformed: 2,4,6,8,10]:::orange
    B -->|ToList| C[Result List]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 19: LINQ - Select (Mapping)
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
                             // => Source: [1, 2, 3, 4, 5]

IEnumerable<int> doubled = numbers.Select(n => n * 2);
                             // => Select transforms each element
                             // => Lambda: n => n * 2
                             // => Result (lazy): [2, 4, 6, 8, 10]

List<int> doubledList = doubled.ToList();
                             // => Force evaluation
                             // => doubledList is [2, 4, 6, 8, 10]

// Projection to anonymous type:
var people = new List<Person>
{                            // => List of Person objects
    new Person { Name = "Alice", Age = 30 },
    new Person { Name = "Bob", Age = 25 }
};

var names = people.Select(p => p.Name).ToList();
                             // => Project to names only
                             // => Lambda: p => p.Name
                             // => names is ["Alice", "Bob"] (List<string>)

// Anonymous type projection:
var summary = people.Select(p => new { p.Name, IsAdult = p.Age >= 18 }).ToList();
                             // => Projects to anonymous type
                             // => Creates objects with Name and IsAdult properties
                             // => summary[0] is { Name = "Alice", IsAdult = true }
                             // => summary[1] is { Name = "Bob", IsAdult = true }

Console.WriteLine(string.Join(", ", doubledList));
                             // => Outputs: 2, 4, 6, 8, 10
Console.WriteLine(string.Join(", ", names));
                             // => Outputs: Alice, Bob
Console.WriteLine($"{summary[0].Name}: {summary[0].IsAdult}");
                             // => Outputs: Alice: True
```

**Key Takeaway**: `Select` maps elements with transformation lambda. Can project to same type, different type, or anonymous types.

**Why It Matters**: Select enables data transformation without loops - extract fields, compute derived values, reshape objects. LINQ-to-SQL/EF translates Select to SQL SELECT clauses, pushing projections to databases for performance (only requested columns transferred). Projection to DTOs (data transfer objects) decouples API responses from database models - adding a new database column doesn't break existing API consumers. Anonymous type projections are useful for intermediate transformations but should be converted to named types at API boundaries for clarity and serialization compatibility.

## Example 20: LINQ - OrderBy/OrderByDescending

Ordering operations sort collections by key selectors, producing sorted sequences.

```csharp
// Example 20: LINQ - OrderBy/OrderByDescending
List<int> numbers = new List<int> { 5, 2, 8, 1, 9, 3 };
                             // => Unsorted: [5, 2, 8, 1, 9, 3]

IEnumerable<int> sorted = numbers.OrderBy(n => n);
                             // => OrderBy with key selector: n => n (identity)
                             // => Sorts ascending by element value
                             // => Result (lazy): [1, 2, 3, 5, 8, 9]

List<int> sortedList = sorted.ToList();
                             // => Force evaluation
                             // => sortedList is [1, 2, 3, 5, 8, 9]

IEnumerable<int> descending = numbers.OrderByDescending(n => n);
                             // => Sort descending
                             // => Result: [9, 8, 5, 3, 2, 1]

// Ordering complex objects:
var people = new List<Person>
{
    new Person { Name = "Charlie", Age = 35 },
    new Person { Name = "Alice", Age = 30 },
    new Person { Name = "Bob", Age = 25 }
};

var byAge = people.OrderBy(p => p.Age).ToList();
                             // => Sort by Age property (ascending)
                             // => byAge[0] is Bob (25)
                             // => byAge[1] is Alice (30)
                             // => byAge[2] is Charlie (35)

var byName = people.OrderBy(p => p.Name).ToList();
                             // => Sort by Name (alphabetically)
                             // => byName[0] is Alice
                             // => byName[1] is Bob
                             // => byName[2] is Charlie

Console.WriteLine(string.Join(", ", sortedList));
                             // => Outputs: 1, 2, 3, 5, 8, 9
Console.WriteLine(string.Join(", ", byAge.Select(p => p.Name)));
                             // => Outputs: Bob, Alice, Charlie
```

**Key Takeaway**: `OrderBy` sorts ascending, `OrderByDescending` descending. Key selector lambda chooses sort property.

**Why It Matters**: LINQ ordering uses stable sort algorithms - equal elements maintain original order. Combined with ThenBy for multi-level sorting, this enables complex sorting without manual comparers, improving code clarity. Database-backed LINQ queries translate OrderBy to SQL ORDER BY, allowing efficient database-side sorting on indexed columns rather than loading all rows and sorting in memory. Pagination APIs depend on consistent ordering - the same sort criteria must be applied on every page request to prevent duplicate or missing records when the underlying data changes between page fetches.

## Example 21: Exception Handling - Try-Catch

Try-catch blocks handle runtime errors gracefully, preventing application crashes and enabling error recovery.

```csharp
// Example 21: Exception Handling - Try-Catch
try                          // => try block: code that might throw
{                            // => Protected region for error handling
    int[] numbers = { 1, 2, 3 };
                             // => Array with 3 elements (indices 0-2)
    Console.WriteLine(numbers[10]);
                             // => Index 10 out of bounds (array has 3 elements)
                             // => Throws IndexOutOfRangeException
                             // => Execution jumps to catch block
}
catch (IndexOutOfRangeException ex)
{                            // => Catches specific exception type
                             // => ex is exception object with details
    Console.WriteLine($"Error: {ex.Message}");
                             // => Access exception message property
                             // => Outputs: Error: Index was outside the bounds of the array.
}

// Multiple catch blocks:
try                          // => Second try block
{                            // => Protected region
    string? text = null;     // => Nullable string set to null
    Console.WriteLine(text.Length);
                             // => Null reference access (text is null)
                             // => Throws NullReferenceException
}
catch (NullReferenceException ex)
{                            // => Catches null reference exceptions specifically
                             // => More specific than Exception
    Console.WriteLine("Null reference caught");
                             // => Outputs: Null reference caught
}
catch (Exception ex)         // => Catches any exception (base class)
{                            // => More specific catches MUST come first
                             // => This is catch-all for other exceptions
    Console.WriteLine($"General error: {ex.Message}");
                             // => Not executed (specific catch handled it)
}
```

**Key Takeaway**: Use try-catch for error handling. Catch specific exceptions first, then general ones. Access exception details via `ex` object.

**Why It Matters**: Exceptions provide structured error handling superior to error codes. However, exceptions are expensive (1000x slower than normal flow) - use them for exceptional conditions only, not control flow. Reserve exceptions for errors, use return values for expected alternatives. The `Result<T, TError>` pattern (popular in functional C#) models expected failures explicitly without exception overhead. Global exception handlers in ASP.NET Core log unhandled exceptions and return appropriate HTTP status codes, preventing raw stack traces from leaking to API consumers in production.

## Example 22: Exception Handling - Finally

Finally blocks execute regardless of whether exceptions occur, ensuring cleanup code runs.

```csharp
// Example 22: Exception Handling - Finally
void ProcessFile()           // => Method demonstrating finally block
{
    try                      // => Protected code block
    {
        Console.WriteLine("Opening file...");
                             // => Simulates file operation
                             // => Outputs: Opening file...
        throw new Exception("File error");
                             // => Simulated error (explicit throw)
                             // => Jumps to catch block
    }
    catch (Exception ex)     // => Catch block handles exception
    {                        // => ex contains exception details
        Console.WriteLine($"Error: {ex.Message}");
                             // => Outputs: Error: File error
    }
    finally                  // => Finally block ALWAYS executes
    {                        // => Runs after try or catch completes
                             // => Guaranteed execution for cleanup
        Console.WriteLine("Closing file...");
                             // => Cleanup code (close files, release locks)
                             // => Outputs: Closing file...
                             // => Executes even if exception thrown
    }
}

ProcessFile();               // => Calls method
                             // => Output order:
                             // => Opening file...
                             // => Error: File error
                             // => Closing file...
```

**Key Takeaway**: Finally blocks always execute - with or without exceptions. Use for cleanup (closing files, releasing locks).

**Why It Matters**: Finally guarantees cleanup runs even during exceptions, early returns, or control flow changes. Modern C# prefers `using` statements (automatic Dispose) over finally for resource cleanup, but finally remains essential for non-IDisposable cleanup scenarios. Neglecting cleanup in finally blocks causes resource leaks (file handles, database connections, network sockets) that accumulate over time and crash services. Long-running services depend on deterministic cleanup to handle millions of requests without memory or connection pool exhaustion. The `using` declaration syntax (C# 8+) reduces nesting while maintaining the same guarantees.

## Example 23: String Methods

Strings provide extensive manipulation methods for text processing, all returning new strings (immutability).

```csharp
// Example 23: String Methods
string text = "Hello, World!";
                             // => Immutable string (reference type)

string upper = text.ToUpper();
                             // => Creates NEW string in uppercase
                             // => upper is "HELLO, WORLD!"
                             // => Original text unchanged

string lower = text.ToLower();
                             // => lower is "hello, world!"

string substring = text.Substring(0, 5);
                             // => Extract substring: start index 0, length 5
                             // => substring is "Hello"

string replaced = text.Replace("World", "C#");
                             // => Replace substring
                             // => replaced is "Hello, C#!"

string[] parts = text.Split(',');
                             // => Split by delimiter character
                             // => parts is ["Hello", " World!"] (string array)
                             // => Note: space remains in second element

string trimmed = "  spaces  ".Trim();
                             // => Remove leading/trailing whitespace
                             // => trimmed is "spaces"

bool contains = text.Contains("World");
                             // => Check if substring exists
                             // => contains is true

bool starts = text.StartsWith("Hello");
                             // => Check prefix
                             // => starts is true

Console.WriteLine(upper);    // => Outputs: HELLO, WORLD!
Console.WriteLine(substring);// => Outputs: Hello
Console.WriteLine(string.Join("|", parts));
                             // => Join array with separator
                             // => Outputs: Hello| World!
```

**Key Takeaway**: String methods return new strings (immutability). Common operations: ToUpper, ToLower, Substring, Replace, Split, Trim.

**Why It Matters**: Immutable strings prevent bugs from unexpected mutations and enable string interning (memory optimization). For extensive string building, use StringBuilder - repeated concatenation with `+` creates O(n²) temporary objects, while StringBuilder achieves O(n) performance. Applications that build strings in loops (generating reports, constructing SQL, formatting logs) should use StringBuilder or `string.Join` to avoid allocation pressure. `StringComparison.OrdinalIgnoreCase` is preferred for case-insensitive comparisons in performance-sensitive code, avoiding culture-specific comparison overhead in server-side string operations.

## Example 24: String Interpolation

String interpolation provides readable syntax for embedding expressions in strings, replacing String.Format.

```csharp
// Example 24: String Interpolation
string name = "Alice";
int age = 30;
double salary = 75000.50;

string message = $"Name: {name}, Age: {age}";
                             // => $"..." enables interpolation
                             // => {name} embeds variable value
                             // => {age} embeds integer value
                             // => message is "Name: Alice, Age: 30"

string formatted = $"Salary: {salary:C}";
                             // => :C formats as currency
                             // => Uses current culture (e.g., $75,000.50)
                             // => formatted is "Salary: $75,000.50" (US culture)

string precision = $"Pi: {Math.PI:F2}";
                             // => :F2 formats float with 2 decimals
                             // => precision is "Pi: 3.14"

// Expression in interpolation:
string calculation = $"Sum: {2 + 3}";
                             // => Evaluates expression 2 + 3
                             // => calculation is "Sum: 5"

// Multi-line with verbatim strings:
string multiline = $@"Name: {name}
Age: {age}";                 // => @ enables multi-line strings
                             // => Preserves newlines
                             // => Outputs:
                             // => Name: Alice
                             // => Age: 30

Console.WriteLine(message);  // => Outputs: Name: Alice, Age: 30
Console.WriteLine(formatted);// => Outputs: Salary: $75,000.50
Console.WriteLine(precision);// => Outputs: Pi: 3.14
```

**Key Takeaway**: Use `$"..."` for string interpolation. Embed expressions with `{expression}`. Format with `{value:format}` specifiers.

**Why It Matters**: String interpolation improves readability compared to String.Format - expressions appear inline rather than separated as arguments. Compiler generates efficient code equivalent to String.Format, with no performance penalty. For very high-throughput logging scenarios, avoid string interpolation in hot paths where the log level is disabled - use structured logging with `_logger.LogDebug("{Name} processed", name)` to skip string allocation entirely. C# 10+ raw string literals (`"""`) enable multi-line templates without escape sequences, simplifying JSON template generation and HTML email construction.

## Example 25: Value Types vs Reference Types

Understanding value vs reference semantics is critical for C# memory management and mutation behavior.

```csharp
// Example 25: Value Types vs Reference Types

// VALUE TYPE: struct (stack-allocated)
int x = 10;                  // => Value type (int is struct)
                             // => Stored on stack
                             // => Contains actual value 10

int y = x;                   // => COPY: y gets copy of x's value
                             // => y is 10 (independent copy)
                             // => Value types create independent copies on assignment

x = 20;                      // => Modify x
                             // => x is 20, y remains 10 (no connection)
                             // => Demonstrates value type independence

Console.WriteLine($"x={x}, y={y}");
                             // => Outputs: x=20, y=10

// REFERENCE TYPE: class (heap-allocated)
class Point
{
    public int X { get; set; }
    public int Y { get; set; }
}

Point p1 = new Point { X = 10, Y = 20 };
                             // => Reference type (class)
                             // => p1 holds REFERENCE to object on heap
                             // => Object has X=10, Y=20

Point p2 = p1;               // => REFERENCE COPY: p2 references SAME object
                             // => Both p1 and p2 point to same object
                             // => No object copying occurs

p1.X = 30;                   // => Modify through p1
                             // => Changes SHARED object
                             // => Both p1.X and p2.X are 30 (same object)

Console.WriteLine($"p1.X={p1.X}, p2.X={p2.X}");
                             // => Outputs: p1.X=30, p2.X=30

// VALUE TYPE: struct example
struct PointStruct
{
    public int X { get; set; }
    public int Y { get; set; }
}

PointStruct s1 = new PointStruct { X = 10, Y = 20 };
                             // => Value type (struct)
                             // => s1 stores actual data

PointStruct s2 = s1;         // => VALUE COPY: s2 gets copy of s1
                             // => s2 is independent copy

s1.X = 30;                   // => Modify s1
                             // => s1.X=30, s2.X remains 10 (separate copies)

Console.WriteLine($"s1.X={s1.X}, s2.X={s2.X}");
                             // => Outputs: s1.X=30, s2.X=10
```

**Key Takeaway**: Value types (structs, primitives) copy by value. Reference types (classes) copy by reference. Modifying references affects all variables referencing same object.

**Why It Matters**: Reference vs value semantics affects many C# memory bugs. Classes share state (reference types), enabling aliasing bugs where unexpected modifications occur. Structs provide value semantics but have boxing overhead when converted to interfaces or object. Understanding the distinction prevents defensive copying bugs - passing a struct to a method copies it, so mutations inside the method don't affect the caller. Records (`record class`) provide value equality with reference semantics, while `record struct` gives value equality with value semantics, giving developers fine-grained control over equality and copy behavior.

## Example 26: Null Conditional Operator (?.)

The null conditional operator safely accesses members on potentially null references, preventing NullReferenceException.

```csharp
// Example 26: Null Conditional Operator (?.)
string? name = null;         // => Nullable string (can be null)

int? length = name?.Length;  // => ?. operator: null-conditional access
                             // => If name is null: returns null (no exception)
                             // => If name is not null: returns name.Length
                             // => length is null (name is null)

Console.WriteLine(length?.ToString() ?? "null");
                             // => ?. chains with ?? (null-coalescing)
                             // => Outputs: null

name = "Alice";              // => Assign non-null value
length = name?.Length;       // => name is not null
                             // => Returns name.Length (5)
                             // => length is 5 (int? with value)

Console.WriteLine(length);   // => Outputs: 5

// Chaining null conditionals:
class Person
{
    public string? Name { get; set; }
}

Person? person = null;
int? nameLength = person?.Name?.Length;
                             // => First ?. checks person is not null
                             // => If null: short-circuits, returns null
                             // => Second ?. checks Name is not null
                             // => nameLength is null (person is null)

person = new Person { Name = "Bob" };
nameLength = person?.Name?.Length;
                             // => person is not null, Name is "Bob"
                             // => Returns 3 (length of "Bob")
                             // => nameLength is 3

Console.WriteLine(nameLength ?? 0);
                             // => Outputs: 3
```

**Key Takeaway**: Use `?.` for safe member access on nullable references. Returns null if reference is null, preventing exceptions. Chain multiple `?.` operators.

**Why It Matters**: Null conditional operators eliminate many defensive null checks, improving code readability. Combined with nullable reference types (C# 8.0+), they enable null-safe code without verbose if-checks at every member access. Deep object graph navigation (`order?.Customer?.Address?.City`) is common in domain models and API responses. Without null-conditional operators, each level requires a null check, producing deeply nested code. JSON deserialization and database query results commonly produce null values - null-safe navigation prevents NullReferenceExceptions from propagating through business logic layers.

## Example 27: Null Coalescing Operator (??)

The null coalescing operator provides default values when expressions evaluate to null.

```csharp
// Example 27: Null Coalescing Operator (??)
string? name = null;

string displayName = name ?? "Unknown";
                             // => ?? operator: null-coalescing
                             // => If left is null: returns right
                             // => If left is not null: returns left
                             // => displayName is "Unknown" (name is null)

Console.WriteLine(displayName);
                             // => Outputs: Unknown

name = "Alice";
displayName = name ?? "Unknown";
                             // => name is not null ("Alice")
                             // => Returns "Alice"
                             // => displayName is "Alice"

Console.WriteLine(displayName);
                             // => Outputs: Alice

// Chaining null coalescing:
string? first = null;
string? second = null;
string? third = "Default";

string result = first ?? second ?? third ?? "Fallback";
                             // => Evaluates left-to-right
                             // => first is null, tries second
                             // => second is null, tries third
                             // => third is "Default", returns it
                             // => result is "Default"

Console.WriteLine(result);   // => Outputs: Default

// Null coalescing assignment (C# 8.0+):
string? value = null;
value ??= "Initialized";     // => ??= assigns only if left is null
                             // => value is null, assigns "Initialized"
                             // => value is now "Initialized"

value ??= "New Value";       // => value is not null
                             // => No assignment occurs
                             // => value remains "Initialized"

Console.WriteLine(value);    // => Outputs: Initialized
```

**Key Takeaway**: Use `??` to provide defaults for null values. Use `??=` for null-conditional assignment. Both operators short-circuit evaluation.

**Why It Matters**: Null coalescing eliminates ternary operators for null checks (`name != null ? name : "Unknown"`), improving readability. Assignment form (`??=`) enables lazy initialization patterns without temporary variables. The `??=` operator is commonly used for lazy-initialized backing fields: `_cache ??= ComputeCache()` computes the value once and caches it for subsequent accesses. Configuration systems use `??` chaining to implement fallback hierarchies: `explicitValue ?? environmentVariable ?? configFile ?? defaultValue`, resolving settings from most-specific to least-specific source.

## Example 28: Collection Expressions (C# 12.0+)

Collection expressions provide uniform syntax for creating collections, replacing verbose initializer syntax.

```csharp
// Example 28: Collection Expressions (C# 12.0+)

// Arrays:
int[] numbers = [1, 2, 3, 4, 5];
                             // => Collection expression syntax: [elements]
                             // => Creates int array
                             // => numbers is [1, 2, 3, 4, 5]

// Lists:
List<string> names = ["Alice", "Bob", "Charlie"];
                             // => Creates List<string>
                             // => names is ["Alice", "Bob", "Charlie"]

// Spread operator (..)
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second];
                             // => .. spreads collection elements
                             // => combined is [1, 2, 3, 4, 5, 6]

// Mixed expressions:
int[] mixed = [0, ..first, 7, 8, ..second, 9];
                             // => Combine literals and spreads
                             // => mixed is [0, 1, 2, 3, 7, 8, 4, 5, 6, 9]

Console.WriteLine(string.Join(", ", numbers));
                             // => Outputs: 1, 2, 3, 4, 5
Console.WriteLine(string.Join(", ", names));
                             // => Outputs: Alice, Bob, Charlie
Console.WriteLine(string.Join(", ", combined));
                             // => Outputs: 1, 2, 3, 4, 5, 6
```

**Key Takeaway**: Collection expressions use `[elements]` syntax. Spread operator `..` expands collections inline. Works with arrays, lists, and other collection types.

**Why It Matters**: Collection expressions reduce initialization boilerplate and provide consistent syntax across collection types. Spread operator eliminates manual concatenation loops, improving readability while maintaining performance (compiler optimizes to efficient array operations). Consistent collection initialization syntax reduces cognitive switching between array, list, span, and immutable collection literals. Test code benefits from concise collection initialization when constructing expected values. The compiler chooses optimal implementation depending on target type - `ImmutableArray<T>` initialization uses different code than `List<T>` initialization, but both use the same syntax.

## Example 29: Primary Constructors (C# 12.0+)

Primary constructors define constructor parameters inline with class declarations, reducing boilerplate.

```csharp
// Example 29: Primary Constructors (C# 12.0+)
class Person(string name, int age)
{                            // => Primary constructor parameters: name, age
                             // => Parameters available throughout class body
                             // => No explicit constructor block needed

    public string Name { get; } = name;
                             // => Initialize property from parameter
                             // => Name is read-only (no setter)
                             // => Captured from primary constructor

    public int Age { get; } = age;
                             // => Age initialized from parameter
                             // => Read-only property

    public void PrintInfo()  // => Method can access parameters
    {                        // => Primary constructor params in scope
        Console.WriteLine($"{name} is {age} years old");
                             // => Directly use primary constructor parameters
                             // => No need for fields
    }
}

Person alice = new Person("Alice", 30);
                             // => Create instance with primary constructor
                             // => Passes "Alice" for name, 30 for age
                             // => alice.Name="Alice", alice.Age=30

alice.PrintInfo();           // => Calls method
                             // => Outputs: Alice is 30 years old

Console.WriteLine($"{alice.Name}, {alice.Age}");
                             // => Outputs: Alice, 30

// Combining with base class:
class Employee(string name, int age, string department)
    : Person(name, age)      // => Call base primary constructor with forwarding
{                            // => Additional parameter: department
                             // => Inherits Name and Age from Person
    public string Department { get; } = department;
                             // => Initialize Department from parameter
}

Employee bob = new Employee("Bob", 25, "Engineering");
                             // => Calls Employee primary constructor
                             // => Forwards name/age to Person constructor
                             // => bob.Name="Bob", bob.Age=25, bob.Department="Engineering"

bob.PrintInfo();             // => Inherited from Person
                             // => Outputs: Bob is 25 years old
Console.WriteLine(bob.Department);
                             // => Outputs: Engineering
```

**Key Takeaway**: Primary constructors use `class Name(params)` syntax. Parameters available throughout class. Reduces property initialization boilerplate.

**Why It Matters**: Primary constructors eliminate repetitive constructor code (parameter-to-field assignments). They encourage immutability patterns by defaulting to readonly properties, improving code safety without sacrificing readability. In dependency injection scenarios, services typically receive multiple dependencies through constructors - primary constructors reduce this boilerplate significantly. However, primary constructor parameters are captured as private fields accessible throughout the class, which may surprise developers accustomed to traditional constructors. For simple data classes, primary constructors combined with `record` syntax provide the most concise representation.

## Example 30: Record Types

Records provide value-based equality, immutability by default, and concise syntax for data modeling.

```csharp
// Example 30: Record Types
record Person(string Name, int Age);
                             // => Record with positional parameters
                             // => Generates: properties, constructor, equality, ToString
                             // => Properties are init-only (immutable after construction)

Person alice = new Person("Alice", 30);
                             // => Create record instance
                             // => alice.Name="Alice", alice.Age=30

Person bob = new Person("Bob", 25);

// Value-based equality:
Person alice2 = new Person("Alice", 30);
                             // => Different object, SAME values

bool areEqual = alice == alice2;
                             // => == compares VALUES (not references)
                             // => Both have Name="Alice", Age=30
                             // => areEqual is true (value equality)

Console.WriteLine(areEqual); // => Outputs: True

// With-expressions (non-destructive mutation):
Person alice31 = alice with { Age = 31 };
                             // => Creates NEW record copying alice
                             // => Updates Age to 31
                             // => alice unchanged (immutable)
                             // => alice31 has Name="Alice", Age=31

Console.WriteLine($"alice: {alice.Age}, alice31: {alice31.Age}");
                             // => Outputs: alice: 30, alice31: 31

// ToString override:
Console.WriteLine(alice);    // => Automatic ToString implementation
                             // => Outputs: Person { Name = Alice, Age = 30 }

// Deconstruction:
var (name, age) = alice;     // => Deconstruct record to tuple
                             // => name is "Alice", age is 30

Console.WriteLine($"{name}, {age}");
                             // => Outputs: Alice, 30
```

**Key Takeaway**: Records use `record Name(params)` syntax. Provide value equality, immutability, and with-expressions for copying. Ideal for data transfer objects.

**Why It Matters**: Records eliminate substantial boilerplate for data classes - no manual Equals, GetHashCode, ToString, or copy methods needed. Value equality makes records ideal for DTOs, API models, and domain entities, enabling easier testing (deep equality) and functional programming patterns (immutability). The `with` expression enables non-destructive mutation - creating modified copies without changing the original, essential for event sourcing and Redux-style state management patterns. Records also work with pattern matching deconstructors, enabling clean `switch` expressions over domain data.

---

## Next Steps

Continue to **Intermediate** (Examples 31-60) to learn:

- Async/await for asynchronous programming
- Generics and generic constraints
- Interfaces and polymorphism
- LINQ advanced operations (GroupBy, Join, Aggregate)
- Extension methods
- Pattern matching (type patterns, property patterns)
- Delegates and events
- File I/O and serialization

These 30 beginner examples cover **0-40% of C#'s features**, establishing the imperative and object-oriented foundation. The remaining 60% (intermediate and advanced) builds on these fundamentals with async patterns, generics, and advanced type system features.
