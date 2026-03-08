---
title: "Beginner"
date: 2026-02-07T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-30: TypeScript fundamentals covering basic types, functions, interfaces, classes, union types, literal types, type guards, and type assertions (0-40% coverage)"
tags: ["typescript", "tutorial", "by-example", "beginner", "types", "functions", "interfaces", "classes"]
---

## Example 1: Basic Types and Type Annotations

TypeScript is a statically-typed superset of JavaScript that adds compile-time type checking. You write types as annotations that the compiler verifies before generating JavaScript.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["TypeScript Code<br/>.ts files"] --> B["TypeScript Compiler<br/>(tsc)"]
    B --> C["JavaScript Code<br/>.js files"]
    C --> D["Runtime<br/>(Node.js/Browser)"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```typescript
// PRIMITIVE TYPES
let age: number = 25; // => age = 25 (type: number)
let name: string = "Alice"; // => name = "Alice" (type: string)
let isActive: boolean = true; // => isActive = true (type: boolean)
let value: null = null; // => value = null (type: null)
let notDefined: undefined = undefined; // => notDefined = undefined (type: undefined)

console.log(age, name, isActive); // => Output: 25 Alice true

// TYPE INFERENCE
let inferredNumber = 42; // => inferredNumber = 42 (type: number, inferred)
// => TypeScript infers type from initial value
let inferredString = "TypeScript"; // => inferredString = "TypeScript" (type: string, inferred)

// TYPE ANNOTATIONS OVERRIDE INFERENCE
let explicit: number = 100; // => explicit = 100 (type: number, explicit)
// => Annotation required for uninitialized variables

// Arrays
let numbers: number[] = [1, 2, 3]; // => numbers = [1, 2, 3] (type: number[])
let strings: Array<string> = ["a", "b"]; // => strings = ["a", "b"] (generic array syntax)

console.log(numbers[0]); // => Output: 1
```

**Key Takeaway**: TypeScript adds type annotations (`: type`) to JavaScript variables. The compiler infers types when possible but allows explicit annotations for clarity or when inference isn't available.

**Why It Matters**: Type annotations catch errors at compile time rather than runtime. The compile-time checking means fewer bugs reach production. In large teams, annotations serve as living documentation—developers reading unfamiliar code can instantly understand what values a function accepts and returns without running it. IDEs provide precise autocompletion, inline error highlighting, and safe refactoring only when types are explicit, reducing debugging sessions significantly.

## Example 2: Functions and Parameter Types

TypeScript functions can have typed parameters and return values. Arrow functions and traditional function syntax both support type annotations.

**Code**:

```typescript
// FUNCTION WITH TYPED PARAMETERS AND RETURN TYPE
function add(a: number, b: number): number {
  // => Parameters: a, b (both number)
  // => Return type: number (explicit)
  return a + b; // => Returns sum (must be number)
}

let result = add(5, 3); // => result = 8 (type: number, inferred from return)
console.log(result); // => Output: 8

// ARROW FUNCTION WITH TYPES
const multiply = (x: number, y: number): number => {
  // => Arrow function syntax
  // => Same type annotations as regular function
  return x * y; // => Returns product
};

let product = multiply(4, 7); // => product = 28
console.log(product); // => Output: 28

// OPTIONAL PARAMETERS
function greet(name: string, greeting?: string): string {
  // => greeting is optional (?: syntax)
  // => Optional params are type | undefined
  if (greeting) {
    // => Check if greeting provided
    return `${greeting}, ${name}!`; // => greeting = "Hello", returns "Hello, Alice!"
  }
  return `Hi, ${name}!`; // => Default greeting when no arg
}

console.log(greet("Alice", "Hello")); // => Output: Hello, Alice!
console.log(greet("Bob")); // => Output: Hi, Bob! (greeting undefined)

// DEFAULT PARAMETERS
function createUser(name: string, role: string = "user"): string {
  // => role defaults to "user"
  // => Default value sets type implicitly
  return `${name} (${role})`; // => Template literal concatenation
}

console.log(createUser("Charlie")); // => Output: Charlie (user)
console.log(createUser("Diana", "admin")); // => Output: Diana (admin)
```

**Key Takeaway**: Use `: type` after parameters and before function body for return types. Optional parameters use `?:` syntax, and default parameters provide values when arguments are omitted.

**Why It Matters**: Typed function signatures prevent entire categories of bugs common in JavaScript—calling functions with wrong argument counts, passing wrong types, or assuming return values that don't exist. Typed props prevent passing invalid data to components. Typed request handlers catch invalid request parsing before deployment. TypeScript's function overloads enable defining multiple call signatures for flexible APIs while maintaining type safety.

## Example 3: Interfaces for Object Shapes

Interfaces define the structure of objects—required properties, optional properties, and methods. They're TypeScript's primary tool for describing object contracts.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Interface Definition"] --> B["Required Properties"]
    A --> C["Optional Properties"]
    A --> D["Methods"]

    B --> E["Compile-Time Check"]
    C --> E
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

**Code**:

```typescript
// INTERFACE DEFINITION
interface User {
  // => Interface defines object shape
  id: number; // => Required property (must exist)
  name: string; // => Required property
  email?: string; // => Optional property (?: syntax)
  isActive: boolean; // => Required property
}

// OBJECT CONFORMING TO INTERFACE
const user1: User = {
  // => Object must match User interface
  id: 1, // => id provided (required)
  name: "Alice", // => name provided (required)
  email: "alice@example.com", // => email provided (optional)
  isActive: true, // => isActive provided (required)
}; // => All required props present, compiles successfully

console.log(user1.name); // => Output: Alice

// OMITTING OPTIONAL PROPERTY
const user2: User = {
  // => email omitted (allowed because optional)
  id: 2, // => id provided
  name: "Bob", // => name provided
  isActive: false, // => isActive provided
}; // => Compiles: optional props can be omitted

console.log(user2.email); // => Output: undefined (optional prop omitted)

// INTERFACE WITH METHODS
interface Calculator {
  // => Interface can include methods
  add(a: number, b: number): number; // => Method signature (not implementation)
  subtract(a: number, b: number): number;
}

const calc: Calculator = {
  // => Object implementing Calculator interface
  add(a, b) {
    // => Method implementation
    return a + b; // => Must return number (matches signature)
  },
  subtract(a, b) {
    // => Second method implementation
    return a - b; // => Must return number
  },
};

console.log(calc.add(10, 5)); // => Output: 15
```

**Key Takeaway**: Interfaces define object contracts with required properties, optional properties (using `?:`), and method signatures. Objects must match the interface structure to satisfy the type.

**Why It Matters**: Interfaces enable structural typing—objects are validated by shape, not inheritance. This powers TypeScript's "duck typing" philosophy: if it walks like a User and talks like a User, it's a User. Component props can be interfaces defining expected data shapes. Request/Response types can be interfaces ensuring middleware receives correct objects. Teams use interfaces as contracts between modules, catching integration bugs at compile time rather than runtime.

## Example 4: Type Aliases and Union Types

Type aliases create reusable type definitions. Union types (`|`) allow values to be one of several types, enabling flexible yet type-safe APIs.

**Code**:

```typescript
// TYPE ALIAS FOR PRIMITIVE
type ID = number | string; // => ID can be number OR string (union type)
// => Type alias creates reusable type name

let userId: ID = 123; // => userId = 123 (number, matches ID)
let productId: ID = "prod-456"; // => productId = "prod-456" (string, matches ID)

console.log(userId, productId); // => Output: 123 prod-456

// TYPE ALIAS FOR OBJECT
type Point = {
  // => Type alias for object shape
  x: number; // => Required property
  y: number; // => Required property
};

const origin: Point = { x: 0, y: 0 }; // => origin matches Point type
console.log(origin); // => Output: { x: 0, y: 0 }

// UNION TYPE FOR FUNCTION PARAMETERS
function printId(id: number | string): void {
  // => id can be number OR string
  // => Return type: void (no return value)
  if (typeof id === "string") {
    // => Type guard: narrows id to string
    // => Inside this block, id is string
    console.log(`String ID: ${id.toUpperCase()}`); // => toUpperCase available (string method)
    // => Output: String ID: PROD-456
  } else {
    // => Type guard: narrows id to number
    console.log(`Number ID: ${id}`); // => id is number here
    // => Output: Number ID: 123
  }
}

printId(123); // => Calls with number
printId("prod-456"); // => Calls with string

// UNION TYPE WITH LITERAL TYPES
type Status = "pending" | "approved" | "rejected"; // => Literal type union (specific strings)
// => Only these 3 values allowed

let orderStatus: Status = "pending"; // => orderStatus = "pending" (matches literal)
console.log(orderStatus); // => Output: pending

// This would be a compile error:
// orderStatus = "unknown";              // => ERROR: "unknown" not in Status union
```

**Key Takeaway**: Type aliases (`type Name = ...`) create reusable type definitions. Union types (`A | B`) allow values to be one of several types. Use `typeof` checks to narrow union types to specific branches.

**Why It Matters**: Union types enable flexible APIs while maintaining type safety. Actions can use union types to represent different shapes. API responses can use `Success | Error` unions for result types. Code generators can create union types for schema variations. This pattern eliminates defensive programming—instead of checking `if (response.error)` everywhere, TypeScript enforces handling all cases. The type system guides you through every code path, preventing forgotten edge cases that cause bugs.

## Example 5: Arrays and Tuples

Arrays hold multiple values of the same type. Tuples are fixed-length arrays where each position has a specific type, useful for returning multiple values.

**Code**:

```typescript
// ARRAY OF NUMBERS
let numbers: number[] = [1, 2, 3, 4, 5]; // => numbers = [1, 2, 3, 4, 5] (type: number[])
// => All elements must be numbers

numbers.push(6); // => Appends 6 to end
// => numbers = [1, 2, 3, 4, 5, 6]
console.log(numbers); // => Output: [1, 2, 3, 4, 5, 6]

// GENERIC ARRAY SYNTAX
let strings: Array<string> = ["a", "b", "c"]; // => Alternative syntax (Array<T>)
// => Equivalent to string[]

console.log(strings[0]); // => Output: a

// TUPLE - FIXED LENGTH WITH SPECIFIC TYPES
let person: [string, number] = ["Alice", 30]; // => Tuple: [string, number]
// => Position 0 must be string, position 1 must be number

console.log(person[0]); // => Output: Alice (string)
console.log(person[1]); // => Output: 30 (number)

// TUPLE DESTRUCTURING
let [name, age] = person; // => Destructures tuple into variables
// => name = "Alice" (string), age = 30 (number)

console.log(name, age); // => Output: Alice 30

// TUPLE FOR FUNCTION RETURN
function getCoordinates(): [number, number] {
  // => Returns tuple [number, number]
  return [10, 20]; // => Returns [10, 20]
}

let [x, y] = getCoordinates(); // => Destructures into x, y
// => x = 10, y = 20
console.log(x, y); // => Output: 10 20

// ARRAY OF OBJECTS
interface Product {
  id: number;
  name: string;
}

let products: Product[] = [
  // => Array of Product interfaces
  { id: 1, name: "Laptop" }, // => Each element must match Product shape
  { id: 2, name: "Mouse" },
];

console.log(products[0].name); // => Output: Laptop
```

**Key Takeaway**: Arrays hold multiple values of one type (`type[]` or `Array<type>`). Tuples are fixed-length arrays with specific types per position (`[type1, type2]`), useful for multi-value returns.

**Why It Matters**: Tuples solve JavaScript's multi-value return problem without creating wrapper objects. Hooks can return tuples for state management. Coordinate systems return `[x, y]` tuples. Database queries can return `[error, result]` tuples. This pattern is more efficient than objects for simple multi-value returns and enables positional destructuring. Array typing prevents mixing incompatible types—no more `[1, "two", true]` causing runtime errors.

## Example 6: Enums for Named Constants

Enums define a set of named constants. Numeric enums auto-increment, string enums require explicit values. They improve code readability by replacing magic numbers/strings.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Enum Declaration"] --> B["Numeric Enum<br/>(0, 1, 2...)"]
    A --> C["String Enum<br/>(explicit values)"]

    B --> D["Runtime Object"]
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```typescript
// NUMERIC ENUM
enum Direction {
  // => Numeric enum (default)
  Up, // => Up = 0 (auto-assigned)
  Down, // => Down = 1 (auto-increments)
  Left, // => Left = 2
  Right, // => Right = 3
}

let move: Direction = Direction.Up; // => move = 0 (Direction.Up)
console.log(move); // => Output: 0

// REVERSE MAPPING
console.log(Direction[0]); // => Output: Up (reverse lookup: number -> name)
// => Numeric enums support bidirectional mapping

// ENUM WITH CUSTOM START VALUE
enum Status {
  // => Custom starting value
  Pending = 1, // => Pending = 1 (explicit)
  Approved, // => Approved = 2 (auto-increments)
  Rejected, // => Rejected = 3
}

console.log(Status.Approved); // => Output: 2

// STRING ENUM
enum LogLevel {
  // => String enum (no auto-increment)
  Error = "ERROR", // => Error = "ERROR" (explicit value required)
  Warning = "WARNING", // => Warning = "WARNING"
  Info = "INFO", // => Info = "INFO"
  Debug = "DEBUG", // => Debug = "DEBUG"
}

function log(level: LogLevel, message: string): void {
  // => level must be LogLevel enum
  console.log(`[${level}] ${message}`); // => Template literal with enum value
}

log(LogLevel.Error, "Database connection failed"); // => Output: [ERROR] Database connection failed
log(LogLevel.Info, "Server started"); // => Output: [INFO] Server started

// CONST ENUM (COMPILE-TIME ONLY)
const enum Color {
  // => const enum (no runtime object)
  Red = "RED", // => Values inlined at compile time
  Green = "GREEN",
  Blue = "BLUE",
}

let favorite: Color = Color.Blue; // => Compiles to: let favorite = "BLUE"
// => No runtime Color object created
console.log(favorite); // => Output: BLUE
```

**Key Takeaway**: Numeric enums auto-increment from 0 (or custom start). String enums require explicit values. Use enums to replace magic numbers/strings with named constants for better readability.

**Why It Matters**: Enums prevent typos in string literals that cause runtime bugs. API status codes can become `HttpStatus.OK` instead of `200`. Action types can become `ActionType.FETCH_USER` instead of `"FETCH_USER"`. Connection states can become `ConnectionState.Connected` instead of magic numbers. The compiler catches invalid enum values at build time. String enums are often preferred over numeric enums because they're more debuggable—seeing `"ERROR"` in logs is clearer than `0`.

## Example 7: Type Assertions and Type Casting

Type assertions tell the compiler to treat a value as a specific type when you know more than TypeScript can infer. Use sparingly as they bypass type checking.

**Code**:

```typescript
// TYPE ASSERTION WITH 'as' SYNTAX
let value: any = "Hello, TypeScript"; // => value has type 'any' (no type checking)
// => any type disables type safety

let length: number = (value as string).length; // => Asserts value is string
// => TypeScript allows .length access
// => length = 17 (string length)

console.log(length); // => Output: 17

// ANGLE BRACKET SYNTAX (ALTERNATIVE)
let length2: number = (<string>value).length; // => Alternative syntax (not in JSX)
// => Equivalent to 'as string'
// => Avoid in React (.tsx files)

console.log(length2); // => Output: 17

// TYPE ASSERTION WITH DOM ELEMENTS
const input = document.getElementById("username"); // => Returns HTMLElement | null
// => Generic element type

if (input) {
  // => Null check required
  // Type assertion to specific element type
  const inputElement = input as HTMLInputElement; // => Assert it's HTMLInputElement
  // => Enables access to .value property

  inputElement.value = "Alice"; // => Sets input value
  // => .value only exists on HTMLInputElement

  console.log(inputElement.value); // => Output: Alice
}

// NON-NULL ASSERTION OPERATOR
function getValue(): string | null {
  // => May return null
  return "data"; // => Returns "data" (not null)
}

let result = getValue(); // => result type: string | null
let upperCase = result!.toUpperCase(); // => ! asserts result is not null
// => Dangerous: runtime error if actually null
// => upperCase = "DATA"

console.log(upperCase); // => Output: DATA

// CONST ASSERTION
let point = { x: 10, y: 20 } as const; // => 'as const' makes object readonly
// => point type: { readonly x: 10; readonly y: 20 }
// => Properties become literal types

console.log(point.x); // => Output: 10
// point.x = 15;                         // => ERROR: Cannot assign to readonly property
```

**Key Takeaway**: Type assertions (`as Type` or `<Type>`) tell TypeScript to treat a value as a specific type. Use `!` to assert non-null values. Use `as const` for readonly objects with literal types.

**Why It Matters**: Type assertions are necessary when working with DOM APIs (TypeScript can't know `getElementById` returns HTMLInputElement), external libraries without types, or migrating JavaScript to TypeScript. However, they're dangerous—they bypass type checking and can cause runtime errors if wrong. Minimize assertions through better typing (generics, type guards, proper interfaces). The non-null assertion `!` is particularly risky and should be avoided unless you're certain the value exists.

## Example 8: Classes and Constructors

TypeScript classes add access modifiers (public, private, protected), typed properties, and constructor parameter properties to JavaScript classes.

**Code**:

```typescript
// CLASS WITH TYPED PROPERTIES
class Person {
  // => Class definition
  name: string; // => Public property (default)
  private age: number; // => Private property (only accessible in class)
  protected email: string; // => Protected property (accessible in subclasses)

  constructor(name: string, age: number, email: string) {
    // => Constructor with typed params
    this.name = name; // => Initialize name property
    this.age = age; // => Initialize private age
    this.email = email; // => Initialize protected email
  }

  getAge(): number {
    // => Public method returning number
    return this.age; // => Access private property within class
  }

  introduce(): void {
    // => Method with no return value
    console.log(`Hi, I'm ${this.name}, ${this.age} years old`);
  }
}

const person = new Person("Alice", 30, "alice@example.com"); // => Create instance
// => Calls constructor
person.introduce(); // => Output: Hi, I'm Alice, 30 years old

console.log(person.name); // => Output: Alice (public property accessible)
// console.log(person.age);              // => ERROR: age is private
console.log(person.getAge()); // => Output: 30 (access via public method)

// CONSTRUCTOR PARAMETER PROPERTIES
class User {
  // => Shorthand syntax
  constructor(
    public id: number, // => public modifier creates + initializes property
    public username: string, // => Equivalent to: this.username = username
    private password: string, // => private property created automatically
  ) {} // => Empty body (initialization handled by modifiers)
}

const user = new User(1, "alice", "secret123"); // => Creates User instance
console.log(user.id, user.username); // => Output: 1 alice
// console.log(user.password);           // => ERROR: password is private

// CLASS WITH STATIC MEMBERS
class MathHelper {
  // => Utility class
  static PI: number = 3.14159; // => Static property (shared across instances)

  static square(x: number): number {
    // => Static method (called on class, not instance)
    return x * x; // => Returns x squared
  }
}

console.log(MathHelper.PI); // => Output: 3.14159 (access via class name)
console.log(MathHelper.square(5)); // => Output: 25 (call via class name)
```

**Key Takeaway**: Classes support typed properties, access modifiers (public, private, protected), and constructor parameter properties for concise initialization. Use `static` for class-level members shared across instances.

**Why It Matters**: TypeScript's class system bridges object-oriented programming and JavaScript. Frameworks can use classes for components and services. Classes work with decorators for controllers and providers. The access modifiers enforce encapsulation—private properties can't leak outside the class, preventing accidental mutation. Constructor parameter properties reduce boilerplate compared to traditional OOP languages. This makes TypeScript classes more productive while maintaining OOP principles.

## Example 9: Inheritance and Method Overriding

Classes can extend other classes to inherit properties and methods. Subclasses can override parent methods while maintaining type safety.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Base Class<br/>Animal"] --> B["Derived Class<br/>Dog"]
    A --> C["Derived Class<br/>Cat"]

    B --> D["Inherits Properties<br/>& Methods"]
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```typescript
// BASE CLASS
class Animal {
  // => Parent class
  constructor(public name: string) {} // => Public property via constructor param

  makeSound(): void {
    // => Method to override in subclasses
    console.log("Some generic sound");
  }

  move(): void {
    // => Method inherited by all subclasses
    console.log(`${this.name} is moving`);
  }
}

// DERIVED CLASS
class Dog extends Animal {
  // => Dog inherits from Animal
  // => Gets name property and move() method

  constructor(
    name: string,
    public breed: string,
  ) {
    // => Additional property
    super(name); // => Call parent constructor
    // => MUST call super() before using 'this'
  }

  makeSound(): void {
    // => Override parent method
    console.log("Woof! Woof!"); // => Dog-specific implementation
  }

  fetch(): void {
    // => Dog-specific method
    console.log(`${this.name} is fetching`);
  }
}

const dog = new Dog("Buddy", "Golden Retriever"); // => Create Dog instance
dog.makeSound(); // => Output: Woof! Woof! (overridden method)
dog.move(); // => Output: Buddy is moving (inherited method)
dog.fetch(); // => Output: Buddy is fetching (Dog method)

// ANOTHER DERIVED CLASS
class Cat extends Animal {
  // => Cat also inherits from Animal
  makeSound(): void {
    // => Override with Cat implementation
    console.log("Meow!");
  }
}

const cat = new Cat("Whiskers"); // => Create Cat instance
cat.makeSound(); // => Output: Meow! (Cat's override)
cat.move(); // => Output: Whiskers is moving (inherited)

// POLYMORPHISM
const animals: Animal[] = [dog, cat]; // => Array of Animal (base type)
// => Can hold Dog and Cat instances

animals.forEach((animal) => {
  // => Iterate over animals
  animal.makeSound(); // => Calls appropriate override
}); // => Output: Woof! Woof!
// => Output: Meow!
```

**Key Takeaway**: Use `extends` to inherit from a base class. Call `super()` in the constructor before accessing `this`. Override methods by redefining them in the subclass. Polymorphism allows treating subclasses as base class instances.

**Why It Matters**: Inheritance enables code reuse and polymorphic designs. Class components can extend base components. Middleware classes can extend base middleware. ORM models can extend base model classes. However, TypeScript and modern JavaScript increasingly favor composition over inheritance—interfaces and mixins provide more flexibility than deep inheritance hierarchies. Prefer shallow inheritance (1-2 levels) over deep chains that become brittle.

## Example 10: Abstract Classes

Abstract classes define partial implementations that subclasses must complete. They cannot be instantiated directly and use `abstract` methods as contracts.

**Code**:

```typescript
// ABSTRACT CLASS
abstract class Shape {
  // => Cannot instantiate directly
  // => new Shape() would be ERROR

  constructor(public color: string) {} // => Constructor available to subclasses

  abstract area(): number; // => Abstract method (no implementation)
  // => Subclasses MUST implement this

  describe(): void {
    // => Concrete method (has implementation)
    console.log(`A ${this.color} shape with area ${this.area()}`);
    // => Calls abstract area() method
  }
}

// CONCRETE SUBCLASS
class Circle extends Shape {
  // => Must implement all abstract methods
  constructor(
    color: string,
    public radius: number,
  ) {
    super(color); // => Call parent constructor
  }

  area(): number {
    // => Implement required abstract method
    return Math.PI * this.radius ** 2; // => Returns circle area
  }
}

class Rectangle extends Shape {
  // => Another concrete subclass
  constructor(
    color: string,
    public width: number,
    public height: number,
  ) {
    super(color);
  }

  area(): number {
    // => Implement required abstract method
    return this.width * this.height; // => Returns rectangle area
  }
}

const circle = new Circle("red", 5); // => Create Circle instance
console.log(circle.area()); // => Output: 78.53981633974483
circle.describe(); // => Output: A red shape with area 78.53981633974483

const rectangle = new Rectangle("blue", 10, 20); // => Create Rectangle instance
console.log(rectangle.area()); // => Output: 200
rectangle.describe(); // => Output: A blue shape with area 200

// ARRAY OF ABSTRACT TYPE
const shapes: Shape[] = [circle, rectangle]; // => Array of abstract type
// => Holds concrete subclass instances

shapes.forEach((shape) => {
  // => Polymorphic iteration
  shape.describe(); // => Calls describe() on each shape
}); // => Output: A red shape with area 78.53...
// => Output: A blue shape with area 200
```

**Key Takeaway**: Abstract classes use `abstract` keyword and cannot be instantiated. Abstract methods have no implementation and must be implemented by concrete subclasses. Mix abstract and concrete methods for partial implementation.

**Why It Matters**: Abstract classes enforce contracts across subclasses while providing shared implementation. Unlike interfaces (which only define structure), abstract classes can include working code that subclasses inherit. ORM frameworks use abstract `Model` classes with concrete `save()` methods and abstract `validate()` methods. Game engines use abstract `GameObject` with concrete `update()` and abstract `render()`. However, many TypeScript developers prefer interfaces over abstract classes because interfaces support multiple inheritance and are more flexible.

## Example 11: Literal Types and Type Narrowing

Literal types restrict values to specific literals. Type narrowing uses control flow to refine union types to more specific types.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["string | number | boolean"] -->|"typeof x === 'string'"| B["string"]
    A -->|"typeof x === 'number'"| C["number"]
    A -->|"typeof x === 'boolean'"| D["boolean"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Union Type: string | number | boolean"] -->|"typeof x === 'string'"| B["Narrowed: string"]
    A -->|"typeof x === 'number'"| C["Narrowed: number"]
    A -->|"typeof x === 'boolean'"| D["Narrowed: boolean"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
```

**Code**:

```typescript
// STRING LITERAL TYPE
type Direction = "north" | "south" | "east" | "west"; // => Only these 4 values allowed

function move(direction: Direction): void {
  // => Parameter must be one of 4 literals
  console.log(`Moving ${direction}`);
}

move("north"); // => Output: Moving north
// move("up");                           // => ERROR: "up" not in Direction type

// NUMERIC LITERAL TYPE
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6; // => Only integers 1-6 allowed

function rollDice(): DiceRoll {
  // => Must return 1-6
  return (Math.floor(Math.random() * 6) + 1) as DiceRoll; // => Type assertion needed
  // => Math.random() not typed as DiceRoll
}

console.log(rollDice()); // => Output: (random 1-6)

// TYPE NARROWING WITH typeof
function printValue(value: string | number): void {
  // => Union type parameter
  if (typeof value === "string") {
    // => Type guard: narrows to string
    console.log(value.toUpperCase()); // => value is string here
    // => toUpperCase() available
  } else {
    // => Type guard: narrows to number
    console.log(value.toFixed(2)); // => value is number here
    // => toFixed() available
  }
}

printValue("hello"); // => Output: HELLO
printValue(42.567); // => Output: 42.57

// TYPE NARROWING WITH instanceof
class Dog {
  bark(): void {
    console.log("Woof!");
  }
}

class Cat {
  meow(): void {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat): void {
  // => Union of class types
  if (animal instanceof Dog) {
    // => instanceof narrows to Dog
    animal.bark(); // => bark() available (Dog method)
  } else {
    // => Must be Cat (exhaustive check)
    animal.meow(); // => meow() available (Cat method)
  }
}

makeSound(new Dog()); // => Output: Woof!
makeSound(new Cat()); // => Output: Meow!

// TYPE NARROWING WITH 'in' OPERATOR
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function move2(animal: Bird | Fish): void {
  // => Both have layEggs, different movement
  if ("fly" in animal) {
    // => Check if 'fly' property exists
    // => Narrows to Bird
    animal.fly(); // => fly() available (Bird method)
  } else {
    // => Must be Fish
    animal.swim(); // => swim() available (Fish method)
  }
}
```

**Key Takeaway**: Literal types restrict variables to specific values. Type narrowing uses `typeof`, `instanceof`, and `in` checks to refine union types. TypeScript's control flow analysis automatically narrows types based on conditional checks.

**Why It Matters**: Literal types create compile-time enums without runtime overhead. Action types can use literal unions: `type Action = { type: "INCREMENT" } | { type: "DECREMENT" }`. HTTP methods use literals: `type Method = "GET" | "POST" | "PUT" | "DELETE"`. Type narrowing eliminates defensive programming—no need for runtime type checks when TypeScript proves types statically. This pattern is fundamental to discriminated unions in advanced TypeScript.

## Example 12: Intersection Types

Intersection types (`&`) combine multiple types into one. A value must satisfy all combined types simultaneously.

**Code**:

```typescript
// INTERSECTION OF INTERFACES
interface Loggable {
  // => Interface with logging capability
  log(): void;
}

interface Serializable {
  // => Interface with serialization
  serialize(): string;
}

type LoggableSerializable = Loggable & Serializable; // => Combines both interfaces
// => Must have log() AND serialize()

class User implements LoggableSerializable {
  // => Class must implement both
  constructor(
    public name: string,
    public email: string,
  ) {}

  log(): void {
    // => Implement Loggable.log()
    console.log(`User: ${this.name}`);
  }

  serialize(): string {
    // => Implement Serializable.serialize()
    return JSON.stringify({ name: this.name, email: this.email });
  }
}

const user = new User("Alice", "alice@example.com");
user.log(); // => Output: User: Alice
console.log(user.serialize()); // => Output: {"name":"Alice","email":"alice@example.com"}

// INTERSECTION OF TYPE ALIASES
type Point2D = { x: number; y: number }; // => 2D coordinates
type Label = { label: string }; // => Label property

type LabeledPoint = Point2D & Label; // => Combines both types
// => Must have x, y, AND label

const point: LabeledPoint = {
  // => Object satisfies intersection
  x: 10, // => From Point2D
  y: 20, // => From Point2D
  label: "Origin", // => From Label
};

console.log(point); // => Output: { x: 10, y: 20, label: 'Origin' }

// INTERSECTION WITH FUNCTION TYPES
type Logger = () => void; // => Function type (no params, void return)
type Formatter = (text: string) => string; // => Function type with params

type LoggerFormatter = Logger & Formatter; // => Intersection of function types
// => Function must match BOTH signatures
// => Practically impossible (conflicting signatures)

// PRACTICAL INTERSECTION - EXTENDING TYPES
type Entity = {
  // => Base entity type
  id: number;
  createdAt: Date;
};

type Nameable = {
  // => Adds name property
  name: string;
};

type User2 = Entity & Nameable; // => Combines Entity + Nameable
// => Has id, createdAt, AND name

const user2: User2 = {
  // => Object satisfies User2
  id: 1, // => From Entity
  createdAt: new Date(), // => From Entity
  name: "Bob", // => From Nameable
};

console.log(user2.name); // => Output: Bob
```

**Key Takeaway**: Intersection types (`A & B`) combine multiple types—the result must satisfy all types simultaneously. Use intersections to extend types with additional properties or combine mixins.

**Why It Matters**: Intersection types enable mixin patterns without inheritance. Higher-Order Components can use intersections to add props: `type EnhancedProps = BaseProps & WithAuth`. Connected components can combine `OwnProps & StateProps & DispatchProps`. Utility type composition uses intersections: `type ReadonlyPartial<T> = Readonly<T> & Partial<T>`. Unlike union types (which are "either/or"), intersections are "both/and", enabling flexible type composition.

## Example 13: Type Guards with User-Defined Functions

Custom type guard functions use `is` keyword to narrow types. They return booleans that TypeScript uses for control flow narrowing.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["value: Cat | Dog"] -->|"isCat(value) === true"| B["Cat
.meow() available"]
    A -->|"isDog(value) === true"| C["Dog
.bark() available"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["value: Cat | Dog"] -->|"isCat(value) === true"| B["Narrowed: Cat
.meow() available"]
    A -->|"isDog(value) === true"| C["Narrowed: Dog
.bark() available"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
```

**Code**:

```typescript
// INTERFACE FOR TYPE GUARD EXAMPLE
interface Cat {
  // => Cat interface
  name: string;
  meow(): void;
}

interface Dog {
  // => Dog interface
  name: string;
  bark(): void;
}

// USER-DEFINED TYPE GUARD
function isCat(animal: Cat | Dog): animal is Cat {
  // => Type predicate: 'animal is Cat'
  // => Return type tells TypeScript about narrowing
  return (animal as Cat).meow !== undefined; // => Check if meow method exists
  // => Type assertion needed to access meow
}

function makeSound(animal: Cat | Dog): void {
  // => Union type parameter
  if (isCat(animal)) {
    // => User-defined type guard
    // => Inside block, TypeScript knows animal is Cat
    animal.meow(); // => meow() available (Cat method)
  } else {
    // => TypeScript knows animal is Dog
    animal.bark(); // => bark() available (Dog method)
  }
}

const cat: Cat = {
  // => Create Cat object
  name: "Whiskers",
  meow() {
    console.log("Meow!");
  },
};

const dog: Dog = {
  // => Create Dog object
  name: "Buddy",
  bark() {
    console.log("Woof!");
  },
};

makeSound(cat); // => Output: Meow!
makeSound(dog); // => Output: Woof!

// TYPE GUARD FOR PRIMITIVES
function isString(value: unknown): value is string {
  // => unknown type (safe any)
  // => Narrows to string
  return typeof value === "string"; // => Runtime check
}

function processValue(value: unknown): void {
  // => unknown type parameter
  if (isString(value)) {
    // => Type guard narrows to string
    console.log(value.toUpperCase()); // => toUpperCase() available
  } else {
    console.log("Not a string");
  }
}

processValue("hello"); // => Output: HELLO
processValue(42); // => Output: Not a string

// TYPE GUARD FOR ARRAY
function isStringArray(value: unknown): value is string[] {
  // => Narrows to string[]
  return Array.isArray(value) && value.every((item) => typeof item === "string");
  // => Check if array AND all elements are strings
}

function printStrings(value: unknown): void {
  if (isStringArray(value)) {
    // => Type guard narrows to string[]
    value.forEach((str) => console.log(str.toUpperCase())); // => str is string
  }
}

printStrings(["a", "b", "c"]); // => Output: A B C
```

**Key Takeaway**: User-defined type guards use `parameter is Type` return type syntax. The function's boolean return tells TypeScript to narrow the type in conditional blocks. Use `unknown` type for maximum type safety when the input type is truly unknown.

**Why It Matters**: Type guards eliminate unsafe type assertions throughout codebases. API response parsing uses guards like `isUser(data)` before accessing user properties. Event handling uses `isMouseEvent(event)` to safely access clientX/clientY. Form validation uses `isValidEmail(value)` to narrow from unknown inputs. This pattern makes TypeScript's control flow analysis powerful—the compiler proves types statically, preventing runtime errors from invalid data.

## Example 14: readonly Properties and Readonly Utility Type

The `readonly` modifier prevents property reassignment. The `Readonly<T>` utility type makes all properties readonly.

**Code**:

```typescript
// READONLY PROPERTY
interface User {
  // => Interface with readonly property
  readonly id: number; // => id cannot be reassigned after initialization
  name: string; // => name is mutable
}

const user: User = {
  // => Create User object
  id: 1, // => id initialized
  name: "Alice", // => name initialized
};

user.name = "Bob"; // => ALLOWED: name is mutable
console.log(user.name); // => Output: Bob

// user.id = 2;                          // => ERROR: Cannot assign to readonly property

// READONLY ARRAY
const numbers: readonly number[] = [1, 2, 3]; // => Readonly array
console.log(numbers[0]); // => Output: 1

// numbers.push(4);                      // => ERROR: push doesn't exist on readonly array
// numbers[0] = 10;                      // => ERROR: Cannot assign to index

// READONLY<T> UTILITY TYPE
interface Point {
  // => Mutable interface
  x: number;
  y: number;
}

const point: Readonly<Point> = {
  // => Readonly<T> makes all properties readonly
  x: 10, // => x initialized
  y: 20, // => y initialized
};

console.log(point.x); // => Output: 10

// point.x = 15;                         // => ERROR: Cannot assign to readonly property
// point.y = 25;                         // => ERROR: Cannot assign to readonly property

// READONLY WITH ARRAYS AND OBJECTS
interface Config {
  database: {
    host: string;
    port: number;
  };
  features: string[];
}

const config: Readonly<Config> = {
  // => Top-level readonly
  database: { host: "localhost", port: 5432 },
  features: ["auth", "logging"],
};

// config.database = { host: "prod", port: 5432 };  // => ERROR: Cannot reassign database

// However, nested properties are still mutable:
config.database.host = "production"; // => ALLOWED: Readonly is shallow
config.features.push("metrics"); // => ALLOWED: Array methods still work

console.log(config.database.host); // => Output: production
console.log(config.features); // => Output: ["auth", "logging", "metrics"]

// DEEP READONLY (UTILITY TYPE)
type DeepReadonly<T> = {
  // => Recursive readonly type
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
}; // => Makes all nested properties readonly

const deepConfig: DeepReadonly<Config> = {
  database: { host: "localhost", port: 5432 },
  features: ["auth"],
};

// deepConfig.database.host = "prod";    // => ERROR: Cannot assign (deep readonly)
```

**Key Takeaway**: Use `readonly` modifier for individual properties. Use `Readonly<T>` utility type to make all properties readonly. Note that `Readonly<T>` is shallow—nested objects remain mutable unless using recursive types.

**Why It Matters**: Immutability prevents accidental mutations that cause bugs in shared data structures. React props are readonly to prevent components from modifying parent state. Redux state is readonly to enforce unidirectional data flow. Configuration objects use readonly to prevent runtime modification. However, TypeScript's `readonly` is compile-time only—it doesn't prevent mutations in JavaScript runtime. For true immutability, use libraries like Immer or enforce with runtime validation.

## Example 15: Optional Chaining and Nullish Coalescing

Optional chaining (`?.`) safely accesses nested properties that might be null/undefined. Nullish coalescing (`??`) provides fallback values for null/undefined (but not falsy values like 0 or "").

**Code**:

```typescript
// OPTIONAL CHAINING WITH OBJECTS
interface User {
  // => User interface with optional address
  name: string;
  address?: {
    // => Optional nested object
    street?: string;
    city?: string;
  };
}

const user1: User = {
  // => User without address
  name: "Alice",
};

const user2: User = {
  // => User with partial address
  name: "Bob",
  address: {
    city: "New York", // => street is undefined
  },
};

// SAFE PROPERTY ACCESS
console.log(user1.address?.city); // => Output: undefined (address is undefined)
// => Optional chaining prevents error
console.log(user2.address?.city); // => Output: New York
console.log(user2.address?.street); // => Output: undefined (street is undefined)

// WITHOUT OPTIONAL CHAINING (OLD WAY)
// console.log(user1.address.city);      // => ERROR: Cannot read property 'city' of undefined

// OPTIONAL CHAINING WITH METHODS
interface Calculator {
  add?: (a: number, b: number) => number; // => Optional method
}

const calc1: Calculator = {
  // => Calculator with add method
  add: (a, b) => a + b,
};

const calc2: Calculator = {}; // => Calculator without add method

console.log(calc1.add?.(5, 3)); // => Output: 8 (method exists)
console.log(calc2.add?.(5, 3)); // => Output: undefined (method doesn't exist)
// => No error thrown

// OPTIONAL CHAINING WITH ARRAYS
interface Response {
  data?: string[]; // => Optional array
}

const response1: Response = {
  // => Response with data
  data: ["a", "b", "c"],
};

const response2: Response = {}; // => Response without data

console.log(response1.data?.[0]); // => Output: a
console.log(response2.data?.[0]); // => Output: undefined (data doesn't exist)

// NULLISH COALESCING
const value1: string | null = null; // => null value
const value2: string | undefined = undefined; // => undefined value
const value3: string = ""; // => Empty string (falsy but not nullish)
const value4: number = 0; // => Zero (falsy but not nullish)

console.log(value1 ?? "default"); // => Output: default (null is nullish)
console.log(value2 ?? "default"); // => Output: default (undefined is nullish)
console.log(value3 ?? "default"); // => Output: "" (empty string NOT nullish)
console.log(value4 ?? "default"); // => Output: 0 (zero NOT nullish)

// COMPARISON WITH LOGICAL OR (||)
console.log(value3 || "default"); // => Output: default ("" is falsy)
console.log(value4 || "default"); // => Output: default (0 is falsy)
// => || treats all falsy values as missing
// => ?? only treats null/undefined as missing

// COMBINING OPTIONAL CHAINING AND NULLISH COALESCING
const user3: User = { name: "Charlie" };

const city = user3.address?.city ?? "Unknown"; // => Chain together safely
// => Provides fallback for undefined
console.log(city); // => Output: Unknown
```

**Key Takeaway**: Optional chaining (`?.`) safely accesses potentially null/undefined properties without errors. Nullish coalescing (`??`) provides defaults for null/undefined while preserving falsy values like 0 and "". Combine them for safe nested access with fallbacks.

**Why It Matters**: Optional chaining eliminates defensive null checks that clutter codebases. Before `?.`, accessing `user.address.city` required: `user && user.address && user.address.city`. Now it's just `user?.address?.city`. API responses use this heavily: `response?.data?.items?.[0]?.name`. The nullish coalescing operator fixes the logical OR (`||`) bug where `0` or `""` are treated as missing values. This is critical for configuration: `const port = config.port ?? 3000` keeps port 0 if explicitly set, while `config.port || 3000` would replace 0 with 3000.

## Example 16: Template Literal Types

Template literal types create string types from string literal patterns. They enable precise string validation at compile time.

**Code**:

```typescript
// SIMPLE TEMPLATE LITERAL TYPE
type Greeting = `hello ${string}`; // => String must start with "hello "
// => Followed by any string

const validGreeting: Greeting = "hello world"; // => VALID: matches pattern
const invalidGreeting: Greeting = "hi world"; // => ERROR: doesn't start with "hello "

// TEMPLATE LITERAL WITH UNIONS
type Color = "red" | "blue" | "green"; // => Color union
type Quantity = "one" | "two" | "three"; // => Quantity union

type ColoredQuantity = `${Quantity} ${Color}`; // => Cartesian product of unions
// => Creates "one red" | "one blue" | ... | "three green"

const item: ColoredQuantity = "two blue"; // => VALID: matches pattern
console.log(item); // => Output: two blue

// CSS PROPERTY PATTERN
type CSSProperty = `${"margin" | "padding"}-${"top" | "bottom" | "left" | "right"}`;
// => Creates margin-top, margin-bottom, padding-left, etc.

const cssProperty: CSSProperty = "margin-top"; // => VALID
console.log(cssProperty); // => Output: margin-top

// EVENT HANDLER PATTERN
type EventName = "click" | "focus" | "blur"; // => Event types
type EventHandler = `on${Capitalize<EventName>}`; // => Creates onClick, onFocus, onBlur
// => Capitalize is built-in utility type

const handler: EventHandler = "onClick"; // => VALID: matches pattern
console.log(handler); // => Output: onClick

// API ENDPOINT PATTERN
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `/api/${"users" | "products"}/${string}`; // => /api/users/* or /api/products/*

const apiUrl: Endpoint = "/api/users/123"; // => VALID
console.log(apiUrl); // => Output: /api/users/123

// COMBINING TEMPLATE LITERALS WITH MAPPED TYPES
type HTTPMethod = "GET" | "POST";
type Endpoint2 = "users" | "products";

type API = {
  [K in `${HTTPMethod} /${Endpoint2}`]: () => void; // => Creates "GET /users", "POST /products", etc.
};

const api: API = {
  // => Object with generated keys
  "GET /users": () => console.log("Fetching users"),
  "GET /products": () => console.log("Fetching products"),
  "POST /users": () => console.log("Creating user"),
  "POST /products": () => console.log("Creating product"),
};

api["GET /users"](); // => Output: Fetching users
```

**Key Takeaway**: Template literal types use backticks with `${}` placeholders to create string patterns. Combine with unions to generate all permutations. Use built-in utilities like `Capitalize` for string transformations.

**Why It Matters**: Template literal types enable compile-time validation of string patterns that would otherwise require runtime checks. CSS-in-JS libraries use them for property names. GraphQL code generators create query patterns. API route typing uses them: `type Route = \`/${string}\``. This catches typos in string constants at build time—no more`"onClick"`vs`"onclick"` bugs. The pattern is especially powerful in libraries providing type-safe APIs over string-based configurations.

## Example 17: keyof and typeof Operators

`keyof` creates a union of object property names. `typeof` infers the type of a value. Together they enable type-safe property access.

**Code**:

```typescript
// keyof OPERATOR
interface User {
  // => User interface
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User; // => Creates "id" | "name" | "email"
// => Union of property names

function getUserProperty(user: User, key: UserKeys): string | number {
  // => Key must be valid property
  return user[key]; // => Type-safe property access
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};

console.log(getUserProperty(user, "name")); // => Output: Alice
// console.log(getUserProperty(user, "invalid"));  // => ERROR: "invalid" not in UserKeys

// typeof OPERATOR
const config = {
  // => JavaScript object
  host: "localhost",
  port: 3000,
  debug: true,
};

type Config = typeof config; // => Infers type from value
// => { host: string; port: number; debug: boolean }

function loadConfig(cfg: Config): void {
  // => Use inferred type
  console.log(`${cfg.host}:${cfg.port}`);
}

loadConfig(config); // => Output: localhost:3000

// COMBINING keyof AND typeof
const endpoints = {
  // => Endpoints object
  users: "/api/users",
  products: "/api/products",
  orders: "/api/orders",
};

type Endpoint = keyof typeof endpoints; // => "users" | "products" | "orders"
// => typeof gets type, keyof gets keys

function fetchData(endpoint: Endpoint): string {
  // => Type-safe endpoint parameter
  return endpoints[endpoint]; // => Access with valid key
}

console.log(fetchData("users")); // => Output: /api/users
// console.log(fetchData("invalid"));    // => ERROR: "invalid" not in Endpoint

// GENERIC PROPERTY ACCESS
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  // => Generic function
  // => K must be key of T
  // => Return type is T[K]
  return obj[key]; // => Type-safe property access
}

interface Product {
  id: number;
  name: string;
  price: number;
}

const product: Product = {
  id: 1,
  name: "Laptop",
  price: 999,
};

const productName = getProperty(product, "name"); // => Type: string (inferred from Product["name"])
const productPrice = getProperty(product, "price"); // => Type: number (inferred from Product["price"])

console.log(productName); // => Output: Laptop
console.log(productPrice); // => Output: 999

// MAPPED TYPE WITH keyof
type ReadonlyUser = {
  // => Mapped type
  readonly [K in keyof User]: User[K]; // => Iterate over User keys
}; // => Makes all properties readonly

const readonlyUser: ReadonlyUser = {
  id: 1,
  name: "Bob",
  email: "bob@example.com",
};

// readonlyUser.name = "Charlie";        // => ERROR: Cannot assign to readonly property
```

**Key Takeaway**: `keyof T` creates a union of property names from type `T`. `typeof value` infers the type from a JavaScript value. Use `K extends keyof T` in generics for type-safe property access.

**Why It Matters**: `keyof` enables type-safe property access without hardcoding property names. ORM libraries use `keyof` to build type-safe query builders where invalid field names are compile errors. `typeof` enables deriving types from existing values, keeping type definitions and runtime values in sync automatically. Together, these operators power dynamic accessor patterns in lodash-style utility libraries without sacrificing type safety.

## Example 18: Partial, Required, Pick, Omit Utility Types

TypeScript provides built-in utility types to transform existing types. These enable flexible type composition without duplication.

**Code**:

```typescript
// BASE INTERFACE
interface User {
  // => Base User type
  id: number;
  name: string;
  email: string;
  age: number;
  address: string;
}

// PARTIAL<T> - MAKES ALL PROPERTIES OPTIONAL
type PartialUser = Partial<User>; // => All properties become optional
// => { id?: number; name?: string; ... }

function updateUser(id: number, updates: PartialUser): void {
  // => Can pass any subset
  console.log(`Updating user ${id}`, updates);
}

updateUser(1, { name: "Alice" }); // => VALID: only name provided
updateUser(2, { age: 30, email: "bob@example.com" }); // => VALID: partial update

// REQUIRED<T> - MAKES ALL PROPERTIES REQUIRED
interface Config {
  // => Config with optional properties
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>; // => All properties become required
// => { host: string; port: number; debug: boolean }

const config: RequiredConfig = {
  // => Must provide all properties
  host: "localhost",
  port: 3000,
  debug: true,
};

console.log(config.host); // => Output: localhost

// PICK<T, K> - SELECT SPECIFIC PROPERTIES
type UserPreview = Pick<User, "id" | "name">; // => Only id and name
// => { id: number; name: string }

const preview: UserPreview = {
  // => Only picked properties allowed
  id: 1,
  name: "Alice",
};

console.log(preview); // => Output: { id: 1, name: 'Alice' }

// OMIT<T, K> - EXCLUDE SPECIFIC PROPERTIES
type UserWithoutEmail = Omit<User, "email">; // => All except email
// => { id, name, age, address }

const userWithoutEmail: UserWithoutEmail = {
  id: 1,
  name: "Bob",
  age: 25,
  address: "123 Main St",
};

console.log(userWithoutEmail); // => Output: { id: 1, name: 'Bob', age: 25, address: '123 Main St' }

// COMBINING UTILITY TYPES
type UserUpdate = Partial<Omit<User, "id">>; // => All properties optional except id removed
// => { name?: string; email?: string; age?: number; address?: string }

function patchUser(id: number, data: UserUpdate): void {
  console.log(`Patching user ${id}`, data);
}

patchUser(1, { name: "Charlie" }); // => VALID: partial update without id

// PICK WITH UNION
type ContactInfo = Pick<User, "email" | "address">; // => Email and address only

const contact: ContactInfo = {
  email: "diana@example.com",
  address: "456 Elm St",
};

console.log(contact); // => Output: { email: 'diana@example.com', address: '456 Elm St' }
```

**Key Takeaway**: `Partial<T>` makes all properties optional. `Required<T>` makes all required. `Pick<T, K>` selects specific properties. `Omit<T, K>` excludes properties. Combine them for complex transformations without manual type definitions.

**Why It Matters**: Utility types eliminate boilerplate and prevent drift between related types. API request/response types use `Partial<T>` for optional update DTOs, `Omit<T, "password">` for safe public responses, and `Required<T>` to enforce complete configurations. Without utility types, developers manually define overlapping interfaces that fall out of sync when base types change. These four utilities are essential vocabulary in any TypeScript codebase.

## Example 19: Record Utility Type

`Record<K, V>` creates an object type with keys `K` and values `V`. It's useful for creating dictionaries and maps with type constraints.

**Code**:

```typescript
// BASIC RECORD TYPE
type UserRole = "admin" | "user" | "guest"; // => Literal type union

type RolePermissions = Record<UserRole, string[]>; // => Object with UserRole keys, string[] values
// => { admin: string[], user: string[], guest: string[] }

const permissions: RolePermissions = {
  // => Must provide all roles
  admin: ["create", "read", "update", "delete"], // => Admin permissions
  user: ["create", "read", "update"], // => User permissions
  guest: ["read"], // => Guest permissions (limited)
};

console.log(permissions.admin); // => Output: ["create", "read", "update", "delete"]

// RECORD WITH NUMERIC KEYS
type StatusCode = 200 | 404 | 500; // => HTTP status codes

type StatusMessages = Record<StatusCode, string>; // => Map codes to messages

const messages: StatusMessages = {
  // => All codes must be provided
  200: "OK",
  404: "Not Found",
  500: "Internal Server Error",
};

console.log(messages[404]); // => Output: Not Found

// RECORD FOR CONFIGURATION
type Environment = "development" | "staging" | "production";

interface DatabaseConfig {
  // => Database connection config
  host: string;
  port: number;
}

type EnvironmentConfig = Record<Environment, DatabaseConfig>; // => Config per environment

const dbConfig: EnvironmentConfig = {
  development: {
    host: "localhost",
    port: 5432,
  },
  staging: {
    host: "staging.db.example.com",
    port: 5432,
  },
  production: {
    host: "prod.db.example.com",
    port: 5432,
  },
};

console.log(dbConfig.production.host); // => Output: prod.db.example.com

// RECORD WITH STRING INDEX
type Dictionary = Record<string, number>; // => Any string key, number value
// => Equivalent to { [key: string]: number }

const scores: Dictionary = {
  // => Can add any string keys
  alice: 95,
  bob: 87,
  charlie: 92,
};

console.log(scores.alice); // => Output: 95
scores.diana = 88; // => VALID: add new key
console.log(scores.diana); // => Output: 88

// RECORD VS INDEX SIGNATURE
interface ScoresIndex {
  // => Index signature approach
  [key: string]: number;
}

const scoresIndex: ScoresIndex = {
  // => Same behavior as Record<string, number>
  alice: 95,
  bob: 87,
};

// Both approaches equivalent for dynamic keys
// Record<K, V> is more concise for specific key types
```

**Key Takeaway**: `Record<K, V>` creates object types with specific key and value types. Use it for dictionaries, maps, and configuration objects. It's more concise than index signatures for specific key sets.

**Why It Matters**: `Record` is the standard pattern for key-value data structures with type safety. State management can use `Record<string, User>` for normalized entities. Configuration systems can use `Record<Environment, Config>`. Translation files can use `Record<string, string>` for i18n keys. The type ensures all expected keys exist (when using literal unions) or validates value types for dynamic keys.

## Example 20: Type Assertions vs Type Guards

Type assertions (`as`) tell the compiler to trust you about a type. Type guards prove types through runtime checks. Guards are safer than assertions.

**Code**:

```typescript
// TYPE ASSERTION (UNSAFE)
function getValueAssertion(): any {
  // => Returns any (no type safety)
  return "Hello"; // => Actually returns string
}

const value1 = getValueAssertion() as string; // => Assertion: trust me it's string
// => No runtime check
console.log(value1.toUpperCase()); // => Output: HELLO (works because actually string)

const value2 = getValueAssertion() as number; // => Assertion: trust me it's number
// => DANGER: actually string!
// console.log(value2.toFixed(2));       // => ERROR at runtime: toFixed not on string

// TYPE GUARD (SAFE)
function isString(value: unknown): value is string {
  // => Type predicate
  return typeof value === "string"; // => Runtime check
}

function getValueGuard(): unknown {
  // => Returns unknown (forces checking)
  return "Hello";
}

const value3 = getValueGuard(); // => value3 type: unknown

if (isString(value3)) {
  // => Type guard narrows to string
  console.log(value3.toUpperCase()); // => Output: HELLO (safe)
} else {
  console.log("Not a string");
}

// ASSERTION WITH DOM ELEMENTS (COMMON USE CASE)
const input1 = document.getElementById("username") as HTMLInputElement; // => Assertion
// => DANGER: might be null!
// input1.value = "Alice";               // => Crashes if element doesn't exist

// SAFER APPROACH WITH GUARD
const input2 = document.getElementById("username"); // => Type: HTMLElement | null

if (input2 instanceof HTMLInputElement) {
  // => Type guard with instanceof
  input2.value = "Alice"; // => Safe: null checked, type narrowed
  console.log(input2.value); // => Output: Alice
}

// ASSERTION FOR COMPLEX TYPES
interface User {
  id: number;
  name: string;
}

function getUser(): unknown {
  // => Returns unknown
  return { id: 1, name: "Bob" }; // => Actually returns User-like object
}

// UNSAFE ASSERTION
const user1 = getUser() as User; // => Assertion: no validation
console.log(user1.name); // => Output: Bob (works by luck)

// SAFE TYPE GUARD
function isUser(value: unknown): value is User {
  // => Type guard for User
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string"
  ); // => Validates all required properties
}

const maybeUser = getUser(); // => Type: unknown

if (isUser(maybeUser)) {
  // => Type guard validates at runtime
  console.log(maybeUser.name); // => Output: Bob (safe)
} else {
  console.log("Invalid user");
}

// WHEN ASSERTIONS ARE ACCEPTABLE
interface ApiResponse {
  // => Known API contract
  data: string;
}

const response = JSON.parse('{"data": "value"}') as ApiResponse; // => JSON.parse returns any
// => Assertion acceptable when API contract known
console.log(response.data); // => Output: value
```

**Key Takeaway**: Type assertions bypass type checking—use sparingly and only when you're certain about the type. Type guards prove types through runtime checks—they're safer. Prefer guards for untrusted data and assertions for known contracts.

**Why It Matters**: Type assertions are necessary evils when TypeScript's type system can't infer correctly (DOM APIs, JSON parsing, migration from JavaScript). However, they disable type safety—the compiler trusts you blindly. Type guards provide both runtime safety and compile-time narrowing. Production code should minimize assertions through better typing (generics, guards, proper types). The distinction is critical for API integration where data shapes are uncertain.

## Example 21: String, Number, Boolean Object Wrappers

JavaScript has both primitive types (`string`, `number`, `boolean`) and object wrapper types (`String`, `Number`, `Boolean`). TypeScript distinguishes them—almost always use primitives.

**Code**:

```typescript
// PRIMITIVE TYPES (PREFERRED)
let str: string = "hello"; // => Primitive string (lowercase)
let num: number = 42; // => Primitive number
let bool: boolean = true; // => Primitive boolean

console.log(typeof str); // => Output: string (primitive)
console.log(typeof num); // => Output: number (primitive)
console.log(typeof bool); // => Output: boolean (primitive)

// OBJECT WRAPPER TYPES (AVOID)
let strObj: String = new String("hello"); // => Object wrapper (uppercase)
// => Type: String (object, not primitive)
let numObj: Number = new Number(42); // => Object wrapper for number
let boolObj: Boolean = new Boolean(true); // => Object wrapper for boolean

console.log(typeof strObj); // => Output: object (NOT string!)
console.log(typeof numObj); // => Output: object (NOT number!)
console.log(typeof boolObj); // => Output: object (NOT boolean!)

// INCOMPATIBILITY
// let str2: string = strObj;            // => ERROR: Type 'String' not assignable to 'string'
// => Object wrapper incompatible with primitive

// PRIMITIVE TO WRAPPER (AUTO-BOXING)
let primitive = "hello"; // => Primitive string
let length = primitive.length; // => Access .length property
// => JavaScript auto-boxes to String object temporarily
// => Then discards wrapper

console.log(length); // => Output: 5

// WRAPPER TO PRIMITIVE (EXPLICIT CONVERSION)
let wrapper = new String("world"); // => String object wrapper
let primitiveFromWrapper = wrapper.valueOf(); // => Extract primitive value
// => Returns string primitive

console.log(typeof primitiveFromWrapper); // => Output: string (primitive)

// COMPARISON BEHAVIOR
let prim1 = "test"; // => Primitive string
let prim2 = "test"; // => Another primitive string
console.log(prim1 === prim2); // => Output: true (value comparison)

let obj1 = new String("test"); // => String object
let obj2 = new String("test"); // => Another String object
console.log(obj1 === obj2); // => Output: false (reference comparison)
console.log(obj1.valueOf() === obj2.valueOf()); // => Output: true (compare primitives)

// BEST PRACTICE: ALWAYS USE PRIMITIVES
function greet(name: string): string {
  // => Use lowercase string
  return `Hello, ${name}`;
}

console.log(greet("Alice")); // => Output: Hello, Alice

// AVOID OBJECT WRAPPERS
// function badGreet(name: String): String {  // => AVOID: uppercase String
//     return new String(`Hello, ${name}`);    // => Returns object, not primitive
// }
```

**Key Takeaway**: Use primitive types (`string`, `number`, `boolean`) not object wrappers (`String`, `Number`, `Boolean`). Primitives are faster, use less memory, and are compatible with standard library. Object wrappers exist for compatibility but should be avoided.

**Why It Matters**: The primitive vs object distinction causes subtle bugs. Object wrappers fail equality checks (`new String("a") !== new String("a")`), consume more memory, and break type compatibility. TypeScript's type checker enforces primitives by default, preventing this footgun. However, the distinction confuses beginners coming from Java/C# where all types are objects. Always use lowercase type names in TypeScript.

## Example 22: never Type and Exhaustiveness Checking

The `never` type represents values that never occur. It's used for functions that never return and for exhaustive type checking in switch statements.

**Code**:

```typescript
// FUNCTION THAT NEVER RETURNS
function throwError(message: string): never {
  // => Return type: never
  // => Function never returns normally
  throw new Error(message); // => Throws exception
  // => Execution never reaches end
}

// Function using never
function processValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // => Returns string
  } else if (typeof value === "number") {
    return value.toFixed(2); // => Returns string
  } else {
    throwError("Invalid type"); // => never type
    // => TypeScript knows this never returns
  }
}

// INFINITE LOOP (NEVER RETURNS)
function infiniteLoop(): never {
  // => Return type: never
  while (true) {
    // => Infinite loop
    console.log("Running forever");
  } // => Never exits
}

// EXHAUSTIVENESS CHECKING
type Shape = Circle | Square | Triangle; // => Union of shapes

interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

function getArea(shape: Shape): number {
  // => Calculate area by shape
  switch (
    shape.kind // => Discriminated union pattern
  ) {
    case "circle":
      return Math.PI * shape.radius ** 2; // => Circle area
    case "square":
      return shape.sideLength ** 2; // => Square area
    case "triangle":
      return (shape.base * shape.height) / 2; // => Triangle area
    default:
      const exhaustiveCheck: never = shape; // => Ensures all cases handled
      // => If new shape added, this errors
      return exhaustiveCheck; // => Never reached
  }
}

const circle: Circle = { kind: "circle", radius: 5 };
console.log(getArea(circle)); // => Output: 78.53981633974483

// IF WE ADD A NEW SHAPE WITHOUT UPDATING SWITCH:
// type Shape = Circle | Square | Triangle | Rectangle;  // => Add Rectangle
// => The 'default' case would error: Type 'Rectangle' not assignable to 'never'
// => Compiler forces us to handle new case

// NEVER AS BOTTOM TYPE
let neverValue: never; // => never is bottom type
// => No value can be assigned
// neverValue = 5;                       // => ERROR: number not assignable to never
// neverValue = "text";                  // => ERROR: string not assignable to never

// However, never is assignable to everything
let str: string = throwError("oops"); // => never assignable to string
// => Function never returns anyway

// UNION WITH never
type Example1 = string | never; // => Simplifies to string
// => never removed from union
type Example2 = number | never | boolean; // => Simplifies to number | boolean
```

**Key Takeaway**: `never` represents impossible values—functions that never return (throw or infinite loop) or unreachable code. Use it in `default` cases for exhaustiveness checking in discriminated unions.

**Why It Matters**: Exhaustiveness checking prevents bugs when adding variants to unions. If you add a new shape type but forget to handle it in `getArea`, the compiler errors immediately. This pattern is crucial for action reducers (handling all action types), API response handlers (handling all status codes), and state machines (handling all states). The `never` type makes impossible states unrepresentable, a core tenet of type-safe design.

## Example 23: unknown Type (Type-Safe any)

The `unknown` type is a type-safe alternative to `any`. You can assign any value to `unknown`, but you must narrow the type before using it.

**Code**:

```typescript
// any TYPE (UNSAFE)
let anyValue: any = "hello"; // => any disables type checking
anyValue = 42; // => Can assign anything
anyValue.toUpperCase(); // => No error (but crashes if number!)
anyValue.foo.bar.baz; // => No error (crashes at runtime!)

// unknown TYPE (SAFE)
let unknownValue: unknown = "hello"; // => unknown accepts any value
unknownValue = 42; // => Can assign anything
// unknownValue.toUpperCase();           // => ERROR: Object is of type 'unknown'
// => Must narrow type first

// TYPE NARROWING WITH unknown
if (typeof unknownValue === "string") {
  // => Type guard narrows to string
  console.log(unknownValue.toUpperCase()); // => Output: HELLO (when string)
} else if (typeof unknownValue === "number") {
  // => Type guard narrows to number
  console.log(unknownValue.toFixed(2)); // => toFixed available (number)
}

// FUNCTION ACCEPTING unknown
function processInput(input: unknown): string {
  // => Safer than any
  if (typeof input === "string") {
    // => Must check type
    return input.toUpperCase(); // => Type narrowed to string
  } else if (typeof input === "number") {
    return input.toString(); // => Type narrowed to number
  } else {
    return "Unknown type"; // => Fallback for other types
  }
}

console.log(processInput("hello")); // => Output: HELLO
console.log(processInput(42)); // => Output: 42
console.log(processInput(true)); // => Output: Unknown type

// JSON PARSING (PRACTICAL USE CASE)
function parseJSON(json: string): unknown {
  // => Returns unknown (don't trust input)
  return JSON.parse(json); // => JSON.parse returns any
} // => Returning unknown forces callers to validate

const data = parseJSON('{"name": "Alice", "age": 30}'); // => Type: unknown

// Must validate before use
if (typeof data === "object" && data !== null && "name" in data && "age" in data) {
  const obj = data as { name: string; age: number }; // => Type assertion after validation
  console.log(obj.name); // => Output: Alice
}

// TYPE PREDICATE WITH unknown
function isUser(value: unknown): value is { id: number; name: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as any).id === "number" &&
    typeof (value as any).name === "string"
  );
}

function processUser(value: unknown): void {
  if (isUser(value)) {
    // => Type guard narrows to User shape
    console.log(`User ID: ${value.id}, Name: ${value.name}`);
  } else {
    console.log("Not a user");
  }
}

processUser({ id: 1, name: "Bob" }); // => Output: User ID: 1, Name: Bob
processUser("invalid"); // => Output: Not a user

// unknown vs any IN UNIONS
type Value1 = string | any; // => Simplifies to any (loses type safety)
type Value2 = string | unknown; // => Simplifies to unknown (maintains safety)
```

**Key Takeaway**: Use `unknown` instead of `any` when you don't know the type. `unknown` requires type narrowing before use, preventing runtime errors. It's the type-safe top type in TypeScript.

**Why It Matters**: `unknown` forces defensive programming for untrusted data. API responses, JSON parsing, and user input should use `unknown` to mandate validation. This prevents the silent bugs that `any` allows. Migration from JavaScript often starts with `any` everywhere; refactoring to `unknown` adds safety without breaking functionality. The pattern is: accept `unknown`, validate, narrow, then operate.

## Example 24: void, null, undefined Differences

TypeScript distinguishes `void` (no return value), `null` (intentional absence), and `undefined` (uninitialized or missing). Understanding the differences prevents subtle bugs.

**Code**:

```typescript
// void TYPE - FUNCTION RETURNS NOTHING
function logMessage(message: string): void {
  // => Return type: void
  console.log(message); // => Side effect (logging)
  // => No return statement
}

logMessage("Hello"); // => Output: Hello

const result1 = logMessage("Test"); // => result1 type: void
console.log(result1); // => Output: undefined (void becomes undefined)

// void ALLOWS undefined RETURN
function doSomething(): void {
  // => Return type: void
  return undefined; // => ALLOWED: can return undefined
}

// But disallows other values
// function invalid(): void {
//     return "text";                    // => ERROR: Type 'string' not assignable to void
// }

// undefined TYPE - SPECIFICALLY UNINITIALIZED
let uninitializedValue: undefined; // => Type: undefined (no value assigned)
console.log(uninitializedValue); // => Output: undefined

function returnUndefined(): undefined {
  // => Must return undefined
  return undefined; // => Explicit undefined
}

// null TYPE - INTENTIONAL ABSENCE
let nullValue: null = null; // => Type: null (intentional no-value)

function findUser(id: number): User | null {
  // => May return null (not found)
  if (id === 1) {
    return { id: 1, name: "Alice" }; // => User found
  }
  return null; // => Not found (null)
}

const user1 = findUser(1); // => Type: User | null
const user2 = findUser(999); // => Type: User | null

console.log(user2); // => Output: null

// UNION WITH null AND undefined
function getValue(): string | null | undefined {
  // => Can return any of 3
  const random = Math.random();
  if (random < 0.33) {
    return "value"; // => Returns string
  } else if (random < 0.66) {
    return null; // => Returns null (intentional absence)
  } else {
    return undefined; // => Returns undefined (no value)
  }
}

// STRICTNULLCHECKS COMPILER OPTION
// With strictNullChecks enabled (recommended):
let str1: string = "hello"; // => string type
// str1 = null;                          // => ERROR: null not assignable to string
// str1 = undefined;                     // => ERROR: undefined not assignable to string

let str2: string | null = "hello"; // => Allows null
str2 = null; // => ALLOWED

let str3: string | undefined = "hello"; // => Allows undefined
str3 = undefined; // => ALLOWED

// OPTIONAL PARAMETERS (IMPLICITLY undefined)
function greet(name?: string): void {
  // => name type: string | undefined
  // => Optional params allow undefined
  if (name) {
    console.log(`Hello, ${name}`); // => name narrowed to string
  } else {
    console.log("Hello, stranger"); // => name is undefined
  }
}

greet("Alice"); // => Output: Hello, Alice
greet(); // => Output: Hello, stranger (undefined)

// COMPARISON
console.log(null == undefined); // => Output: true (loose equality)
console.log(null === undefined); // => Output: false (strict equality)

console.log(typeof null); // => Output: object (JavaScript quirk!)
console.log(typeof undefined); // => Output: undefined
```

**Key Takeaway**: `void` is for functions with no return value (side effects only). `undefined` means uninitialized or missing. `null` means intentionally absent. Use `strictNullChecks` compiler option to enforce explicit null/undefined handling.

**Why It Matters**: The void/null/undefined distinction prevents bugs from missing values. Database queries return `null` for not-found (intentional). Optional parameters are `undefined` (omitted). Functions with side effects return `void` (no meaningful value). The `strictNullChecks` compiler option eliminates billion-dollar null reference errors by forcing explicit null checks. This is one of TypeScript's killer features over JavaScript.

## Example 25: Type Predicates for Arrays

Type predicates can filter arrays while narrowing element types. This enables type-safe filtering operations.

**Code**:

```typescript
// FILTER WITHOUT TYPE PREDICATE
interface User {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
}

const items: (User | Product)[] = [
  // => Array of mixed types
  { id: 1, name: "Alice" }, // => User
  { id: 2, title: "Laptop" }, // => Product
  { id: 3, name: "Bob" }, // => User
  { id: 4, title: "Mouse" }, // => Product
];

// Without type predicate
const filtered1 = items.filter((item) => "name" in item); // => Filter users
console.log(filtered1); // => Output: [{id: 1, name: 'Alice'}, {id: 3, name: 'Bob'}]
// => Type: (User | Product)[] (not narrowed!)

// TYPE PREDICATE FOR FILTERING
function isUser(item: User | Product): item is User {
  // => Type predicate
  return "name" in item; // => Check for 'name' property
}

const users = items.filter(isUser); // => Type narrowed to User[]
// => Not (User | Product)[]!

console.log(users[0].name); // => Output: Alice (name available, type-safe)

// ANOTHER TYPE PREDICATE
function isProduct(item: User | Product): item is Product {
  return "title" in item; // => Check for 'title' property
}

const products = items.filter(isProduct); // => Type narrowed to Product[]

console.log(products[0].title); // => Output: Laptop (title available)

// FILTERING null/undefined FROM ARRAYS
function isDefined<T>(value: T | null | undefined): value is T {
  // => Generic type predicate
  return value !== null && value !== undefined; // => Check for null/undefined
}

const maybeNumbers: (number | null | undefined)[] = [1, null, 2, undefined, 3];

const numbers = maybeNumbers.filter(isDefined); // => Type narrowed to number[]
// => null and undefined removed

console.log(numbers); // => Output: [1, 2, 3]
console.log(numbers[0].toFixed(2)); // => Output: 1.00 (type-safe)

// COMPLEX TYPE PREDICATE
interface Dog {
  type: "dog";
  bark(): void;
}

interface Cat {
  type: "cat";
  meow(): void;
}

type Animal = Dog | Cat;

const animals: Animal[] = [
  {
    type: "dog",
    bark() {
      console.log("Woof");
    },
  },
  {
    type: "cat",
    meow() {
      console.log("Meow");
    },
  },
  {
    type: "dog",
    bark() {
      console.log("Woof woof");
    },
  },
];

function isDog(animal: Animal): animal is Dog {
  // => Type predicate for Dog
  return animal.type === "dog"; // => Check discriminator property
}

const dogs = animals.filter(isDog); // => Type narrowed to Dog[]

dogs.forEach((dog) => dog.bark()); // => Output: Woof, Woof woof (type-safe)

// INLINE TYPE PREDICATE
const cats = animals.filter((animal): animal is Cat => animal.type === "cat");
// => Inline type predicate
// => Type narrowed to Cat[]

cats.forEach((cat) => cat.meow()); // => Output: Meow (type-safe)
```

**Key Takeaway**: Type predicates (`value is Type`) enable type-safe filtering. Use them to narrow array element types after filter operations. Generic type predicates handle null/undefined filtering universally.

**Why It Matters**: Array filtering without type predicates loses type information—`items.filter(x => "name" in x)` returns the same union type. Type predicates solve this by teaching TypeScript about the filter logic. This pattern is essential for discriminated unions, nullable arrays, and mixed-type collections. Redux selectors use this pattern: `state.items.filter(isLoaded)` returns `LoadedItem[]` not `Item[]`.

## Example 26: Discriminated Unions (Tagged Unions)

Discriminated unions use a common literal property (discriminator) to distinguish between union members. They enable exhaustive pattern matching.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Shape (union)"] -->|"kind: 'circle'"| B["Circle {kind, radius}"]
    A -->|"kind: 'square'"| C["Square {kind, sideLength}"]
    A -->|"kind: 'triangle'"| D["Triangle {kind, base, height}"]

    E["switch(shape.kind)"] -->|"case 'circle'"| F["pi * radius^2"]
    E -->|"case 'square'"| G["sideLength^2"]
    E -->|"case 'triangle'"| H["base * height / 2"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Shape (discriminated union)"] -->|"kind: 'circle'"| B["Circle
{kind, radius}"]
    A -->|"kind: 'square'"| C["Square
{kind, sideLength}"]
    A -->|"kind: 'triangle'"| D["Triangle
{kind, base, height}"]

    E["switch(shape.kind)"] -->|"case 'circle'"| F["π × radius²"]
    E -->|"case 'square'"| G["sideLength²"]
    E -->|"case 'triangle'"| H["base × height / 2"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#000
```

**Code**:

```typescript
// DISCRIMINATED UNION
interface Circle {
  kind: "circle"; // => Discriminator (literal type "circle")
  radius: number; // => Circle-specific property
}

interface Square {
  kind: "square"; // => Discriminator (literal type "square")
  sideLength: number; // => Square-specific property
}

interface Triangle {
  kind: "triangle"; // => Discriminator (literal type "triangle")
  base: number; // => Triangle base length
  height: number; // => Triangle height
}

type Shape = Circle | Square | Triangle; // => Union of three shapes

// PATTERN MATCHING WITH DISCRIMINATOR
function getArea(shape: Shape): number {
  // => TypeScript narrows type in each case branch
  switch (
    shape.kind // => Switch on discriminator property
  ) {
    case "circle":
      // => TypeScript narrows: shape is Circle here
      return Math.PI * shape.radius ** 2; // => radius now accessible (Circle)
    case "square":
      // => TypeScript narrows: shape is Square here
      return shape.sideLength ** 2; // => sideLength now accessible (Square)
    case "triangle":
      // => TypeScript narrows: shape is Triangle here
      return (shape.base * shape.height) / 2; // => base & height accessible (Triangle)
    default:
      const exhaustiveCheck: never = shape; // => Error if new Shape variant not handled
      throw new Error(`Unhandled shape: ${exhaustiveCheck}`);
  }
}

const circle: Circle = { kind: "circle", radius: 5 };
const square: Square = { kind: "square", sideLength: 10 };
const triangle: Triangle = { kind: "triangle", base: 8, height: 6 };

console.log(getArea(circle)); // => Output: 78.53981633974483
console.log(getArea(square)); // => Output: 100
console.log(getArea(triangle)); // => Output: 24

// DISCRIMINATED UNION FOR API RESPONSES
interface SuccessResponse {
  status: "success"; // => Discriminator
  data: string[];
}

interface ErrorResponse {
  status: "error"; // => Discriminator
  errorMessage: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse): void {
  if (response.status === "success") {
    // => Type narrowed to SuccessResponse
    console.log("Data:", response.data.join(", ")); // => data available
  } else {
    // => Type narrowed to ErrorResponse
    console.error("Error:", response.errorMessage); // => errorMessage available
  }
}

handleResponse({ status: "success", data: ["a", "b", "c"] }); // => Output: Data: a, b, c
handleResponse({ status: "error", errorMessage: "Not found" }); // => Output: Error: Not found

// DISCRIMINATED UNION FOR STATE MACHINE
interface Idle {
  state: "idle"; // => Discriminator
}

interface Loading {
  state: "loading"; // => Discriminator
  progress: number;
}

interface Success {
  state: "success"; // => Discriminator
  data: string;
}

interface Failure {
  state: "failure"; // => Discriminator
  error: string;
}

type AsyncState = Idle | Loading | Success | Failure;

function renderState(state: AsyncState): string {
  switch (state.state) {
    case "idle":
      return "Waiting to start...";
    case "loading":
      return `Loading... ${state.progress}%`; // => progress available
    case "success":
      return `Success: ${state.data}`; // => data available
    case "failure":
      return `Error: ${state.error}`; // => error available
    default:
      const exhaustive: never = state;
      return exhaustive;
  }
}

console.log(renderState({ state: "idle" })); // => Output: Waiting to start...
console.log(renderState({ state: "loading", progress: 50 })); // => Output: Loading... 50%
console.log(renderState({ state: "success", data: "Complete" })); // => Output: Success: Complete
console.log(renderState({ state: "failure", error: "Network issue" })); // => Output: Error: Network issue
```

**Key Takeaway**: Discriminated unions use a common literal property to distinguish union members. Switch on the discriminator to narrow types automatically. Use `never` in the default case for exhaustiveness checking.

**Why It Matters**: Discriminated unions are the foundation of type-safe state management. Redux actions use `type` as discriminator—switch statements narrow correctly and TypeScript enforces exhaustiveness. React component state machines use discriminated unions to prevent invalid state combinations. GraphQL response handlers use them for success/error typing. Libraries like XState rely on discriminated unions for statechart modeling.

## Example 27: Index Signatures and Mapped Types

Index signatures allow objects with dynamic property names. Mapped types transform existing types by iterating over properties.

**Code**:

```typescript
// INDEX SIGNATURE
interface Dictionary {
  // => Dictionary with string keys
  [key: string]: number; // => Any string key maps to number value
}

const scores: Dictionary = {
  // => Can add any string keys
  alice: 95,
  bob: 87,
  charlie: 92,
};

console.log(scores.alice); // => Output: 95
scores.diana = 88; // => Add new key dynamically
console.log(scores.diana); // => Output: 88

// NUMERIC INDEX SIGNATURE
interface NumberDictionary {
  [index: number]: string; // => Numeric keys map to string values
}

const names: NumberDictionary = {
  0: "Alice",
  1: "Bob",
  2: "Charlie",
};

console.log(names[1]); // => Output: Bob

// MAPPED TYPE - READONLY
type Readonly<T> = {
  // => Makes all properties readonly
  readonly [P in keyof T]: T[P]; // => Iterate over T's keys
}; // => P is each property name

interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>; // => All properties become readonly
// => { readonly id: number; readonly name: string }

const user: ReadonlyUser = {
  id: 1,
  name: "Alice",
};

// user.name = "Bob";                    // => ERROR: Cannot assign to readonly property

// MAPPED TYPE - OPTIONAL
type Optional<T> = {
  // => Makes all properties optional
  [P in keyof T]?: T[P]; // => Add ? to each property
};

type OptionalUser = Optional<User>; // => { id?: number; name?: string }

const partialUser: OptionalUser = {
  // => Can omit properties
  name: "Charlie", // => id omitted
};

console.log(partialUser); // => Output: { name: 'Charlie' }

// MAPPED TYPE - NULLABLE
type Nullable<T> = {
  // => Makes all properties nullable
  [P in keyof T]: T[P] | null; // => Union with null
};

type NullableUser = Nullable<User>; // => { id: number | null; name: string | null }

const nullableUser: NullableUser = {
  id: null, // => null allowed
  name: "Diana",
};

console.log(nullableUser); // => Output: { id: null, name: 'Diana' }

// MAPPED TYPE WITH KEY TRANSFORMATION
type Getters<T> = {
  // => Create getter methods
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
}; // => Transform property names to getters

type UserGetters = Getters<User>; // => { getId: () => number; getName: () => string }

const userGetters: UserGetters = {
  getId: () => 1,
  getName: () => "Eve",
};

console.log(userGetters.getId()); // => Output: 1
console.log(userGetters.getName()); // => Output: Eve

// COMBINED INDEX SIGNATURE AND KNOWN PROPERTIES
interface FlexibleConfig {
  host: string; // => Required known property
  port: number; // => Required known property
  [key: string]: string | number; // => Additional dynamic properties
}

const config: FlexibleConfig = {
  host: "localhost",
  port: 3000,
  debug: true, // => ERROR: boolean not assignable
  timeout: 5000, // => ALLOWED: number matches signature
};
```

**Key Takeaway**: Index signatures enable dynamic property names with type constraints. Mapped types iterate over property keys to transform types. Use `in keyof` to iterate and `as` for key transformations.

**Why It Matters**: Index signatures handle dynamic data structures (dictionaries, configuration objects, translation maps). They enable typed access to runtime-determined keys, critical for i18n libraries, feature flag systems, and dynamic configuration. Mapped types build on index signatures to transform existing types systematically. Understanding when to use index signatures vs `Record<K, V>` vs mapped types is essential for robust TypeScript architecture.

## Example 28: Conditional Types

Conditional types select types based on conditions using `extends` keyword. They enable type-level programming for advanced type transformations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["T extends string ?"] -->|"true"| B["TrueType"]
    A -->|"false"| C["FalseType"]

    D["IsString&lt;string&gt;"] --> E["true"]
    F["IsString&lt;number&gt;"] --> G["false"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#CA9161,stroke:#000,color:#000
    style G fill:#DE8F05,stroke:#000,color:#000
```

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["T extends string ?"] -->|"true"| B["TrueType"]
    A -->|"false"| C["FalseType"]

    D["IsString<string>"] --> E["true"]
    F["IsString<number>"] --> G["false"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#CA9161,stroke:#000,color:#000
    style G fill:#DE8F05,stroke:#000,color:#000
```

**Code**:

```typescript
// BASIC CONDITIONAL TYPE
type IsString<T> = T extends string ? true : false; // => If T extends string, return true type, else false

type Test1 = IsString<string>; // => Type: true
type Test2 = IsString<number>; // => Type: false

// CONDITIONAL TYPE WITH INFER
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
// => If T is function, infer return type R
// => Otherwise return never

function getString(): string {
  return "hello";
}

function getNumber(): number {
  return 42;
}

type StringReturn = ReturnType<typeof getString>; // => Type: string
type NumberReturn = ReturnType<typeof getNumber>; // => Type: number

// CONDITIONAL TYPE FOR UNWRAPPING
type Unwrap<T> = T extends Promise<infer U> ? U : T; // => Unwrap Promise type
// => If Promise<U>, return U
// => Otherwise return T as-is

type UnwrappedString = Unwrap<Promise<string>>; // => Type: string
type UnwrappedNumber = Unwrap<number>; // => Type: number (not Promise)

// CONDITIONAL TYPE FOR FILTERING
type NonNullable<T> = T extends null | undefined ? never : T; // => Remove null/undefined
// => If T is null or undefined, return never
// => Otherwise return T

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // => Type: string (null/undefined removed)

// CONDITIONAL TYPE WITH UNION DISTRIBUTION
type ToArray<T> = T extends any ? T[] : never; // => Distributes over union members
// => Each member wrapped in array

type StringOrNumber = string | number;
type ArrayTypes = ToArray<StringOrNumber>; // => Type: string[] | number[]
// => NOT (string | number)[]

// PRACTICAL EXAMPLE - API RESPONSE TYPE
interface SuccessResponse<T> {
  status: "success";
  data: T;
}

interface ErrorResponse {
  status: "error";
  error: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

type ExtractData<T> = T extends { data: infer D } ? D : never; // => Extract data property type

type UserData = ExtractData<ApiResponse<{ id: number; name: string }>>;
// => Type: { id: number; name: string }

// CONDITIONAL TYPE FOR FUNCTION ARGUMENTS
type Parameters<T> = T extends (...args: infer P) => any ? P : never; // => Extract parameter types

function greet(name: string, age: number): void {
  console.log(`${name} is ${age}`);
}

type GreetParams = Parameters<typeof greet>; // => Type: [string, number] (tuple)

const params: GreetParams = ["Alice", 30];
greet(...params); // => Output: Alice is 30
```

**Key Takeaway**: Conditional types use `T extends U ? X : Y` syntax for type-level conditions. Use `infer` to extract types from complex structures. Conditional types distribute over union types automatically.

**Why It Matters**: Conditional types power advanced type utilities (`ReturnType`, `Parameters`, `NonNullable`). They enable type-level programming that adapts to input shapes—a form library can infer field validation types from a schema type, ensuring field names and value types are always in sync. Conditional types combined with `infer` unlock extraction of nested generic parameters, which underpins type-safe ORM and framework integrations.

## Example 29: Recursive Types

Recursive types reference themselves in their definition. They model nested data structures like trees, linked lists, and JSON.

**Code**:

```typescript
// RECURSIVE LINKED LIST
interface LinkedListNode<T> {
  value: T; // => Payload of any type T
  next: LinkedListNode<T> | null; // => Self-reference (or null for last node)
}

const node3: LinkedListNode<number> = { value: 3, next: null }; // => Tail node
const node2: LinkedListNode<number> = { value: 2, next: node3 }; // => Points to node3
const node1: LinkedListNode<number> = { value: 1, next: node2 }; // => Head: 1 -> 2 -> 3 -> null

console.log(node1.value); // => Output: 1
console.log(node1.next?.value); // => Output: 2
console.log(node1.next?.next?.value); // => Output: 3

// RECURSIVE TREE
interface TreeNode<T> {
  value: T; // => Node data of type T
  children: TreeNode<T>[]; // => Array of self-references (empty for leaves)
}

const leaf1: TreeNode<string> = { value: "A", children: [] }; // => Leaf node (no children)
const leaf2: TreeNode<string> = { value: "B", children: [] }; // => Leaf node (no children)
const branch: TreeNode<string> = { value: "Root", children: [leaf1, leaf2] }; // => Root with two children

console.log(branch.value); // => Output: Root
console.log(branch.children[0].value); // => Output: A (first child)

// RECURSIVE JSON TYPE
type JSONValue = // => Recursive union
  | string // => JSON string
  | number // => JSON number
  | boolean // => JSON boolean
  | null // => JSON null
  | JSONValue[] // => JSON array (recursive)
  | { [key: string]: JSONValue }; // => JSON object (recursive)

const jsonData: JSONValue = {
  name: "Alice", // => string value
  age: 30, // => number value
  active: true, // => boolean value
  address: {
    // => nested object (JSONValue recursion)
    city: "New York",
    zip: 10001,
  },
  hobbies: ["reading", "coding"], // => array (JSONValue recursion)
};

console.log(jsonData); // => Output: { name: 'Alice', age: 30, ... }

// RECURSIVE TYPE WITH CONSTRAINTS
type DeepReadonly<T> = {
  // => Recursive readonly mapped type
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]> // => Recursively apply to nested objects
    : T[P]; // => Primitives stay as-is
};

interface Config {
  database: {
    // => Nested object (will become DeepReadonly)
    host: string; // => string field
    port: number; // => number field
  };
  features: string[]; // => Array field
}

type ReadonlyConfig = DeepReadonly<Config>; // => All nested properties readonly

const config: ReadonlyConfig = {
  database: { host: "localhost", port: 5432 }, // => Readonly nested object
  features: ["auth", "logging"], // => Readonly array
};

// config.database.host = "prod";        // => ERROR: Cannot assign to readonly property

// RECURSIVE FLATTEN TYPE
type Flatten<T> =
  T extends Array<infer U> // => If T is array, extract element type U
    ? Flatten<U> // => Recursively flatten U
    : T; // => Base case: T is not array, return T

type NestedArray = number[][][]; // => Three levels of nesting
type Flattened = Flatten<NestedArray>; // => Type: number (fully flattened)

// RECURSIVE PARTIAL TYPE
type DeepPartial<T> = {
  // => Recursive optional
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]> // => Recursively apply to nested
    : T[P];
};

type PartialConfig = DeepPartial<Config>;

const partialConfig: PartialConfig = {
  database: {
    host: "localhost", // => port omitted (optional)
  },
};

console.log(partialConfig); // => Output: { database: { host: 'localhost' } }
```

**Key Takeaway**: Recursive types reference themselves in their definition using type names. Use them for nested structures (trees, lists, JSON). Combine with conditional types for recursive transformations (DeepReadonly, DeepPartial).

**Why It Matters**: Recursive types model real-world nested data—file systems, DOM trees, organizational charts, nested configuration. TypeScript's type system can express arbitrarily deep nesting while maintaining safety. Schema types can use recursive structures. Component trees can use recursive prop types. This pattern is essential for data structures where depth is unknown at compile time.

## Example 30: Const Assertions

Const assertions (`as const`) make literals and objects deeply readonly with literal types instead of widened types.

**Code**:

```typescript
// WITHOUT const ASSERTION
let str1 = "hello"; // => Type: string (widened from literal)
let num1 = 42; // => Type: number (widened)

str1 = "world"; // => ALLOWED: str1 is mutable string
num1 = 100; // => ALLOWED: num1 is mutable number

// WITH const ASSERTION
let str2 = "hello" as const; // => Type: "hello" (literal type)
let num2 = 42 as const; // => Type: 42 (literal type)

// str2 = "world";                       // => ERROR: Type '"world"' not assignable to '"hello"'
// num2 = 100;                           // => ERROR: Type '100' not assignable to '42'

// CONST ASSERTION ON OBJECTS
const point1 = { x: 10, y: 20 }; // => Type: { x: number; y: number }
point1.x = 15; // => ALLOWED: properties are mutable

const point2 = { x: 10, y: 20 } as const; // => Type: { readonly x: 10; readonly y: 20 }
// => Properties become readonly literals

// point2.x = 15;                        // => ERROR: Cannot assign to readonly property

// CONST ASSERTION ON ARRAYS
const arr1 = [1, 2, 3]; // => Type: number[]
arr1.push(4); // => ALLOWED: array is mutable

const arr2 = [1, 2, 3] as const; // => Type: readonly [1, 2, 3]
// => Becomes readonly tuple with literal types

// arr2.push(4);                         // => ERROR: push doesn't exist on readonly array
// arr2[0] = 10;                         // => ERROR: Cannot assign to readonly index

// CONST ASSERTION FOR ENUM-LIKE OBJECTS
const Colors = {
  // => Without as const
  Red: "red",
  Green: "green",
  Blue: "blue",
}; // => Type: { Red: string; Green: string; Blue: string }

const ColorsConst = {
  Red: "red",
  Green: "green",
  Blue: "blue",
} as const; // => Type: { readonly Red: "red"; readonly Green: "green"; readonly Blue: "blue" }

type Color = (typeof ColorsConst)[keyof typeof ColorsConst]; // => Type: "red" | "green" | "blue"

function setColor(color: Color): void {
  console.log(`Color set to ${color}`);
}

setColor(ColorsConst.Red); // => Output: Color set to red
// setColor("yellow");                   // => ERROR: "yellow" not in Color

// CONST ASSERTION WITH FUNCTION RETURN
function getCoords() {
  return { x: 10, y: 20 } as const; // => Return type: { readonly x: 10; readonly y: 20 }
}

const coords = getCoords(); // => Type inferred as readonly literals
console.log(coords.x); // => Output: 10
// coords.x = 15;                        // => ERROR: readonly property

// CONST ASSERTION FOR ROUTE CONFIGURATION
const routes = [
  { path: "/", component: "Home" },
  { path: "/about", component: "About" },
  { path: "/contact", component: "Contact" },
] as const; // => Readonly tuple with literal types

type Route = (typeof routes)[number]; // => Union of route objects
type RoutePath = (typeof routes)[number]["path"]; // => Type: "/" | "/about" | "/contact"

function navigateTo(path: RoutePath): void {
  console.log(`Navigating to ${path}`);
}

navigateTo("/about"); // => Output: Navigating to /about
// navigateTo("/unknown");               // => ERROR: "/unknown" not in RoutePath
```

**Key Takeaway**: `as const` narrows types to literal types and makes objects/arrays deeply readonly. Use it to prevent widening of literals and to create immutable configurations.

**Why It Matters**: Const assertions eliminate type widening that loses precision. Configuration objects become truly immutable tuples and literal types rather than mutable strings and numbers. React query key factories use const assertions to preserve tuple types for cache invalidation. Route definition objects use const assertions to preserve string literal union types. Without const assertions, routes and config values are widened to `string`, losing the precision needed for type checking.
