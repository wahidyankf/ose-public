---
title: "Intermediate"
weight: 10000002
date: 2026-02-02T00:00:00+07:00
draft: false
description: "Examples 31-60: C# intermediate concepts including interfaces, inheritance, async/await, LINQ advanced, generics, delegates, pattern matching, records, Entity Framework, and testing (40-75% coverage)"
tags: ["c-sharp", "csharp", "dotnet", "tutorial", "by-example", "intermediate", "async", "linq", "generics", "ef-core"]
---

This intermediate tutorial covers C#'s production-ready patterns through 30 heavily annotated examples. Topics include interfaces, inheritance, async/await, advanced LINQ operations, generics with constraints, delegates and events, pattern matching, records, dependency injection, Entity Framework Core, and testing with xUnit.

## Example 31: Interfaces for Polymorphism

Interfaces define contracts that types must implement, enabling polymorphic behavior where different types respond to the same interface with type-specific implementations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A["IShape Interface"]
    B["Circle Class"]
    C["Rectangle Class"]
    D["Polymorphic Code<br/>uses IShape"]

    A -->|implements| B
    A -->|implements| C
    B --> D
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 31: Interfaces for Polymorphism
interface IShape          // => Interface defines contract
{                         // => I prefix is naming convention
                          // => Defines behavior without implementation
                          // => Cannot contain implementation details
    double GetArea();     // => All implementers MUST provide this method
                          // => No implementation in interface (only signature)
                          // => Return type double for area calculation
}

class Circle : IShape     // => Circle implements IShape contract
{                         // => ":" denotes interface implementation
                          // => Circle must implement all IShape members
    private double radius;// => Private field
                          // => Encapsulation principle (hide data)
                          // => Only accessible within class

    public Circle(double r)
    {                     // => Constructor with radius parameter
                          // => r is double parameter
                          // => Initializes object state
        radius = r;       // => Initialize radius field
                          // => radius is now equal to r
    }

    public double GetArea()
    {                     // => Required by IShape contract
                          // => Must be public (interface contract)
        return Math.PI * radius * radius;
                          // => Circle-specific calculation: πr²
                          // => Math.PI is 3.14159...
                          // => Returns area in square units
    }
}

class Rectangle : IShape  // => Rectangle also implements IShape
{                         // => Different class, same interface
    private double width, height;
                          // => Different internal structure from Circle
                          // => Two dimensions instead of radius

    public Rectangle(double w, double h)
    {                     // => Constructor with width and height
                          // => w and h are double parameters
        width = w;        // => Store dimensions
        height = h;       // => width=w, height=h
    }

    public double GetArea()
    {                     // => Required by IShape contract
                          // => Same method name as Circle
        return width * height;
                          // => Rectangle-specific: w × h
                          // => Different calculation from Circle
    }
}

IShape shape1 = new Circle(5);
                          // => Upcasting: Circle → IShape reference
                          // => shape1 stores Circle object
                          // => Type: IShape (reference), Circle (actual object)
                          // => Polymorphism enabled

IShape shape2 = new Rectangle(4, 6);
                          // => shape2 stores Rectangle object
                          // => Same reference type (IShape) as shape1
                          // => Different object type (Rectangle vs Circle)

Console.WriteLine(shape1.GetArea());
                          // => Calls Circle.GetArea() via polymorphism
                          // => Runtime determines actual method to call
                          // => Output: 78.53981633974483

Console.WriteLine(shape2.GetArea());
                          // => Calls Rectangle.GetArea()
                          // => Output: 24
                          // => Same interface, different behavior (polymorphism)
```

**Key Takeaway**: Interfaces enable polymorphism by defining contracts that multiple types can implement with their own specialized behavior.

**Why It Matters**: Interfaces are fundamental to SOLID design principles (especially Dependency Inversion). They enable testable, flexible architectures where code depends on abstractions rather than concrete implementations. Payment processing systems use interfaces to support multiple providers (Stripe, PayPal) through a single `IPaymentProcessor` interface, allowing provider switching without code changes. Unit tests inject mock implementations through interface references, isolating components from their dependencies and enabling fast, reliable test suites.

## Example 32: Inheritance - Base and Derived Classes

Inheritance creates "is-a" relationships where derived classes inherit members from base classes and can override virtual methods for specialized behavior.

```csharp
// Example 32: Inheritance - Base and Derived Classes
class Animal              // => Base class (parent class)
{                         // => Defines common behavior
    public string Name { get; set; }
                          // => Auto-property
                          // => Inherited by all derived classes
                          // => All animals have Name property

    public virtual void MakeSound()
    {                     // => virtual allows overriding in derived classes
                          // => virtual keyword enables polymorphism
        Console.WriteLine("Generic animal sound");
                          // => Default implementation
                          // => Rarely called (derived classes override)
                          // => Fallback behavior
    }
}

class Dog : Animal        // => Dog inherits from Animal
{                         // => Dog IS-AN Animal (inheritance relationship)
                          // => ":" denotes inheritance
                          // => Inherits Name property and MakeSound method
    public override void MakeSound()
    {                     // => override keyword required
                          // => Replaces base implementation
                          // => Must match base method signature
        Console.WriteLine($"{Name} says: Woof!");
                          // => Dog-specific behavior
                          // => Name inherited from Animal
                          // => String interpolation with inherited property
    }
}

class Cat : Animal        // => Cat also inherits from Animal
{                         // => Sibling class to Dog (both inherit Animal)
    public override void MakeSound()
    {                     // => Cat's specialized implementation
                          // => override provides Cat-specific behavior
        Console.WriteLine($"{Name} says: Meow!");
                          // => Different from Dog
                          // => Same method name, different behavior
    }
}

Animal animal1 = new Dog { Name = "Buddy" };
                          // => Object initializer syntax
                          // => animal1 reference type: Animal
                          // => Actual object type: Dog
                          // => Upcasting (Dog → Animal)

Animal animal2 = new Cat { Name = "Whiskers" };
                          // => animal2 reference type: Animal
                          // => Actual object type: Cat
                          // => animal2.Name is "Whiskers"

animal1.MakeSound();      // => Runtime polymorphism
                          // => Calls Dog.MakeSound() (not Animal)
                          // => Output: Buddy says: Woof!

animal2.MakeSound();      // => Calls Cat.MakeSound()
                          // => Output: Whiskers says: Meow!
```

**Key Takeaway**: Use inheritance for "is-a" relationships and shared behavior. Virtual methods enable runtime polymorphism through method overriding.

**Why It Matters**: Inheritance enables code reuse and hierarchical type relationships. However, favor composition over inheritance when possible - deep inheritance hierarchies become brittle and hard to maintain. Use inheritance only when there's a clear "is-a" relationship and significant shared implementation. The Liskov Substitution Principle requires derived types to be substitutable for base types without altering program correctness. Violating this principle by overriding methods with fundamentally different behavior causes subtle bugs when code uses base class references polymorphically.

## Example 33: Abstract Classes - Partial Implementations

Abstract classes combine interface contracts (abstract methods) with shared implementation (concrete methods). They cannot be instantiated directly.

#### Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["abstract Shape\n(abstract class)\ncannot instantiate"] -->|"inherits"| B["Circle\n(concrete class)\nGetArea() overrides"]
    A -->|"inherits"| C["Rectangle\n(concrete class)\nGetArea() overrides"]
    A -->|"provides shared impl"| D["Describe()\n(concrete method)\nshared by all subclasses"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
```

```csharp
// Example 33: Abstract Classes
abstract class Shape      // => abstract prevents direct instantiation
{                         // => Can't do: new Shape()
    public abstract double GetArea();  // => abstract: no body, must override
                          // => abstract method: signature only
                          // => Derived classes MUST provide implementation

    public abstract double GetPerimeter();  // => Another required method
                          // => Both methods enforced by compiler

    public void PrintInfo()  // => Concrete method (has implementation)
    {                     // => Shared by ALL derived classes (Square, Circle)
                          // => Code reuse: defined once in abstract class
        Console.WriteLine($"Area: {GetArea()}");
                          // => Polymorphic call: invokes derived GetArea()
                          // => Runtime dispatches to Square.GetArea() or Circle.GetArea()
        Console.WriteLine($"Perimeter: {GetPerimeter()}");
                          // => Similarly calls derived GetPerimeter()
    }
}

class Square : Shape      // => Square must implement abstract methods
{                         // => Concrete derived class (can be instantiated)
    private double side;
                          // => Private backing field for side length

    public Square(double s)  // => Constructor: s is the side length
    {                     // => s parameter initializes the square's size
        side = s;         // => Store: side = provided dimension
                          // => side is now 5 (for new Square(5))
    }

    public override double GetArea()  // => Implementation of abstract GetArea
    {                     // => Satisfies abstract contract from Shape
        return side * side;  // => Square area: s²
                          // => Returns: 25.0 (for side=5)
    }

    public override double GetPerimeter()  // => Implementation of abstract GetPerimeter
    {                     // => Required by Shape
        return 4 * side;  // => Square perimeter: 4s
                          // => Returns: 20.0 (for side=5)
    }
}

class Circle : Shape      // => Circle: different shape, same abstract contract
{                         // => Must implement GetArea and GetPerimeter
    private double radius;
                          // => Backing field for circle's radius

    public Circle(double r)  // => Constructor: r is the radius
    {                     // => Initializes Circle's dimension
        radius = r;       // => Store radius value
                          // => radius is now r
    }

    public override double GetArea()  // => Circle-specific area implementation
    {                     // => Satisfies Shape.GetArea() contract
        return Math.PI * radius * radius;  // => Circle area: πr²
                          // => Math.PI = 3.14159...
                          // => Returns: 78.54 (for radius=5)
    }

    public override double GetPerimeter()  // => Circle-specific circumference
    {                     // => Satisfies Shape.GetPerimeter() contract
        return 2 * Math.PI * radius;  // => Circumference: 2πr
                          // => Returns: 31.42 (for radius=5)
    }
}

Shape shape = new Square(5);  // => Instantiate Square, assign to Shape reference
                          // => Abstract class reference polymorphism
                          // => shape variable type: Shape; actual: Square

shape.PrintInfo();        // => Calls shared PrintInfo from Shape
                          // => Output: Area: 25
                          // =>         Perimeter: 20
```

**Key Takeaway**: Abstract classes provide partial implementation - abstract methods define contracts while concrete methods provide shared functionality.

**Why It Matters**: Abstract classes are ideal when you need shared implementation plus enforced contracts. They're more flexible than interfaces (before C# 8 default interface implementations) but more rigid than pure interfaces. Use abstract classes when derived types share significant common code but need specific implementations for certain operations. The Template Method pattern uses abstract classes to define algorithm skeletons where concrete subclasses fill in specific steps, enabling code reuse while enforcing structural consistency across implementations.

## Example 34: Async/Await - Basic Asynchronous Operations

Async/await enables non-blocking I/O operations using Task-based asynchronous programming model.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[async method]:::blue --> B[await Task.Delay]:::orange
    B --> C[Thread released<br/>non-blocking]:::teal
    C --> D[Continue after completion]:::orange

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 34: Async/Await - Basic Asynchronous Operations
async Task<string> FetchDataAsync()
{                         // => async keyword enables await
                          // => Return type: Task<string>
                          // => Actual return: string (Task wrapped automatically)
    Console.WriteLine("Starting fetch...");
                          // => Executes synchronously

    await Task.Delay(1000);
                          // => await pauses method execution
                          // => Thread released to thread pool (non-blocking)
                          // => Resumes after 1000ms

    Console.WriteLine("Fetch completed");
                          // => Executes after await completes

    return "Data";        // => Automatically wrapped in Task<string>
}

var task = FetchDataAsync();
                          // => Method starts executing
                          // => Returns immediately with Task<string>
                          // => "Starting fetch..." already printed

Console.WriteLine("Doing other work...");
                          // => Executes while fetch is delayed
                          // => Output: Doing other work...

var result = await task;  // => await waits for task completion
                          // => result is "Data" (unwrapped from Task)
                          // => "Fetch completed" printed before this

Console.WriteLine(result);// => Output: Data
```

**Key Takeaway**: Async/await enables non-blocking asynchronous operations. `async` keyword enables `await`, and `await` pauses execution without blocking threads.

**Why It Matters**: Async/await dramatically improves scalability for I/O-bound operations. Web servers handle thousands of concurrent requests on a single thread pool instead of dedicating one thread per request. Applications achieve higher throughput by using async controllers that release threads during database/API calls. ASP.NET Core applications should use async throughout the stack (controllers, services, repositories) to avoid thread pool starvation under load. Mixing sync and async code with `.Result` or `.Wait()` causes deadlocks in certain synchronization contexts.

## Example 35: Task.WhenAll - Parallel Async Operations

`Task.WhenAll` executes multiple async operations concurrently, completing when all tasks finish.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Start]:::blue --> B[Task 1: 500ms]:::orange
    A --> C[Task 2: 500ms]:::orange
    A --> D[Task 3: 500ms]:::orange
    B --> E[All complete<br/>~500ms total]:::teal
    C --> E
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 35: Task.WhenAll - Parallel Async Operations
async Task<string> FetchUser(int id)
{                         // => Simulates async API call
                          // => async keyword enables await
    await Task.Delay(500);// => 500ms latency
                          // => await suspends execution
    return $"User {id}";  // => Returns user data
                          // => Type: Task<string>
}

async Task<string> FetchOrders(int userId)
{                         // => Async method for orders
                          // => Independent operation (runs in parallel)
    await Task.Delay(500);// => 500ms delay (simulates database query)
    return $"Orders for {userId}";
                          // => Returns orders string
}

async Task<string> FetchProfile(int userId)
{                         // => Async method for profile
                          // => Third parallel operation
    await Task.Delay(500);// => 500ms delay (simulates API call)
    return $"Profile for {userId}";
                          // => Returns profile string
}

var userTask = FetchUser(1);
                          // => Starts immediately
                          // => Returns Task<string> (not yet complete)
                          // => Does NOT await (task runs in background)
                          // => Execution continues while task executes

var ordersTask = FetchOrders(1);
                          // => Starts immediately (parallel to userTask)
                          // => Both tasks running concurrently

var profileTask = FetchProfile(1);
                          // => Third concurrent task

var results = await Task.WhenAll(userTask, ordersTask, profileTask);
                          // => Waits for ALL tasks to complete
                          // => Total time: ~500ms (longest task)
                          // => NOT 1500ms (sequential)
                          // => results is string[] array

Console.WriteLine(string.Join(", ", results));
                          // => Output: User 1, Orders for 1, Profile for 1
```

**Key Takeaway**: `Task.WhenAll` runs tasks concurrently and waits for all to complete. Total time equals the longest task, not the sum of all tasks.

**Why It Matters**: Parallel async operations dramatically reduce I/O-bound operation times. Dashboard pages fetch data from multiple APIs concurrently (users, orders, analytics) in 500ms instead of 1500ms sequentially. E-commerce sites load product details, reviews, and recommendations in parallel, improving page load times significantly. `Task.WhenAll` propagates all exceptions together in an `AggregateException`, so error handling must unwrap all failures rather than just the first. For partial failures, `Task.WhenAll` should be combined with individual task exception handling to continue with successful results.

## Example 36: Task.WhenAny - Race Conditions

`Task.WhenAny` completes when the first task finishes, enabling timeout patterns and race conditions.

#### Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Task.WhenAny(task1, task2, timeoutTask)"] -->|"first to complete wins"| B{"Which finished first?"}
    B -->|"SlowService"| C["Use SlowService result"]
    B -->|"FastService"| D["Use FastService result"]
    B -->|"timeoutTask"| E["Timeout - use fallback"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
```

```csharp
// Example 36: Task.WhenAny - Race Conditions
async Task<string> SlowService()
{                         // => Simulates slow API
                          // => async method returns Task<string>
    await Task.Delay(3000);
                          // => 3 second delay (3000ms)
                          // => Suspends execution
    return "Slow result"; // => Rarely returned in timeout scenario
                          // => Usually loses race
}

async Task<string> FastService()
{                         // => Simulates fast API
                          // => Fast response time
    await Task.Delay(500);
                          // => 500ms delay (much faster than slow)
                          // => await suspends briefly
    return "Fast result"; // => Usually wins the race
                          // => Returns first in typical scenario
}

async Task<string> FallbackService()
{                         // => Backup service
                          // => Middle-ground response time
    await Task.Delay(1000);
                          // => 1 second delay
                          // => Slower than fast, faster than slow
    return "Fallback result";
                          // => Fallback data
}

var slowTask = SlowService();
                          // => Start all tasks concurrently
                          // => slowTask starts immediately (no await)
var fastTask = FastService();
                          // => fastTask starts immediately
                          // => All three running in parallel
var fallbackTask = FallbackService();
                          // => fallbackTask starts immediately

var completedTask = await Task.WhenAny(slowTask, fastTask, fallbackTask);
                          // => Returns immediately when FIRST task completes
                          // => completedTask is Task<string> (the winner)
                          // => Other tasks continue running in background
                          // => Usually fastTask completes first

var result = await completedTask;
                          // => Unwrap result from completed task
                          // => await extracts string from Task<string>
                          // => result is "Fast result" (fastTask won)

Console.WriteLine(result);// => Output: Fast result
                          // => Prints winner's result
```

**Key Takeaway**: `Task.WhenAny` returns when the first task completes, enabling timeout patterns and service races.

**Why It Matters**: `Task.WhenAny` enables resilience patterns. Services race primary and fallback APIs, using whichever responds first. Timeout patterns combine operations with `Task.Delay` timeouts, canceling slow operations automatically. This improves user experience by preventing indefinite waits and enabling graceful degradation. Remember to cancel or abandon the losing task to avoid resource leaks - even after `WhenAny` returns, the other tasks continue running unless explicitly canceled via `CancellationToken`. Circuit breaker patterns build on `WhenAny` to route traffic away from unhealthy services.

## Example 37: File I/O - Reading and Writing Files

File I/O operations use `System.IO` classes for reading and writing text and binary data.

```csharp
// Example 37: File I/O - Reading and Writing Files
using System.IO;         // => Namespace for file operations

string path = "data.txt"; // => File path (relative to working directory)

// Writing to file
File.WriteAllText(path, "Hello, World!\nLine 2\nLine 3");
                          // => Creates or overwrites file
                          // => Writes entire string at once
                          // => Automatically closes file handle

// Reading from file
string content = File.ReadAllText(path);
                          // => Reads entire file as single string
                          // => content is "Hello, World!\nLine 2\nLine 3"

Console.WriteLine(content);
                          // => Output: Hello, World!
                          // =>         Line 2
                          // =>         Line 3

// Reading lines as array
string[] lines = File.ReadAllLines(path);
                          // => Splits file by newlines
                          // => lines is ["Hello, World!", "Line 2", "Line 3"]

foreach (var line in lines)
{                         // => Iterate through lines
    Console.WriteLine($"Line: {line}");
                          // => Output: Line: Hello, World!
                          // =>         Line: Line 2
                          // =>         Line: Line 3
}

// Appending to file
File.AppendAllText(path, "\nLine 4");
                          // => Adds text to end of file
                          // => Does NOT overwrite existing content

// Check if file exists
bool exists = File.Exists(path);
                          // => exists is true
                          // => Returns false if file doesn't exist
```

**Key Takeaway**: `File.WriteAllText`, `File.ReadAllText`, and `File.ReadAllLines` provide simple file I/O operations. Use `File.AppendAllText` for appending.

**Why It Matters**: File I/O is fundamental for data persistence, logging, and configuration. Simple methods like `File.ReadAllText` are sufficient for small files. For large files, use `StreamReader`/`StreamWriter` for memory-efficient line-by-line processing. Log aggregation systems process gigabyte-sized log files using streaming APIs that maintain constant memory usage. Always use `using` declarations for file streams to ensure handles are released promptly. Applications that hold file handles without closing them accumulate resource leaks that eventually exhaust operating system file descriptor limits.

## Example 38: JSON Serialization with System.Text.Json

JSON serialization converts objects to JSON strings and vice versa using `System.Text.Json`.

```csharp
// Example 38: JSON Serialization
using System.Text.Json; // => Modern JSON library

class Person              // => Simple data class
{
    public string Name { get; set; }
                          // => Public properties are serialized
    public int Age { get; set; }
    public string Email { get; set; }
}

var person = new Person
{                         // => Object initializer
    Name = "Alice",
    Age = 30,
    Email = "alice@example.com"
};

// Serialize to JSON string
string json = JsonSerializer.Serialize(person);
                          // => Converts object to JSON string
                          // => json is {"Name":"Alice","Age":30,"Email":"alice@example.com"}

Console.WriteLine(json);  // => Output: {"Name":"Alice","Age":30,"Email":"alice@example.com"}

// Pretty-print JSON
var options = new JsonSerializerOptions { WriteIndented = true };
                          // => Formatting options
                          // => WriteIndented adds newlines and indentation

string prettyJson = JsonSerializer.Serialize(person, options);
                          // => Formatted JSON with indentation

Console.WriteLine(prettyJson);
                          // => Output: {
                          // =>   "Name": "Alice",
                          // =>   "Age": 30,
                          // =>   "Email": "alice@example.com"
                          // => }

// Deserialize from JSON
string inputJson = """{"Name":"Bob","Age":25,"Email":"bob@example.com"}""";
                          // => Raw string literal (C# 11+)

Person? deserializedPerson = JsonSerializer.Deserialize<Person>(inputJson);
                          // => Converts JSON to object
                          // => deserializedPerson.Name is "Bob"
                          // => deserializedPerson.Age is 25

Console.WriteLine($"{deserializedPerson?.Name}, {deserializedPerson?.Age}");
                          // => Output: Bob, 25
                          // => ?. is null-conditional operator
```

**Key Takeaway**: `System.Text.Json` provides high-performance JSON serialization. Use `JsonSerializer.Serialize` for objects→JSON and `JsonSerializer.Deserialize<T>` for JSON→objects.

**Why It Matters**: JSON is the dominant data interchange format for web APIs and configuration files. `System.Text.Json` is the standard library in modern .NET. RESTful APIs serialize response objects to JSON automatically, and configuration systems load `appsettings.json` using the same serializer. Use `[JsonPropertyName]` attributes to control serialized property names when C# naming conventions differ from API contracts. `JsonSerializerOptions` with `PropertyNameCaseInsensitive = true` makes deserialization robust to casing variations in external API responses.

## Example 39: HTTP Client - Making API Requests

`HttpClient` enables HTTP requests to web APIs with async/await support.

```csharp
// Example 39: HTTP Client - Making API Requests
using System.Net.Http;   // => Namespace for HTTP operations
                          // => HttpClient, HttpResponseMessage classes
using System.Text.Json;  // => JSON serialization/deserialization

// Create HttpClient (reuse in production, don't create per request)
using var client = new HttpClient();
                          // => using ensures proper disposal
                          // => HttpClient should be singleton in production
                          // => Creating per request causes socket exhaustion

client.BaseAddress = new Uri("https://jsonplaceholder.typicode.com/");
                          // => Base URL for all requests
                          // => Relative paths appended to this
                          // => client.BaseAddress is Uri type

// GET request
var response = await client.GetAsync("posts/1");
                          // => Async GET to /posts/1
                          // => response contains status code, headers, body
                          // => await suspends until response received

response.EnsureSuccessStatusCode();
                          // => Throws if status code not 2xx
                          // => Validates successful response
                          // => Throws HttpRequestException on error

string responseBody = await response.Content.ReadAsStringAsync();
                          // => Reads response body as string
                          // => responseBody contains JSON
                          // => await reads HTTP content stream

Console.WriteLine(responseBody);
                          // => Output: {"userId":1,"id":1,"title":"...","body":"..."}
                          // => Prints raw JSON string

// Deserialize JSON response
class Post               // => Data model for JSON
{                         // => Properties match JSON fields
    public int UserId { get; set; }
                          // => Maps to userId JSON field
    public int Id { get; set; }
                          // => Maps to id JSON field
    public string Title { get; set; } = "";
                          // => = "" initializes to non-null
                          // => Prevents null reference warnings
    public string Body { get; set; } = "";
                          // => Maps to body JSON field
}

var post = JsonSerializer.Deserialize<Post>(responseBody);
                          // => Converts JSON to Post object
                          // => Generic type parameter: <Post>
                          // => post.Title is the post title

Console.WriteLine($"Post: {post?.Title}");
                          // => Output: Post: [post title from API]
                          // => ?. null-conditional operator (post might be null)

// POST request with JSON body
var newPost = new Post
{
    UserId = 1,
    Title = "New Post",
    Body = "Post content"
};

string jsonBody = JsonSerializer.Serialize(newPost);
                          // => Serialize object to JSON

var content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");
                          // => Create HTTP content with JSON media type

var postResponse = await client.PostAsync("posts", content);
                          // => POST request to /posts
                          // => postResponse contains created resource

postResponse.EnsureSuccessStatusCode();
```

**Key Takeaway**: `HttpClient` provides async HTTP operations. Use `GetAsync` for GET requests and `PostAsync` with `StringContent` for POST with JSON bodies.

**Why It Matters**: HTTP clients are essential for microservice communication and third-party API integration. Reusing `HttpClient` instances is critical - creating new instances per request exhausts socket connections under high load. The `IHttpClientFactory` pattern manages client lifetimes and handles transient faults. Polly integration with `IHttpClientFactory` adds retry policies, circuit breakers, and timeout handling declaratively. Named or typed clients encapsulate base URL configuration and authentication headers, centralizing API client configuration and enabling easy mocking in unit tests.

## Example 40: LINQ GroupBy - Grouping Data

`GroupBy` groups elements by a key selector, returning groups with keys and elements.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Products]:::blue --> B[GroupBy Category]:::orange
    B --> C[Electronics: [...]<br/>Books: [...]<br/>Clothing: [...]]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 40: LINQ GroupBy
class Product             // => Product entity class
{                         // => Represents product data
    public string Name { get; set; } = "";
                          // => Product name property
    public string Category { get; set; } = "";
                          // => Category for grouping
    public decimal Price { get; set; }
                          // => Price as decimal (currency type)
}

var products = new List<Product>
{                         // => Collection initializer
                          // => List of Product objects
    new() { Name = "Laptop", Category = "Electronics", Price = 999.99m },
                          // => new() uses target-typed new (C# 9+)
                          // => m suffix for decimal literal
    new() { Name = "Mouse", Category = "Electronics", Price = 29.99m },
                          // => Second Electronics product
    new() { Name = "Book", Category = "Books", Price = 14.99m },
                          // => First Books product
    new() { Name = "Shirt", Category = "Clothing", Price = 39.99m },
                          // => First Clothing product
    new() { Name = "Keyboard", Category = "Electronics", Price = 79.99m },
                          // => Third Electronics product
    new() { Name = "Novel", Category = "Books", Price = 19.99m }
                          // => Second Books product
};                        // => products has 6 elements (3 categories)

var groupedByCategory = products.GroupBy(p => p.Category);
                          // => Groups products by Category property
                          // => Lambda: p => p.Category is key selector
                          // => Returns IEnumerable<IGrouping<string, Product>>
                          // => Each group has Key (category) and elements (products)
                          // => Lazy evaluation (not executed until enumerated)

foreach (var group in groupedByCategory)
{                         // => Iterate through groups
                          // => group is IGrouping<string, Product>
                          // => Triggers GroupBy execution
    Console.WriteLine($"\nCategory: {group.Key}");
                          // => group.Key is category name (string)
                          // => Output: Category: Electronics
                          // => \n for newline before category

    foreach (var product in group)
    {                     // => Iterate through products in group
                          // => product is Product type
                          // => Nested enumeration within group
        Console.WriteLine($"  - {product.Name}: ${product.Price}");
                          // => Output:   - Laptop: $999.99
                          // =>           - Mouse: $29.99
                          // =>           - Keyboard: $79.99
                          // => All Electronics products
    }
}

// GroupBy with aggregate
var categoryTotals = products
    .GroupBy(p => p.Category)
                          // => Group by category
    .Select(g => new
    {                     // => Anonymous type for result
        Category = g.Key,
                          // => Extract category name
        TotalPrice = g.Sum(p => p.Price),
                          // => Sum prices within group
        Count = g.Count() // => Count products in group
    });

foreach (var ct in categoryTotals)
{
    Console.WriteLine($"{ct.Category}: {ct.Count} items, Total: ${ct.TotalPrice}");
                          // => Output: Electronics: 3 items, Total: $1109.97
                          // =>         Books: 2 items, Total: $34.98
                          // =>         Clothing: 1 items, Total: $39.99
}
```

**Key Takeaway**: `GroupBy` creates groups based on key selector. Each group has a `Key` property and contains elements matching that key.

**Why It Matters**: GroupBy is essential for categorization and aggregation scenarios. Sales reports group transactions by date/product/region to calculate daily totals. Analytics dashboards group user events by action type to compute engagement metrics. GroupBy replaces verbose manual dictionary-building code with declarative LINQ expressions. When combined with `ToDictionary`, GroupBy builds lookup structures for efficient repeated access. Entity Framework translates LINQ GroupBy to SQL GROUP BY clauses with aggregate functions (COUNT, SUM, AVG), pushing computation to the database where it's most efficient.

## Example 41: LINQ Join - Combining Collections

`Join` combines elements from two collections based on matching keys, similar to SQL inner joins.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Customers]:::blue --> C[Join on CustomerId]:::teal
    B[Orders]:::orange --> C
    C --> D[Customer-Order Pairs]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 41: LINQ Join
class Customer            // => Customer entity class
{                         // => Represents customer data
    public int Id { get; set; }
                          // => Primary key (unique identifier)
    public string Name { get; set; } = "";
                          // => Customer name (initialized to empty string)
}

class Order               // => Order entity class
{                         // => Represents order data
    public int OrderId { get; set; }
                          // => Primary key for order
    public int CustomerId { get; set; }
                          // => Foreign key to Customer
                          // => Links order to customer
    public decimal Amount { get; set; }
                          // => Order amount (decimal for currency)
}

var customers = new List<Customer>
{                         // => Collection initializer syntax
    new() { Id = 1, Name = "Alice" },
                          // => Target-typed new() (C# 9.0+)
                          // => Customer with Id=1
    new() { Id = 2, Name = "Bob" },
                          // => Customer with Id=2
    new() { Id = 3, Name = "Charlie" }
                          // => Customer with Id=3
};                        // => customers has 3 elements

var orders = new List<Order>
{                         // => Order collection
    new() { OrderId = 101, CustomerId = 1, Amount = 250.00m },
                          // => m suffix for decimal literal
                          // => Alice's first order (CustomerId=1)
    new() { OrderId = 102, CustomerId = 2, Amount = 175.00m },
                          // => Bob's order (CustomerId=2)
    new() { OrderId = 103, CustomerId = 1, Amount = 300.00m },
                          // => Alice (Id=1) has two orders
                          // => CustomerId=1 appears twice
    new() { OrderId = 104, CustomerId = 3, Amount = 50.00m }
                          // => Charlie's order (CustomerId=3)
};                        // => orders has 4 elements

var customerOrders = customers.Join(
                          // => Join extension method on IEnumerable
    orders,               // => Inner collection to join
                          // => Second data source
    customer => customer.Id,
                          // => Outer key selector: Customer.Id
                          // => Lambda extracts key from outer (customers)
    order => order.CustomerId,
                          // => Inner key selector: Order.CustomerId
                          // => Lambda extracts key from inner (orders)
                          // => Keys must match for join
    (customer, order) => new
    {                     // => Result selector: combines matched pairs
                          // => Creates anonymous type for each match
        CustomerName = customer.Name,
                          // => Property from customer
        OrderId = order.OrderId,
                          // => Property from order
        Amount = order.Amount
                          // => Amount from order
    }
);                        // => Returns IEnumerable of anonymous objects
                          // => Only includes customers with orders (inner join)
                          // => Unmatched customers excluded

foreach (var co in customerOrders)
{
    Console.WriteLine($"{co.CustomerName} - Order #{co.OrderId}: ${co.Amount}");
                          // => Output: Alice - Order #101: $250.00
                          // =>         Bob - Order #102: $175.00
                          // =>         Alice - Order #103: $300.00
                          // =>         Charlie - Order #104: $50.00
}
```

**Key Takeaway**: `Join` combines two collections based on matching keys using four parameters: inner collection, outer key selector, inner key selector, and result selector.

**Why It Matters**: Join operations are fundamental for relational data queries. While Entity Framework handles SQL joins, LINQ joins are essential for in-memory collections and combining data from multiple sources (database + API + cache). E-commerce platforms join product data (from database) with real-time inventory (from cache) and pricing (from pricing service) to build complete product views.

## Example 42: LINQ SelectMany - Flattening Collections

`SelectMany` projects each element to a collection and flattens the results into a single sequence.

```csharp
// Example 42: LINQ SelectMany
class School              // => School entity
{                         // => Contains collection of students
    public string Name { get; set; } = "";
                          // => School name property
    public List<Student> Students { get; set; } = new();
                          // => Each school has multiple students
                          // => One-to-many relationship
}

class Student             // => Student entity
{                         // => Represents individual student
    public string Name { get; set; } = "";
                          // => Student name property
    public int Age { get; set; }
                          // => Age property
}

var schools = new List<School>
{                         // => Collection of schools
    new()                 // => Target-typed new (C# 9.0+)
    {                     // => Object initializer
        Name = "Elementary",
                          // => First school
        Students = new List<Student>
        {                 // => Nested collection
                          // => Students in Elementary school
            new() { Name = "Alice", Age = 8 },
                          // => Student 1 in Elementary
            new() { Name = "Bob", Age = 9 }
                          // => Student 2 in Elementary
        }
    },
    new()                 // => Second school
    {
        Name = "Middle School",
                          // => Middle School
        Students = new List<Student>
        {                 // => Students in Middle School
            new() { Name = "Charlie", Age = 12 },
                          // => Student 1 in Middle School
            new() { Name = "Diana", Age = 13 }
                          // => Student 2 in Middle School
        }
    }
};                        // => schools has 2 elements, total 4 students

// Select would return List<List<Student>> (nested)
var nestedStudents = schools.Select(s => s.Students);
                          // => Returns IEnumerable<List<Student>>
                          // => Still nested structure (collection of collections)
                          // => Type: IEnumerable<List<Student>>

// SelectMany flattens to single sequence
var allStudents = schools.SelectMany(s => s.Students);
                          // => Projects each school to its students
                          // => Flattens results into single IEnumerable<Student>
                          // => allStudents contains all 4 students (not nested)
                          // => Type: IEnumerable<Student> (flat)

foreach (var student in allStudents)
{                         // => Iterate flattened collection
    Console.WriteLine($"{student.Name}, Age: {student.Age}");
                          // => Output: Alice, Age: 8
                          // =>         Bob, Age: 9
                          // =>         Charlie, Age: 12
                          // =>         Diana, Age: 13
                          // => All 4 students from both schools
}

// SelectMany with result selector
var studentsWithSchool = schools.SelectMany(
                          // => Two-parameter overload
    school => school.Students,
                          // => Collection selector
                          // => Selects Students property from each school
    (school, student) => new
    {                     // => Result selector: combines school and student
                          // => Anonymous type with 3 properties
        SchoolName = school.Name,
                          // => Property from outer (school)
        StudentName = student.Name,
                          // => Property from inner (student)
        Age = student.Age
                          // => Age from student
    }
);                        // => Returns IEnumerable of anonymous type
                          // => Each element has SchoolName, StudentName, Age

foreach (var item in studentsWithSchool)
{
    Console.WriteLine($"{item.StudentName} at {item.SchoolName}, Age: {item.Age}");
                          // => Output: Alice at Elementary, Age: 8
                          // =>         Bob at Elementary, Age: 9
                          // =>         Charlie at Middle School, Age: 12
                          // =>         Diana at Middle School, Age: 13
}
```

**Key Takeaway**: `SelectMany` flattens nested collections into a single sequence. Use the two-parameter overload to preserve parent context.

**Why It Matters**: SelectMany is essential for hierarchical data structures. Order processing systems flatten order lines across multiple orders to calculate total revenue. Analytics platforms flatten user sessions (each containing multiple events) to compute event frequencies. SelectMany replaces nested loops with declarative LINQ expressions that are more readable and optimizable. In Entity Framework, SelectMany translates to SQL JOINs, enabling efficient relational queries without manual join syntax. Graph traversal algorithms use SelectMany to expand node neighbor lists.

## Example 43: Delegates - Function Pointers

Delegates are type-safe function pointers that reference methods with matching signatures.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Delegate Declaration]:::blue --> B[Points to Method]:::orange
    B --> C[Invoke via Delegate]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 43: Delegates
delegate int MathOperation(int a, int b);
                          // => Delegate type declaration
                          // => Defines signature: (int, int) => int
                          // => Like a function pointer type in C
                          // => Type-safe method reference

int Add(int a, int b)     // => Method matching delegate signature
{                         // => Signature matches MathOperation
    return a + b;         // => Simple addition
                          // => Returns sum
}

int Multiply(int a, int b)
{                         // => Another method matching signature
    return a * b;         // => Simple multiplication
                          // => Returns product
}

MathOperation operation = Add;
                          // => Delegate instance pointing to Add method
                          // => No parentheses (reference, not invocation)
                          // => operation holds reference to Add

int result = operation(5, 3);
                          // => Invoke through delegate
                          // => Calls Add(5, 3) indirectly
                          // => result is 8

Console.WriteLine(result);// => Output: 8

operation = Multiply;     // => Reassign delegate to different method
                          // => Now points to Multiply instead of Add
                          // => Demonstrates delegate flexibility

result = operation(5, 3); // => Calls Multiply(5, 3)
                          // => Same invocation syntax, different method
                          // => result is 15

Console.WriteLine(result);// => Output: 15

// Delegate as parameter (callback pattern)
void ExecuteOperation(int x, int y, MathOperation op)
{                         // => Higher-order function
                          // => Takes delegate as parameter
    int outcome = op(x, y);
                          // => Invoke callback
    Console.WriteLine($"Result: {outcome}");
}

ExecuteOperation(10, 2, Add);
                          // => Pass Add method as callback
                          // => Output: Result: 12

ExecuteOperation(10, 2, Multiply);
                          // => Pass Multiply method
                          // => Output: Result: 20
```

**Key Takeaway**: Delegates are type-safe function pointers that can reference methods with matching signatures. They enable callbacks and higher-order functions.

**Why It Matters**: Delegates are foundational to C#'s event system and LINQ. They enable inversion of control where caller provides behavior (strategy pattern). UI frameworks use delegates for button click handlers. LINQ methods like `Where` and `Select` accept delegates (Func<T, TResult>) to customize filtering and projection logic. Multicast delegates combine multiple method calls into a single invocation chain, used extensively in event systems where multiple subscribers respond to a single event notification.

## Example 44: Events - Publisher-Subscriber Pattern

Events enable the publisher-subscriber pattern where objects notify subscribers of state changes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Publisher<br/>Button]:::blue --> B[Event Raised<br/>OnClick]:::orange
    B --> C[Subscriber 1<br/>Logger]:::teal
    B --> D[Subscriber 2<br/>Analytics]:::teal

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 44: Events - Publisher-Subscriber Pattern
class Button                // => Publisher (event source)
{                         // => Raises Clicked event
    public event EventHandler? Clicked;
                          // => Event declaration
                          // => EventHandler is delegate type: (object?, EventArgs) => void
                          // => ? makes event nullable (C# 8+)
                          // => Subscribers register with += operator

    public void Click()   // => Method that raises event
    {                     // => Simulates button click action
        Console.WriteLine("Button clicked");
                          // => Button's internal action
                          // => Outputs before raising event

        Clicked?.Invoke(this, EventArgs.Empty);
                          // => Raise event (notify subscribers)
                          // => ?. only invokes if Clicked not null
                          // => this is sender (Button instance)
                          // => EventArgs.Empty is empty event data
                          // => All subscribers called
    }
}

class Logger              // => Subscriber 1 (observer)
{                         // => Listens for Clicked event
    public void OnButtonClicked(object? sender, EventArgs e)
    {                     // => Event handler method
                          // => Signature matches EventHandler delegate
                          // => sender is event source (Button)
        Console.WriteLine("Logger: Button was clicked");
                          // => Subscriber's response to event
                          // => Logs the click
    }
}

class Analytics           // => Subscriber 2
{
    public void OnButtonClicked(object? sender, EventArgs e)
    {
        Console.WriteLine("Analytics: Tracking click event");
                          // => Different subscriber action
    }
}

var button = new Button();
                          // => Create publisher

var logger = new Logger();
var analytics = new Analytics();

// Subscribe to event
button.Clicked += logger.OnButtonClicked;
                          // => += adds subscriber
                          // => Registers logger handler

button.Clicked += analytics.OnButtonClicked;
                          // => Multiple subscribers allowed
                          // => Both logger and analytics will be notified

button.Click();           // => Trigger button click
                          // => Output: Button clicked
                          // =>         Logger: Button was clicked
                          // =>         Analytics: Tracking click event

// Unsubscribe
button.Clicked -= logger.OnButtonClicked;
                          // => -= removes subscriber

button.Click();           // => Only analytics notified now
                          // => Output: Button clicked
                          // =>         Analytics: Tracking click event
```

**Key Takeaway**: Events enable loose coupling between publishers and subscribers. Publishers raise events without knowing who's listening. Subscribers can register/unregister handlers using `+=` and `-=`.

**Why It Matters**: Events are central to UI frameworks (button clicks, keyboard input) and reactive systems. They enable loose coupling - UI controls don't need to know about business logic subscribers. ASP.NET Core uses events for application lifecycle (startup, shutdown). Message brokers implement publish-subscribe patterns for distributed systems where services communicate through events without direct dependencies.

## Example 45: Generics - Type Parameters

Generics enable writing reusable code that works with multiple types while maintaining type safety.

#### Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Box<T>\n(generic class)"] -->|"T = int"| B["Box<int>\nstores integers only"]
    A -->|"T = string"| C["Box<string>\nstores strings only"]
    A -->|"T = Person"| D["Box<Person>\nstores Person only"]
    B -->|"type safety"| E["Compiler enforces\ncorrect type at compile time"]
    C -->|"type safety"| E
    D -->|"type safety"| E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#000
    style E fill:#CA9161,stroke:#000,color:#fff
```

```csharp
// Example 45: Generics - Type Parameters
class Box<T>              // => Generic class with type parameter T
{                         // => T is placeholder for actual type
                          // => <T> syntax declares type parameter
    private T content;    // => Field of type T
                          // => Type determined at instantiation
                          // => T replaced with concrete type

    public Box(T item)    // => Constructor with T parameter
    {                     // => item is of type T
        content = item;   // => Store item of type T
                          // => content's type matches item's type
    }

    public T GetContent()
    {                     // => Return type is T
                          // => Method signature uses generic type
        return content;   // => Type-safe return
                          // => Returns exactly type T
    }
}

var intBox = new Box<int>(42);
                          // => T becomes int (type argument)
                          // => intBox.GetContent() returns int
                          // => content field is int

var stringBox = new Box<string>("Hello");
                          // => T becomes string
                          // => stringBox.GetContent() returns string
                          // => Different type argument, same class

Console.WriteLine(intBox.GetContent());
                          // => Output: 42
                          // => Type: int (no casting needed)
                          // => Type safety maintained

Console.WriteLine(stringBox.GetContent());
                          // => Output: Hello
                          // => Type: string

// Generic method
T GetFirst<T>(List<T> list)
{                         // => Generic method (not in generic class)
                          // => T is method-level type parameter
    return list[0];       // => Returns first element
                          // => Return type is T
}

var numbers = new List<int> { 1, 2, 3 };
var firstNumber = GetFirst(numbers);
                          // => T inferred as int
                          // => firstNumber is 1 (type: int)

var words = new List<string> { "apple", "banana" };
var firstWord = GetFirst(words);
                          // => T inferred as string
                          // => firstWord is "apple"

Console.WriteLine($"{firstNumber}, {firstWord}");
                          // => Output: 1, apple
```

**Key Takeaway**: Generics enable type-safe reusable code through type parameters. Type arguments can be specified explicitly or inferred by the compiler.

**Why It Matters**: Generics eliminate code duplication and casting while maintaining type safety. Before generics, collections used `object` requiring casts and losing compile-time type checking. Generic collections like `List<T>` provide type safety and performance (no boxing for value types). Repository patterns use `IRepository<T>` to provide CRUD operations for any entity type without code duplication.

## Example 46: Generic Constraints - Restricting Type Parameters

Generic constraints restrict type parameters to specific types or capabilities, enabling type-specific operations.

#### Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Repository<T>\nwhere T : IStorable, new()"] -->|"constraint: T must implement"| B["IStorable\n(has Id property)"]
    A -->|"constraint: T must have"| C["new()\n(parameterless constructor)"]
    A -->|"enables"| D["Save(entity)\nGetById(id)"]
    B -->|"satisfied by"| E["User : IStorable"]
    B -->|"satisfied by"| F["Product : IStorable"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#000
    style F fill:#CC78BC,stroke:#000,color:#000
```

```csharp
// Example 46: Generic Constraints
interface IStorable       // => Interface for database entities
{                         // => Defines contract for storage
    int Id { get; set; }  // => All storable entities have Id
                          // => Primary key property
    void Save();          // => Save to database
                          // => Persistence method
}

class Repository<T> where T : IStorable
{                         // => where T : IStorable is constraint
                          // => T MUST implement IStorable interface
                          // => Enables calling IStorable members on T
                          // => Compile-time enforcement
    private List<T> items = new();
                          // => Internal storage
                          // => List of constrained type T

    public void Add(T item)
    {                     // => Add method accepts T
                          // => T guaranteed to implement IStorable
        items.Add(item);  // => Store item in list
                          // => items collection

        item.Save();      // => ALLOWED because T : IStorable
                          // => Compiler knows T has Save method
                          // => Constraint enables this call
    }

    public T? GetById(int id)
    {                     // => ? marks nullable return
                          // => T? allows null return
        return items.FirstOrDefault(item => item.Id == id);
                          // => ALLOWED because T : IStorable
                          // => Compiler knows T has Id property
                          // => LINQ query on items
    }
}

class Product : IStorable // => Product implements IStorable
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    public void Save()
    {
        Console.WriteLine($"Saving product {Name} to database");
                          // => Mock save operation
    }
}

var repo = new Repository<Product>();
                          // => Product satisfies IStorable constraint
                          // => Compilation succeeds

var product = new Product { Id = 1, Name = "Laptop" };

repo.Add(product);        // => Adds and saves product
                          // => Output: Saving product Laptop to database

var retrieved = repo.GetById(1);
                          // => retrieved is product with Id=1
                          // => Type: Product? (nullable)

Console.WriteLine(retrieved?.Name);
                          // => Output: Laptop

// var invalidRepo = new Repository<string>();
                          // => COMPILATION ERROR
                          // => string doesn't implement IStorable
```

**Key Takeaway**: Generic constraints use `where T : Type` syntax to restrict type parameters. Constraints enable calling methods/properties specific to the constraint type.

**Why It Matters**: Constraints balance reusability and type safety. Without constraints, generic code can only use `object` members. With constraints, generic code can call constraint-specific members while remaining reusable for all types satisfying the constraint. Entity Framework uses `where T : class` constraints for reference type requirements. Math libraries use `where T : INumber<T>` (C# 11+) to write generic numeric code.

## Example 47: Extension Methods - Adding Methods to Existing Types

Extension methods enable adding methods to existing types without modifying their source code or creating derived types.

#### Diagram

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["static class StringExtensions\n(extension method host)"] -->|"extends"| B["string type\n(existing type, not modified)"]
    B -->|"new methods available"| C["str.IsPalindrome()"]
    B -->|"new methods available"| D["str.WordCount()"]
    B -->|"new methods available"| E["str.ToTitleCase()"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

```csharp
// Example 47: Extension Methods
static class StringExtensions
{                         // => Static class for extension methods
                          // => Must be static class
                          // => Contains extension methods
    public static bool IsValidEmail(this string email)
    {                     // => this keyword makes it extension method
                          // => Extends string type
                          // => email is the string instance
                          // => Called on string objects

        return email.Contains("@") && email.Contains(".");
                          // => Simple email validation
                          // => Real validation uses regex
                          // => Checks for @ and . characters
    }

    public static string Truncate(this string str, int maxLength)
    {                     // => Extension with additional parameter
                          // => this string str extends string
                          // => maxLength is regular parameter
        if (str.Length <= maxLength)
                          // => Check if truncation needed
                          // => Return original if short enough
            return str;   // => No truncation needed

        return str.Substring(0, maxLength) + "...";
                          // => Truncate and add ellipsis
    }
}

string email = "user@example.com";

bool isValid = email.IsValidEmail();
                          // => Calls extension method AS IF it's instance method
                          // => isValid is true

Console.WriteLine(isValid);
                          // => Output: True

string longText = "This is a very long text that needs truncation";

string truncated = longText.Truncate(20);
                          // => Calls Truncate extension method
                          // => truncated is "This is a very long ..."

Console.WriteLine(truncated);
                          // => Output: This is a very long ...

// Extension methods on null
string? nullString = null;

// bool result = nullString.IsValidEmail();
                          // => NullReferenceException
                          // => Extension methods don't protect against null

// Null-safe extension
static class SafeExtensions
{
    public static bool IsNullOrEmpty(this string? str)
    {                     // => Accepts nullable string
        return string.IsNullOrEmpty(str);
                          // => Safe to call on null
    }
}

bool isEmpty = nullString.IsNullOrEmpty();
                          // => No exception
                          // => isEmpty is true

Console.WriteLine(isEmpty);
                          // => Output: True
```

**Key Takeaway**: Extension methods use `this` keyword on first parameter to extend existing types. They appear as instance methods but are static methods.

**Why It Matters**: Extension methods enable fluent APIs and adding functionality to types you don't own (framework types, third-party libraries). LINQ is entirely built on extension methods - `Where`, `Select`, `GroupBy` are extensions on `IEnumerable<T>`. Custom extension methods improve code readability by enabling method chaining and domain-specific operations without inheritance. Extension methods on `ILogger` create structured logging helpers. Fluent validation libraries use extension methods to build readable validation rules like `RuleFor(x => x.Email).NotEmpty().EmailAddress()`.

## Example 48: Indexers - Array-Like Access

Indexers enable array-like access to objects using `[]` syntax, providing custom getter/setter logic.

```csharp
// Example 48: Indexers
class ShoppingCart        // => Shopping cart class
{                         // => Enables array-like access
    private Dictionary<string, int> items = new();
                          // => Internal storage: product name → quantity
                          // => Dictionary maps string keys to int values
                          // => new() uses target-type inference (Dictionary<string,int>)

    public int this[string productName]  // => Indexer declaration
    {                     // => this[string] enables cart["Apple"] syntax
                          // => Property-like syntax with a parameter
        get               // => Get accessor returns current quantity
        {                 // => Called when reading: cart["Apple"]
            return items.ContainsKey(productName) ? items[productName] : 0;
                          // => ContainsKey prevents KeyNotFoundException
                          // => Returns quantity or 0 if not in cart
        }
        set               // => Set accessor updates quantity
        {                 // => value is implicit parameter (the right-hand side)
            if (value > 0)   // => Positive quantity: add/update
                items[productName] = value;
                          // => Add new key or update existing
            else             // => Zero/negative: remove from cart
                items.Remove(productName);
                          // => Remove product entry entirely
        }
    }

    public int Count => items.Count;
                          // => Expression-bodied property
                          // => Number of distinct products in cart
}

var cart = new ShoppingCart();
                          // => Empty cart: no items

cart["Apple"] = 5;        // => Calls indexer setter with productName="Apple", value=5
                          // => items["Apple"]=5 (added to dictionary)

cart["Banana"] = 3;       // => Adds bananas to cart
                          // => items["Banana"]=3

Console.WriteLine(cart["Apple"]);
                          // => Calls indexer getter: returns items["Apple"]
                          // => Output: 5

Console.WriteLine(cart["Orange"]);
                          // => "Orange" not in dictionary
                          // => Returns 0 (default case in getter)
                          // => Output: 0

cart["Apple"] = 10;       // => Updates apple quantity via setter
                          // => items["Apple"] is now 10 (overwritten)

cart["Banana"] = 0;       // => value=0: triggers Remove in setter
                          // => Banana entry deleted from dictionary
                          // => cart.Count is now 1 (only Apple remains)

Console.WriteLine(cart.Count);
                          // => Reads Count property
                          // => Output: 1

// Multi-parameter indexer
class Matrix               // => 2D grid with row/col indexer
{
    private int[,] data = new int[3, 3];
                          // => 3x3 two-dimensional array (all zeros initially)

    public int this[int row, int col]  // => Two-parameter indexer
    {                     // => Enables matrix[row, col] syntax
                          // => Matches mathematical matrix notation
        get => data[row, col];   // => Read element at position
        set => data[row, col] = value;  // => Write element at position
    }
}

var matrix = new Matrix();
                          // => 3x3 matrix, all zeros
matrix[0, 0] = 1;         // => Set top-left element to 1
                          // => data[0,0] = 1
matrix[1, 1] = 5;         // => Set center element to 5
                          // => data[1,1] = 5

Console.WriteLine(matrix[0, 0]);
                          // => Reads data[0,0]
                          // => Output: 1
```

**Key Takeaway**: Indexers use `this[type param]` syntax to enable array-like access with custom logic. They can have multiple parameters for multi-dimensional access.

**Why It Matters**: Indexers make collection-like classes intuitive by providing familiar array syntax. They're essential for custom collections and data structures. JSON libraries use indexers for `json["property"]["nested"]` syntax. Entity Framework uses indexers for `entity["PropertyName"]` dynamic property access. Matrix math libraries use multi-parameter indexers for `matrix[row, col]` notation matching mathematical convention. Custom cache classes use string indexers to provide consistent access syntax while encapsulating cache expiry and miss-handling logic transparently.

## Example 49: Pattern Matching - Type Patterns and Switch Expressions

Pattern matching enables concise type checking and value extraction using `is`, `switch` expressions, and patterns.

```csharp
// Example 49: Pattern Matching
object obj = "Hello";     // => obj type is object (base type)
                          // => Actual value is string
                          // => Boxing: string → object

// Type pattern with is
if (obj is string str)    // => is checks type AND extracts value
{                         // => str is new variable of type string
                          // => Pattern match + declaration
    Console.WriteLine($"String of length {str.Length}");
                          // => str is "Hello" (extracted from obj)
                          // => str.Length is 5
                          // => Output: String of length 5
}

// Switch expression with patterns
string GetDescription(object value) => value switch  // => Expression-bodied method
{                         // => Switch expression returns string value
                          // => Each arm: pattern => result
    int i => $"Integer: {i}",
                          // => Type pattern: matches int, captures as i
                          // => i is the matched integer value
    string s => $"String of length {s.Length}",
                          // => Type pattern: matches string, captures as s
                          // => s.Length accesses the matched string's length
    bool b => $"Boolean: {b}",
                          // => Type pattern: matches bool, captures as b
                          // => b is the matched boolean value
    null => "Null value",
                          // => Null pattern: explicit null matching
                          // => Must appear before _ to avoid warnings
    _ => "Unknown type"   // => Discard pattern: catches everything else
                          // => Exhaustive - no unhandled cases
};

Console.WriteLine(GetDescription(42));
                          // => 42 is int → matches int pattern
                          // => i=42, returns "Integer: 42"
                          // => Output: Integer: 42

Console.WriteLine(GetDescription("Test"));
                          // => "Test" is string → matches string pattern
                          // => s="Test", s.Length=4
                          // => Output: String of length 4

Console.WriteLine(GetDescription(true));
                          // => true is bool → matches bool pattern
                          // => b=true
                          // => Output: Boolean: True

Console.WriteLine(GetDescription(null));
                          // => null → matches null pattern
                          // => Output: Null value

// Property patterns
class Person               // => Data class for pattern matching
{
    public string Name { get; set; } = "";  // => Auto-property with default
    public int Age { get; set; }             // => Age: used in property patterns
}

string GetAgeGroup(Person person) => person switch  // => Pattern match on Person
{
    { Age: < 13 } => "Child",
                          // => Property pattern: { Age: < 13 }
                          // => Matches persons with Age < 13
    { Age: < 20 } => "Teenager",
                          // => Matches Age 13-19 (< 13 already matched above)
    { Age: < 65 } => "Adult",
                          // => Matches Age 20-64
    { Age: >= 65 } => "Senior",
                          // => Matches Age 65+
    _ => "Unknown"        // => Default: handles null or edge cases
};

var person1 = new Person { Name = "Alice", Age = 10 };
                          // => Alice: Age=10 → will match "Child" pattern
var person2 = new Person { Name = "Bob", Age = 30 };
                          // => Bob: Age=30 → will match "Adult" pattern

Console.WriteLine(GetAgeGroup(person1));
                          // => { Age: < 13 } matches (Age=10 < 13)
                          // => Output: Child

Console.WriteLine(GetAgeGroup(person2));
                          // => { Age: < 65 } matches (Age=30)
                          // => Output: Adult

// Positional patterns with tuples
(int, int) point = (3, 4);
                          // => point is a ValueTuple<int,int> with x=3, y=4

string GetQuadrant((int x, int y) p) => p switch  // => Pattern match on tuple
{
    (0, 0) => "Origin",   // => Exact match: x=0 AND y=0
                          // => Constant patterns in both positions
    ( > 0, > 0) => "Quadrant I",
                          // => Relational patterns: x > 0 AND y > 0
    ( < 0, > 0) => "Quadrant II",
                          // => x < 0 AND y > 0
    ( < 0, < 0) => "Quadrant III",
                          // => x < 0 AND y < 0
    ( > 0, < 0) => "Quadrant IV",
                          // => x > 0 AND y < 0
    (_, 0) => "X-axis",   // => _ discards x value; y must equal 0
    (0, _) => "Y-axis"    // => x=0; _ discards y value
};

Console.WriteLine(GetQuadrant(point));
                          // => point=(3,4): x=3>0, y=4>0 → Quadrant I
                          // => Output: Quadrant I
```

**Key Takeaway**: Pattern matching enables concise type checking, value extraction, and condition testing. Switch expressions provide expression-based pattern matching with exhaustiveness checking.

**Why It Matters**: Pattern matching reduces boilerplate code for type testing and extraction. Traditional `if-else` chains with `is` and casting are verbose and error-prone. Switch expressions are exhaustive (compiler warns on missing patterns) and expression-based (can be used in LINQ, return statements). API handlers use pattern matching to route requests based on method/path patterns. State machines use property patterns to match complex state transitions.

## Example 50: Records - Immutable Data Types

Records are reference types designed for immutable data with value-based equality.

```csharp
// Example 50: Records
record Person(string Name, int Age);
                          // => Positional record (C# 9+)
                          // => Automatically generates:
                          // =>   - Properties: Name, Age
                          // =>   - Constructor: Person(string, int)
                          // =>   - ToString override
                          // =>   - Value-based equality

var person1 = new Person("Alice", 30);
                          // => Primary constructor
                          // => person1.Name is "Alice"
                          // => person1.Age is 30

var person2 = new Person("Alice", 30);
                          // => Different instance, same values

Console.WriteLine(person1 == person2);
                          // => Value-based equality (not reference)
                          // => Output: True
                          // => Classes use reference equality by default

Console.WriteLine(person1);
                          // => ToString auto-generated
                          // => Output: Person { Name = Alice, Age = 30 }

// Immutability - properties are init-only
// person1.Name = "Bob"; // => COMPILATION ERROR
                          // => Properties are immutable after construction

// with expression for non-destructive mutation
var person3 = person1 with { Age = 31 };
                          // => Creates new Person with Age=31
                          // => Name copied from person1
                          // => person1 unchanged (immutable)

Console.WriteLine(person1);
                          // => Output: Person { Name = Alice, Age = 30 }
Console.WriteLine(person3);
                          // => Output: Person { Name = Alice, Age = 31 }

// Record with additional members
record Employee(string Name, int Age, string Department)
{
    public decimal Salary { get; init; }
                          // => Additional init-only property
                          // => Not in primary constructor

    public string GetInfo() => $"{Name} ({Age}) - {Department}";
                          // => Custom method
}

var employee = new Employee("Bob", 25, "IT")
{
    Salary = 75000        // => Object initializer for Salary
};

Console.WriteLine(employee.GetInfo());
                          // => Output: Bob (25) - IT

Console.WriteLine(employee.Salary);
                          // => Output: 75000

// Deconstruction
var (name, age) = person1;
                          // => Deconstructs into tuple
                          // => name is "Alice", age is 30

Console.WriteLine($"{name}, {age}");
                          // => Output: Alice, 30
```

**Key Takeaway**: Records provide immutable data types with value-based equality, `with` expressions for non-destructive updates, and automatic ToString/equality implementations.

**Why It Matters**: Records reduce boilerplate for data transfer objects (DTOs) and value objects. Traditional classes require manual equality, ToString, and immutability implementations. Records provide these automatically with concise syntax. API models use records for request/response DTOs with guaranteed immutability. Domain-driven design uses records for value objects like Money, Address, where equality is based on values, not identity.

## Example 51: Init-Only Properties - Object Initializer Immutability

Init-only properties allow property assignment during object initialization but are immutable afterward.

```csharp
// Example 51: Init-Only Properties
class Product             // => Product entity with init-only properties
{
    public string Name { get; init; }  // => Name property with init accessor
                          // => init accessor (C# 9+): assign only during init
                          // => Immutable after construction

    public decimal Price { get; init; }  // => Price: init-only decimal
                          // => Settable in object initializer, then locked
    public string Category { get; init; }  // => Category: init-only
                          // => Any type can use init accessor

    // Constructor not required for init properties
}

var product = new Product  // => Create Product using object initializer
{                         // => Object initializer: sets all init properties
    Name = "Laptop",      // => Calls init setter for Name
                          // => Name is "Laptop" from this point
    Price = 999.99m,      // => Calls init setter for Price (decimal literal)
    Category = "Electronics"  // => Calls init setter for Category
                          // => Category is "Electronics"
};
                          // => Initialization complete: product is immutable

Console.WriteLine($"{product.Name}: ${product.Price}");  // => Read init properties
                          // => get accessors have no restrictions
                          // => Output: Laptop: $999.99

// product.Price = 899.99m;
                          // => COMPILATION ERROR
                          // => init properties are read-only after initialization

// With constructor
class Person              // => Person with init properties AND constructor
{
    public string FirstName { get; init; }  // => First name: init-only
                          // => Init accessor allows both constructor and initializer
    public string LastName { get; init; }   // => Last name: init-only
                          // => Both properties settable during construction

    public Person(string firstName, string lastName)  // => Traditional constructor
    {                     // => Constructor can set init properties
        FirstName = firstName;  // => Initialize from constructor parameter
                          // => This is allowed: init properties settable in ctor
        LastName = lastName;    // => LastName receives constructor argument
                          // => lastName is "Smith" → LastName is "Smith"
    }

    public string FullName => $"{FirstName} {LastName}";  // => Computed property
                          // => Expression-bodied: returns interpolated string
                          // => Uses both init properties
}

var person1 = new Person("Alice", "Smith");  // => Calls constructor
                          // => FirstName="Alice", LastName="Smith"
                          // => No object initializer

var person2 = new Person("Bob", "Jones")  // => Constructor + object initializer
{
    FirstName = "Robert"  // => Override FirstName set by constructor
                          // => Init accessor allows this override
};                        // => person2.FirstName is "Robert" (not "Bob")

Console.WriteLine(person1.FullName);  // => Access computed FullName property
                          // => FirstName="Alice", LastName="Smith"
                          // => Output: Alice Smith

Console.WriteLine(person2.FullName);  // => person2 has overridden FirstName
                          // => Output: Robert Jones (overridden first name)

// Init with required (C# 11+)
class User                // => User with required init property
{
    public required string Username { get; init; }  // => required + init
                          // => required: must be set (compiler enforces)
                          // => init: immutable after initialization

    public string? Email { get; init; }  // => Optional nullable init property
                          // => Can be omitted from object initializer
}

var user = new User       // => Instantiate User
{
    Username = "alice123"  // => Required property: must provide
                          // => Omitting Username → compile error
};
                          // => user.Email is null (optional, not provided)

// var invalidUser = new User { };
                          // => COMPILATION ERROR
                          // => Username not set (required property missing)
```

**Key Takeaway**: Init-only properties enable immutability while supporting flexible object initialization patterns. Combined with `required`, they enforce mandatory properties at compile time.

**Why It Matters**: Init properties provide immutability benefits without sacrificing initialization flexibility. Traditional readonly fields require constructor parameters, leading to long parameter lists. Init properties support object initializers with named parameters, improving readability. Configuration objects use init properties for immutable settings that are set once at startup. `System.Text.Json` deserializes into init-only records without requiring constructors, enabling immutable API request models that cannot be accidentally mutated during request processing.

## Example 52: Tuples - Lightweight Data Structures

Tuples provide lightweight, unnamed data structures for returning multiple values or grouping data temporarily.

```csharp
// Example 52: Tuples
(string, int) GetPersonInfo()   // => Return type: unnamed tuple
{                         // => No need to define separate class
                          // => Parenthesized type list
    return ("Alice", 30); // => Tuple literal: name "Alice", age 30
                          // => Creates ValueTuple<string, int>
}

var info = GetPersonInfo();
                          // => info is (string, int) tuple
                          // => Type inferred: ValueTuple<string, int>

Console.WriteLine($"{info.Item1}, {info.Item2}");
                          // => Item1="Alice", Item2=30 (default names)
                          // => Output: Alice, 30

// Named tuple elements
(string Name, int Age) GetNamedPersonInfo()  // => Named tuple return type
{                         // => Named tuple elements improve readability
    return (Name: "Bob", Age: 25);
                          // => Named tuple literal
                          // => Names are not stored at runtime (compiler feature)
}

var namedInfo = GetNamedPersonInfo();
                          // => namedInfo.Name="Bob", namedInfo.Age=25
                          // => Access via element names instead of Item1/Item2

Console.WriteLine($"{namedInfo.Name}, {namedInfo.Age}");
                          // => Uses named properties for clarity
                          // => Output: Bob, 25

// Tuple deconstruction
var (name, age) = GetNamedPersonInfo();
                          // => Deconstruct tuple into individual variables
                          // => name is "Bob" (type: string)
                          // => age is 25 (type: int)

Console.WriteLine($"Name: {name}, Age: {age}");
                          // => Access deconstructed variables directly
                          // => Output: Name: Bob, Age: 25

// Discard unwanted elements
var (personName, _) = GetNamedPersonInfo();
                          // => _ is discard: explicitly ignore age
                          // => personName is "Bob"

Console.WriteLine(personName);
                          // => Access only the captured variable
                          // => Output: Bob

// Tuples in LINQ
var products = new List<(string Name, decimal Price)>  // => List of named tuples
{                         // => Collection initializer with tuple literals
    ("Laptop", 999.99m),  // => First tuple: Name="Laptop", Price=999.99
    ("Mouse", 29.99m),    // => Second tuple: Name="Mouse", Price=29.99
    ("Keyboard", 79.99m)  // => Third tuple: Name="Keyboard", Price=79.99
};
                          // => products has 3 tuples

var expensiveProducts = products
    .Where(p => p.Price > 50)     // => Filter: keep tuples where Price > 50
                          // => Filtered: Laptop(999.99) and Keyboard(79.99)
    .Select(p => p.Name); // => Project: extract Name from each tuple
                          // => Result: IEnumerable<string> ["Laptop", "Keyboard"]

foreach (var product in expensiveProducts)
{                         // => Iterate projected names
    Console.WriteLine(product);
                          // => Output: Laptop
                          // =>         Keyboard
}

// Tuple equality
var tuple1 = (1, "Test");   // => ValueTuple with Item1=1, Item2="Test"
var tuple2 = (1, "Test");   // => Separate instance with same values

Console.WriteLine(tuple1 == tuple2);
                          // => Value-based equality (struct semantics)
                          // => Compares element-by-element
                          // => Output: True
```

**Key Takeaway**: Tuples provide lightweight data structures with optional named elements. Use deconstruction to extract values into separate variables.

**Why It Matters**: Tuples eliminate the need for throwaway classes when returning multiple values or grouping temporary data. They're ideal for internal method returns, LINQ projections, and dictionary keys. Database access code returns `(bool success, T result)` tuples instead of defining result wrapper classes. However, use records or classes for public APIs and complex data structures where named types improve clarity.

## Example 53: IEnumerable<T> and Deferred Execution

`IEnumerable<T>` enables LINQ queries with deferred execution - queries execute only when enumerated.

```csharp
// Example 53: IEnumerable<T> and Deferred Execution
List<int> numbers = new() { 1, 2, 3, 4, 5 };
                          // => Target-typed new: List<int> inferred
                          // => numbers is [1, 2, 3, 4, 5]

Console.WriteLine("Creating query...");
                          // => Output: Creating query...

IEnumerable<int> query = numbers.Where(n =>  // => Build lazy LINQ query
{                         // => LINQ query
    Console.WriteLine($"Filtering {n}");
                          // => Proves when lambda executes
                          // => Side effect to show execution timing
    return n % 2 == 0;   // => Same even-number predicate    // => Filter even numbers
});                       // => Query NOT executed yet (deferred)
                          // => No "Filtering X" printed

Console.WriteLine("Query created (not executed)");
                          // => This executes before any filtering
                          // => Output: Creating query...
                          // =>         Query created (not executed)
                          // => No filtering happened yet

Console.WriteLine("\nFirst enumeration:");
                          // => Output: First enumeration:
foreach (var n in query)  // => Query executes NOW
{                         // => "Filtering X" messages appear
    Console.WriteLine($"Result: {n}");
                          // => Prints matching results
                          // => Output: Filtering 1
                          // =>         Filtering 2
                          // =>         Result: 2
                          // =>         Filtering 3
                          // =>         Filtering 4
                          // =>         Result: 4
                          // =>         Filtering 5
}

Console.WriteLine("\nSecond enumeration:");
                          // => Starting second iteration
foreach (var n in query)  // => Query EXECUTES AGAIN
{                         // => Deferred execution means re-evaluation
    Console.WriteLine($"Result: {n}");
                          // => "Filtering X" messages repeat
}

// Forcing immediate execution
Console.WriteLine("\n\nWith ToList:");
                          // => Demonstrating eager evaluation
var list = numbers.Where(n =>  // => New query then force evaluation
{
    Console.WriteLine($"Filtering {n}");
    return n % 2 == 0;
}).ToList();              // => ToList forces immediate execution
                          // => "Filtering X" messages print NOW
                          // => list is List<int>, not IEnumerable<int>

Console.WriteLine("ToList completed");
                          // => All filtering already happened during ToList()

foreach (var n in list)   // => Iterates cached results
{                         // => No filtering happens (already executed)
    Console.WriteLine($"Result: {n}");
                          // => Output: Result: 2
                          // =>         Result: 4
}
```

**Key Takeaway**: `IEnumerable<T>` queries use deferred execution - they execute when enumerated, not when created. Use `ToList()` or `ToArray()` to force immediate execution.

**Why It Matters**: Deferred execution enables composable queries and efficient data processing. Queries can be built incrementally and only execute when needed. However, deferred execution can cause unexpected behavior - queries re-execute on each enumeration and capture variable values at execution time (not creation time). Use `ToList()` when you need to cache results or when the source data may change between enumerations.

## Example 54: Dependency Injection - Constructor Injection

Dependency injection inverts control by having dependencies provided to classes rather than classes creating dependencies.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[DI Container]:::blue --> B[Creates ILogger]:::orange
    A --> C[Creates EmailService]:::orange
    B --> D[Injects into UserService]:::teal
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

**Code**:

```csharp
// Example 54: Dependency Injection
interface ILogger         // => Abstraction for logging
{                         // => Interface defines contract
    void Log(string message);  // => Single method signature
                          // => Any type implementing this can be used as ILogger
}

class ConsoleLogger : ILogger  // => Concrete implementation
{                         // => Implements ILogger interface
    public void Log(string message)  // => Required implementation
    {                     // => Must be public (interface member)
        Console.WriteLine($"[LOG] {message}");
                          // => Adds [LOG] prefix for clarity
                          // => Writes to standard output
    }
}

interface IEmailService   // => Abstraction for email sending
{                         // => Separates contract from implementation
    void SendEmail(string to, string subject);  // => Email signature
                          // => to: recipient address, subject: email subject
}

class EmailService : IEmailService  // => Email service implementation
{                         // => Concrete class satisfying IEmailService contract
    private readonly ILogger logger;
                          // => Logging dependency: declared as interface
                          // => readonly ensures field set only in constructor

    public EmailService(ILogger logger)  // => Constructor injection
    {                     // => logger provided by caller (DI container/test)
                          // => EmailService doesn't know which ILogger it gets
        this.logger = logger;
                          // => Store injected ILogger for use in methods
                          // => this.logger disambiguates from parameter
    }

    public void SendEmail(string to, string subject)  // => Required by interface
    {                     // => Implementation of IEmailService.SendEmail
        logger.Log($"Sending email to {to}: {subject}");
                          // => Uses injected logger (could be Console, File, Mock)
                          // => Output depends on ILogger implementation
    }
}

class UserService         // => High-level service with multiple dependencies
{                         // => Depends on abstractions, not concrete types
    private readonly ILogger logger;
                          // => ILogger interface type: any logger works
    private readonly IEmailService emailService;
                          // => IEmailService interface: any email implementation

    public UserService(ILogger logger, IEmailService emailService)  // => Two dependencies
    {                     // => DI container resolves and provides both
        this.logger = logger;
                          // => Store logger reference
        this.emailService = emailService;
                          // => Store email service reference
    }

    public void RegisterUser(string email)  // => Business method
    {                     // => Orchestrates logging and email notification
        logger.Log($"Registering user: {email}");
                          // => Calls ILogger.Log (could be any implementation)
                          // => Output: [LOG] Registering user: alice@example.com

        emailService.SendEmail(email, "Welcome!");
                          // => Calls IEmailService.SendEmail
                          // => Triggers logger.Log inside EmailService
    }
}

// Manual composition (DI container does this in real apps)
ILogger logger = new ConsoleLogger();
                          // => Create concrete logger, assign to interface variable
                          // => Type: ILogger (abstraction), Value: ConsoleLogger

IEmailService emailService = new EmailService(logger);
                          // => Inject logger into email service constructor
                          // => EmailService receives ILogger reference

UserService userService = new UserService(logger, emailService);
                          // => Inject both dependencies into UserService
                          // => All classes receive their dependencies externally

userService.RegisterUser("alice@example.com");
                          // => Calls RegisterUser: triggers log + email
                          // => Output: [LOG] Registering user: alice@example.com
                          // =>         [LOG] Sending email to alice@example.com: Welcome!
```

**Key Takeaway**: Dependency injection provides dependencies through constructors, inverting control from classes creating their dependencies to dependencies being provided externally.

**Why It Matters**: DI enables loose coupling, testability, and flexibility. Classes depend on abstractions (interfaces) rather than concrete implementations. Tests inject mock dependencies to isolate behavior. ASP.NET Core's built-in DI container manages service lifetimes (singleton, scoped, transient) and resolves dependency graphs automatically. This eliminates manual object construction and enables centralized configuration. Choosing the wrong lifetime causes bugs: singleton services holding scoped (per-request) data leak state between requests in multi-user applications.

## Example 55: Configuration - Reading App Settings

Configuration systems load settings from JSON files, environment variables, and other sources.

```csharp
// Example 55: Configuration (Conceptual)
// In real ASP.NET Core, configuration is injected
                          // => IConfiguration provided by DI container

// appsettings.json:
// {
//   "AppSettings": {
//     "AppName": "MyApp",
//     "MaxConnections": 100
//   },
//   "ConnectionStrings": {
//     "Database": "Server=localhost;Database=MyDb"
//   }
// }
                          // => JSON configuration file
                          // => Hierarchical structure with sections

class AppSettings           // => Configuration class
{                           // => Maps to AppSettings section in JSON
    public string AppName { get; set; } = "";
                          // => Default value: empty string
                          // => Initialized from JSON
    public int MaxConnections { get; set; }
                          // => Property type: int
                          // => Loaded from configuration
}

// Simulated configuration (real code uses IConfiguration)
var settings = new AppSettings
{
    AppName = "MyApp",    // => Would be loaded from appsettings.json
                          // => Real: ConfigurationBinder.Bind()
    MaxConnections = 100
                          // => Integer value from config
};                        // => settings is AppSettings instance

Console.WriteLine($"App: {settings.AppName}");
                          // => Accesses AppName property
                          // => Output: App: MyApp

Console.WriteLine($"Max Connections: {settings.MaxConnections}");
                          // => Accesses MaxConnections property
                          // => Output: Max Connections: 100

// Options pattern with dependency injection
interface IAppConfig
{                         // => Abstraction for configuration
    string GetAppName();
                          // => Returns app name string
    int GetMaxConnections();
                          // => Returns max connections int
}

class AppConfig : IAppConfig
{                         // => Concrete implementation
    private readonly AppSettings settings;
                          // => Immutable dependency
                          // => Stored in private field

    public AppConfig(AppSettings settings)
    {                     // => Constructor injection of settings
                          // => Dependency provided by caller
        this.settings = settings;
                          // => Assigns to field
                          // => this.settings references the field
    }

    public string GetAppName() => settings.AppName;
                          // => Expression-bodied member
                          // => Returns settings.AppName
    public int GetMaxConnections() => settings.MaxConnections;
                          // => Returns settings.MaxConnections
}

var config = new AppConfig(settings);
                          // => Creates AppConfig instance
                          // => Passes settings to constructor
                          // => config is IAppConfig (via AppConfig)

Console.WriteLine($"Configured app: {config.GetAppName()}");
                          // => Calls GetAppName() method
                          // => Output: Configured app: MyApp

// Environment-specific configuration
// Development: appsettings.Development.json overrides appsettings.json
                          // => Environment-specific values
                          // => Merged at runtime
// Production: appsettings.Production.json overrides
                          // => Production overrides base settings
// Environment variables override all file-based settings
                          // => Highest precedence
                          // => ENV vars > JSON files
```

**Key Takeaway**: Configuration is loaded from multiple sources (JSON files, environment variables) with precedence rules. Use strongly-typed configuration classes with dependency injection.

**Why It Matters**: Configuration systems enable environment-specific settings without code changes. Development uses local database, production uses cloud database - same code, different configuration. ASP.NET Core's configuration system supports hierarchical JSON, environment variables, command-line args, and Azure Key Vault with automatic reload on change. Twelve-factor apps store configuration in environment variables to separate config from code.

## Example 56: ASP.NET Core - Minimal API

Minimal APIs provide lightweight HTTP endpoints with minimal ceremony.

```csharp
// Example 56: ASP.NET Core Minimal API (Conceptual)
// Real code uses ASP.NET Core builder APIs

// Simulated minimal API structure
class WebApp              // => Simulates WebApplication in real ASP.NET Core
{
    public void MapGet(string route, Func<string> handler)  // => Map GET route
    {                     // => Register GET endpoint
                          // => route is path pattern (e.g., "/users/{id}")
        Console.WriteLine($"GET {route} registered");
                          // => Outputs registration confirmation
    }

    public void MapPost(string route, Func<object, string> handler)  // => Map POST route
    {                     // => Register POST endpoint
                          // => handler takes request body as first param
        Console.WriteLine($"POST {route} registered");
                          // => Outputs: POST /users registered
    }

    public void Run()     // => Start the HTTP server
    {                     // => Begins accepting incoming connections
        Console.WriteLine("App running...");
                          // => Server now listening for requests
    }
}

var app = new WebApp();   // => Create web application instance
                          // => Real: WebApplication.CreateBuilder().Build()

// GET endpoint
app.MapGet("/hello", () =>   // => Register GET /hello handler
{                         // => Lambda: no parameters (route has no params)
    return "Hello, World!";  // => Return plain text response string
                          // => Real API: return Results.Ok("Hello, World!")
});                       // => Endpoint registered

// GET with route parameter
app.MapGet("/users/{id}", (int id) =>   // => Route template: {id} captured
{                         // => id bound from URL: /users/42 → id=42
                          // => ASP.NET Core auto-parses route parameters
    return $"User {id}";  // => Returns: "User 42" (for /users/42)
                          // => id is the parsed integer from URL
});                       // => Real API: return Results.Ok(new { ... })

// POST endpoint with body
app.MapPost("/users", (UserDto user) =>  // => Register POST /users handler
{                         // => user: auto-deserialized from JSON request body
                          // => Content-Type: application/json required
    return $"Created user: {user.Name}";  // => Confirmation with user's name
                          // => Real: return Results.Created(location, user)
});

record UserDto(string Name, string Email);  // => Request body DTO record
                          // => Immutable: matches JSON {"Name":"...","Email":"..."}
                          // => System.Text.Json deserializes into this record

app.Run();                // => Start server and begin accepting requests
                          // => Output: GET /hello registered
                          // =>         GET /users/{id} registered
                          // =>         POST /users registered
                          // =>         App running...
```

**Key Takeaway**: Minimal APIs use lambda handlers for HTTP endpoints with automatic parameter binding and JSON serialization.

**Why It Matters**: Minimal APIs reduce boilerplate for simple APIs compared to controller-based APIs. They're ideal for microservices and lightweight APIs where full MVC features aren't needed. Modern .NET applications favor minimal APIs for performance and simplicity while controllers remain available for complex scenarios with filters, model validation, and view rendering. Minimal API endpoints run as the fastest path through ASP.NET Core's middleware pipeline, benchmarking higher than controller actions and making them suitable for latency-sensitive internal service endpoints.

## Example 57: Entity Framework Core - Basic CRUD

Entity Framework Core is an ORM that maps C# classes to database tables. **Why not ADO.NET?** ADO.NET provides raw database access but requires manual SQL strings, parameter binding, and object mapping - hundreds of lines of repetitive code per entity. EF Core eliminates this boilerplate while remaining compatible with raw SQL for complex queries. Install: `dotnet add package Microsoft.EntityFrameworkCore`.

```csharp
// Example 57: Entity Framework Core (Conceptual)
// Real code uses Entity Framework Core

class Product             // => Entity class (maps to Products table)
{
    public int Id { get; set; }
                          // => Primary key (convention: Id or ProductId)
                          // => EF Core auto-increments this column
    public string Name { get; set; } = "";
                          // => Column: Name VARCHAR/NVARCHAR
                          // => = "" provides non-null default
    public decimal Price { get; set; }
                          // => Column: Price DECIMAL(18,2)
}

// DbContext - database session
class AppDbContext
{                         // => Real: inherits DbContext
                          // => Manages database connections and change tracking
    public List<Product> Products { get; set; } = new();
                          // => Simulates DbSet<Product>
                          // => Real: represents Products table
                          // => DbSet<T> supports LINQ queries translated to SQL

    public void Add(Product product)
    {                     // => Add entity (INSERT)
                          // => Marks entity as Added in change tracker
        Products.Add(product);
                          // => Adds to in-memory collection
        Console.WriteLine($"Added: {product.Name}");
                          // => Outputs: Added: Laptop
    }

    public void SaveChanges()
    {                     // => Commit changes to database
                          // => Generates INSERT/UPDATE/DELETE SQL statements
        Console.WriteLine("Changes saved to database");
                          // => Real: executes within transaction
    }

    public Product? Find(int id)
    {                     // => Find by primary key (SELECT WHERE Id=id)
                          // => Returns null if not found
        return Products.FirstOrDefault(p => p.Id == id);
                          // => Linear search in simulation (EF uses indexed lookup)
    }

    public void Remove(Product product)
    {                     // => Delete entity (DELETE)
                          // => Marks entity as Deleted in change tracker
        Products.Remove(product);
                          // => Removes from in-memory collection
        Console.WriteLine($"Removed: {product.Name}");
                          // => Outputs: Removed: Laptop
    }
}

var context = new AppDbContext();
                          // => Create database session (unit of work)
                          // => Real: connects to database server

// Create (INSERT)
var product = new Product
{
    Id = 1,               // => Primary key value
    Name = "Laptop",      // => Product name
    Price = 999.99m       // => m suffix: decimal literal (not double)
};
                          // => product is a new Product instance

context.Add(product);     // => Track for insertion (change state: Added)
context.SaveChanges();    // => Execute INSERT SQL to database
                          // => Output: Added: Laptop
                          // =>         Changes saved to database

// Read (SELECT)
var retrieved = context.Find(1);
                          // => SELECT WHERE Id=1
                          // => retrieved is Product? (nullable)

Console.WriteLine($"{retrieved?.Name}: ${retrieved?.Price}");
                          // => Null-conditional: safe if retrieved is null
                          // => Output: Laptop: $999.99

// Update
if (retrieved != null)    // => Guard: only update if found
{
    retrieved.Price = 899.99m;
                          // => Modify tracked entity property
                          // => EF Core change tracker detects this mutation
    context.SaveChanges();
                          // => Execute UPDATE SET Price=899.99 WHERE Id=1
}

// Delete (DELETE)
if (retrieved != null)    // => Guard: only delete if found
{
    context.Remove(retrieved);
                          // => Mark entity for deletion (change state: Deleted)
    context.SaveChanges();
                          // => Execute DELETE WHERE Id=1
                          // => Output: Removed: Laptop
                          // =>         Changes saved to database
}

// LINQ queries
var expensiveProducts = context.Products
    .Where(p => p.Price > 500)
                          // => Translated to SQL: WHERE Price > 500
                          // => Filter executed at database, not in memory
    .ToList();            // => Execute query, materialize results to List<Product>
                          // => expensiveProducts is List<Product> (empty after delete)
```

**Key Takeaway**: Entity Framework Core maps classes to database tables with CRUD operations through `DbContext`. LINQ queries are translated to SQL.

**Why It Matters**: ORMs eliminate manual SQL writing and mapping for standard CRUD operations. EF Core handles SQL generation, parameter binding, and object materialization. Change tracking detects modifications automatically. However, ORMs can generate inefficient queries for complex scenarios - use raw SQL for performance-critical queries. Always profile database queries in production to catch N+1 problems and missing indexes.

## Example 58: Testing with xUnit - Unit Tests

xUnit is a testing framework for writing unit tests with facts, theories, and assertions. **Why not MSTest?** xUnit is the modern choice for .NET - extensible via custom `IXunitSerializable`, runs tests in parallel by default, and has no test class initialization order issues. MSTest is available built-in but lacks these advantages. Install: `dotnet add package xunit` and `dotnet add package xunit.runner.visualstudio`.

```csharp
// Example 58: Testing with xUnit (Conceptual)
// Real code uses Xunit namespace
                          // => This is a simplified demonstration

class Calculator         // => System under test (SUT): the class being tested
{                         // => Production code under test
    public int Add(int a, int b) => a + b;  // => Expression-bodied method
                          // => Simple: single expression, no braces
                          // => Returns sum: Add(5, 3) → 8
    public int Divide(int a, int b)  // => Division with error handling
    {                     // => Guard clause protects against invalid input
        if (b == 0)       // => Check for zero divisor before dividing
            throw new DivideByZeroException();  // => Defensive error
                          // => Test must verify this exception is thrown
        return a / b;     // => Integer division: 10/3=3 (truncates)
    }
}

// Test class
class CalculatorTests    // => Test class: contains all tests for Calculator
{                         // => Convention: {SystemUnderTest}Tests naming
    // [Fact] attribute marks test method
    public void Add_TwoPositiveNumbers_ReturnsSum()  // => Test method name
    {                     // => AAA pattern: Arrange, Act, Assert
                          // => Naming: Method_Scenario_ExpectedBehavior
        // Arrange
        var calculator = new Calculator();  // => Create fresh SUT instance
                          // => Fresh instance per test (no shared state)
        int a = 5, b = 3; // => Test inputs: a=5, b=3
                          // => Meaningful names improve test readability

        // Act
        int result = calculator.Add(a, b);  // => Call method under test
                          // => Isolated: only calling Add, nothing else
                          // => result should be 8 (5 + 3)

        // Assert
        Assert.Equal(8, result);  // => Verify: expected=8, actual=result
                          // => Test PASSES if values are equal
                          // => Test FAILS with message if not equal
    }

    public void Divide_ByZero_ThrowsException()  // => Exception test
    {                     // => Tests that the method throws as specified
        // Arrange
        var calculator = new Calculator();  // => Create fresh SUT
                          // => Isolated from other tests

        // Act & Assert
        Assert.Throws<DivideByZeroException>(() =>  // => Verify exception
        {                 // => Lambda wraps the action that should throw
            calculator.Divide(10, 0);  // => This MUST throw
                          // => 10 / 0 triggers guard clause in Divide
        });               // => Test passes only if DivideByZeroException thrown
                          // => Test FAILS if no exception or wrong exception type
    }

    // [Theory] with [InlineData] for parameterized tests
    public void Add_VariousInputs_ReturnsCorrectSum(int a, int b, int expected)  // => Theory
    {                     // => Parameterized: receives different inputs per run
                          // => Real xUnit: decorated with [Theory][InlineData(1,1,2)]
        // Arrange
        var calculator = new Calculator();  // => Fresh instance per data set
                          // => Prevents state from leaking between parameterized runs

        // Act
        int result = calculator.Add(a, b);  // => Invoke with test case inputs
                          // => result depends on which InlineData is running

        // Assert
        Assert.Equal(expected, result);  // => Verify correct result for this data
                          // => expected from test parameter, result from method
    }

    // Simulated InlineData (real xUnit uses attributes)
    public void RunTheoryTests()  // => Manually runs theory with all data sets
    {                     // => Real xUnit: [InlineData(1,1,2)] on method
        Add_VariousInputs_ReturnsCorrectSum(1, 1, 2);   // => Case 1: 1+1=2
                          // => Test case 1: basic addition
        Add_VariousInputs_ReturnsCorrectSum(5, 3, 8);   // => Case 2: 5+3=8
                          // => Test case 2: larger numbers
        Add_VariousInputs_ReturnsCorrectSum(-1, 1, 0);  // => Case 3: -1+1=0
                          // => Test case 3: negative input
        Add_VariousInputs_ReturnsCorrectSum(0, 0, 0);   // => Case 4: 0+0=0
                          // => Test case 4: zero edge case
    }
}

// Simulated assertion helpers
static class Assert      // => Simplified Assert class (xUnit provides full version)
{                         // => static: all methods are class-level
    public static void Equal<T>(T expected, T actual)  // => Generic equality assertion
    {                     // => T can be any type: int, string, custom object
        if (!Equals(expected, actual))  // => Compares using object.Equals
                          // => Fails if expected ≠ actual
            throw new Exception($"Expected {expected}, got {actual}");
                          // => Test failure with descriptive message
        Console.WriteLine($"✓ Test passed: {expected} == {actual}");
                          // => Success indicator when values match
    }

    public static void Throws<T>(Action action) where T : Exception  // => Exception test
    {                     // => where T : Exception: constrains to exception types
        try               // => Execute the action
        {
            action();     // => Invoke lambda: expects this to throw
                          // => If no exception: fall through to fail
            throw new Exception($"Expected {typeof(T).Name} but no exception thrown");
                          // => Test failure: expected exception didn't occur
        }
        catch (T)         // => Catch specifically T (the expected exception type)
        {                 // => If T is thrown: this catch executes → test passes
            Console.WriteLine($"✓ Test passed: {typeof(T).Name} thrown");
                          // => Success: correct exception was thrown
        }
    }
}

var tests = new CalculatorTests();  // => Instantiate test class
                          // => Manual test runner (xUnit uses reflection)

tests.Add_TwoPositiveNumbers_ReturnsSum();  // => Run first test
                          // => Output: ✓ Test passed: 8 == 8

tests.Divide_ByZero_ThrowsException();  // => Run exception test
                          // => Output: ✓ Test passed: DivideByZeroException thrown

tests.RunTheoryTests();   // => Run all parameterized test cases
                          // => Outputs 4 "✓ Test passed" lines
```

**Key Takeaway**: xUnit uses `[Fact]` for simple tests and `[Theory]` with `[InlineData]` for parameterized tests. Follow Arrange-Act-Assert pattern.

**Why It Matters**: Unit tests verify code behavior and catch regressions during refactoring. They document expected behavior through executable examples. Test-driven development (TDD) writes tests before implementation, driving design toward testable, loosely coupled code. CI/CD pipelines run tests automatically on every commit, preventing broken code from reaching production. High test coverage reduces debugging time and increases confidence when making changes.

## Example 59: Nullable Reference Types - Null Safety

Nullable reference types enable compile-time null checking to prevent `NullReferenceException`.

```csharp
// Example 59: Nullable Reference Types
// Enable with: #nullable enable or <Nullable>enable</Nullable> in .csproj

#nullable enable           // => Enable nullable context

string nonNullable = "Hello";
                          // => string is non-nullable by default (C# 8+)
                          // => Cannot be null

// nonNullable = null;    // => COMPILER WARNING
                          // => Converting null literal to non-nullable type

string? nullable = null;  // => ? makes string nullable
                          // => Explicitly allows null

Console.WriteLine(nullable?.Length);
                          // => ?. null-conditional operator
                          // => Returns null if nullable is null
                          // => Output: (nothing - null has no output)

nullable = "World";
Console.WriteLine(nullable?.Length);
                          // => Output: 5

// Null-coalescing operator
string result = nullable ?? "Default";
                          // => ?? returns left if not null, else right
                          // => result is "World"

Console.WriteLine(result);// => Output: World

nullable = null;
result = nullable ?? "Default";
                          // => result is "Default" (nullable is null)

Console.WriteLine(result);// => Output: Default

// Null-coalescing assignment
nullable ??= "Assigned";  // => ??= assigns if null
                          // => nullable is now "Assigned"

Console.WriteLine(nullable);
                          // => Output: Assigned

// Null-forgiving operator
string? maybeNull = GetString();

// int length = maybeNull.Length;
                          // => COMPILER WARNING
                          // => Possible null reference

int length = maybeNull!.Length;
                          // => ! suppresses warning
                          // => "I know it's not null"
                          // => Runtime exception if actually null

string? GetString() => "Value";
                          // => Returns nullable string

// Method parameters
void ProcessString(string required, string? optional)
{                         // => required cannot be null
                          // => optional can be null
    Console.WriteLine(required.Length);
                          // => Safe - required is non-nullable

    // Console.WriteLine(optional.Length);
                          // => COMPILER WARNING
                          // => optional might be null

    if (optional != null)
    {                     // => Null check
        Console.WriteLine(optional.Length);
                          // => Safe within if block (flow analysis)
    }
}

ProcessString("Required", null);
                          // => Valid - optional is nullable
```

**Key Takeaway**: Nullable reference types add compile-time null safety. Use `?` for nullable, `?.` for null-conditional access, `??` for null-coalescing, and `!` for null-forgiving.

**Why It Matters**: Nullable reference types catch null reference errors at compile time instead of runtime. They document nullability contracts in APIs - callers know which parameters can be null and which return values need null checks. Enabling nullable context in existing codebases reveals hidden null-related bugs before they cause production crashes. However, nullable annotations are compiler hints - runtime null checks are still necessary when null state is unknown (user input, deserialization).

## Example 60: LINQ Aggregate Operations - Custom Aggregations

Aggregate operations reduce collections to single values using custom accumulation logic.

```csharp
// Example 60: LINQ Aggregate Operations
var numbers = new List<int> { 1, 2, 3, 4, 5 };
                          // => Source collection for aggregation

// Sum with Aggregate
int sum = numbers.Aggregate(0, (accumulator, current) =>
{                         // => Aggregate(seed, func)
                          // => seed is initial accumulator value (0)
                          // => func: (accumulator, current) => new accumulator
                          // => Lambda with two parameters
    return accumulator + current;
                          // => Iteration 1: 0 + 1 = 1
                          // => Iteration 2: 1 + 2 = 3
                          // => Iteration 3: 3 + 3 = 6
                          // => Iteration 4: 6 + 4 = 10
                          // => Iteration 5: 10 + 5 = 15
});                       // => Final accumulator is result
                          // => sum is 15 (type: int)

Console.WriteLine(sum);   // => Output: 15

// Product
int product = numbers.Aggregate(1, (acc, current) => acc * current);
                          // => 1 * 1 * 2 * 3 * 4 * 5 = 120
                          // => Seed is 1 (multiplicative identity)
                          // => Expression lambda (concise form)

Console.WriteLine(product);
                          // => Output: 120

// String concatenation
var words = new List<string> { "Hello", "World", "From", "C#" };
                          // => String collection for building sentence

string sentence = words.Aggregate("", (acc, word) =>
{                         // => Build string progressively
                          // => Seed is empty string
    return acc == "" ? word : $"{acc} {word}";
                          // => First word: no space
                          // => Subsequent words: add space
                          // => Ternary handles special case
});                       // => sentence contains joined result

Console.WriteLine(sentence);
                          // => Output: Hello World From C#

// Complex aggregation - building object
var products = new List<(string Name, decimal Price)>
{
    ("Laptop", 999.99m),
    ("Mouse", 29.99m),
    ("Keyboard", 79.99m)
};

var summary = products.Aggregate(
    new { TotalPrice = 0m, Count = 0, Names = new List<string>() },
                          // => Seed: anonymous object with accumulation state
    (acc, product) => new
    {                     // => Return new anonymous object each iteration
        TotalPrice = acc.TotalPrice + product.Price,
                          // => Accumulate total price
        Count = acc.Count + 1,
                          // => Count products
        Names = acc.Names.Append(product.Name).ToList()
                          // => Collect product names
    }
);

Console.WriteLine($"Count: {summary.Count}");
                          // => Output: Count: 3

Console.WriteLine($"Total: ${summary.TotalPrice}");
                          // => Output: Total: $1109.97

Console.WriteLine($"Products: {string.Join(", ", summary.Names)}");
                          // => Output: Products: Laptop, Mouse, Keyboard

// Aggregate with result selector (3-parameter overload)
decimal average = numbers.Aggregate(
    0,                    // => Seed
    (acc, n) => acc + n,  // => Accumulator function (sum)
    result => (decimal)result / numbers.Count
);                        // => Result selector (transform final accumulator)
                          // => Converts sum to average

Console.WriteLine(average);
                          // => Output: 3
```

**Key Takeaway**: `Aggregate` reduces collections using custom accumulation logic. Three overloads: aggregate without seed, with seed, and with seed plus result selector.

**Why It Matters**: Aggregate enables complex custom reductions beyond built-in methods like `Sum` and `Count`. Financial calculations aggregate transactions to compute running balances. Data processing pipelines aggregate events to compute statistics. However, aggregate can be harder to understand than explicit loops - prefer built-in methods (`Sum`, `Count`, `Max`) when available and use `Aggregate` only for custom logic that doesn't fit standard patterns.
