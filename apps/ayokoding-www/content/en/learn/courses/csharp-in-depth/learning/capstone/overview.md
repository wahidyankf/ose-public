---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

The capstone ships a small, idiomatic C# command-line tool: a receipt ledger that reads an order file, prices each line from a fixed menu, prints the receipt, and closes with a golden total. It exercises the course's core habits together: the Try-pattern for parsing, throwing for contract violations, a hand-rolled check suite in the testing-convention shape, and a golden transcript the harness pins byte for byte.

## What you will build

A receipt ledger with two entry points in one binary. The main run reads `input.txt`, prints one receipt line per order line, and closes with `total: 64000`. The self-test run executes four checks covering parsing, rejection, failure paths, and the golden total, closing with `passed: 4`. Both transcripts are recorded under `expected/` and enforced by the harness on every run.

## Architecture

Two files share one project. `Ledger.cs` holds the pure library: no console calls, no file reads, only parsing, pricing, and totaling functions that checks can call directly. `Program.cs` holds the impure edge: argument handling, file reading, receipt printing, and the self-test suite. The split follows the boundary rule from Example 16: the library throws honestly, and exactly one edge translates outcomes into words.

## Files

**`learning/capstone/code/input.txt`** (the golden order the main run prices):

```text
rice x2
rendang x1
sambal x3
```

**`learning/capstone/code/Ledger.cs`**:

```csharp
// => Ledger.cs: the receipt library for the capstone. Pure functions, no I/O.
// => one static type: parse lines, price dishes, total orders, all testable
static class Ledger // => static: every member is a pure function of its inputs
{
    // => the fixed menu: the prices every receipt in this capstone promises
    private static readonly Dictionary<string, int> Prices = new() // => readonly: set once, read forever
    {
        ["rice"] = 12000, // => the price the main run multiplies for rice x2
        ["rendang"] = 25000, // => the price the main run multiplies for rendang x1
        ["sambal"] = 5000, // => the price the main run multiplies for sambal x3
    };

    // => TryParseLine answers false for malformed lines instead of throwing
    public static bool TryParseLine(string line, out string dish, out int qty) // => Try-pattern from Example 10
    {
        dish = ""; // => default out: a failed parse leaves nothing behind
        qty = 0; // => default out: zero quantity on every failure path
        // => Split on spaces, drop empties: "rice x2" becomes [rice, x2]
        string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries); // => exactly two parts expected
        // => shape check first: wrong part count fails before any lookup runs
        if (parts.Length != 2 || !parts[1].StartsWith('x')) // => guard: dish plus x-quantity
        {
            return false; // => malformed line: the caller reports it, not us
        }
        // => quantity must parse and stay positive: x0 and x-1 both fail here
        if (!int.TryParse(parts[1][1..], out qty) || qty <= 0) // => range slices past the x
        {
            qty = 0; // => reset: a half-parsed quantity must not leak out
            return false; // => bad quantity: same honest false as a bad shape
        }
        dish = parts[0]; // => the dish name travels out only on success
        return true; // => parsed: dish plus positive quantity, ready to price
    }

    // => Price throws for unknown dishes: the menu above is the whole contract
    public static int Price(string dish) // => dish in, price out, or throw
    {
        // => TryGetValue keeps the lookup total: no exception for the happy path
        if (Prices.TryGetValue(dish, out int price)) // => the idiom Example 5 teaches
        {
            return price; // => known dish: the promised price answers
        }
        throw new InvalidOperationException($"unknown dish: {dish}"); // => unknown: loud, at the edge
    }

    // => ReceiptLine prices one parsed line: dish, quantity, and line total
    public static string ReceiptLine(string dish, int qty) =>
        $"{dish} x{qty} = {Price(dish) * qty}"; // => one line, one answer

    // => Total sums priced lines: the number the golden transcript closes with
    public static int Total(IEnumerable<(string Dish, int Qty)> lines) =>
        lines.Sum(l => Price(l.Dish) * l.Qty); // => LINQ over the parsed order
}
```

**`learning/capstone/code/Program.cs`**:

```csharp
// => Program.cs: the capstone entry point. Reads orders, prints the receipt.
// => no top-level awaits here: the whole capstone runs synchronously and exact
if (args.Length == 1 && args[0] == "--self-test") // => the test run asks for checks, not receipts
{
    SelfTest(); // => run the checks below and exit through the summary line
    return; // => self-test never reads any input file
}

// => the main run needs exactly one argument: the order file beside the binary
if (args.Length != 1) // => guard: usage teaches the contract, like Example 75
{
    Console.WriteLine("usage: app <orders-file>"); // => the self-teaching line
    return; // => usage is not a failure: exit zero with guidance
}

// => read every line, parse with the Try-pattern, price, and print the receipt
int grand = 0; // => accumulates the priced lines below for the closing total
foreach (string line in File.ReadAllLines(args[0])) // => the golden input.txt drives this loop
{
    // => malformed lines fail loudly at the edge: the transcript never guesses
    if (!Ledger.TryParseLine(line, out string dish, out int qty)) // => Try-pattern: false means bad line
    {
        throw new InvalidOperationException($"bad line: {line}"); // => edge throw: visible, exact
    }
    Console.WriteLine(Ledger.ReceiptLine(dish, qty)); // => one receipt line per order line
    grand += Ledger.Price(dish) * qty; // => accumulate the same prices printed above
}
Console.WriteLine($"total: {grand}"); // => the golden closing line the transcript pins

// => SelfTest runs the capstone checks: parse, price, total, and failure paths
void SelfTest() // => local function: the whole check suite in one place
{
    int passed = 0; // => counts the green checks the summary line reports
    // => Check is the suite helper: PASS prints, FAIL throws, like Example 35
    void Check(bool condition, string name) // => nested helper: promise plus name
    {
        // => false throws: the first red stops the suite with its name attached
        if (!condition) // => the promise under check decides here
        {
            throw new Exception($"FAIL: {name}"); // => FAIL names the broken promise
        }
        Console.WriteLine($"PASS: {name}"); // => green: one promise held
        passed++; // => count it for the summary line below
    }
    // => parse the golden first line: dish plus quantity travel out together
    Check(
        Ledger.TryParseLine("rice x2", out string d, out int q) && d == "rice" && q == 2,
        "parses rice x2"
    ); // => Output: PASS
    // => malformed lines answer false: the suite pins the honest refusal
    Check(!Ledger.TryParseLine("rice", out _, out _), "rejects missing quantity"); // => Output: PASS
    // => unknown dishes throw at pricing: the menu is the whole contract
    try // => the throw below is the promise: catch proves it fires
    {
        Ledger.Price("sushi"); // => must throw: sushi is not on the menu
        Check(false, "unknown dish throws"); // => silence would break the promise
    }
    catch (InvalidOperationException) // => the exact type the contract promises
    {
        Check(true, "unknown dish throws"); // => Output: PASS
    }
    // => total the golden three lines: 24000 plus 25000 plus 15000 is 64000
    var lines = new (string Dish, int Qty)[] { ("rice", 2), ("rendang", 1), ("sambal", 3) }; // => the golden order as data
    Check(Ledger.Total(lines) == 64000, "golden total is 64000"); // => Output: PASS
    Console.WriteLine($"passed: {passed}"); // => Output: passed: 4
}
```

## Golden transcript

**Output** (`learning/capstone/code/expected/test/test.stdout.txt`):

```text
PASS: parses rice x2
PASS: rejects missing quantity
PASS: unknown dish throws
PASS: golden total is 64000
passed: 4
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
rice x2 = 24000
rendang x1 = 25000
sambal x3 = 15000
total: 64000
```

## Testing

The self-test run follows the testing-convention cluster from Examples 35 through 44: arrange the inputs, act through the library, assert with named checks, and close with a green count. The four checks pin parsing success, parsing refusal, the pricing failure path, and the golden total, which together cover every public member of `Ledger` plus the suite helper itself. The standard `dotnet test` command would need test packages this offline course never fetches, so the suite ships as runnable console checks in the exact arrange-act-assert shape instead.

## Extensions

Three directions grow this capstone without changing its contract. First, add a discount rule: a `promo` line in the input applies ten percent off rendang, with one new check pinning the discounted total. Second, accept a `--format json` flag that prints the receipt as a JSON array, following the args contract from Example 70 and the serialization shape from Example 22. Third, split `Ledger` into one file per member following the layout rule from Example 27, proving the project still builds and both transcripts stay byte-identical.
