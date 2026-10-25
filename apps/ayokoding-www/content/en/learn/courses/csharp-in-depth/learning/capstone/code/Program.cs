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
