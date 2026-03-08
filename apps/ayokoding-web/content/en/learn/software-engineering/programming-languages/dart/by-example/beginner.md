---
title: "Beginner"
weight: 10000001
date: 2025-01-29T00:00:00+07:00
draft: false
description: "Learn Dart fundamentals through 25 heavily annotated examples covering basic syntax, types, control flow, functions, and object-oriented basics"
tags: ["dart", "beginner", "fundamentals", "by-example"]
---

Master Dart fundamentals through 25 heavily annotated examples using Islamic finance contexts. Each example maintains 1-2.25 annotation density and demonstrates core language features essential for writing Dart applications.

## Examples 1-10: Basic Syntax and Types

### Example 1: Variable Declaration and Type Inference

Variables store data using explicit types or type inference with `var`.

```dart
void main() {
  // Explicit type declarations
  String donorName = 'Ahmad';          // => donorName stores 'Ahmad' (type: String)
                                        // => String type explicitly declared

  int donationAmount = 500000;          // => donationAmount stores 500000 (type: int)
                                        // => Integer type for whole numbers

  double zakatRate = 0.025;             // => zakatRate stores 0.025 (type: double)
                                        // => Double type for decimal values

  bool isPaid = true;                   // => isPaid stores true (type: bool)
                                        // => Boolean type for true/false values

  // Type inference with var
  var masjidName = 'Al-Hikmah';         // => masjidName inferred as String
                                        // => Type determined from initial value

  var memberCount = 150;                // => memberCount inferred as int
                                        // => Type cannot change after declaration

  print('$donorName donated: Rp$donationAmount');  // => Output: Ahmad donated: Rp500000
                                                    // => String interpolation with $
}
```

**Key Takeaway**: Dart supports both explicit types and type inference with `var`. Once declared, variable types are fixed (statically typed).

**Expected Output**:

```
Ahmad donated: Rp500000
```

**Why It Matters**: Dart's static typing catches type errors at compile time rather than runtime, preventing bugs that would otherwise surface in production. Variable type inference reduces verbosity while maintaining safety, enabling developers to write concise code without sacrificing the protection of a type system. Understanding type declaration is foundational for all Dart development, from Flutter widgets to server-side applications where type safety prevents data corruption.

**Common Pitfalls**: Using `var` without initialization causes compile error. Type cannot change after declaration.

### Example 2: Null Safety Basics

Dart enforces null safety, preventing null reference errors at compile time.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    VarType{Variable Type} -->|Non-nullable| NonNull[String, int, bool]
    VarType -->|Nullable| Nullable[String?, int?, bool?]

    NonNull --> MustInit[Must initialize<br/>Cannot be null]
    Nullable --> CanNull[Can be null<br/>Default: null]

    MustInit --> DirectUse[Use directly<br/>No checks needed]
    CanNull --> CheckRequired{Check before use}

    CheckRequired -->|if != null| TypePromote[Type promoted<br/>Safe to use]
    CheckRequired -->|Use ??| DefaultVal[Provide default<br/>value ?? 'default']
    CheckRequired -->|Use !| AssertNonNull[Assert non-null<br/>Throws if null]
    CheckRequired -->|Use ?.| SafeAccess[Safe access<br/>Returns null if null]

    style NonNull fill:#029E73
    style Nullable fill:#DE8F05
    style TypePromote fill:#0173B2
    style DirectUse fill:#029E73
```

```dart
void main() {
  // Non-nullable types (default)
  String donorName = 'Fatimah';         // => donorName cannot be null
                                        // => Must always have a String value

  // Nullable types with ? suffix
  String? optionalPhone;                // => optionalPhone can be null or String
                                        // => Initialized to null by default

  String? optionalEmail = 'donor@example.com';  // => Can store String or null
                                                 // => Currently holds String value

  // Null-aware operators
  String phone = optionalPhone ?? 'No phone';  // => ?? returns right side if left is null
                                                // => phone stores 'No phone' (optionalPhone is null)

  String email = optionalEmail!;        // => ! asserts value is not null
                                        // => email stores 'donor@example.com'
                                        // => Throws error if null (use carefully!)

  // Null-aware method call
  int? length = optionalPhone?.length;  // => ?. calls method only if not null
                                        // => length stores null (optionalPhone is null)

  print('Phone: $phone');               // => Output: Phone: No phone
  print('Email: $email');               // => Output: Email: donor@example.com
  print('Phone length: $length');       // => Output: Phone length: null
}
```

**Key Takeaway**: Non-nullable by default (`String`) prevents null errors. Nullable types use `?` suffix (`String?`). Use `??`, `!`, and `?.` operators for null handling.

**Expected Output**:

```
Phone: No phone
Email: donor@example.com
Phone length: null
```

**Why It Matters**: Null safety eliminates entire classes of runtime crashes that plague production applications. Flutter apps built with sound null safety crash less frequently because the compiler enforces null-checking before deployment. Without null safety, `NullPointerException` is the most common source of production crashes across all programming languages. Mastering Dart's null safety operators (`??`, `?.`, `!`) enables building robust applications that handle missing data gracefully.

**Common Pitfalls**: Using `!` operator on null value throws runtime error. Always verify value is non-null before using `!`.

### Example 3: String Manipulation

Strings support interpolation, concatenation, and various manipulation methods.

```dart
void main() {
  String firstName = 'Abdullah';        // => firstName stores 'Abdullah'
  String lastName = 'Rahman';           // => lastName stores 'Rahman'

  // String interpolation
  String fullName = '$firstName $lastName';  // => Interpolates with $
                                              // => fullName stores 'Abdullah Rahman'

  // Expression interpolation
  String greeting = 'As-salamu alaykum, ${fullName.toUpperCase()}!';
                                        // => ${} evaluates expression
                                        // => toUpperCase() converts to uppercase
                                        // => greeting stores 'As-salamu alaykum, ABDULLAH RAHMAN!'

  // String concatenation
  String message = 'Donor: ' + fullName;  // => + operator concatenates strings
                                          // => message stores 'Donor: Abdullah Rahman'

  // Multi-line strings
  String report = '''
Zakat Report
Donor: $fullName
Status: Confirmed
''';                                    // => Triple quotes create multi-line string
                                        // => report stores formatted text with newlines

  // String methods
  int length = fullName.length;         // => length stores 16 (character count)
  bool contains = fullName.contains('Abdullah');  // => contains stores true
                                                   // => Checks substring existence

  String upper = fullName.toUpperCase();  // => upper stores 'ABDULLAH RAHMAN'
  String lower = fullName.toLowerCase();  // => lower stores 'abdullah rahman'

  print(greeting);                      // => Output: As-salamu alaykum, ABDULLAH RAHMAN!
  print('Length: $length');             // => Output: Length: 16
}
```

**Key Takeaway**: Use `$variable` for simple interpolation, `${expression}` for complex expressions. Strings are immutable - methods return new strings.

**Expected Output**:

```
As-salamu alaykum, ABDULLAH RAHMAN!
Length: 16
```

**Why It Matters**: String manipulation is ubiquitous in production applications—UI labels, log messages, API payloads, and formatted output all depend on reliable string operations. Dart's string interpolation produces more readable code than concatenation while being equally performant. Understanding immutability prevents bugs where developers expect in-place modification. Flutter UI rendering depends heavily on efficient string handling for text widget content.

**Common Pitfalls**: Forgetting `{}` around complex expressions in interpolation. Strings are immutable - methods create new instances.

### Example 4: Basic Arithmetic and Operators

Dart provides standard arithmetic operators and operator precedence.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    A[Operands] --> B{Operator}
    B -->|+| Add[Addition<br/>wealth + bonus]
    B -->|-| Sub[Subtraction<br/>wealth - zakat]
    B -->|*| Mul[Multiplication<br/>wealth * rate]
    B -->|/| Div[Division double<br/>zakat / wealth]
    B -->|~/| IntDiv[Integer Division<br/>zakat ~/ 1000]
    B -->|%| Mod[Modulo<br/>total % 1000]

    style A fill:#0173B2,stroke:#000,color:#fff
    style Add fill:#029E73,stroke:#000,color:#fff
    style Sub fill:#DE8F05,stroke:#000,color:#000
    style Mul fill:#029E73,stroke:#000,color:#fff
    style Div fill:#CC78BC,stroke:#000,color:#000
    style IntDiv fill:#CA9161,stroke:#000,color:#fff
    style Mod fill:#CA9161,stroke:#000,color:#fff
```

```dart
void main() {
  // Zakat calculation variables
  double wealth = 100000000.0;          // => wealth stores 100 million (type: double)
  double zakatRate = 0.025;             // => zakatRate stores 2.5%

  // Arithmetic operators
  double zakatAmount = wealth * zakatRate;  // => Multiplication operator
                                             // => zakatAmount stores 2500000.0

  double remaining = wealth - zakatAmount;  // => Subtraction operator
                                             // => remaining stores 97500000.0

  double future = wealth + 5000000.0;   // => Addition operator
                                        // => future stores 105000000.0

  double rate = zakatAmount / wealth;   // => Division operator (returns double)
                                        // => rate stores 0.025

  int wholePart = zakatAmount ~/ 1000000;  // => Integer division operator
                                            // => wholePart stores 2 (truncates decimal)

  double remainder = zakatAmount % 1000000;  // => Modulo operator (remainder)
                                              // => remainder stores 500000.0

  // Comparison operators
  bool isAboveNisab = wealth >= 85000000.0;  // => Greater than or equal
                                              // => isAboveNisab stores true

  bool isPaid = zakatAmount > 0.0;      // => Greater than comparison
                                        // => isPaid stores true

  // Logical operators
  bool eligible = isAboveNisab && !isPaid;  // => Logical AND with NOT
                                             // => eligible stores false (isPaid is true)

  print('Zakat amount: Rp${zakatAmount.toStringAsFixed(2)}');
                                        // => toStringAsFixed(2) formats to 2 decimals
                                        // => Output: Zakat amount: Rp2500000.00

  print('Eligible for Zakat: $isAboveNisab');  // => Output: Eligible for Zakat: true
}
```

**Key Takeaway**: Use `/` for double division, `~/` for integer division. Comparison operators return bool. Logical operators: `&&` (AND), `||` (OR), `!` (NOT).

**Expected Output**:

```
Zakat amount: Rp2500000.00
Eligible for Zakat: true
```

**Why It Matters**: Financial calculations—the core of any fintech or Islamic finance application—require precise arithmetic. Incorrect use of integer vs. floating-point division causes subtle calculation errors that accumulate across thousands of transactions. Zakat calculations, profit-sharing ratios, and installment schedules all demand exact numeric handling. Understanding Dart's numeric types prevents off-by-one errors and rounding mistakes in production financial systems.

**Common Pitfalls**: Mixing `int` and `double` works in Dart (auto-promoted), but `~/` truncates to int. Order of operations matters.

### Example 5: Control Flow - If/Else

Conditional statements execute code blocks based on boolean conditions.

```dart
void main() {
  double wealth = 50000000.0;           // => wealth stores 50 million
                                        // => wealth is 50000000.0 (type: double)
  const double nisab = 85000000.0;      // => nisab is compile-time constant
                                        // => Minimum Zakat threshold (85 million)
                                        // => const means value fixed at compile time

  // Simple if statement
  if (wealth >= nisab) {                // => Condition evaluates to false
                                        // => 50000000.0 >= 85000000.0 is false
                                        // => Block skipped, execution jumps to line after }
    print('Zakat is obligatory');       // => Block not executed
  }                                     // => Execution continues after if
                                        // => No else block, so continue to next statement

  // If-else statement
  if (wealth >= nisab) {                // => Condition: false
                                        // => Same condition as above (50M < 85M)
    double zakat = wealth * 0.025;      // => Not executed
                                        // => Would calculate 2.5% if condition true
    print('Pay Zakat: Rp$zakat');       // => Not executed
  } else {                              // => else block executes
                                        // => Runs when if condition is false
    double shortfall = nisab - wealth;  // => shortfall stores 35000000.0
                                        // => 85000000.0 - 50000000.0 = 35000000.0
    print('Below nisab by: Rp$shortfall');
                                        // => Output: Below nisab by: Rp35000000.0
  }                                     // => End of if-else statement

  // If-else if-else chain
  String donorType;                     // => Variable to store result
                                        // => donorType declared, not initialized yet (type: String)
  int annualDonation = 15000000;        // => annualDonation stores 15 million
                                        // => annualDonation is 15000000 (type: int)

  if (annualDonation >= 50000000) {     // => First condition: false
                                        // => 15000000 >= 50000000 is false
                                        // => Skip to next else if
    donorType = 'Platinum';             // => Not executed
  } else if (annualDonation >= 20000000) {
                                        // => Second condition: false
                                        // => 15000000 >= 20000000 is false
                                        // => Skip to next else if
    donorType = 'Gold';                 // => Not executed
  } else if (annualDonation >= 10000000) {
                                        // => Third condition: true
                                        // => 15000000 >= 10000000 is true
                                        // => Execute this block
    donorType = 'Silver';               // => donorType assigned 'Silver'
                                        // => donorType now initialized with value
  } else {                              // => Not reached
                                        // => Only executes if all conditions false
    donorType = 'Bronze';               // => Not executed
  }                                     // => End of if-else if-else chain

  print('Donor status: $donorType');    // => Output: Donor status: Silver
                                        // => String interpolation displays donorType value

  // Ternary operator (conditional expression)
  String status = wealth >= nisab ? 'Obligatory' : 'Optional';
                                        // => Inline if-else expression
                                        // => condition ? trueValue : falseValue
                                        // => wealth >= nisab is false
                                        // => status stores 'Optional' (condition false)

  print('Zakat status: $status');       // => Output: Zakat status: Optional
                                        // => String interpolation displays status value
}                                       // => End of main function
```

**Key Takeaway**: Use `if-else` for branching logic. Conditions must evaluate to `bool`. Ternary operator `condition ? trueValue : falseValue` for simple assignments.

**Expected Output**:

```
Below nisab by: Rp35000000.0
Donor status: Silver
Zakat status: Optional
```

**Why It Matters**: Conditional logic governs business rules in every application—eligibility criteria, access control, payment routing, and data validation all rely on correct branching. Mastering if-else chains enables expressing complex business rules clearly. In Flutter, conditional rendering determines which widgets appear based on application state. Readable conditional logic reduces bugs during code review and maintenance, critical for compliance-sensitive Islamic finance applications.

**Common Pitfalls**: Forgetting braces with single statements works but reduces readability. Ternary operator should be simple - use if-else for complex logic.

### Example 6: Control Flow - For Loops

For loops iterate a fixed number of times with counter variable.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    Init[Initialize<br/>month = 1] --> Cond{Condition<br/>month <= 5?}
    Cond -->|true| Body[Execute Body<br/>print month data]
    Body --> Incr[Increment<br/>month++]
    Incr --> Cond
    Cond -->|false| End[Loop Exits<br/>Continue program]

    style Init fill:#0173B2,stroke:#000,color:#fff
    style Cond fill:#DE8F05,stroke:#000,color:#000
    style Body fill:#029E73,stroke:#000,color:#fff
    style Incr fill:#CC78BC,stroke:#000,color:#000
    style End fill:#CA9161,stroke:#000,color:#fff
```

```dart
void main() {
  // Standard for loop with counter
  print('Monthly savings plan:');      // => Header output

  for (int month = 1; month <= 5; month++) {  // => Initialize, condition, increment
                                               // => month starts at 1
    double savings = month * 500000.0;  // => Calculate cumulative savings
                                        // => Iteration 1: 500000.0
                                        // => Iteration 2: 1000000.0
                                        // => ... up to iteration 5
    print('Month $month: Rp$savings');  // => Output each month's total
  }                                     // => Loop completes after month = 5

  // For loop with custom increment
  print('\nQuarterly Zakat payments:');  // => \n creates newline

  for (int quarter = 1; quarter <= 12; quarter += 3) {  // => Increment by 3
                                                         // => quarter: 1, 4, 7, 10
    double payment = 1000000.0 * quarter;  // => Calculate payment amount
    print('Quarter ${quarter ~/ 3 + 1}: Rp$payment');  // => ~/ divides and truncates
                                                        // => Outputs 4 times total
  }

  // For-in loop (iterate over collection)
  List<String> donors = ['Ahmad', 'Fatimah', 'Ali'];  // => List of 3 names

  print('\nDonor thank you messages:');  // => Header

  for (String donor in donors) {        // => donor takes each list element
                                        // => Iteration 1: donor = 'Ahmad'
                                        // => Iteration 2: donor = 'Fatimah'
                                        // => Iteration 3: donor = 'Ali'
    print('Jazakallah khair, $donor!');  // => Output thank you message
  }                                     // => Loop completes after all elements

  // Nested for loops
  print('\nDonation matrix:');          // => Header

  for (int row = 1; row <= 3; row++) {  // => Outer loop: 3 iterations
    String line = '';                   // => Initialize empty string for row

    for (int col = 1; col <= 4; col++) {  // => Inner loop: 4 iterations per row
      int amount = row * col * 100000;  // => Calculate cell value
      line += 'Rp$amount ';             // => Append to line string
    }                                   // => Inner loop completes

    print(line);                        // => Output complete row
  }                                     // => Outer loop continues
}
```

**Key Takeaway**: Standard for loop uses `initialize; condition; increment`. For-in loop iterates collections. Nested loops create multi-dimensional patterns.

**Expected Output**:

```
Monthly savings plan:
Month 1: Rp500000.0
Month 2: Rp1000000.0
Month 3: Rp1500000.0
Month 4: Rp2000000.0
Month 5: Rp2500000.0

Quarterly Zakat payments:
Quarter 1: Rp1000000.0
Quarter 2: Rp4000000.0
Quarter 3: Rp7000000.0
Quarter 4: Rp10000000.0

Donor thank you messages:
Jazakallah khair, Ahmad!
Jazakallah khair, Fatimah!
Jazakallah khair, Ali!

Donation matrix:
Rp100000 Rp200000 Rp300000 Rp400000
Rp200000 Rp400000 Rp600000 Rp800000
Rp300000 Rp600000 Rp900000 Rp1200000
```

**Why It Matters**: Loops are the foundation of data processing—generating reports, processing transactions, sending notifications, and computing aggregations all involve iteration. For loops are essential for Flutter list rendering, batch processing financial records, and generating scheduled payment plans. Understanding iteration patterns prevents common production bugs like off-by-one errors that cause incorrect transaction counts or skipped data in critical financial calculations.

**Common Pitfalls**: Off-by-one errors with loop conditions. Forgetting to increment counter causes infinite loop. Modifying collection during for-in loop causes error.

### Example 7: Control Flow - While and Do-While

While loops execute code repeatedly while condition remains true.

```dart
void main() {
  // While loop - checks condition before executing
  double balance = 10000000.0;          // => Initial balance: 10 million
                                        // => balance stores 10000000.0 (type: double)
  int withdrawals = 0;                  // => Counter for withdrawals
                                        // => withdrawals starts at 0 (type: int)

  print('Sadaqah withdrawals:');        // => Header
                                        // => Output: Sadaqah withdrawals:

  while (balance >= 500000.0) {         // => Check condition first (BEFORE executing block)
                                        // => Continues while balance >= 500000
                                        // => Iteration 1: 10000000.0 >= 500000.0 = true
    double withdrawal = 500000.0;       // => Fixed withdrawal amount
                                        // => withdrawal stores 500000.0 each iteration
    balance -= withdrawal;              // => Subtract from balance
                                        // => balance decreases each iteration
                                        // => Iteration 1: 10000000.0 - 500000.0 = 9500000.0
    withdrawals++;                      // => Increment counter
                                        // => Iteration 1: withdrawals becomes 1
    print('Withdrawal $withdrawals: Rp$withdrawal, Remaining: Rp$balance');
                                        // => Output with current values
                                        // => Iteration 1: Withdrawal 1: Rp500000.0, Remaining: Rp9500000.0
  }                                     // => Loop exits when condition false (balance < 500000)
                                        // => After 20 iterations, balance is 0.0

  print('Total withdrawals: $withdrawals\n');
                                        // => Output: Total withdrawals: 20
                                        // => \n adds blank line

  // Do-while loop - executes first, then checks condition
  double donation = 0.0;                // => Start at zero
                                        // => donation stores 0.0 (type: double)
  int attempts = 0;                     // => Counter
                                        // => attempts starts at 0 (type: int)

  print('Donation collection:');        // => Header
                                        // => Output: Donation collection:

  do {                                  // => Execute block first (BEFORE checking condition)
                                        // => Guaranteed to run at least once
    donation += 100000.0;               // => Add 100000 to donation
                                        // => Iteration 1: 0.0 + 100000.0 = 100000.0
                                        // => Iteration 2: 100000.0 + 100000.0 = 200000.0
    attempts++;                         // => Increment counter
                                        // => Iteration 1: attempts becomes 1
    print('Attempt $attempts: Collected Rp$donation');
                                        // => Output current state
                                        // => Iteration 1: Attempt 1: Collected Rp100000.0
  } while (donation < 500000.0);        // => Check condition after execution
                                        // => Loops 5 times total
                                        // => Loop exits when donation >= 500000.0

  print('Target reached after $attempts attempts\n');
                                        // => Output: Target reached after 5 attempts
                                        // => \n adds blank line

  // While loop with break
  int daysUntilRamadan = 10;            // => Countdown starts at 10
                                        // => daysUntilRamadan stores 10 (type: int)

  print('Ramadan countdown:');          // => Header
                                        // => Output: Ramadan countdown:

  while (true) {                        // => Infinite loop condition
                                        // => true is always true - requires break to exit
    if (daysUntilRamadan == 0) {        // => Check if countdown reached zero
                                        // => Evaluates to false for first 10 iterations
      print('Ramadan Mubarak!');        // => Final message
                                        // => Executed when daysUntilRamadan == 0
      break;                            // => Exit loop immediately
                                        // => Jumps to first statement after while loop
    }                                   // => End if block
    print('$daysUntilRamadan days remaining');
                                        // => Show days left
                                        // => Iteration 1: 10 days remaining
    daysUntilRamadan--;                 // => Decrement counter
                                        // => Iteration 1: daysUntilRamadan becomes 9
  }                                     // => Loop exits via break (when counter reaches 0)
                                        // => Execution continues here after break

  // While loop with continue
  int donors = 0;                       // => Counter
                                        // => donors starts at 0 (type: int)
  int invalidCount = 0;                 // => Track invalid entries
                                        // => invalidCount starts at 0 (type: int)

  print('\nProcessing donors:');        // => Header
                                        // => \n adds blank line before output
                                        // => Output: Processing donors:

  while (donors < 5) {                  // => Process 5 donor entries
                                        // => Loop while donors < 5
    donors++;                           // => Increment donor number first
                                        // => Iteration 1: donors becomes 1

    if (donors == 2 || donors == 4) {   // => Check for invalid donor numbers
                                        // => Evaluates to true when donors is 2 or 4
                                        // => Iteration 2: donors == 2 is true
      invalidCount++;                   // => Count invalid entry
                                        // => Iteration 2: invalidCount becomes 1
      print('Donor $donors: Invalid (skipped)');
                                        // => Output invalid donor
                                        // => Iteration 2: Donor 2: Invalid (skipped)
      continue;                         // => Skip rest of iteration
                                        // => Jumps to while condition, skips print below
    }                                   // => End if block

    print('Donor $donors: Processed successfully');
                                        // => Process valid donor
                                        // => Iteration 1: Donor 1: Processed successfully
                                        // => Iteration 3: Donor 3: Processed successfully
  }                                     // => Loop continues
                                        // => Exits when donors >= 5

  print('Valid donors: ${donors - invalidCount}');
                                        // => donors = 5, invalidCount = 2
                                        // => 5 - 2 = 3
                                        // => Output: Valid donors: 3
}                                       // => End of main function
```

**Key Takeaway**: While loops check condition before execution. Do-while loops execute at least once. Use `break` to exit early, `continue` to skip iteration.

**Expected Output**:

```
Sadaqah withdrawals:
Withdrawal 1: Rp500000.0, Remaining: Rp9500000.0
Withdrawal 2: Rp500000.0, Remaining: Rp9000000.0
...
Withdrawal 20: Rp500000.0, Remaining: Rp0.0
Total withdrawals: 20

Donation collection:
Attempt 1: Collected Rp100000.0
Attempt 2: Collected Rp200000.0
Attempt 3: Collected Rp300000.0
Attempt 4: Collected Rp400000.0
Attempt 5: Collected Rp500000.0
Target reached after 5 attempts

Ramadan countdown:
10 days remaining
9 days remaining
...
1 days remaining
Ramadan Mubarak!

Processing donors:
Donor 1: Processed successfully
Donor 2: Invalid (skipped)
Donor 3: Processed successfully
Donor 4: Invalid (skipped)
Donor 5: Processed successfully
Valid donors: 3
```

**Why It Matters**: While loops enable dynamic iteration where the number of repetitions is unknown upfront—user authentication retry logic, payment processing attempts, and streaming data consumption all require conditional looping. Break and continue enable fine-grained control over loop execution, allowing early exit on success or skipping invalid records. Production applications rely on well-controlled loops to process variable-length data sets without hanging or crashing.

**Common Pitfalls**: Infinite loops when condition never becomes false. Do-while executes at least once even if condition initially false.

### Example 8: Switch Statements

Switch statements match a value against multiple cases for multi-way branching.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart TD
    Val[switch value] --> C1{case 1?}
    C1 -->|match| B1[Execute block 1<br/>break]
    C1 -->|no match| C2{case 2?}
    C2 -->|match| B2[Execute block 2<br/>break]
    C2 -->|no match| C3{case 3?}
    C3 -->|match| B3[Execute block 3<br/>break]
    C3 -->|no match| Def[default block<br/>break]
    B1 --> Exit[Continue program]
    B2 --> Exit
    B3 --> Exit
    Def --> Exit

    style Val fill:#0173B2,stroke:#000,color:#fff
    style B1 fill:#029E73,stroke:#000,color:#fff
    style B2 fill:#DE8F05,stroke:#000,color:#000
    style B3 fill:#CC78BC,stroke:#000,color:#000
    style Def fill:#CA9161,stroke:#000,color:#fff
```

```dart
void main() {
  // Basic switch statement
  String paymentType = 'Cash';          // => paymentType stores 'Cash' (type: String)
                                        // => Variable for payment method

  switch (paymentType) {                // => Match paymentType against cases
                                        // => Control jumps to matching case
    case 'Cash':                        // => This case matches ('Cash' == 'Cash')
                                        // => Execute statements in this block
      print('Cash payment received');   // => Output: Cash payment received
      print('No processing fee');       // => Second statement in case
                                        // => Output: No processing fee
      break;                            // => Exit switch (required!)
                                        // => Without break, execution falls through

    case 'Card':                        // => Not matched, skipped
                                        // => paymentType is not 'Card'
      print('Card payment received');   // => Not executed
      print('1% processing fee');       // => Not executed
      break;                            // => Exit point if this case matched

    case 'Transfer':                    // => Not matched, skipped
                                        // => paymentType is not 'Transfer'
      print('Bank transfer received');  // => Not executed
      print('No processing fee');       // => Not executed
      break;                            // => Exit point if this case matched

    default:                            // => Executes if no case matches
                                        // => Safety net for unexpected values
      print('Unknown payment type');    // => Not executed (Cash matched)
      break;                            // => Exit point for default case
  }                                     // => End of switch statement

  // Switch with fall-through (multiple cases)
  int zakatMonth = 3;                   // => Month 3 (Ramadan)
                                        // => zakatMonth stores 3 (type: int)

  switch (zakatMonth) {                 // => Match zakatMonth against cases
                                        // => Evaluates to 3
    case 1:                             // => Not matched (3 != 1)
                                        // => Falls through to next case
    case 2:                             // => Not matched (3 != 2)
                                        // => Falls through to next case
    case 3:                             // => Matched! (3 == 3)
                                        // => Execute statements for cases 1, 2, or 3
      print('Ramadan - Zakat collection peak');
                                        // => Output: Ramadan - Zakat collection peak
                                        // => Single implementation for 3 cases
      break;                            // => Exit switch
                                        // => Execution continues after switch

    case 9:                             // => Not matched (3 != 9)
                                        // => Falls through to next case
    case 10:                            // => Not matched (3 != 10)
                                        // => Would execute next statement if matched
      print('Shawwal/Dhul Qadah - Normal collection');
                                        // => Not executed
      break;                            // => Exit point if matched

    default:                            // => Default case
                                        // => Executes if zakatMonth not 1,2,3,9,10
      print('Regular month');           // => Not executed (case 3 matched)
      break;                            // => Exit point for default
  }                                     // => End of second switch

  // Switch for categorization
  double donationAmount = 7500000.0;    // => donationAmount stores 7.5 million
                                        // => donationAmount is 7500000.0 (type: double)
  String category;                      // => Variable to store result (type: String)
                                        // => Uninitialized, will be assigned in switch

  // Convert amount to category code
  int level = (donationAmount ~/ 5000000).toInt();
                                        // => Integer division: 7500000 ~/ 5000000 = 1
                                        // => .toInt() ensures int type
                                        // => level stores 1

  switch (level) {                      // => Match level value (1)
                                        // => Switch on integer level
    case 0:                             // => Not matched (1 != 0)
                                        // => For donations < 5M
      category = 'Bronze (< 5M)';       // => Not executed
      break;                            // => Exit point if matched

    case 1:                             // => Matched! (1 == 1)
                                        // => For donations 5M - 10M
      category = 'Silver (5M - 10M)';   // => category assigned 'Silver (5M - 10M)'
                                        // => category now initialized with value
      break;                            // => Exit switch
                                        // => Skip remaining cases

    case 2:                             // => Not matched (1 != 2)
                                        // => For donations 10M - 15M
      category = 'Gold (10M - 15M)';    // => Not executed
      break;                            // => Exit point if matched

    default:                            // => Default case
                                        // => For donations >= 15M
      category = 'Platinum (> 15M)';    // => Not executed (case 1 matched)
      break;                            // => Exit point for default
  }                                     // => End of third switch

  print('Donor category: $category');   // => Output: Donor category: Silver (5M - 10M)
                                        // => String interpolation displays category

  // Switch with enum-like string values
  String zakatType = 'Wealth';          // => zakatType stores 'Wealth' (type: String)
                                        // => Variable for Zakat category
  double rate;                          // => Variable for rate (type: double)
                                        // => Uninitialized, assigned in switch

  switch (zakatType) {                  // => Match zakatType ('Wealth')
                                        // => Switch on string value
    case 'Wealth':                      // => Matched! ('Wealth' == 'Wealth')
                                        // => Zakat on savings/investments
      rate = 0.025;                     // => 2.5% for wealth Zakat
                                        // => rate stores 0.025 (type: double)
      print('Zakat al-Mal (Wealth): ${rate * 100}%');
                                        // => 0.025 * 100 = 2.5
                                        // => Output: Zakat al-Mal (Wealth): 2.5%
      break;                            // => Exit switch
                                        // => Skip remaining cases

    case 'Agriculture':                 // => Not matched ('Wealth' != 'Agriculture')
                                        // => Zakat on crops
      rate = 0.10;                      // => 10% for irrigated crops
                                        // => Not executed
      print('Zakat al-Ziraah (Agriculture): ${rate * 100}%');
                                        // => Not executed
      break;                            // => Exit point if matched

    case 'Gold':                        // => Not matched ('Wealth' != 'Gold')
                                        // => Zakat on precious metals
      rate = 0.025;                     // => 2.5% for gold/silver
                                        // => Not executed
      print('Zakat on Gold/Silver: ${rate * 100}%');
                                        // => Not executed
      break;                            // => Exit point if matched

    default:                            // => Default case
                                        // => Executes if zakatType not recognized
      rate = 0.0;                       // => 0% for unknown types
                                        // => Not executed ('Wealth' matched)
      print('Unknown Zakat type');      // => Not executed
      break;                            // => Exit point for default
  }                                     // => End of fourth switch
}                                       // => End of main function
```

**Key Takeaway**: Switch matches value against cases. Each case needs `break` to prevent fall-through. Multiple cases can share implementation. Use `default` for unmatched values.

**Expected Output**:

```
Cash payment received
No processing fee
Ramadan - Zakat collection peak
Donor category: Silver (5M - 10M)
Zakat al-Mal (Wealth): 2.5%
```

**Why It Matters**: Switch statements express multi-way business logic clearly and efficiently, ideal for payment method routing, Zakat type calculation, transaction status handling, and notification routing. Unlike long if-else chains, switch statements are more readable for discrete value matching and enable exhaustive case analysis. In Flutter, switch expressions handle widget rendering based on enum states, making UI logic self-documenting.

**Common Pitfalls**: Forgetting `break` causes fall-through to next case. Switch only works with compile-time constants.

### Example 9: Lists - Creation and Basic Operations

Lists are ordered collections of elements with dynamic or fixed length.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    L[List<br/>Ordered Collection] --> Idx[Index Access<br/>list[0] O1]
    L --> Add[Modification<br/>add, insert, remove]
    L --> Iter[Iteration<br/>for-in loop]
    L --> Info[Properties<br/>length, isEmpty, contains]

    Idx --> Ex1[Ahmad = index 0]
    Idx --> Ex2[Fatimah = index 1]
    Add --> Ex3[add appends to end]
    Iter --> Ex4[for donor in donors]

    style L fill:#0173B2,stroke:#000,color:#fff
    style Idx fill:#029E73,stroke:#000,color:#fff
    style Add fill:#DE8F05,stroke:#000,color:#000
    style Iter fill:#CC78BC,stroke:#000,color:#000
    style Info fill:#CA9161,stroke:#000,color:#fff
```

```dart
void main() {
  // List literal creation
  List<String> donors = ['Ahmad', 'Fatimah', 'Ali'];  // => Create list with 3 elements
                                                       // => Type: List<String>

  List<int> amounts = [500000, 1000000, 750000];  // => List of integers
                                                  // => Type: List<int>

  // Access elements by index (zero-based)
  String firstDonor = donors[0];        // => firstDonor stores 'Ahmad'
                                        // => Index 0 is first element

  int lastAmount = amounts[amounts.length - 1];  // => Get last element
                                                 // => length property returns 3
                                                 // => lastAmount stores 750000

  print('First donor: $firstDonor');    // => Output: First donor: Ahmad
  print('Last amount: Rp$lastAmount');  // => Output: Last amount: Rp750000

  // Add elements
  donors.add('Zainab');                 // => Append to end of list
                                        // => donors now has 4 elements

  amounts.addAll([250000, 500000]);     // => Add multiple elements
                                        // => amounts now has 5 elements

  donors.insert(1, 'Hassan');           // => Insert at index 1
                                        // => Shifts existing elements right
                                        // => donors: ['Ahmad', 'Hassan', 'Fatimah', 'Ali', 'Zainab']

  print('Donors count: ${donors.length}');  // => Output: Donors count: 5

  // Remove elements
  amounts.removeLast();                 // => Remove last element (500000)
                                        // => amounts now has 4 elements

  donors.removeAt(2);                   // => Remove element at index 2 ('Fatimah')
                                        // => donors now has 4 elements

  bool removed = amounts.remove(1000000);  // => Remove by value
                                           // => removed stores true (found and removed)
                                           // => amounts: [500000, 750000, 250000]

  // Check for elements
  bool hasDonor = donors.contains('Ali');  // => hasDonor stores true
                                           // => 'Ali' exists in list

  int index = amounts.indexOf(750000);  // => index stores 1
                                        // => Returns -1 if not found

  bool isEmpty = donors.isEmpty;        // => isEmpty stores false
                                        // => List has 4 elements

  print('Contains Ali: $hasDonor');     // => Output: Contains Ali: true
  print('Index of 750000: $index');     // => Output: Index of 750000: 1

  // Modify elements
  donors[0] = 'Abdullah';               // => Replace first element
                                        // => donors: ['Abdullah', 'Hassan', 'Ali', 'Zainab']

  amounts[1] += 250000;                 // => Increase element by 250000
                                        // => amounts[1] now 1000000

  // Iterate over list
  print('All donors:');                 // => Header
  for (String donor in donors) {        // => For-in loop
    print('- $donor');                  // => Output each donor with bullet
  }                                     // => Outputs 4 lines

  // Create list with specific length
  List<double> zakatPayments = List.filled(3, 0.0);  // => Create list of 3 elements
                                                      // => All initialized to 0.0
                                                      // => Type: List<double>

  zakatPayments[0] = 500000.0;          // => Set first element
  zakatPayments[1] = 750000.0;          // => Set second element
  zakatPayments[2] = 1000000.0;         // => Set third element

  print('Payments: $zakatPayments');    // => Output: Payments: [500000.0, 750000.0, 1000000.0]
}
```

**Key Takeaway**: Lists are ordered, indexed (0-based) collections. Use `add`, `insert`, `remove` to modify. Access elements with `[]` operator. Check `length`, `contains`, `indexOf` for info.

**Expected Output**:

```
First donor: Ahmad
Last amount: Rp750000
Donors count: 5
Contains Ali: true
Index of 750000: 1
All donors:
- Abdullah
- Hassan
- Ali
- Zainab
Payments: [500000.0, 750000.0, 1000000.0]
```

**Why It Matters**: Lists are the primary data structure for collections in Dart applications—transaction histories, donor records, payment schedules, and API response arrays are all lists. Mastering list operations is essential for Flutter development where `ListView` widgets render dynamic data. Efficient list manipulation prevents O(n²) operations that cause UI lag when processing large datasets. Understanding list indices prevents out-of-bounds crashes in production.

**Common Pitfalls**: Index out of range throws error. Lists are zero-based (first element is index 0). Modifying list during iteration causes error.

### Example 10: Maps - Key-Value Storage

Maps store data as key-value pairs for efficient lookups.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    M[Map<br/>Key-Value Storage] --> KV[Key: String<br/>Value: int]
    KV --> K1[Ahmad → 500000]
    KV --> K2[Fatimah → 1000000]
    KV --> K3[Ali → 750000]
    M --> Ops[Operations]
    Ops --> Get[map key → value or null]
    Ops --> Set[map key = value]
    Ops --> Del[map.remove key]

    style M fill:#0173B2,stroke:#000,color:#fff
    style KV fill:#DE8F05,stroke:#000,color:#000
    style K1 fill:#029E73,stroke:#000,color:#fff
    style K2 fill:#029E73,stroke:#000,color:#fff
    style K3 fill:#029E73,stroke:#000,color:#fff
    style Ops fill:#CC78BC,stroke:#000,color:#000
```

```dart
void main() {
  // Map literal creation
  Map<String, int> donorAmounts = {     // => Key type: String, Value type: int
    'Ahmad': 500000,                    // => Key-value pair
    'Fatimah': 1000000,                 // => Key must be unique
    'Ali': 750000,                      // => Value can duplicate
  };                                    // => Map with 3 entries

  // Access values by key
  int? ahmadAmount = donorAmounts['Ahmad'];  // => ahmadAmount stores 500000
                                             // => Returns int? (nullable)

  int? unknownAmount = donorAmounts['Unknown'];  // => unknownAmount stores null
                                                 // => Key doesn't exist

  print('Ahmad donated: Rp${ahmadAmount ?? 0}');  // => Output: Ahmad donated: Rp500000
                                                   // => ?? provides default if null

  // Add or update entries
  donorAmounts['Zainab'] = 1250000;     // => Add new key-value pair
                                        // => Map now has 4 entries

  donorAmounts['Ahmad'] = 600000;       // => Update existing key
                                        // => Replaces old value 500000

  // Remove entries
  int? removed = donorAmounts.remove('Ali');  // => Remove by key
                                              // => removed stores 750000 (old value)
                                              // => Map now has 3 entries

  // Check for keys/values
  bool hasKey = donorAmounts.containsKey('Fatimah');  // => hasKey stores true
                                                      // => Key exists

  bool hasValue = donorAmounts.containsValue(1000000);  // => hasValue stores true
                                                         // => Value exists

  print('Has Fatimah: $hasKey');        // => Output: Has Fatimah: true
  print('Has 1000000: $hasValue');      // => Output: Has 1000000: true

  // Map properties
  int size = donorAmounts.length;       // => size stores 3
                                        // => Number of entries

  bool isEmpty = donorAmounts.isEmpty;  // => isEmpty stores false
                                        // => Map has entries

  // Iterate over map
  print('All donations:');              // => Header
  donorAmounts.forEach((String name, int amount) {  // => forEach with callback
                                                     // => name receives key
                                                     // => amount receives value
    print('$name: Rp$amount');          // => Output key-value pair
  });                                   // => Executes 3 times

  // Get keys and values as collections
  Iterable<String> names = donorAmounts.keys;  // => Get all keys
                                               // => Type: Iterable<String>

  Iterable<int> amounts = donorAmounts.values;  // => Get all values
                                                // => Type: Iterable<int>

  print('Donor names: ${names.toList()}');  // => Convert Iterable to List
                                            // => Output: Donor names: [Ahmad, Fatimah, Zainab]

  // Calculate total from map values
  int total = 0;                        // => Initialize accumulator
  for (int amount in amounts) {         // => Iterate over values
    total += amount;                    // => Add to total
  }                                     // => Loop completes
  print('Total donations: Rp$total');   // => Output: Total donations: Rp2850000

  // Map with non-string keys
  Map<int, String> monthNames = {       // => Key type: int, Value type: String
    1: 'Muharram',                      // => Integer keys
    3: 'Rabi al-Awwal',
    9: 'Ramadan',
    12: 'Dhul Hijjah',
  };                                    // => Map with 4 entries

  String? ramadan = monthNames[9];      // => ramadan stores 'Ramadan'
  print('Month 9: $ramadan');           // => Output: Month 9: Ramadan

  // Map with default values
  Map<String, double> zakatRates = {    // => Key: String, Value: double
    'Wealth': 0.025,                    // => 2.5%
    'Agriculture': 0.10,                // => 10%
    'Gold': 0.025,                      // => 2.5%
  };

  double rate = zakatRates['Wealth'] ?? 0.0;  // => Get with default
                                              // => rate stores 0.025

  print('Wealth Zakat rate: ${rate * 100}%');  // => Output: Wealth Zakat rate: 2.5%
}
```

**Key Takeaway**: Maps store key-value pairs. Keys must be unique. Use `[]` to access/modify. Methods: `containsKey`, `containsValue`, `remove`, `forEach`. Access keys/values as Iterables.

**Expected Output**:

```
Ahmad donated: Rp500000
Has Fatimah: true
Has 1000000: true
All donations:
Ahmad: Rp600000
Fatimah: Rp1000000
Zainab: Rp1250000
Donor names: [Ahmad, Fatimah, Zainab]
Total donations: Rp2850000
Month 9: Ramadan
Wealth Zakat rate: 2.5%
```

**Why It Matters**: Maps are the foundation of JSON data handling, configuration management, and caching in production applications. API responses, database query results, and user preferences are commonly represented as key-value maps. Flutter's routing system uses maps for navigation parameters. Understanding null-safe map access (`map[key] ?? default`) prevents runtime errors when keys are absent. Efficient map lookups (O(1)) enable fast data retrieval in real-time applications.

**Common Pitfalls**: Accessing non-existent key returns null (not error). Keys must be unique - adding duplicate key replaces value. Map iteration order matches insertion order.

## Examples 11-20: Functions and Classes

### Example 11: Function Basics

Functions encapsulate reusable code with parameters and return values.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
flowchart LR
    Params[Input Parameters] --> Function[Function Body<br/>Execute logic]
    Function --> Return{Has return<br/>type?}

    Return -->|Yes| ReturnVal[return value<br/>Must match type]
    Return -->|No void| NoReturn[No return<br/>void function]

    ReturnVal --> Caller[Caller receives<br/>returned value]
    NoReturn --> CallerVoid[Caller continues<br/>no value received]

    style Function fill:#0173B2
    style ReturnVal fill:#029E73
    style Params fill:#DE8F05
```

```dart
// Function with explicit types
double calculateZakat(double wealth) {  // => Parameter: wealth (type: double)
                                        // => Returns double
  const double rate = 0.025;            // => Local constant
  return wealth * rate;                 // => Calculate and return result
}                                       // => Function ends

// Function with multiple parameters
String formatDonation(String name, int amount, {String currency = 'Rp'}) {
                                        // => name, amount: positional parameters
                                        // => currency: named optional with default 'Rp'
  return '$name donated $currency$amount';  // => Build and return string
}

// Function with named parameters (all optional by default)
void printReceipt({                     // => All parameters named and optional
  required String donor,                // => required makes parameter mandatory
  required double amount,               // => Must provide when calling
  String? reference,                    // => Nullable optional parameter
}) {
  print('Donation Receipt');            // => Print header
  print('Donor: $donor');               // => Print donor name
  print('Amount: Rp$amount');           // => Print amount

  if (reference != null) {              // => Check if reference provided
    print('Reference: $reference');     // => Print only if not null
  }
}

// Arrow function (expression body)
double nisabThreshold() => 85.0 * 1000000.0;  // => Concise function syntax
                                               // => Returns result of expression
                                               // => Evaluates to 85000000.0

// Function without return value (void)
void logDonation(String message) {      // => void means no return value
  print('[LOG] $message');              // => Print with prefix
}                                       // => Function returns null implicitly

void main() {
  // Call function with positional parameter
  double zakat = calculateZakat(100000000.0);  // => Pass 100M as argument
                                               // => zakat stores 2500000.0
  print('Zakat amount: Rp$zakat');      // => Output: Zakat amount: Rp2500000.0

  // Call function with multiple positional parameters
  String message = formatDonation('Ahmad', 500000);
                                        // => Pass 2 positional args
                                        // => Uses default currency 'Rp'
                                        // => message stores formatted string
  print(message);                       // => Output: Ahmad donated Rp500000

  // Call function with named parameter override
  String usdMessage = formatDonation('Fatimah', 100, currency: '\$');
                                        // => Override currency parameter
                                        // => usdMessage stores 'Fatimah donated $100'
  print(usdMessage);                    // => Output: Fatimah donated $100

  // Call function with required named parameters
  printReceipt(                         // => Call with named parameters
    donor: 'Ali',                       // => Provide required donor
    amount: 750000.0,                   // => Provide required amount
    reference: 'REF-2025-001',          // => Provide optional reference
  );                                    // => Prints receipt

  // Call function without optional parameter
  printReceipt(                         // => Call without reference
    donor: 'Zainab',
    amount: 1000000.0,
  );                                    // => reference is null

  // Call arrow function
  double threshold = nisabThreshold();  // => Call function
                                        // => threshold stores 85000000.0
  print('Nisab threshold: Rp$threshold');  // => Output: Nisab threshold: Rp85000000.0

  // Call void function
  logDonation('Processing payment');    // => Execute function
                                        // => Prints: [LOG] Processing payment
}
```

**Key Takeaway**: Functions can have positional or named parameters. Named parameters use `{}`. Use `required` for mandatory named parameters. Arrow functions `=>` for single expressions. `void` for functions without return value.

**Expected Output**:

```
Zakat amount: Rp2500000.0
Ahmad donated Rp500000
Fatimah donated $100
Donation Receipt
Donor: Ali
Amount: Rp750000.0
Reference: REF-2025-001
Donation Receipt
Donor: Zainab
Amount: Rp1000000.0
Nisab threshold: Rp85000000.0
[LOG] Processing payment
```

**Why It Matters**: Function design determines code usability and maintainability in large Dart codebases. Named parameters make Flutter widget constructors self-documenting—`TextButton(onPressed: handler, child: label)` is clearer than positional arguments. Required named parameters prevent calling functions with missing critical values at compile time. First-class functions enable functional programming patterns used extensively in Flutter's widget tree construction and stream transformations.

**Common Pitfalls**: Named parameters are optional unless marked `required`. Positional parameters come before named parameters. Arrow functions limited to single expression.

### Example 12: Function Advanced - First-Class Functions

Functions are first-class objects that can be assigned, passed, and returned.

```dart
// Function type definition
typedef ZakatCalculator = double Function(double wealth);
                                        // => Type alias for function signature
                                        // => Takes double, returns double

// Higher-order function (accepts function as parameter)
double applyZakatRule(double wealth, ZakatCalculator calculator) {
                                        // => Takes wealth and calculator function
  return calculator(wealth);            // => Call passed function
                                        // => result: returned value from calculator
}                                       // => Returns calculated result

// Function returning function
ZakatCalculator getCalculator(String type) {  // => Returns function type
  if (type == 'wealth') {               // => Check type parameter
    return (double w) => w * 0.025;     // => Return function for wealth Zakat
                                        // => Anonymous function (lambda)
  } else if (type == 'agriculture') {
    return (double w) => w * 0.10;      // => Return function for agriculture
  } else {
    return (double w) => 0.0;           // => Default function returns 0
                                        // => Fallback: zero for unknown types
  }
}

void main() {
  // Assign function to variable
  ZakatCalculator wealthZakat = (double wealth) {  // => Store function in variable
                                                   // => Type: ZakatCalculator
    return wealth * 0.025;              // => Function body
  };                                    // => Function assigned

  double result = wealthZakat(100000000.0);  // => Call function via variable
                                             // => result stores 2500000.0
  print('Wealth Zakat: Rp$result');     // => Output: Wealth Zakat: Rp2500000.0

  // Pass function as argument
  double agricultureZakat = applyZakatRule(
    50000000.0,                         // => wealth argument
    (double w) => w * 0.10,             // => Anonymous function as argument
  );                                    // => agricultureZakat stores 5000000.0
  print('Agriculture Zakat: Rp$agricultureZakat');
                                        // => Output: Agriculture Zakat: Rp5000000.0

  // Get function from factory
  ZakatCalculator calculator = getCalculator('wealth');
                                        // => Retrieve function for wealth type
                                        // => calculator stores function

  double zakat = calculator(75000000.0);  // => Call retrieved function
                                          // => zakat stores 1875000.0
  print('Calculated Zakat: Rp$zakat');  // => Output: Calculated Zakat: Rp1875000.0

  // List of functions
  List<double Function(double)> calculators = [  // => List of function types
    (double w) => w * 0.025,            // => Wealth calculator
    (double w) => w * 0.10,             // => Agriculture calculator
    (double w) => w * 0.05,             // => Trade calculator
  ];                                    // => List with 3 functions

  print('Multiple Zakat calculations:');  // => Header
  for (var calc in calculators) {       // => Iterate over functions
    double amount = calc(10000000.0);   // => Call each function
    print('- Rp$amount');               // => Output result
  }                                     // => 3 outputs

  // Closure (function captures outer variables)
  double baseRate = 0.025;              // => Variable in outer scope

  ZakatCalculator closureCalc = (double wealth) {
                                        // => Function captures baseRate
    return wealth * baseRate;           // => Uses captured variable
  };                                    // => Closure created

  print('Base calculation: Rp${closureCalc(50000000.0)}');
                                        // => Output: Base calculation: Rp1250000.0

  baseRate = 0.03;                      // => Modify captured variable
  print('Modified calculation: Rp${closureCalc(50000000.0)}');
                                        // => Output: Modified calculation: Rp1500000.0
                                        // => Closure sees updated value

  // Function as callback
  void processDonation(double amount, void Function(String) callback) {
                                        // => Takes amount and callback function
    String message = 'Processed Rp$amount';  // => Create message
    callback(message);                  // => Call callback with message
  }

  processDonation(750000.0, (String msg) {  // => Pass callback function
    print('Callback: $msg');            // => Callback prints message
  });                                   // => Output: Callback: Processed Rp750000.0
}
```

**Key Takeaway**: Functions are first-class: assignable to variables, passable as arguments, returnable from functions. Use `typedef` for function types. Closures capture outer scope variables.

**Expected Output**:

```
Wealth Zakat: Rp2500000.0
Agriculture Zakat: Rp5000000.0
Calculated Zakat: Rp1875000.0
Multiple Zakat calculations:
- Rp250000.0
- Rp1000000.0
- Rp500000.0
Base calculation: Rp1250000.0
Modified calculation: Rp1500000.0
Callback: Processed Rp750000.0
```

**Why It Matters**: First-class functions are essential for Dart's functional programming model, enabling elegant callback patterns, higher-order collection operations (`map`, `where`, `fold`), and Flutter's callback-heavy widget API. Closures power event handlers, animation callbacks, and asynchronous operation completions throughout Flutter applications. Understanding that closures capture by reference prevents subtle bugs in long-lived closures within stateful widgets.

**Common Pitfalls**: Closures capture variables by reference - modifications visible. Anonymous functions need proper syntax. Function type compatibility matters.

### Example 13: Classes and Objects Basics

Classes define object blueprints with properties and methods.

```dart
// Basic class definition
class Donor {                           // => Class named Donor
  String name;                          // => Instance field (property)
  double totalDonations;                // => Stores cumulative amount

  // Constructor
  Donor(this.name, this.totalDonations);  // => Shorthand constructor
                                          // => this.field assigns parameter to field

  // Method
  void donate(double amount) {          // => Instance method
    totalDonations += amount;           // => Modify instance field
    print('$name donated Rp$amount');   // => Access instance field
  }                                     // => Method ends

  // Getter (computed property)
  String get category {                 // => Getter method (no parentheses when called)
    if (totalDonations >= 10000000) {   // => Check donation level
      return 'Gold';                    // => Return category
    } else if (totalDonations >= 5000000) {
      return 'Silver';
    } else {
      return 'Bronze';
    }
  }                                     // => Getter ends
}

void main() {
  // Create instance (object)
  Donor ahmad = Donor('Ahmad', 0.0);    // => Create new Donor object
                                        // => ahmad references object
                                        // => name: 'Ahmad', totalDonations: 0.0

  // Access fields
  print('Donor: ${ahmad.name}');        // => Access name field
                                        // => Output: Donor: Ahmad

  print('Total: Rp${ahmad.totalDonations}');
                                        // => Output: Total: Rp0.0

  // Call methods
  ahmad.donate(2500000.0);              // => Call donate method
                                        // => Modifies totalDonations
                                        // => Output: Ahmad donated Rp2500000.0

  ahmad.donate(3000000.0);              // => Call again
                                        // => totalDonations now 5500000.0
                                        // => Output: Ahmad donated Rp3000000.0

  // Access getter
  String ahmadCategory = ahmad.category;  // => Call getter (no parentheses)
                                          // => ahmadCategory stores 'Silver'
  print('Category: $ahmadCategory');    // => Output: Category: Silver

  // Create multiple objects
  Donor fatimah = Donor('Fatimah', 12000000.0);
                                        // => Second Donor object
                                        // => Separate instance from ahmad

  print('${fatimah.name} is ${fatimah.category}');
                                        // => Access fields and getter
                                        // => Output: Fatimah is Gold

  // Objects are independent
  ahmad.donate(5000000.0);              // => Modify ahmad only
                                        // => ahmad.totalDonations: 10500000.0
                                        // => fatimah.totalDonations unchanged: 12000000.0

  print('Ahmad: ${ahmad.category}');    // => Output: Ahmad: Gold
  print('Fatimah: ${fatimah.category}');  // => Output: Fatimah: Gold
}
```

**Key Takeaway**: Classes define object templates with fields and methods. Constructor `ClassName(this.field)` initializes fields. Getters provide computed properties. Each object is independent instance.

**Expected Output**:

```
Donor: Ahmad
Total: Rp0.0
Ahmad donated Rp2500000.0
Ahmad donated Rp3000000.0
Category: Silver
Fatimah is Gold
Ahmad donated Rp5000000.0
Ahmad: Gold
Fatimah: Gold
```

**Why It Matters**: Object-oriented programming with classes is the primary design pattern for Dart applications—Flutter widgets, services, repositories, and domain models are all classes. Understanding object instantiation, field encapsulation, and method invocation is prerequisite knowledge for building any non-trivial Dart application. Getter methods enable computed properties without public field exposure, a pattern used extensively in Flutter's state management solutions like BLoC and Provider.

**Common Pitfalls**: Forgetting `new` keyword is fine in Dart (optional). Getters called without `()`. Each instance has own field values.

### Example 14: Classes - Named Constructors and Factory

Classes can have multiple constructors and factory constructors for flexible object creation.

```dart
class ZakatPayment {                    // => Class for Zakat payments
  String donorName;                     // => Donor identifier
  double amount;                        // => Payment amount
  DateTime date;                        // => Payment timestamp
  String type;                          // => Zakat type

  // Default constructor
  // => Shorthand syntax: this.field assigns constructor parameter to field
  ZakatPayment(this.donorName, this.amount, this.date, this.type);
                                        // => Standard constructor
                                        // => Requires all 4 fields at construction

  // Named constructor for wealth Zakat
  // => Named constructors enable domain-specific creation methods
  ZakatPayment.wealth(String name, double wealth)
                                        // => Named constructor syntax
                                        // => ClassName.name(...) pattern
      : donorName = name,               // => Initialize donorName
        amount = wealth * 0.025,        // => Calculate amount (2.5%)
        date = DateTime.now(),          // => Set current date
        type = 'Wealth';                // => Set type
                                        // => Initializer list with :
                                        // => Runs before constructor body

  // Named constructor for agriculture Zakat
  // => Different calculation logic than wealth Zakat
  ZakatPayment.agriculture(String name, double harvest)
      // => Takes harvest value as input
      : donorName = name,               // => Same initialization pattern
        amount = harvest * 0.10,        // => 10% for agriculture (higher rate)
        date = DateTime.now(),          // => Current timestamp
        type = 'Agriculture';           // => Identifies Zakat type
                                        // => Each named constructor encapsulates business logic

  // Factory constructor (can return cached instances)
  // => factory keyword enables returning existing instances or subtypes
  factory ZakatPayment.fromMap(Map<String, dynamic> map) {
                                        // => factory keyword
                                        // => Can return existing instance or subtype
                                        // => Unlike regular constructors, can control what gets returned
    return ZakatPayment(                // => Create and return instance
      // => Calls default constructor internally
      map['donorName'] as String,       // => Extract from map with type cast
      map['amount'] as double,          // => Type cast ensures double
      DateTime.parse(map['date'] as String),
                                        // => Parse string to DateTime
                                        // => Handles date deserialization
      map['type'] as String,            // => Extract type field
    );                                  // => Return created object
                                        // => Factory enables custom construction logic
  }

  // Const constructor (compile-time constant objects)
  const ZakatPayment.constant({         // => const constructor
    required this.donorName,            // => Must initialize all fields
    required this.amount,
    required this.date,
    required this.type,
  });                                   // => All fields must be final for const

  void printReceipt() {                 // => Method to display info
    print('---Receipt---');             // => Print header
    print('Donor: $donorName');         // => String interpolation with $
                                        // => Outputs donor name
    print('Type: $type');               // => Display Zakat type
    print('Amount: Rp$amount');         // => Display calculated amount
    print('Date: ${date.year}-${date.month}-${date.day}');
                                        // => Extract year, month, day from DateTime
                                        // => ${expression} syntax for complex interpolation
    print('------------');               // => Print footer
  }                                     // => Method completes
}

void main() {
  // Use default constructor
  ZakatPayment payment1 = ZakatPayment(
    'Ahmad',                            // => donorName parameter
    500000.0,                           // => amount parameter
    DateTime(2025, 1, 29),              // => date parameter (creates DateTime object)
    'Sadaqah',                          // => type parameter
  );                                    // => Create object with default constructor
                                        // => payment1 now holds ZakatPayment instance
                                        // => All fields assigned via this.field syntax

  payment1.printReceipt();              // => Call method to display receipt
                                        // => Method accesses instance fields

  // Use named constructor for wealth
  ZakatPayment payment2 = ZakatPayment.wealth('Fatimah', 100000000.0);
                                        // => Create with named constructor
                                        // => Calculates amount automatically
                                        // => amount: 2500000.0

  payment2.printReceipt();              // => Output shows calculated amount

  // Use named constructor for agriculture
  ZakatPayment payment3 = ZakatPayment.agriculture('Ali', 50000000.0);
                                        // => Create with agriculture constructor
                                        // => amount: 5000000.0 (10%)

  payment3.printReceipt();

  // Use factory constructor with map
  Map<String, dynamic> data = {         // => Data map
    'donorName': 'Zainab',
    'amount': 750000.0,
    'date': '2025-01-29',
    'type': 'Fidyah',
  };

  ZakatPayment payment4 = ZakatPayment.fromMap(data);
                                        // => Create from map
                                        // => Factory handles parsing

  payment4.printReceipt();

  // Compare construction approaches
  print('Wealth Zakat calculated: Rp${payment2.amount}');
                                        // => Output: Rp2500000.0
  print('Agriculture Zakat calculated: Rp${payment3.amount}');
                                        // => Output: Rp5000000.0
}
```

**Key Takeaway**: Named constructors provide multiple construction methods. Use initializer list `:` to set fields. Factory constructors allow returning cached/subtype instances. Named constructors clarify intent.

**Expected Output**:

```
---Receipt---
Donor: Ahmad
Type: Sadaqah
Amount: Rp500000.0
Date: 2025-1-29
------------
---Receipt---
Donor: Fatimah
Type: Wealth
Amount: Rp2500000.0
Date: 2025-1-29
------------
---Receipt---
Donor: Ali
Type: Agriculture
Amount: Rp5000000.0
Date: 2025-1-29
------------
---Receipt---
Donor: Zainab
Type: Fidyah
Amount: Rp750000.0
Date: 2025-1-29
------------
Wealth Zakat calculated: Rp2500000.0
Agriculture Zakat calculated: Rp5000000.0
```

**Why It Matters**: Multiple constructors enable domain-driven object creation, making APIs expressive and preventing invalid object states. Factory constructors power deserialization patterns critical for API integration—`fromJson()` factory constructors are the standard approach for parsing API responses in Flutter applications. Named constructors like `.fromNow()` or `.fromDate()` provide semantic clarity in domain models, reducing bugs from incorrect object initialization.

**Common Pitfalls**: Named constructor syntax is `ClassName.name`. Initializer list uses `:` not `{}`. Factory constructors must return instance.

### Example 15: Classes - Getters and Setters

Getters and setters provide controlled access to object properties with validation.

```dart
class DonationAccount {                 // => Class for managing donations
  String _accountId;                    // => Private field (underscore prefix)
  double _balance;                      // => Private balance field
  List<double> _transactions = [];      // => Private transaction history

  DonationAccount(this._accountId, this._balance);
                                        // => Constructor initializes private fields

  // Getter for accountId (read-only)
  String get accountId => _accountId;   // => Arrow function getter
                                        // => Returns private field
                                        // => No setter - read-only property

  // Getter for balance
  double get balance => _balance;       // => Expose balance as read-only

  // Setter for balance with validation
  // => Setters enable validation before assignment
  set balance(double value) {           // => Setter method
                                        // => Called like property: account.balance = value
    if (value < 0) {                    // => Validate input
                                        // => Business rule: balance must be non-negative
      throw ArgumentError('Balance cannot be negative');
                                        // => Throw error for invalid value
                                        // => Prevents invalid state
    }
    _balance = value;                   // => Set private field after validation
  }                                     // => Setter ends

  // Computed getter (no backing field)
  double get averageTransaction {       // => Calculated property
    if (_transactions.isEmpty) {        // => Check for empty list
      return 0.0;                       // => Return default
    }
    double sum = _transactions.reduce((a, b) => a + b);
                                        // => Sum all transactions
    return sum / _transactions.length;  // => Calculate average
  }                                     // => Return computed value

  // Getter with complex logic
  // => Getters can contain business logic, not just field access
  String get status {                   // => Status based on balance
                                        // => Called like property: account.status
    if (_balance >= 10000000) {         // => Check premium threshold
      return 'Premium (>= 10M)';        // => High-value account
    } else if (_balance >= 5000000) {   // => Check standard threshold
      return 'Standard (>= 5M)';        // => Mid-value account
    } else {                            // => Below standard threshold
      return 'Basic (< 5M)';            // => Low-value account
    }
  }                                     // => Computed dynamically on each access

  void deposit(double amount) {         // => Method to add funds
    if (amount <= 0) {                  // => Validate amount is positive
                                        // => Business rule enforcement
      throw ArgumentError('Amount must be positive');
                                        // => Throw error for invalid input
    }
    _balance += amount;                 // => Update balance by adding amount
    _transactions.add(amount);          // => Record positive transaction
                                        // => Maintains audit trail
  }                                     // => Method completes

  void withdraw(double amount) {        // => Method to remove funds
    if (amount > _balance) {            // => Check sufficient funds available
                                        // => Prevents negative balance
      throw ArgumentError('Insufficient balance');
                                        // => Reject transaction if insufficient funds
    }
    _balance -= amount;                 // => Update balance by subtracting amount
    _transactions.add(-amount);         // => Record negative transaction
                                        // => Negative value indicates withdrawal
  }                                     // => Method completes
}

void main() {
  // Create account
  DonationAccount account = DonationAccount('ACC-001', 5000000.0);
                                        // => Create with initial balance

  // Access getters
  print('Account: ${account.accountId}');  // => Output: Account: ACC-001
  print('Balance: Rp${account.balance}');  // => Output: Balance: Rp5000000.0
  print('Status: ${account.status}');   // => Output: Status: Standard (>= 5M)

  // Deposit funds
  account.deposit(3000000.0);           // => Add 3M
                                        // => balance now 8000000.0

  print('After deposit: Rp${account.balance}');
                                        // => Output: After deposit: Rp8000000.0
  print('Status: ${account.status}');   // => Output: Status: Standard (>= 5M)

  // Withdraw funds
  account.withdraw(1000000.0);          // => Remove 1M
                                        // => balance now 7000000.0

  print('After withdrawal: Rp${account.balance}');
                                        // => Output: After withdrawal: Rp7000000.0

  // Access computed getter
  print('Average transaction: Rp${account.averageTransaction}');
                                        // => Output: Average transaction: Rp1000000.0
                                        // => (3000000 + (-1000000)) / 2

  // Try to set balance directly (using setter)
  try {
    account.balance = 12000000.0;       // => Use setter
                                        // => balance now 12000000.0
    print('Direct set balance: Rp${account.balance}');
                                        // => Output: Direct set balance: Rp12000000.0
    print('Status: ${account.status}'); // => Output: Status: Premium (>= 10M)
  } catch (e) {
    print('Error: $e');
  }

  // Try invalid balance (negative)
  try {
    account.balance = -1000.0;          // => Attempt invalid value
                                        // => Setter throws error
  } catch (e) {                         // => Catch exception
    print('Caught error: $e');          // => Output: Caught error: Invalid argument(s): Balance cannot be negative
  }

  print('Final balance: Rp${account.balance}');
                                        // => balance unchanged: 12000000.0
                                        // => Output: Final balance: Rp12000000.0
}
```

**Key Takeaway**: Getters provide read access, setters provide write access with validation. Use underscore `_` for private fields. Computed getters calculate values on access. Setters can enforce constraints.

**Expected Output**:

```
Account: ACC-001
Balance: Rp5000000.0
Status: Standard (>= 5M)
After deposit: Rp8000000.0
Status: Standard (>= 5M)
After withdrawal: Rp7000000.0
Average transaction: Rp1000000.0
Direct set balance: Rp12000000.0
Status: Premium (>= 10M)
Caught error: Invalid argument(s): Balance cannot be negative
Final balance: Rp12000000.0
```

**Why It Matters**: Encapsulation through getters and setters enforces data integrity in production objects. Validation in setters prevents invalid states (negative balances, expired dates) from entering the system, reducing the surface area for bugs. Computed getters eliminate data synchronization issues by calculating values on demand rather than storing derived state. This pattern is foundational in Flutter's change notification system where computed properties trigger UI updates.

**Common Pitfalls**: Setters called like assignment (`obj.field = value`), not like methods. Private fields need getters for external access. Computed getters recalculate each access.

### Example 16: Enums - Type-Safe Constants

Enums define fixed sets of named constant values for type safety.

```dart
// Basic enum
enum ZakatType {                        // => Enum declaration
                                        // => Creates new type with fixed constants
  wealth,                               // => Enum value (constant)
                                        // => Index 0
  agriculture,                          // => Each value has index (0, 1, 2...)
                                        // => Index 1
  gold,                                 // => Index 2
  livestock,                            // => Index 3
}                                       // => Enum ends
                                        // => Creates 4 constant values

// Enum with enhanced features (Dart 2.17+)
enum DonorTier {                        // => Enhanced enum
                                        // => Can have fields, methods, constructors
  bronze(0, 5000000),                   // => Constructor call
                                        // => Creates bronze with minAmount=0, maxAmount=5M
  silver(5000000, 10000000),            // => Each value has associated data
                                        // => Creates silver with minAmount=5M, maxAmount=10M
  gold(10000000, 50000000),             // => Creates gold with minAmount=10M, maxAmount=50M
  platinum(50000000, double.infinity);  // => infinity for upper bound
                                        // => Creates platinum with minAmount=50M, maxAmount=∞

  const DonorTier(this.minAmount, this.maxAmount);
                                        // => Const constructor
                                        // => Associates data with each value
                                        // => this.minAmount assigns parameter to field

  final double minAmount;               // => Field for minimum amount
                                        // => final means can't be changed after creation
  final double maxAmount;               // => Field for maximum amount
                                        // => Each enum value has these fields

  // Method on enum
  bool inRange(double amount) {         // => Instance method
                                        // => Can be called on any DonorTier value
    return amount >= minAmount && amount < maxAmount;
                                        // => Check if amount fits tier
                                        // => Returns true if amount in range
  }                                     // => End of inRange method

  // Static method
  static DonorTier fromAmount(double amount) {
                                        // => Static method (class-level)
                                        // => Called on enum type, not instance
    for (var tier in DonorTier.values) {  // => Iterate all enum values
                                          // => DonorTier.values = [bronze, silver, gold, platinum]
      if (tier.inRange(amount)) {       // => Check each tier
                                        // => Call inRange method on current tier
        return tier;                    // => Return matching tier
                                        // => Exit function early if match found
      }                                 // => End if
    }                                   // => End for loop
    return DonorTier.platinum;          // => Default if none match
                                        // => Fallback for amounts > all tiers
  }                                     // => End of fromAmount method
}                                       // => End of DonorTier enum

void main() {
  // Use enum values
  ZakatType currentType = ZakatType.wealth;
                                        // => Assign enum value
                                        // => currentType stores ZakatType.wealth
                                        // => Type-safe constant (can't assign invalid value)

  print('Zakat type: $currentType');    // => Output: Zakat type: ZakatType.wealth
                                        // => toString() includes enum name
  print('Name: ${currentType.name}');   // => Output: Name: wealth
                                        // => .name property returns string without enum type
  print('Index: ${currentType.index}'); // => Output: Index: 0
                                        // => .index property returns position in enum

  // Switch on enum
  double rate;                          // => Variable for rate
                                        // => Uninitialized, assigned in switch (type: double)
  switch (currentType) {                // => Switch on enum value
                                        // => Match currentType (ZakatType.wealth)
    case ZakatType.wealth:              // => Match wealth value
                                        // => This case matches (wealth == wealth)
      rate = 0.025;                     // => 2.5%
                                        // => rate stores 0.025
      break;                            // => Exit switch
    case ZakatType.agriculture:         // => Not matched, skipped
      rate = 0.10;                      // => 10%
                                        // => Not executed
      break;                            // => Exit point if matched
    case ZakatType.gold:                // => Not matched, skipped
      rate = 0.025;                     // => Not executed
      break;                            // => Exit point if matched
    case ZakatType.livestock:           // => Not matched, skipped
      rate = 0.025;                     // => Not executed
      break;                            // => Exit point if matched
  }                                     // => Switch ends
                                        // => rate is now 0.025

  print('Rate: ${rate * 100}%');        // => Output: Rate: 2.5%
                                        // => 0.025 * 100 = 2.5

  // Access all enum values
  print('All Zakat types:');            // => Header
                                        // => Output: All Zakat types:
  for (ZakatType type in ZakatType.values) {
                                        // => values contains all enum constants
                                        // => ZakatType.values = [wealth, agriculture, gold, livestock]
                                        // => Iterate each value
    print('- ${type.name}');            // => Output name
                                        // => Iteration 1: - wealth
                                        // => Iteration 2: - agriculture
  }                                     // => 4 iterations total
                                        // => Loop completes after all values

  // Enhanced enum with data
  DonorTier tier = DonorTier.gold;      // => Assign enhanced enum value
                                        // => tier stores DonorTier.gold (with fields 10M-50M)

  print('Tier: ${tier.name}');          // => Output: Tier: gold
                                        // => .name returns 'gold' string
  print('Min: Rp${tier.minAmount}');    // => Output: Min: Rp10000000.0
                                        // => Access minAmount field from gold enum
  print('Max: Rp${tier.maxAmount}');    // => Output: Max: Rp50000000.0
                                        // => Access maxAmount field from gold enum

  // Call enum method
  double amount = 15000000.0;           // => Test amount: 15M
                                        // => amount stores 15000000.0 (type: double)
  bool fits = tier.inRange(amount);     // => Check if amount in gold tier
                                        // => Calls inRange method on gold enum
                                        // => 15M >= 10M && 15M < 50M = true
                                        // => fits stores true (10M-50M)
  print('$amount in ${tier.name}: $fits');
                                        // => Output: 15000000.0 in gold: true
                                        // => String interpolation with multiple values

  // Use static method
  DonorTier auto = DonorTier.fromAmount(7500000.0);
                                        // => Find tier for 7.5M
                                        // => Calls static method on DonorTier type
                                        // => Loops through tiers, checks inRange
                                        // => silver.inRange(7500000.0) returns true
                                        // => auto stores DonorTier.silver
  print('7.5M tier: ${auto.name}');     // => Output: 7.5M tier: silver
                                        // => .name returns 'silver' string

  // Iterate enhanced enum
  print('All tiers:');                  // => Header
                                        // => Output: All tiers:
  for (var t in DonorTier.values) {     // => Iterate all tiers
                                        // => DonorTier.values = [bronze, silver, gold, platinum]
                                        // => var infers type DonorTier
    print('${t.name}: Rp${t.minAmount} - Rp${t.maxAmount}');
                                        // => Output tier range
                                        // => Iteration 1: bronze: Rp0.0 - Rp5000000.0
                                        // => Iteration 2: silver: Rp5000000.0 - Rp10000000.0
  }                                     // => 4 iterations total
                                        // => Loop completes after all tiers

  // Enum comparison
  bool isSameTier = tier == DonorTier.gold;
                                        // => Enum equality
                                        // => tier is DonorTier.gold
                                        // => DonorTier.gold == DonorTier.gold is true
                                        // => isSameTier stores true
  print('Is gold tier: $isSameTier');   // => Output: Is gold tier: true
                                        // => String interpolation with bool value

  // Enum in collections
  Map<DonorTier, int> tierCounts = {    // => Map with enum keys
                                        // => Key type: DonorTier, Value type: int
    DonorTier.bronze: 50,               // => bronze tier has 50 donors
    DonorTier.silver: 30,               // => silver tier has 30 donors
    DonorTier.gold: 15,                 // => gold tier has 15 donors
    DonorTier.platinum: 5,              // => platinum tier has 5 donors
  };                                    // => Map literal creates Map<DonorTier, int>

  int goldCount = tierCounts[DonorTier.gold] ?? 0;
                                        // => Lookup by enum key
                                        // => tierCounts[DonorTier.gold] returns 15
                                        // => ?? 0 provides default if null (not needed here)
                                        // => goldCount stores 15
  print('Gold donors: $goldCount');     // => Output: Gold donors: 15
                                        // => String interpolation with int value
}                                       // => End of main function
```

**Key Takeaway**: Enums provide type-safe constants. Access via `EnumName.value`. Enhanced enums can have fields, methods, and constructors. Use `.values` for all enum constants. `.name` and `.index` provide metadata.

**Expected Output**:

```
Zakat type: ZakatType.wealth
Name: wealth
Index: 0
Rate: 2.5%
All Zakat types:
- wealth
- agriculture
- gold
- livestock
Tier: gold
Min: Rp10000000.0
Max: Rp50000000.0
15000000.0 in gold: true
7.5M tier: silver
All tiers:
bronze: Rp0.0 - Rp5000000.0
silver: Rp5000000.0 - Rp10000000.0
gold: Rp10000000.0 - Rp50000000.0
platinum: Rp50000000.0 - RpInfinity
Is gold tier: true
Gold donors: 15
```

**Why It Matters**: Enums replace magic strings and integers with type-safe named constants, eliminating an entire category of bugs from typos and invalid values. In production systems, Zakat types, payment methods, transaction statuses, and user roles are natural enum candidates. Enhanced enums bundle related behavior with constants (e.g., `ZakatType.wealth.rate` instead of a separate lookup), enabling more expressive and maintainable domain models in Flutter applications.

**Common Pitfalls**: Enum values accessed with dot notation. Enhanced enums require const constructor. Enum values are compile-time constants.

### Example 17: Collections - Sets

Sets store unique unordered elements with efficient membership checking.

```dart
void main() {
  // Create set literal
  Set<String> donors = {'Ahmad', 'Fatimah', 'Ali'};
                                        // => Set with 3 unique elements
                                        // => Type: Set<String>

  // Add elements
  donors.add('Zainab');                 // => Add element
                                        // => donors now has 4 elements

  bool added = donors.add('Ahmad');     // => Try to add duplicate
                                        // => added stores false (already exists)
                                        // => Set unchanged (no duplicates)

  print('Donors: $donors');             // => Output: Donors: {Ahmad, Fatimah, Ali, Zainab}
  print('Ahmad added again: $added');   // => Output: Ahmad added again: false

  // Check membership (O(1) average)
  bool hasAli = donors.contains('Ali');  // => hasAli stores true
                                         // => Efficient membership check

  print('Has Ali: $hasAli');            // => Output: Has Ali: true

  // Remove elements
  bool removed = donors.remove('Fatimah');  // => Remove element
                                            // => removed stores true (found)
                                            // => donors now has 3 elements

  print('After removal: $donors');      // => Output may show different order

  // Set size
  int count = donors.length;            // => count stores 3
  print('Donor count: $count');         // => Output: Donor count: 3

  // Set operations
  Set<String> group1 = {'Ahmad', 'Fatimah', 'Ali'};
  Set<String> group2 = {'Ali', 'Zainab', 'Hassan'};

  // Union (all unique elements from both)
  Set<String> union = group1.union(group2);
                                        // => Combine both sets
                                        // => union: {Ahmad, Fatimah, Ali, Zainab, Hassan}
  print('Union: $union');               // => 5 unique elements

  // Intersection (elements in both)
  Set<String> intersection = group1.intersection(group2);
                                        // => Only common elements
                                        // => intersection: {Ali}
  print('Intersection: $intersection'); // => Output: Intersection: {Ali}

  // Difference (in first but not second)
  Set<String> difference = group1.difference(group2);
                                        // => Elements only in group1
                                        // => difference: {Ahmad, Fatimah}
  print('Difference: $difference');     // => Output: Difference: {Ahmad, Fatimah}

  // Check subset
  Set<String> subset = {'Ahmad', 'Ali'};
  bool isSubset = subset.difference(group1).isEmpty;
                                        // => Check if all elements in group1
                                        // => isSubset stores true
  print('Is subset: $isSubset');        // => Output: Is subset: true

  // Convert list to set (removes duplicates)
  List<int> amounts = [500000, 1000000, 500000, 750000, 1000000];
                                        // => List with duplicates
  Set<int> uniqueAmounts = amounts.toSet();
                                        // => Convert to set
                                        // => uniqueAmounts: {500000, 1000000, 750000}
  print('Unique amounts: $uniqueAmounts');
                                        // => Output: Unique amounts: {500000, 1000000, 750000}

  // Iterate set
  print('All unique amounts:');         // => Header
  for (int amount in uniqueAmounts) {   // => Iterate set (order not guaranteed)
    print('- Rp$amount');               // => Output each amount
  }                                     // => 3 iterations

  // Set from constructor
  Set<String> emptySet = <String>{};    // => Empty set
  Set<String> fromList = Set<String>.from(['A', 'B', 'A']);
                                        // => Create from list
                                        // => fromList: {A, B}

  print('From list: $fromList');        // => Output: From list: {A, B}

  // Check emptiness
  bool isEmpty = emptySet.isEmpty;      // => isEmpty stores true
  print('Empty set: $isEmpty');         // => Output: Empty set: true
}
```

**Key Takeaway**: Sets store unique elements in unordered collection. Use `{}` literal or `Set()` constructor. Membership checking is O(1) average. Set operations: `union`, `intersection`, `difference`. No duplicates allowed.

**Expected Output** (order may vary):

```
Donors: {Ahmad, Fatimah, Ali, Zainab}
Ahmad added again: false
Has Ali: true
After removal: {Ahmad, Ali, Zainab}
Donor count: 3
Union: {Ahmad, Fatimah, Ali, Zainab, Hassan}
Intersection: {Ali}
Difference: {Ahmad, Fatimah}
Is subset: true
Unique amounts: {500000, 1000000, 750000}
All unique amounts:
- Rp500000
- Rp1000000
- Rp750000
From list: {A, B}
Empty set: true
```

**Why It Matters**: Sets provide O(1) membership checking, making them ideal for deduplication and existence checks in production systems. Donor deduplication, transaction reference tracking, and permission sets all benefit from Set semantics. In performance-critical code, using Set instead of List for `contains` operations reduces O(n) linear searches to O(1) hash lookups—critical when processing thousands of records. Flutter's routing system uses sets to track visited routes.

**Common Pitfalls**: Sets are unordered - iteration order may vary. Empty set needs type: `<Type>{}` or `Set<Type>()`. Adding duplicate returns false but doesn't error.

### Example 18: Exception Handling Basics

Try-catch blocks handle runtime errors gracefully.

```dart
// Custom exception class
class InsufficientFundsException implements Exception {
                                        // => Custom exception type
                                        // => implements Exception interface
  final String message;                 // => Error message field
                                        // => final ensures immutability
  InsufficientFundsException(this.message);
                                        // => Constructor initializes message
                                        // => Shorthand this.message syntax

  @override
  String toString() => 'InsufficientFundsException: $message';
                                        // => Override toString for display
                                        // => Called when exception printed
}                                       // => Custom exception defined

double calculateZakat(double wealth) {  // => Function that may throw exceptions
                                        // => Returns double if successful
  if (wealth < 0) {                     // => Validate input is non-negative
                                        // => Business rule enforcement
    throw ArgumentError('Wealth cannot be negative');
                                        // => Throw standard library exception
                                        // => Program execution stops here if negative
  }

  const double nisab = 85000000.0;      // => Threshold (minimum wealth for Zakat)
                                        // => compile-time constant

  if (wealth < nisab) {                 // => Check eligibility against threshold
                                        // => Zakat only applies above nisab
    throw InsufficientFundsException('Wealth below nisab threshold');
                                        // => Throw custom exception
                                        // => Different exception type than ArgumentError
  }

  return wealth * 0.025;                // => Calculate 2.5% Zakat
                                        // => Only reached if all validations passed
}                                       // => Function completes successfully

void main() {
  // Basic try-catch
  // => Exception handling prevents program crashes
  try {                                 // => Try block - may throw
                                        // => Code that might fail goes here
    double zakat = calculateZakat(100000000.0);
                                        // => Call function that may throw
                                        // => 100M > nisab, calculation succeeds
                                        // => zakat stores 2500000.0
    print('Zakat: Rp$zakat');           // => Output: Zakat: Rp2500000.0
                                        // => Only executes if no exception thrown
  } catch (e) {                         // => Catch any exception
                                        // => e is exception object
    print('Error: $e');                 // => Handle error gracefully
                                        // => Not executed in this case (no exception)
  }                                     // => Continue execution
                                        // => Program doesn't crash even if exception occurs

  // Catch specific exception type
  // => on keyword catches specific exception types
  try {
    double zakat = calculateZakat(50000000.0);
                                        // => 50M < 85M nisab (below threshold)
                                        // => Throws InsufficientFundsException
  } on InsufficientFundsException catch (e) {
                                        // => Catch specific type (most specific first)
                                        // => e has type InsufficientFundsException
    print('Caught specific: $e');       // => Output: Caught specific: InsufficientFundsException: Wealth below nisab threshold
                                        // => Handles this specific exception
  } catch (e) {                         // => Catch other types (catch-all)
    print('Caught generic: $e');        // => Not executed (exception already caught above)
  }

  // Multiple catch blocks
  try {
    double zakat = calculateZakat(-1000.0);
                                        // => Negative wealth
                                        // => Throws ArgumentError
  } on InsufficientFundsException catch (e) {
    print('Insufficient funds: $e');    // => Not this one
  } on ArgumentError catch (e) {        // => This catches ArgumentError
    print('Invalid argument: $e');      // => Output: Invalid argument: Invalid argument(s): Wealth cannot be negative
  } catch (e) {
    print('Unknown error: $e');         // => Fallback
  }

  // Finally block (always executes)
  // => finally runs regardless of success or exception
  bool transactionStarted = false;      // => Track transaction state

  try {
    transactionStarted = true;          // => Mark transaction start
    print('Starting transaction...');   // => Output: Starting transaction...

    double zakat = calculateZakat(75000000.0);
                                        // => 75M < 85M nisab (below threshold)
                                        // => Throws exception

    print('Transaction completed');     // => Not executed (exception thrown above)
  } catch (e) {
    print('Transaction failed: $e');    // => Handle error
                                        // => Output: Transaction failed: InsufficientFundsException...
  } finally {                           // => Always executes
                                        // => Runs even if exception caught
                                        // => Used for cleanup (close files, release locks)
    if (transactionStarted) {           // => Check if cleanup needed
      print('Cleaning up transaction');
                                        // => Output: Cleaning up transaction
                                        // => Ensures resources released
    }
  }                                     // => Continue execution
                                        // => finally guarantees cleanup happens

  // Rethrow exception
  void processPayment(double amount) {  // => Function that rethrows
    try {
      if (amount <= 0) {                // => Validate
        throw ArgumentError('Invalid amount');
      }
      print('Processing: Rp$amount');
    } catch (e) {
      print('Logging error: $e');       // => Log error
      rethrow;                          // => Rethrow to caller
    }
  }

  try {
    processPayment(-500.0);             // => Invalid amount
                                        // => Throws, logs, and rethrows
  } catch (e) {
    print('Caller caught: $e');         // => Caller handles rethrown error
                                        // => Output: Caller caught: Invalid argument(s): Invalid amount
  }

  // Assert (debug-only checks)
  double wealth = 100000000.0;          // => Test value
  assert(wealth >= 0, 'Wealth must be positive');
                                        // => Assertion (only in debug mode)
                                        // => Throws if condition false

  print('Assertion passed');            // => Output if assertion passes
}
```

**Key Takeaway**: Use try-catch to handle exceptions. Catch specific types with `on Type catch (e)`. Finally block always executes. Use `rethrow` to propagate exceptions. Custom exceptions implement `Exception`.

**Expected Output**:

```
Zakat: Rp2500000.0
Caught specific: InsufficientFundsException: Wealth below nisab threshold
Invalid argument: Invalid argument(s): Wealth cannot be negative
Starting transaction...
Transaction failed: InsufficientFundsException: Wealth below nisab threshold
Cleaning up transaction
Logging error: Invalid argument(s): Invalid amount
Caller caught: Invalid argument(s): Invalid amount
Assertion passed
```

**Why It Matters**: Robust exception handling is non-negotiable for production reliability. Unhandled exceptions crash Flutter apps and corrupt server state. Specific exception handling enables appropriate recovery (retry network errors, notify users of validation failures, log unexpected errors) rather than generic failure. Finally blocks prevent resource leaks in file operations, database connections, and stream subscriptions. Well-structured error handling is particularly critical for financial applications where partial failures can corrupt records.

**Common Pitfalls**: Order matters - specific catches before generic. Finally executes even with return in try/catch. Assertions only active in debug mode.

### Example 19: String Advanced - Pattern Matching

Advanced string operations including regular expressions and pattern matching.

```dart
void main() {
  // String splitting
  String donorList = 'Ahmad,Fatimah,Ali,Zainab';
                                        // => Comma-separated values

  List<String> names = donorList.split(',');
                                        // => Split into list
                                        // => names: ['Ahmad', 'Fatimah', 'Ali', 'Zainab']
  print('Names: $names');               // => Output: Names: [Ahmad, Fatimah, Ali, Zainab]

  // String joining
  String rejoined = names.join(' | ');  // => Join with separator
                                        // => rejoined: 'Ahmad | Fatimah | Ali | Zainab'
  print('Rejoined: $rejoined');         // => Output

  // String trimming
  String padded = '  Rp 500,000  ';     // => String with whitespace
  String trimmed = padded.trim();       // => Remove leading/trailing whitespace
                                        // => trimmed: 'Rp 500,000'
  print('Trimmed: "$trimmed"');         // => Output: Trimmed: "Rp 500,000"

  // Substring extraction
  String accountNumber = 'ACC-2025-001-ZAKAT';
                                        // => Account identifier

  String year = accountNumber.substring(4, 8);
                                        // => Extract from index 4 to 8 (exclusive)
                                        // => year: '2025'
  print('Year: $year');                 // => Output: Year: 2025

  // String replacement
  String template = 'Dear {name}, your Zakat of {amount} is confirmed.';
  String message = template
      .replaceAll('{name}', 'Ahmad')    // => Replace all occurrences
      .replaceAll('{amount}', 'Rp 2,500,000');
                                        // => Chain replacements
  print(message);                       // => Output: Dear Ahmad, your Zakat of Rp 2,500,000 is confirmed.

  // Check string properties
  String email = 'donor@example.com';   // => Email string

  bool startsCorrect = email.startsWith('donor');
                                        // => startsCorrect stores true
  bool endsCorrect = email.endsWith('.com');
                                        // => endsCorrect stores true
  bool containsAt = email.contains('@'); // => containsAt stores true

  print('Valid email format: ${startsCorrect && endsCorrect && containsAt}');
                                        // => Output: Valid email format: true

  // Regular expressions
  String phonePattern = r'^\+62\d{9,12}$';
                                        // => Raw string (r prefix)
                                        // => Pattern: +62 followed by 9-12 digits

  RegExp regex = RegExp(phonePattern);  // => Create regex object

  String validPhone = '+628123456789';  // => Test phone number
  String invalidPhone = '+6281234';     // => Too short

  bool validMatches = regex.hasMatch(validPhone);
                                        // => validMatches stores true
  bool invalidMatches = regex.hasMatch(invalidPhone);
                                        // => invalidMatches stores false

  print('$validPhone valid: $validMatches');
                                        // => Output: +628123456789 valid: true
  print('$invalidPhone valid: $invalidMatches');
                                        // => Output: +6281234 valid: false

  // Extract pattern matches
  String transactionLog = 'TXN-001: Rp 500,000 | TXN-002: Rp 1,000,000 | TXN-003: Rp 750,000';

  RegExp amountPattern = RegExp(r'Rp ([\d,]+)');
                                        // => Pattern to match Rp amounts
                                        // => Capture group in parentheses

  Iterable<Match> matches = amountPattern.allMatches(transactionLog);
                                        // => Find all matches
                                        // => matches contains 3 Match objects

  print('Found ${matches.length} amounts:');
                                        // => Output: Found 3 amounts:

  for (Match match in matches) {        // => Iterate matches
    String amount = match.group(1)!;    // => Extract capture group 1
                                        // => ! asserts non-null
    print('- $amount');                 // => Output amount
  }                                     // => 3 iterations

  // String to number parsing
  String numStr = '2500000';            // => String representation
  int? parsed = int.tryParse(numStr);   // => Parse to int
                                        // => parsed stores 2500000

  String invalidNum = 'abc';
  int? invalid = int.tryParse(invalidNum);
                                        // => invalid stores null (parse failed)

  print('Parsed: $parsed');             // => Output: Parsed: 2500000
  print('Invalid: $invalid');           // => Output: Invalid: null

  // String case conversion
  String mixed = 'Zakat Al-Mal';        // => Mixed case
  print('Upper: ${mixed.toUpperCase()}');
                                        // => Output: Upper: ZAKAT AL-MAL
  print('Lower: ${mixed.toLowerCase()}');
                                        // => Output: Lower: zakat al-mal

  // String padding
  String code = '42';                   // => Short string
  String padLeft = code.padLeft(5, '0');
                                        // => Pad left to length 5
                                        // => padLeft: '00042'
  String padRight = code.padRight(5, '-');
                                        // => Pad right to length 5
                                        // => padRight: '42---'

  print('Pad left: $padLeft');          // => Output: Pad left: 00042
  print('Pad right: $padRight');        // => Output: Pad right: 42---
}
```

**Key Takeaway**: Use `split`/`join` for list conversion. `trim`, `substring`, `replaceAll` for manipulation. `startsWith`, `endsWith`, `contains` for checking. Regular expressions with `RegExp` for pattern matching.

**Expected Output**:

```
Names: [Ahmad, Fatimah, Ali, Zainab]
Rejoined: Ahmad | Fatimah | Ali | Zainab
Trimmed: "Rp 500,000"
Year: 2025
Dear Ahmad, your Zakat of Rp 2,500,000 is confirmed.
Valid email format: true
+628123456789 valid: true
+6281234 valid: false
Found 3 amounts:
- 500,000
- 1,000,000
- 750,000
Parsed: 2500000
Invalid: null
Upper: ZAKAT AL-MAL
Lower: zakat al-mal
Pad left: 00042
Pad right: 42---
```

**Why It Matters**: String processing is ubiquitous in production—parsing user input, formatting display values, validating data, and processing API responses all require robust string manipulation. Arabic text handling (common in Islamic finance applications) requires Unicode awareness that Dart's string methods provide. Regular expressions enable complex validation patterns for financial identifiers, phone numbers, and account numbers. `tryParse` over `parse` prevents crashes from malformed input.

**Common Pitfalls**: `substring` end index is exclusive. Regular expression raw strings use `r` prefix. `tryParse` returns null on failure (not exception).

### Example 20: Type Conversion and Casting

Converting between types and checking runtime types.

```dart
void main() {
  // Number conversions
  int wholeAmount = 2500000;            // => Integer value
  double decimalAmount = wholeAmount.toDouble();
                                        // => Convert int to double
                                        // => decimalAmount: 2500000.0

  print('Decimal: $decimalAmount');     // => Output: Decimal: 2500000.0

  double precise = 2750500.75;          // => Double value
  int rounded = precise.round();        // => Round to nearest int
                                        // => rounded: 2750501
  int truncated = precise.truncate();   // => Truncate decimal
                                        // => truncated: 2750500
  int floor = precise.floor();          // => Round down
                                        // => floor: 2750500
  int ceil = precise.ceil();            // => Round up
                                        // => ceil: 2750501

  print('Rounded: $rounded');           // => Output: Rounded: 2750501
  print('Truncated: $truncated');       // => Output: Truncated: 2750500
  print('Floor: $floor');               // => Output: Floor: 2750500
  print('Ceil: $ceil');                 // => Output: Ceil: 2750501

  // String conversions
  int amount = 500000;                  // => Integer
  String strAmount = amount.toString(); // => Convert to string
                                        // => strAmount: '500000'

  double rate = 0.025;                  // => Double
  String strRate = rate.toStringAsFixed(4);
                                        // => Format with 4 decimal places
                                        // => strRate: '0.0250'

  print('String amount: $strAmount');   // => Output: String amount: 500000
  print('String rate: $strRate');       // => Output: String rate: 0.0250

  // Parse from string
  String numStr = '1000000';            // => String number
  int parsed = int.parse(numStr);       // => Parse to int (throws on failure)
                                        // => parsed: 1000000

  String floatStr = '2.5';              // => String float
  double parsedFloat = double.parse(floatStr);
                                        // => parsedFloat: 2.5

  // Safe parsing with tryParse
  String invalid = 'not-a-number';      // => Invalid string
  int? safeParsed = int.tryParse(invalid);
                                        // => Returns null on failure
                                        // => safeParsed: null

  print('Safe parsed: $safeParsed');    // => Output: Safe parsed: null

  // Type checking with is
  Object value = 'Ahmad';               // => Object type (any type)

  if (value is String) {                // => Runtime type check
    print('Value is String: $value');   // => Output: Value is String: Ahmad
                                        // => value automatically cast to String in this block
    int length = value.length;          // => Access String methods
    print('Length: $length');           // => Output: Length: 5
  }

  Object numValue = 42;                 // => Object holding int

  if (numValue is! String) {            // => Negative type check
    print('Not a String');              // => Output: Not a String
  }

  // Explicit casting with as
  Object donation = 2500000;            // => Object type
  int castedDonation = donation as int;
                                        // => Explicit cast to int
                                        // => Throws if wrong type
                                        // => castedDonation: 2500000

  print('Casted: $castedDonation');     // => Output: Casted: 2500000

  // Casting in collections
  List<Object> mixed = [1, 'two', 3.0, 'four'];
                                        // => List of mixed types

  List<String> strings = mixed.whereType<String>().toList();
                                        // => Filter by type
                                        // => strings: ['two', 'four']

  List<int> ints = mixed.whereType<int>().toList();
                                        // => ints: [1]

  print('Strings: $strings');           // => Output: Strings: [two, four]
  print('Ints: $ints');                 // => Output: Ints: [1]

  // Runtime type information
  String name = 'Ahmad';                // => String variable
  Type type = name.runtimeType;         // => Get runtime type
                                        // => type: String

  print('Runtime type: $type');         // => Output: Runtime type: String

  // Collection conversions
  List<int> amounts = [500000, 1000000, 750000];
                                        // => List of ints

  Set<int> uniqueAmounts = amounts.toSet();
                                        // => Convert to Set

  List<int> backToList = uniqueAmounts.toList();
                                        // => Convert back to List

  print('As Set: $uniqueAmounts');      // => Output: As Set: {500000, 1000000, 750000}
  print('Back to List: $backToList');   // => Output: Back to List: [500000, 1000000, 750000]

  // Map value conversions
  Map<String, Object> data = {          // => Map with Object values
    'name': 'Ahmad',
    'amount': 500000,
    'paid': true,
  };

  String donorName = data['name'] as String;
                                        // => Cast Object to String
  int donorAmount = data['amount'] as int;
                                        // => Cast to int
  bool isPaid = data['paid'] as bool;   // => Cast to bool

  print('Donor: $donorName, Amount: $donorAmount, Paid: $isPaid');
                                        // => Output: Donor: Ahmad, Amount: 500000, Paid: true
}
```

**Key Takeaway**: Convert numbers with `toInt`, `toDouble`, `round`, `truncate`. Parse strings with `int.parse` (throws) or `tryParse` (null on failure). Type check with `is`, cast with `as`. Use `whereType` to filter collections by type.

**Expected Output**:

```
Decimal: 2500000.0
Rounded: 2750501
Truncated: 2750500
Floor: 2750500
Ceil: 2750501
String amount: 500000
String rate: 0.0250
Safe parsed: null
Value is String: Ahmad
Length: 5
Not a String
Casted: 2500000
Strings: [two, four]
Ints: [1]
Runtime type: String
As Set: {500000, 1000000, 750000}
Back to List: [500000, 1000000, 750000]
Donor: Ahmad, Amount: 500000, Paid: true
```

**Why It Matters**: Type conversion is essential when working with external data—JSON payloads, database results, and user inputs often arrive as strings that need conversion to typed values. Safe type checking with `is` before casting prevents `ClassCastException` crashes in production. Dart's type promotion feature reduces boilerplate compared to explicit casting. In Flutter, dynamic widget data often requires runtime type checking when building heterogeneous lists.

**Common Pitfalls**: `parse` throws on invalid string, use `tryParse` for safety. `as` throws if type wrong, check with `is` first. Type promotions happen automatically in `is` checks.

## Examples 21-25: Advanced Basics

### Example 21: Collection Iteration Methods

Advanced iteration methods for transforming and filtering collections.

```dart
void main() {
  List<double> donations = [500000.0, 1000000.0, 750000.0, 2500000.0, 1250000.0];
                                        // => List of donation amounts

  // forEach - execute function for each element
  print('All donations:');              // => Header
  donations.forEach((double amount) {   // => forEach with callback
                                        // => Iterates each element sequentially
    print('- Rp$amount');               // => Execute for each element
  });                                   // => 5 iterations total

  // map - transform each element
  List<String> formatted = donations.map((double amount) {
                                        // => Transform function
                                        // => Returns new value for each element
    return 'Rp ${amount.toStringAsFixed(2)}';
                                        // => Format each amount as currency string
                                        // => toStringAsFixed(2) provides 2 decimal places
  }).toList();                          // => Convert Iterable to List
                                        // => formatted: ['Rp 500000.00', ...]

  print('Formatted: $formatted');       // => Output formatted list

  // where - filter elements
  List<double> large = donations.where((double amount) {
                                        // => Filter function: returns bool
                                        // => true = keep, false = exclude
    return amount >= 1000000.0;         // => Keep if >= 1M
                                        // => 3 of 5 donations qualify
  }).toList();                          // => large: [1000000.0, 2500000.0, 1250000.0]

  print('Large donations: $large');     // => Output: Large donations: [1000000.0, 2500000.0, 1250000.0]

  // any - check if any element matches
  bool hasLarge = donations.any((double amount) {
                                        // => Check if any match
                                        // => Short-circuits on first match found
    return amount >= 2000000.0;         // => Condition: >= 2M
  });                                   // => hasLarge: true (2500000.0 matches)

  print('Has large (>= 2M): $hasLarge');
                                        // => Output: Has large (>= 2M): true

  // every - check if all elements match
  bool allPositive = donations.every((double amount) {
                                        // => Check if all match
                                        // => Short-circuits on first non-match
    return amount > 0;                  // => Condition: all positive
  });                                   // => allPositive: true (all positive)

  print('All positive: $allPositive');  // => Output: All positive: true

  // reduce - combine elements into single value
  double total = donations.reduce((double sum, double amount) {
                                        // => Accumulator function
                                        // => sum: running total, amount: current element
    return sum + amount;                // => Add current to accumulator
                                        // => Combines all 5 elements into one value
  });                                   // => total: 6000000.0

  print('Total (reduce): Rp$total');    // => Output: Total (reduce): Rp6000000.0

  // fold - reduce with initial value
  double totalFold = donations.fold<double>(0.0, (double sum, double amount) {
                                        // => Initial value: 0.0
                                        // => Accumulator: sum, Current: amount
    return sum + amount;                // => Combine
  });                                   // => totalFold: 6000000.0

  print('Total (fold): Rp$totalFold');  // => Output: Total (fold): Rp6000000.0

  // expand - expand each element to multiple
  List<List<int>> groups = [
    [100000, 200000],
    [300000, 400000],
    [500000],
  ];                                    // => Nested lists

  List<int> flattened = groups.expand((List<int> group) {
                                        // => Expand function
    return group;                       // => Return inner list
  }).toList();                          // => Flatten to single list
                                        // => flattened: [100000, 200000, 300000, 400000, 500000]

  print('Flattened: $flattened');       // => Output: Flattened: [100000, 200000, 300000, 400000, 500000]

  // skip and take
  List<double> skipFirst = donations.skip(2).toList();
                                        // => Skip first 2 elements
                                        // => skipFirst: [750000.0, 2500000.0, 1250000.0]

  List<double> takeFirst = donations.take(3).toList();
                                        // => Take first 3 elements
                                        // => takeFirst: [500000.0, 1000000.0, 750000.0]

  print('Skip 2: $skipFirst');          // => Output
  print('Take 3: $takeFirst');          // => Output

  // firstWhere and lastWhere
  double firstLarge = donations.firstWhere(
    (double amount) => amount >= 1000000.0,
                                        // => Find first matching
    orElse: () => 0.0,                  // => Default if not found
  );                                    // => firstLarge: 1000000.0

  double lastLarge = donations.lastWhere(
    (double amount) => amount >= 1000000.0,
  );                                    // => Find last matching
                                        // => lastLarge: 1250000.0

  print('First large: Rp$firstLarge');  // => Output: First large: Rp1000000.0
  print('Last large: Rp$lastLarge');    // => Output: Last large: Rp1250000.0

  // singleWhere - finds single matching element
  try {
    double exact = donations.singleWhere(
      (double amount) => amount == 2500000.0,
    );                                  // => Find single match
                                        // => exact: 2500000.0
    print('Single exact: Rp$exact');    // => Output: Single exact: Rp2500000.0
  } catch (e) {
    print('Multiple or no matches');
  }

  // Method chaining
  double avgLarge = donations
      .where((amount) => amount >= 1000000.0)
                                        // => Filter >= 1M
      .map((amount) => amount)          // => Identity transform
      .fold(0.0, (sum, amount) => sum + amount) / 3;
                                        // => Sum and divide by count
                                        // => avgLarge: 1583333.33...

  print('Average large: Rp${avgLarge.toStringAsFixed(2)}');
                                        // => Output: Average large: Rp1583333.33
}
```

**Key Takeaway**: Use `map` to transform, `where` to filter, `reduce`/`fold` to aggregate. `any`/`every` check conditions. `expand` flattens nested collections. `skip`/`take` slice collections. Chain methods for complex operations.

**Expected Output**:

```
All donations:
- Rp500000.0
- Rp1000000.0
- Rp750000.0
- Rp2500000.0
- Rp1250000.0
Formatted: [Rp 500000.00, Rp 1000000.00, Rp 750000.00, Rp 2500000.00, Rp 1250000.00]
Large donations: [1000000.0, 2500000.0, 1250000.0]
Has large (>= 2M): true
All positive: true
Total (reduce): Rp6000000.0
Total (fold): Rp6000000.0
Flattened: [100000, 200000, 300000, 400000, 500000]
Skip 2: [750000.0, 2500000.0, 1250000.0]
Take 3: [500000.0, 1000000.0, 750000.0]
First large: Rp1000000.0
Last large: Rp1250000.0
Single exact: Rp2500000.0
Average large: Rp1583333.33
```

**Why It Matters**: Functional collection operations enable concise data processing pipelines for report generation, transaction filtering, and aggregation in production applications. Replacing imperative loops with `map/where/fold` improves code readability and reduces mutation bugs. Flutter's widget lists extensively use these operations to transform data models into widget trees. Understanding lazy evaluation prevents performance issues when chaining multiple transformations on large collections.

**Common Pitfalls**: `map`, `where` return Iterables - call `toList()` for List. `reduce` requires non-empty collection. `singleWhere` throws if multiple matches.

(continuing with remaining 4 examples in next message due to length)

### Example 22: DateTime Basics

Working with dates and times for timestamps and scheduling.

```dart
void main() {
  // Create DateTime instances
  DateTime now = DateTime.now();        // => Current date and time
                                        // => Includes year, month, day, hour, minute, second, millisecond

  DateTime zakatDue = DateTime(2025, 9, 15);  // => Specific date: Sept 15, 2025
                                               // => Time defaults to midnight

  DateTime ramadanStart = DateTime(2025, 3, 1, 6, 30);
                                        // => Date with time: 6:30 AM
                                        // => Parameters: year, month, day, hour, minute

  print('Now: $now');                   // => Output: 2025-01-29 [current time]
  print('Zakat due: $zakatDue');        // => Output: 2025-09-15 00:00:00.000

  // Access components
  int year = zakatDue.year;             // => year: 2025
  int month = zakatDue.month;           // => month: 9 (September)
  int day = zakatDue.day;               // => day: 15
  int weekday = zakatDue.weekday;       // => weekday: 1-7 (Monday-Sunday)

  print('Year: $year, Month: $month, Day: $day');
                                        // => Output: Year: 2025, Month: 9, Day: 15

  // DateTime arithmetic
  DateTime tomorrow = now.add(Duration(days: 1));
                                        // => Add 1 day to current date
                                        // => tomorrow is 1 day ahead

  DateTime lastWeek = now.subtract(Duration(days: 7));
                                        // => Subtract 7 days
                                        // => lastWeek is 7 days ago

  // Duration between dates
  Duration difference = zakatDue.difference(now);
                                        // => Calculate time difference
                                        // => difference stores days/hours until Zakat due

  int daysUntil = difference.inDays;    // => Convert to days
  int hoursUntil = difference.inHours;  // => Convert to hours

  print('Days until Zakat due: $daysUntil');
                                        // => Output: Days until Zakat due: [calculated]

  // Compare dates
  bool isPast = now.isAfter(zakatDue);  // => Check if now is after zakatDue
                                        // => isPast: false (zakatDue is future)

  bool isFuture = now.isBefore(zakatDue);  // => Check if now is before
                                           // => isFuture: true

  bool isSame = now.isAtSameMomentAs(zakatDue);  // => Exact moment comparison
                                                  // => isSame: false

  print('Is Zakat due in future: $isFuture');
                                        // => Output: Is Zakat due in future: true

  // Parse from string
  String dateStr = '2025-12-25';        // => ISO 8601 format string
  DateTime parsed = DateTime.parse(dateStr);
                                        // => Parse string to DateTime
                                        // => parsed: 2025-12-25 00:00:00.000

  // Format to string
  String formatted = '${zakatDue.year}-${zakatDue.month.toString().padLeft(2, '0')}-${zakatDue.day.toString().padLeft(2, '0')}';
                                        // => Manual formatting
                                        // => formatted: '2025-09-15'

  print('Formatted: $formatted');       // => Output: Formatted: 2025-09-15

  // UTC vs local time
  DateTime utc = DateTime.now().toUtc();  // => Convert to UTC timezone
  DateTime local = utc.toLocal();       // => Convert back to local timezone

  print('UTC: $utc');                   // => Output: [current time in UTC]
  print('Local: $local');               // => Output: [current time in local TZ]
}
```

**Key Takeaway**: Create DateTime with `DateTime(year, month, day)` or `DateTime.now()`. Use `add`/`subtract` with Duration for arithmetic. Compare with `isAfter`/`isBefore`. Parse strings with `DateTime.parse()`.

**Expected Output** (varies by current date):

```
Now: 2025-01-29 12:34:56.789
Zakat due: 2025-09-15 00:00:00.000
Year: 2025, Month: 9, Day: 15
Days until Zakat due: 229
Is Zakat due in future: true
Formatted: 2025-09-15
UTC: 2025-01-29 04:34:56.789Z
Local: 2025-01-29 12:34:56.789
```

**Why It Matters**: Date handling is critical for financial applications where payment due dates, Zakat calculation periods, Hijri calendar conversions, and transaction timestamps drive business logic. Incorrect date arithmetic causes late payment alerts, wrong period calculations, and audit trail errors. Understanding UTC vs. local time prevents timezone bugs in multi-region Islamic finance platforms. Flutter applications need reliable date formatting for user interfaces.

**Common Pitfalls**: Months are 1-indexed (January = 1). DateTime is immutable - methods return new instances. Timezone conversions affect displayed time.

### Example 23: Classes - Static Members

Static fields and methods belong to the class itself, not instances.

```dart
class ZakatCalculator {                 // => Class with static members
  static const double wealthRate = 0.025;  // => Static constant
                                           // => Shared across all instances
                                           // => Accessed via ClassName.field

  static const double nisabThreshold = 85000000.0;
                                        // => Static field for nisab

  static int calculationsPerformed = 0;  // => Static mutable field
                                         // => Tracks global count

  // Instance fields
  String donorName;                     // => Instance-specific field
  double wealth;                        // => Each instance has own wealth

  ZakatCalculator(this.donorName, this.wealth);
                                        // => Constructor

  // Static method
  static double calculateZakat(double wealth) {
                                        // => Static method - no instance needed
    calculationsPerformed++;            // => Increment static counter
    return wealth * wealthRate;         // => Access static constant
  }                                     // => Return calculated value

  // Static factory method
  static ZakatCalculator createForWealth(String name, double wealth) {
                                        // => Factory method creates instance
    if (wealth < 0) {                   // => Validation
      throw ArgumentError('Wealth must be positive');
    }
    return ZakatCalculator(name, wealth);  // => Return new instance
  }

  // Instance method
  double getZakat() {                   // => Instance method
    calculationsPerformed++;            // => Can access static members
    return calculateZakat(wealth);      // => Call static method
  }                                     // => Return result

  bool isEligible() {                   // => Check eligibility
    return wealth >= nisabThreshold;    // => Compare to static threshold
  }
}

void main() {
  // Access static constant
  print('Zakat rate: ${ZakatCalculator.wealthRate * 100}%');
                                        // => Output: Zakat rate: 2.5%
                                        // => No instance needed

  print('Nisab: Rp${ZakatCalculator.nisabThreshold}');
                                        // => Output: Nisab: Rp85000000.0

  // Call static method
  double zakat1 = ZakatCalculator.calculateZakat(100000000.0);
                                        // => Call without instance
                                        // => zakat1: 2500000.0

  print('Calculated Zakat: Rp$zakat1');  // => Output: Calculated Zakat: Rp2500000.0

  // Static counter incremented
  print('Calculations: ${ZakatCalculator.calculationsPerformed}');
                                        // => Output: Calculations: 1

  // Create instance
  ZakatCalculator calc = ZakatCalculator('Ahmad', 150000000.0);
                                        // => Create instance
                                        // => Has own donorName and wealth

  // Call instance method
  double zakat2 = calc.getZakat();      // => Call instance method
                                        // => zakat2: 3750000.0

  print('${calc.donorName} Zakat: Rp$zakat2');
                                        // => Output: Ahmad Zakat: Rp3750000.0

  // Static counter updated again
  print('Calculations: ${ZakatCalculator.calculationsPerformed}');
                                        // => Output: Calculations: 2
                                        // => Static field shared across calls

  // Use factory method
  ZakatCalculator calc2 = ZakatCalculator.createForWealth('Fatimah', 200000000.0);
                                        // => Create via static factory
                                        // => Includes validation

  bool eligible = calc2.isEligible();   // => Check eligibility
                                        // => eligible: true (above nisab)

  print('${calc2.donorName} eligible: $eligible');
                                        // => Output: Fatimah eligible: true

  // Multiple instances share static members
  print('Final count: ${ZakatCalculator.calculationsPerformed}');
                                        // => Output: Final count: 2
                                        // => Static state persists
}
```

**Key Takeaway**: Static members accessed via `ClassName.member`. Static methods can't access instance fields. Static fields shared across all instances. Use static for utility methods and shared constants.

**Expected Output**:

```
Zakat rate: 2.5%
Nisab: Rp85000000.0
Calculated Zakat: Rp2500000.0
Calculations: 1
Ahmad Zakat: Rp3750000.0
Calculations: 2
Fatimah eligible: true
Final count: 2
```

**Why It Matters**: Static members enable utility functions and shared state without requiring object instantiation, patterns used throughout Flutter and Dart codebases. Singleton services, configuration constants, and stateless utility functions (currency formatters, Zakat rate lookups) benefit from static design. Static factory constructors with validation (`fromInput()` methods that return null on invalid data) prevent invalid objects from entering the system, a critical pattern for financial data integrity.

**Common Pitfalls**: Static methods can't access `this` (no instance). Static fields are class-level, not instance-level. Static factory methods common pattern for validation.

### Example 24: Command-Line Input/Output

Reading user input and writing formatted output to console.

```dart
import 'dart:io';                       // => Import for stdin/stdout

void main() {
  // Basic output
  print('Zakat Calculator');            // => Print with newline
                                        // => print() adds \n automatically
  stdout.write('Enter donor name: ');   // => Print without newline
                                        // => Prompts user for input
                                        // => stdout.write: no trailing newline

  // Read input (synchronous)
  String? donorName = stdin.readLineSync();
                                        // => Read line from console
                                        // => Returns String? (nullable)
                                        // => Waits for Enter key (blocking I/O)
                                        // => Strips trailing newline character

  if (donorName == null || donorName.isEmpty) {
                                        // => Validate input
                                        // => null: end of stream; isEmpty: empty line
    print('Error: Name required');      // => Output error message
    return;                             // => Exit program early
                                        // => return exits main() without further execution
  }

  print('Welcome, $donorName!');        // => Output: Welcome, [input]!

  // Read numeric input
  stdout.write('Enter wealth amount: ');  // => Prompt
  String? wealthInput = stdin.readLineSync();
                                        // => Read as string

  double? wealth = double.tryParse(wealthInput ?? '');
                                        // => Parse string to double
                                        // => tryParse: returns null if invalid (no exception)
                                        // => ?? '': handles null wealthInput

  if (wealth == null) {                 // => Check parse success
    print('Error: Invalid amount');     // => Handle error
    return;
  }

  // Calculate Zakat
  const double nisab = 85000000.0;      // => Threshold
  const double rate = 0.025;            // => Rate: 2.5%

  if (wealth < nisab) {                 // => Check eligibility
    print('Wealth below nisab. No Zakat due.');
    return;
  }

  double zakat = wealth * rate;         // => Calculate

  // Formatted output
  print('\n--- Zakat Calculation ---');  // => \n adds blank line
  print('Donor: $donorName');           // => Output donor name
  print('Wealth: Rp ${wealth.toStringAsFixed(2)}');
                                        // => Format with 2 decimals
  print('Zakat (2.5%): Rp ${zakat.toStringAsFixed(2)}');
  print('Remaining: Rp ${(wealth - zakat).toStringAsFixed(2)}');
  print('-' * 30);                      // => Print 30 dashes

  // Write to stderr (error stream)
  if (zakat > 10000000.0) {             // => Large amount
    stderr.writeln('Warning: Large Zakat amount');
                                        // => Write to error stream
                                        // => Separate from stdout
  }

  // Multiple choice input
  stdout.write('Pay now? (y/n): ');     // => Yes/no prompt
  String? choice = stdin.readLineSync()?.toLowerCase();
                                        // => Read and convert to lowercase
                                        // => ?. handles null case

  if (choice == 'y' || choice == 'yes') {  // => Check affirmative input
                                        // => Accepts both 'y' and 'yes' (already lowercased)
    print('Payment confirmed!');        // => Success message
  } else {
    print('Payment deferred.');         // => Alternative message for any other input
  }
}
```

**Key Takeaway**: Use `stdin.readLineSync()` to read console input (returns String?). `print()` adds newline, `stdout.write()` doesn't. Parse input with `int.tryParse()` or `double.tryParse()`. `stderr` for error messages.

**Expected Output** (example interaction):

```
Zakat Calculator
Enter donor name: Ahmad
Welcome, Ahmad!
Enter wealth amount: 100000000

--- Zakat Calculation ---
Donor: Ahmad
Wealth: Rp 100000000.00
Zakat (2.5%): Rp 2500000.00
Remaining: Rp 97500000.00
------------------------------
Pay now? (y/n): y
Payment confirmed!
```

**Why It Matters**: Command-line interfaces are the primary delivery mechanism for developer tools, automation scripts, and server utilities in Dart. CLI Zakat calculators, data migration scripts, and deployment tools all use stdin/stdout. Understanding blocking I/O helps developers distinguish when to use async alternatives. Input validation is security-critical—unvalidated CLI input can cause crashes or incorrect calculations in financial tools used by non-technical users.

**Common Pitfalls**: `readLineSync()` is blocking (waits for input). Always validate and parse user input. Input is always String - convert for numbers.

### Example 25: Comments and Documentation

Best practices for code comments and documentation.

````dart
/// Calculator for Islamic Zakat calculations.
///
/// Provides methods for calculating Zakat on wealth, agriculture,
/// and gold/silver according to Shariah principles.
///
/// Example:
/// ```dart
/// var calc = ZakatCalculator();
/// double zakat = calc.calculateWealthZakat(100000000.0);
/// ```
class ZakatCalculator {                 // => Doc comment with triple slash
                                        // => Appears in IDE tooltips and docs

  /// The standard Zakat rate for wealth (2.5%).
  static const double wealthRate = 0.025;  // => Doc comment for constant

  /// The nisab threshold (85 grams gold equivalent).
  ///
  /// Wealth below this amount is exempt from Zakat.
  static const double nisabThreshold = 85000000.0;

  // Private field for tracking calculations
  // This is not exported in documentation
  int _calculationCount = 0;            // => Regular comment (single slash)
                                        // => For implementation details
                                        // => _ prefix: not exported in documentation

  /// Calculates Zakat on wealth at 2.5% rate.
  ///
  /// Parameters:
  ///   - `wealth`: The total zakatable wealth in Rupiah
  ///
  /// Returns the calculated Zakat amount.
  ///
  /// Throws [ArgumentError] if wealth is negative.
  double calculateWealthZakat(double wealth) {
                                        // => Doc comment describes behavior
                                        // => Documents parameters, return, exceptions
    // Validate input
    if (wealth < 0) {                   // => Implementation comment: explains why
                                        // => wealth < 0 is business rule violation
      throw ArgumentError('Wealth must be positive');
                                        // => ArgumentError: standard Dart validation exception
    }

    // Check nisab eligibility
    if (wealth < nisabThreshold) {      // => Explain business logic
                                        // => nisabThreshold: 85000000.0 (class constant)
      return 0.0;                       // => Below threshold: no Zakat due
    }

    _calculationCount++;                // => Track usage (internal)
                                        // => Increment private counter

    // Calculate at standard rate
    return wealth * wealthRate;         // => Apply 2.5% rate
                                        // => wealthRate: 0.025 (class constant)
  }                                     // => Return calculated amount

  /// Calculates Zakat on agricultural produce.
  ///
  /// Rate depends on irrigation method:
  ///   - 10% for rain-watered crops
  ///   - 5% for irrigated crops
  ///
  /// Parameters:
  ///   - `harvest`: Value of harvest in Rupiah
  ///   - `rainWatered`: Whether crop is rain-watered
  ///
  /// Returns the calculated Zakat amount.
  double calculateAgricultureZakat(double harvest, {bool rainWatered = true}) {
    if (harvest < 0) {                  // => Validation
      throw ArgumentError('Harvest value must be positive');
    }

    /* Multi-line comment for complex logic:
     * Rain-watered: 10% (natural irrigation)
     * Irrigated: 5% (requires investment)
     * Default assumes rain-watered
     */
    double rate = rainWatered ? 0.10 : 0.05;
                                        // => Select rate based on irrigation method
                                        // => rainWatered=true: 10%, false: 5%

    _calculationCount++;                // => Track calculation

    return harvest * rate;              // => Calculate and return
  }

  // TODO: Add gold/silver Zakat calculation
  // FIXME: Handle currency conversion for international donors
  // NOTE: Consider adding support for trade goods Zakat

  /// Returns the number of calculations performed.
  int get calculationCount => _calculationCount;
                                        // => Getter for internal counter
}

void main() {
  // Create calculator instance
  var calc = ZakatCalculator();         // => Standard comment style
                                        // => calc: instance of ZakatCalculator

  // Calculate wealth Zakat for different amounts
  double zakat1 = calc.calculateWealthZakat(100000000.0);
                                        // => 100M wealth
                                        // => zakat1: 2500000.0

  print('Wealth Zakat: Rp$zakat1');     // => Output result

  // Calculate agriculture Zakat
  double zakat2 = calc.calculateAgricultureZakat(
    50000000.0,                         // => Harvest value
    rainWatered: true,                  // => Rain-watered (10%)
  );                                    // => zakat2: 5000000.0

  print('Agriculture Zakat: Rp$zakat2');  // => Output result

  /*
   * Multi-line comment for complex logic:
   * We track total calculations to monitor
   * system usage and generate statistics.
   */
  print('Total calculations: ${calc.calculationCount}');
                                        // => Output: 2
}
````

**Key Takeaway**: Use `///` for documentation comments (appear in IDE/docs). Single `//` for implementation comments. Multi-line `/* */` for complex explanations. Document public API with parameters, returns, exceptions. Use TODO/FIXME/NOTE markers.

**Expected Output**:

```
Wealth Zakat: Rp2500000.0
Agriculture Zakat: Rp5000000.0
Total calculations: 2
```

**Why It Matters**: Documentation is a first-class requirement for maintainable production codebases and public packages. Well-documented APIs enable faster onboarding for new team members and reduce support burden for open-source Dart packages. `dart doc` generates HTML documentation from doc comments, enabling professional API references for Islamic finance libraries. In regulated environments (banking, compliance), code documentation supports audit requirements by explaining the rationale behind financial calculation implementations.

**Common Pitfalls**: Over-commenting obvious code. Missing documentation for public API. Outdated comments after code changes. Use doc comments for public members only.

## Summary

You've completed 25 beginner examples covering **32.5% of Dart fundamentals**:

**Core Language** (Examples 1-10):

- Variables, types, null safety
- Strings, operators, control flow
- Loops (for, while, do-while)
- Switch statements
- Collections (List, Map)

**Functions and Classes** (Examples 11-20):

- Functions (parameters, arrow functions, first-class)
- Classes (constructors, methods, getters/setters)
- Named constructors, factory patterns
- Enums, Sets
- Exception handling
- String manipulation, type conversion

**Advanced Basics** (Examples 21-25):

- Collection methods (map, where, fold)
- DateTime operations
- Static members
- Console I/O
- Documentation practices

**Next Steps**:

- **Intermediate** (Examples 26-50): Async programming, advanced OOP, generics, file I/O, JSON, streams
- **Advanced** (Examples 51-75): Isolates, advanced async, design patterns, testing, performance optimization

All examples maintain 1-2.25 annotation density with Islamic finance contexts (Zakat, donations, Murabaha).
