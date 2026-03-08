---
title: "Overview"
weight: 10000000
date: 2025-01-29T00:00:00+07:00
draft: false
description: "Learn Dart through 75 heavily annotated examples covering 95% of Dart features, from basics to advanced patterns"
tags: ["dart", "by-example", "overview"]
---

Learn Dart through heavily annotated code examples. This section provides 75 practical examples covering 95% of Dart's features, organized by difficulty level.

**Example Coverage**:

- Beginner (Examples 1-25) - Basic syntax, types, control flow, functions, OOP basics
- Intermediate (Examples 26-50) - Async/await, streams, advanced OOP, generics, mixins
- Advanced (Examples 51-75) - Isolates, design patterns, testing, performance optimization

## Learning Approach

**By Example** uses a code-first methodology:

1. **Self-contained examples** - Each example is complete and runnable
2. **Heavy annotation** - 1-2.25 comments per line of code using `// =>` notation
3. **Progressive difficulty** - From beginner fundamentals to advanced patterns
4. **Islamic finance context** - Real-world examples using Zakat, Murabaha, donations

This approach efficiently teaches Dart through practical code rather than extensive prose.

## Annotation Density Standard

All examples maintain **1.0-2.25 comment lines per code line** to ensure thorough understanding.

**Annotation pattern**:

```dart
String name = 'Ahmad';           // => name stores string value 'Ahmad'
                                 // => String type (immutable reference)

int calculateZakat(int wealth) {  // => Function takes int parameter wealth
                                 // => Returns int (Zakat amount)
  return (wealth * 0.025).round(); // => Multiply by 2.5% rate
                                 // => round() converts double to int
}                                // => Returns calculated Zakat amount

var zakat = calculateZakat(10000); // => Call function with 10000
                                  // => zakat stores result: 250
```

**Simple lines**: Get 1 annotation explaining what happens
**Complex lines**: Get 2 annotations explaining logic and result

## Organization by Difficulty

### Beginner (25-30 examples)

Covers fundamental Dart concepts (0-30% language coverage):

- Variables and basic types
- Control flow (if/else, loops, switch)
- Functions and parameters
- Basic null safety
- Lists and Maps
- String manipulation
- Simple classes
- Basic error handling

**Prerequisites**: Programming fundamentals (variables, functions, basic logic)

### Intermediate (25-30 examples)

Covers practical Dart development (30-70% language coverage):

- Advanced null safety patterns
- Async/await and Futures
- Streams and subscriptions
- Advanced collections (fold, map, where, reduce)
- Object-oriented programming (inheritance, interfaces, mixins)
- Exception handling
- File I/O
- JSON parsing
- HTTP requests

**Prerequisites**: Completed beginner section or equivalent experience

### Advanced (25-30 examples)

Covers sophisticated patterns (70-95% language coverage):

- Generators (sync\* and async\*)
- Isolates for concurrency
- Extension methods
- Generics and type parameters
- Advanced async patterns (Future.wait, Stream.periodic)
- Custom operators
- Reflection and mirrors
- FFI (Foreign Function Interface)
- Performance optimization
- Design patterns in Dart

**Prerequisites**: Completed intermediate section or production Dart experience

## Example Structure

Each example follows a consistent five-part structure:

### 1. Title and Context

```dart
// Example 23: Calculating Zakat on Investment Portfolio
// Context: Managing multiple investment types with different rates
```

### 2. Complete Code

```dart
void main() {
  // Full working example
}
```

### 3. Heavy Annotations

```dart
double amount = 1000.0;  // => amount stores 1000.0 (type: double)
                         // => Used for calculation
```

### 4. Output Documentation

```
// Output:
// Portfolio total: Rp10,000,000
// Zakat due: Rp250,000
```

### 5. Key Takeaways

```
// Takeaways:
// - Collections can store different types with proper generics
// - Fold reduces collection to single accumulated value
// - Null safety prevents runtime errors
```

## Running Examples

All examples are self-contained and can be run directly:

```bash
# Save example to file
cat > example.dart << 'EOF'
void main() {
  print('As-salamu alaykum!'); // => Outputs greeting
                               // => Prints to console
}
EOF

# Run immediately
dart run example.dart
# => Output: As-salamu alaykum!
```

**No project setup required** - each example is a single file.

## Islamic Finance Examples

Examples use authentic Islamic finance concepts:

**Zakat (Obligatory Charity)**:

```dart
double calculateZakat(double wealth) {
  // => wealth: Total zakatable wealth
  const nisab = 85.0 * 1000000.0;  // => 85 grams gold × price per gram
                                   // => Minimum threshold

  if (wealth < nisab) return 0.0;  // => Below threshold: no Zakat
                                   // => Returns zero

  return wealth * 0.025;           // => 2.5% of eligible wealth
                                   // => Returns Zakat amount
}
```

**Murabaha (Cost-Plus Financing)**:

```dart
class MurabahaContract {
  // => Islamic financing structure
  final double cost;        // => Original cost of asset
  final double markup;      // => Agreed-upon profit margin
  final int months;         // => Payment period

  double get totalPrice => cost + markup;  // => Total amount payable
                                          // => Transparent calculation

  double get monthlyPayment => totalPrice / months;  // => Fixed monthly amount
                                                    // => Equal installments
}
```

**Sadaqah (Voluntary Charity)**:

```dart
Stream<double> trackDonations() async* {
  // => Asynchronous stream generator
  // => Yields donation amounts over time
  yield 100.0;   // => First donation: 100
  yield 250.0;   // => Second donation: 250
  yield 500.0;   // => Third donation: 500
}                // => Stream completes
```

## Coverage Target: 95%

These 75-90 examples cover approximately **95% of Dart features** you'll use in real applications.

**Not covered** (remaining 5%):

- Obscure language features rarely used in practice
- Platform-specific APIs (covered in framework tutorials)
- Experimental features not yet stabilized
- Low-level VM internals

The 95% coverage includes all practical features for:

- Mobile development with Flutter
- Web development
- Server-side applications
- CLI tools
- Package development

## How to Use This Section

**For beginners**:

1. Start with [Beginner](/en/learn/software-engineering/programming-languages/dart/by-example/beginner) section
2. Read each example carefully
3. Run the code yourself
4. Modify examples to experiment
5. Move to Intermediate when comfortable

**For experienced programmers**:

1. Skim [Beginner](/en/learn/software-engineering/programming-languages/dart/by-example/beginner) for Dart-specific syntax
2. Focus on [Intermediate](/en/learn/software-engineering/programming-languages/dart/by-example/intermediate) for practical patterns
3. Study [Advanced](/en/learn/software-engineering/programming-languages/dart/by-example/advanced) for sophisticated techniques

**For reference**:

- Use as quick lookup for specific features
- Copy and adapt examples for your projects
- Reference annotation patterns for documentation

## Complementary Resources

**Combine with**:

- [Overview](/en/learn/software-engineering/programming-languages/dart/overview) - Conceptual understanding of Dart
- [Initial Setup](/en/learn/software-engineering/programming-languages/dart/initial-setup) - Installation and configuration
- [Quick Start](/en/learn/software-engineering/programming-languages/dart/quick-start) - Complete application tutorial

**Next level**:

- Official Dart documentation for comprehensive API reference
- Flutter documentation for UI development
- Package ecosystem for specialized libraries

## Start Learning

Begin with [Beginner](/en/learn/software-engineering/programming-languages/dart/by-example/beginner) examples to learn Dart fundamentals through annotated code, or jump to [Intermediate](/en/learn/software-engineering/programming-languages/dart/by-example/intermediate) or [Advanced](/en/learn/software-engineering/programming-languages/dart/by-example/advanced) based on your experience level.
