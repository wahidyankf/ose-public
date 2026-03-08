---
title: "Intermediate"
date: 2026-02-07T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 31-51: Generics, utility types, decorators, async/await, modules, conditional types, and mapped types (40-75% coverage)"
tags: ["typescript", "tutorial", "by-example", "intermediate", "generics", "decorators", "async", "modules"]
---

Learn intermediate TypeScript through 21 production-ready examples covering generics, utility types, decorators, async patterns, modules, and advanced type transformations.

## Example 31: Generic Functions

Generic functions work with multiple types using type parameters. They provide type safety while remaining flexible.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Generic Function<T>"] --> B["Called with string"]
    A --> C["Called with number"]
    A --> D["Called with custom type"]

    B --> E["Returns T (string)"]
    C --> F["Returns T (number)"]
    D --> G["Returns T (custom)"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```typescript
// BASIC GENERIC FUNCTION
function identity<T>(value: T): T {
  // => T is type parameter
  // => Function preserves input type
  return value; // => Returns same type as input
}

const str = identity<string>("hello"); // => T = string, returns string
const num = identity<number>(42); // => T = number, returns number
const bool = identity(true); // => T inferred as boolean

console.log(str.toUpperCase()); // => Output: HELLO (string method available)
console.log(num.toFixed(2)); // => Output: 42.00 (number method available)

// GENERIC FUNCTION WITH ARRAY
function getFirst<T>(arr: T[]): T | undefined {
  // => T[] is array of T
  // => Returns T or undefined
  return arr[0]; // => First element
}

const firstNumber = getFirst([1, 2, 3]); // => T = number, returns number | undefined
const firstName = getFirst(["a", "b"]); // => T = string, returns string | undefined

console.log(firstNumber); // => Output: 1
console.log(firstName); // => Output: a

// GENERIC FUNCTION WITH MULTIPLE TYPE PARAMETERS
function pair<T, U>(first: T, second: U): [T, U] {
  // => Two type parameters
  // => Returns tuple [T, U]
  return [first, second]; // => Tuple with both types
}

const p1 = pair("name", 30); // => [string, number]
const p2 = pair(true, "yes"); // => [boolean, string]

console.log(p1); // => Output: ["name", 30]
console.log(p2); // => Output: [true, "yes"]

// GENERIC FUNCTION WITH CONSTRAINTS
function getLength<T extends { length: number }>(value: T): number {
  // => T must have length property
  // => Constraint ensures .length exists
  return value.length; // => Safe to access .length
}

console.log(getLength("hello")); // => Output: 5 (string has length)
console.log(getLength([1, 2, 3])); // => Output: 3 (array has length)
// console.log(getLength(42));           // => ERROR: number doesn't have length

// GENERIC FUNCTION FOR OBJECT PROPERTY ACCESS
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  // => K must be key of T
  // => Return type is T[K]
  return obj[key]; // => Type-safe property access
}

const person = { name: "Alice", age: 30 };
const name = getProperty(person, "name"); // => Type: string (inferred from person["name"])
const age = getProperty(person, "age"); // => Type: number (inferred from person["age"])

console.log(name); // => Output: Alice
console.log(age); // => Output: 30
```

**Key Takeaway**: Generic functions use angle brackets `<T>` to define type parameters. They preserve type information across function calls. Use `extends` to constrain generic types. Combine multiple type parameters for complex operations.

**Why It Matters**: Generics eliminate code duplication while maintaining type safety. Array methods like `map<T>`, `filter<T>` are generic—they work with any element type without losing type information. Custom data structures (trees, queues, event emitters) all use generics. Without generics, developers choose between duplicating type definitions or using `any`, sacrificing safety. Generics are the cornerstone of reusable, type-safe library design.

## Example 32: Generic Classes

Generic classes define type parameters at the class level. All methods share the same type parameter scope.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Stack&lt;T&gt;"] -->|"instantiate with string"| B["Stack&lt;string&gt;"]
    A -->|"instantiate with number"| C["Stack&lt;number&gt;"]

    B --> D["push('hello')"]
    B --> E["pop() => string"]
    C --> F["push(42)"]
    C --> G["pop() => number"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style F fill:#CC78BC,stroke:#000,color:#000
```

**Code**:

```typescript
// BASIC GENERIC CLASS
class Box<T> {
  // => T is class-level type parameter
  private value: T; // => Property of type T

  constructor(value: T) {
    // => Constructor accepts T
    this.value = value; // => Initialize with T value
  }

  getValue(): T {
    // => Returns T
    return this.value;
  }

  setValue(value: T): void {
    // => Accepts T
    this.value = value;
  }
}

const stringBox = new Box<string>("hello"); // => T = string
console.log(stringBox.getValue()); // => Output: hello

const numberBox = new Box(42); // => T inferred as number
console.log(numberBox.getValue()); // => Output: 42

// GENERIC CLASS WITH MULTIPLE TYPE PARAMETERS
class Pair<K, V> {
  // => Two type parameters
  constructor(
    public key: K,
    public value: V,
  ) {} // => Key-value pair

  toString(): string {
    return `${this.key}: ${this.value}`;
  }
}

const pair1 = new Pair("name", "Alice"); // => K = string, V = string
const pair2 = new Pair(1, true); // => K = number, V = boolean

console.log(pair1.toString()); // => Output: name: Alice
console.log(pair2.toString()); // => Output: 1: true

// GENERIC CLASS WITH CONSTRAINTS
class NumberBox<T extends number> {
  // => T must be number subtype
  constructor(private value: T) {}

  add(x: T): number {
    // => Arithmetic operations safe
    return this.value + x;
  }
}

const numBox = new NumberBox(10);
console.log(numBox.add(5)); // => Output: 15

// GENERIC CLASS FOR DATA STRUCTURES
class Stack<T> {
  // => Generic stack
  private items: T[] = []; // => Array of T

  push(item: T): void {
    // => Add item of type T
    this.items.push(item);
  }

  pop(): T | undefined {
    // => Remove and return T
    return this.items.pop();
  }

  peek(): T | undefined {
    // => View top without removing
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>(); // => Stack of numbers
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);

console.log(numberStack.pop()); // => Output: 3
console.log(numberStack.peek()); // => Output: 2

const stringStack = new Stack<string>(); // => Stack of strings
stringStack.push("a");
stringStack.push("b");

console.log(stringStack.pop()); // => Output: b
```

**Key Takeaway**: Generic classes use `<T>` after the class name to define type parameters. All methods and properties can use the type parameter. Instantiate with specific types or let TypeScript infer from constructor arguments.

**Why It Matters**: Generic classes power data structures (Stack, Queue, LinkedList) that work with any type. Component classes can use generics for typed stores. Repository patterns use generics for typed CRUD operations—`Repository<User>` ensures `findById` returns `User`, not `any`. Without generic classes, every data structure needs separate typed implementations. In React, generic hooks and context providers rely on the same principles.

## Example 33: Generic Interfaces

Generic interfaces define contracts with type parameters. They're used for function shapes, object structures, and API contracts.

**Code**:

```typescript
// BASIC GENERIC INTERFACE
interface Container<T> {
  // => Generic interface
  value: T; // => Property of type T
  getValue(): T; // => Method returning T
  setValue(value: T): void; // => Method accepting T
}

class StringContainer implements Container<string> {
  // => Implements with string
  constructor(public value: string) {}

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

const container = new StringContainer("hello");
console.log(container.getValue()); // => Output: hello

// GENERIC INTERFACE FOR API RESPONSES
interface ApiResponse<T> {
  // => Generic response shape
  data: T; // => Data payload of type T
  status: number; // => HTTP status code
  message: string; // => Response message
}

interface User {
  id: number;
  name: string;
}

const userResponse: ApiResponse<User> = {
  // => T = User
  data: { id: 1, name: "Alice" },
  status: 200,
  message: "Success",
};

console.log(userResponse.data.name); // => Output: Alice

// GENERIC INTERFACE WITH MULTIPLE TYPE PARAMETERS
interface KeyValuePair<K, V> {
  // => Two type parameters
  key: K;
  value: V;
}

const pair1: KeyValuePair<string, number> = {
  key: "age",
  value: 30,
};

const pair2: KeyValuePair<number, boolean> = {
  key: 1,
  value: true,
};

console.log(pair1); // => Output: { key: 'age', value: 30 }

// GENERIC INTERFACE FOR FUNCTION SIGNATURES
interface Transformer<T, U> {
  // => Function interface
  (input: T): U; // => Takes T, returns U
}

const toUpperCase: Transformer<string, string> = (str) => str.toUpperCase();
const stringLength: Transformer<string, number> = (str) => str.length;

console.log(toUpperCase("hello")); // => Output: HELLO
console.log(stringLength("world")); // => Output: 5

// GENERIC INTERFACE WITH INDEX SIGNATURE
interface Dictionary<T> {
  // => Generic dictionary
  [key: string]: T; // => Any string key maps to T
}

const scores: Dictionary<number> = {
  alice: 95,
  bob: 87,
  charlie: 92,
};

console.log(scores.alice); // => Output: 95
```

**Key Takeaway**: Generic interfaces use `<T>` to parameterize contracts. They're used for API response shapes, data structures, and function signatures. Classes implementing generic interfaces must specify concrete types.

**Why It Matters**: Generic interfaces define contracts for libraries and frameworks. API responses use `Response<T>` to carry typed data. Promise chains use `Promise<T>` for typed resolution. Dependency injection containers use generic interfaces for typed service registration. Without generic interfaces, library consumers receive `any` and lose type safety at integration boundaries—the most common source of runtime errors in large TypeScript applications.

## Example 34: Utility Types in API Design - Partial and Required

`Partial<T>` and `Required<T>` are covered in Beginner Example 18 at the syntax level. This example focuses on combining them with other utility types for real-world API patterns: PATCH endpoints, configuration validation, and composed transformations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["User {name: string, email: string, age: number}"] -->|"Partial<User>"| B["Partial<User> {name?, email?, age?}"]
    A -->|"Required<User>"| C["Required<User> {name!, email!, age!}"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```typescript
// BASE INTERFACE
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// PARTIAL<T> - ALL PROPERTIES OPTIONAL
type PartialUser = Partial<User>; // => { id?: number; name?: string; ... }

function updateUser(id: number, updates: PartialUser): void {
  console.log(`Updating user ${id}`, updates);
}

updateUser(1, { name: "Alice" }); // => Only name updated
updateUser(2, { age: 31, email: "bob@example.com" }); // => Partial update

// PRACTICAL USE CASE - PATCH ENDPOINT
function patchUser(id: number, data: Partial<Omit<User, "id">>): User {
  // => Partial update without id field
  const existing: User = {
    // => Fetch existing user (mocked)
    id,
    name: "Original",
    email: "original@example.com",
    age: 25,
  };

  return { ...existing, ...data }; // => Merge updates
}

const updated = patchUser(1, { name: "Updated" });
console.log(updated); // => Output: { id: 1, name: 'Updated', email: 'original@example.com', age: 25 }

// REQUIRED<T> - ALL PROPERTIES REQUIRED
interface Config {
  // => Config with optional fields
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>; // => All fields become required
// => { host: string; port: number; debug: boolean }

function loadConfig(config: RequiredConfig): void {
  console.log(`Server: ${config.host}:${config.port}, Debug: ${config.debug}`);
}

const config: RequiredConfig = {
  // => Must provide all fields
  host: "localhost",
  port: 3000,
  debug: true,
};

loadConfig(config); // => Output: Server: localhost:3000, Debug: true

// COMBINING PARTIAL AND REQUIRED
interface FormData {
  username: string;
  email: string;
  password?: string;
  newsletter?: boolean;
}

type FormUpdate = Partial<Required<FormData>>; // => All fields optional (but defined)
// => Useful for form state

const formUpdate: FormUpdate = {
  username: "alice",
  email: "alice@example.com",
};

console.log(formUpdate); // => Output: { username: 'alice', email: 'alice@example.com' }
```

**Key Takeaway**: `Partial<T>` makes all properties optional for update operations. `Required<T>` makes all properties required for validation. Combine them with other utility types for complex transformations.

**Why It Matters**: `Partial<T>` eliminates boilerplate for update DTOs in REST APIs. Instead of defining separate `UserUpdate` interfaces, `Partial<User>` makes all fields optional automatically. `Required<T>` enforces complete configurations where defaults are not safe—database connection configs must have all fields present. These two utilities are the most-used TypeScript utility types in production codebases with server-side data handling.

## Example 35: Utility Types in Security Patterns - Pick and Omit

`Pick<T, K>` and `Omit<T, K>` are covered in Beginner Example 18 at the syntax level. This example demonstrates security-focused patterns: stripping sensitive fields from API responses, creating focused view models, and composing complex type transformations for multi-layer architectures.

**Code**:

```typescript
// BASE INTERFACE
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// PICK<T, K> - SELECT PROPERTIES
type UserPreview = Pick<User, "id" | "name">; // => Only id and name
// => { id: number; name: string }

const preview: UserPreview = {
  id: 1,
  name: "Alice",
};

console.log(preview); // => Output: { id: 1, name: 'Alice' }

// OMIT<T, K> - EXCLUDE PROPERTIES
type UserWithoutPassword = Omit<User, "password">; // => All except password
// => Safe for API responses

const safeUser: UserWithoutPassword = {
  id: 1,
  name: "Bob",
  email: "bob@example.com",
  createdAt: new Date(),
};

console.log(safeUser); // => Output: { id: 1, name: 'Bob', ... }

// PRACTICAL USE CASE - API DTOs
type CreateUserDTO = Omit<User, "id" | "createdAt">; // => Client provides everything except generated fields

function createUser(data: CreateUserDTO): User {
  return {
    ...data,
    id: Math.floor(Math.random() * 1000), // => Generate id
    createdAt: new Date(), // => Set timestamp
  };
}

const newUser = createUser({
  name: "Charlie",
  email: "charlie@example.com",
  password: "secret123",
});

console.log(newUser); // => Output: { id: ..., name: 'Charlie', ... }

// COMBINING PICK AND PARTIAL
type UpdateUserDTO = Partial<Pick<User, "name" | "email">>; // => Optional name and email only

function updateUserInfo(id: number, data: UpdateUserDTO): void {
  console.log(`Updating user ${id}`, data);
}

updateUserInfo(1, { name: "Updated Name" }); // => Partial update of allowed fields

// OMIT MULTIPLE PROPERTIES
type PublicUser = Omit<User, "password" | "createdAt">; // => Exclude sensitive/internal fields

const publicUser: PublicUser = {
  id: 1,
  name: "Diana",
  email: "diana@example.com",
};

console.log(publicUser); // => Output: { id: 1, name: 'Diana', email: 'diana@example.com' }
```

**Key Takeaway**: `Pick<T, K>` extracts specific properties for focused DTOs. `Omit<T, K>` removes properties for safe public interfaces. Combine with `Partial` for flexible update types.

**Why It Matters**: These utilities prevent type duplication in layered architectures. Database models have all fields; API responses use `Omit<Model, "password">` for security; Create DTOs use `Omit<Model, "id">` for client input. Frontend forms use `Pick<Model, "name" | "email">` for focused types. Without these utilities, developers manually maintain parallel type definitions that drift out of sync when models evolve.

## Example 36: Decorators (Experimental)

Decorators add metadata and behavior to classes, methods, properties, and parameters. They're used in frameworks for dependency injection and routing.

**Prerequisite**: Requires `"experimentalDecorators": true` in tsconfig.json for legacy decorators. TypeScript 5.0+ supports a new decorator syntax (TC39 Stage 3) that does NOT require this flag. Legacy and new decorators are not compatible - choose one approach per project.

**Code**:

```typescript
// CLASS DECORATOR
function Sealed(constructor: Function) {
  // => Decorator function
  Object.seal(constructor); // => Prevent modifications
  Object.seal(constructor.prototype); // => Seal prototype too
}

@Sealed // => Apply decorator to class
class Person {
  constructor(public name: string) {}
}

const person = new Person("Alice");
console.log(person.name); // => Output: Alice

// METHOD DECORATOR
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  // => target: class prototype
  // => propertyKey: method name
  // => descriptor: method descriptor

  const originalMethod = descriptor.value; // => Save original method

  descriptor.value = function (...args: any[]) {
    // => Wrap method
    console.log(`Calling ${propertyKey} with`, args);
    const result = originalMethod.apply(this, args); // => Call original
    console.log(`Result:`, result);
    return result;
  };

  return descriptor; // => Return modified descriptor
}

class Calculator {
  @Log // => Apply to method
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(5, 3); // => Output: Calling add with [5, 3]
// => Output: Result: 8

// PROPERTY DECORATOR
function ReadOnly(target: any, propertyKey: string) {
  // => target: class prototype
  // => propertyKey: property name

  const descriptor: PropertyDescriptor = {
    writable: false, // => Make property readonly
    configurable: false,
  };

  Object.defineProperty(target, propertyKey, descriptor);
}

class User {
  @ReadOnly // => Apply to property
  id: number = 1;

  name: string = "Alice";
}

const user = new User();
console.log(user.id); // => Output: 1
// user.id = 2;                          // => ERROR (in strict mode)

// PARAMETER DECORATOR
function LogParam(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Parameter ${parameterIndex} in ${propertyKey}`);
}

class Service {
  greet(@LogParam name: string): void {
    // => Decorate parameter
    console.log(`Hello, ${name}`);
  }
}

const service = new Service();
service.greet("Bob"); // => Output: Parameter 0 in greet
// => Output: Hello, Bob

// DECORATOR FACTORY
function MinLength(min: number) {
  // => Decorator factory (returns decorator)
  return function (target: any, propertyKey: string) {
    let value: string;

    const getter = () => value;
    const setter = (newVal: string) => {
      if (newVal.length < min) {
        throw new Error(`${propertyKey} must be at least ${min} characters`);
      }
      value = newVal;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
    });
  };
}

class Account {
  @MinLength(6) // => Factory called with argument
  password: string = "";
}

const account = new Account();
// account.password = "123";             // => ERROR: password must be at least 6 characters
account.password = "secure123"; // => VALID
console.log(account.password); // => Output: secure123
```

**Key Takeaway**: Decorators use `@` syntax to modify classes, methods, properties, and parameters. Decorator factories accept parameters and return decorators. Enable with `experimentalDecorators` compiler option.

**Why It Matters**: Decorators enable declarative programming patterns. Frameworks use decorators for dependency injection, routing, and validation—Angular, NestJS, and TypeORM all rely heavily on experimental decorators. With TypeScript 5.0+, standard decorators are now part of the language specification. Production codebases using these frameworks must understand decorator mechanics to debug injection errors, middleware composition, and property metadata at runtime.

## Example 37: Async/Await and Promises

TypeScript provides strong typing for Promises and async/await patterns. This enables type-safe asynchronous programming.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant Caller
    participant Async Function
    participant Promise

    Caller->>+Async Function: await fetchData()
    Async Function->>+Promise: Create Promise<T>
    Promise-->>-Async Function: Resolve with T
    Async Function-->>-Caller: Return T

    style Caller fill:#0173B2,color:#fff
    style Async Function fill:#DE8F05,color:#fff
    style Promise fill:#029E73,color:#fff
```

**Code**:

```typescript
// BASIC PROMISE
function delay(ms: number): Promise<void> {
  // => Returns Promise<void>
  return new Promise<void>((resolve) => {
    // => Generic Promise type
    setTimeout(resolve, ms); // => Resolve after delay
  });
}

delay(1000).then(() => {
  // => then() receives void
  console.log("1 second passed"); // => Output after 1 second
});

// PROMISE WITH TYPED RESULT
function fetchUser(id: number): Promise<{ id: number; name: string }> {
  // => Promise resolves to User object
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: "Alice" }); // => Resolve with User
    }, 500);
  });
}

fetchUser(1).then((user) => {
  // => user type inferred as User
  console.log(user.name); // => Output: Alice (after 500ms)
});

// ASYNC/AWAIT
async function getUserData(id: number): Promise<string> {
  // => async function returns Promise
  // => Explicit Promise<string> return type
  const user = await fetchUser(id); // => await unwraps Promise<User> to User
  // => user type: { id: number; name: string }
  return user.name; // => Returns string (wrapped in Promise by async)
}

getUserData(1).then((name) => {
  console.log(name); // => Output: Alice
});

// ERROR HANDLING WITH TRY/CATCH
async function fetchData(): Promise<string> {
  try {
    const response = await fetch("https://api.example.com/data");
    // => response type: Response
    const data = await response.json(); // => data type: any (JSON parse)
    return data.value; // => Return string
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error; // => Re-throw for caller
  }
}

// PROMISE.ALL WITH TYPING
async function fetchMultiple(): Promise<[number, string, boolean]> {
  // => Returns tuple type
  const [num, str, bool] = await Promise.all([
    // => Destructure tuple
    Promise.resolve(42), // => Promise<number>
    Promise.resolve("hello"), // => Promise<string>
    Promise.resolve(true), // => Promise<boolean>
  ]); // => Promise.all infers tuple type

  return [num, str, bool]; // => Return tuple
}

fetchMultiple().then(([n, s, b]) => {
  console.log(n, s, b); // => Output: 42 hello true
});

// GENERIC ASYNC FUNCTION
async function fetchJson<T>(url: string): Promise<T> {
  // => Generic async function
  const response = await fetch(url); // => Fetch data
  const data = await response.json(); // => Parse JSON
  return data as T; // => Assert type T
}

interface User {
  id: number;
  name: string;
}

async function getUser(id: number): Promise<User> {
  return fetchJson<User>(`https://api.example.com/users/${id}`);
  // => T = User, returns Promise<User>
}

// ASYNC GENERATOR
async function* generateNumbers(): AsyncGenerator<number> {
  // => Async generator type
  yield 1; // => Yield number
  await delay(100); // => Async delay
  yield 2;
  await delay(100);
  yield 3;
}

(async () => {
  for await (const num of generateNumbers()) {
    // => for await loop
    console.log(num); // => Output: 1, 2, 3 (with delays)
  }
})();
```

**Key Takeaway**: Use `Promise<T>` for asynchronous values. `async` functions automatically return Promises. `await` unwraps Promises to their resolved types. Use `try/catch` for error handling. `Promise.all` infers tuple types from input promises.

**Why It Matters**: Type-safe async code prevents bugs from incorrect return types and missing error handling. API clients use `Promise<User>` to ensure callers handle the typed response correctly. Async iterators use `AsyncIterableIterator<T>` for typed streaming data. Without typed async, race conditions and unhandled rejections are harder to detect at compile time. In production applications handling payment processing or data pipelines, typed async is non-negotiable.

## Example 38: Modules and Namespaces

TypeScript supports ES modules (`import`/`export`) and namespaces for organizing code. Prefer ES modules for modern development.

**Code**:

```typescript
// NAMED EXPORTS (math.ts)
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export const PI = 3.14159;

// NAMED IMPORTS (main.ts)
import { add, subtract, PI } from "./math";

console.log(add(5, 3)); // => Output: 8
console.log(PI); // => Output: 3.14159

// DEFAULT EXPORT (calculator.ts)
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// DEFAULT IMPORT (main.ts)
import Calculator from "./calculator";

const calc = new Calculator();
console.log(calc.add(10, 5)); // => Output: 15

// RE-EXPORTS (index.ts)
export { add, subtract } from "./math";
export { default as Calculator } from "./calculator";

// IMPORT ALL (main.ts)
import * as math from "./math";

console.log(math.add(2, 3)); // => Output: 5
console.log(math.PI); // => Output: 3.14159

// TYPE-ONLY IMPORTS
import type { User } from "./types"; // => Import only type (erased at runtime)

const user: User = {
  // => Use type
  id: 1,
  name: "Alice",
};

// NAMESPACE (LEGACY PATTERN)
namespace Validation {
  // => Namespace declaration
  export interface StringValidator {
    // => Exported interface
    isValid(s: string): boolean;
  }

  export class EmailValidator implements StringValidator {
    isValid(s: string): boolean {
      return s.includes("@");
    }
  }
}

const emailValidator = new Validation.EmailValidator();
console.log(emailValidator.isValid("test@example.com")); // => Output: true

// MERGING NAMESPACES
namespace Animals {
  export class Dog {}
}

namespace Animals {
  // => Same namespace name
  export class Cat {} // => Merges with previous
}

const dog = new Animals.Dog();
const cat = new Animals.Cat();

// AMBIENT MODULES (DECLARE MODULE)
declare module "legacy-lib" {
  // => Declare types for JS library
  export function doSomething(): void;
}

import { doSomething } from "legacy-lib"; // => TypeScript knows about it
```

**Key Takeaway**: Use ES modules (`import`/`export`) for modern TypeScript. Default exports for single exports, named exports for multiple. Type-only imports (`import type`) optimize bundle size. Namespaces are legacy—prefer ES modules.

**Why It Matters**: Module systems enable code organization and tree-shaking. ES modules integrate with bundlers for optimal production bundles. Type-only imports prevent circular dependency runtime errors while maintaining compile-time type checking. Namespace augmentation allows extending third-party library types without forking. Understanding module resolution is essential for debugging import errors in monorepos and multi-package TypeScript projects.

## Example 39: Conditional Types with Distributive Behavior

Conditional types distribute over union types automatically. This enables powerful type transformations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["ToArray&lt;string | number&gt;"] -->|"distributes"| B["ToArray&lt;string&gt;"]
    A -->|"distributes"| C["ToArray&lt;number&gt;"]
    B --> D["string[]"]
    C --> E["number[]"]
    D -->|"union result"| F["string[] | number[]"]
    E --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#000
```

**Code**:

```typescript
// BASIC CONDITIONAL TYPE
type IsString<T> = T extends string ? "yes" : "no";

type Test1 = IsString<string>; // => Type: "yes"
type Test2 = IsString<number>; // => Type: "no"

// DISTRIBUTIVE CONDITIONAL TYPE
type ToArray<T> = T extends any ? T[] : never; // => Wraps each union member in array

type StringOrNumber = string | number;
type ArrayTypes = ToArray<StringOrNumber>; // => Type: string[] | number[]
// => NOT (string | number)[]

// CONDITIONAL TYPE WITH INFER
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
// => If Promise, extract inner type
// => Otherwise return T as-is

type UnwrappedString = UnwrapPromise<Promise<string>>; // => Type: string
type UnwrappedNumber = UnwrapPromise<number>; // => Type: number

// FILTERING UNION WITH CONDITIONAL TYPES
type Filter<T, U> = T extends U ? T : never; // => Keep T if extends U
// => Otherwise return never

type OnlyStrings = Filter<string | number | boolean, string>; // => Type: string

// EXTRACTING FUNCTION RETURN TYPES
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getString(): string {
  return "hello";
}

function getNumber(): number {
  return 42;
}

type StringReturn = ReturnType<typeof getString>; // => Type: string
type NumberReturn = ReturnType<typeof getNumber>; // => Type: number

// EXTRACTING FUNCTION PARAMETERS
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function greet(name: string, age: number): void {
  console.log(`${name} is ${age}`);
}

type GreetParams = Parameters<typeof greet>; // => Type: [string, number]

const params: GreetParams = ["Alice", 30];
greet(...params); // => Output: Alice is 30

// CONDITIONAL TYPE FOR FLATTENING
type Flatten<T> = T extends Array<infer U> ? U : T;

type Flattened = Flatten<string[]>; // => Type: string
type NotFlattened = Flatten<number>; // => Type: number

// PRACTICAL EXAMPLE - API ERROR HANDLING
type ApiResult<T> = T extends { error: any } ? never : T; // => Filter error types

interface SuccessResponse {
  data: string;
}

interface ErrorResponse {
  error: string;
}

type ValidResponses = ApiResult<SuccessResponse | ErrorResponse>;
// => Type: SuccessResponse
// => ErrorResponse filtered out
```

**Key Takeaway**: Conditional types use `T extends U ? X : Y` syntax. They distribute over unions automatically. Use `infer` to extract types from complex structures. Combine with utility types for powerful transformations.

**Why It Matters**: Conditional types enable advanced type-level programming. `ReturnType`, `Parameters`, and `Awaited` are built with conditional types. Type-safe dependency injection containers infer service types from factory functions. Schema validation libraries derive TypeScript types from runtime validators, keeping types and validation logic in sync. Without conditional types, these derivations require manual maintenance and inevitably drift.

## Example 40: Mapped Types with Key Remapping

Mapped types iterate over object keys. Key remapping (`as` clause) transforms key names during iteration.

**Code**:

```typescript
// BASIC MAPPED TYPE
type Readonly<T> = {
  // => Makes all properties readonly
  readonly [P in keyof T]: T[P];
};

interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>; // => { readonly id: number; readonly name: string }

// MAPPED TYPE WITH MODIFIERS
type Optional<T> = {
  // => Makes all properties optional
  [P in keyof T]?: T[P];
};

type OptionalUser = Optional<User>; // => { id?: number; name?: string }

// KEY REMAPPING WITH 'as'
type Getters<T> = {
  // => Transform keys to getters
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

type UserGetters = Getters<User>; // => { getId: () => number; getName: () => string }

const userGetters: UserGetters = {
  getId: () => 1,
  getName: () => "Alice",
};

console.log(userGetters.getId()); // => Output: 1

// FILTERING KEYS WITH KEY REMAPPING
type PickByType<T, U> = {
  // => Pick properties of type U
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

interface Mixed {
  id: number;
  name: string;
  age: number;
  active: boolean;
}

type OnlyNumbers = PickByType<Mixed, number>; // => { id: number; age: number }

const numbers: OnlyNumbers = {
  id: 1,
  age: 30,
};

console.log(numbers); // => Output: { id: 1, age: 30 }

// REMOVING PROPERTIES WITH never
type OmitByType<T, U> = {
  // => Omit properties of type U
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

type WithoutNumbers = OmitByType<Mixed, number>; // => { name: string; active: boolean }

const withoutNums: WithoutNumbers = {
  name: "Bob",
  active: true,
};

console.log(withoutNums); // => Output: { name: 'Bob', active: true }

// TEMPLATE LITERAL KEY TRANSFORMATION
type EventHandlers<T> = {
  // => Create event handlers
  [P in keyof T as `on${Capitalize<string & P>}Change`]: (value: T[P]) => void;
};

interface FormData {
  username: string;
  email: string;
  age: number;
}

type FormHandlers = EventHandlers<FormData>;
// => { onUsernameChange: (value: string) => void; ... }

const handlers: FormHandlers = {
  onUsernameChange: (value) => console.log("Username:", value),
  onEmailChange: (value) => console.log("Email:", value),
  onAgeChange: (value) => console.log("Age:", value),
};

handlers.onUsernameChange("alice"); // => Output: Username: alice

// CONDITIONAL MAPPED TYPE
type Nullish<T> = {
  // => Make properties nullable
  [P in keyof T]: T[P] | null;
};

type NullishUser = Nullish<User>; // => { id: number | null; name: string | null }

const nullUser: NullishUser = {
  id: null,
  name: "Charlie",
};

console.log(nullUser); // => Output: { id: null, name: 'Charlie' }
```

**Key Takeaway**: Mapped types use `[P in keyof T]` to iterate over keys. Key remapping with `as` transforms key names. Use template literals for pattern-based transformations. Return `never` to exclude keys.

**Why It Matters**: Mapped types with key remapping enable advanced type transformations. ORM libraries generate `findByX` methods for each field. Form libraries create `onXChange` handlers. GraphQL code generators transform schema fields to resolver types. Without key remapping, developers write repetitive type definitions for every property variant. This pattern eliminates hundreds of lines of manual type definitions in well-typed TypeScript libraries.

## Example 41: Function Overloading

Function overloading allows multiple function signatures for the same function name. TypeScript checks signatures at compile time and routes to the single implementation.

**Code**:

```typescript
// FUNCTION OVERLOAD SIGNATURES
function combine(a: string, b: string): string; // => Signature 1: string + string
function combine(a: number, b: number): number; // => Signature 2: number + number
function combine(a: string | number, b: string | number): string | number {
  // => Implementation
  if (typeof a === "string" && typeof b === "string") {
    return a + b; // => String concatenation
  }
  if (typeof a === "number" && typeof b === "number") {
    return a + b; // => Numeric addition
  }
  throw new Error("Invalid arguments");
}

const str = combine("Hello", " World"); // => Type: string (matches signature 1)
const num = combine(10, 20); // => Type: number (matches signature 2)

console.log(str); // => Output: Hello World
console.log(num); // => Output: 30

// OVERLOAD WITH DIFFERENT PARAMETER COUNTS
function makeDate(timestamp: number): Date; // => Signature 1: single number
function makeDate(year: number, month: number, day: number): Date; // => Signature 2: three numbers
function makeDate(yearOrTimestamp: number, month?: number, day?: number): Date {
  // => Implementation
  if (month !== undefined && day !== undefined) {
    return new Date(yearOrTimestamp, month, day); // => Create from Y/M/D
  }
  return new Date(yearOrTimestamp); // => Create from timestamp
}

const date1 = makeDate(1640000000000); // => From timestamp
const date2 = makeDate(2025, 11, 25); // => From Y/M/D

console.log(date1); // => Output: Date object
console.log(date2); // => Output: Date object

// OVERLOAD WITH OBJECT PARAMETER
function processInput(input: string): string[]; // => Signature: string returns array
function processInput(input: number): number[]; // => Signature: number returns array
function processInput(input: string | number): (string | number)[] {
  // => Implementation
  if (typeof input === "string") {
    return input.split(""); // => Split string into chars
  }
  return [input]; // => Wrap number in array
}

const chars = processInput("hello"); // => Type: string[] (matches first signature)
const nums = processInput(42); // => Type: number[] (matches second signature)

console.log(chars); // => Output: ['h', 'e', 'l', 'l', 'o']
console.log(nums); // => Output: [42]
```

**Key Takeaway**: Function overloads provide multiple type signatures for a single implementation. The implementation must handle all overload cases. TypeScript uses the most specific matching signature.

**Why It Matters**: Overloading enables type-safe APIs with flexible call patterns. DOM APIs use overloads extensively—`createElement("canvas")` returns `HTMLCanvasElement`, not just `HTMLElement`. React's `useReducer` uses overloads for different argument patterns. Without overloads, functions that accept multiple argument shapes return union types, forcing callers to narrow the return type manually. Good overload design is what separates library-grade TypeScript from application-grade TypeScript.

## Example 42: Abstract Classes and Interfaces Compared

Abstract classes provide partial implementations. Interfaces define pure contracts. Combine them for flexible designs.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Interface<br/>(Pure Contract)"] --> C["Concrete Class"]
    B["Abstract Class<br/>(Partial Implementation)"] --> C

    C --> D["Full Implementation"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```typescript
// INTERFACE - PURE CONTRACT
interface Flyable {
  // => Interface defines contract
  fly(): void; // => No implementation
  maxAltitude: number; // => Property signature
}

// ABSTRACT CLASS - PARTIAL IMPLEMENTATION
abstract class Animal {
  // => Cannot instantiate directly
  constructor(public name: string) {} // => Concrete constructor

  abstract makeSound(): void; // => Abstract method (no implementation)

  move(): void {
    // => Concrete method (has implementation)
    console.log(`${this.name} is moving`);
  }
}

// CONCRETE CLASS IMPLEMENTING BOTH
class Bird extends Animal implements Flyable {
  // => Extends abstract, implements interface
  maxAltitude: number = 10000; // => Implement interface property

  constructor(name: string) {
    super(name); // => Call parent constructor
  }

  makeSound(): void {
    // => Implement abstract method
    console.log("Chirp!");
  }

  fly(): void {
    // => Implement interface method
    console.log(`${this.name} is flying`);
  }
}

const bird = new Bird("Eagle");
bird.makeSound(); // => Output: Chirp!
bird.move(); // => Output: Eagle is moving (inherited)
bird.fly(); // => Output: Eagle is flying

// MULTIPLE INTERFACES
interface Swimmable {
  swim(): void;
}

class Duck extends Animal implements Flyable, Swimmable {
  // => Multiple interfaces
  maxAltitude: number = 5000;

  makeSound(): void {
    console.log("Quack!");
  }

  fly(): void {
    console.log(`${this.name} is flying low`);
  }

  swim(): void {
    // => Implement second interface
    console.log(`${this.name} is swimming`);
  }
}

const duck = new Duck("Mallard");
duck.fly(); // => Output: Mallard is flying low
duck.swim(); // => Output: Mallard is swimming
```

**Key Takeaway**: Use interfaces for pure contracts supporting multiple inheritance. Use abstract classes for shared implementation code. A class can extend one abstract class but implement multiple interfaces.

**Why It Matters**: Interfaces enable composition over inheritance. Components implement multiple interfaces (Props, State, LifecycleMethods) without deep inheritance chains. Abstract classes provide template method patterns with shared implementation. The key rule: use interfaces for pure contracts and when multiple inheritance is needed, use abstract classes when sharing implementation logic. Understanding this distinction drives TypeScript architecture decisions for large-scale applications.

## Example 43: Module Augmentation

Module augmentation adds declarations to existing modules. It's used to extend third-party libraries without modifying their source.

**Code**:

```typescript
// AUGMENT GLOBAL NAMESPACE
declare global {
  // => Augment global scope
  interface Window {
    // => Extend Window interface
    myCustomProperty: string; // => Add new property
  }
}

window.myCustomProperty = "Hello"; // => Now type-safe
console.log(window.myCustomProperty); // => Output: Hello

// AUGMENT EXTERNAL MODULE
declare module "some-library" {
  // => Augment external module
  export interface LibraryConfig {
    // => Extend existing interface
    newOption?: boolean; // => Add optional property
  }
}

// AUGMENT MODULE WITH NEW EXPORTS
declare module "express" {
  // => Augment Express
  interface Request {
    // => Extend Request interface
    user?: {
      // => Add custom property
      id: number;
      name: string;
    };
  }
}

// Now Request.user is type-safe in Express handlers
// import { Request, Response } from "express";
// function handler(req: Request, res: Response) {
//     console.log(req.user?.name);     // => Type-safe access
// }

// NAMESPACE AUGMENTATION
namespace MathUtils {
  // => Original namespace
  export function add(a: number, b: number): number {
    return a + b;
  }
}

namespace MathUtils {
  // => Augment same namespace
  export function multiply(a: number, b: number): number {
    // => Add new function
    return a * b;
  }
}

console.log(MathUtils.add(2, 3)); // => Output: 5
console.log(MathUtils.multiply(2, 3)); // => Output: 6

// AUGMENT ARRAY PROTOTYPE
interface Array<T> {
  // => Extend built-in Array
  first(): T | undefined; // => Add custom method
}

Array.prototype.first = function <T>(this: T[]): T | undefined {
  // => Implementation
  return this[0]; // => Return first element
};

const numbers = [1, 2, 3];
console.log(numbers.first()); // => Output: 1 (type-safe)
```

**Key Takeaway**: Module augmentation extends existing types without modifying source code. Use `declare module` for external modules, `declare global` for global scope. Namespaces can be augmented by declaring them again.

**Why It Matters**: Augmentation enables adding types to JavaScript libraries. Middleware adds properties to Express Request objects. Libraries add methods to built-in types. Testing frameworks add matchers to global types. Without augmentation, developers resort to type casts or `any`, losing safety at integration points. Module augmentation is the professional way to extend third-party types in enterprise TypeScript projects.

## Example 44: This Type and Polymorphic This

The `this` type refers to the current class type. It enables fluent interfaces and method chaining with proper inheritance.

**Code**:

```typescript
// BASIC this TYPE
class BasicCalculator {
  constructor(protected value: number = 0) {}

  add(n: number): this {
    // => Returns this type (not BasicCalculator)
    this.value += n; // => Modify state
    return this; // => Return self for chaining
  }

  subtract(n: number): this {
    this.value -= n;
    return this;
  }

  getValue(): number {
    return this.value;
  }
}

const calc1 = new BasicCalculator(10);
const result1 = calc1.add(5).subtract(3).getValue(); // => Method chaining
console.log(result1); // => Output: 12

// POLYMORPHIC this IN INHERITANCE
class ScientificCalculator extends BasicCalculator {
  multiply(n: number): this {
    // => this type adapts to subclass
    this.value *= n;
    return this;
  }

  divide(n: number): this {
    this.value /= n;
    return this;
  }
}

const calc2 = new ScientificCalculator(10);
const result2 = calc2
  .add(5) // => Returns ScientificCalculator, not BasicCalculator
  .multiply(2) // => multiply() available (subclass method)
  .divide(3) // => divide() available
  .getValue();

console.log(result2); // => Output: 10

// this PARAMETER TYPE
interface Drawable {
  draw(this: CanvasRenderingContext2D): void; // => this must be CanvasRenderingContext2D
}

const shape: Drawable = {
  draw(this: CanvasRenderingContext2D) {
    // => Explicit this type
    this.fillRect(0, 0, 100, 100); // => Type-safe canvas methods
  },
};

// shape.draw();                         // => ERROR: this context wrong
// Must call with proper context: shape.draw.call(canvasContext)

// BUILDER PATTERN WITH this
class QueryBuilder<T> {
  private conditions: string[] = [];

  where(condition: string): this {
    // => Fluent interface
    this.conditions.push(condition);
    return this;
  }

  orderBy(field: string): this {
    this.conditions.push(`ORDER BY ${field}`);
    return this;
  }

  build(): string {
    return this.conditions.join(" ");
  }
}

const query = new QueryBuilder<User>().where("age > 18").where("active = true").orderBy("name").build();

console.log(query); // => Output: age > 18 active = true ORDER BY name
```

**Key Takeaway**: The `this` type refers to the actual instance type, enabling proper method chaining in inheritance hierarchies. Use explicit `this` parameters to enforce calling context.

**Why It Matters**: Polymorphic `this` enables fluent APIs that work correctly with inheritance. Method chaining libraries like query builders use `this` return types so subclass methods return the subclass type, not the base type. Without polymorphic `this`, subclass method chains lose type information and return the parent type. This pattern is essential for framework base classes that expect users to extend them while preserving fluent interfaces.

## Example 45: Branded Types (Nominal Typing)

Branded types create distinct types from the same underlying type. They prevent mixing incompatible values that have the same structure.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["string (unbranded)"] -->|"brand as UserId"| B["UserId = string & {_brand: UserId}"]
    A -->|"brand as ProductId"| C["ProductId = string & {_brand: ProductId}"]

    B -->|"not assignable to"| C
    C -->|"not assignable to"| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
```

**Code**:

```typescript
// BRANDED TYPE PATTERN
type Brand<K, T> = K & { __brand: T }; // => Intersection with brand marker

type UserId = Brand<number, "UserId">; // => Branded number type
type ProductId = Brand<number, "ProductId">; // => Different branded number type

// CONSTRUCTOR FUNCTIONS (SAFE CREATION)
function createUserId(id: number): UserId {
  // => Factory function
  return id as UserId; // => Assert brand
}

function createProductId(id: number): ProductId {
  return id as ProductId;
}

const userId = createUserId(123); // => Type: UserId
const productId = createProductId(456); // => Type: ProductId

// PREVENTS MIXING INCOMPATIBLE IDS
function getUserById(id: UserId): string {
  // => Requires UserId
  return `User ${id}`;
}

console.log(getUserById(userId)); // => Output: User 123
// console.log(getUserById(productId));  // => ERROR: ProductId not assignable to UserId
// console.log(getUserById(999));        // => ERROR: number not assignable to UserId

// BRANDED STRINGS FOR EMAIL
type Email = Brand<string, "Email">;

function createEmail(value: string): Email {
  if (!value.includes("@")) {
    throw new Error("Invalid email");
  }
  return value as Email; // => Brand after validation
}

function sendEmail(to: Email, subject: string): void {
  console.log(`Sending to ${to}: ${subject}`);
}

const email = createEmail("alice@example.com");
sendEmail(email, "Hello"); // => Output: Sending to alice@example.com: Hello
// sendEmail("invalid", "Test");         // => ERROR: string not assignable to Email

// BRANDED TYPES FOR UNITS
type Meters = Brand<number, "Meters">;
type Feet = Brand<number, "Feet">;

function meters(value: number): Meters {
  return value as Meters;
}

function feet(value: number): Feet {
  return value as Feet;
}

function addMeters(a: Meters, b: Meters): Meters {
  return (a + b) as Meters; // => Type-safe addition
}

const m1 = meters(10);
const m2 = meters(20);
const f1 = feet(30);

console.log(addMeters(m1, m2)); // => Output: 30
// console.log(addMeters(m1, f1));       // => ERROR: Feet not assignable to Meters

// VALIDATION WITH BRANDED TYPES
type PositiveNumber = Brand<number, "Positive">;

function positive(n: number): PositiveNumber {
  if (n <= 0) throw new Error("Must be positive");
  return n as PositiveNumber;
}

const value = positive(10); // => Type: PositiveNumber
console.log(value); // => Output: 10
```

**Key Takeaway**: Branded types create nominal typing in TypeScript's structural type system. Use intersection with unique brand markers. Factory functions enforce validation before branding.

**Why It Matters**: Branded types prevent mixing semantically different values with the same underlying type. User IDs and product IDs are both strings, but branded types make them incompatible—passing a `ProductId` where `UserId` is expected is a compile error. Financial applications use branded types for currencies and amounts. Security-sensitive code uses them for sanitized vs unsanitized strings. This zero-runtime-cost technique prevents entire categories of semantic type confusion bugs.

## Example 46: Symbols and Unique Symbols

Symbols create unique property keys. Unique symbols create compile-time distinct types for advanced type-level programming.

**Code**:

```typescript
// BASIC SYMBOL
const sym1 = Symbol("description"); // => Creates unique symbol
const sym2 = Symbol("description"); // => Different symbol (same description)

console.log(sym1 === sym2); // => Output: false (different symbols)

// SYMBOL AS OBJECT KEY
const obj = {
  [sym1]: "value1", // => Symbol key
  [sym2]: "value2", // => Different symbol key
};

console.log(obj[sym1]); // => Output: value1
console.log(obj[sym2]); // => Output: value2

// WELL-KNOWN SYMBOLS
class Collection {
  private items: number[] = [1, 2, 3];

  [Symbol.iterator]() {
    // => Well-known symbol for iteration
    let index = 0;
    const items = this.items;

    return {
      next() {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const collection = new Collection();
for (const item of collection) {
  // => Uses Symbol.iterator
  console.log(item); // => Output: 1, 2, 3
}

// UNIQUE SYMBOL TYPE
const uniqueSym1: unique symbol = Symbol("unique1"); // => unique symbol type
const uniqueSym2: unique symbol = Symbol("unique2"); // => Different unique symbol type

interface Config {
  [uniqueSym1]: string; // => Property with unique symbol key
}

const config: Config = {
  [uniqueSym1]: "value", // => Must use exact symbol
};

// const wrongConfig: Config = {
//     [uniqueSym2]: "value"             // => ERROR: uniqueSym2 not in Config
// };

// BRANDED TYPES WITH UNIQUE SYMBOLS
declare const validatedBrand: unique symbol; // => Declare unique symbol (not exported)

type Validated<T> = T & { [validatedBrand]: true }; // => Brand with unique symbol

function validate<T>(value: T): Validated<T> {
  // Validation logic here
  return value as Validated<T>; // => Brand after validation
}

const validated = validate({ name: "Alice" }); // => Branded type
console.log(validated); // => Output: { name: 'Alice' }

// SYMBOL FOR METADATA
const metadataSymbol = Symbol("metadata");

class User {
  [metadataSymbol] = {
    // => Hidden metadata
    created: new Date(),
    version: 1,
  };

  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

const user = new User("Bob");
console.log(user.name); // => Output: Bob
console.log(user[metadataSymbol]); // => Output: { created: ..., version: 1 }
console.log(Object.keys(user)); // => Output: ["name"] (symbol not enumerable)
```

**Key Takeaway**: Symbols create unique property keys that avoid conflicts. Unique symbols create compile-time distinct types. Well-known symbols customize object behavior (iteration, conversion).

**Why It Matters**: Symbols enable private-like properties without hard private fields. Libraries use symbols to attach metadata without polluting string key space. Iterators use `Symbol.iterator` for interoperability. Unique symbols provide nominal typing at the type level. In large codebases, symbols prevent accidental property collision when multiple libraries attach metadata to the same objects. Understanding unique symbols is necessary for implementing custom iterator protocols.

## Example 47: Assertion Functions

Assertion functions use `asserts` keyword to narrow types through control flow. They throw errors if assertions fail.

**Code**:

```typescript
// BASIC ASSERTION FUNCTION
function assert(condition: any, message?: string): asserts condition {
  // => asserts keyword tells TypeScript this narrows
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function processValue(value: string | null) {
  assert(value !== null, "Value must not be null"); // => Throws if null
  // => After this line, value is string (narrowed)
  console.log(value.toUpperCase()); // => Safe: value is string
}

processValue("hello"); // => Output: HELLO
// processValue(null);                   // => Throws: Value must not be null

// TYPE PREDICATE ASSERTION
function assertIsString(value: unknown): asserts value is string {
  // => asserts value is string
  if (typeof value !== "string") {
    throw new Error("Value must be string");
  }
}

function printUpper(value: unknown) {
  assertIsString(value); // => Throws if not string
  // => After this, value is string
  console.log(value.toUpperCase()); // => Safe: value narrowed to string
}

printUpper("hello"); // => Output: HELLO
// printUpper(42);                       // => Throws: Value must be string

// ASSERTION FOR NON-NULL
function assertDefined<T>(value: T | null | undefined, name?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name || "Value"} is null or undefined`);
  }
}

function getUser(id: number): User | null {
  return id === 1 ? { id: 1, name: "Alice" } : null;
}

const user = getUser(1); // => Type: User | null
assertDefined(user, "User"); // => Throws if null
// => After this, user is User (narrowed)
console.log(user.name); // => Safe: user is User

// ASSERTION FOR ARRAY ELEMENTS
function assertAllStrings(arr: unknown[]): asserts arr is string[] {
  if (!arr.every((item) => typeof item === "string")) {
    throw new Error("Not all elements are strings");
  }
}

const mixed: unknown[] = ["a", "b", "c"];
assertAllStrings(mixed); // => Validates and narrows
// => After this, mixed is string[]
console.log(mixed.map((s) => s.toUpperCase())); // => Safe: mixed is string[]

// ASSERTION IN CLASS METHODS
class DataValidator {
  assertPositive(value: number, name?: string): asserts value is number {
    if (value <= 0) {
      throw new Error(`${name || "Value"} must be positive`);
    }
  }

  processAge(age: number) {
    this.assertPositive(age, "Age"); // => Throws if not positive
    console.log(`Valid age: ${age}`);
  }
}

const validator = new DataValidator();
validator.processAge(25); // => Output: Valid age: 25
// validator.processAge(-5);             // => Throws: Age must be positive
```

**Key Takeaway**: Assertion functions use `asserts condition` or `asserts value is Type` to narrow types through control flow. They throw errors when assertions fail, enabling type-safe validation.

**Why It Matters**: Assertion functions eliminate defensive programming patterns. Instead of if-checks everywhere, assert early and TypeScript narrows the type for all subsequent code. Validation middleware can use assertion functions to narrow request body types. Input parsers assert parsed values are correctly shaped. Without assertion functions, developers either use type guards everywhere or resort to non-null assertions (`!`) that bypass type safety entirely.

## Example 48: Variadic Tuple Types (Basic)

Variadic tuple types enable strongly-typed rest parameters and tuple concatenation. They use `...` spread syntax in tuple types.

**Code**:

```typescript
// BASIC VARIADIC TUPLE
type StringNumber = [string, number];
type BooleanString = [boolean, string];

type Combined = [...StringNumber, ...BooleanString]; // => Concatenate tuples
// => Type: [string, number, boolean, string]

const combined: Combined = ["hello", 42, true, "world"];
console.log(combined); // => Output: ["hello", 42, true, "world"]

// FUNCTION WITH VARIADIC TUPLE
function concat<T extends unknown[], U extends unknown[]>(arr1: T, arr2: U): [...T, ...U] {
  // => Return type concatenates tuples
  return [...arr1, ...arr2]; // => Spread and concatenate
}

const result1 = concat([1, 2], ["a", "b"]); // => Type: [number, number, string, string]
const result2 = concat([true], [10, 20]); // => Type: [boolean, number, number]

console.log(result1); // => Output: [1, 2, "a", "b"]
console.log(result2); // => Output: [true, 10, 20]

// VARIADIC TUPLE WITH REST PARAMETERS
function curry<T extends unknown[], R>(
  fn: (...args: T) => R, // => Function with rest params
  ...args: T // => Collect arguments
): R {
  return fn(...args); // => Spread arguments
}

function add(a: number, b: number, c: number): number {
  return a + b + c;
}

const sum = curry(add, 1, 2, 3); // => Type-safe curry
console.log(sum); // => Output: 6

// PREPEND/APPEND TO TUPLE
type Prepend<T extends unknown[], U> = [U, ...T]; // => Prepend element
type Append<T extends unknown[], U> = [...T, U]; // => Append element

type Original = [number, string];
type WithPrepend = Prepend<Original, boolean>; // => [boolean, number, string]
type WithAppend = Append<Original, boolean>; // => [number, string, boolean]

const prepended: WithPrepend = [true, 42, "hello"];
const appended: WithAppend = [42, "hello", true];

console.log(prepended); // => Output: [true, 42, "hello"]
console.log(appended); // => Output: [42, "hello", true]

// GENERIC TAIL EXTRACTION
type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;

type Numbers = [1, 2, 3, 4];
type NumbersTail = Tail<Numbers>; // => Type: [2, 3, 4]
```

**Key Takeaway**: Variadic tuple types use `...` to spread tuple elements. They enable type-safe tuple concatenation, prepend/append operations, and rest parameter typing.

**Why It Matters**: Variadic tuples power advanced functional programming patterns. Currying functions maintain type safety across arbitrary arities. Pipe/compose utilities preserve type flow through transformation chains. React hooks with spread arguments use variadic tuples for typed argument forwarding. Without variadic tuples, higher-order functions that manipulate argument lists lose type information. This enables writing type-safe utility libraries comparable to fp-ts or ramda.

## Example 49: String Manipulation Types

TypeScript provides built-in utility types for string manipulation: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.

**Code**:

```typescript
// UPPERCASE
type Shout<T extends string> = Uppercase<T>;

type ShoutHello = Shout<"hello">; // => Type: "HELLO"

const shout: ShoutHello = "HELLO"; // => Must be uppercase
console.log(shout); // => Output: HELLO

// LOWERCASE
type Whisper<T extends string> = Lowercase<T>;

type WhisperHELLO = Whisper<"HELLO">; // => Type: "hello"

const whisper: WhisperHELLO = "hello";
console.log(whisper); // => Output: hello

// CAPITALIZE
type Title<T extends string> = Capitalize<T>;

type TitleHello = Title<"hello world">; // => Type: "Hello world"

const title: TitleHello = "Hello world";
console.log(title); // => Output: Hello world

// UNCAPITALIZE
type Untitle<T extends string> = Uncapitalize<T>;

type UntitleHello = Untitle<"Hello">; // => Type: "hello"

const untitle: UntitleHello = "hello";
console.log(untitle); // => Output: hello

// COMBINING STRING MANIPULATION
type EventName<T extends string> = `on${Capitalize<T>}`; // => Template + Capitalize

type ClickEvent = EventName<"click">; // => Type: "onClick"
type FocusEvent = EventName<"focus">; // => Type: "onFocus"

const clickHandler: ClickEvent = "onClick";
console.log(clickHandler); // => Output: onClick

// MAPPED TYPE WITH STRING MANIPULATION
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface User {
  name: string;
  age: number;
}

type UserGetters = Getters<User>; // => { getName: () => string; getAge: () => number }

const userGetters: UserGetters = {
  getName: () => "Alice",
  getAge: () => 30,
};

console.log(userGetters.getName()); // => Output: Alice
console.log(userGetters.getAge()); // => Output: 30

// CSS PROPERTY CONVERSION
type KebabCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${Uncapitalize<T>}${KebabCase<U>}`
    : `${Uncapitalize<T>}-${KebabCase<U>}`
  : S;

type BackgroundColor = KebabCase<"backgroundColor">; // => Type: "background-color"
```

**Key Takeaway**: Built-in string manipulation types (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`) transform string literal types. Combine with template literals for powerful type-level string transformations.

**Why It Matters**: String manipulation types enable compile-time validation of naming conventions. Event handler naming follows `on${EventName}` patterns enforced by types. API route parameter extraction from URL templates is type-safe. CSS-in-JS libraries use template literal types for validated class names. Without string manipulation types, naming convention enforcement requires runtime validation or documentation. These types catch naming errors immediately in the IDE.

## Example 50: Awaited Type

The `Awaited<T>` utility type unwraps Promise types recursively. It's essential for typing async function return values.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Promise&lt;string&gt;"] -->|"Awaited<>"| B["string"]
    C["Promise&lt;Promise&lt;number&gt;&gt;"] -->|"Awaited<>"| D["number"]
    E["Promise&lt;User[]&gt;"] -->|"Awaited<>"| F["User[]"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
    style F fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```typescript
// BASIC AWAITED
type PromiseString = Promise<string>;
type UnwrappedString = Awaited<PromiseString>; // => Type: string

const str: UnwrappedString = "hello";
console.log(str); // => Output: hello

// AWAITED WITH NESTED PROMISES
type NestedPromise = Promise<Promise<number>>;
type UnwrappedNumber = Awaited<NestedPromise>; // => Type: number (recursively unwrapped)

const num: UnwrappedNumber = 42;
console.log(num); // => Output: 42

// AWAITED WITH ASYNC FUNCTION
async function fetchUser(): Promise<{ id: number; name: string }> {
  return { id: 1, name: "Alice" };
}

type UserType = Awaited<ReturnType<typeof fetchUser>>; // => Extract Promise result type
// => Type: { id: number; name: string }

const user: UserType = { id: 1, name: "Bob" };
console.log(user); // => Output: { id: 1, name: 'Bob' }

// AWAITED WITH UNION OF PROMISES
type PromiseUnion = Promise<string> | Promise<number>;
type UnwrappedUnion = Awaited<PromiseUnion>; // => Type: string | number

const value1: UnwrappedUnion = "hello";
const value2: UnwrappedUnion = 42;

console.log(value1, value2); // => Output: hello 42

// GENERIC FUNCTION WITH AWAITED
async function processAsync<T>(promise: Promise<T>): Promise<Awaited<T>> {
  const result = await promise; // => Unwrap promise
  return result; // => Return unwrapped value
}

const stringPromise = Promise.resolve("data");
processAsync(stringPromise).then((result) => {
  console.log(result.toUpperCase()); // => Output: DATA (result is string)
});

// AWAITED WITH PROMISE.ALL
const promises = [Promise.resolve(1), Promise.resolve("two"), Promise.resolve(true)] as const;

type PromiseResults = Awaited<(typeof promises)[number]>; // => Type: 1 | "two" | true

Promise.all(promises).then((results) => {
  console.log(results); // => Output: [1, "two", true]
});

// CONDITIONAL TYPE WITH AWAITED
type UnwrapPromise<T> = T extends Promise<infer U> ? Awaited<U> : T;

type Test1 = UnwrapPromise<Promise<string>>; // => Type: string
type Test2 = UnwrapPromise<number>; // => Type: number
```

**Key Takeaway**: `Awaited<T>` recursively unwraps Promise types to their resolved values. It handles nested promises and promise unions. Use with `ReturnType` to extract async function return types.

**Why It Matters**: `Awaited` simplifies typing async code. Extract types from async function returns without manual unwrapping. Type Promise chains correctly when intermediate steps return nested promises. Library code that accepts both synchronous and asynchronous inputs uses `Awaited` to normalize types. Without `Awaited`, developers write complex conditional types to unwrap promise layers. This utility type is essential for correctly typing generic async wrappers in data-fetching libraries.

## Example 51: Type Narrowing with Switch Statements

Switch statements on discriminated unions enable exhaustive type narrowing. TypeScript checks all cases are handled.

**Code**:

```typescript
// DISCRIMINATED UNION
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; sideLength: number }
  | { kind: "rectangle"; width: number; height: number };

// SWITCH WITH NARROWING
function getArea(shape: Shape): number {
  switch (
    shape.kind // => Switch on discriminator
  ) {
    case "circle":
      // TypeScript knows shape is circle here
      return Math.PI * shape.radius ** 2; // => radius available
    case "square":
      // TypeScript knows shape is square here
      return shape.sideLength ** 2; // => sideLength available
    case "rectangle":
      // TypeScript knows shape is rectangle here
      return shape.width * shape.height; // => width & height available
    default:
      const exhaustiveCheck: never = shape; // => Exhaustiveness check
      throw new Error(`Unhandled shape: ${exhaustiveCheck}`);
  }
}

const circle: Shape = { kind: "circle", radius: 5 };
const square: Shape = { kind: "square", sideLength: 10 };
const rectangle: Shape = { kind: "rectangle", width: 8, height: 6 };

console.log(getArea(circle)); // => Output: 78.53981633974483
console.log(getArea(square)); // => Output: 100
console.log(getArea(rectangle)); // => Output: 48

// SWITCH WITH MULTIPLE CASES
type Status = "pending" | "approved" | "rejected" | "archived";

function handleStatus(status: Status): string {
  switch (status) {
    case "pending":
    case "approved":
      return "Active"; // => Multiple cases same handler
    case "rejected":
    case "archived":
      return "Inactive";
    default:
      const exhaustive: never = status;
      return exhaustive;
  }
}

console.log(handleStatus("pending")); // => Output: Active
console.log(handleStatus("rejected")); // => Output: Inactive

// SWITCH WITH FALLTHROUGH
type Action = { type: "increment" } | { type: "decrement" } | { type: "reset"; value: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    case "reset":
      return action.value; // => value available (reset variant)
    default:
      const exhaustive: never = action;
      return state;
  }
}

console.log(reducer(10, { type: "increment" })); // => Output: 11
console.log(reducer(10, { type: "reset", value: 0 })); // => Output: 0
```

**Key Takeaway**: Switch statements on discriminators narrow types automatically. Use `never` in default case for exhaustiveness checking. Multiple cases can share handlers with fallthrough.

**Why It Matters**: Switch-based narrowing is cleaner than if-else chains for discriminated unions. Action reducers use switch for action handling. State machines use switch for state transitions. The exhaustiveness check prevents forgetting new variants when unions grow—the default `never` case ensures TypeScript errors if a new action type is added without a handler. This pattern is foundational to Redux-style state management and event-driven architectures.
